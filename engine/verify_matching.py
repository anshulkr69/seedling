import asyncio
import sys
import logging
from matching.engine import MatchingEngine
from utils.supabase_client import supabase

# Configure logging to standard output
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

async def test_matching():
    print("Running Seedling Matching Engine Test...\n")
    engine = MatchingEngine()
    
    try:
        # Fetch organizations from database to find a test subject
        print("Fetching organizations from database...")
        orgs_response = supabase.table("organizations").select("id, name").execute()
        orgs = orgs_response.data or []
        
        if not orgs:
            print("WARNING: No organizations found in the database.")
            print("Cannot run single-organization matching test. Please seed or onboard an organization first.")
        else:
            test_org = orgs[0]
            org_id = test_org["id"]
            org_name = test_org.get("name", "Test Org")
            print(f"Found test organization: '{org_name}' ({org_id})")
            print(f"Running matching for '{org_name}'...")
            
            result = engine.match_org(org_id)
            print("\nSingle Organization Matching Completed!")
            print("---------------------------------------")
            print(f"Matched Count:       {result.get('matched', 0)}")
            print(f"Excluded Count (P1): {result.get('excluded_pass1', 0)}")
            print(f"Total Active Grants: {result.get('total_active_grants', 0)}")
            print("---------------------------------------")
            
        print("\nRunning batch matching for all organizations...")
        batch_result = engine.match_all()
        print("\nBatch Matching Completed!")
        print("---------------------------------------")
        print(f"Total Organizations: {batch_result.get('total_organizations', 0)}")
        print(f"Successful Runs:     {batch_result.get('successful_runs', 0)}")
        print(f"Failed Runs:         {batch_result.get('failed_runs', 0)}")
        print("---------------------------------------")
        
    except Exception as e:
        print(f"\nMatching Test Failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_matching())
