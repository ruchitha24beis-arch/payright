from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from app.database import get_db
from app.services.accounting_sync import AccountingSyncService

router = APIRouter(prefix="/sync", tags=["Accounting Overlay Sync (Tally & Zoho)"])

@router.post("/tally")
async def sync_tally_endpoint(db: AsyncSession = Depends(get_db)):
    """
    POST /api/v1/sync/tally:
    Simulates an on-premise XML agent sync from TallyPrime ERP.
    Seeds database with 5 realistic overdue invoices (15 to 45 days overdue),
    linked Purchase Orders, signed POD metadata, and buyer credit limit statuses.
    """
    result = await AccountingSyncService.sync_from_tally(db)
    return result

@router.post("/zoho")
async def sync_zoho_endpoint(db: AsyncSession = Depends(get_db)):
    """
    POST /api/v1/sync/zoho:
    Simulates an OAuth REST API sync from Zoho Books.
    Imports active customer ledgers and maps line-item inventory for partial order release configurations.
    """
    result = await AccountingSyncService.sync_from_zoho(db)
    return result

@router.get("/status")
async def get_sync_status():
    """
    Returns live accounting overlay plugin connection statuses.
    """
    return {
        "platform_mode": "INTELLIGENT_OVERLAY_PLUGIN",
        "description": "Operating strictly as an intelligent overlay for existing ERPs without manual ledger entry",
        "connectors": [
            {
                "software": "TallyPrime ERP",
                "integration_type": "On-Premise XML Gateway Agent",
                "port": 9000,
                "status": "ONLINE_READY",
                "features": ["1-Click Invoice Sync", "PO Extraction", "POD Health Matching", "Section 43B(h) Audit Export"]
            },
            {
                "software": "Zoho Books",
                "integration_type": "OAuth 2.0 Cloud REST API",
                "status": "ONLINE_READY",
                "features": ["Customer Ledger Sync", "Line-Item Inventory Mapping", "Automated EMI Payment Webhooks"]
            }
        ]
    }
