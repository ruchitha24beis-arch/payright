import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import date, datetime

from app.database import get_db
from app.config import settings
from app.models.invoice import Invoice, InvoiceStatus
from app.models.company import Company
from app.schemas.invoice import InvoiceRead, DocumentHealthCheckResponse
from app.engines.compliance import calculate_section_43bh_exposure, calculate_section_16_interest
from app.engines.ocr_inspector import DocumentHealthInspector

router = APIRouter(prefix="/invoices", tags=["Invoices"])

@router.get("", response_model=List[InvoiceRead])
async def list_invoices(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Invoice).order_by(Invoice.invoice_date.desc()))
    invoices = result.scalars().all()
    
    response = []
    today = date.today()
    for inv in invoices:
        vendor = await db.get(Company, inv.vendor_id)
        buyer = await db.get(Company, inv.buyer_id)
        
        days_overdue = max(0, (today - inv.due_date).days)
        tax_info = calculate_section_43bh_exposure(inv.principal_amount, buyer.corporate_tax_rate if buyer else 0.30)
        interest_info = calculate_section_16_interest(inv.principal_amount, days_overdue)
        
        inv_dict = {
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "vendor_id": inv.vendor_id,
            "buyer_id": inv.buyer_id,
            "principal_amount": inv.principal_amount,
            "paid_amount": inv.paid_amount,
            "invoice_date": inv.invoice_date,
            "due_date": inv.due_date,
            "delivery_date": inv.delivery_date,
            "status": inv.status.value if hasattr(inv.status, "value") else str(inv.status),
            "document_health_score": inv.document_health_score,
            "ocr_details": inv.ocr_details,
            "po_file_url": inv.po_file_url,
            "pod_file_url": inv.pod_file_url,
            "po_number": inv.po_number,
            "goods_description": inv.goods_description,
            "portal_token": inv.portal_token,
            "created_at": inv.created_at,
            "vendor_name": vendor.name if vendor else "Unknown MSME",
            "buyer_name": buyer.name if buyer else "Unknown Buyer",
            "days_overdue": days_overdue,
            "section_43bh_tax_exposure": tax_info["total_tax_cash_penalty"],
            "section_16_interest": interest_info["accrued_interest"]
        }
        response.append(InvoiceRead(**inv_dict))
    return response

