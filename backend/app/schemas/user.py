from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class UserRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "ACCOUNTS_RECEIVABLE"
    
    # Company Profile Details
    company_name: str
    gstin: str
    udyam_reg_number: Optional[str] = None
    enterprise_class: Optional[str] = "MICRO"
    major_activity: Optional[str] = "MANUFACTURING"
    phone: Optional[str] = None
    contact_person: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: str
    password: str

class CompanyUpdateRequest(BaseModel):
    name: Optional[str] = None
    gstin: Optional[str] = None
    udyam_reg_number: Optional[str] = None
    enterprise_class: Optional[str] = None
    major_activity: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    corporate_tax_rate: Optional[float] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    company_id: Optional[int] = None
    company: Optional[Dict[str, Any]] = None
    token: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
