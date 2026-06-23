import re
from datetime import datetime
from typing import Optional, List
from models.grant import ScrapedGrant
import logging

logger = logging.getLogger("parser")

class HeuristicParser:
    @staticmethod
    def parse_deadline(text: str) -> Optional[datetime]:
        """Attempts to parse a deadline date from unstructured text using regex."""
        # Patterns like DD/MM/YYYY, YYYY-MM-DD, or DD-MM-YYYY
        date_patterns = [
            r"(\d{2})[-/](\d{2})[-/](\d{4})", # 25-12-2026
            r"(\d{4})[-/](\d{2})[-/](\d{2})"  # 2026-12-25
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                groups = match.groups()
                try:
                    if len(groups[0]) == 4: # YYYY-MM-DD
                        return datetime(int(groups[0]), int(groups[1]), int(groups[2]))
                    else: # DD-MM-YYYY
                        return datetime(int(groups[2]), int(groups[1]), int(groups[0]))
                except ValueError:
                    continue
                    
        # English textual dates: "31st December 2026", "Dec 31, 2026"
        months = {
            "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
            "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12
        }
        month_pattern = "|".join(months.keys())
        text_pattern = rf"(\d{{1,2}})(?:st|nd|rd|th)?\s+({month_pattern})[a-z]*\s*,?\s*(\d{{4}})"
        match = re.search(text_pattern, text, re.IGNORECASE)
        if match:
            day, month_str, year = match.groups()
            month_num = months[month_str.lower()[:3]]
            try:
                return datetime(int(year), month_num, int(day))
            except ValueError:
                pass
                
        return None

    @staticmethod
    def parse_budget(text: str) -> tuple[Optional[float], Optional[float]]:
        """Parses budget range from text (e.g., 'Rs. 10 Lakhs to 50 Lakhs')."""
        budget_min: Optional[float] = None
        budget_max: Optional[float] = None
        
        # Regex for numbers followed by Lakh/Crore
        lakh_pattern = r"(\d+(?:\.\d+)?)\s*(?:lakh|L)"
        crore_pattern = r"(\d+(?:\.\d+)?)\s*(?:crore|Cr)"
        
        lakh_matches = re.findall(lakh_pattern, text, re.IGNORECASE)
        crore_matches = re.findall(crore_pattern, text, re.IGNORECASE)
        
        values = []
        for val in lakh_matches:
            values.append(float(val) * 100000) # Convert Lakh to raw INR
        for val in crore_matches:
            values.append(float(val) * 10000000) # Convert Crore to raw INR
            
        if len(values) >= 2:
            budget_min, budget_max = min(values), max(values)
        elif len(values) == 1:
            budget_max = values[0]
            
        return budget_min, budget_max

    @classmethod
    def enrich_grant(cls, grant: ScrapedGrant) -> ScrapedGrant:
        """Enriches a ScrapedGrant with compliance rules and statutory requirements based on description text."""
        combined_text = f"{grant.title} {grant.description}".lower()
        
        # 1. Regex Heuristic Checks
        if "12a" in combined_text or "80g" in combined_text:
            grant.requires_12a_80g = True
            
        if "fcra" in combined_text or "foreign contribution" in combined_text:
            grant.requires_fcra = True
            
        if "darpan" in combined_text or "ngo darpan" in combined_text:
            grant.requires_ngo_darpan = True
            
        if "csr-1" in combined_text or "csr 1" in combined_text or "csr registration" in combined_text:
            grant.requires_csr_1 = True
            
        if "audited" in combined_text or "audit reports" in combined_text or "financial statements" in combined_text:
            grant.requires_audited_financials = True
            
        # 2. Extract budget and deadlines if not already present
        if not grant.deadline:
            parsed_date = cls.parse_deadline(grant.description)
            if parsed_date:
                grant.deadline = parsed_date
                
        if not grant.budget_max:
            b_min, b_max = cls.parse_budget(grant.description)
            if b_min:
                grant.budget_min = b_min
            if b_max:
                grant.budget_max = b_max

        # 3. Funder-Specific Strict Templates (Override default heuristics for 100% precision)
        funder_lower = grant.funder.lower()
        if "dst" in funder_lower or "science & technology" in funder_lower:
            grant.requires_ngo_darpan = True
            grant.requires_12a_80g = True
            grant.requires_audited_financials = True
            grant.requires_csr_1 = False
            grant.requires_fcra = False
            grant.min_turnover_range = "<10L"
            if not grant.eligible_legal_entities:
                grant.eligible_legal_entities = ["Society", "Trust", "Section 8 Company"]
                
        elif "birac" in funder_lower:
            grant.requires_ngo_darpan = True
            grant.requires_12a_80g = True
            grant.requires_audited_financials = True
            grant.requires_csr_1 = False
            grant.requires_fcra = False
            if not grant.eligible_legal_entities:
                grant.eligible_legal_entities = ["Section 8 Company", "Society", "Trust"]
                
        elif "ministry of social justice" in funder_lower or "msje" in funder_lower:
            grant.requires_ngo_darpan = True
            grant.requires_12a_80g = True
            grant.requires_audited_financials = True
            grant.requires_csr_1 = False
            grant.requires_fcra = False
            if not grant.eligible_legal_entities:
                grant.eligible_legal_entities = ["Society", "Trust", "Section 8 Company"]
                
        elif "tata trusts" in funder_lower:
            grant.requires_csr_1 = True
            grant.requires_12a_80g = True
            grant.requires_audited_financials = True
            grant.requires_ngo_darpan = False
            grant.requires_fcra = False
            grant.min_turnover_range = "10L-50L"
            if not grant.eligible_legal_entities:
                grant.eligible_legal_entities = ["Trust", "Society", "Section 8 Company"]
                
        elif "ford foundation" in funder_lower:
            grant.requires_fcra = True
            grant.requires_12a_80g = True
            grant.requires_audited_financials = True
            grant.requires_ngo_darpan = False
            grant.requires_csr_1 = False
            grant.min_turnover_range = "50L-1Cr"
            if not grant.eligible_legal_entities:
                grant.eligible_legal_entities = ["Trust", "Society", "Section 8 Company"]
                
        elif "infosys" in funder_lower:
            grant.requires_csr_1 = True
            grant.requires_12a_80g = True
            grant.requires_audited_financials = True
            grant.requires_ngo_darpan = False
            grant.requires_fcra = False
            grant.min_turnover_range = ">1Cr"
            if not grant.eligible_legal_entities:
                grant.eligible_legal_entities = ["Section 8 Company", "Trust", "Society"]
                
        elif "un women" in funder_lower or "undp" in funder_lower:
            grant.requires_fcra = True
            grant.requires_12a_80g = True
            grant.requires_audited_financials = True
            grant.requires_ngo_darpan = False
            grant.requires_csr_1 = False
            grant.min_turnover_range = "10L-50L"
            if not grant.eligible_legal_entities:
                grant.eligible_legal_entities = ["Society", "Trust", "Section 8 Company"]

        return grant
