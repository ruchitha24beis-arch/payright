import asyncio
from datetime import date, datetime
from app.celery_app import celery_app
from app.database import AsyncSessionLocal
from sqlalchemy import select
from app.models.invoice import Invoice, InvoiceStatus
from app.models.company import Company
from app.models.emi import EMIPlan, EMISchedule, EMIScheduleStatus, ENACHMandateStatus
from app.engines.invoice_lock_engine import InvoiceLockEngine
from app.engines.dual_rail_financing import DualRailFinancingEngine
from app.engines.enach_mandate import ENACHMandateEngine

@celery_app.task(name="tasks.check_deemed_acceptance_locks")
def run_deemed_acceptance_locks_sync():
    """Celery synchronous wrapper for deemed acceptance locks"""
    return asyncio.run(process_deemed_acceptance_locks())

async def process_deemed_acceptance_locks():
    """
    Scans invoices to lock 15-day deemed acceptances under MSMED Act Sec 2(b).
    """
    async with AsyncSessionLocal() as db:
        stmt = select(Invoice).where(Invoice.status == InvoiceStatus.PENDING)
        invoices = (await db.execute(stmt)).scalars().all()
        locked_count = 0
        today = date.today()

        for inv in invoices:
            delivery = inv.delivery_date or inv.invoice_date
            lock_eval = InvoiceLockEngine.evaluate_acceptance_lock(delivery, inv.status.value, today)
            
            if lock_eval["is_locked"]:
                vendor = await db.get(Company, inv.vendor_id)
                buyer = await db.get(Company, inv.buyer_id)
                
                audit_log = InvoiceLockEngine.generate_acceptance_audit_log(
                    invoice_number=inv.invoice_number,
                    delivery_date=delivery,
                    buyer_gstin=buyer.gstin if buyer else "UNKNOWN",
                    vendor_gstin=vendor.gstin if vendor else "UNKNOWN",
                    health_score=inv.document_health_score or 85.0
                )
                inv.status = InvoiceStatus.DEEMED_ACCEPTED
                inv.acceptance_audit_log = audit_log
                inv.deemed_acceptance_date = delivery + __import__("datetime").timedelta(days=15)
                locked_count += 1

        if locked_count > 0:
            await db.commit()
        return {"processed": len(invoices), "locked_to_deemed_accepted": locked_count}

@celery_app.task(name="tasks.check_dual_rail_failovers")
def run_dual_rail_failovers_sync():
    """Celery synchronous wrapper for dual-rail 7-day auto-failover checks"""
    return asyncio.run(process_dual_rail_failovers())

async def process_dual_rail_failovers():
    """
    Checks Rail 1 (TReDS) invoices that exceeded 7 days of buyer silence and fails them over to Rail 2 (NBFC).
    """
    async with AsyncSessionLocal() as db:
        stmt = select(Invoice).where(Invoice.financing_rail == "RAIL_1_TREDS", Invoice.financing_status == "RAIL_1_PENDING")
        invoices = (await db.execute(stmt)).scalars().all()
        failover_count = 0

        for inv in invoices:
            failover_eval = DualRailFinancingEngine.evaluate_rail_failover(
                initiated_at=inv.financing_failover_date or inv.created_at,
                current_rail=inv.financing_rail,
                is_buyer_approved=False,
                document_health_score=inv.document_health_score or 75.0
            )
            if failover_eval["should_failover"]:
                inv.financing_rail = "RAIL_2_NBFC"
                inv.financing_status = "RAIL_2_ACTIVE"
                inv.financing_details = {
                    **(inv.financing_details or {}),
                    "failover_triggered_at": datetime.utcnow().isoformat(),
                    "reason": "7-day buyer TReDS approval window expired. Failed over to Private NBFC Anchor Rail."
                }
                failover_count += 1

        if failover_count > 0:
            await db.commit()
        return {"rail_1_evaluated": len(invoices), "failed_over_to_rail_2": failover_count}

@celery_app.task(name="tasks.process_scheduled_enach_debits")
def run_scheduled_enach_debits_sync():
    """Celery synchronous wrapper for scheduled e-NACH auto-debits"""
    return asyncio.run(process_scheduled_enach_debits())

async def process_scheduled_enach_debits():
    """
    Executes e-NACH auto-debits on active plans with due schedules.
    """
    async with AsyncSessionLocal() as db:
        today = date.today()
        stmt = select(EMISchedule).join(EMIPlan).where(
            EMISchedule.status == EMIScheduleStatus.PENDING,
            EMISchedule.due_date <= today,
            EMIPlan.enach_mandate_status == ENACHMandateStatus.ACTIVE
        )
        due_schedules = (await db.execute(stmt)).scalars().all()
        executed = 0

        for sch in due_schedules:
            plan = await db.get(EMIPlan, sch.plan_id)
            result = ENACHMandateEngine.execute_scheduled_debit(
                umrn=plan.umrn or "UMRN-NPCI-DEFAULT",
                installment_number=sch.installment_number,
                amount=sch.amount
            )
            if result["success"]:
                sch.status = EMIScheduleStatus.PAID
                sch.paid_date = today
                sch.payment_reference = result["transaction_reference"]
                sch.enach_execution_status = "SUCCESS"
                executed += 1

        if executed > 0:
            await db.commit()
        return {"due_schedules_checked": len(due_schedules), "auto_debited_successfully": executed}
