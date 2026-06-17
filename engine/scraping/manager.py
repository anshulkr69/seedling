import asyncio
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any
from utils.supabase_client import supabase
from scraping.sources import ALL_SCRAPERS
from scraping.parser import HeuristicParser
from models.grant import ScrapedGrant

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

    async def run(self) -> Dict[str, Any]:
        """Runs all scrapers, enriches the data, and upserts it into Supabase."""
        logger.info("Starting web scraping pipeline run...")
        start_time = datetime.now(timezone.utc)
        
        # 1. Run all scrapers concurrently
        scraper_instances = [scraper_cls() for scraper_cls in ALL_SCRAPERS]
        tasks = [scraper.scrape() for scraper in scraper_instances]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        all_grants: List[ScrapedGrant] = []
        for i, res in enumerate(results):
            scraper_name = scraper_instances[i].funder_name
            if isinstance(res, Exception):
                logger.error(f"Scraper '{scraper_name}' failed with error: {str(res)}")
                continue
            
            logger.info(f"Scraper '{scraper_name}' successfully retrieved {len(res)} grants.")
            all_grants.extend(res)
            
        logger.info(f"Retrieved {len(all_grants)} total grants. Running heuristic parsing...")

        # 2. Enrich all grants using the HeuristicParser
        enriched_grants = [HeuristicParser.enrich_grant(g) for g in all_grants]
        
        # 3. Upsert to Supabase
        db_records = [self.serialize_grant(g) for g in enriched_grants]
        
        upserted_count = 0
        if db_records:
            try:
                # Supabase Python client upsert on UNIQUE constraint funder, title, deadline
                response = supabase.table("grants").upsert(
                    db_records,
                    on_conflict="funder,title,deadline"
                ).execute()
                upserted_count = len(response.data) if response.data else len(db_records)
                logger.info(f"Successfully upserted {upserted_count} grants to database.")
            except Exception as e:
                logger.error(f"Failed to upsert grants to database: {str(e)}")
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
