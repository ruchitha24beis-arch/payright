import re
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date, datetime
from typing import Dict, Any, Optional, List

from app.database import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.models.company import Company
from app.models.emi import EMIPlan, EMISchedule, EMIPlanStatus, ENACHMandateStatus
from app.models.portal_session import AggregatedPortalToken
from app.engines.compliance_engine import get_tailored_compliance_advisory, calculate_section_16_interest
from app.engines.invoice_lock_engine import InvoiceLockEngine

router = APIRouter(prefix="/guest/portal", tags=["Whitelabel Corporate Buyer Portal"])

@router.get("/verify/{token}")
async def verify_guest_token(token: str, db: AsyncSession = Depends(get_db)):
    """
    GET /api/v1/guest/portal/verify/{token}:
    Tokenized Guest Portal URL validation that bypasses password login
    for one-click corporate treasury actions.
    """
    # 1. Check Aggregated Portal Tokens
    agg_stmt = select(AggregatedPortalToken).where(AggregatedPortalToken.token == token)
    agg_session = (await db.execute(agg_stmt)).scalar_one_or_none()

    if agg_session:
        buyer = await db.get(Company, agg_session.buyer_id)
        vendor = await db.get(Company, agg_session.vendor_id)
        return {
            "valid": True,
            "token": token,
            "token_type": "AGGREGATED_ACCOUNT_SETTLEMENT",
            "buyer_id": buyer.id if buyer else None,
            "buyer_name": buyer.name if buyer else "Corporate Buyer",
            "vendor_id": vendor.id if vendor else None,
            "vendor_name": vendor.name if vendor else "MSME Supplier",
            "invoice_count": len(agg_session.invoice_ids or []),
            "total_principal": agg_session.total_principal,
            "requires_password": False,
            "verified_at": datetime.utcnow().isoformat()
        }

    # 2. Check Single Invoice Tokens
    inv_stmt = select(Invoice).where(Invoice.portal_token == token)
    invoice = (await db.execute(inv_stmt)).scalar_one_or_none()

    if invoice:
        buyer = await db.get(Company, invoice.buyer_id)
        vendor = await db.get(Company, invoice.vendor_id)
        return {
            "valid": True,
            "token": token,
            "token_type": "SINGLE_INVOICE_SETTLEMENT",
            "buyer_id": buyer.id if buyer else None,
            "buyer_name": buyer.name if buyer else "Corporate Buyer",
            "vendor_id": vendor.id if vendor else None,
            "vendor_name": vendor.name if vendor else "MSME Supplier",
            "invoice_count": 1,
            "invoice_id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "total_principal": invoice.principal_amount,
            "requires_password": False,
            "verified_at": datetime.utcnow().isoformat()
        }

    raise HTTPException(status_code=404, detail="Invalid or expired guest portal token")

