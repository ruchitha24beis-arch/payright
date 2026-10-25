from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date, datetime

class EMIScheduleItem(BaseModel):
    id: Optional[int] = None
    installment_number: int
    due_date: date
    amount: float
    status: str = "PENDING"
    paid_date: Optional[date] = None
    payment_reference: Optional[str] = None
    enach_execution_status: Optional[str] = "PENDING"
    failure_reason: Optional[str] = None
    units_to_release: int = 0
    units_released_flag: bool = False

class EMIPlanCreate(BaseModel):
    invoice_id: int
    total_installments: int = 3  # 2 to 4
    cash_discount_percent: float = 2.5  # 0% to 5%
    linked_order_id: Optional[int] = None
    notes: Optional[str] = None
    first_due_date: Optional[date] = None
    enable_enach: bool = True
    bank_name: Optional[str] = "HDFC Bank Ltd"
    account_last4: Optional[str] = "4109"

class EMIPlanResponse(BaseModel):
    id: int
    invoice_id: int
    invoice_number: str
    vendor_name: str
    buyer_name: str
    total_installments: int
    cash_discount_percent: float
    original_principal: float
    discounted_principal: float
    amount_per_installment: float
    status: str
    notes: Optional[str] = None
    
    # e-NACH Mandate & Sec 25 PSSA info
    enach_mandate_status: str = "NOT_REGISTERED"
    umrn: Optional[str] = None
    mandate_auth_url: Optional[str] = None
    mandate_bank_name: Optional[str] = None
    mandate_account_last4: Optional[str] = None
    sec25_liability_acknowledged: bool = False
    sec25_statutory_notice: Optional[str] = None
    
    schedules: List[EMIScheduleItem] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PayInstallmentRequest(BaseModel):
    payment_reference: str
    paid_date: Optional[date] = None

class ENACHAuthRequest(BaseModel):
    umrn: str
    auth_method: str = "NET_BANKING"  # NET_BANKING, AADHAAR_ESIGN, DEBIT_CARD
    bank_name: Optional[str] = None
    account_last4: Optional[str] = None

class ENACHTriggerDebitRequest(BaseModel):
    schedule_id: int
    simulate_bounce: bool = False
