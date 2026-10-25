from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.models.company import Company, CompanyRole
from app.models.invoice import Invoice, InvoiceStatus
from app.models.order import LinkedOrder, OrderStatus
from app.engines.credit_safeguard import evaluate_buyer_credit_standing

router = APIRouter(prefix="/safeguards", tags=["Credit Safeguards"])

@router.get("/buyers-evaluation")
async def evaluate_all_buyers(vendor_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Company).where(Company.role == CompanyRole.BUYER).order_by(Company.name)
    buyers = (await db.execute(stmt)).scalars().all()
    
    results = []
    for b in buyers:
        # Sum pending invoices
        inv_conditions = [
            Invoice.buyer_id == b.id,
            Invoice.status.in_([InvoiceStatus.PENDING, InvoiceStatus.PARTIAL_EMI])
        ]
        if vendor_id:
            inv_conditions.append(Invoice.vendor_id == vendor_id)
        inv_stmt = select(func.sum(Invoice.principal_amount - Invoice.paid_amount)).where(*inv_conditions)
        current_outstanding = (await db.execute(inv_stmt)).scalar() or 0.0

        # Pending order values
        ord_conditions = [
            LinkedOrder.buyer_id == b.id,
            LinkedOrder.status == OrderStatus.ACTIVE
        ]
        if vendor_id:
            ord_conditions.append(LinkedOrder.vendor_id == vendor_id)
        ord_stmt = select(func.sum(LinkedOrder.total_order_value)).where(*ord_conditions)
        pending_orders = (await db.execute(ord_stmt)).scalar() or 0.0

        eval_res = evaluate_buyer_credit_standing(
            buyer_name=b.name,
            credit_limit=b.credit_limit,
            current_outstanding=current_outstanding,
            pending_order_value=pending_orders
        )
        eval_res["buyer_id"] = b.id
        eval_res["gstin"] = b.gstin
        results.append(eval_res)

    return results

@router.get("/orders")
async def list_linked_orders(vendor_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    stmt = select(LinkedOrder)
    if vendor_id:
        stmt = stmt.where(LinkedOrder.vendor_id == vendor_id)
    stmt = stmt.order_by(LinkedOrder.created_at.desc())
    orders = (await db.execute(stmt)).scalars().all()
    
    res = []
    for o in orders:
        vendor = await db.get(Company, o.vendor_id)
        buyer = await db.get(Company, o.buyer_id)
        res.append({
            "id": o.id,
            "po_number": o.po_number,
            "vendor_name": vendor.name if vendor else "",
            "buyer_name": buyer.name if buyer else "",
            "item_description": o.item_description,
            "total_units": o.total_units,
            "units_released": o.units_released,
            "unreleased_units": o.total_units - o.units_released,
            "release_rule": o.release_rule.value,
            "units_per_emi_payment": o.units_per_emi_payment,
            "unit_price": o.unit_price,
            "total_order_value": o.total_order_value,
            "status": o.status.value
        })
    return res
