import enum
from sqlalchemy import Column, Integer, String, Float, Enum, Date, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, date
from app.database import Base

class EMIPlanStatus(str, enum.Enum):
    OFFERED = "OFFERED"
    ACCEPTED = "ACCEPTED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    DEFAULTED = "DEFAULTED"

class EMIScheduleStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    OVERDUE = "OVERDUE"

class ENACHMandateStatus(str, enum.Enum):
    NOT_REGISTERED = "NOT_REGISTERED"
    REGISTERED = "REGISTERED"
    ACTIVE = "ACTIVE"
    BOUNCED = "BOUNCED"

class EMIPlan(Base):
    __tablename__ = "emi_plans"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    linked_order_id = Column(Integer, ForeignKey("linked_orders.id"), nullable=True)

    total_installments = Column(Integer, nullable=False, default=3)  # 2 to 4
    cash_discount_percent = Column(Float, default=2.5)  # e.g., 2% to 5% early cash discount
    original_principal = Column(Float, nullable=False)
    discounted_principal = Column(Float, nullable=False)
    amount_per_installment = Column(Float, nullable=False)

    status = Column(Enum(EMIPlanStatus), default=EMIPlanStatus.OFFERED, nullable=False)
    notes = Column(String(500), nullable=True)
    
    # e-NACH Auto-Debit Mandate (Under Sec 25 Payment and Settlement Systems Act)
    enach_mandate_status = Column(Enum(ENACHMandateStatus), default=ENACHMandateStatus.NOT_REGISTERED, nullable=False)
    umrn = Column(String(50), nullable=True, index=True)  # Unique Mandate Reference Number
    mandate_auth_url = Column(String(500), nullable=True)
    mandate_bank_name = Column(String(100), nullable=True)
    mandate_account_last4 = Column(String(10), nullable=True)
    sec25_liability_acknowledged = Column(Boolean, default=False)
    mandate_authorized_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    invoice = relationship("Invoice", back_populates="emi_plans")
    schedules = relationship("EMISchedule", back_populates="plan", cascade="all, delete-orphan", order_by="EMISchedule.installment_number")
    linked_order = relationship("LinkedOrder", back_populates="emi_plans")

class EMISchedule(Base):
    __tablename__ = "emi_schedules"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("emi_plans.id"), nullable=False)
    installment_number = Column(Integer, nullable=False)
    due_date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    
    status = Column(Enum(EMIScheduleStatus), default=EMIScheduleStatus.PENDING, nullable=False)
    paid_date = Column(Date, nullable=True)
    payment_reference = Column(String(100), nullable=True)
    
    # e-NACH debit execution status
    enach_execution_status = Column(String(50), default="PENDING", nullable=False)  # PENDING, SUCCESS, BOUNCED
    failure_reason = Column(String(255), nullable=True)
    
    # Milestone release units unlocked upon payment of this installment
    units_to_release = Column(Integer, default=0)
    units_released_flag = Column(Boolean, default=False)

    plan = relationship("EMIPlan", back_populates="schedules")
