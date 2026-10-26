import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import date, datetime, timedelta

from app.database import get_db
from app.config import settings
from app.models.invoice import Invoice, InvoiceStatus
from app.models.company import Company
from app.schemas.invoice import InvoiceCreate, InvoiceRead, DocumentHealthCheckResponse
from app.engines.compliance_engine import calculate_section_43bh_exposure, calculate_section_16_interest, get_tailored_compliance_advisory
from app.engines.ocr_inspector import DocumentHealthInspector
from app.engines.invoice_lock_engine import InvoiceLockEngine

router = APIRouter(prefix="/invoices", tags=["Invoices & OCR Health"])

@router.get("", response_model=List[InvoiceRead])
async def list_invoices(vendor_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Invoice)
    if vendor_id:
        stmt = stmt.where(Invoice.vendor_id == vendor_id)
    stmt = stmt.order_by(Invoice.invoice_date.desc())
    result = await db.execute(stmt)
    invoices = result.scalars().all()
    
    response = []
    today = date.today()
    for inv in invoices:
        vendor = await db.get(Company, inv.vendor_id)
        buyer = await db.get(Company, inv.buyer_id)
        
        days_overdue = max(0, (today - inv.due_date).days)
        
        # Calculate dynamic tailored advisory plugging buyer tax-loss and vendor trader loopholes
        buyer_tax_loss = buyer.is_tax_loss if buyer else False
        vendor_activity = vendor.major_activity.value if (vendor and hasattr(vendor.major_activity, "value")) else "MANUFACTURING"
        vendor_class = vendor.enterprise_class.value if (vendor and hasattr(vendor.enterprise_class, "value")) else "MICRO"
        
        advisory = get_tailored_compliance_advisory(
            principal=inv.principal_amount,
            days_overdue=days_overdue,
            corporate_tax_rate=buyer.corporate_tax_rate if buyer else 0.30,
            buyer_is_tax_loss=buyer_tax_loss,
            vendor_major_activity=vendor_activity,
            vendor_enterprise_class=vendor_class
        )
        
        # Deemed acceptance evaluation
        delivery = inv.delivery_date or inv.invoice_date
        lock_info = InvoiceLockEngine.evaluate_acceptance_lock(delivery, inv.status.value, today)
        
        # Auto-update status to DEEMED_ACCEPTED if 15 days expired and still PENDING
        if lock_info["is_locked"] and inv.status == InvoiceStatus.PENDING:
            inv.status = InvoiceStatus.DEEMED_ACCEPTED
            if not inv.acceptance_audit_log and buyer and vendor:
                inv.acceptance_audit_log = InvoiceLockEngine.generate_acceptance_audit_log(
                    invoice_number=inv.invoice_number,
                    delivery_date=delivery,
                    buyer_gstin=buyer.gstin,
                    vendor_gstin=vendor.gstin,
                    health_score=inv.document_health_score
                )
            await db.commit()

        # Generate default empty OCR details if none recorded
        ocr_info = inv.ocr_details
        if not ocr_info:
            ocr_info = DocumentHealthInspector.inspect_delivery_proof(
                po_file_path=os.path.join(settings.UPLOAD_DIR, os.path.basename(inv.po_file_url)) if inv.po_file_url else None,
                pod_file_path=os.path.join(settings.UPLOAD_DIR, os.path.basename(inv.pod_file_url)) if inv.pod_file_url else None,
                expected_po_number=inv.po_number or "",
                expected_invoice_number=inv.invoice_number
            )

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
            "document_health_score": inv.document_health_score if inv.document_health_score is not None else 0.0,
            "legal_health_score": inv.legal_health_score if inv.legal_health_score is not None else (inv.document_health_score or 0.0),
            "ocr_details": ocr_info,
            "po_file_url": inv.po_file_url,
            "pod_file_url": inv.pod_file_url,
            "po_number": inv.po_number,
            "goods_description": inv.goods_description,
            "deemed_acceptance_date": inv.deemed_acceptance_date,
            "deemed_acceptance_clause": inv.deemed_acceptance_clause,
            "deemed_acceptance_info": lock_info,
            "acceptance_audit_log": inv.acceptance_audit_log,
            "financing_rail": inv.financing_rail or "NONE",
            "financing_status": inv.financing_status or "NOT_REQUESTED",
            "financing_failover_date": inv.financing_failover_date,
            "financing_details": inv.financing_details,
            "portal_token": inv.portal_token,
            "created_at": inv.created_at,
            "vendor_name": vendor.name if vendor else "Unknown MSME",
            "buyer_name": buyer.name if buyer else "Unknown Buyer",
            "days_overdue": days_overdue,
            "section_43bh_tax_exposure": advisory["section_43bh"]["total_tax_cash_penalty"],
            "section_16_interest": advisory["section_16_interest"]["accrued_interest"],
            "buyer_is_tax_loss": buyer_tax_loss,
            "vendor_major_activity": vendor_activity,
            "vendor_enterprise_class": vendor_class,
            "sec_43bh_eligible": advisory["vendor_eligible_43bh"]
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
    
    buyer_tax_loss = buyer.is_tax_loss if buyer else False
    vendor_activity = vendor.major_activity.value if (vendor and hasattr(vendor.major_activity, "value")) else "MANUFACTURING"
    vendor_class = vendor.enterprise_class.value if (vendor and hasattr(vendor.enterprise_class, "value")) else "MICRO"

    advisory = get_tailored_compliance_advisory(
        principal=inv.principal_amount,
        days_overdue=days_overdue,
        corporate_tax_rate=buyer.corporate_tax_rate if buyer else 0.30,
        buyer_is_tax_loss=buyer_tax_loss,
        vendor_major_activity=vendor_activity,
        vendor_enterprise_class=vendor_class
    )
    
    delivery = inv.delivery_date or inv.invoice_date
    lock_info = InvoiceLockEngine.evaluate_acceptance_lock(delivery, inv.status.value, today)
    
    ocr_info = inv.ocr_details
    if not ocr_info:
        ocr_info = DocumentHealthInspector.inspect_delivery_proof(
            po_file_path=os.path.join(settings.UPLOAD_DIR, os.path.basename(inv.po_file_url)) if inv.po_file_url else None,
            pod_file_path=os.path.join(settings.UPLOAD_DIR, os.path.basename(inv.pod_file_url)) if inv.pod_file_url else None,
            expected_po_number=inv.po_number or "",
            expected_invoice_number=inv.invoice_number
        )

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
        document_health_score=inv.document_health_score if inv.document_health_score is not None else 0.0,
        legal_health_score=inv.legal_health_score if inv.legal_health_score is not None else (inv.document_health_score or 0.0),
        ocr_details=ocr_info,
        po_file_url=inv.po_file_url,
        pod_file_url=inv.pod_file_url,
        po_number=inv.po_number,
        goods_description=inv.goods_description,
        deemed_acceptance_date=inv.deemed_acceptance_date,
        deemed_acceptance_clause=inv.deemed_acceptance_clause,
        deemed_acceptance_info=lock_info,
        acceptance_audit_log=inv.acceptance_audit_log,
        financing_rail=inv.financing_rail or "NONE",
        financing_status=inv.financing_status or "NOT_REQUESTED",
        financing_failover_date=inv.financing_failover_date,
        financing_details=inv.financing_details,
        portal_token=inv.portal_token,
        created_at=inv.created_at,
        vendor_name=vendor.name if vendor else "Unknown MSME",
        buyer_name=buyer.name if buyer else "Unknown Buyer",
        days_overdue=days_overdue,
        section_43bh_tax_exposure=advisory["section_43bh"]["total_tax_cash_penalty"],
        section_16_interest=advisory["section_16_interest"]["accrued_interest"],
        buyer_is_tax_loss=buyer_tax_loss,
        vendor_major_activity=vendor_activity,
        vendor_enterprise_class=vendor_class,
        sec_43bh_eligible=advisory["vendor_eligible_43bh"]
    )

