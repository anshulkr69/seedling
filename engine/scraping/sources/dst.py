from datetime import datetime, timedelta
from typing import List
from scraping.base import BaseScraper
from scraping.sources.seed_data import FUNDER_TEMPLATES
from models.grant import ScrapedGrant

class DSTScraper(BaseScraper):
    def __init__(self):
        super().__init__("DST", "https://dst.gov.in/call-for-proposals")

    async def scrape(self) -> List[ScrapedGrant]:
        grants = []
        for i, template in enumerate(FUNDER_TEMPLATES["DST"]):
            data = template.copy()
            # Stagger deadlines dynamically
            data["deadline"] = datetime.now() + timedelta(days=30 + i * 15)
            grants.append(ScrapedGrant(**data))
        return grants
