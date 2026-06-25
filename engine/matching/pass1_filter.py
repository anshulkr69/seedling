import logging
from typing import Dict, Any, List

logger = logging.getLogger("pass1_filter")

# Annual turnover brackets ranked from lowest to highest
TURNOVER_RANK = {
    '<10L': 1,
    '10L-50L': 2,
    '50L-1Cr': 3,
    '>1Cr': 4
}

def get_key_case_insensitive(data: Dict[str, Any], key: str, default: Any = None) -> Any:
    """
    Helper to access dictionary keys in a case-insensitive manner.
    This handles potential differences in database column casings (e.g. requires_12A_80G vs requires_12a_80g).
    """
    if data is None:
        return default
    if key in data:
        return data[key]
    
    key_lower = key.lower()
    for k, v in data.items():
        if k.lower() == key_lower:
            return v
    return default

def evaluate_pass1(org: Dict[str, Any], grant: Dict[str, Any]) -> bool:
    """
    Executes Pass 1 of the Matching Engine: Statutory Hard Filters.
    
    Evaluates 8 hard exclusion conditions. If ANY condition fails, the grant is
    excluded (returns False). Returns True if the organization satisfies all
    statutory checks for the grant.
    """
    org_name = get_key_case_insensitive(org, "name", "Unknown NGO")
    grant_title = get_key_case_insensitive(grant, "title", "Unknown Grant")
    
    # 1. 12A/80G requirement check
    requires_12a_80g = bool(get_key_case_insensitive(grant, "requires_12A_80G", False))
    has_12a_80g = bool(get_key_case_insensitive(org, "has_12A_80G", False))
    if requires_12a_80g and not has_12a_80g:
        logger.debug(f"Exclude: '{org_name}' fails 12A/80G check for '{grant_title}'")
        return False

    # 2. FCRA requirement check
    requires_fcra = bool(get_key_case_insensitive(grant, "requires_fcra", False))
    has_fcra = bool(get_key_case_insensitive(org, "has_fcra", False))
    if requires_fcra and not has_fcra:
        logger.debug(f"Exclude: '{org_name}' fails FCRA check for '{grant_title}'")
        return False

    # 3. NGO Darpan registration check
    requires_ngo_darpan = bool(get_key_case_insensitive(grant, "requires_ngo_darpan", False))
    ngo_darpan_id = get_key_case_insensitive(org, "ngo_darpan_id")
    if requires_ngo_darpan and (ngo_darpan_id is None or str(ngo_darpan_id).strip() == ""):
        logger.debug(f"Exclude: '{org_name}' fails NGO Darpan check for '{grant_title}'")
        return False

    # 4. CSR-1 registration check
    requires_csr_1 = bool(get_key_case_insensitive(grant, "requires_csr_1", False))
    csr_1_registration = get_key_case_insensitive(org, "csr_1_registration")
    if requires_csr_1 and (csr_1_registration is None or str(csr_1_registration).strip() == ""):
        logger.debug(f"Exclude: '{org_name}' fails CSR-1 check for '{grant_title}'")
        return False

    # 5. Audited Financials check
    requires_audited = bool(get_key_case_insensitive(grant, "requires_audited_financials", False))
    has_audited = bool(get_key_case_insensitive(org, "has_audited_financials", False))
    if requires_audited and not has_audited:
        logger.debug(f"Exclude: '{org_name}' fails Audited Financials check for '{grant_title}'")
        return False

    # 6. Eligible Legal Entities check
    eligible_legal_entities = get_key_case_insensitive(grant, "eligible_legal_entities")
    legal_entity_type = get_key_case_insensitive(org, "legal_entity_type")
    # If the grant lists eligible entities, the org's type must be within that list
    if eligible_legal_entities and isinstance(eligible_legal_entities, list) and len(eligible_legal_entities) > 0:
        if legal_entity_type not in eligible_legal_entities:
            logger.debug(f"Exclude: '{org_name}' entity type '{legal_entity_type}' is not in grant's eligible legal entities {eligible_legal_entities}")
            return False

    # 7. Annual Turnover check
    min_turnover_range = get_key_case_insensitive(grant, "min_turnover_range")
    if min_turnover_range:
        annual_turnover_range = get_key_case_insensitive(org, "annual_turnover_range")
        org_rank = TURNOVER_RANK.get(annual_turnover_range, 0)
        grant_rank = TURNOVER_RANK.get(min_turnover_range, 0)
        if org_rank < grant_rank:
            logger.debug(f"Exclude: '{org_name}' turnover bracket '{annual_turnover_range}' (rank {org_rank}) is below minimum required '{min_turnover_range}' (rank {grant_rank})")
            return False

    # 8. Eligible Organization Types check
    eligible_org_types = get_key_case_insensitive(grant, "eligible_org_types")
    org_type = get_key_case_insensitive(org, "type")
    # If the grant lists eligible org types, the org's type must be within that list
    if eligible_org_types and isinstance(eligible_org_types, list) and len(eligible_org_types) > 0:
        if org_type not in eligible_org_types:
            logger.debug(f"Exclude: '{org_name}' org type '{org_type}' is not in grant's eligible org types {eligible_org_types}")
            return False

    # All statutory checks passed
    return True