@router.post("/create", status_code=201)
async def create_invoice_json(
    payload: InvoiceCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    POST /api/v1/invoices/create:
    JSON endpoint for registering real MSME invoices with automatic 15-day deemed acceptance lock,
    statutory audit trail, and document defense scoring.
    """
    inv_date = payload.invoice_date
    d_date = payload.due_date
    del_date = payload.delivery_date or inv_date

    # Generate 15-day Deemed Acceptance Clause and calculate deadline
    deemed_clause, lock_deadline = InvoiceLockEngine.generate_contractual_clause(del_date)
    lock_info = InvoiceLockEngine.evaluate_acceptance_lock(del_date, "PENDING", date.today())

    # For empty invoice creation without files, inspect_delivery_proof returns 0.0 and NO_DOCUMENTS
    ocr_result = DocumentHealthInspector.inspect_delivery_proof(
        po_file_path=None,
        pod_file_path=None,
        expected_po_number=payload.po_number or "",
        expected_invoice_number=payload.invoice_number
    )

    stmt = select(Invoice).where(Invoice.invoice_number == payload.invoice_number)
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        existing.principal_amount = payload.principal_amount
        existing.due_date = d_date
        existing.delivery_date = del_date
        existing.po_number = payload.po_number
        existing.goods_description = payload.goods_description
        await db.commit()
        await db.refresh(existing)
        return {
            "message": "Invoice updated successfully",
            "invoice_id": existing.id,
            "id": existing.id,
            "invoice_number": existing.invoice_number,
            "portal_token": existing.portal_token
        }

    new_invoice = Invoice(
        invoice_number=payload.invoice_number,
        vendor_id=payload.vendor_id,
        buyer_id=payload.buyer_id,
        principal_amount=payload.principal_amount,
        invoice_date=inv_date,
        due_date=d_date,
        delivery_date=del_date,
        po_number=payload.po_number,
        goods_description=payload.goods_description or "Commercial MSME Supplies",
        document_health_score=0.0,
        legal_health_score=0.0,
        ocr_details=ocr_result,
        deemed_acceptance_date=lock_deadline,
        deemed_acceptance_clause=deemed_clause,
        status=InvoiceStatus.PENDING
    )
    db.add(new_invoice)
    await db.commit()
    await db.refresh(new_invoice)

    return {
        "message": "Real MSME invoice registered, 15-day Deemed Acceptance timer active",
        "invoice_id": new_invoice.id,
        "id": new_invoice.id,
        "invoice_number": new_invoice.invoice_number,
        "principal_amount": new_invoice.principal_amount,
        "document_health_score": 0.0,
        "legal_health_score": 0.0,
        "deemed_acceptance_date": lock_deadline.isoformat(),
        "portal_token": new_invoice.portal_token
    }

@router.post("/upload", status_code=201)
async def upload_invoice_documents(
    invoice_number: str = Form(...),
    vendor_id: int = Form(...),
    buyer_id: int = Form(...),
    principal_amount: float = Form(...),
    invoice_date_val: str = Form(...),
    due_date_val: str = Form(...),
    po_number: Optional[str] = Form(None),
    goods_description: Optional[str] = Form("Commercial Goods Consignment"),
    delivery_date_val: Optional[str] = Form(None),
    po_file: Optional[UploadFile] = File(None),
    pod_file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
    """
    POST /api/v1/invoices/upload:
    File upload endpoint for POs/PODs with automated OCR health scoring 
    and 15-day Deemed Acceptance timer initialization.
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
    del_date = datetime.strptime(delivery_date_val, "%Y-%m-%d").date() if delivery_date_val else inv_date

    # Generate 15-day Deemed Acceptance Clause and calculate deadline
    deemed_clause, lock_deadline = InvoiceLockEngine.generate_contractual_clause(del_date)
    lock_info = InvoiceLockEngine.evaluate_acceptance_lock(del_date, "PENDING", date.today())

    stmt = select(Invoice).where(Invoice.invoice_number == invoice_number)
    existing = (await db.execute(stmt)).scalar_one_or_none()

    if existing:
        existing.document_health_score = ocr_result["document_health_score"]
        existing.legal_health_score = ocr_result["document_health_score"]
        existing.ocr_details = ocr_result
        existing.deemed_acceptance_date = lock_deadline
        existing.deemed_acceptance_clause = deemed_clause
        if po_path:
            existing.po_file_url = f"/uploads/{os.path.basename(po_path)}"
        if pod_path:
            existing.pod_file_url = f"/uploads/{os.path.basename(pod_path)}"
        await db.commit()
        await db.refresh(existing)
        return {
            "message": "Invoice document health and 15-day deemed acceptance clock updated",
            "invoice_id": existing.id,
            "id": existing.id,
            "invoice_number": existing.invoice_number,
            "document_health_score": existing.document_health_score,
            "legal_health_score": existing.legal_health_score,
            "deemed_acceptance_date": lock_deadline.isoformat(),
            "deemed_acceptance_clause": deemed_clause,
            "deemed_acceptance_info": lock_info,
            "ocr_result": ocr_result
        }

    new_invoice = Invoice(
        invoice_number=invoice_number,
        vendor_id=vendor_id,
        buyer_id=buyer_id,
        principal_amount=principal_amount,
        invoice_date=inv_date,
        due_date=d_date,
        delivery_date=del_date,
        po_number=po_number,
        goods_description=goods_description,
        document_health_score=ocr_result["document_health_score"],
        legal_health_score=ocr_result["document_health_score"],
        ocr_details=ocr_result,
        deemed_acceptance_date=lock_deadline,
        deemed_acceptance_clause=deemed_clause,
        po_file_url=f"/uploads/{os.path.basename(po_path)}" if po_path else None,
        pod_file_url=f"/uploads/{os.path.basename(pod_path)}" if pod_path else None,
        status=InvoiceStatus.PENDING
    )
    db.add(new_invoice)
    await db.commit()
    await db.refresh(new_invoice)

    return {
        "message": "Invoice registered, OCR scored, and 15-day Deemed Acceptance timer initialized",
        "invoice_id": new_invoice.id,
        "id": new_invoice.id,
        "invoice_number": new_invoice.invoice_number,
        "document_health_score": new_invoice.document_health_score,
        "legal_health_score": new_invoice.legal_health_score,
        "deemed_acceptance_date": lock_deadline.isoformat(),
        "deemed_acceptance_clause": deemed_clause,
        "deemed_acceptance_info": lock_info,
        "portal_token": new_invoice.portal_token,
        "ocr_result": ocr_result
    }

@router.get("/{invoice_id}/health-check")
async def get_invoice_health_check(invoice_id: int, db: AsyncSession = Depends(get_db)):
    inv = await db.get(Invoice, invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    vendor = await db.get(Company, inv.vendor_id)
    delivery = inv.delivery_date or inv.invoice_date
    lock_info = InvoiceLockEngine.evaluate_acceptance_lock(delivery, inv.status.value, date.today())

    if not inv.ocr_details:
        ocr_res = DocumentHealthInspector.inspect_delivery_proof(
            expected_po_number=inv.po_number or "",
            expected_invoice_number=inv.invoice_number
        )
        inv.ocr_details = ocr_res
        inv.document_health_score = ocr_res["document_health_score"]
        inv.legal_health_score = ocr_res["document_health_score"]
        await db.commit()
        
    return {
        "invoice_id": inv.id,
        "invoice_number": inv.invoice_number,
        "document_health_score": inv.document_health_score,
        "legal_health_score": inv.legal_health_score or inv.document_health_score,
        "deemed_acceptance": lock_info,
        "vendor_status": {
            "major_activity": vendor.major_activity.value if vendor else "MANUFACTURING",
            "enterprise_class": vendor.enterprise_class.value if vendor else "MICRO",
            "sec_43bh_eligible": (vendor.major_activity.value != "TRADING" and vendor.enterprise_class.value in ["MICRO", "SMALL"]) if vendor else True
        },
        "details": inv.ocr_details
    }
