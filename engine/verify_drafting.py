import os
import asyncio
import sys
import uuid
import logging
from utils.supabase_client import supabase
from drafting.v8_engine import DraftingEngine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("verify_drafting")

async def test_drafting_pipeline():
    logger.info("Starting Seedling Draft Generation Engine Integration Test...")
    
    # 1. Fetch an existing grant to use as a test subject
    logger.info("Fetching a test grant from Supabase...")
    grants_res = supabase.table("grants").select("id, title").limit(1).execute()
    if not grants_res.data:
        logger.error("No grants found in the grants table. Please seed or scrape grants first.")
        sys.exit(1)
        
    test_grant = grants_res.data[0]
    grant_id = test_grant["id"]
    grant_title = test_grant["title"]
    logger.info(f"Using test grant: '{grant_title}' ({grant_id})")

    # Generate test IDs
    org_id = str(uuid.uuid4())
    proj1_id = str(uuid.uuid4())
    proj2_id = str(uuid.uuid4())
    app_id = str(uuid.uuid4())

    try:
        # 2. Insert Mock Onboarding Data
        logger.info("Inserting temporary test organization...")
        supabase.table("organizations").insert({
            "id": org_id,
            "name": "Green Earth India Foundation",
            "type": "NGO",
            "legal_entity_type": "Trust",
            "location": "Mumbai, Maharashtra",
            "mission_statement": "To restore and preserve forest ecosystems, promote sustainable agriculture, and educate local communities on environment conservation.",
            "schedule_vii_causes": ["Environmental Sustainability", "Conservation of Natural Resources"],
            "geography_of_impact": "Maharashtra",
            "target_beneficiaries": "Rural Farmers and Tribal Communities",
            "has_12a_80g": True,
            "has_fcra": False,
            "ngo_darpan_id": "MH/2026/012345",
            "csr_1_registration": "CSR00012345",
            "annual_turnover_range": "50L-1Cr",
            "team_size": 15
        }).execute()

        logger.info("Inserting temporary test project history (Memory Vault)...")
        supabase.table("projects").insert([
            {
                "id": proj1_id,
                "org_id": org_id,
                "name": "Western Ghats Afforestation Initiative",
                "geography": "Western Ghats, Maharashtra",
                "beneficiaries_count": 2500,
                "beneficiary_type": "Local villagers and farmers",
                "activities": "Planted over 10,000 indigenous tree saplings, constructed check dams to arrest soil erosion, and trained farmers in multi-cropping.",
                "outcomes": "Improved groundwater levels by 15% in 3 villages, created seasonal employment for 120 families, and achieved 85% sapling survival rate.",
                "sdg_alignment": ["SDG 15 - Life on Land", "SDG 13 - Climate Action"],
                "budget_used": 750000,
                "end_date": "2025-12-31"
            },
            {
                "id": proj2_id,
                "org_id": org_id,
                "name": "Community Organic Farming Outreach",
                "geography": "Pune District, Maharashtra",
                "beneficiaries_count": 800,
                "beneficiary_type": "Smallholder farmers",
                "activities": "Conducted 12 organic composting workshops, distributed vermicompost kits, and facilitated soil health testing.",
                "outcomes": "Restored 150 acres of chemical-damaged farmland, increased average organic farm yield by 10%, and certified 50 farmers.",
                "sdg_alignment": ["SDG 12 - Responsible Consumption", "SDG 2 - Zero Hunger"],
                "budget_used": 350000,
                "end_date": "2026-03-31"
            }
        ]).execute()

        logger.info("Inserting temporary test application record...")
        supabase.table("applications").insert({
            "id": app_id,
            "org_id": org_id,
            "grant_id": grant_id,
            "status": "DRAFT",
            "draft_content": ""
        }).execute()

        logger.info("Setup complete. Database test state initialized.")

        # 3. Execute Drafting Engine
        engine = DraftingEngine()
        
        # Test Call 1 (Should be a Cache Miss and make an LLM call)
        logger.info("\n--- TEST RUN 1: Cache Miss ---")
        result1 = engine.generate_draft(org_id, grant_id, app_id)
        
        logger.info("\n=== TEST RUN 1 RESULTS ===")
        logger.info(f"Cache Hit:     {result1.get('cache_hit')}")
        logger.info(f"Provider Used: {result1.get('provider_used')}")
        logger.info(f"Fallback Used: {result1.get('fallback_used')}")
        logger.info(f"Partial Draft: {result1.get('partial_draft')}")
        logger.info("Generated Sections Summary:")
        for sec_name, content in result1.get("sections", {}).items():
            words_sec = len(content.split())
            logger.info(f" - {sec_name}: {words_sec} words")
            
        # Test Call 2 (Should be a Cache Hit and resolve instantly)
        logger.info("\n--- TEST RUN 2: Cache Hit ---")
        result2 = engine.generate_draft(org_id, grant_id, app_id)
        
        logger.info("\n=== TEST RUN 2 RESULTS ===")
        logger.info(f"Cache Hit:     {result2.get('cache_hit')}")
        logger.info(f"Provider Used: {result2.get('provider_used')}")
        
        # 4. Verify Supabase DB Persistence
        logger.info("\nVerifying draft persistence in Supabase...")
        db_verify = supabase.table("applications").select("draft_content").eq("id", app_id).execute()
        if db_verify.data and db_verify.data[0].get("draft_content"):
            logger.info(" SUCCESS: Generated draft persisted to public.applications.draft_content!")
        else:
            logger.error(" FAILURE: Draft content not found or empty in applications table.")

    except Exception as e:
        logger.error(f"Test failed with error: {e}")
        
    finally:
        # 5. Clean Up Mock Data (Order matters for foreign keys)
        logger.info("\nCleaning up temporary test database records...")
        try:
            supabase.table("applications").delete().eq("id", app_id).execute()
            logger.info(" - Deleted test application.")
            
            supabase.table("projects").delete().eq("org_id", org_id).execute()
            logger.info(" - Deleted test projects.")
            
            supabase.table("organizations").delete().eq("id", org_id).execute()
            logger.info(" - Deleted test organization.")
            
            # Clean up local FAISS index files
            persist_path = os.path.join("faiss_store", org_id)
            if os.path.exists(persist_path):
                import shutil
                shutil.rmtree(persist_path)
                logger.info(" - Cleaned up local FAISS index files.")
                
            logger.info("Database cleanup completed successfully.")
        except Exception as clean_err:
            logger.error(f"Error during cleanup: {clean_err}")

if __name__ == "__main__":
    asyncio.run(test_drafting_pipeline())
