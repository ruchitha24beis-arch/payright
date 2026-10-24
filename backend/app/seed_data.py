import asyncio
from datetime import date, timedelta
from app.database import AsyncSessionLocal, engine, Base
from app.models.company import Company, CompanyRole, EnterpriseCategory
from app.models.invoice import Invoice, InvoiceStatus
from app.models.emi import EMIPlan, EMISchedule, EMIPlanStatus, EMIScheduleStatus
from app.models.order import LinkedOrder, ReleaseRule, OrderStatus
from app.engines.ocr_inspector import DocumentHealthInspector

async def seed_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # 1. 5 MSME Suppliers
        msmes = [
            Company(
                name="Apex Precision Engineering Pvt Ltd",
                gstin="27AAACA1234F1Z5",
                udyam_reg_number="UDYAM-MH-01-0012345",
                role=CompanyRole.VENDOR,
                enterprise_category=EnterpriseCategory.MICRO,
                credit_limit=5000000.0,
                contact_person="Rajesh Sharma",
                email="accounts@apexprecision.in",
                phone="+91 98201 11223",
                corporate_tax_rate=0.25
            ),
            Company(
                name="Sahyadri Industrial Fasteners LLP",
                gstin="27AABCS5678B1Z2",
                udyam_reg_number="UDYAM-MH-03-0098765",
                role=CompanyRole.VENDOR,
                enterprise_category=EnterpriseCategory.SMALL,
                credit_limit=7500000.0,
                contact_person="Vikram Patil",
                email="billing@sahyadrifasteners.com",
                phone="+91 98192 33445",
                corporate_tax_rate=0.25
            ),
            Company(
                name="Kaveri Polymer & Packaging Solutions",
                gstin="29AACCK9988D1Z9",
                udyam_reg_number="UDYAM-KR-08-0054321",
                role=CompanyRole.VENDOR,
                enterprise_category=EnterpriseCategory.MICRO,
                credit_limit=3000000.0,
                contact_person="Sunita Rao",
                email="finance@kaveripolymers.in",
                phone="+91 94481 55667",
                corporate_tax_rate=0.25
            ),
            Company(
                name="Zenith Toolings & Automation",
                gstin="24AAACZ4321E1Z0",
                udyam_reg_number="UDYAM-GJ-02-0077889",
                role=CompanyRole.VENDOR,
                enterprise_category=EnterpriseCategory.SMALL,
                credit_limit=4500000.0,
                contact_person="Bhavesh Mehta",
                email="accounts@zenithtooling.co.in",
                phone="+91 98790 77889",
                corporate_tax_rate=0.25
            ),
            Company(
                name="ElectroTech Dynamics & Controls",
                gstin="07AABCE1122C1Z8",
                udyam_reg_number="UDYAM-DL-05-0033221",
                role=CompanyRole.VENDOR,
                enterprise_category=EnterpriseCategory.MICRO,
                credit_limit=6000000.0,
                contact_person="Anil Aggarwal",
                email="cfo@electrotechdynamics.com",
                phone="+91 98110 99001",
                corporate_tax_rate=0.25
            )
        ]
        db.add_all(msmes)
        await db.flush()

        # 2. 3 Corporate Buyers
        buyers = [
            Company(
                name="Tata Motors Commercial Vehicles Ltd",
                gstin="27AAACT0418Q1ZS",
                udyam_reg_number=None,
                role=CompanyRole.BUYER,
                enterprise_category=EnterpriseCategory.MEDIUM,
                credit_limit=3500000.0,  # Credit limit 35L
                contact_person="Nitin Kulkarni (Head of Procurement)",
                email="procurement.vendorpay@tatamotors.com",
                phone="+91 22 6656 1234",
                corporate_tax_rate=0.30
            ),
            Company(
                name="Bharat Heavy Infra & Engineering Corp",
                gstin="06AAACB2233M1ZQ",
                udyam_reg_number=None,
                role=CompanyRole.BUYER,
                enterprise_category=EnterpriseCategory.MEDIUM,
                credit_limit=2500000.0,  # Credit limit 25L
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
                credit_limit=4000000.0,  # Credit limit 40L
                contact_person="Arun Nambiar (Corporate Treasury)",
                email="treasury.payables@larsenauto.com",
                phone="+91 22 2857 0000",
                corporate_tax_rate=0.30
            )
        ]
        db.add_all(buyers)
        await db.flush()

        # 3. Linked Open Orders for Partial Release Milestones
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

        # 4. 10 Overdue Invoices across different aging brackets
        today = date.today()
        raw_invoices = [
            # Tata Motors invoices
            {
                "inv_num": "INV/APEX/24-25/089",
                "vendor": msmes[0],
                "buyer": buyers[0],
                "principal": 1250000.0,
                "days_ago": 55,
                "health": 92.0,
                "po_no": "PO-TATA-2024-7711",
                "desc": "CNC Flange Rings Batch #1"
            },
            {
                "inv_num": "INV/APEX/24-25/112",
                "vendor": msmes[0],
                "buyer": buyers[0],
                "principal": 840000.0,
                "days_ago": 42,
                "health": 88.0,
                "po_no": "PO-TATA-2024-8891",
                "desc": "CNC Hub Assemblies Phase 1"
            },
            {
                "inv_num": "INV/SAH/24-25/044",
                "vendor": msmes[1],
                "buyer": buyers[0],
                "principal": 620000.0,
                "days_ago": 28,
                "health": 95.0,
                "po_no": "PO-TATA-2024-9102",
                "desc": "Grade 10.9 Metric Flange Bolts"
            },
            {
                "inv_num": "INV/KAV/24-25/067",
                "vendor": msmes[2],
                "buyer": buyers[0],
                "principal": 480000.0,
                "days_ago": 12,
                "health": 72.0,
                "po_no": "PO-TATA-2024-9330",
                "desc": "Custom Heavy Duty Polymer Pallets"
            },
            # Bharat Heavy Infra invoices
            {
                "inv_num": "INV/SAH/24-25/031",
                "vendor": msmes[1],
                "buyer": buyers[1],
                "principal": 1420000.0,
                "days_ago": 62,
                "health": 85.0,
                "po_no": "PO-BHARAT-2024-3890",
                "desc": "Structural Anchor Bolts M36"
            },
            {
                "inv_num": "INV/ZEN/24-25/019",
                "vendor": msmes[3],
                "buyer": buyers[1],
                "principal": 980000.0,
                "days_ago": 38,
                "health": 55.0,  # Missing buyer receiving stamp
                "po_no": "PO-BHARAT-2024-4115",
                "desc": "Industrial Hydraulic Stamping Fixtures"
            },
            {
                "inv_num": "INV/ELEC/24-25/055",
                "vendor": msmes[4],
                "buyer": buyers[1],
                "principal": 750000.0,
                "days_ago": 22,
                "health": 82.0,
                "po_no": "PO-BHARAT-2024-4288",
                "desc": "Variable Frequency Drive Control Panels"
            },
            # Larsen Auto invoices
            {
                "inv_num": "INV/ZEN/24-25/024",
                "vendor": msmes[3],
                "buyer": buyers[2],
                "principal": 1850000.0,
                "days_ago": 48,
                "health": 90.0,
                "po_no": "PO-LARSEN-2024-8710",
                "desc": "Precision Sheet Metal Stamping Dies"
            },
            {
                "inv_num": "INV/ELEC/24-25/071",
                "vendor": msmes[4],
                "buyer": buyers[2],
                "principal": 1150000.0,
                "days_ago": 31,
                "health": 45.0,  # Missing receiver signature
                "po_no": "PO-LARSEN-2024-8992",
                "desc": "PLC Automation Racks & HMI Panels"
            },
            {
                "inv_num": "INV/APEX/24-25/135",
                "vendor": msmes[0],
                "buyer": buyers[2],
                "principal": 920000.0,
                "days_ago": 18,
                "health": 94.0,
                "po_no": "PO-LARSEN-2024-9205",
                "desc": "High-Pressure Hydraulic Valve Blocks"
            }
        ]

        created_invoices = []
        for raw in raw_invoices:
            inv_date = today - timedelta(days=raw["days_ago"] + 45)
            due_date = today - timedelta(days=raw["days_ago"])
            
            ocr_res = DocumentHealthInspector.inspect_delivery_proof(
                expected_po_number=raw["po_no"],
                expected_invoice_number=raw["inv_num"]
            )
            # Custom adjustments to simulate realistic checkpoint health
            if raw["health"] < 60:
                ocr_res["document_health_score"] = raw["health"]
                ocr_res["checkpoints"][0]["status"] = "FLAGGED"
                ocr_res["checkpoints"][0]["score"] = 5
                ocr_res["health_grade"] = "C_WARNING"
                ocr_res["grade_label"] = "Missing Buyer Receiving Stamp (Vulnerable)"

            inv = Invoice(
                invoice_number=raw["inv_num"],
                vendor_id=raw["vendor"].id,
                buyer_id=raw["buyer"].id,
                principal_amount=raw["principal"],
                paid_amount=0.0,
                invoice_date=inv_date,
                due_date=due_date,
                delivery_date=inv_date,
                po_number=raw["po_no"],
                goods_description=raw["desc"],
                document_health_score=ocr_res["document_health_score"],
                ocr_details=ocr_res,
                status=InvoiceStatus.PENDING
            )
            db.add(inv)
            created_invoices.append(inv)

        await db.flush()

        # 5. Create 2 Active EMI Plans with linked order units
        # Plan 1: On Tata Motors Invoice #1 (INV/APEX/24-25/089)
        tata_inv = created_invoices[0]
        tata_inv.status = InvoiceStatus.PARTIAL_EMI
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
            notes="Tata Motors Commercial Preservation 3-Month Plan (3% Prompt Discount)"
        )
        db.add(tata_emi)
        await db.flush()

        # Tata Schedule 1 (PAID, releasing 250 units)
        sch1 = EMISchedule(
            plan_id=tata_emi.id,
            installment_number=1,
            due_date=today - timedelta(days=10),
            amount=tata_emi.amount_per_installment,
            status=EMIScheduleStatus.PAID,
            paid_date=today - timedelta(days=9),
            payment_reference="NEFT/CMS/20261015/09812",
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
            units_to_release=250,
            units_released_flag=False
        )
        # Tata Schedule 3 (PENDING, due in 50 days)
        sch3 = EMISchedule(
            plan_id=tata_emi.id,
            installment_number=3,
            due_date=today + timedelta(days=50),
            amount=tata_emi.amount_per_installment,
            status=EMIScheduleStatus.PENDING,
            units_to_release=250,
            units_released_flag=False
        )
        db.add_all([sch1, sch2, sch3])
        tata_inv.paid_amount = tata_emi.amount_per_installment

        # Plan 2: On Bharat Heavy Infra Invoice #5 (INV/SAH/24-25/031)
        bharat_inv = created_invoices[4]
        bharat_inv.status = InvoiceStatus.PARTIAL_EMI
        bharat_emi = EMIPlan(
            invoice_id=bharat_inv.id,
            vendor_id=bharat_inv.vendor_id,
            buyer_id=bharat_inv.buyer_id,
            linked_order_id=orders[1].id,
            total_installments=4,
            cash_discount_percent=2.5,
            original_principal=bharat_inv.principal_amount,
            discounted_principal=round(bharat_inv.principal_amount * 0.975, 2),
            amount_per_installment=round((bharat_inv.principal_amount * 0.975) / 4.0, 2),
            status=EMIPlanStatus.ACTIVE,
            notes="Bharat Heavy Infra 4-Month Commercial Settlement (2.5% Discount)"
        )
        db.add(bharat_emi)
        await db.flush()

        bsch1 = EMISchedule(
            plan_id=bharat_emi.id,
            installment_number=1,
            due_date=today - timedelta(days=5),
            amount=bharat_emi.amount_per_installment,
            status=EMIScheduleStatus.PAID,
            paid_date=today - timedelta(days=4),
            payment_reference="RTGS/BHI/20261020/77412",
            units_to_release=500,
            units_released_flag=True
        )
        bsch2 = EMISchedule(
            plan_id=bharat_emi.id,
            installment_number=2,
            due_date=today + timedelta(days=25),
            amount=bharat_emi.amount_per_installment,
            status=EMIScheduleStatus.PENDING,
            units_to_release=500,
            units_released_flag=False
        )
        bsch3 = EMISchedule(
            plan_id=bharat_emi.id,
            installment_number=3,
            due_date=today + timedelta(days=55),
            amount=bharat_emi.amount_per_installment,
            status=EMIScheduleStatus.PENDING,
            units_to_release=500,
            units_released_flag=False
        )
        bsch4 = EMISchedule(
            plan_id=bharat_emi.id,
            installment_number=4,
            due_date=today + timedelta(days=85),
            amount=bharat_emi.amount_per_installment,
            status=EMIScheduleStatus.PENDING,
            units_to_release=500,
            units_released_flag=False
        )
        db.add_all([bsch1, bsch2, bsch3, bsch4])
        bharat_inv.paid_amount = bharat_emi.amount_per_installment

        await db.commit()
        print("Database successfully seeded with realistic MSME data!")

if __name__ == "__main__":
    asyncio.run(seed_database())
