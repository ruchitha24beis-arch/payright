import enum
import uuid
from sqlalchemy import Column, Integer, String, Float, Enum, Date, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, date
from app.database import Base

class InvoiceStatus(str, enum.Enum):
    PENDING = "PENDING"
    PARTIAL_EMI = "PARTIAL_EMI"
    DISCOUNTED_TREDS = "DISCOUNTED_TREDS"
    PAID = "PAID"
    HOLD_CREDIT_LIMIT = "HOLD_CREDIT_LIMIT"

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)
    vendor_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    principal_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0.0)
    
    invoice_date = Column(Date, nullable=False, default=date.today)
    due_date = Column(Date, nullable=False)
    delivery_date = Column(Date, nullable=True) # POD acceptance date
    
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.PENDING, nullable=False)
    
    # OCR & Document Health
    document_health_score = Column(Float, default=0.0)  # 0.0 to 100.0%
    ocr_details = Column(JSON, nullable=True)
    po_file_url = Column(String(500), nullable=True)
    pod_file_url = Column(String(500), nullable=True)
    po_number = Column(String(100), nullable=True)
    goods_description = Column(String(255), nullable=True)
    
    # Guest Token for corporate buyer direct frictionless portal
    portal_token = Column(String(64), unique=True, index=True, default=lambda: uuid.uuid4().hex)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    vendor = relationship("Company", foreign_keys=[vendor_id], back_populates="issued_invoices")
    buyer = relationship("Company", foreign_keys=[buyer_id], back_populates="received_invoices")
    emi_plans = relationship("EMIPlan", back_populates="invoice", cascade="all, delete-orphan")
