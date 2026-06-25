from fastapi import Header, HTTPException, status
from config.settings import settings
import logging

logger = logging.getLogger("security")

async def verify_internal_key(
    x_internal_key: str = Header(None, alias="X-Internal-Key")
):
    """
    Dependency to validate the X-Internal-Key header.
    Raises 403 Forbidden if missing or incorrect.
    """
    expected_key = settings.github_actions_webhook_secret
    
    if not x_internal_key or x_internal_key != expected_key:
        logger.warning("Unauthorized access attempt: invalid or missing X-Internal-Key header")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Invalid or missing X-Internal-Key header"
        )
    return x_internal_key
