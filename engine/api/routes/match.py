from fastapi import APIRouter, Depends, HTTPException, status
from matching.engine import MatchingEngine
from utils.security import verify_internal_key
import logging

logger = logging.getLogger("match_route")
router = APIRouter()
engine = MatchingEngine()

@router.post("/all", status_code=status.HTTP_200_OK)
async def trigger_match_all(
    internal_key: str = Depends(verify_internal_key)
):
    """
    Triggers the matching engine to re-run matching for all organizations in the system.
    Requires an X-Internal-Key header that matches the GITHUB_ACTIONS_WEBHOOK_SECRET env variable.
    """
    logger.info("Batch match all trigger authorized. Running matching for all organizations...")
    try:
        results = engine.match_all()
        return {
            "status": "success",
            "message": "Matching engine run completed for all organizations.",
            "data": results
        }
    except Exception as e:
        logger.error(f"Error running match all batch: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch matching failed: {str(e)}"
        )

@router.post("/{org_id}", status_code=status.HTTP_200_OK)
async def trigger_match_org(
    org_id: str,
    internal_key: str = Depends(verify_internal_key)
):
    """
    Triggers matching for a single organization.
    Requires an X-Internal-Key header that matches the GITHUB_ACTIONS_WEBHOOK_SECRET env variable.
    """
    logger.info(f"Match trigger for organization {org_id} authorized.")
    try:
        result = engine.match_org(org_id)
        if "error" in result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["error"]
            )
        return {
            "status": "success",
            "message": f"Matching complete for organization {org_id}",
            "data": result
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error matching organization {org_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Matching failed for organization {org_id}: {str(e)}"
        )
