from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from app.database import Base

class SamadhanDossier(Base):
    __tablename__ = "samadhan_dossiers"

    id = Column(Integer, primary_key=True, index=True)
    dossier_number = Column(String(50), unique=True, index=True)  # e.g. MSEFC-SAMADHAN-2026-001
    vendor_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    invoice_ids = Column(JSON, nullable=False)  # List[int]
    total_principal = Column(Float, nullable=False)
    total_interest = Column(Float, nullable=False)
    total_claim_amount = Column(Float, nullable=False)
    udyam_reg_number = Column(String(50), nullable=False)
    filing_status = Column(String(50), default="DRAFT_READY")  # DRAFT_READY, SUBMITTED_TO_PORTAL, CONCILIATION_PENDING
    form_data = Column(JSON, nullable=False)  # Complete Form-1 JSON
    pdf_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    vendor = relationship("Company", foreign_keys=[vendor_id])
    buyer = relationship("Company", foreign_keys=[buyer_id])
