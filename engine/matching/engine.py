import logging
from typing import Dict, Any, List
from utils.supabase_client import supabase
from matching.pass1_filter import evaluate_pass1
from matching.pass2_scorer import calculate_pass2_score

logger = logging.getLogger("matching_engine")

class MatchingEngine:
    """
    Orchestrates the two-pass matching engine.
    Fetches profiles and active grants, evaluates statutory rules, calculates
    composite score, and writes the results to the database.
    """
    
    @staticmethod
    def get_active_grants() -> List[Dict[str, Any]]:
        """
        Fetches all active grants from the database.
        """
        try:
            response = supabase.table("grants").select("*").eq("is_active", True).execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error fetching active grants: {e}")
            raise

    @staticmethod
    def get_existing_matches(org_id: str) -> Dict[str, bool]:
        """
        Fetches existing matches for the org to preserve their dismissal status.
        Returns a dictionary mapping grant_id to is_dismissed status.
        """
        try:
            response = (
                supabase.table("grant_matches")
                .select("grant_id, is_dismissed")
                .eq("org_id", org_id)
                .execute()
            )
            return {
                row["grant_id"]: bool(row.get("is_dismissed", False))
                for row in (response.data or [])
            }
        except Exception as e:
            logger.warning(f"Error fetching existing matches for org {org_id}: {e}")
            return {}

    def match_org(self, org_id: str) -> Dict[str, int]:
        """
        Runs the two-pass matching engine for a single organization.
        """
        logger.info(f"Starting matching process for organization: {org_id}")
        
        # 1. Fetch organization profile
        try:
            org_response = supabase.table("organizations").select("*").eq("id", org_id).execute()
            if not org_response.data:
                logger.error(f"Organization {org_id} not found.")
                return {"matched": 0, "excluded_pass1": 0, "total_active_grants": 0, "error": "Org not found"}
            org = org_response.data[0]
        except Exception as e:
            logger.error(f"Error fetching organization profile: {e}")
            raise

        # 2. Fetch all active grants
        active_grants = self.get_active_grants()
        total_active_grants = len(active_grants)
        
        if total_active_grants == 0:
            logger.info("No active grants found to match.")
            return {"matched": 0, "excluded_pass1": 0, "total_active_grants": 0}

        # 3. Fetch existing matches to preserve is_dismissed
        existing_matches = self.get_existing_matches(org_id)

        # 4. Filter and Score
        matched_records = []
        excluded_count = 0

        for grant in active_grants:
            # Pass 1: Statutory Hard Filters
            if not evaluate_pass1(org, grant):
                excluded_count += 1
                continue
            
            # Pass 2: AI Fit Score
            score, reasons = calculate_pass2_score(org, grant)
            
            # Noise filter: score must be >= 30
            if score >= 30:
                grant_id = grant["id"]
                # Preserve existing dismissal status if present
                is_dismissed = existing_matches.get(grant_id, False)
                
                matched_records.append({
                    "org_id": org_id,
                    "grant_id": grant_id,
                    "fit_score": score,
                    "match_reasons": reasons,
                    "is_dismissed": is_dismissed
                })

        # 5. Write to grant_matches table
        if matched_records:
            try:
                # Upsert matches using the UNIQUE(org_id, grant_id) constraint
                supabase.table("grant_matches").upsert(matched_records, on_conflict="org_id,grant_id").execute()
                logger.info(f"Successfully upserted {len(matched_records)} matches for organization {org_id}")
            except Exception as e:
                logger.error(f"Error upserting matches to database: {e}")
                raise
        else:
            logger.info(f"No grants scored >= 30 for organization {org_id}")

        return {
            "matched": len(matched_records),
            "excluded_pass1": excluded_count,
            "total_active_grants": total_active_grants
        }

    def match_all(self) -> Dict[str, Any]:
        """
        Runs matching engine for all active organizations in the database.
        Typically triggered by a daily batch re-match cron.
        """
        logger.info("Starting daily batch re-match for all organizations...")
        try:
            orgs_response = supabase.table("organizations").select("id, name").execute()
            orgs = orgs_response.data or []
        except Exception as e:
            logger.error(f"Error fetching organizations: {e}")
            raise

        total_orgs = len(orgs)
        logger.info(f"Found {total_orgs} organizations to match.")
        
        results = {}
        successful_runs = 0
        failed_runs = 0

        for org in orgs:
            org_id = org["id"]
            org_name = org.get("name", "Unknown NGO")
            try:
                run_res = self.match_org(org_id)
                results[org_id] = {
                    "name": org_name,
                    "status": "success",
                    **run_res
                }
                successful_runs += 1
            except Exception as e:
                logger.error(f"Failed matching for org {org_name} ({org_id}): {e}")
                results[org_id] = {
                    "name": org_name,
                    "status": "failed",
                    "error": str(e)
                }
                failed_runs += 1

        return {
            "total_organizations": total_orgs,
            "successful_runs": successful_runs,
            "failed_runs": failed_runs,
            "details": results
        }
