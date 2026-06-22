import logging
from typing import List, Dict, Any

logger = logging.getLogger("drafting.prompt_builder")

def build_system_prompt() -> str:
    """
    Returns the system prompt defining the AI's role, tone, grounding guidelines,
    and output format requirements.
    """
    return (
        "You are a professional grant proposal writer for Indian NGOs. "
        "Your task is to write structured, formal, persuasive, and evidence-based grant proposals.\n\n"
        "Strict Guidelines:\n"
        "1. GROUNDING: Ground all claims about past work and impact strictly in the provided project data. "
        "Do NOT hallucinate, fabricate, or extrapolate numbers, locations, outcomes, or beneficiaries. "
        "If a specific detail is not present in the context, do not include it or describe it in general terms without inventing facts.\n"
        "2. STRUCTURE: You MUST output exactly 6 sections in the final response. Each section must begin with a Markdown H2 header (##) exactly as specified in the output format.\n"
        "3. TONE: Use a highly professional, formal, and objective tone suitable for corporate CSR and foundation donors.\n"
        "4. CURRENCY: Always write currency in Indian Rupees (e.g., ₹ or INR)."
    )

def build_user_prompt(org: Dict[str, Any], grant: Dict[str, Any], relevant_chunks: List[Dict[str, Any]]) -> str:
    """
    Assembles the user prompt, injecting organization info, grant details,
    and retrieved RAG context chunks.
    """
    # 1. Format Grant Details
    grant_title = grant.get("title", "Untitled Grant")
    grant_funder = grant.get("funder", "Unknown Funder")
    grant_causes = ", ".join(grant.get("cause_areas", []) or [])
    grant_geo = grant.get("geography", "Unknown")
    grant_budget_min = grant.get("budget_min")
    grant_budget_max = grant.get("budget_max")
    grant_deadline = grant.get("deadline", "No deadline specified")
    grant_desc = grant.get("description", "No description provided.")
    
    budget_range = "Not specified"
    if grant_budget_min is not None or grant_budget_max is not None:
        min_val = f"₹{grant_budget_min:,}" if grant_budget_min is not None else "₹0"
        max_val = f"₹{grant_budget_max:,}" if grant_budget_max is not None else "unlimited"
        budget_range = f"{min_val} – {max_val}"

    grant_section = (
        f"== GRANT DETAILS ==\n"
        f"Title: {grant_title}\n"
        f"Funder: {grant_funder}\n"
        f"Focus Areas: {grant_causes}\n"
        f"Geography: {grant_geo}\n"
        f"Budget Range: {budget_range}\n"
        f"Deadline: {grant_deadline}\n"
        f"Requirements & Description:\n{grant_desc}"
    )

    # 2. Format Organisation Profile
    org_name = org.get("name", "Unknown NGO")
    org_type = org.get("type", "NGO")
    org_legal = org.get("legal_entity_type", "Unknown")
    org_loc = org.get("location", "Unknown")
    org_mission = org.get("mission_statement", "No mission statement.")
    org_causes = ", ".join(org.get("schedule_vii_causes", []) or [])
    org_ben = org.get("target_beneficiaries", "General")
    org_team = org.get("team_size", "Unknown")
    
    org_section = (
        f"== ORGANISATION PROFILE ==\n"
        f"Name: {org_name}\n"
        f"Type: {org_type} ({org_legal})\n"
        f"Location: {org_loc}\n"
        f"Mission: {org_mission}\n"
        f"Cause Areas: {org_causes}\n"
        f"Target Beneficiaries: {org_ben}\n"
        f"Team Size: {org_team}\n"
        f"Registrations: 12A/80G={org.get('has_12a_80g', org.get('has_12A_80G', False))}, "
        f"FCRA={org.get('has_fcra', False)}, "
        f"CSR-1 Registration={org.get('csr_1_registration', 'None')}"
    )

    # 3. Format Retrieved RAG Chunks
    chunks_text_list = []
    for i, res in enumerate(relevant_chunks):
        metadata = res.get("metadata", {})
        chunk_type = metadata.get("type", "Context")
        chunk_name = metadata.get("name", f"Chunk {i+1}")
        text = metadata.get("text", "")
        
        chunks_text_list.append(
            f"[{chunk_type.upper()}: {chunk_name}]\n{text}"
        )
    
    retrieved_section = (
        f"== RETRIEVED PAST PROJECTS & CONTEXT ==\n" +
        ("\n\n---\n\n".join(chunks_text_list) if chunks_text_list else "No relevant project history found in vault.")
    )

    # 4. Format Required H2 Headings
    output_format_section = (
        f"== REQUIRED OUTPUT FORMAT ==\n"
        f"You must generate exactly 6 H2 markdown sections in the following order. "
        f"Do not include intro/outro conversational text before or after the markdown sections.\n\n"
        f"## About Our Organization\n"
        f"## The Problem We Address\n"
        f"## Our Proposed Project\n"
        f"## Past Work & Evidence\n"
        f"## Budget Justification\n"
        f"## Expected Outcomes"
    )

    # 5. Assemble Prompt
    user_prompt = (
        f"Generate a grant proposal draft matching the donor requirements.\n\n"
        f"{grant_section}\n\n"
        f"{org_section}\n\n"
        f"{retrieved_section}\n\n"
        f"{output_format_section}"
    )
    
    return user_prompt
