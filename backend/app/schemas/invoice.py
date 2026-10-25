from pydantic import BaseModel
from typing import Optional, Any, Dict, List
from datetime import date, datetime

class InvoiceBase(BaseModel):
    invoice_number: str
    vendor_id: int
    buyer_id: int
    principal_amount: float
    invoice_date: date
    due_date: date
    delivery_date: Optional[date] = None
    po_number: Optional[str] = None
    goods_description: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceRead(InvoiceBase):
    id: int
    paid_amount: float
    status: str
    document_health_score: float
    legal_health_score: Optional[float] = 0.0
    ocr_details: Optional[Dict[str, Any]] = None
    po_file_url: Optional[str] = None
    pod_file_url: Optional[str] = None
    
    # 15-Day Deemed Acceptance Lock
    deemed_acceptance_date: Optional[date] = None
    deemed_acceptance_clause: Optional[str] = None
    deemed_acceptance_info: Optional[Dict[str, Any]] = None
    acceptance_audit_log: Optional[Dict[str, Any]] = None
    
    # Dual-Rail Financing
    financing_rail: Optional[str] = "NONE"
    financing_status: Optional[str] = "NOT_REQUESTED"
    financing_failover_date: Optional[datetime] = None
    financing_details: Optional[Dict[str, Any]] = None

    portal_token: str
    created_at: Optional[datetime] = None
    vendor_name: Optional[str] = None
    buyer_name: Optional[str] = None
    days_overdue: Optional[int] = 0
    section_43bh_tax_exposure: Optional[float] = 0.0
    section_16_interest: Optional[float] = 0.0
    
    # Safeguard Context
    buyer_is_tax_loss: Optional[bool] = False
    vendor_major_activity: Optional[str] = "MANUFACTURING"
    vendor_enterprise_class: Optional[str] = "MICRO"
    sec_43bh_eligible: Optional[bool] = True

    class Config:
        from_attributes = True

class DocumentHealthCheckResponse(BaseModel):
    invoice_number: str
    score: float
    health_grade: str
    grade_label: str
    color: str
    checkpoints: List[Dict[str, Any]]
    recommendation: str

class DualRailRequest(BaseModel):
    invoice_id: int
    preferred_rail: str = "AUTO"  # AUTO, RAIL_1_TREDS, RAIL_2_NBFC

class DualRailResponse(BaseModel):
    request_id: str
    invoice_id: int
    invoice_number: str
    principal_amount: float
    active_rail: str
    status: str
    applied_discount_rate_pa: float
    discount_deduction: float
    platform_fee: float
    net_immediate_disbursal: float
    initiated_at: str
    failover_deadline: str
    rail_1_approval_days_remaining: int
    safeguard_explanation: str
