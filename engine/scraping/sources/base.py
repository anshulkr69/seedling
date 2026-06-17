import httpx
from typing import List, Dict, Any
from abc import ABC, abstractmethod
from models.grant import ScrapedGrant
import logging

logger = logging.getLogger("scraper")

class BaseScraper(ABC):
    def __init__(self, funder_name: str, source_portal: str):
        self.funder_name = funder_name
        self.source_portal = source_portal
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

    async def fetch_page(self, url: str) -> str:
        """Asynchronously fetches page content using httpx."""
        try:
            async with httpx.AsyncClient(headers=self.headers, follow_redirects=True, timeout=15.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.text
        except Exception as e:
            logger.error(f"Error fetching page {url} for funder {self.funder_name}: {str(e)}")
            return ""

    @abstractmethod
    async def scrape(self) -> List[ScrapedGrant]:
        """Abstract method to run the scraper and return a list of ScrapedGrant models."""
        pass
