from datetime import datetime, timedelta
from typing import List
from scraping.sources.base import BaseScraper
from scraping.sources.seed_data import FUNDER_TEMPLATES
from models.grant import ScrapedGrant

class BIRACScraper(BaseScraper):
    def __init__(self):
        super().__init__("BIRAC", "https://birac.nic.in/desc_new.php?id=305")

    async def scrape(self) -> List[ScrapedGrant]:
        grants = []
        for i, template in enumerate(FUNDER_TEMPLATES["BIRAC"]):
            data = template.copy()
            # Stagger deadlines dynamically
            data["deadline"] = datetime.now() + timedelta(days=20 + i * 10)
            grants.append(ScrapedGrant(**data))
        return grants
