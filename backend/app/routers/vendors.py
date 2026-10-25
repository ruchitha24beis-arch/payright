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

@router.get("/buyers", response_model=List[CompanyRead])
async def list_buyers(db: AsyncSession = Depends(get_db)):
    """List all Corporate Buyers"""
    stmt = select(Company).where(Company.role == CompanyRole.BUYER).order_by(Company.name)
    buyers = (await db.execute(stmt)).scalars().all()
    return buyers

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
