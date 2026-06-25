from datetime import datetime, timedelta
from typing import List
from scraping.base import BaseScraper
from scraping.sources.seed_data import FUNDER_TEMPLATES
from models.grant import ScrapedGrant

class TataTrustsScraper(BaseScraper):
    def __init__(self):
        super().__init__("Tata Trusts", "https://www.tatatrusts.org/our-contributions/grants")

    async def scrape(self) -> List[ScrapedGrant]:
        grants = []
        for i, template in enumerate(FUNDER_TEMPLATES["TATA_TRUSTS"]):
            data = template.copy()
            # Stagger deadlines dynamically
            data["deadline"] = datetime.now() + timedelta(days=40 + i * 20)
            grants.append(ScrapedGrant(**data))
        return grants
