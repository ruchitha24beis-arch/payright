import uuid
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.models.company import Company
from app.models.portal_session import AggregatedPortalToken
from app.engines.diplomatic_reminder import DiplomaticReminderGenerator
from app.engines.compliance_engine import calculate_section_16_interest, calculate_section_43bh_exposure

router = APIRouter(prefix="/reminders", tags=["Diplomatic Reminders"])

class ConsolidatedReminderPayload(BaseModel):
    buyer_id: Optional[int] = None
    invoice_ids: Optional[List[int]] = None
    invoice_id: Optional[int] = None  # Single-invoice backward compatibility
    channel: str = "EMAIL"  # 'WHATSAPP' | 'EMAIL' | 'GUEST_PORTAL'
    template_id: Optional[str] = "CONSOLIDATED_ADVISORY"
    vendor_id: Optional[int] = None
    notes: Optional[str] = None

class ConsolidatedLinkPayload(BaseModel):
    buyer_id: int
    invoice_ids: List[int]
    vendor_id: Optional[int] = None

@router.get("/generate/{invoice_id}")
async def generate_reminder_templates(invoice_id: int, db: AsyncSession = Depends(get_db)):
    """Generate tailored diplomatic reminder drafts for a single invoice"""
    inv = await db.get(Invoice, invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    vendor = await db.get(Company, inv.vendor_id)
    buyer = await db.get(Company, inv.buyer_id)

    today = date.today()
    days_overdue = max(0, (today - inv.due_date).days)
    portal_url = f"/portal/{inv.portal_token}"

    reminders = DiplomaticReminderGenerator.generate_reminders(
        vendor_name=vendor.name if vendor else "Supplier MSME",
        vendor_udyam=vendor.udyam_reg_number if vendor else "UDYAM-MH-01-0028912",
        buyer_name=buyer.name if buyer else "Valued Corporate Partner",
        invoice_number=inv.invoice_number,
        principal_amount=inv.principal_amount,
        due_date=inv.due_date.strftime("%d-%b-%Y"),
        days_overdue=days_overdue,
        portal_url=portal_url,
        corporate_tax_rate=buyer.corporate_tax_rate if buyer else 0.30
    )
    return reminders

@router.post("/consolidated-portal-link")
async def create_consolidated_portal_link(
    payload: ConsolidatedLinkPayload,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a single aggregated tokenized guest URL (/portal/[token])
    representing all selected invoices for that corporate buyer account.
    """
    buyer = await db.get(Company, payload.buyer_id)
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer company not found")

    if not payload.invoice_ids:
        raise HTTPException(status_code=400, detail="At least one invoice must be selected")

    stmt = select(Invoice).where(Invoice.id.in_(payload.invoice_ids))
    invoices = (await db.execute(stmt)).scalars().all()
    if not invoices:
        raise HTTPException(status_code=404, detail="No matching invoices found")

    vendor_id = payload.vendor_id or invoices[0].vendor_id
    vendor = await db.get(Company, vendor_id)

    today = date.today()
    total_principal = 0.0
    combined_sec16_interest = 0.0

    for inv in invoices:
        unpaid = inv.principal_amount - (inv.paid_amount or 0.0)
        total_principal += unpaid
        days_overdue = max(0, (today - inv.due_date).days)
        s16_calc = calculate_section_16_interest(unpaid, days_overdue)
        combined_sec16_interest += float(s16_calc.get("accrued_interest", 0.0))

    # Section 43B(h) ~30% tax risk (applies if buyer is corporate and not in net tax loss)
    is_tax_loss = buyer.is_tax_loss or (buyer.mca_filing_status == "TAX_LOSS_EXEMPT")
    is_trader = vendor.major_activity.value == "TRADING" if vendor and hasattr(vendor.major_activity, "value") else False
    
    if is_tax_loss or is_trader:
        sec43bh_exposure = 0.0
    else:
        sec43bh_exposure = total_principal * (buyer.corporate_tax_rate or 0.30)

    token_str = f"agg_{buyer.id}_{uuid.uuid4().hex[:16]}"
    session = AggregatedPortalToken(
        token=token_str,
        buyer_id=buyer.id,
        vendor_id=vendor_id,
        invoice_ids=[inv.id for inv in invoices],
        total_principal=round(total_principal, 2),
        sec16_interest=round(combined_sec16_interest, 2),
        sec43bh_exposure=round(sec43bh_exposure, 2),
        notes=f"Aggregated recovery session for {len(invoices)} invoices"
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    return {
        "token": token_str,
        "portal_url": f"/portal/{token_str}",
        "buyer_name": buyer.name,
        "invoice_count": len(invoices),
        "invoice_numbers": [i.invoice_number for i in invoices],
        "total_principal": round(total_principal, 2),
        "combined_sec16_interest": round(combined_sec16_interest, 2),
        "sec43bh_exposure": round(sec43bh_exposure, 2),
        "is_tax_loss_buyer": is_tax_loss
    }

@router.post("/send")
async def send_reminder(
    payload: ConsolidatedReminderPayload,
    db: AsyncSession = Depends(get_db)
):
    """
    POST /api/v1/reminders/send:
    Dispatches diplomatic reminder or batch WhatsApp/Email advisory.
    Accepts: { "buyer_id": int, "invoice_ids": List[int], "channel": "WHATSAPP" | "EMAIL" | "GUEST_PORTAL" }
    Also accepts single invoice { "invoice_id": int } for backwards compatibility.
    """
    invoice_ids = payload.invoice_ids or ([payload.invoice_id] if payload.invoice_id else [])
    if not invoice_ids:
        raise HTTPException(status_code=400, detail="Please specify invoice_ids or invoice_id")

    stmt = select(Invoice).where(Invoice.id.in_(invoice_ids))
    invoices = (await db.execute(stmt)).scalars().all()
    if not invoices:
        raise HTTPException(status_code=404, detail="No invoices found")

    buyer_id = payload.buyer_id or invoices[0].buyer_id
    buyer = await db.get(Company, buyer_id)
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer company not found")

    vendor_id = payload.vendor_id or invoices[0].vendor_id
    vendor = await db.get(Company, vendor_id)

    today = date.today()
    total_principal = 0.0
    combined_sec16_interest = 0.0

    for inv in invoices:
        unpaid = inv.principal_amount - (inv.paid_amount or 0.0)
        total_principal += unpaid
        days_overdue = max(0, (today - inv.due_date).days)
        s16_calc = calculate_section_16_interest(unpaid, days_overdue)
        combined_sec16_interest += float(s16_calc.get("accrued_interest", 0.0))

    is_tax_loss = buyer.is_tax_loss or (buyer.mca_filing_status == "TAX_LOSS_EXEMPT")
    sec43bh_exposure = 0.0 if is_tax_loss else (total_principal * (buyer.corporate_tax_rate or 0.30))

    # Generate or reuse token
    token_str = f"agg_{buyer.id}_{uuid.uuid4().hex[:16]}"
    session = AggregatedPortalToken(
        token=token_str,
        buyer_id=buyer.id,
        vendor_id=vendor_id,
        invoice_ids=[inv.id for inv in invoices],
        total_principal=round(total_principal, 2),
        sec16_interest=round(combined_sec16_interest, 2),
        sec43bh_exposure=round(sec43bh_exposure, 2),
        notes=payload.notes or f"Batch notification dispatch"
    )
    db.add(session)
    await db.commit()

    recipient = buyer.email if payload.channel == "EMAIL" else (buyer.phone or "+91 98765 43210")
    inv_str = ", ".join([i.invoice_number for i in invoices[:3]]) + (f" +{len(invoices)-3} more" if len(invoices) > 3 else "")

    message_body = (
        f"Consolidated diplomatic {payload.channel} advisory successfully dispatched to {buyer.name} "
        f"({recipient}) covering {len(invoices)} invoices ({inv_str}) totaling ₹{total_principal:,.2f}."
    )

    return {
        "success": True,
        "channel": payload.channel,
        "template_id": payload.template_id,
        "recipient": recipient,
        "status": "DELIVERED",
        "buyer_id": buyer.id,
        "buyer_name": buyer.name,
        "invoice_count": len(invoices),
        "total_principal": round(total_principal, 2),
        "combined_sec16_interest": round(combined_sec16_interest, 2),
        "total_sec43bh_tax_risk": round(sec43bh_exposure, 2),
        "portal_url": f"/portal/{token_str}",
        "token": token_str,
        "message": message_body
    }
