import logging
import hashlib
from typing import Dict, Any, Tuple
import re
from cachetools import TTLCache
from drafting.data_loader import fetch_grant_details
from drafting.search import RAGSearch
from drafting import prompt_builder
from drafting import llm_client

logger = logging.getLogger("drafting.engine")

# 1-hour cache for LLM responses (max 500 entries)
# Cache key: sha256(org_id:grant_id)
draft_cache = TTLCache(maxsize=500, ttl=3600)

REQUIRED_HEADERS = [
    "## About Our Organization",
    "## The Problem We Address",
    "## Our Proposed Project",
    "## Past Work & Evidence",
    "## Budget Justification",
    "## Expected Outcomes"
]

HEADER_KEY_MAP = {
    "## About Our Organization": "about_org",
    "## The Problem We Address": "problem",
    "## Our Proposed Project": "proposed_project",
    "## Past Work & Evidence": "past_work",
    "## Budget Justification": "budget",
    "## Expected Outcomes": "outcomes"
}

def generate_cache_key(org_id: str, grant_id: str) -> str:
    """Generates a secure sha256 hash for caching."""
    combined = f"{org_id}:{grant_id}"
    return hashlib.sha256(combined.encode()).hexdigest()

def parse_sections(draft_text: str) -> Tuple[Dict[str, str], bool]:
    """
    Parses the generated markdown draft to verify the 6 required headers are present.
    Splits the content into respective sections.
    If a section is missing, injects a warning placeholder and marks partial_draft=True.
    """
    sections = {}
    partial_draft = False
    
    # 1. Normalize line endings and double check header presence
    normalized_text = draft_text.replace("\r\n", "\n")
    
    # Find positions of all headers in the text
    header_positions = []
    for header in REQUIRED_HEADERS:
        # Match header exactly at the start of a line
        pattern = re.compile(rf"^{re.escape(header)}\b", re.MULTILINE | re.IGNORECASE)
        match = pattern.search(normalized_text)
        if match:
            # Record the header name (standardized case) and its position
            header_positions.append((header, match.start()))
        else:
            logger.warning(f"Required header is missing from draft: {header}")
            sections[HEADER_KEY_MAP[header]] = "⚠️ [This section needs your input — we couldn't generate it automatically.]"
            partial_draft = True
            
    # Sort the headers by their occurrence in the text
    header_positions.sort(key=lambda x: x[1])
    
    # 2. Extract content between headers
    for idx, (header, pos) in enumerate(header_positions):
        key = HEADER_KEY_MAP[header]
        start_idx = pos + len(header)
        
        # End index is the start of the next header, or end of file
        if idx + 1 < len(header_positions):
            end_idx = header_positions[idx + 1][1]
        else:
            end_idx = len(normalized_text)
            
        content = normalized_text[start_idx:end_idx].strip()
        sections[key] = content
        
    # 3. For any missing sections, append the header + warning placeholder to the full draft
    reconstructed_draft = draft_text
    for header in REQUIRED_HEADERS:
        key = HEADER_KEY_MAP[header]
        if key not in sections or sections[key].startswith("⚠️"):
            # Append missing section to the bottom of draft text
            reconstructed_draft += f"\n\n{header}\n⚠️ [This section needs your input — we couldn't generate it automatically.]"
            
    # 4. Word count check (minimum 400 words)
    words = len(re.findall(r"\b\w+\b", normalized_text))
    if words < 400:
        logger.warning(f"Draft is too short ({words} words). Marking as partial.")
        partial_draft = True
        
    return sections, partial_draft, reconstructed_draft

class DraftingEngine:
    def __init__(self, persist_dir: str = "faiss_store"):
        self.persist_dir = persist_dir

    def generate_draft(self, org_id: str, grant_id: str, application_id: str) -> Dict[str, Any]:
        """
        Orchestrates the entire draft generation workflow:
        1. Check response cache
        2. Fetch organization & project data from Supabase
        3. Retrieve relevant chunks using RAG Search
        4. Build LLM prompt
        5. Invoke LLM with tenacity and failover
        6. Validate and parse output
        7. Cache response
        """
        logger.info(f"Initiating draft generation for org: {org_id}, grant: {grant_id}")
        
        # 1. CHECK RESPONSE CACHE
        cache_key = generate_cache_key(org_id, grant_id)
        if cache_key in draft_cache:
            logger.info(f"Cache HIT for org {org_id} and grant {grant_id}.")
            return {
                "cache_hit": True,
                **draft_cache[cache_key]
            }
            
        logger.info(f"Cache MISS for org {org_id} and grant {grant_id}. Starting RAG pipeline...")
        
        # 2. FETCH DATA FROM SUPABASE
        # Retrieve grant details
        grant = fetch_grant_details(grant_id)
        
        # 3. RUN SEARCH/RAG
        # Initialize RAGSearch (which will build/load the org's FAISS index automatically)
        rag_search = RAGSearch(org_id=org_id, persist_dir=self.persist_dir)
        # Retrieve top 4 most relevant chunks
        relevant_chunks = rag_search.retrieve_relevant_chunks(grant, top_k=4)
        
        # Pull organization profile from the RAG search dataset directly to avoid double fetching
        org_profile = rag_search.vectorstore.metadata[0] if rag_search.vectorstore.metadata else {}
        if not org_profile or org_profile.get("type") != "organization_profile":
            # Fallback load org profile if metadata structure is unexpected
            from drafting.data_loader import fetch_org_profile
            org_profile = fetch_org_profile(org_id)
            
        # 4. BUILD STRUCTURED PROMPT
        system_prompt = prompt_builder.build_system_prompt()
        user_prompt = prompt_builder.build_user_prompt(org_profile, grant, relevant_chunks)
        
        # 5. LLM CALL WITH FAILOVER
        draft_text, provider_used, fallback_used = llm_client.generate_draft_llm(system_prompt, user_prompt)
        
        # 6. VALIDATE LLM OUTPUT & PARSE
        sections, partial_draft, final_draft_text = parse_sections(draft_text)
        
        # Build response payload
        response_data = {
            "draft": final_draft_text,
            "provider_used": provider_used,
            "fallback_used": fallback_used,
            "partial_draft": partial_draft,
            "sections": sections
        }
        
        # 7. STORE IN CACHE
        draft_cache[cache_key] = response_data
        logger.info(f"Draft generated successfully using {provider_used}. Response cached.")
        
        return {
            "cache_hit": False,
            **response_data
        }
