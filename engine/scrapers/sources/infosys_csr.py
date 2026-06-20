from datetime import datetime, timedelta
from typing import List
from scrapers.base import BaseScraper
from scrapers.sources.seed_data import FUNDER_TEMPLATES
from models.grant import ScrapedGrant

class InfosysCSRScraper(BaseScraper):
    def __init__(self):
        super().__init__("Infosys Foundation", "https://www.infosys.com/infosys-foundation/grants.html")

    async def scrape(self) -> List[ScrapedGrant]:
        grants = []
        for i, template in enumerate(FUNDER_TEMPLATES["INFOSYS_CSR"]):
            data = template.copy()
            # Stagger deadlines dynamically
            data["deadline"] = datetime.now() + timedelta(days=45 + i * 15)
            grants.append(ScrapedGrant(**data))
        return grants
