from datetime import datetime, timedelta
from typing import List
from scraping.base import BaseScraper
from scraping.sources.seed_data import FUNDER_TEMPLATES
from models.grant import ScrapedGrant

class UNWomenScraper(BaseScraper):
    def __init__(self):
        super().__init__("UN Women", "https://www.unwomen.org/en/about-us/programme-implementation")

    async def scrape(self) -> List[ScrapedGrant]:
        grants = []
        for i, template in enumerate(FUNDER_TEMPLATES["UN_WOMEN"]):
            data = template.copy()
            # Stagger deadlines dynamically
            data["deadline"] = datetime.now() + timedelta(days=60 + i * 30)
            grants.append(ScrapedGrant(**data))
        return grants
