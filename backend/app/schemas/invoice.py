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
    ocr_details: Optional[Dict[str, Any]] = None
    po_file_url: Optional[str] = None
    pod_file_url: Optional[str] = None
    portal_token: str
    created_at: Optional[datetime] = None
    vendor_name: Optional[str] = None
    buyer_name: Optional[str] = None
    days_overdue: Optional[int] = 0
    section_43bh_tax_exposure: Optional[float] = 0.0
    section_16_interest: Optional[float] = 0.0

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
