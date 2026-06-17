from datetime import datetime, timedelta
from typing import List
from scraping.sources.base import BaseScraper
from scraping.sources.seed_data import FUNDER_TEMPLATES
from models.grant import ScrapedGrant

class FordFoundationScraper(BaseScraper):
    def __init__(self):
        super().__init__("Ford Foundation", "https://www.fordfoundation.org/work/our-grants")

    async def scrape(self) -> List[ScrapedGrant]:
        grants = []
        for i, template in enumerate(FUNDER_TEMPLATES["FORD_FOUNDATION"]):
            data = template.copy()
            # Stagger deadlines dynamically
            data["deadline"] = datetime.now() + timedelta(days=50 + i * 25)
            grants.append(ScrapedGrant(**data))
        return grants
