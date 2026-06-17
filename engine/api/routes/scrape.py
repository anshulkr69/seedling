from fastapi import APIRouter, Header, HTTPException, BackgroundTasks, status
from config.settings import settings
from scraping.manager import ScrapeManager
import logging

logger = logging.getLogger("scrape_route")
router = APIRouter()

async def run_scraper_background():
    """Background task runner to execute the scraping manager."""
    try:
        manager = ScrapeManager()
        result = await manager.run()
        logger.info(f"Background scraping completed successfully: {result}")
    except Exception as e:
        logger.error(f"Background scraping failed: {str(e)}")

@router.post("/trigger", status_code=status.HTTP_202_ACCEPTED)
async def trigger_scrape(
    background_tasks: BackgroundTasks,
    x_webhook_secret: str = Header(None, alias="X-Webhook-Secret")
):
    """
    Triggers the scraping pipeline in a non-blocking background task.
    Requires an X-Webhook-Secret header that matches the GITHUB_ACTIONS_WEBHOOK_SECRET env variable.
    """
    # Verify the incoming webhook secret
    expected_secret = settings.github_actions_webhook_secret
    
    if not x_webhook_secret or x_webhook_secret != expected_secret:
        logger.warning("Unauthorized attempt to trigger scraper (invalid X-Webhook-Secret header)")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Webhook-Secret header"
        )
        
    logger.info("Scrape trigger authorized. Queuing scraping task in the background...")
    background_tasks.add_task(run_scraper_background)
    
    return {
        "status": "queued",
        "message": "Scraping pipeline successfully triggered and running in the background."
    }
