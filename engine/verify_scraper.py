import asyncio
import sys
import logging
from scrapers.runner import ScrapeRunner

# Configure logging to standard output
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

async def test_scraper():
    print("Running Seedling Web Ingestion & Scraping Pipeline Test...\n")
    try:
        manager = ScrapeRunner()
        result = await manager.run()
        print("\nScraping Completed Successfully!")
        print("---------------------------------------")
        print(f"Status:             {result['status']}")
        print(f"Scraped Count:      {result['scraped_count']}")
        print(f"Upserted Count:     {result['upserted_count']}")
        print(f"Soft-deleted Count: {result['soft_deleted_count']}")
        print(f"Execution Time:     {result['timestamp']}")
        print("---------------------------------------")
    except Exception as e:
        print(f"\nScraping Failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_scraper())