@router.get("/{token}")
async def get_guest_portal_view(token: str, db: AsyncSession = Depends(get_db)):
    """
    GET /api/v1/guest/portal/{token}:
    Tokenized public link for corporate buyer accounting teams.
    Supports both Aggregated Multi-Invoice Bundles and Single Invoices.
    """
    today = date.today()

    # 1. Check if token is an Aggregated Multi-Invoice Session
    agg_stmt = select(AggregatedPortalToken).where(AggregatedPortalToken.token == token)
    agg_session = (await db.execute(agg_stmt)).scalar_one_or_none()

    if agg_session:
        buyer = await db.get(Company, agg_session.buyer_id)
        vendor = await db.get(Company, agg_session.vendor_id)

        # Load all invoices
        inv_stmt = select(Invoice).where(Invoice.id.in_(agg_session.invoice_ids or []))
        invoices = (await db.execute(inv_stmt)).scalars().all()

        total_principal = sum(i.principal_amount for i in invoices)
        total_paid = sum(i.paid_amount or 0.0 for i in invoices)
        balance_due = max(0.0, total_principal - total_paid)

        combined_sec16 = 0.0
        for i in invoices:
            unpaid = i.principal_amount - (i.paid_amount or 0.0)
            s16 = calculate_section_16_interest(unpaid, days_overdue)
            combined_sec16 += float(s16.get("accrued_interest", 0.0))

        buyer_tax_loss = buyer.is_tax_loss if buyer else False
        vendor_activity = vendor.major_activity.value if (vendor and hasattr(vendor.major_activity, "value")) else "MANUFACTURING"
        vendor_class = vendor.enterprise_class.value if (vendor and hasattr(vendor.enterprise_class, "value")) else "MICRO"

        advisory = get_tailored_compliance_advisory(
            principal=balance_due,
            days_overdue=30,  # Consolidated average
            corporate_tax_rate=buyer.corporate_tax_rate if buyer else 0.30,
            buyer_is_tax_loss=buyer_tax_loss,
            vendor_major_activity=vendor_activity,
            vendor_enterprise_class=vendor_class
        )

        itemized_invoices = []
        for inv in invoices:
            delivery = inv.delivery_date or inv.invoice_date
            lock_info = InvoiceLockEngine.evaluate_acceptance_lock(delivery, inv.status.value, today)
            itemized_invoices.append({
                "id": inv.id,
                "invoice_number": inv.invoice_number,
                "principal_amount": inv.principal_amount,
                "paid_amount": inv.paid_amount or 0.0,
                "balance_due": round(inv.principal_amount - (inv.paid_amount or 0.0), 2),
                "invoice_date": inv.invoice_date.isoformat(),
                "due_date": inv.due_date.isoformat(),
                "delivery_date": inv.delivery_date.isoformat() if inv.delivery_date else None,
                "status": inv.status.value,
                "goods_description": inv.goods_description or "Commercial Engineering Supplies",
                "document_health_score": inv.document_health_score,
                "po_number": inv.po_number,
                "is_deemed_locked": lock_info.get("is_locked", False),
                "lock_status": lock_info.get("status_label", "Accepted")
            })

        prompt_discount_pct = 2.5
        discount_amount = round(balance_due * (prompt_discount_pct / 100.0), 2)

        return {
            "portal_token": token,
            "is_aggregated": True,
            "buyer": {
                "id": buyer.id if buyer else None,
                "name": buyer.name if buyer else "Valued Corporate Partner",
                "gstin": buyer.gstin if buyer else None,
                "contact_person": buyer.contact_person if buyer else None,
                "email": buyer.email if buyer else None,
                "is_tax_loss": buyer_tax_loss,
                "corporate_tax_rate": buyer.corporate_tax_rate if buyer else 0.30,
                "annual_turnover": buyer.annual_turnover if buyer else None,
                "mca_filing_status": buyer.mca_filing_status if buyer else "ACTIVE_COMPLIANT"
            },
            "vendor": {
                "id": vendor.id if vendor else None,
                "name": vendor.name if vendor else "MSME Supplier",
                "gstin": vendor.gstin if vendor else None,
                "udyam_number": vendor.udyam_reg_number if vendor else None,
                "enterprise_class": vendor_class,
                "major_activity": vendor_activity,
                "sec_43bh_eligible": advisory["safeguard_flags"]["sec_43bh_active"]
            },
            "aggregated_metrics": {
                "invoice_count": len(invoices),
                "total_principal": round(total_principal, 2),
                "total_paid": round(total_paid, 2),
                "balance_due": round(balance_due, 2),
                "combined_sec16_interest": round(combined_sec16, 2),
                "sec43bh_tax_exposure": round(agg_session.sec43bh_exposure, 2)
            },
            "invoices": itemized_invoices,
            "compliance_advisory": advisory,
            "prompt_settlement_offer": {
                "discount_percentage": prompt_discount_pct,
                "instant_savings": discount_amount,
                "net_payable_amount": round(balance_due - discount_amount, 2),
                "valid_until": "Within 48 hours"
            }
        }

    # 2. Single Invoice fallback
    stmt = select(Invoice).where(Invoice.portal_token == token)
    invoice = (await db.execute(stmt)).scalar_one_or_none()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invalid or expired guest portal link")

    vendor = await db.get(Company, invoice.vendor_id)
    buyer = await db.get(Company, invoice.buyer_id)

    days_overdue = max(0, (today - invoice.due_date).days)
    buyer_tax_loss = buyer.is_tax_loss if buyer else False
    vendor_activity = vendor.major_activity.value if (vendor and hasattr(vendor.major_activity, "value")) else "MANUFACTURING"
    vendor_class = vendor.enterprise_class.value if (vendor and hasattr(vendor.enterprise_class, "value")) else "MICRO"

    advisory = get_tailored_compliance_advisory(
        principal=invoice.principal_amount,
        days_overdue=days_overdue,
        corporate_tax_rate=buyer.corporate_tax_rate if buyer else 0.30,
        buyer_is_tax_loss=buyer_tax_loss,
        vendor_major_activity=vendor_activity,
        vendor_enterprise_class=vendor_class
    )

    delivery = invoice.delivery_date or invoice.invoice_date
    lock_info = InvoiceLockEngine.evaluate_acceptance_lock(delivery, invoice.status.value, today)

    # EMI Plan
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

    prompt_discount_pct = 2.5
    prompt_discount_amount = round(invoice.principal_amount * (prompt_discount_pct / 100.0), 2)
    net_prompt_settlement = round(invoice.principal_amount - prompt_discount_amount, 2)

    return {
        "portal_token": token,
        "is_aggregated": False,
        "invoice": {
            "id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "principal_amount": invoice.principal_amount,
            "paid_amount": invoice.paid_amount,
            "balance_due": round(invoice.principal_amount - invoice.paid_amount, 2),
            "invoice_date": invoice.invoice_date.isoformat(),
            "due_date": invoice.due_date.isoformat(),
            "delivery_date": invoice.delivery_date.isoformat() if invoice.delivery_date else None,
            "status": invoice.status.value,
            "goods_description": invoice.goods_description or "Commercial Supplies",
            "po_number": invoice.po_number,
            "po_file_url": invoice.po_file_url,
            "pod_file_url": invoice.pod_file_url,
            "days_overdue": days_overdue,
            "document_health_score": invoice.document_health_score,
            "financing_rail": invoice.financing_rail,
            "financing_status": invoice.financing_status
        },
        "buyer": {
            "id": buyer.id if buyer else None,
            "name": buyer.name if buyer else "Valued Corporate Partner",
            "gstin": buyer.gstin if buyer else None,
            "contact_person": buyer.contact_person if buyer else None,
            "email": buyer.email if buyer else None,
            "is_tax_loss": buyer_tax_loss,
            "corporate_tax_rate": buyer.corporate_tax_rate if buyer else 0.30
        },
        "vendor": {
            "id": vendor.id if vendor else None,
            "name": vendor.name if vendor else "MSME Supplier",
            "gstin": vendor.gstin if vendor else None,
            "udyam_number": vendor.udyam_reg_number if vendor else None,
            "enterprise_class": vendor_class,
            "major_activity": vendor_activity,
            "sec_43bh_eligible": advisory["safeguard_flags"]["sec_43bh_active"]
        },
        "compliance_advisory": advisory,
        "deemed_acceptance_lock": lock_info,
        "active_emi_plan": emi_plan_data,
        "prompt_discount_offer": {
            "discount_percentage": prompt_discount_pct,
            "instant_savings": prompt_discount_amount,
            "net_payable_amount": net_prompt_settlement,
            "valid_until": "Prompt Payment Incentive"
        }
    }

