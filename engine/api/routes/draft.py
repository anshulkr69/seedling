from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from drafting.v8_engine import DraftingEngine
from utils.security import verify_internal_key
from utils.supabase_client import supabase
import logging

logger = logging.getLogger("draft_route")
router = APIRouter()
engine = DraftingEngine()

class DraftRequest(BaseModel):
    org_id: str
    grant_id: str
    application_id: str

@router.post("/", status_code=status.HTTP_200_OK)
async def generate_draft_endpoint(
    request: DraftRequest,
    internal_key: str = Depends(verify_internal_key)
):
    """
    Generate a grant proposal draft using RAG and LLM failover.
    Requires X-Internal-Key header for verification.
    """
    logger.info(f"Authorized draft generation request for org {request.org_id}, application {request.application_id}")
    try:
        # 1. Run the Drafting Engine
        result = engine.generate_draft(
            org_id=request.org_id,
            grant_id=request.grant_id,
            application_id=request.application_id
        )
        
        # 2. Update draft_content in the applications table
        try:
            logger.info(f"Writing generated draft to applications table for ID: {request.application_id}")
            db_res = supabase.table("applications").update({
                "draft_content": result["draft"]
            }).eq("id", request.application_id).execute()
            
            if not db_res.data:
                logger.warning(f"No application row found with ID: {request.application_id}")
                raise ValueError(f"Application row with ID {request.application_id} does not exist.")
        except Exception as db_err:
            logger.error(f"Failed to update draft_content in Supabase: {db_err}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to persist draft to database: {str(db_err)}"
            )

        return {
            "status": "success",
            "message": "Draft generated and saved successfully.",
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in draft generation endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Draft generation failed: {str(e)}"
        )
