from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date
from typing import Dict, Any

from app.database import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.models.company import Company
from app.models.emi import EMIPlan, EMIPlanStatus
from app.engines.compliance import calculate_section_43bh_exposure, calculate_section_16_interest

router = APIRouter(prefix="/analytics", tags=["Dashboard Analytics"])

@router.get("/dashboard")
async def get_dashboard_summary(db: AsyncSession = Depends(get_db)):
    stmt = select(Invoice)
    invoices = (await db.execute(stmt)).scalars().all()

    total_outstanding = 0.0
    total_43bh_exposure = 0.0
    total_sec16_interest = 0.0
    total_recovered = 0.0

    today = date.today()

    # Aging buckets
    aging = {
        "0-15 days (Grace)": {"count": 0, "amount": 0.0, "color": "#10B981"},
        "16-30 days (Advisory)": {"count": 0, "amount": 0.0, "color": "#3B82F6"},
        "31-45 days (Tax Risk)": {"count": 0, "amount": 0.0, "color": "#F59E0B"},
        "45+ days (Disallowed)": {"count": 0, "amount": 0.0, "color": "#EF4444"}
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
        if inv.status in [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL_EMI, InvoiceStatus.HOLD_CREDIT_LIMIT]:
            total_outstanding += balance
            buyer = await db.get(Company, inv.buyer_id)
            tax_rate = buyer.corporate_tax_rate if buyer else 0.30
            tax_loss = balance * tax_rate
            total_43bh_exposure += tax_loss

            days = max(0, (today - inv.due_date).days)
            interest = calculate_section_16_interest(balance, days)["accrued_interest"]
            total_sec16_interest += interest

            if days <= 15:
                aging["0-15 days (Grace)"]["count"] += 1
                aging["0-15 days (Grace)"]["amount"] += balance
            elif days <= 30:
                aging["16-30 days (Advisory)"]["count"] += 1
                aging["16-30 days (Advisory)"]["amount"] += balance
            elif days <= 45:
                aging["31-45 days (Tax Risk)"]["count"] += 1
                aging["31-45 days (Tax Risk)"]["amount"] += balance
            else:
                aging["45+ days (Disallowed)"]["count"] += 1
                aging["45+ days (Disallowed)"]["amount"] += balance

        if inv.status in [InvoiceStatus.PAID, InvoiceStatus.DISCOUNTED_TREDS]:
            total_recovered += inv.paid_amount

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

    # Active EMI plans count
    e_stmt = select(EMIPlan).where(EMIPlan.status.in_([EMIPlanStatus.OFFERED, EMIPlanStatus.ACCEPTED, EMIPlanStatus.ACTIVE]))
    active_emis = (await db.execute(e_stmt)).scalars().all()

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
            "invoices_count": len(invoices)
        },
        "aging_chart": aging_chart_data,
        "health_chart": health_chart_data
    }
