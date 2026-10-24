from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, Optional

from app.database import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.engines.treds_bridge import TReDSBridgeSimulator

router = APIRouter(prefix="/treds", tags=["TReDS Institutional Bill Discounting"])

@router.post("/bids")
async def get_treds_bids(
    invoice_id: int = Body(..., embed=True),
    exchange_code: str = Body("RXIL", embed=True),
    db: AsyncSession = Depends(get_db)
):
    inv = await db.get(Invoice, invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    bids_info = TReDSBridgeSimulator.simulate_bid_generation(
        invoice_number=inv.invoice_number,
        principal_amount=inv.principal_amount,
        tenor_days=60,
        exchange_code=exchange_code
    )
    return bids_info

@router.post("/discount-request")
async def execute_treds_discount(
    invoice_id: int = Body(..., embed=True),
    exchange_code: str = Body("RXIL", embed=True),
    selected_rate: float = Body(8.1, embed=True),
    db: AsyncSession = Depends(get_db)
):
    """
    POST /api/v1/treds/discount-request:
    Simulates an API bridge call to TReDS exchanges (RXIL, M1xchange) for silent 24-hour bill discounting.
    """
    inv = await db.get(Invoice, invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    execution_result = TReDSBridgeSimulator.execute_discount_request(
        invoice_number=inv.invoice_number,
        principal_amount=inv.principal_amount,
        exchange_code=exchange_code,
        selected_rate=selected_rate
    )

    inv.status = InvoiceStatus.DISCOUNTED_TREDS
    inv.paid_amount = execution_result["net_credited_amount"]
    await db.commit()

    return execution_result
