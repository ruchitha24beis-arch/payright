import uuid
from datetime import date, datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.company import Company, CompanyRole, EnterpriseClass, MajorActivity
from app.models.invoice import Invoice, InvoiceStatus
from app.models.order import LinkedOrder, ReleaseRule, OrderStatus
from app.engines.ocr_inspector import DocumentHealthInspector
from app.engines.invoice_lock_engine import InvoiceLockEngine

class AccountingSyncService:
    """
    Intelligent Overlay Plugin Sync Service (accounting_sync.py):
    
    Operates strictly as an intelligent overlay plugin for existing accounting ERPs
    (TallyPrime, Zoho Books), removing the need for manual ledger entry.
    """

    @classmethod
    async def sync_from_tally(cls, db: AsyncSession) -> Dict[str, Any]:
        """
        POST /api/v1/sync/tally:
        Simulates on-premise XML agent sync from TallyPrime ERP (Port 9000).
        Imports 5 realistic overdue invoices (15 to 45 days overdue) with linked POs,
        signed POD metadata, and buyer credit limit verification.
        """
        today = date.today()
        sync_batch_id = f"TALLY-XML-{datetime.utcnow().strftime('%Y%m%d%H%M')}-{uuid.uuid4().hex[:4].upper()}"

        # Fetch or ensure vendor & buyers exist
        stmt_vendor = select(Company).where(Company.role == CompanyRole.VENDOR)
        vendor = (await db.execute(stmt_vendor)).scalars().first()
        if not vendor:
            vendor = Company(
                name="Apex Precision Engineering Pvt Ltd",
                gstin="27AAACA1234F1Z5",
                udyam_reg_number="UDYAM-MH-01-0012345",
                udyam_verified=True,
                role=CompanyRole.VENDOR,
                enterprise_category=EnterpriseClass.MICRO,
                enterprise_class=EnterpriseClass.MICRO,
                major_activity=MajorActivity.MANUFACTURING,
                credit_limit=5000000.0,
                email="accounts@apexprecision.in"
            )
            db.add(vendor)
            await db.flush()

        stmt_buyers = select(Company).where(Company.role == CompanyRole.BUYER)
        buyers = (await db.execute(stmt_buyers)).scalars().all()
        if not buyers:
            b1 = Company(
                name="Tata Motors Commercial Vehicles Ltd",
                gstin="27AAACT0418Q1ZS",
                role=CompanyRole.BUYER,
                enterprise_category=EnterpriseClass.MEDIUM,
                enterprise_class=EnterpriseClass.MEDIUM,
                major_activity=MajorActivity.MANUFACTURING,
                credit_limit=3500000.0,
                corporate_tax_rate=0.30,
                email="ap@tatamotors.com"
            )
            b2 = Company(
                name="Bharat Heavy Infra & Engineering Corp",
                gstin="06AAACB2233M1ZQ",
                role=CompanyRole.BUYER,
                enterprise_category=EnterpriseClass.MEDIUM,
                enterprise_class=EnterpriseClass.MEDIUM,
                major_activity=MajorActivity.MANUFACTURING,
                credit_limit=2500000.0,
                is_tax_loss=True,
                corporate_tax_rate=0.30,
                email="ap@bharatinfraeng.com"
            )
            db.add_all([b1, b2])
            await db.flush()
            buyers = [b1, b2]

        tally_invoices_raw = [
            {
                "inv_num": f"TL-INV/24-25/{uuid.uuid4().hex[:4].upper()}-01",
                "buyer": buyers[0],
                "principal": 680000.0,
                "days_overdue": 18,
                "delivery_days_ago": 33,
                "po_number": f"PO-TL-TATA-{uuid.uuid4().hex[:4].upper()}",
                "desc": "Precision CNC High-Pressure Hydraulic Flanges",
                "health": 92.0,
                "units": 800,
                "unit_price": 850.0
            },
            {
                "inv_num": f"TL-INV/24-25/{uuid.uuid4().hex[:4].upper()}-02",
                "buyer": buyers[0],
                "principal": 1150000.0,
                "days_overdue": 32,
                "delivery_days_ago": 47,
                "po_number": f"PO-TL-TATA-{uuid.uuid4().hex[:4].upper()}",
                "desc": "Automotive Transmission Drive Shaft Assemblies",
                "health": 88.0,
                "units": 500,
                "unit_price": 2300.0
            },
            {
                "inv_num": f"TL-INV/24-25/{uuid.uuid4().hex[:4].upper()}-03",
                "buyer": buyers[1] if len(buyers) > 1 else buyers[0],
                "principal": 890000.0,
                "days_overdue": 24,
                "delivery_days_ago": 39,
                "po_number": f"PO-TL-BHEL-{uuid.uuid4().hex[:4].upper()}",
                "desc": "High-Tensile Galvanized Structural Tie-Rods",
                "health": 94.0,
                "units": 1200,
                "unit_price": 740.0
            },
            {
                "inv_num": f"TL-INV/24-25/{uuid.uuid4().hex[:4].upper()}-04",
                "buyer": buyers[1] if len(buyers) > 1 else buyers[0],
                "principal": 1420000.0,
                "days_overdue": 44,
                "delivery_days_ago": 59,
                "po_number": f"PO-TL-BHEL-{uuid.uuid4().hex[:4].upper()}",
                "desc": "Heavy Foundry Stamping Base Blocks",
                "health": 85.0,
                "units": 40,
                "unit_price": 35500.0
            },
            {
                "inv_num": f"TL-INV/24-25/{uuid.uuid4().hex[:4].upper()}-05",
                "buyer": buyers[0],
                "principal": 540000.0,
                "days_overdue": 15,
                "delivery_days_ago": 20,
                "po_number": f"PO-TL-TATA-{uuid.uuid4().hex[:4].upper()}",
                "desc": "Precision Metric Stud Sets & Dowel Pins",
                "health": 96.0,
                "units": 2000,
                "unit_price": 270.0
            }
        ]

        imported_invoices = []
        total_synced_value = 0.0

        for item in tally_invoices_raw:
            delivery_date = today - timedelta(days=item["delivery_days_ago"])
            due_date = today - timedelta(days=item["days_overdue"])
            total_synced_value += item["principal"]

            # Generate 15-day deemed acceptance clause and deadline
            clause, deadline = InvoiceLockEngine.generate_contractual_clause(delivery_date)
            lock_eval = InvoiceLockEngine.evaluate_acceptance_lock(delivery_date, "PENDING", today)
            
            audit_log = None
            status = InvoiceStatus.PENDING
            if lock_eval["is_locked"]:
                status = InvoiceStatus.DEEMED_ACCEPTED
                audit_log = InvoiceLockEngine.generate_acceptance_audit_log(
                    invoice_number=item["inv_num"],
                    delivery_date=delivery_date,
                    buyer_gstin=item["buyer"].gstin,
                    vendor_gstin=vendor.gstin,
                    health_score=item["health"]
                )

            # Create Linked PO for partial release
            order = LinkedOrder(
                po_number=item["po_number"],
                vendor_id=vendor.id,
                buyer_id=item["buyer"].id,
                item_description=item["desc"],
                total_units=item["units"],
                units_released=item["units"] // 4,
                release_rule=ReleaseRule.PRO_RATA,
                units_per_emi_payment=item["units"] // 4,
                unit_price=item["unit_price"],
                total_order_value=item["principal"],
                status=OrderStatus.ACTIVE
            )
            db.add(order)

            ocr_res = DocumentHealthInspector.inspect_delivery_proof(
                expected_po_number=item["po_number"],
                expected_invoice_number=item["inv_num"]
            )
            ocr_res["document_health_score"] = item["health"]
            ocr_res["legal_health_score"] = item["health"]

            inv = Invoice(
                invoice_number=item["inv_num"],
                vendor_id=vendor.id,
                buyer_id=item["buyer"].id,
                principal_amount=item["principal"],
                paid_amount=0.0,
                invoice_date=delivery_date,
                due_date=due_date,
                delivery_date=delivery_date,
                deemed_acceptance_date=deadline,
                deemed_acceptance_clause=clause,
                acceptance_audit_log=audit_log,
                po_number=item["po_number"],
                goods_description=item["desc"],
                document_health_score=item["health"],
                legal_health_score=item["health"],
                ocr_details=ocr_res,
                status=status
            )
            db.add(inv)
            imported_invoices.append(item["inv_num"])

        await db.commit()

        return {
            "sync_engine": "TallyPrime ERP On-Premise XML Connector v2.4",
            "sync_batch_id": sync_batch_id,
            "status": "SUCCESS",
            "invoices_imported_count": len(imported_invoices),
            "invoices": imported_invoices,
            "total_receivables_synced": round(total_synced_value, 2),
            "buyers_updated": list(set(i["buyer"].name for i in tally_invoices_raw)),
            "synced_at": datetime.utcnow().isoformat(),
            "overlay_message": "TallyPrime XML sync complete. 5 overdue ledgers imported with linked POs, POD metadata, and statutory locks."
        }

    @classmethod
    async def sync_from_zoho(cls, db: AsyncSession) -> Dict[str, Any]:
        """
        POST /api/v1/sync/zoho:
        Simulates an OAuth REST API sync from Zoho Books.
        Imports active customer ledgers and maps line-item inventory for partial order releases.
        """
        today = date.today()
        sync_batch_id = f"ZOHO-REST-{datetime.utcnow().strftime('%Y%m%d%H%M')}-{uuid.uuid4().hex[:4].upper()}"

        stmt_vendor = select(Company).where(Company.role == CompanyRole.VENDOR)
        vendor = (await db.execute(stmt_vendor)).scalars().first()

        stmt_buyers = select(Company).where(Company.role == CompanyRole.BUYER)
        buyers = (await db.execute(stmt_buyers)).scalars().all()

        buyer = buyers[2] if len(buyers) > 2 else buyers[0]

        zoho_invoices_raw = [
            {
                "inv_num": f"ZH-INV/24-25/{uuid.uuid4().hex[:4].upper()}-01",
                "buyer": buyer,
                "principal": 920000.0,
                "days_overdue": 21,
                "delivery_days_ago": 36,
                "po_number": f"PO-ZH-LARSEN-{uuid.uuid4().hex[:4].upper()}",
                "desc": "Heavy-Duty Polymer Automotive Battery Trays",
                "health": 91.0,
                "units": 1500,
                "unit_price": 613.33
            },
            {
                "inv_num": f"ZH-INV/24-25/{uuid.uuid4().hex[:4].upper()}-02",
                "buyer": buyer,
                "principal": 1280000.0,
                "days_overdue": 35,
                "delivery_days_ago": 50,
                "po_number": f"PO-ZH-LARSEN-{uuid.uuid4().hex[:4].upper()}",
                "desc": "Precision Robot Welding Sensor Brackets",
                "health": 87.0,
                "units": 400,
                "unit_price": 3200.0
            },
            {
                "inv_num": f"ZH-INV/24-25/{uuid.uuid4().hex[:4].upper()}-03",
                "buyer": buyer,
                "principal": 710000.0,
                "days_overdue": 17,
                "delivery_days_ago": 32,
                "po_number": f"PO-ZH-LARSEN-{uuid.uuid4().hex[:4].upper()}",
                "desc": "Engine Compartment Heat Shield Liners",
                "health": 93.0,
                "units": 1000,
                "unit_price": 710.0
            }
        ]

        imported_invoices = []
        total_synced_value = 0.0

        for item in zoho_invoices_raw:
            delivery_date = today - timedelta(days=item["delivery_days_ago"])
            due_date = today - timedelta(days=item["days_overdue"])
            total_synced_value += item["principal"]

            clause, deadline = InvoiceLockEngine.generate_contractual_clause(delivery_date)
            lock_eval = InvoiceLockEngine.evaluate_acceptance_lock(delivery_date, "PENDING", today)
            
            audit_log = None
            status = InvoiceStatus.PENDING
            if lock_eval["is_locked"]:
                status = InvoiceStatus.DEEMED_ACCEPTED
                audit_log = InvoiceLockEngine.generate_acceptance_audit_log(
                    invoice_number=item["inv_num"],
                    delivery_date=delivery_date,
                    buyer_gstin=item["buyer"].gstin,
                    vendor_gstin=vendor.gstin if vendor else "27AAACA1234F1Z5",
                    health_score=item["health"]
                )

            # Map line-item inventory for partial release
            order = LinkedOrder(
                po_number=item["po_number"],
                vendor_id=vendor.id if vendor else 1,
                buyer_id=item["buyer"].id,
                item_description=item["desc"],
                total_units=item["units"],
                units_released=item["units"] // 3,
                release_rule=ReleaseRule.PRO_RATA,
                units_per_emi_payment=item["units"] // 3,
                unit_price=item["unit_price"],
                total_order_value=item["principal"],
                status=OrderStatus.ACTIVE
            )
            db.add(order)

            ocr_res = DocumentHealthInspector.inspect_delivery_proof(
                expected_po_number=item["po_number"],
                expected_invoice_number=item["inv_num"]
            )
            ocr_res["document_health_score"] = item["health"]
            ocr_res["legal_health_score"] = item["health"]

            inv = Invoice(
                invoice_number=item["inv_num"],
                vendor_id=vendor.id if vendor else 1,
                buyer_id=item["buyer"].id,
                principal_amount=item["principal"],
                paid_amount=0.0,
                invoice_date=delivery_date,
                due_date=due_date,
                delivery_date=delivery_date,
                deemed_acceptance_date=deadline,
                deemed_acceptance_clause=clause,
                acceptance_audit_log=audit_log,
                po_number=item["po_number"],
                goods_description=item["desc"],
                document_health_score=item["health"],
                legal_health_score=item["health"],
                ocr_details=ocr_res,
                status=status
            )
            db.add(inv)
            imported_invoices.append(item["inv_num"])

        await db.commit()

        return {
            "sync_engine": "Zoho Books Cloud API Connector v3 (OAuth 2.0)",
            "sync_batch_id": sync_batch_id,
            "status": "SUCCESS",
            "customer_ledgers_synced": 1,
            "buyer_name": buyer.name,
            "invoices_imported_count": len(imported_invoices),
            "invoices": imported_invoices,
            "total_receivables_synced": round(total_synced_value, 2),
            "line_item_inventory_batches_mapped": len(zoho_invoices_raw),
            "synced_at": datetime.utcnow().isoformat(),
            "overlay_message": "Zoho Books OAuth sync complete. Active customer ledger and inventory release milestones mapped."
        }
