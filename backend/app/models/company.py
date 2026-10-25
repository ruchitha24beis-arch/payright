import enum
from sqlalchemy import Column, Integer, String, Float, Enum, DateTime, Boolean, JSON
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

class MajorActivity(str, enum.Enum):
    MANUFACTURING = "MANUFACTURING"
    SERVICES = "SERVICES"
    TRADING = "TRADING"

# Alias for EnterpriseCategory as EnterpriseClass per master prompt
EnterpriseClass = EnterpriseCategory

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    gstin = Column(String(15), unique=True, nullable=False, index=True)
    udyam_reg_number = Column(String(30), nullable=True)  # Micro/Small Udyam Reg
    udyam_verified = Column(Boolean, default=False, nullable=False)
    udyam_verified_at = Column(DateTime, nullable=True)
    udyam_data = Column(JSON, nullable=True)

    role = Column(Enum(CompanyRole), default=CompanyRole.BUYER, nullable=False)
    enterprise_category = Column(Enum(EnterpriseCategory), default=EnterpriseCategory.MICRO, nullable=False)
    enterprise_class = Column(Enum(EnterpriseClass), default=EnterpriseClass.MICRO, nullable=False)
    major_activity = Column(Enum(MajorActivity), default=MajorActivity.MANUFACTURING, nullable=False)
    
    credit_limit = Column(Float, default=1000000.0)  # INR
    is_tax_loss = Column(Boolean, default=False, nullable=False)  # Net tax loss status (disables 43B(h) and triggers Sec 16)
    
    contact_person = Column(String(100), nullable=True)
    email = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=True)
    bank_account_number = Column(String(50), nullable=True)
    bank_ifsc = Column(String(20), nullable=True)
    corporate_tax_rate = Column(Float, default=0.30)  # Default 30% for corporates
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    issued_invoices = relationship("Invoice", back_populates="vendor", foreign_keys="Invoice.vendor_id")
    received_invoices = relationship("Invoice", back_populates="buyer", foreign_keys="Invoice.buyer_id")
    linked_orders_vendor = relationship("LinkedOrder", back_populates="vendor", foreign_keys="LinkedOrder.vendor_id")
    linked_orders_buyer = relationship("LinkedOrder", back_populates="buyer", foreign_keys="LinkedOrder.buyer_id")
