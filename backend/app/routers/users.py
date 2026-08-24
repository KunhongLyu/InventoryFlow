from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user
from ..database import get_db

router = APIRouter(prefix="/users", tags=["users"])


@router.patch("/{user_id}/promote", response_model=schemas.UserRead)
def promote_to_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Only an existing admin can create new admins. Combined with the
    ADMIN_EMAIL/ADMIN_PASSWORD startup bootstrap in main.py, this means
    exactly one admin is ever created "for free" — every admin after that
    is explicitly vouched for by someone who was already trusted.
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    user = db.query(models.User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_admin = True
    db.commit()
    db.refresh(user)
    return user
