from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date
from typing import Dict, Any, Optional

from app.database import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.models.company import Company
from app.models.emi import EMIPlan, EMIPlanStatus, ENACHMandateStatus
from app.engines.compliance_engine import calculate_section_43bh_exposure, calculate_section_16_interest

router = APIRouter(prefix="/analytics", tags=["Dashboard Analytics"])

@router.get("/dashboard")
async def get_dashboard_summary(vendor_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Invoice)
    if vendor_id:
        stmt = stmt.where(Invoice.vendor_id == vendor_id)
    invoices = (await db.execute(stmt)).scalars().all()

    total_outstanding = 0.0
    total_43bh_exposure = 0.0
    total_sec16_interest = 0.0
    total_recovered = 0.0
    deemed_accepted_count = 0
    
    rail_1_pending_amount = 0.0
    rail_2_disbursed_amount = 0.0
    
    trader_exemption_applied = 0
    buyer_tax_loss_pivot_count = 0

    today = date.today()

    # Aging buckets
    aging = {
        "0-15 days (Grace / Deemed Lock)": {"count": 0, "amount": 0.0, "color": "#10B981"},
        "16-30 days (Sec 16 Advisory)": {"count": 0, "amount": 0.0, "color": "#3B82F6"},
        "31-45 days (Sec 43B(h) Tax Risk)": {"count": 0, "amount": 0.0, "color": "#F59E0B"},
        "45+ days (Immediate Disallowance)": {"count": 0, "amount": 0.0, "color": "#EF4444"}
    }

    # Document Health buckets
    health_distribution = {
        "A (85-100% Defense Ready)": 0,
        "B (65-84% Good)": 0,
        "C (40-64% Missing Elements)": 0,
        "D (<40% Critical Risk)": 0
    }

    for inv in invoices:
        balance = inv.principal_amount - inv.paid_amount
        vendor = await db.get(Company, inv.vendor_id)
        buyer = await db.get(Company, inv.buyer_id)
        
        # Check safeguard loopholes
        is_trader = (vendor.major_activity.value == "TRADING") if (vendor and hasattr(vendor.major_activity, "value")) else False
        is_tax_loss = buyer.is_tax_loss if buyer else False

        if is_trader:
            trader_exemption_applied += 1
        if is_tax_loss:
            buyer_tax_loss_pivot_count += 1

        if inv.status in [InvoiceStatus.PENDING, InvoiceStatus.DEEMED_ACCEPTED, InvoiceStatus.PARTIAL_EMI, InvoiceStatus.HOLD_CREDIT_LIMIT]:
            total_outstanding += balance
            tax_rate = buyer.corporate_tax_rate if buyer else 0.30
            
            # If buyer is in tax loss or vendor is trader, 43B(h) does not apply!
            if not is_tax_loss and not is_trader:
                tax_loss = balance * tax_rate
                total_43bh_exposure += tax_loss

            days = max(0, (today - inv.due_date).days)
            interest = calculate_section_16_interest(balance, days)["accrued_interest"]
            total_sec16_interest += interest

            if days <= 15:
                aging["0-15 days (Grace / Deemed Lock)"]["count"] += 1
                aging["0-15 days (Grace / Deemed Lock)"]["amount"] += balance
            elif days <= 30:
                aging["16-30 days (Sec 16 Advisory)"]["count"] += 1
                aging["16-30 days (Sec 16 Advisory)"]["amount"] += balance
            elif days <= 45:
                aging["31-45 days (Sec 43B(h) Tax Risk)"]["count"] += 1
                aging["31-45 days (Sec 43B(h) Tax Risk)"]["amount"] += balance
            else:
                aging["45+ days (Immediate Disallowance)"]["count"] += 1
                aging["45+ days (Immediate Disallowance)"]["amount"] += balance

        if inv.status in [InvoiceStatus.PAID, InvoiceStatus.DISCOUNTED_TREDS]:
            total_recovered += inv.paid_amount

        if inv.status == InvoiceStatus.DEEMED_ACCEPTED:
            deemed_accepted_count += 1

        # Dual-rail tracking
        if inv.financing_rail == "RAIL_1_TREDS" and inv.financing_status == "RAIL_1_PENDING":
            rail_1_pending_amount += inv.principal_amount
        elif inv.financing_rail == "RAIL_2_NBFC":
            rail_2_disbursed_amount += inv.paid_amount

        # Health categorization
        sc = inv.document_health_score
        if sc >= 85:
            health_distribution["A (85-100% Defense Ready)"] += 1
        elif sc >= 65:
            health_distribution["B (65-84% Good)"] += 1
        elif sc >= 40:
            health_distribution["C (40-64% Missing Elements)"] += 1
        else:
            health_distribution["D (<40% Critical Risk)"] += 1

    # Active EMI plans & e-NACH Mandates
    e_stmt = select(EMIPlan).where(EMIPlan.status.in_([EMIPlanStatus.OFFERED, EMIPlanStatus.ACCEPTED, EMIPlanStatus.ACTIVE]))
    active_emis = (await db.execute(e_stmt)).scalars().all()

    enach_stmt = select(EMIPlan).where(EMIPlan.enach_mandate_status == ENACHMandateStatus.ACTIVE)
    active_enach_plans = (await db.execute(enach_stmt)).scalars().all()
    enach_protected_amount = sum(p.discounted_principal for p in active_enach_plans)

    aging_chart_data = [
        {"bucket": k, "amount": round(v["amount"], 2), "count": v["count"], "fill": v["color"]}
        for k, v in aging.items()
    ]

    health_chart_data = [
        {"tier": k, "count": v}
        for k, v in health_distribution.items()
    ]

    return {
        "metrics": {
            "total_outstanding": round(total_outstanding, 2),
            "total_43bh_exposure": round(total_43bh_exposure, 2),
            "total_sec16_interest": round(total_sec16_interest, 2),
            "total_recovered": round(total_recovered, 2),
            "active_emi_plans_count": len(active_emis),
            "active_enach_mandates_count": len(active_enach_plans),
            "enach_protected_amount": round(enach_protected_amount, 2),
            "deemed_accepted_count": deemed_accepted_count,
            "invoices_count": len(invoices),
            "dual_rail_cash_flow": {
                "rail_1_treds_pending_amount": round(rail_1_pending_amount, 2),
                "rail_2_nbfc_disbursed_amount": round(rail_2_disbursed_amount, 2),
                "total_financed_liquidity": round(rail_2_disbursed_amount + total_recovered, 2)
            },
            "safeguards_active": {
                "trader_exemption_applied_count": trader_exemption_applied,
                "buyer_tax_loss_pivot_count": buyer_tax_loss_pivot_count,
                "deemed_acceptance_locks": deemed_accepted_count
            }
        },
        "aging_chart": aging_chart_data,
        "health_chart": health_chart_data
    }
