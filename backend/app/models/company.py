import enum
from sqlalchemy import Column, Integer, String, Float, Enum, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class CompanyRole(str, enum.Enum):
    VENDOR = "VENDOR"
    BUYER = "BUYER"

class EnterpriseCategory(str, enum.Enum):
    MICRO = "MICRO"
    SMALL = "SMALL"
    MEDIUM = "MEDIUM"

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    gstin = Column(String(15), unique=True, nullable=False, index=True)
    udyam_reg_number = Column(String(30), nullable=True)  # Micro/Small Udyam Reg
    role = Column(Enum(CompanyRole), default=CompanyRole.BUYER, nullable=False)
    enterprise_category = Column(Enum(EnterpriseCategory), default=EnterpriseCategory.MICRO, nullable=False)
    credit_limit = Column(Float, default=1000000.0)  # INR
    contact_person = Column(String(100), nullable=True)
    email = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=True)
    corporate_tax_rate = Column(Float, default=0.30)  # Default 30% for corporates
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    issued_invoices = relationship("Invoice", back_populates="vendor", foreign_keys="Invoice.vendor_id")
    received_invoices = relationship("Invoice", back_populates="buyer", foreign_keys="Invoice.buyer_id")
    linked_orders_vendor = relationship("LinkedOrder", back_populates="vendor", foreign_keys="LinkedOrder.vendor_id")
    linked_orders_buyer = relationship("LinkedOrder", back_populates="buyer", foreign_keys="LinkedOrder.buyer_id")
