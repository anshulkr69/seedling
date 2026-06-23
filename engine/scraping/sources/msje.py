from datetime import datetime, timedelta
from typing import List
from scraping.sources.base import BaseScraper
from scraping.sources.seed_data import FUNDER_TEMPLATES
from models.grant import ScrapedGrant

class MSJEScraper(BaseScraper):
    def __init__(self):
        super().__init__("MSJE", "https://socialjustice.gov.in/schemes")

    async def scrape(self) -> List[ScrapedGrant]:
        grants = []
        for i, template in enumerate(FUNDER_TEMPLATES["MSJE"]):
            data = template.copy()
            # Stagger deadlines dynamically
            data["deadline"] = datetime.now() + timedelta(days=15 + i * 8)
            grants.append(ScrapedGrant(**data))
        return grants
