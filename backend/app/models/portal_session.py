import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from app.database import Base

class AggregatedPortalToken(Base):
    __tablename__ = "aggregated_portal_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(64), unique=True, index=True, default=lambda: uuid.uuid4().hex)
    buyer_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    invoice_ids = Column(JSON, nullable=False)  # List[int]
    total_principal = Column(Float, nullable=False, default=0.0)
    sec16_interest = Column(Float, default=0.0)
    sec43bh_exposure = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    buyer = relationship("Company", foreign_keys=[buyer_id])
    vendor = relationship("Company", foreign_keys=[vendor_id])
