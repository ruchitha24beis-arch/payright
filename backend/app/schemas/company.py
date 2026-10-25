from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class CompanyBase(BaseModel):
    name: str
    gstin: str
    udyam_reg_number: Optional[str] = None
    role: str
    enterprise_category: str = "MICRO"
    enterprise_class: str = "MICRO"
    major_activity: str = "MANUFACTURING"
    credit_limit: float = 1000000.0
    annual_turnover: Optional[float] = None
    net_profit_margin: Optional[float] = None
    mca_filing_status: str = "ACTIVE_COMPLIANT"
    total_outstandings: Optional[float] = 0.0
    is_tax_loss: bool = False
    contact_person: Optional[str] = None
    email: str
    phone: Optional[str] = None
    corporate_tax_rate: float = 0.30

class CompanyCreate(CompanyBase):
    pass

class CompanyRead(CompanyBase):
    id: int
    udyam_verified: bool = False
    udyam_verified_at: Optional[datetime] = None
    udyam_data: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UdyamVerifyRequest(BaseModel):
    udyam_reg_number: str
    gstin: Optional[str] = None
    vendor_id: Optional[int] = None
    company_name: Optional[str] = None

class UdyamVerifyResponse(BaseModel):
    udyam_reg_number: str
    is_valid_format: bool
    verification_status: str
    verified_at: str
    enterprise_class: str
    major_activity: str
    sec_43bh_eligible: bool
    loophole_flag: str
    advisory_pivot: str
    policy_reason: str
    profile_details: Dict[str, Any]
    vendor_id: Optional[int] = None
