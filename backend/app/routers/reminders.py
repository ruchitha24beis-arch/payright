from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from typing import Dict, Any

from app.database import get_db
from app.models.invoice import Invoice
from app.models.company import Company
from app.engines.diplomatic_reminder import DiplomaticReminderGenerator

router = APIRouter(prefix="/reminders", tags=["Diplomatic Reminders"])

@router.get("/generate/{invoice_id}")
async def generate_reminder_templates(invoice_id: int, db: AsyncSession = Depends(get_db)):
    inv = await db.get(Invoice, invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    vendor = await db.get(Company, inv.vendor_id)
    buyer = await db.get(Company, inv.buyer_id)

    today = date.today()
    days_overdue = max(0, (today - inv.due_date).days)
    portal_url = f"http://localhost:3000/portal/{inv.portal_token}"

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

@router.post("/send")
async def send_simulated_reminder(
    invoice_id: int = Body(..., embed=True),
    channel: str = Body(..., embed=True),  # 'EMAIL' or 'WHATSAPP'
    template_id: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db)
):
    inv = await db.get(Invoice, invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    buyer = await db.get(Company, inv.buyer_id)
    recipient = buyer.email if channel == "EMAIL" else (buyer.phone or "+91 98765 43210")

    return {
        "success": True,
        "channel": channel,
        "template_id": template_id,
        "recipient": recipient,
        "status": "DELIVERED",
        "message": f"Diplomatic {channel} advisory dispatched seamlessly to {buyer.name}."
    }
