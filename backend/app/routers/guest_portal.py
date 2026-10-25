from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date, datetime
from typing import Dict, Any, Optional

from app.database import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.models.company import Company
from app.models.emi import EMIPlan, EMISchedule, EMIPlanStatus, ENACHMandateStatus
from app.engines.compliance_engine import get_tailored_compliance_advisory
from app.engines.invoice_lock_engine import InvoiceLockEngine

router = APIRouter(prefix="/guest/portal", tags=["Whitelabel Corporate Buyer Portal"])

@router.get("/{token}")
async def get_guest_portal_view(token: str, db: AsyncSession = Depends(get_db)):
    """
    GET /api/v1/guest/portal/{token}:
    Tokenized public link for corporate buyer accounting teams to view tax savings,
    claim early-payment discounts, approve EMI plans, authenticate e-NACH mandates, 
    and accept TReDS financing.
    """
    stmt = select(Invoice).where(Invoice.portal_token == token)
    invoice = (await db.execute(stmt)).scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invalid or expired guest portal link")

    vendor = await db.get(Company, invoice.vendor_id)
    buyer = await db.get(Company, invoice.buyer_id)

    today = date.today()
    days_overdue = max(0, (today - invoice.due_date).days)
    
    buyer_tax_loss = buyer.is_tax_loss if buyer else False
    vendor_activity = vendor.major_activity.value if (vendor and hasattr(vendor.major_activity, "value")) else "MANUFACTURING"
    vendor_class = vendor.enterprise_class.value if (vendor and hasattr(vendor.enterprise_class, "value")) else "MICRO"

    # Dynamic compliance analysis with loophole safeguards
    advisory = get_tailored_compliance_advisory(
        principal=invoice.principal_amount,
        days_overdue=days_overdue,
        corporate_tax_rate=buyer.corporate_tax_rate if buyer else 0.30,
        buyer_is_tax_loss=buyer_tax_loss,
        vendor_major_activity=vendor_activity,
        vendor_enterprise_class=vendor_class
    )

    # 15-Day Deemed Acceptance evaluation
    delivery = invoice.delivery_date or invoice.invoice_date
    lock_info = InvoiceLockEngine.evaluate_acceptance_lock(delivery, invoice.status.value, today)

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
            "enach_mandate_status": emi_plan.enach_mandate_status.value if hasattr(emi_plan.enach_mandate_status, "value") else str(emi_plan.enach_mandate_status),
            "umrn": emi_plan.umrn,
            "mandate_auth_url": emi_plan.mandate_auth_url,
            "mandate_bank_name": emi_plan.mandate_bank_name,
            "mandate_account_last4": emi_plan.mandate_account_last4,
            "sec25_liability_acknowledged": emi_plan.sec25_liability_acknowledged,
            "schedules": [
                {
                    "installment_number": s.installment_number,
                    "due_date": s.due_date,
                    "amount": s.amount,
                    "status": s.status.value,
                    "enach_execution_status": s.enach_execution_status,
                    "units_to_release": s.units_to_release
                } for s in schedules
            ]
        }

    # Available prompt cash discount offer (2.5% prompt settlement incentive)
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
            "legal_health_score": invoice.legal_health_score or invoice.document_health_score,
            "po_file_url": invoice.po_file_url,
            "pod_file_url": invoice.pod_file_url,
            "financing_rail": invoice.financing_rail,
            "financing_status": invoice.financing_status,
            "deemed_acceptance": lock_info,
            "deemed_acceptance_clause": invoice.deemed_acceptance_clause,
            "acceptance_audit_log": invoice.acceptance_audit_log
        },
        "vendor": {
            "name": vendor.name if vendor else "Supplier MSME",
            "gstin": vendor.gstin if vendor else "",
            "udyam_reg_number": vendor.udyam_reg_number if vendor else "UDYAM-XX-00-0000000",
            "category": vendor.enterprise_class.value if vendor else "MICRO",
            "major_activity": vendor.major_activity.value if vendor else "MANUFACTURING",
            "sec_43bh_eligible": advisory["vendor_eligible_43bh"],
            "contact_email": vendor.email if vendor else ""
        },
        "buyer": {
            "name": buyer.name if buyer else "Corporate Buyer",
            "gstin": buyer.gstin if buyer else "",
            "credit_limit": buyer.credit_limit if buyer else 0.0,
            "is_tax_loss": buyer_tax_loss
        },
        "compliance": {
            "days_overdue": days_overdue,
            "primary_safeguard_mode": advisory["primary_safeguard_mode"],
            "buyer_is_tax_loss": buyer_tax_loss,
            "vendor_eligible_43bh": advisory["vendor_eligible_43bh"],
            "section_43bh": advisory["section_43bh"],
            "section_16_interest": advisory["section_16_interest"],
            "tax_banner_headline": advisory["tax_banner_headline"],
            "tax_banner_subtext": advisory["tax_banner_subtext"],
            "total_buyer_avoidable_loss": advisory["total_buyer_avoidable_loss"]
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
    action: str = Body(..., embed=True),  # 'ACCEPT_EMI', 'AUTHORIZE_ENACH', 'APPROVE_TREDS', 'SUBMIT_PAYMENT'
    payment_reference: str = Body(None, embed=True),
    payment_amount: float = Body(None, embed=True),
    bank_name: str = Body(None, embed=True),
    account_last4: str = Body(None, embed=True),
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
            return {"status": "SUCCESS", "message": "EMI Plan accepted. e-NACH mandate awaiting authorization."}
        else:
            raise HTTPException(status_code=400, detail="No pending EMI plan to accept")

    elif action == "AUTHORIZE_ENACH":
        e_stmt = select(EMIPlan).where(EMIPlan.invoice_id == invoice.id)
        emi_plan = (await db.execute(e_stmt)).scalars().first()
        if emi_plan:
            emi_plan.enach_mandate_status = ENACHMandateStatus.ACTIVE
            emi_plan.sec25_liability_acknowledged = True
            emi_plan.status = EMIPlanStatus.ACTIVE
            emi_plan.mandate_authorized_at = datetime.utcnow()
            if bank_name:
                emi_plan.mandate_bank_name = bank_name
            if account_last4:
                emi_plan.mandate_account_last4 = account_last4
            invoice.status = InvoiceStatus.PARTIAL_EMI
            await db.commit()
            return {
                "status": "SUCCESS", 
                "message": f"e-NACH Auto-Debit Mandate {emi_plan.umrn} authorized under Section 25 PSSA 2007."
            }
        else:
            raise HTTPException(status_code=400, detail="No EMI plan found for e-NACH authorization")

    elif action == "APPROVE_TREDS":
        invoice.financing_rail = "RAIL_1_TREDS"
        invoice.financing_status = "RAIL_1_APPROVED_DISBURSED"
        invoice.status = InvoiceStatus.DISCOUNTED_TREDS
        # Simulate credit to MSME
        discount_fee = invoice.principal_amount * (8.1 / 100.0) * (60 / 365.0)
        invoice.paid_amount = round(invoice.principal_amount - discount_fee - 1500.0, 2)
        await db.commit()
        return {
            "status": "SUCCESS",
            "message": "Corporate Buyer approved invoice on TReDS (Rail 1). Institutional exchange funds disbursed to vendor."
        }

    elif action == "SUBMIT_PAYMENT":
        import re
        ref = (payment_reference or "").strip()
        if not re.match(r"^[A-Za-z0-9]{12,22}$", ref):
            raise HTTPException(
                status_code=400,
                detail="Please enter a valid 12–22 character UTR/NEFT/RTGS number."
            )
        amount = payment_amount or (invoice.principal_amount - invoice.paid_amount)
        invoice.paid_amount = round(invoice.paid_amount + amount, 2)
        if invoice.paid_amount >= invoice.principal_amount:
            invoice.status = InvoiceStatus.PAID
        await db.commit()
        return {
            "status": "SUCCESS",
            "message": f"Payment remittance advice of ₹{amount:,.2f} logged under reference {ref.upper()}.",
            "new_balance": round(invoice.principal_amount - invoice.paid_amount, 2),
            "invoice_status": invoice.status.value,
            "payment_reference": ref.upper()
        }

    return {"status": "SUCCESS", "message": f"Action {action} processed"}
