from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date
from typing import Dict, Any

from app.database import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.models.company import Company
from app.models.emi import EMIPlan, EMISchedule, EMIPlanStatus
from app.engines.compliance import calculate_section_43bh_exposure, calculate_section_16_interest

router = APIRouter(prefix="/guest/portal", tags=["Whitelabel Corporate Buyer Portal"])

@router.get("/{token}")
async def get_guest_portal_view(token: str, db: AsyncSession = Depends(get_db)):
    """
    GET /api/v1/guest/portal/{token}:
    Tokenized public link for corporate buyer accounting teams to view tax savings,
    claim early-payment discounts, or approve EMI plans.
    """
    stmt = select(Invoice).where(Invoice.portal_token == token)
    invoice = (await db.execute(stmt)).scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invalid or expired guest portal link")

    vendor = await db.get(Company, invoice.vendor_id)
    buyer = await db.get(Company, invoice.buyer_id)

    today = date.today()
    days_overdue = max(0, (today - invoice.due_date).days)
    tax_info = calculate_section_43bh_exposure(invoice.principal_amount, buyer.corporate_tax_rate if buyer else 0.30)
    interest_info = calculate_section_16_interest(invoice.principal_amount, days_overdue)

    # Fetch any existing EMI plan
    e_stmt = select(EMIPlan).where(EMIPlan.invoice_id == invoice.id).order_by(EMIPlan.created_at.desc())
    emi_plan = (await db.execute(e_stmt)).scalars().first()

    emi_plan_data = None
    if emi_plan:
        s_stmt = select(EMISchedule).where(EMISchedule.plan_id == emi_plan.id).order_by(EMISchedule.installment_number)
        schedules = (await db.execute(s_stmt)).scalars().all()
        emi_plan_data = {
            "id": emi_plan.id,
            "total_installments": emi_plan.total_installments,
            "cash_discount_percent": emi_plan.cash_discount_percent,
            "original_principal": emi_plan.original_principal,
            "discounted_principal": emi_plan.discounted_principal,
            "amount_per_installment": emi_plan.amount_per_installment,
            "status": emi_plan.status.value,
            "schedules": [
                {
                    "installment_number": s.installment_number,
                    "due_date": s.due_date,
                    "amount": s.amount,
                    "status": s.status.value,
                    "units_to_release": s.units_to_release
                } for s in schedules
            ]
        }

    # Available cash discount offer (2.5% prompt settlement incentive)
    prompt_discount_pct = 2.5
    prompt_discount_amount = round(invoice.principal_amount * (prompt_discount_pct / 100.0), 2)
    net_prompt_settlement = round(invoice.principal_amount - prompt_discount_amount, 2)

    return {
        "portal_token": token,
        "invoice": {
            "id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "principal_amount": invoice.principal_amount,
            "paid_amount": invoice.paid_amount,
            "balance_due": round(invoice.principal_amount - invoice.paid_amount, 2),
            "invoice_date": invoice.invoice_date,
            "due_date": invoice.due_date,
            "delivery_date": invoice.delivery_date,
            "status": invoice.status.value,
            "po_number": invoice.po_number,
            "goods_description": invoice.goods_description,
            "document_health_score": invoice.document_health_score,
            "po_file_url": invoice.po_file_url,
            "pod_file_url": invoice.pod_file_url
        },
        "vendor": {
            "name": vendor.name if vendor else "Supplier MSME",
            "gstin": vendor.gstin if vendor else "",
            "udyam_reg_number": vendor.udyam_reg_number if vendor else "UDYAM-XX-00-0000000",
            "category": vendor.enterprise_category.value if vendor else "MICRO",
            "contact_email": vendor.email if vendor else ""
        },
        "buyer": {
            "name": buyer.name if buyer else "Corporate Buyer",
            "gstin": buyer.gstin if buyer else "",
            "credit_limit": buyer.credit_limit if buyer else 0.0
        },
        "compliance": {
            "days_overdue": days_overdue,
            "section_43bh": tax_info,
            "section_16_interest": interest_info,
            "tax_banner_headline": f"Clear invoice to preserve ₹{tax_info['total_tax_cash_penalty']:,.2f} in corporate tax deductions under Sec 43B(h)",
            "tax_banner_subtext": f"Under Section 43B(h), unpaid MSME dues are disallowed as business expense for FY 2024-25, adding ₹{invoice.principal_amount:,.2f} back to your corporate taxable income."
        },
        "early_discount_offer": {
            "discount_percent": prompt_discount_pct,
            "discount_amount": prompt_discount_amount,
            "net_payable": net_prompt_settlement,
            "expiry_days": 5
        },
        "active_emi_plan": emi_plan_data
    }

@router.post("/{token}/action")
async def execute_portal_action(
    token: str,
    action: str = Body(..., embed=True),  # 'ACCEPT_EMI', 'SUBMIT_PAYMENT', 'REQUEST_RECONCILIATION'
    payment_reference: str = Body(None, embed=True),
    payment_amount: float = Body(None, embed=True),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Invoice).where(Invoice.portal_token == token)
    invoice = (await db.execute(stmt)).scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invalid token")

    if action == "ACCEPT_EMI":
        e_stmt = select(EMIPlan).where(EMIPlan.invoice_id == invoice.id)
        emi_plan = (await db.execute(e_stmt)).scalars().first()
        if emi_plan:
            emi_plan.status = EMIPlanStatus.ACCEPTED
            invoice.status = InvoiceStatus.PARTIAL_EMI
            await db.commit()
            return {"status": "SUCCESS", "message": "EMI Plan officially accepted by Buyer Treasury"}
        else:
            raise HTTPException(status_code=400, detail="No pending EMI plan to accept")

    elif action == "SUBMIT_PAYMENT":
        amount = payment_amount or (invoice.principal_amount - invoice.paid_amount)
        invoice.paid_amount = round(invoice.paid_amount + amount, 2)
        if invoice.paid_amount >= invoice.principal_amount:
            invoice.status = InvoiceStatus.PAID
        await db.commit()
        return {
            "status": "SUCCESS",
            "message": f"Payment remittance advice of ₹{amount:,.2f} logged under reference {payment_reference or 'NEFT-PROCESSED'}.",
            "new_balance": round(invoice.principal_amount - invoice.paid_amount, 2),
            "invoice_status": invoice.status.value
        }

    return {"status": "SUCCESS", "message": f"Action {action} processed"}
