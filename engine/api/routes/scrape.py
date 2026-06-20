from fastapi import APIRouter, BackgroundTasks, Depends, status
from scrapers.runner import ScrapeRunner
from utils.security import verify_internal_key
import logging

logger = logging.getLogger("scrape_route")
router = APIRouter()

async def run_scraper_background():
    """Background task runner to execute the scraping runner."""
    try:
        runner = ScrapeRunner()
        result = await runner.run()
        logger.info(f"Background scraping completed successfully: {result}")
    except Exception as e:
        logger.error(f"Background scraping failed: {str(e)}")

@router.post("/trigger", status_code=status.HTTP_202_ACCEPTED)
async def trigger_scrape(
    background_tasks: BackgroundTasks,
    internal_key: str = Depends(verify_internal_key)
):
    """
    Triggers the scraping pipeline in a non-blocking background task.
    Requires an X-Internal-Key header that matches the GITHUB_ACTIONS_WEBHOOK_SECRET env variable.
    """
    logger.info("Scrape trigger authorized. Queuing scraping task in the background...")
    background_tasks.add_task(run_scraper_background)
    
    return {
        "status": "queued",
        "message": "Scraping pipeline successfully triggered and running in the background."
    }
