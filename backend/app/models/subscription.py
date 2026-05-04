# app/models/subscription.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.core.database import Base

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    lemon_customer_id = Column(String, nullable=True)
    lemon_subscription_id = Column(String, nullable=True)

    status = Column(String)  # active, cancelled, expired, etc
    is_pro = Column(Boolean, default=False)