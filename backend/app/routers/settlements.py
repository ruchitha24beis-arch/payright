from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import date, timedelta

from app.database import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.models.company import Company
from app.models.emi import EMIPlan, EMISchedule, EMIPlanStatus, EMIScheduleStatus
from app.models.order import LinkedOrder, OrderStatus, ReleaseRule
from app.schemas.settlement import EMIPlanCreate, EMIPlanResponse, PayInstallmentRequest

router = APIRouter(prefix="/settlements", tags=["Settlements & EMI Plans"])

@router.post("/create-emi-plan")
async def create_emi_plan(payload: EMIPlanCreate, db: AsyncSession = Depends(get_db)):
    """
    POST /api/v1/settlements/create-emi-plan:
    Creates structured installment schedules and links them to partial order releases.
    """
    invoice = await db.get(Invoice, payload.invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if payload.total_installments < 2 or payload.total_installments > 6:
        raise HTTPException(status_code=400, detail="Installments must be between 2 and 6")

    # Apply cash discount if configured
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
        notes=payload.notes or f"Flexible {payload.total_installments}-Month Commercial Preservation Plan with {payload.cash_discount_percent}% Prompt Discount"
    )
    db.add(new_plan)
    await db.flush()

    start_date = payload.first_due_date or (date.today() + timedelta(days=15))
    schedules = []
    for i in range(payload.total_installments):
        schedule_date = start_date + timedelta(days=30 * i)
        # Adjust last installment for rounding
        inst_amount = amount_per_installment
        if i == payload.total_installments - 1:
            inst_amount = round(discounted_principal - (amount_per_installment * (payload.total_installments - 1)), 2)

        sch = EMISchedule(
            plan_id=new_plan.id,
            installment_number=i + 1,
            due_date=schedule_date,
            amount=inst_amount,
            status=EMIScheduleStatus.PENDING,
            units_to_release=units_per_installment
        )
        db.add(sch)
        schedules.append(sch)

    invoice.status = InvoiceStatus.PARTIAL_EMI
    await db.commit()
    await db.refresh(new_plan)

    return {
        "message": "EMI Plan created and linked to partial delivery milestones",
        "plan_id": new_plan.id,
        "invoice_id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "total_installments": new_plan.total_installments,
        "cash_discount_percent": new_plan.cash_discount_percent,
        "original_principal": new_plan.original_principal,
        "discounted_principal": new_plan.discounted_principal,
        "amount_per_installment": new_plan.amount_per_installment,
        "units_per_installment": units_per_installment,
        "status": new_plan.status.value
    }

@router.get("/plans")
async def list_emi_plans(db: AsyncSession = Depends(get_db)):
    stmt = select(EMIPlan).order_by(EMIPlan.created_at.desc())
    plans = (await db.execute(stmt)).scalars().all()
    
    result = []
    for p in plans:
        invoice = await db.get(Invoice, p.invoice_id)
        vendor = await db.get(Company, p.vendor_id)
        buyer = await db.get(Company, p.buyer_id)
        
        # Load schedules
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
            "schedules": [
                {
                    "id": s.id,
                    "installment_number": s.installment_number,
                    "due_date": s.due_date,
                    "amount": s.amount,
                    "status": s.status.value,
                    "paid_date": s.paid_date,
                    "payment_reference": s.payment_reference,
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
    """
    Marks an installment paid, updates invoice paid amount, and unlocks pro-rata order units.
    """
    sch = await db.get(EMISchedule, schedule_id)
    if not sch:
        raise HTTPException(status_code=404, detail="EMI Schedule record not found")
        
    plan = await db.get(EMIPlan, sch.plan_id)
    invoice = await db.get(Invoice, plan.invoice_id)

    sch.status = EMIScheduleStatus.PAID
    sch.paid_date = payload.paid_date or date.today()
    sch.payment_reference = payload.payment_reference

    # Update invoice paid balance
    invoice.paid_amount = round(invoice.paid_amount + sch.amount, 2)
    plan.status = EMIPlanStatus.ACTIVE

    # Release linked order units pro-rata
    released_now = 0
    if plan.linked_order_id and not sch.units_released_flag and sch.units_to_release > 0:
        order = await db.get(LinkedOrder, plan.linked_order_id)
        if order:
            order.units_released = min(order.total_units, order.units_released + sch.units_to_release)
            sch.units_released_flag = True
            released_now = sch.units_to_release
            if order.units_released >= order.total_units:
                order.status = OrderStatus.COMPLETED

    # Check if all installments are cleared
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
