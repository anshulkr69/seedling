from datetime import datetime, timedelta
from typing import List
from scraping.sources.base import BaseScraper
from scraping.sources.seed_data import FUNDER_TEMPLATES
from models.grant import ScrapedGrant

class UNDPScraper(BaseScraper):
    def __init__(self):
        super().__init__("UNDP", "https://www.undp.org/india/procurement")

    async def scrape(self) -> List[ScrapedGrant]:
        grants = []
        for i, template in enumerate(FUNDER_TEMPLATES["UNDP"]):
            data = template.copy()
            # Stagger deadlines dynamically
            data["deadline"] = datetime.now() + timedelta(days=50 + i * 25)
            grants.append(ScrapedGrant(**data))
        return grants
