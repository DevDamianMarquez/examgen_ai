# app/routers/lemonsqueezy_webhook.py
from fastapi import APIRouter, Request, HTTPException
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.subscription import Subscription
from app.models.user import User

router = APIRouter()

@router.post("/webhooks/lemonsqueezy")
async def lemonsqueezy_webhook(request: Request):
    payload = await request.json()

    event = payload.get("meta", {}).get("event_name")
    data = payload.get("data", {}).get("attributes", {})

    db: Session = SessionLocal()

    try:
        if event == "subscription_created":
            email = data["user_email"]
            sub_id = data["id"]
            customer_id = data["customer_id"]

            user = db.query(User).filter(User.email == email).first()
            if not user:
                raise HTTPException(404, "User not found")

            sub = Subscription(
                user_id=user.id,
                lemon_customer_id=customer_id,
                lemon_subscription_id=sub_id,
                status="active",
                is_pro=True
            )
            db.add(sub)
            db.commit()

        elif event == "subscription_cancelled":
            sub_id = data["id"]
            sub = db.query(Subscription).filter(
                Subscription.lemon_subscription_id == sub_id
            ).first()

            if sub:
                sub.status = "cancelled"
                sub.is_pro = False
                db.commit()

    finally:
        db.close()

    return {"ok": True}