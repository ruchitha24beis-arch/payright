import hashlib
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.database import get_db
from app.models.user import User, UserRole
from app.models.company import Company, CompanyRole, EnterpriseClass, MajorActivity
from app.models.invoice import Invoice
from app.models.emi import EMIPlan, EMISchedule
from app.models.order import LinkedOrder
from app.schemas.user import UserRegisterRequest, UserLoginRequest, CompanyUpdateRequest, UserResponse
from app.engines.udyam_verifier import UdyamVerifier

router = APIRouter(prefix="/auth", tags=["User Authentication & Login Person"])

def hash_password(password: str) -> str:
    return hashlib.sha256((password + "chanakya_salt_2026").encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def serialize_company(comp: Company) -> Dict[str, Any]:
    if not comp:
        return None
    return {
        "id": comp.id,
        "name": comp.name,
        "gstin": comp.gstin,
        "udyam_reg_number": comp.udyam_reg_number,
        "udyam_verified": comp.udyam_verified,
        "udyam_verified_at": comp.udyam_verified_at.isoformat() if comp.udyam_verified_at else None,
        "enterprise_category": comp.enterprise_category.value if hasattr(comp.enterprise_category, "value") else str(comp.enterprise_category),
        "enterprise_class": comp.enterprise_class.value if hasattr(comp.enterprise_class, "value") else str(comp.enterprise_class),
        "major_activity": comp.major_activity.value if hasattr(comp.major_activity, "value") else str(comp.major_activity),
        "credit_limit": comp.credit_limit,
        "is_tax_loss": comp.is_tax_loss,
        "contact_person": comp.contact_person,
        "email": comp.email,
        "phone": comp.phone,
        "bank_account_number": getattr(comp, "bank_account_number", None),
        "bank_ifsc": getattr(comp, "bank_ifsc", None),
        "corporate_tax_rate": comp.corporate_tax_rate,
        "sec_43bh_eligible": (
            (comp.major_activity.value if hasattr(comp.major_activity, "value") else str(comp.major_activity)) != "TRADING" and
            (comp.enterprise_class.value if hasattr(comp.enterprise_class, "value") else str(comp.enterprise_class)) in ["MICRO", "SMALL"]
        )
    }

@router.post("/register", response_model=UserResponse)
async def register(payload: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new MSME User & set up their real business company profile"""
    email_clean = payload.email.strip().lower()
    
    # Check if user already exists
    stmt = select(User).where(User.email == email_clean)
    existing_user = (await db.execute(stmt)).scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please log in.")

    # Find or create company
    comp_stmt = select(Company).where(Company.gstin == payload.gstin.strip().upper())
    company = (await db.execute(comp_stmt)).scalar_one_or_none()

    # Validate Udyam format and evaluate Section 43B(h) eligibility
    udyam_data = None
    is_verified = False
    activity = MajorActivity.MANUFACTURING
    e_class = EnterpriseClass.MICRO
    
    if payload.udyam_reg_number:
        udyam_res = UdyamVerifier.verify_udyam_registration(
            udyam_reg_number=payload.udyam_reg_number.strip().upper(),
            gstin=payload.gstin.strip().upper(),
            company_name=payload.company_name.strip()
        )
        udyam_data = udyam_res
        is_verified = udyam_res["is_valid_format"]
        activity = MajorActivity(udyam_res["major_activity"])
        e_class = EnterpriseClass(udyam_res["enterprise_class"])
    else:
        try:
            if payload.major_activity:
                activity = MajorActivity(payload.major_activity.upper())
            if payload.enterprise_class:
                e_class = EnterpriseClass(payload.enterprise_class.upper())
        except Exception:
            pass

    if not company:
        company = Company(
            name=payload.company_name.strip(),
            gstin=payload.gstin.strip().upper(),
            udyam_reg_number=payload.udyam_reg_number.strip().upper() if payload.udyam_reg_number else None,
            udyam_verified=is_verified,
            udyam_verified_at=datetime.utcnow() if is_verified else None,
            udyam_data=udyam_data,
            role=CompanyRole.VENDOR,
            enterprise_category=e_class,
            enterprise_class=e_class,
            major_activity=activity,
            contact_person=payload.contact_person or payload.name,
            email=email_clean,
            phone=payload.phone,
            bank_account_number=payload.bank_account_number,
            bank_ifsc=payload.bank_ifsc,
            corporate_tax_rate=0.25
        )
        db.add(company)
        await db.commit()
        await db.refresh(company)

    # Determine user role
    role_enum = UserRole.ACCOUNTS_RECEIVABLE
    try:
        if payload.role:
            role_enum = UserRole(payload.role.upper())
    except Exception:
        pass

    new_user = User(
        name=payload.name.strip(),
        email=email_clean,
        password_hash=hash_password(payload.password),
        role=role_enum,
        company_id=company.id
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = f"chk_{new_user.id}_{uuid.uuid4().hex[:16]}"

    return UserResponse(
        id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        role=new_user.role.value if hasattr(new_user.role, "value") else str(new_user.role),
        company_id=company.id,
        company=serialize_company(company),
        token=token,
        created_at=new_user.created_at
    )

@router.post("/login", response_model=UserResponse)
async def login(payload: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate registered person and load their company profile"""
    email_clean = payload.email.strip().lower()
    stmt = select(User).where(User.email == email_clean)
    user = (await db.execute(stmt)).scalar_one_or_none()

    if not user:
        # Check if default demo user is needed
        if email_clean in ["rajesh@apexprecision.in", "admin@chanakya.in"]:
            # Auto-provision primary MSME user
            comp_stmt = select(Company).where(Company.role == CompanyRole.VENDOR)
            company = (await db.execute(comp_stmt)).scalars().first()
            if company:
                user = User(
                    name="Rajesh Sharma",
                    email=email_clean,
                    password_hash=hash_password(payload.password or "admin123"),
                    role=UserRole.FINANCE_HEAD,
                    company_id=company.id
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    company = None
    if user.company_id:
        company = await db.get(Company, user.company_id)

    token = f"chk_{user.id}_{uuid.uuid4().hex[:16]}"

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        company_id=user.company_id,
        company=serialize_company(company),
        token=token,
        created_at=user.created_at
    )

@router.get("/me", response_model=UserResponse)
async def get_me(user_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    """Fetch currently active user profile and company info"""
    user = None
    if user_id:
        user = await db.get(User, user_id)
    
    if not user:
        # Return first user or default admin
        stmt = select(User).order_by(User.id)
        user = (await db.execute(stmt)).scalars().first()

    if not user:
        # Create default primary user from first vendor
        comp_stmt = select(Company).where(Company.role == CompanyRole.VENDOR)
        company = (await db.execute(comp_stmt)).scalars().first()
        if company:
            user = User(
                name="Rajesh Sharma",
                email="rajesh@apexprecision.in",
                password_hash=hash_password("admin123"),
                role=UserRole.FINANCE_HEAD,
                company_id=company.id
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

    if not user:
        raise HTTPException(status_code=404, detail="No active user found. Please register or log in.")

    company = None
    if user.company_id:
        company = await db.get(Company, user.company_id)

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        company_id=user.company_id,
        company=serialize_company(company),
        token=f"chk_{user.id}_active",
        created_at=user.created_at
    )

@router.put("/company")
async def update_company_profile(
    payload: CompanyUpdateRequest,
    company_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """Update company details, banking information, or trigger live Udyam re-verification"""
    company = None
    if company_id:
        company = await db.get(Company, company_id)
    else:
        # Default to first vendor company
        stmt = select(Company).where(Company.role == CompanyRole.VENDOR)
        company = (await db.execute(stmt)).scalars().first()

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    if payload.name:
        company.name = payload.name.strip()
    if payload.gstin:
        company.gstin = payload.gstin.strip().upper()
    if payload.phone:
        company.phone = payload.phone.strip()
    if payload.email:
        company.email = payload.email.strip()
    if payload.contact_person:
        company.contact_person = payload.contact_person.strip()
    if payload.bank_account_number is not None:
        company.bank_account_number = payload.bank_account_number.strip()
    if payload.bank_ifsc is not None:
        company.bank_ifsc = payload.bank_ifsc.strip().upper()
    if payload.corporate_tax_rate is not None:
        company.corporate_tax_rate = payload.corporate_tax_rate

    if payload.udyam_reg_number is not None:
        udyam_no = payload.udyam_reg_number.strip().upper()
        company.udyam_reg_number = udyam_no
        # Trigger verification
        res = UdyamVerifier.verify_udyam_registration(
            udyam_reg_number=udyam_no,
            gstin=company.gstin,
            company_name=company.name
        )
        company.udyam_verified = res["is_valid_format"]
        company.udyam_verified_at = datetime.utcnow() if res["is_valid_format"] else None
        company.udyam_data = res
        company.major_activity = MajorActivity(res["major_activity"])
        company.enterprise_class = EnterpriseClass(res["enterprise_class"])
        company.enterprise_category = EnterpriseClass(res["enterprise_class"])
    else:
        if payload.major_activity:
            try:
                company.major_activity = MajorActivity(payload.major_activity.upper())
            except Exception:
                pass
        if payload.enterprise_class:
            try:
                company.enterprise_class = EnterpriseClass(payload.enterprise_class.upper())
                company.enterprise_category = EnterpriseClass(payload.enterprise_class.upper())
            except Exception:
                pass

    await db.commit()
    await db.refresh(company)
    return {"message": "Company profile updated successfully", "company": serialize_company(company)}

@router.get("/personas")
async def list_available_personas(db: AsyncSession = Depends(get_db)):
    """List sample accounts for quick switching between MSME roles"""
    users = (await db.execute(select(User))).scalars().all()
    personas = []
    for u in users:
        comp = await db.get(Company, u.company_id) if u.company_id else None
        personas.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role.value if hasattr(u.role, "value") else str(u.role),
            "company_name": comp.name if comp else "Independent",
            "udyam_status": "Verified" if (comp and comp.udyam_verified) else "Pending"
        })
    return personas

@router.post("/clear-demo-data")
async def clear_demo_data(keep_company_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    """
    Clears all dummy/sample invoices, settlements, and linked orders so the user 
    can work 100% with their own user-entered business data.
    """
    # Delete EMIs and linked orders
    await db.execute(delete(EMISchedule))
    await db.execute(delete(EMIPlan))
    await db.execute(delete(LinkedOrder))

    # Delete invoices
    if keep_company_id:
        await db.execute(delete(Invoice).where(Invoice.vendor_id != keep_company_id))
    else:
        await db.execute(delete(Invoice))

    await db.commit()
    return {"message": "Sample dummy data cleared successfully. System is now ready for your own real invoices and buyers."}

@router.post("/reset-demo-data")
async def reset_demo_data(db: AsyncSession = Depends(get_db)):
    """Re-populates standard statutory benchmark demo data if requested"""
    from app.seed_data import seed_database
    await seed_database()
    return {"message": "Statutory benchmark demonstration dataset reloaded."}
