from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.company import Company, CompanyRole, MajorActivity, EnterpriseClass
from app.schemas.company import CompanyCreate, CompanyRead, UdyamVerifyRequest, UdyamVerifyResponse
from app.engines.udyam_verifier import UdyamVerifier

router = APIRouter(prefix="/vendors", tags=["MSME Vendors & Udyam Verification"])

@router.get("", response_model=List[CompanyRead])
async def list_vendors(db: AsyncSession = Depends(get_db)):
    """List all registered MSME Vendors"""
    stmt = select(Company).where(Company.role == CompanyRole.VENDOR)
    vendors = (await db.execute(stmt)).scalars().all()
    return vendors

@router.get("/buyers")
async def list_buyers(vendor_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    """List all Corporate Buyers with calculated outstandings"""
    from app.models.invoice import Invoice, InvoiceStatus
    stmt = select(Company).where(Company.role == CompanyRole.BUYER).order_by(Company.name)
    buyers = (await db.execute(stmt)).scalars().all()
    
    # Calculate outstandings per buyer
    inv_stmt = select(Invoice).where(Invoice.status != InvoiceStatus.PAID)
    if vendor_id:
        inv_stmt = inv_stmt.where(Invoice.vendor_id == vendor_id)
    invoices = (await db.execute(inv_stmt)).scalars().all()

    outstandings_by_buyer = {}
    for inv in invoices:
        balance = inv.principal_amount - (inv.paid_amount or 0.0)
        outstandings_by_buyer[inv.buyer_id] = outstandings_by_buyer.get(inv.buyer_id, 0.0) + balance

    result = []
    for b in buyers:
        b_dict = {
            "id": b.id,
            "name": b.name,
            "gstin": b.gstin,
            "role": b.role.value if hasattr(b.role, "value") else str(b.role),
            "enterprise_category": b.enterprise_category.value if hasattr(b.enterprise_category, "value") else str(b.enterprise_category),
            "enterprise_class": b.enterprise_class.value if hasattr(b.enterprise_class, "value") else str(b.enterprise_class),
            "major_activity": b.major_activity.value if hasattr(b.major_activity, "value") else str(b.major_activity),
            "credit_limit": b.credit_limit,
            "annual_turnover": b.annual_turnover or 1000.0,
            "net_profit_margin": b.net_profit_margin if b.net_profit_margin is not None else 8.0,
            "mca_filing_status": b.mca_filing_status or "ACTIVE_COMPLIANT",
            "is_tax_loss": b.is_tax_loss,
            "total_outstandings": round(outstandings_by_buyer.get(b.id, 0.0), 2),
            "contact_person": b.contact_person,
            "email": b.email,
            "phone": b.phone,
            "corporate_tax_rate": b.corporate_tax_rate,
            "created_at": b.created_at
        }
        result.append(b_dict)
    return result

@router.get("/buyers-treasury")
async def get_buyers_treasury_breakdown(
    vendor_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Corporate Treasury Breakdown Table displaying:
    - Company Name & GSTIN / Udyam Classification
    - Annual Financial Turnover (e.g., ₹2,500 Cr)
    - Current Total Outstanding Balance to MSME Vendors
    - Credit Limit & Credit Risk Utilization Bar (% utilized)
    - Section 43B(h) Vulnerability Status (Displays whether tax disallowance warnings apply based on MCA tax filing status)
    """
    from app.models.invoice import Invoice, InvoiceStatus
    stmt = select(Company).where(Company.role == CompanyRole.BUYER).order_by(Company.name)
    buyers = (await db.execute(stmt)).scalars().all()

    inv_stmt = select(Invoice).where(Invoice.status != InvoiceStatus.PAID)
    if vendor_id:
        inv_stmt = inv_stmt.where(Invoice.vendor_id == vendor_id)
    invoices = (await db.execute(inv_stmt)).scalars().all()

    invoices_by_buyer = {}
    for inv in invoices:
        invoices_by_buyer.setdefault(inv.buyer_id, []).append(inv)

    breakdown = []
    for b in buyers:
        buyer_invs = invoices_by_buyer.get(b.id, [])
        total_out = sum(i.principal_amount - (i.paid_amount or 0.0) for i in buyer_invs)
        limit = b.credit_limit or 1000000.0
        util_pct = round((total_out / limit) * 100.0, 1) if limit > 0 else 0.0

        is_tax_loss = b.is_tax_loss or (b.mca_filing_status == "TAX_LOSS_EXEMPT")
        # Sec 43B(h) applies only if buyer has net corporate income tax liability
        sec_43bh_active = not is_tax_loss

        breakdown.append({
            "buyer_id": b.id,
            "company_name": b.name,
            "gstin": b.gstin,
            "classification": b.enterprise_class.value if hasattr(b.enterprise_class, "value") else str(b.enterprise_class),
            "annual_turnover": b.annual_turnover or 12000.0, # In ₹ Crores
            "net_profit_margin": b.net_profit_margin if b.net_profit_margin is not None else 8.5,
            "mca_filing_status": b.mca_filing_status or "ACTIVE_COMPLIANT",
            "total_outstandings": round(total_out, 2),
            "unpaid_invoices_count": len(buyer_invs),
            "credit_limit": limit,
            "utilization_pct": util_pct,
            "is_tax_loss": is_tax_loss,
            "sec_43bh_vulnerability": {
                "active": sec_43bh_active,
                "status_badge": "TAX_PENALTY_ACTIVE" if sec_43bh_active else "NET_LOSS_EXEMPT",
                "estimated_tax_penalty": round(total_out * (b.corporate_tax_rate or 0.30), 2) if sec_43bh_active else 0.0,
                "explanation": (
                    f"Profitable corporate. Section 43B(h) disallowance penalty applies (~{int((b.corporate_tax_rate or 0.30)*100)}% tax loss) if unpaid by Mar 31."
                    if sec_43bh_active else
                    "MCA filings confirm net operating tax loss. Sec 43B(h) disallowance carries zero tax liability; platform automatically pivots to Sec 16 compound interest (3x RBI rate)."
                )
            },
            "contact_person": b.contact_person,
            "email": b.email,
            "phone": b.phone
        })

    return breakdown

@router.post("/buyers", response_model=CompanyRead)
async def create_buyer(
    payload: CompanyCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new Corporate Buyer with credit limits and tax parameters"""
    gstin_clean = payload.gstin.strip().upper()
    stmt = select(Company).where(Company.gstin == gstin_clean)
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        # Update existing buyer
        existing.name = payload.name.strip()
        existing.email = payload.email.strip()
        existing.phone = payload.phone
        existing.contact_person = payload.contact_person
        existing.credit_limit = payload.credit_limit
        existing.is_tax_loss = payload.is_tax_loss
        existing.corporate_tax_rate = payload.corporate_tax_rate
        await db.commit()
        await db.refresh(existing)
        return existing

    new_buyer = Company(
        name=payload.name.strip(),
        gstin=gstin_clean,
        role=CompanyRole.BUYER,
        email=payload.email.strip(),
        phone=payload.phone,
        contact_person=payload.contact_person,
        credit_limit=payload.credit_limit,
        is_tax_loss=payload.is_tax_loss,
        corporate_tax_rate=payload.corporate_tax_rate or 0.30,
        enterprise_category=EnterpriseClass.MICRO,
        enterprise_class=EnterpriseClass.MICRO,
        major_activity=MajorActivity.MANUFACTURING
    )
    db.add(new_buyer)
    await db.commit()
    await db.refresh(new_buyer)
    return new_buyer

@router.post("/udyam-verify", response_model=UdyamVerifyResponse)
async def verify_udyam_endpoint(
    payload: UdyamVerifyRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    POST /api/v1/vendors/udyam-verify:
    Validates Udyam registration, inspects classification profile, and enforces 
    the Section 43B(h) loophole rule:
    - Micro & Small Manufacturers/Services: Eligible for Section 43B(h) tax penalty advisories.
    - Traders & Medium Enterprises: Disables 43B(h) and pivots to Section 16 penal compound interest.
    """
    verification = UdyamVerifier.verify_udyam_registration(
        udyam_reg_number=payload.udyam_reg_number,
        gstin=payload.gstin,
        company_name=payload.company_name
    )

    vendor = None
    if payload.vendor_id:
        vendor = await db.get(Company, payload.vendor_id)
    elif payload.gstin:
        stmt = select(Company).where(Company.gstin == payload.gstin)
        vendor = (await db.execute(stmt)).scalar_one_or_none()

    if vendor:
        vendor.udyam_reg_number = verification["udyam_reg_number"]
        vendor.udyam_verified = verification["is_valid_format"]
        vendor.udyam_verified_at = datetime.utcnow()
        vendor.major_activity = MajorActivity(verification["major_activity"])
        vendor.enterprise_class = EnterpriseClass(verification["enterprise_class"])
        vendor.enterprise_category = EnterpriseClass(verification["enterprise_class"])
        vendor.udyam_data = verification
        await db.commit()
        await db.refresh(vendor)

    return UdyamVerifyResponse(
        udyam_reg_number=verification["udyam_reg_number"],
        is_valid_format=verification["is_valid_format"],
        verification_status=verification["verification_status"],
        verified_at=verification["verified_at"],
        enterprise_class=verification["enterprise_class"],
        major_activity=verification["major_activity"],
        sec_43bh_eligible=verification["sec_43bh_eligible"],
        loophole_flag=verification["loophole_flag"],
        advisory_pivot=verification["advisory_pivot"],
        policy_reason=verification["policy_reason"],
        profile_details=verification["profile_details"],
        vendor_id=vendor.id if vendor else payload.vendor_id
    )
