import logging
from datetime import datetime, timezone
from typing import Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from matching.pass1_filter import get_key_case_insensitive

logger = logging.getLogger("pass2_scorer")

def compute_tfidf_similarity(text_a: str, text_b: str) -> float:
    """
    Computes cosine similarity between two text blocks using TF-IDF.
    """
    if not text_a.strip() or not text_b.strip():
        return 0.0
    try:
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform([text_a, text_b])
        sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
        return float(sim[0][0])
    except Exception as e:
        logger.warning(f"Error computing TF-IDF similarity: {e}")
        return 0.0

def get_days_remaining(deadline_val: Any) -> float:
    """
    Calculates the number of days remaining until the deadline from the current time.
    Returns None if no deadline is specified.
    """
    if not deadline_val:
        return None
    
    if isinstance(deadline_val, str):
        try:
            # Clean string and convert 'Z' to UTC offset for fromisoformat compatibility
            val_str = deadline_val.replace("Z", "+00:00")
            dt = datetime.fromisoformat(val_str)
        except Exception:
            try:
                # Fallback parse for formats like 'YYYY-MM-DDTHH:MM:SS' without timezone
                dt = datetime.strptime(deadline_val[:19], "%Y-%m-%dT%H:%M:%S")
                dt = dt.replace(tzinfo=timezone.utc)
            except Exception:
                logger.warning(f"Unable to parse deadline string: {deadline_val}")
                return None
    elif isinstance(deadline_val, datetime):
        dt = deadline_val
    else:
        return None
    
    # Make timezone aware if it is naive (assume UTC)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
        
    now = datetime.now(timezone.utc)
    delta = dt - now
    return delta.days

