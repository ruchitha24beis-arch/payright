import enum
from sqlalchemy import Column, Integer, String, Float, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class ReleaseRule(str, enum.Enum):
    PRO_RATA = "PRO_RATA"                 # Units released in proportion to EMI amount paid
    MILESTONE_LOCK = "MILESTONE_LOCK"     # Fixed batch released when installment cleared

class OrderStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    HOLD_CREDIT_BREACH = "HOLD_CREDIT_BREACH"
    COMPLETED = "COMPLETED"

class LinkedOrder(Base):
    __tablename__ = "linked_orders"

    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String(100), nullable=False, index=True)
    vendor_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    item_description = Column(String(255), nullable=False)
    total_units = Column(Integer, nullable=False)
    units_released = Column(Integer, default=0)
    
    release_rule = Column(Enum(ReleaseRule), default=ReleaseRule.PRO_RATA, nullable=False)
    units_per_emi_payment = Column(Integer, default=0)
    
    unit_price = Column(Float, default=1000.0)
    total_order_value = Column(Float, default=0.0)
    status = Column(Enum(OrderStatus), default=OrderStatus.ACTIVE, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    vendor = relationship("Company", foreign_keys=[vendor_id], back_populates="linked_orders_vendor")
    buyer = relationship("Company", foreign_keys=[buyer_id], back_populates="linked_orders_buyer")
    emi_plans = relationship("EMIPlan", back_populates="linked_order")
