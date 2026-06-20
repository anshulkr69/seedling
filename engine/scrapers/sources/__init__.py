from scrapers.sources.dst import DSTScraper
from scrapers.sources.birac import BIRACScraper
from scrapers.sources.msje import MSJEScraper
from scrapers.sources.tata_trusts import TataTrustsScraper
from scrapers.sources.ford_foundation import FordFoundationScraper
from scrapers.sources.infosys_csr import InfosysCSRScraper
from scrapers.sources.un_women_india import UNWomenScraper
from scrapers.sources.undp_india import UNDPScraper

ALL_SCRAPERS = [
    DSTScraper,
    BIRACScraper,
    MSJEScraper,
    TataTrustsScraper,
    FordFoundationScraper,
    InfosysCSRScraper,
    UNWomenScraper,
    UNDPScraper
]
