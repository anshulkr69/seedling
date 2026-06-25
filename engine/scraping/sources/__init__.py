from scraping.sources.dst import DSTScraper
from scraping.sources.birac import BIRACScraper
from scraping.sources.msje import MSJEScraper
from scraping.sources.tata_trusts import TataTrustsScraper
from scraping.sources.ford_foundation import FordFoundationScraper
from scraping.sources.infosys_csr import InfosysCSRScraper
from scraping.sources.un_women_india import UNWomenScraper
from scraping.sources.undp_india import UNDPScraper

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