def calculate_pass2_score(org: Dict[str, Any], grant: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
    """
    Executes Pass 2 of the Matching Engine: Weighted Factor Scoring.
    
    Calculates a fit score between 0 and 100 based on:
    1. Cause Alignment (35%) - TF-IDF similarity
    2. Geography Fit (20%) - Rule-based match
    3. Budget Overlap (20%) - Overlap of funding ranges
    4. Capacity Match (15%) - Audited financials & funding type overlap
    5. Deadline Viability (10%) - Days remaining
    
    Returns:
        tuple: (total_score_integer, match_reasons_dict)
    """
    # Initialize component scores
    score_cause = 0.0
    score_geography = 0.0
    score_budget = 0.0
    score_capacity = 0.0
    score_deadline = 0.0

    # 1. FACTOR 1: Cause Alignment (Weight: 35%)
    org_mission = get_key_case_insensitive(org, "mission_statement", "") or ""
    org_causes = get_key_case_insensitive(org, "schedule_vii_causes", []) or []
    org_text = f"{org_mission} {' '.join(org_causes)}".strip()

    grant_desc = get_key_case_insensitive(grant, "description", "") or ""
    grant_causes = get_key_case_insensitive(grant, "cause_areas", []) or []
    grant_categories = get_key_case_insensitive(grant, "schedule_vii_categories", []) or []
    grant_text = f"{grant_desc} {' '.join(grant_causes)} {' '.join(grant_categories)}".strip()

    tfidf_sim = compute_tfidf_similarity(org_text, grant_text)
    score_cause = tfidf_sim * 35.0

    # 2. FACTOR 2: Geography Fit (Weight: 20%)
    org_geo = str(get_key_case_insensitive(org, "geography_of_impact", "") or "").strip().lower()
    grant_geo = str(get_key_case_insensitive(grant, "geography", "") or "").strip().lower()

    if org_geo == grant_geo and org_geo != "":
        score_geography = 20.0
    elif grant_geo == "national":
        score_geography = 15.0
    elif grant_geo == "international":
        score_geography = 10.0
    else:
        score_geography = 0.0

    # 3. FACTOR 3: Budget Range Overlap (Weight: 20%)
    org_min = get_key_case_insensitive(org, "funding_range_min")
    org_max = get_key_case_insensitive(org, "funding_range_max")
    grant_min = get_key_case_insensitive(grant, "budget_min")
    grant_max = get_key_case_insensitive(grant, "budget_max")

    if grant_min is None and grant_max is None:
        # Neutral score if grant does not list budget
        score_budget = 10.0
        budget_overlap_fraction = 0.0
    else:
        # Standardize range values
        o_min = float(org_min) if org_min is not None else 0.0
        o_max = float(org_max) if org_max is not None else float('inf')
        g_min = float(grant_min) if grant_min is not None else 0.0
        g_max = float(grant_max) if grant_max is not None else float('inf')

        # Compute effective limits for calculations if values are infinite
        eff_o_max = o_max if o_max != float('inf') else max(o_min, g_max if g_max != float('inf') else 10000000.0)
        eff_g_max = g_max if g_max != float('inf') else max(g_min, o_max if o_max != float('inf') else 10000000.0)

        overlap_min = max(o_min, g_min)
        overlap_max = min(eff_o_max, eff_g_max)

        if overlap_max >= overlap_min:
            union_min = min(o_min, g_min)
            union_max = max(eff_o_max, eff_g_max)
            union_width = union_max - union_min
            if union_width > 0:
                budget_overlap_fraction = (overlap_max - overlap_min) / union_width
            else:
                budget_overlap_fraction = 1.0
            score_budget = budget_overlap_fraction * 20.0
        else:
            budget_overlap_fraction = 0.0
            score_budget = 0.0

    # 4. FACTOR 4: Capacity Match (Weight: 15%)
    req_audited = bool(get_key_case_insensitive(grant, "requires_audited_financials", False))
    has_audited = bool(get_key_case_insensitive(org, "has_audited_financials", False))
    if req_audited and has_audited:
        score_capacity += 8.0

    funding_offered = get_key_case_insensitive(grant, "funding_type_offered", []) or []
    funding_needed = get_key_case_insensitive(org, "funding_types_needed", []) or []
    
    if isinstance(funding_offered, list) and isinstance(funding_needed, list):
        offered_set = {str(item).strip().lower() for item in funding_offered}
        needed_set = {str(item).strip().lower() for item in funding_needed}
        if offered_set.intersection(needed_set):
            score_capacity += 7.0

    # 5. FACTOR 5: Deadline Viability (Weight: 10%)
    deadline = get_key_case_insensitive(grant, "deadline")
    days_left = get_days_remaining(deadline)

    if days_left is None:
        score_deadline = 10.0
    elif days_left > 60:
        score_deadline = 10.0
    elif 30 <= days_left <= 60:
        score_deadline = 7.0
    elif 14 <= days_left < 30:
        score_deadline = 4.0
    elif 0 <= days_left < 14:
        score_deadline = 2.0
    else:  # deadline passed
        score_deadline = 0.0

    # Calculate final composite score
    total_score = int(round(score_cause + score_geography + score_budget + score_capacity + score_deadline))
    total_score = max(0, min(100, total_score))

    # Determine cause label (best matching cause area or first org cause)
    cause_label = "General Impact"
    overlap_causes = [c for c in org_causes if c in grant_causes]
    if overlap_causes:
        cause_label = overlap_causes[0]
    elif org_causes:
        cause_label = org_causes[0]

    # Generate Advisory Warnings
    advisory_warnings = []
    has_fcra = bool(get_key_case_insensitive(org, "has_fcra", False))
    funder_name = str(get_key_case_insensitive(grant, "funder", "") or "").lower()
    
    # FCRA warning for foreign funders
    foreign_keywords = ["ford foundation", "un women", "undp", "united nations", "foreign", "international"]
    is_foreign_funder = any(kw in funder_name for kw in foreign_keywords)
    if (is_foreign_funder or grant_geo == "international") and not has_fcra:
        advisory_warnings.append("fcra_for_foreign_funds")
        
    # Audited financials warning if not present (only if it wasn't a hard exclusion)
    if not has_audited and req_audited:
        advisory_warnings.append("audited_financials_recommended")

    # Build reasons metadata
    match_reasons = {
        "cause_match": tfidf_sim >= 0.4,
        "cause_label": cause_label,
        "geography_match": score_geography > 0 or grant_geo in ["national", "international"],
        "budget_overlap": score_budget > 0 or (grant_min is None and grant_max is None),
        "capacity_match": score_capacity > 0,
        "deadline_viable": days_left is None or days_left >= 14,
        "tfidf_score": round(tfidf_sim, 2),
        "advisory_warnings": advisory_warnings
    }

    return total_score, match_reasons
