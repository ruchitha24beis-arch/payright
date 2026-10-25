import enum
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    FINANCE_HEAD = "FINANCE_HEAD"
    ACCOUNTS_RECEIVABLE = "ACCOUNTS_RECEIVABLE"
    BUYER_ACCOUNTANT = "BUYER_ACCOUNTANT"
    SUPPLIER = "SUPPLIER"
    BUYER = "BUYER"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.ACCOUNTS_RECEIVABLE)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", backref="users")
