import asyncio
import hashlib
from datetime import date, datetime, timedelta
from app.database import AsyncSessionLocal, engine, Base
from app.models.company import Company, CompanyRole, EnterpriseCategory, EnterpriseClass, MajorActivity
from app.models.user import User, UserRole
from app.models.invoice import Invoice, InvoiceStatus
from app.models.emi import EMIPlan, EMISchedule, EMIPlanStatus, EMIScheduleStatus, ENACHMandateStatus
from app.models.order import LinkedOrder, ReleaseRule, OrderStatus
from app.models.portal_session import AggregatedPortalToken
from app.engines.ocr_inspector import DocumentHealthInspector
from app.engines.invoice_lock_engine import InvoiceLockEngine
from app.engines.enach_mandate import ENACHMandateEngine
from app.engines.udyam_verifier import UdyamVerifier

def hash_password(password: str) -> str:
    return hashlib.sha256((password + "chanakya_salt_2026").encode()).hexdigest()

async def seed_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # 1. 5 MSME Suppliers (Including 1 Trader to test Section 43B(h) fallback safeguard)
        msmes = [
            Company(
                name="Apex Precision Engineering Pvt Ltd",
                gstin="27AAACA1234F1Z5",
                udyam_reg_number="UDYAM-MH-01-0012345",
                udyam_verified=True,
                udyam_verified_at=datetime.utcnow(),
                role=CompanyRole.VENDOR,
                enterprise_category=EnterpriseCategory.MICRO,
                enterprise_class=EnterpriseClass.MICRO,
                major_activity=MajorActivity.MANUFACTURING,
                credit_limit=5000000.0,
                annual_turnover=18.5,
                net_profit_margin=12.2,
                mca_filing_status="ACTIVE_COMPLIANT",
                is_tax_loss=False,
                contact_person="Rajesh Sharma (Managing Director)",
                email="accounts@apexprecision.in",
                phone="+91 98201 11223",
                corporate_tax_rate=0.25
            ),
            Company(
                name="Sahyadri Industrial Fasteners LLP",
                gstin="27AABCS5678B1Z2",
                udyam_reg_number="UDYAM-MH-03-0098765",
                udyam_verified=True,
                udyam_verified_at=datetime.utcnow(),
                role=CompanyRole.VENDOR,
                enterprise_category=EnterpriseCategory.SMALL,
                enterprise_class=EnterpriseClass.SMALL,
                major_activity=MajorActivity.MANUFACTURING,
                credit_limit=7500000.0,
                annual_turnover=32.0,
                net_profit_margin=9.5,
                mca_filing_status="ACTIVE_COMPLIANT",
                is_tax_loss=False,
                contact_person="Vikram Patil (Partner)",
                email="billing@sahyadrifasteners.com",
                phone="+91 98192 33445",
                corporate_tax_rate=0.25
            ),
            Company(
                name="Kaveri Polymer & Packaging Solutions",
                gstin="29AACCK9988D1Z9",
                udyam_reg_number="UDYAM-KR-08-0054321",
                udyam_verified=True,
                udyam_verified_at=datetime.utcnow(),
                role=CompanyRole.VENDOR,
                enterprise_category=EnterpriseCategory.MICRO,
                enterprise_class=EnterpriseClass.MICRO,
                major_activity=MajorActivity.SERVICES,
                credit_limit=3000000.0,
                annual_turnover=8.5,
                net_profit_margin=14.0,
                mca_filing_status="ACTIVE_COMPLIANT",
                is_tax_loss=False,
                contact_person="Sunita Rao (Proprietor)",
                email="finance@kaveripolymers.in",
                phone="+91 94481 55667",
                corporate_tax_rate=0.25
            ),
            Company(
                name="Zenith Toolings & Automation",
                gstin="24AAACZ4321E1Z0",
                udyam_reg_number="UDYAM-GJ-02-0077889",
                udyam_verified=True,
                udyam_verified_at=datetime.utcnow(),
                role=CompanyRole.VENDOR,
                enterprise_category=EnterpriseCategory.SMALL,
                enterprise_class=EnterpriseClass.SMALL,
                major_activity=MajorActivity.MANUFACTURING,
                credit_limit=4500000.0,
                annual_turnover=14.0,
                net_profit_margin=10.2,
                mca_filing_status="ACTIVE_COMPLIANT",
                is_tax_loss=False,
                contact_person="Bhavesh Mehta (Operations Head)",
                email="accounts@zenithtooling.co.in",
                phone="+91 98790 77889",
                corporate_tax_rate=0.25
            ),
            Company(
                # CRITICAL LOOPHOLE TEST: TRADER EXCLUDED FROM 43B(h)
                name="Apex Industrial Tools & Hardware Corp",
                gstin="07AABCE1122C1Z8",
                udyam_reg_number="UDYAM-DL-05-0033221",
                udyam_verified=True,
                udyam_verified_at=datetime.utcnow(),
                role=CompanyRole.VENDOR,
                enterprise_category=EnterpriseCategory.SMALL,
                enterprise_class=EnterpriseClass.SMALL,
                major_activity=MajorActivity.TRADING,  # TRADER!
                credit_limit=6000000.0,
                annual_turnover=22.0,
                net_profit_margin=5.1,
                mca_filing_status="ACTIVE_COMPLIANT",
                is_tax_loss=False,
                contact_person="Anil Aggarwal (Director)",
                email="cfo@apexhardwaretraders.com",
                phone="+91 98110 99001",
                corporate_tax_rate=0.25
            )
        ]
        db.add_all(msmes)
        await db.flush()

        # 2. 3 Corporate Buyers (Including 1 in Net Operating Tax Loss)
        buyers = [
            Company(
                name="Tata Motors Commercial Vehicles Ltd",
                gstin="27AAACT0418Q1ZS",
                udyam_reg_number=None,
                role=CompanyRole.BUYER,
                enterprise_category=EnterpriseCategory.MEDIUM,
                enterprise_class=EnterpriseClass.MEDIUM,
                major_activity=MajorActivity.MANUFACTURING,
                credit_limit=3500000.0,  # 35L Limit
                annual_turnover=43500.0, # ₹43,500 Crores
                net_profit_margin=8.4,
                mca_filing_status="ACTIVE_COMPLIANT",
                is_tax_loss=False,       # Normal profitable corporate
                contact_person="Nitin Kulkarni (Head of Procurement)",
                email="procurement.vendorpay@tatamotors.com",
                phone="+91 22 6656 1234",
                corporate_tax_rate=0.30
            ),
            Company(
                # CRITICAL LOOPHOLE TEST: BUYER IN NET TAX LOSS
                name="Bharat Heavy Infra & Engineering Corp",
                gstin="06AAACB2233M1ZQ",
                udyam_reg_number=None,
                role=CompanyRole.BUYER,
                enterprise_category=EnterpriseCategory.MEDIUM,
                enterprise_class=EnterpriseClass.MEDIUM,
                major_activity=MajorActivity.MANUFACTURING,
                credit_limit=2500000.0,  # 25L Limit
                annual_turnover=8400.0,  # ₹8,400 Crores
                net_profit_margin=-3.2,
                mca_filing_status="TAX_LOSS_EXEMPT",
                is_tax_loss=True,        # TAX LOSS! Disables 43B(h) and triggers Sec 16 interest warnings
                contact_person="Priya Deshmukh (Accounts Payable)",
                email="ap.inward@bharatinfraeng.com",
                phone="+91 124 456 7890",
                corporate_tax_rate=0.30
            ),
            Company(
                name="Larsen Auto & Industrial Systems Ltd",
                gstin="27AAACL8899K1Z4",
                udyam_reg_number=None,
                role=CompanyRole.BUYER,
                enterprise_category=EnterpriseCategory.MEDIUM,
                enterprise_class=EnterpriseClass.MEDIUM,
                major_activity=MajorActivity.MANUFACTURING,
                credit_limit=4000000.0,  # 40L Limit
                annual_turnover=14200.0, # ₹14,200 Crores
                net_profit_margin=11.5,
                mca_filing_status="ACTIVE_COMPLIANT",
                is_tax_loss=False,
                contact_person="Arun Nambiar (Corporate Treasury)",
                email="treasury.payables@larsenauto.com",
                phone="+91 22 2857 0000",
                corporate_tax_rate=0.30
            )
        ]
        db.add_all(buyers)
        await db.flush()

        # 3. Linked Open Orders for Pro-Rata / Milestone Releases
        orders = [
            LinkedOrder(
                po_number="PO-TATA-2024-8891",
                vendor_id=msmes[0].id,
                buyer_id=buyers[0].id,
                item_description="Precision CNC Machined Hub Assemblies",
                total_units=1000,
                units_released=250,
                release_rule=ReleaseRule.PRO_RATA,
                units_per_emi_payment=250,
                unit_price=1200.0,
                total_order_value=1200000.0,
                status=OrderStatus.ACTIVE
            ),
            LinkedOrder(
                po_number="PO-BHARAT-2024-4412",
                vendor_id=msmes[1].id,
                buyer_id=buyers[1].id,
                item_description="High-Tensile Structural Fastener Sets",
                total_units=2000,
                units_released=500,
                release_rule=ReleaseRule.PRO_RATA,
                units_per_emi_payment=500,
                unit_price=450.0,
                total_order_value=900000.0,
                status=OrderStatus.ACTIVE
            ),
            LinkedOrder(
                po_number="PO-LARSEN-2024-9018",
                vendor_id=msmes[3].id,
                buyer_id=buyers[2].id,
                item_description="Custom Press Tooling Dies",
                total_units=50,
                units_released=0,
                release_rule=ReleaseRule.MILESTONE_LOCK,
                units_per_emi_payment=25,
                unit_price=35000.0,
                total_order_value=1750000.0,
                status=OrderStatus.HOLD_CREDIT_BREACH
            )
        ]
        db.add_all(orders)
        await db.flush()

        # 4. 10 Overdue Invoices
        today = date.today()
        raw_invoices = [
            # 1. Tata Motors (Active EMI + e-NACH)
            {
                "inv_num": "INV/APEX/24-25/089",
                "vendor": msmes[0],
                "buyer": buyers[0],
                "principal": 1250000.0,
                "days_overdue": 55,
                "health": 92.0,
                "po_no": "PO-TATA-2024-7711",
                "desc": "CNC Flange Rings Batch #1",
                "delivery_days_ago": 70,
                "financing_rail": "NONE",
                "financing_status": "NOT_REQUESTED"
            },
            # 2. Tata Motors
            {
                "inv_num": "INV/APEX/24-25/112",
                "vendor": msmes[0],
                "buyer": buyers[0],
                "principal": 840000.0,
                "days_overdue": 42,
                "health": 88.0,
                "po_no": "PO-TATA-2024-8891",
                "desc": "CNC Hub Assemblies Phase 1",
                "delivery_days_ago": 57,
                "financing_rail": "RAIL_1_TREDS",
                "financing_status": "RAIL_1_PENDING"
            },
            # 3. Tata Motors (Recent Delivery - 15-day countdown active!)
            {
                "inv_num": "INV/SAH/24-25/044",
                "vendor": msmes[1],
                "buyer": buyers[0],
                "principal": 620000.0,
                "days_overdue": 5,
                "health": 95.0,
                "po_no": "PO-TATA-2024-9102",
                "desc": "Grade 10.9 Metric Flange Bolts",
                "delivery_days_ago": 8,  # Only 8 days ago: 7 days remaining on deemed acceptance!
                "financing_rail": "NONE",
                "financing_status": "NOT_REQUESTED"
            },
            # 4. Tata Motors
            {
                "inv_num": "INV/KAV/24-25/067",
                "vendor": msmes[2],
                "buyer": buyers[0],
                "principal": 480000.0,
                "days_overdue": 12,
                "health": 72.0,
                "po_no": "PO-TATA-2024-9330",
                "desc": "Custom Heavy Duty Polymer Pallets",
                "delivery_days_ago": 27,
                "financing_rail": "NONE",
                "financing_status": "NOT_REQUESTED"
            },
            # 5. Bharat Heavy Infra (Tax Loss Buyer demo + Active EMI)
            {
                "inv_num": "INV/SAH/24-25/031",
                "vendor": msmes[1],
                "buyer": buyers[1],
                "principal": 1420000.0,
                "days_overdue": 62,
                "health": 85.0,
                "po_no": "PO-BHARAT-2024-3890",
                "desc": "Structural Anchor Bolts M36",
                "delivery_days_ago": 77,
                "financing_rail": "NONE",
                "financing_status": "NOT_REQUESTED"
            },
            # 6. Bharat Heavy Infra (Trader MSME demo - Vendor 5 is TRADING)
            {
                "inv_num": "INV/APEXTRADE/24-25/012",
                "vendor": msmes[4],  # Trader MSME!
                "buyer": buyers[1],
                "principal": 980000.0,
                "days_overdue": 38,
                "health": 80.0,
                "po_no": "PO-BHARAT-2024-4115",
                "desc": "Wholesale Industrial Cutting Tool Kits",
                "delivery_days_ago": 53,
                "financing_rail": "NONE",
                "financing_status": "NOT_REQUESTED"
            },
            # 7. Bharat Heavy Infra (Dual Rail Failover demo: Rail 1 expired -> Rail 2 NBFC active)
            {
                "inv_num": "INV/ZEN/24-25/019",
                "vendor": msmes[3],
                "buyer": buyers[1],
                "principal": 750000.0,
                "days_overdue": 22,
                "health": 82.0,
                "po_no": "PO-BHARAT-2024-4288",
                "desc": "Industrial Hydraulic Stamping Fixtures",
                "delivery_days_ago": 37,
                "financing_rail": "RAIL_2_NBFC",
                "financing_status": "RAIL_2_ACTIVE"
            },
            # 8. Larsen Auto
            {
                "inv_num": "INV/ZEN/24-25/024",
                "vendor": msmes[3],
                "buyer": buyers[2],
                "principal": 1850000.0,
                "days_overdue": 48,
                "health": 90.0,
                "po_no": "PO-LARSEN-2024-8710",
                "desc": "Precision Sheet Metal Stamping Dies",
                "delivery_days_ago": 63,
                "financing_rail": "NONE",
                "financing_status": "NOT_REQUESTED"
            },
            # 9. Larsen Auto (Missing signature warning)
            {
                "inv_num": "INV/APEX/24-25/135",
                "vendor": msmes[0],
                "buyer": buyers[2],
                "principal": 1150000.0,
                "days_overdue": 31,
                "health": 55.0,
                "po_no": "PO-LARSEN-2024-8992",
                "desc": "High-Pressure Hydraulic Valve Blocks",
                "delivery_days_ago": 46,
                "financing_rail": "NONE",
                "financing_status": "NOT_REQUESTED"
            },
            # 10. Larsen Auto (Recent Delivery - 15-day countdown active!)
            {
                "inv_num": "INV/KAV/24-25/091",
                "vendor": msmes[2],
                "buyer": buyers[2],
                "principal": 920000.0,
                "days_overdue": 3,
                "health": 94.0,
                "po_no": "PO-LARSEN-2024-9205",
                "desc": "High-Impact Polymer Dashboard Casings",
                "delivery_days_ago": 5,  # 5 days ago: 10 days remaining on deemed acceptance!
                "financing_rail": "NONE",
                "financing_status": "NOT_REQUESTED"
            }
        ]

        created_invoices = []
        for raw in raw_invoices:
            delivery_date = today - timedelta(days=raw["delivery_days_ago"])
            invoice_date = delivery_date
            due_date = today - timedelta(days=raw["days_overdue"])

            # 15-day Deemed Acceptance logic
            deemed_clause, lock_deadline = InvoiceLockEngine.generate_contractual_clause(delivery_date)
            lock_eval = InvoiceLockEngine.evaluate_acceptance_lock(delivery_date, "PENDING", today)
            
            # If past 15 days, seal with cryptographic audit log
            audit_log = None
            status = InvoiceStatus.PENDING
            if lock_eval["is_locked"]:
                status = InvoiceStatus.DEEMED_ACCEPTED
                audit_log = InvoiceLockEngine.generate_acceptance_audit_log(
                    invoice_number=raw["inv_num"],
                    delivery_date=delivery_date,
                    buyer_gstin=raw["buyer"].gstin,
                    vendor_gstin=raw["vendor"].gstin,
                    health_score=raw["health"]
                )

            ocr_res = DocumentHealthInspector.inspect_delivery_proof(
                expected_po_number=raw["po_no"],
                expected_invoice_number=raw["inv_num"]
            )
            ocr_res["document_health_score"] = raw["health"]
            ocr_res["legal_health_score"] = raw["health"]

            inv = Invoice(
                invoice_number=raw["inv_num"],
                vendor_id=raw["vendor"].id,
                buyer_id=raw["buyer"].id,
                principal_amount=raw["principal"],
                paid_amount=0.0,
                invoice_date=invoice_date,
                due_date=due_date,
                delivery_date=delivery_date,
                deemed_acceptance_date=lock_deadline,
                deemed_acceptance_clause=deemed_clause,
                acceptance_audit_log=audit_log,
                po_number=raw["po_no"],
                goods_description=raw["desc"],
                document_health_score=raw["health"],
                legal_health_score=raw["health"],
                ocr_details=ocr_res,
                financing_rail=raw["financing_rail"],
                financing_status=raw["financing_status"],
                financing_failover_date=datetime.utcnow() - timedelta(days=8) if raw["financing_rail"] == "RAIL_2_NBFC" else datetime.utcnow() + timedelta(days=5),
                status=status
            )
            db.add(inv)
            created_invoices.append(inv)

        await db.flush()

        # 5. Create 2 Active e-NACH EMI Plans with linked order units & Section 25 PSSA protection
        # Plan 1: On Tata Motors Invoice #1 (INV/APEX/24-25/089)
        tata_inv = created_invoices[0]
        tata_inv.status = InvoiceStatus.PARTIAL_EMI
        tata_mandate = ENACHMandateEngine.generate_mandate(
            invoice_number=tata_inv.invoice_number,
            total_amount=round(tata_inv.principal_amount * 0.97, 2),
            amount_per_installment=round((tata_inv.principal_amount * 0.97) / 3.0, 2),
            total_installments=3,
            buyer_name=buyers[0].name,
            bank_name="HDFC Bank Corporate Treasury",
            account_last4="9012"
        )
        tata_emi = EMIPlan(
            invoice_id=tata_inv.id,
            vendor_id=tata_inv.vendor_id,
            buyer_id=tata_inv.buyer_id,
            linked_order_id=orders[0].id,
            total_installments=3,
            cash_discount_percent=3.0,
            original_principal=tata_inv.principal_amount,
            discounted_principal=round(tata_inv.principal_amount * 0.97, 2),
            amount_per_installment=round((tata_inv.principal_amount * 0.97) / 3.0, 2),
            status=EMIPlanStatus.ACTIVE,
            enach_mandate_status=ENACHMandateStatus.ACTIVE,
            umrn=tata_mandate["umrn"],
            mandate_auth_url=tata_mandate["mandate_auth_url"],
            mandate_bank_name="HDFC Bank Corporate Treasury",
            mandate_account_last4="9012",
            sec25_liability_acknowledged=True,
            mandate_authorized_at=datetime.utcnow() - timedelta(days=12),
            notes="Tata Motors Commercial Preservation 3-Month Plan (3% Prompt Discount) with Active e-NACH Mandate"
        )
        db.add(tata_emi)
        await db.flush()

        # Tata Schedule 1 (PAID, 250 units released)
        sch1 = EMISchedule(
            plan_id=tata_emi.id,
            installment_number=1,
            due_date=today - timedelta(days=10),
            amount=tata_emi.amount_per_installment,
            status=EMIScheduleStatus.PAID,
            paid_date=today - timedelta(days=9),
            payment_reference="NPCI-ACH-20261015-TATA01",
            enach_execution_status="SUCCESS",
            units_to_release=250,
            units_released_flag=True
        )
        # Tata Schedule 2 (PENDING, due in 20 days)
        sch2 = EMISchedule(
            plan_id=tata_emi.id,
            installment_number=2,
            due_date=today + timedelta(days=20),
            amount=tata_emi.amount_per_installment,
            status=EMIScheduleStatus.PENDING,
            enach_execution_status="PENDING",
            units_to_release=250,
            units_released_flag=False
        )
        # Tata Schedule 3 (PENDING, due in 50 days)
        sch3 = EMISchedule(
            plan_id=tata_emi.id,
            installment_number=3,
            due_date=today + timedelta(days=50),
            amount=round(tata_emi.discounted_principal - (tata_emi.amount_per_installment * 2), 2),
            status=EMIScheduleStatus.PENDING,
            enach_execution_status="PENDING",
            units_to_release=250,
            units_released_flag=False
        )
        db.add_all([sch1, sch2, sch3])
        tata_inv.paid_amount = sch1.amount

        # Plan 2: On Bharat Heavy Infra Invoice #5 (INV/SAH/24-25/031) - Tax Loss Buyer Demo
        bharat_inv = created_invoices[4]
        bharat_inv.status = InvoiceStatus.PARTIAL_EMI
        bharat_mandate = ENACHMandateEngine.generate_mandate(
            invoice_number=bharat_inv.invoice_number,
            total_amount=round(bharat_inv.principal_amount * 0.96, 2),
            amount_per_installment=round((bharat_inv.principal_amount * 0.96) / 2.0, 2),
            total_installments=2,
            buyer_name=buyers[1].name,
            bank_name="State Bank of India CAG Branch",
            account_last4="5588"
        )
        bharat_emi = EMIPlan(
            invoice_id=bharat_inv.id,
            vendor_id=bharat_inv.vendor_id,
            buyer_id=bharat_inv.buyer_id,
            linked_order_id=orders[1].id,
            total_installments=2,
            cash_discount_percent=4.0,
            original_principal=bharat_inv.principal_amount,
            discounted_principal=round(bharat_inv.principal_amount * 0.96, 2),
            amount_per_installment=round((bharat_inv.principal_amount * 0.96) / 2.0, 2),
            status=EMIPlanStatus.ACTIVE,
            enach_mandate_status=ENACHMandateStatus.ACTIVE,
            umrn=bharat_mandate["umrn"],
            mandate_auth_url=bharat_mandate["mandate_auth_url"],
            mandate_bank_name="State Bank of India CAG Branch",
            mandate_account_last4="5588",
            sec25_liability_acknowledged=True,
            mandate_authorized_at=datetime.utcnow() - timedelta(days=5),
            notes="Bharat Heavy Infra 2-Month Plan (4% Prompt Cash Discount) with Active e-NACH Mandate & Sec 25 PSSA"
        )
        db.add(bharat_emi)
        await db.flush()

        # Bharat Schedule 1 (PAID, 500 units released)
        bsch1 = EMISchedule(
            plan_id=bharat_emi.id,
            installment_number=1,
            due_date=today - timedelta(days=3),
            amount=bharat_emi.amount_per_installment,
            status=EMIScheduleStatus.PAID,
            paid_date=today - timedelta(days=2),
            payment_reference="NPCI-ACH-20261022-BHEL01",
            enach_execution_status="SUCCESS",
            units_to_release=500,
            units_released_flag=True
        )
        # Bharat Schedule 2 (PENDING, due in 27 days)
        bsch2 = EMISchedule(
            plan_id=bharat_emi.id,
            installment_number=2,
            due_date=today + timedelta(days=27),
            amount=round(bharat_emi.discounted_principal - bharat_emi.amount_per_installment, 2),
            status=EMIScheduleStatus.PENDING,
            enach_execution_status="PENDING",
            units_to_release=500,
            units_released_flag=False
        )
        db.add_all([bsch1, bsch2])
        bharat_inv.paid_amount = bsch1.amount

        # Also set Invoice #7 (Dual Rail Failover) as partially funded via Rail 2 NBFC
        rail2_inv = created_invoices[6]
        rail2_inv.status = InvoiceStatus.DISCOUNTED_TREDS
        rail2_inv.paid_amount = round(rail2_inv.principal_amount * 0.98, 2)

        # 5. Seed Core Personas (Separate Supplier vs Buyer User Accounts)
        users = [
            # Supplier Personas
            User(
                name="Rajesh Sharma (MD)",
                email="rajesh@apexprecision.in",
                password_hash=hash_password("admin123"),
                role=UserRole.SUPPLIER,
                company_id=msmes[0].id
            ),
            User(
                name="Apex Accounts Receivable",
                email="accounts@apexprecision.in",
                password_hash=hash_password("admin123"),
                role=UserRole.SUPPLIER,
                company_id=msmes[0].id
            ),
            User(
                name="Vikram Patil (Partner)",
                email="billing@sahyadrifasteners.com",
                password_hash=hash_password("admin123"),
                role=UserRole.SUPPLIER,
                company_id=msmes[1].id
            ),
            # Buyer Personas (Corporate Accounts Payable & Treasury)
            User(
                name="Nitin Kulkarni (Head of Procurement)",
                email="procurement@tatamotors.com",
                password_hash=hash_password("buyer123"),
                role=UserRole.BUYER,
                company_id=buyers[0].id
            ),
            User(
                name="Arun Nambiar (Corporate Treasury)",
                email="treasury@larsenauto.com",
                password_hash=hash_password("buyer123"),
                role=UserRole.BUYER,
                company_id=buyers[2].id
            ),
            User(
                name="Priya Deshmukh (AP Inward)",
                email="ap.inward@bharatinfraeng.com",
                password_hash=hash_password("buyer123"),
                role=UserRole.BUYER,
                company_id=buyers[1].id
            )
        ]
        db.add_all(users)

        # 6. Seed Sample Multi-Invoice Aggregated Guest Portal Session for Tata Motors
        tata_selected_invoices = [created_invoices[0].id, created_invoices[1].id]
        tata_tot_principal = created_invoices[0].principal_amount + created_invoices[1].principal_amount
        sample_portal = AggregatedPortalToken(
            token="demo_tata_consolidated_2026",
            buyer_id=buyers[0].id,
            vendor_id=msmes[0].id,
            invoice_ids=tata_selected_invoices,
            total_principal=tata_tot_principal,
            sec16_interest=78450.0,
            sec43bh_exposure=tata_tot_principal * 0.30,
            notes="Consolidated Q3 Commercial Supply Settlement Advisory"
        )
        db.add(sample_portal)

        await db.commit()
        print("Database seeded with 5 MSMEs, 3 Corporate Buyers, Users (Supplier/Buyer), Invoices, and Aggregated Portal Sessions.")

if __name__ == "__main__":
    asyncio.run(seed_database())
