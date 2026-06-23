import logging
from typing import List, Dict, Any
from utils.supabase_client import supabase
from langchain_core.documents import Document

logger = logging.getLogger("drafting.data_loader")

def fetch_org_profile(org_id: str) -> Dict[str, Any]:
    """
    Fetches the organization profile from the organizations table.
    """
    try:
        logger.info(f"Fetching profile for organization: {org_id}")
        response = supabase.table("organizations").select("*").eq("id", org_id).execute()
        if not response.data:
            logger.error(f"Organization {org_id} not found.")
            raise ValueError(f"Organization with ID {org_id} does not exist.")
        return response.data[0]
    except Exception as e:
        logger.error(f"Error fetching organization profile: {e}")
        raise

def fetch_org_projects(org_id: str, limit: int = 3) -> List[Dict[str, Any]]:
    """
    Fetches up to `limit` most recent projects for the organization (Memory Vault).
    """
    try:
        logger.info(f"Fetching top {limit} recent projects for organization: {org_id}")
        response = (
            supabase.table("projects")
            .select("*")
            .eq("org_id", org_id)
            .order("end_date", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data or []
    except Exception as e:
        logger.error(f"Error fetching organization projects: {e}")
        raise

def fetch_grant_details(grant_id: str) -> Dict[str, Any]:
    """
    Fetches the grant details from the grants table.
    """
    try:
        logger.info(f"Fetching details for grant: {grant_id}")
        response = supabase.table("grants").select("*").eq("id", grant_id).execute()
        if not response.data:
            logger.error(f"Grant {grant_id} not found.")
            raise ValueError(f"Grant with ID {grant_id} does not exist.")
        return response.data[0]
    except Exception as e:
        logger.error(f"Error fetching grant details: {e}")
        raise

def build_org_document(org: Dict[str, Any]) -> Document:
    """
    Transforms organization profile dict into a structured Document.
    """
    # Clean list fields
    causes = ", ".join(org.get("schedule_vii_causes", []) or [])
    
    content = (
        f"ORGANIZATION PROFILE\n"
        f"Name: {org.get('name', 'Unknown')}\n"
        f"Type: {org.get('type', 'Unknown')}\n"
        f"Legal Entity Type: {org.get('legal_entity_type', 'Unknown')}\n"
        f"Location: {org.get('location', 'Unknown')}\n"
        f"Mission Statement: {org.get('mission_statement', '')}\n"
        f"Cause Areas (Schedule VII): {causes}\n"
        f"Geography of Impact: {org.get('geography_of_impact', 'Unknown')}\n"
        f"Target Beneficiaries: {org.get('target_beneficiaries', 'Unknown')}\n"
        f"Annual Turnover Range: {org.get('annual_turnover_range', 'Unknown')}\n"
        f"Team Size: {org.get('team_size', 'Unknown')}\n"
        f"Compliance and Registrations: "
        f"12A/80G={org.get('has_12a_80g', org.get('has_12A_80G', False))}, "
        f"FCRA={org.get('has_fcra', False)}, "
        f"NGO Darpan ID={org.get('ngo_darpan_id', 'None')}, "
        f"CSR-1 Registration={org.get('csr_1_registration', 'None')}"
    )
    
    metadata = {
        "type": "organization_profile",
        "org_id": org.get("id"),
        "name": org.get("name")
    }
    return Document(page_content=content, metadata=metadata)

def build_project_document(project: Dict[str, Any]) -> Document:
    """
    Transforms project dict (Memory Vault record) into a structured Document.
    """
    beneficiaries_count = project.get("beneficiaries_count")
    beneficiary_type = project.get("beneficiary_type", "Unknown")
    
    content = (
        f"PAST PROJECT: {project.get('name', 'Unnamed Project')}\n"
        f"Geography: {project.get('geography', 'Unknown')}\n"
        f"Beneficiaries: {beneficiaries_count if beneficiaries_count is not None else 'Unknown'} ({beneficiary_type})\n"
        f"Activities: {project.get('activities', '')}\n"
        f"Outcomes: {project.get('outcomes', '')}\n"
        f"SDG Alignment: {', '.join(project.get('sdg_alignment', []) or [])}\n"
        f"Budget Used: INR {project.get('budget_used', 'Unknown')}\n"
        f"End Date: {project.get('end_date', 'Unknown')}"
    )
    
    metadata = {
        "type": "project",
        "project_id": project.get("id"),
        "org_id": project.get("org_id"),
        "name": project.get("name")
    }
    return Document(page_content=content, metadata=metadata)

def load_as_documents(org_id: str, limit_projects: int = 3) -> List[Document]:
    """
    Fetches organization profile and recent projects from Supabase,
    and returns them as a list of structured LangChain Documents.
    """
    org_profile = fetch_org_profile(org_id)
    projects = fetch_org_projects(org_id, limit=limit_projects)
    
    documents = []
    documents.append(build_org_document(org_profile))
    for project in projects:
        documents.append(build_project_document(project))
        
    logger.info(f"Loaded {len(documents)} documents for organization: {org_id}")
    return documents
