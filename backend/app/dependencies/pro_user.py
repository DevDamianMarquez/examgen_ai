# app/dependencies/pro_user.py
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.subscription import Subscription
from app.routers.auth import get_current_user

def require_pro_user(
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sub = db.query(Subscription).filter(
        Subscription.user_id == user.id,
        Subscription.is_pro == True,
        Subscription.status == "active"
    ).first()

    if not sub:
        raise HTTPException(403, "Pro subscription required")

    return user