@router.post("/{token}/action")
async def execute_portal_action(
    token: str,
    action: str = Body(..., embed=True),  # 'SUBMIT_PAYMENT', 'ACCEPT_EMI', 'AUTHORIZE_ENACH', 'APPROVE_TREDS'
    payment_reference: str = Body(None, embed=True),
    payment_amount: float = Body(None, embed=True),
    bank_name: str = Body(None, embed=True),
    account_last4: str = Body(None, embed=True),
    db: AsyncSession = Depends(get_db)
):
    """Process buyer portal actions (both aggregated batch and single invoice)"""
    # 1. Handle Aggregated Portal Session
    agg_stmt = select(AggregatedPortalToken).where(AggregatedPortalToken.token == token)
    agg_session = (await db.execute(agg_stmt)).scalar_one_or_none()

    if agg_session:
        inv_stmt = select(Invoice).where(Invoice.id.in_(agg_session.invoice_ids or []))
        invoices = (await db.execute(inv_stmt)).scalars().all()

        if action == "SUBMIT_PAYMENT":
            ref = (payment_reference or "").strip()
            if not re.match(r"^[A-Za-z0-9]{12,22}$", ref):
                raise HTTPException(
                    status_code=400,
                    detail="Please enter a valid 12–22 character UTR/NEFT/RTGS number."
                )
            
            # Apply payment across all batch invoices
            for inv in invoices:
                inv.paid_amount = inv.principal_amount
                inv.status = InvoiceStatus.PAID

            await db.commit()
            return {
                "status": "SUCCESS",
                "message": f"Consolidated payment advice of ₹{agg_session.total_principal:,.2f} recorded under UTR {ref.upper()} across {len(invoices)} invoices.",
                "payment_reference": ref.upper(),
                "invoices_updated": len(invoices)
            }

        elif action == "APPROVE_TREDS":
            for inv in invoices:
                inv.financing_rail = "RAIL_1_TREDS"
                inv.financing_status = "RAIL_1_APPROVED_DISBURSED"
                inv.status = InvoiceStatus.DISCOUNTED_TREDS
            await db.commit()
            return {
                "status": "SUCCESS",
                "message": f"All {len(invoices)} batch invoices approved on TReDS (Rail 1). Exchange factoring initiated."
            }

        return {"status": "SUCCESS", "message": f"Batch action {action} processed successfully"}

    # 2. Handle Single Invoice Session
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
        discount_fee = invoice.principal_amount * (8.1 / 100.0) * (60 / 365.0)
        invoice.paid_amount = round(invoice.principal_amount - discount_fee - 1500.0, 2)
        await db.commit()
        return {
            "status": "SUCCESS",
            "message": "Corporate Buyer approved invoice on TReDS (Rail 1). Institutional exchange funds disbursed to vendor."
        }

    elif action == "SUBMIT_PAYMENT":
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
