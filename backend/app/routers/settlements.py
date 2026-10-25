from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import date, datetime, timedelta

from app.database import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.models.company import Company
from app.models.emi import EMIPlan, EMISchedule, EMIPlanStatus, EMIScheduleStatus, ENACHMandateStatus
from app.models.order import LinkedOrder, OrderStatus, ReleaseRule
from app.schemas.settlement import (
    EMIPlanCreate, 
    EMIPlanResponse, 
    PayInstallmentRequest,
    ENACHAuthRequest,
    ENACHTriggerDebitRequest
)
from app.engines.enach_mandate import ENACHMandateEngine

router = APIRouter(prefix="/settlements", tags=["Settlements, EMIs & e-NACH Mandates"])

@router.post("/create-emi-enach")
@router.post("/create-emi-plan")
async def create_emi_enach_plan(payload: EMIPlanCreate, db: AsyncSession = Depends(get_db)):
    """
    POST /api/v1/settlements/create-emi-enach:
    Creates structured installment schedules, generates an e-NACH digital mandate 
    authorization link for the buyer (with Section 25 PSSA criminal bounce liabilities), 
    and links to pro-rata purchase order releases.
    """
    invoice = await db.get(Invoice, payload.invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if payload.total_installments < 2 or payload.total_installments > 6:
        raise HTTPException(status_code=400, detail="Installments must be between 2 and 6")

    buyer = await db.get(Company, invoice.buyer_id)
    vendor = await db.get(Company, invoice.vendor_id)

    # Apply cash discount if configured (2% to 5%)
    discount_ratio = payload.cash_discount_percent / 100.0
    discounted_principal = invoice.principal_amount * (1.0 - discount_ratio)
    amount_per_installment = round(discounted_principal / payload.total_installments, 2)

    # Check for linked open purchase order for pro-rata partial goods release
    linked_order = None
    units_per_installment = 0
    if payload.linked_order_id:
        linked_order = await db.get(LinkedOrder, payload.linked_order_id)
        if linked_order:
            unreleased_units = max(0, linked_order.total_units - linked_order.units_released)
            units_per_installment = unreleased_units // payload.total_installments

    # Generate e-NACH Mandate Registration
    mandate_data = ENACHMandateEngine.generate_mandate(
        invoice_number=invoice.invoice_number,
        total_amount=discounted_principal,
        amount_per_installment=amount_per_installment,
        total_installments=payload.total_installments,
        buyer_name=buyer.name if buyer else "Corporate Buyer",
        bank_name=payload.bank_name or "HDFC Bank Ltd",
        account_last4=payload.account_last4 or "4109"
    )

    new_plan = EMIPlan(
        invoice_id=invoice.id,
        vendor_id=invoice.vendor_id,
        buyer_id=invoice.buyer_id,
        linked_order_id=payload.linked_order_id,
        total_installments=payload.total_installments,
        cash_discount_percent=payload.cash_discount_percent,
        original_principal=invoice.principal_amount,
        discounted_principal=discounted_principal,
        amount_per_installment=amount_per_installment,
        status=EMIPlanStatus.OFFERED,
        enach_mandate_status=ENACHMandateStatus.REGISTERED,
        umrn=mandate_data["umrn"],
        mandate_auth_url=mandate_data["mandate_auth_url"],
        mandate_bank_name=payload.bank_name or "HDFC Bank Ltd",
        mandate_account_last4=payload.account_last4 or "4109",
        sec25_liability_acknowledged=False,
        notes=payload.notes or f"Commercial Preservation Plan ({payload.total_installments} EMIs) with {payload.cash_discount_percent}% Prompt Cash Discount & e-NACH Auto-Debit Protection"
    )
    db.add(new_plan)
    await db.flush()

    start_date = payload.first_due_date or (date.today() + timedelta(days=15))
    schedules = []
    for i in range(payload.total_installments):
        schedule_date = start_date + timedelta(days=30 * i)
        inst_amount = amount_per_installment
        if i == payload.total_installments - 1:
            inst_amount = round(discounted_principal - (amount_per_installment * (payload.total_installments - 1)), 2)

        sch = EMISchedule(
            plan_id=new_plan.id,
            installment_number=i + 1,
            due_date=schedule_date,
            amount=inst_amount,
            status=EMIScheduleStatus.PENDING,
            enach_execution_status="PENDING",
            units_to_release=units_per_installment
        )
        db.add(sch)
        schedules.append(sch)

    invoice.status = InvoiceStatus.PARTIAL_EMI
    await db.commit()
    await db.refresh(new_plan)

    return {
        "message": "EMI Plan created and e-NACH digital mandate generated successfully",
        "plan_id": new_plan.id,
        "invoice_id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "total_installments": new_plan.total_installments,
        "cash_discount_percent": new_plan.cash_discount_percent,
        "original_principal": new_plan.original_principal,
        "discounted_principal": new_plan.discounted_principal,
        "amount_per_installment": new_plan.amount_per_installment,
        "units_per_installment": units_per_installment,
        "status": new_plan.status.value,
        "umrn": new_plan.umrn,
        "mandate_auth_url": new_plan.mandate_auth_url,
        "enach_mandate_status": new_plan.enach_mandate_status.value,
        "sec25_statutory_notice": mandate_data["sec25_liability_notice"]
    }

@router.post("/enach/authorize/{umrn}")
async def authorize_enach_mandate(
    umrn: str,
    payload: Optional[ENACHAuthRequest] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Simulates corporate buyer NetBanking / Aadhaar e-Sign authorization of e-NACH mandate.
    """
    stmt = select(EMIPlan).where(EMIPlan.umrn == umrn)
    plan = (await db.execute(stmt)).scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="e-NACH Mandate UMRN not found")

    plan.enach_mandate_status = ENACHMandateStatus.ACTIVE
    plan.status = EMIPlanStatus.ACTIVE
    plan.sec25_liability_acknowledged = True
    plan.mandate_authorized_at = datetime.utcnow()
    if payload and payload.bank_name:
        plan.mandate_bank_name = payload.bank_name
    if payload and payload.account_last4:
        plan.mandate_account_last4 = payload.account_last4

    await db.commit()
    return {
        "status": "SUCCESS",
        "umrn": umrn,
        "enach_mandate_status": "ACTIVE",
        "message": "e-NACH Auto-Debit Mandate successfully authenticated by buyer treasury.",
        "statutory_protection": "Active NPCI auto-debit clearance under Section 25 Payment and Settlement Systems Act 2007."
    }

@router.post("/enach/trigger-debit/{schedule_id}")
async def trigger_enach_debit(
    schedule_id: int,
    simulate_bounce: bool = Body(False, embed=True),
    db: AsyncSession = Depends(get_db)
):
    """
    Executes or simulates an e-NACH electronic auto-debit hit.
    """
    sch = await db.get(EMISchedule, schedule_id)
    if not sch:
        raise HTTPException(status_code=404, detail="EMI schedule not found")

    plan = await db.get(EMIPlan, sch.plan_id)
    invoice = await db.get(Invoice, plan.invoice_id)

    debit_result = ENACHMandateEngine.execute_scheduled_debit(
        umrn=plan.umrn or "UMRN-NPCI-DEMO",
        installment_number=sch.installment_number,
        amount=sch.amount,
        simulate_bounce=simulate_bounce
    )

    if debit_result["success"]:
        sch.status = EMIScheduleStatus.PAID
        sch.paid_date = date.today()
        sch.payment_reference = debit_result["transaction_reference"]
        sch.enach_execution_status = "SUCCESS"
        invoice.paid_amount = round(invoice.paid_amount + sch.amount, 2)
        
        # Release linked order units pro-rata
        released_units = 0
        if plan.linked_order_id and not sch.units_released_flag and sch.units_to_release > 0:
            order = await db.get(LinkedOrder, plan.linked_order_id)
            if order:
                order.units_released = min(order.total_units, order.units_released + sch.units_to_release)
                sch.units_released_flag = True
                released_units = sch.units_to_release
                if order.units_released >= order.total_units:
                    order.status = OrderStatus.COMPLETED

        # Check if all installments paid
        s_stmt = select(EMISchedule).where(EMISchedule.plan_id == plan.id)
        all_sch = (await db.execute(s_stmt)).scalars().all()
        if all(s.status == EMIScheduleStatus.PAID for s in all_sch):
            plan.status = EMIPlanStatus.COMPLETED
            invoice.status = InvoiceStatus.PAID

        await db.commit()
        return {
            "status": "SUCCESS",
            "message": debit_result["status_message"],
            "transaction_reference": debit_result["transaction_reference"],
            "invoice_paid_amount": invoice.paid_amount,
            "units_released_now": released_units
        }
    else:
        sch.enach_execution_status = "BOUNCED"
        sch.failure_reason = debit_result["bounce_reason"]
        plan.enach_mandate_status = ENACHMandateStatus.BOUNCED
        await db.commit()
        return {
            "status": "BOUNCED",
            "message": "e-NACH auto-debit dishonored.",
            "statutory_trigger": debit_result["statutory_trigger"]
        }

@router.get("/plans")
async def list_emi_plans(vendor_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    stmt = select(EMIPlan)
    if vendor_id:
        stmt = stmt.where(EMIPlan.vendor_id == vendor_id)
    stmt = stmt.order_by(EMIPlan.created_at.desc())
    plans = (await db.execute(stmt)).scalars().all()
    
    result = []
    for p in plans:
        invoice = await db.get(Invoice, p.invoice_id)
        vendor = await db.get(Company, p.vendor_id)
        buyer = await db.get(Company, p.buyer_id)
        
        s_stmt = select(EMISchedule).where(EMISchedule.plan_id == p.id).order_by(EMISchedule.installment_number)
        schedules = (await db.execute(s_stmt)).scalars().all()
        
        result.append({
            "id": p.id,
            "invoice_id": p.invoice_id,
            "invoice_number": invoice.invoice_number if invoice else "N/A",
            "vendor_name": vendor.name if vendor else "Vendor",
            "buyer_name": buyer.name if buyer else "Buyer",
            "total_installments": p.total_installments,
            "cash_discount_percent": p.cash_discount_percent,
            "original_principal": p.original_principal,
            "discounted_principal": p.discounted_principal,
            "amount_per_installment": p.amount_per_installment,
            "status": p.status.value,
            "notes": p.notes,
            "enach_mandate_status": p.enach_mandate_status.value if hasattr(p.enach_mandate_status, "value") else str(p.enach_mandate_status),
            "umrn": p.umrn,
            "mandate_auth_url": p.mandate_auth_url,
            "mandate_bank_name": p.mandate_bank_name,
            "mandate_account_last4": p.mandate_account_last4,
            "sec25_liability_acknowledged": p.sec25_liability_acknowledged,
            "schedules": [
                {
                    "id": s.id,
                    "installment_number": s.installment_number,
                    "due_date": s.due_date,
                    "amount": s.amount,
                    "status": s.status.value,
                    "paid_date": s.paid_date,
                    "payment_reference": s.payment_reference,
                    "enach_execution_status": s.enach_execution_status,
                    "units_to_release": s.units_to_release,
                    "units_released_flag": s.units_released_flag
                } for s in schedules
            ]
        })
    return result

@router.post("/pay-installment/{schedule_id}")
async def pay_installment(
    schedule_id: int,
    payload: PayInstallmentRequest,
    db: AsyncSession = Depends(get_db)
):
    sch = await db.get(EMISchedule, schedule_id)
    if not sch:
        raise HTTPException(status_code=404, detail="EMI Schedule record not found")
        
    plan = await db.get(EMIPlan, sch.plan_id)
    invoice = await db.get(Invoice, plan.invoice_id)

    sch.status = EMIScheduleStatus.PAID
    sch.paid_date = payload.paid_date or date.today()
    sch.payment_reference = payload.payment_reference
    sch.enach_execution_status = "SUCCESS"

    invoice.paid_amount = round(invoice.paid_amount + sch.amount, 2)
    plan.status = EMIPlanStatus.ACTIVE

    released_now = 0
    if plan.linked_order_id and not sch.units_released_flag and sch.units_to_release > 0:
        order = await db.get(LinkedOrder, plan.linked_order_id)
        if order:
            order.units_released = min(order.total_units, order.units_released + sch.units_to_release)
            sch.units_released_flag = True
            released_now = sch.units_to_release
            if order.units_released >= order.total_units:
                order.status = OrderStatus.COMPLETED

    s_stmt = select(EMISchedule).where(EMISchedule.plan_id == plan.id)
    all_sch = (await db.execute(s_stmt)).scalars().all()
    if all(s.status == EMIScheduleStatus.PAID for s in all_sch):
        plan.status = EMIPlanStatus.COMPLETED
        invoice.status = InvoiceStatus.PAID

    await db.commit()
    return {
        "message": f"Installment #{sch.installment_number} cleared successfully",
        "paid_amount": sch.amount,
        "payment_reference": sch.payment_reference,
        "plan_status": plan.status.value,
        "invoice_paid_total": invoice.paid_amount,
        "invoice_status": invoice.status.value,
        "milestone_units_released_now": released_now
    }
