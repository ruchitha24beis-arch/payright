from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CompanyBase(BaseModel):
    name: str
    gstin: str
    udyam_reg_number: Optional[str] = None
    role: str
    enterprise_category: str = "MICRO"
    credit_limit: float = 1000000.0
    contact_person: Optional[str] = None
    email: str
    phone: Optional[str] = None
    corporate_tax_rate: float = 0.30

class CompanyCreate(CompanyBase):
    pass

class CompanyRead(CompanyBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