@router.get("/{invoice_id}", response_model=InvoiceRead)
async def get_invoice(invoice_id: int, db: AsyncSession = Depends(get_db)):
    inv = await db.get(Invoice, invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    vendor = await db.get(Company, inv.vendor_id)
    buyer = await db.get(Company, inv.buyer_id)
    
    today = date.today()
    days_overdue = max(0, (today - inv.due_date).days)
    tax_info = calculate_section_43bh_exposure(inv.principal_amount, buyer.corporate_tax_rate if buyer else 0.30)
    interest_info = calculate_section_16_interest(inv.principal_amount, days_overdue)
    
    return InvoiceRead(
        id=inv.id,
        invoice_number=inv.invoice_number,
        vendor_id=inv.vendor_id,
        buyer_id=inv.buyer_id,
        principal_amount=inv.principal_amount,
        paid_amount=inv.paid_amount,
        invoice_date=inv.invoice_date,
        due_date=inv.due_date,
        delivery_date=inv.delivery_date,
        status=inv.status.value if hasattr(inv.status, "value") else str(inv.status),
        document_health_score=inv.document_health_score,
        ocr_details=inv.ocr_details,
        po_file_url=inv.po_file_url,
        pod_file_url=inv.pod_file_url,
        po_number=inv.po_number,
        goods_description=inv.goods_description,
        portal_token=inv.portal_token,
        created_at=inv.created_at,
        vendor_name=vendor.name if vendor else "Unknown MSME",
        buyer_name=buyer.name if buyer else "Unknown Buyer",
        days_overdue=days_overdue,
        section_43bh_tax_exposure=tax_info["total_tax_cash_penalty"],
        section_16_interest=interest_info["accrued_interest"]
    )

@router.post("/upload")
async def upload_invoice_documents(
    invoice_number: str = Form(...),
    vendor_id: int = Form(...),
    buyer_id: int = Form(...),
    principal_amount: float = Form(...),
    invoice_date_val: str = Form(...),
    due_date_val: str = Form(...),
    po_number: Optional[str] = Form(None),
    goods_description: Optional[str] = Form("Commercial Goods Consignment"),
    po_file: Optional[UploadFile] = File(None),
    pod_file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
    """
    POST /api/v1/invoices/upload:
    File upload endpoint for POs and PODs with automated OCR scoring.
    """
    po_path = None
    pod_path = None

    if po_file:
        po_filename = f"po_{invoice_number}_{po_file.filename}"
        po_path = os.path.join(settings.UPLOAD_DIR, po_filename)
        with open(po_path, "wb") as buffer:
            shutil.copyfileobj(po_file.file, buffer)

    if pod_file:
        pod_filename = f"pod_{invoice_number}_{pod_file.filename}"
        pod_path = os.path.join(settings.UPLOAD_DIR, pod_filename)
        with open(pod_path, "wb") as buffer:
            shutil.copyfileobj(pod_file.file, buffer)

    # Perform automated OCR & Document Health Scoring
    ocr_result = DocumentHealthInspector.inspect_delivery_proof(
        po_file_path=po_path,
        pod_file_path=pod_path,
        expected_po_number=po_number or "",
        expected_invoice_number=invoice_number
    )

    inv_date = datetime.strptime(invoice_date_val, "%Y-%m-%d").date()
    d_date = datetime.strptime(due_date_val, "%Y-%m-%d").date()

    # Check if invoice already exists
    stmt = select(Invoice).where(Invoice.invoice_number == invoice_number)
    existing = (await db.execute(stmt)).scalar_one_or_none()

    if existing:
        existing.document_health_score = ocr_result["document_health_score"]
        existing.ocr_details = ocr_result
        if po_path:
            existing.po_file_url = f"/uploads/{os.path.basename(po_path)}"
        if pod_path:
            existing.pod_file_url = f"/uploads/{os.path.basename(pod_path)}"
        await db.commit()
        await db.refresh(existing)
        return {
            "message": "Invoice document health updated successfully",
            "invoice_id": existing.id,
            "invoice_number": existing.invoice_number,
            "document_health_score": existing.document_health_score,
            "ocr_result": ocr_result
        }

    new_invoice = Invoice(
        invoice_number=invoice_number,
        vendor_id=vendor_id,
        buyer_id=buyer_id,
        principal_amount=principal_amount,
        invoice_date=inv_date,
        due_date=d_date,
        delivery_date=inv_date,
        po_number=po_number,
        goods_description=goods_description,
        document_health_score=ocr_result["document_health_score"],
        ocr_details=ocr_result,
        po_file_url=f"/uploads/{os.path.basename(po_path)}" if po_path else None,
        pod_file_url=f"/uploads/{os.path.basename(pod_path)}" if pod_path else None,
        status=InvoiceStatus.PENDING
    )
    db.add(new_invoice)
    await db.commit()
    await db.refresh(new_invoice)

    return {
        "message": "Invoice registered and OCR scored successfully",
        "invoice_id": new_invoice.id,
        "invoice_number": new_invoice.invoice_number,
        "document_health_score": new_invoice.document_health_score,
        "portal_token": new_invoice.portal_token,
        "ocr_result": ocr_result
    }

@router.get("/{invoice_id}/health-check")
async def get_invoice_health_check(invoice_id: int, db: AsyncSession = Depends(get_db)):
    inv = await db.get(Invoice, invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if not inv.ocr_details:
        ocr_res = DocumentHealthInspector.inspect_delivery_proof(
            expected_po_number=inv.po_number or "",
            expected_invoice_number=inv.invoice_number
        )
        inv.ocr_details = ocr_res
        inv.document_health_score = ocr_res["document_health_score"]
        await db.commit()
        
    return {
        "invoice_id": inv.id,
        "invoice_number": inv.invoice_number,
        "document_health_score": inv.document_health_score,
        "details": inv.ocr_details
    }
