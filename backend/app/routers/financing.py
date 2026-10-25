from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, Optional
from datetime import datetime

from app.database import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.models.company import Company
from app.schemas.invoice import DualRailRequest, DualRailResponse
from app.engines.dual_rail_financing import DualRailFinancingEngine

router = APIRouter(prefix="/financing", tags=["Dual-Rail Financing (TReDS & NBFC)"])

@router.post("/dual-rail-request", response_model=DualRailResponse)
async def request_dual_rail_financing(
    payload: DualRailRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    POST /api/v1/financing/dual-rail-request:
    Initiates invoice discounting via TReDS (Rail 1) with automatic 7-day failover 
    to Private NBFC Anchor Financing (Rail 2) if the buyer delays approval.
    """
    inv = await db.get(Invoice, payload.invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    buyer = await db.get(Company, inv.buyer_id)
    
    financing_result = DualRailFinancingEngine.initiate_dual_rail(
        invoice_number=inv.invoice_number,
        principal_amount=inv.principal_amount,
        buyer_name=buyer.name if buyer else "Corporate Buyer",
        document_health_score=inv.document_health_score or 80.0,
        preferred_rail=payload.preferred_rail
    )

    inv.financing_rail = financing_result["active_rail"]
    inv.financing_status = financing_result["status"]
    inv.financing_failover_date = datetime.fromisoformat(financing_result["failover_deadline"])
    inv.financing_details = financing_result

    if financing_result["active_rail"] == "RAIL_1_TREDS":
        inv.status = InvoiceStatus.PENDING  # Pending buyer approval on TReDS
    else:
        inv.status = InvoiceStatus.DISCOUNTED_TREDS
        inv.paid_amount = financing_result["net_immediate_disbursal"]

    await db.commit()
    await db.refresh(inv)

    return DualRailResponse(
        request_id=financing_result["request_id"],
        invoice_id=inv.id,
        invoice_number=inv.invoice_number,
        principal_amount=inv.principal_amount,
        active_rail=financing_result["active_rail"],
        status=financing_result["status"],
        applied_discount_rate_pa=financing_result["applied_discount_rate_pa"],
        discount_deduction=financing_result["discount_deduction"],
        platform_fee=financing_result["platform_fee"],
        net_immediate_disbursal=financing_result["net_immediate_disbursal"],
        initiated_at=financing_result["initiated_at"],
        failover_deadline=financing_result["failover_deadline"],
        rail_1_approval_days_remaining=financing_result["rail_1_approval_days_remaining"],
        safeguard_explanation=financing_result["safeguard_explanation"]
    )

@router.get("/status/{invoice_id}")
async def get_dual_rail_status(invoice_id: int, db: AsyncSession = Depends(get_db)):
    inv = await db.get(Invoice, invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    failover_eval = DualRailFinancingEngine.evaluate_rail_failover(
        initiated_at=inv.financing_failover_date or inv.created_at,
        current_rail=inv.financing_rail,
        is_buyer_approved=False,
        document_health_score=inv.document_health_score or 75.0
    )

    return {
        "invoice_id": inv.id,
        "invoice_number": inv.invoice_number,
        "current_rail": inv.financing_rail,
        "financing_status": inv.financing_status,
        "failover_details": failover_eval,
        "stored_details": inv.financing_details
    }

@router.post("/force-failover/{invoice_id}")
async def trigger_force_failover(invoice_id: int, db: AsyncSession = Depends(get_db)):
    """
    Manually triggers failover to Rail 2 (Private NBFC) if buyer is unresponsive on TReDS.
    """
    inv = await db.get(Invoice, invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    inv.financing_rail = "RAIL_2_NBFC"
    inv.financing_status = "RAIL_2_ACTIVE"
    inv.status = InvoiceStatus.DISCOUNTED_TREDS
    
    # Calculate NBFC disbursal amount at 10.8%
    discount_fee = inv.principal_amount * (10.8 / 100.0) * (60 / 365.0)
    net_disbursal = round(inv.principal_amount - discount_fee - 2000.0, 2)
    inv.paid_amount = net_disbursal

    inv.financing_details = {
        **(inv.financing_details or {}),
        "manual_failover_at": datetime.utcnow().isoformat(),
        "reason": "Buyer unresponsive on TReDS. MSME activated Rail 2 Private NBFC Anchor Financing.",
        "net_disbursal": net_disbursal
    }

    await db.commit()
    return {
        "status": "SUCCESS",
        "message": "Invoice successfully routed to Rail 2 Private NBFC. Disbursal credited without buyer intervention.",
        "invoice_id": inv.id,
        "active_rail": "RAIL_2_NBFC",
        "net_disbursal_amount": net_disbursal
    }
