from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ScrapedGrant(BaseModel):
    title: str
    funder: str
    description: str
    deadline: Optional[datetime] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    application_url: Optional[str] = None
    source_portal: Optional[str] = None
    
    # Metadata fields to be resolved by parser/heuristics
    cause_areas: List[str] = Field(default_factory=list)
    schedule_vii_categories: List[str] = Field(default_factory=list)
    eligible_org_types: List[str] = Field(default_factory=list)
    funding_type_offered: List[str] = Field(default_factory=list)
    geography: Optional[str] = "India"
    
    # Indian statutory compliance requirements
    requires_audited_financials: bool = False
    requires_12a_80g: bool = False
    requires_fcra: bool = False
    requires_ngo_darpan: bool = False
    requires_csr_1: bool = False
    min_turnover_range: Optional[str] = None # Matches turnover_bracket_enum
    eligible_legal_entities: List[str] = Field(default_factory=list) # List of legal_entity_enum
    required_documents: List[str] = Field(default_factory=list)
