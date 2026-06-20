import asyncio
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any
from utils.supabase_client import supabase
from scraping.sources import ALL_SCRAPERS
from scraping.parser import HeuristicParser
from models.grant import ScrapedGrant
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger("scraper_manager")

class ScrapeManager:
    @staticmethod
    def serialize_grant(grant: ScrapedGrant) -> Dict[str, Any]:
        """Converts a ScrapedGrant Pydantic model to a database-friendly dictionary."""
        d = grant.model_dump()
        # Serialize datetime to ISO format string for PostgreSQL timestamptz compatibility
        if d.get("deadline"):
            if isinstance(d["deadline"], datetime):
                d["deadline"] = d["deadline"].isoformat()
        return d

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=2, min=2, max=10),
        reraise=True
    )
    def _upsert_to_supabase(self, db_records: List[Dict[str, Any]]) -> Any:
        """Upserts grant records to Supabase with exponential backoff retry."""
        logger.info(f"Attempting to upsert {len(db_records)} grants to database...")
        try:
            return supabase.table("grants").upsert(
                db_records,
                on_conflict="funder,title,deadline"
            ).execute()
        except Exception as e:
            logger.error(f"Supabase upsert attempt failed. Grant details for upsert batch: {db_records}")
            raise e

    async def run(self) -> Dict[str, Any]:
        """Runs all scrapers, enriches the data, and upserts it into Supabase."""
        logger.info("Starting web scraping pipeline run...")
        start_time = datetime.now(timezone.utc)
        
        # 1. Run all scrapers concurrently
        scraper_instances = [scraper_cls() for scraper_cls in ALL_SCRAPERS]
        tasks = [scraper.scrape() for scraper in scraper_instances]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        all_grants: List[ScrapedGrant] = []
        failed_scrapers_count = 0
        
        for i, res in enumerate(results):
            scraper_name = scraper_instances[i].funder_name
            if isinstance(res, Exception):
                logger.error(f"Scraper '{scraper_name}' FAILED with error: {str(res)}")
                failed_scrapers_count += 1
                continue
            
            logger.info(f"Scraper '{scraper_name}' successfully retrieved {len(res)} grants.")
            all_grants.extend(res)
            
        # If all scrapers failed, abort run immediately to protect database integrity
        if failed_scrapers_count == len(scraper_instances) or not all_grants:
            logger.critical("CRITICAL: All scrapers failed to execute! Aborting run to protect existing database records.")
            return {
                "status": "failed",
                "error": "All scrapers failed",
                "scraped_count": 0,
                "upserted_count": 0,
                "soft_deleted_count": 0,
                "timestamp": start_time.isoformat()
            }
            
        logger.info(f"Retrieved {len(all_grants)} total grants. Running heuristic parsing...")

        # 2. Enrich all grants using the HeuristicParser
        enriched_grants = [HeuristicParser.enrich_grant(g) for g in all_grants]
        
        # 3. Upsert to Supabase
        db_records = [self.serialize_grant(g) for g in enriched_grants]
        
        upserted_count = 0
        if db_records:
            try:
                response = self._upsert_to_supabase(db_records)
                upserted_count = len(response.data) if response.data else len(db_records)
                logger.info(f"Successfully upserted {upserted_count} grants to database.")
            except Exception as e:
                logger.error(f"Failed to upsert grants to database after retries: {str(e)}")
                raise e
        
        # 4. Perform Soft Deletes for stale grants
        # Define 'stale' as any grant where is_active = true but the deadline is now in the past
        soft_deleted_count = 0
        try:
            now_iso = datetime.now(timezone.utc).isoformat()
            # Fetch active grants with past deadlines
            past_grants_response = supabase.table("grants")\
                .select("id")\
                .eq("is_active", True)\
                .lt("deadline", now_iso)\
                .execute()
                
            if past_grants_response.data:
                past_grant_ids = [item["id"] for item in past_grants_response.data]
                # Mark them as inactive
                update_response = supabase.table("grants")\
                    .update({"is_active": False})\
                    .in_("id", past_grant_ids)\
                    .execute()
                soft_deleted_count = len(update_response.data) if update_response.data else len(past_grant_ids)
                logger.info(f"Soft-deleted {soft_deleted_count} stale grants (passed deadlines).")
        except Exception as e:
            logger.error(f"Error performing soft-deletes: {str(e)}")
            # Do not throw to let the run report success for upserts
            
        return {
            "status": "success",
            "scraped_count": len(all_grants),
            "upserted_count": upserted_count,
            "soft_deleted_count": soft_deleted_count,
            "timestamp": start_time.isoformat()
        }
