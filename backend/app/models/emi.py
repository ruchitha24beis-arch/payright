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
    
    # Milestone release units unlocked upon payment of this installment
    units_to_release = Column(Integer, default=0)
    units_released_flag = Column(Boolean, default=False)

    plan = relationship("EMIPlan", back_populates="schedules")
