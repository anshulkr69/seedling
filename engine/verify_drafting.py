import asyncio
import sys
import logging
import json
from drafting.v8_engine import DraftingEngine
from utils.supabase_client import supabase

# Configure logging to standard output
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

async def test_drafting():
    print("Running Seedling Proposal Drafting Engine Test...\n")
    engine = DraftingEngine()
    
    try:
        # Fetch organizations from database to find a test subject
        print("Fetching organizations from database...")
        orgs_response = supabase.table("organizations").select("id, name").execute()
        orgs = orgs_response.data or []
        
        if not orgs:
            print("WARNING: No organizations found in the database. Please seed or onboard an organization first.")
            return
            
        test_org = orgs[0]
        org_id = test_org["id"]
        org_name = test_org.get("name", "Test Org")
        print(f"Found test organization: '{org_name}' ({org_id})")
        
        # Fetch a grant match for this org
        print(f"Fetching matches for organization '{org_name}'...")
        matches_response = supabase.table("grant_matches").select("grant_id").eq("org_id", org_id).execute()
        matches = matches_response.data or []
        
        if not matches:
            print("WARNING: No grant matches found for this organization. Running matching engine first...")
            from matching.engine import MatchingEngine
            matcher = MatchingEngine()
            matcher.match_org(org_id)
            # Re-fetch
            matches_response = supabase.table("grant_matches").select("grant_id").eq("org_id", org_id).execute()
            matches = matches_response.data or []
            
        if not matches:
            print("ERROR: Still no grant matches found. Ensure active grants exist in your 'grants' table.")
            return
            
        test_grant_id = matches[0]["grant_id"]
        print(f"Found matched grant ID: {test_grant_id}")
        
        # Generate application UUID mock
        import uuid
        app_id = str(uuid.uuid4())
        
        print("\nTriggering Draft Proposal Generation...")
        print("---------------------------------------")
        
        # Run generation synchronous wrapper (DraftingEngine.generate_draft is sync, internally running sync LLM calls)
        result = engine.generate_draft(org_id, test_grant_id, app_id)
        
        print("\nDraft Generation Completed Successfully!")
        print("---------------------------------------")
        print(f"Provider Used: {result.get('provider_used')}")
        print(f"Fallback Used: {result.get('fallback_used')}")
        print(f"Is Partial Draft: {result.get('partial_draft')}")
        print("---------------------------------------")
        print("\n--- SAMPLE DRAFT PREVIEW (First 500 chars) ---")
        preview = result.get("draft", "")[:500]
        print(preview + "..." if len(preview) > 500 else preview)
        print("---------------------------------------")
        
    except Exception as e:
        print(f"\nDrafting Test Failed: {str(e)}")
        print("Tip: Ensure you have GROQ_API_KEY or GOOGLE_AI_STUDIO_API_KEY set up in your env/environment variables.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_drafting())
