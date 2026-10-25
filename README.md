# Chanakya: MSME Commercial Preservation & Payment Recovery Platform (LS-03)

A complete, fully functional enterprise platform enabling Micro, Small, and Medium Enterprises (MSMEs) to recover overdue payments from corporate buyers while **100% preserving commercial relationships**.

---

## 🏛️ Core Philosophy & Statutory Framework
Strictly excludes all aggressive litigation engines, legal threat dossiers, or government court filing threats. Instead, the platform leverages commercial and tax preservation with automatic loophole safeguards:

1. **Udyam Category Verification Safeguard (`udyam_verifier.py`)**:
   - Inspects vendor registration profile.
   - **Loophole Plugged**: Section 43B(h) applies ONLY to Micro & Small Manufacturers/Services—it EXCLUDES Traders (Wholesalers/Retailers) and Medium Enterprises.
   - **System Logic**: If the vendor is a Trader or Medium Enterprise, the system automatically disables Section 43B(h) tax messaging and pivots to Section 16 penal interest warnings or early cash discounts.

2. **15-Day "Deemed Acceptance" Contractual Lock (`invoice_lock_engine.py`)**:
   - **Loophole Plugged**: Buyers raise fake quality disputes past 30 days to stall payments under MSMED Act rules.
   - **System Logic**: Integrates an automatic smart contract clause into generated invoices: *"Any quality/quantity objection must be filed on the platform within 15 days of delivery."* If the buyer remains silent on the portal for 15 days post-delivery, the backend locks invoice status to `DEEMED_ACCEPTED` and generates an unalterable SHA-256 audit log.

3. **Tax-Vulnerability & Section 43B(h) Engine (`compliance_engine.py`)**:
   - `calculate_section_43bh_exposure(principal, corporate_tax_rate=0.30)`: Calculates buyer's lost income tax deduction penalty (~30% penalty) if unpaid at year-end.
   - `calculate_section_16_interest(principal, days_overdue, rbi_rate=0.0675)`: Calculates 3x RBI rate (~20.25% p.a.) compounded monthly.
   - **Buyer Financial Check**: If MCA/GST metrics show a buyer is operating at a net tax loss, the system automatically swaps tax alerts for Section 16 compound interest warnings.

4. **Dual-Rail Financing Safeguard (`dual_rail_financing.py`)**:
   - **Loophole Plugged**: TReDS requires corporate buyers to manually log in and approve invoices. If a buyer delays approval, single-rail TReDS stalls out.
   - **System Logic**: First routes invoices through **Rail 1 (TReDS API)**. If the buyer fails to approve within 7 days, the app automatically fails over to **Rail 2 (Private NBFC Anchor Financing)** based on verified Proof of Delivery (POD).

5. **e-NACH Auto-Debit Mandate Engine (`enach_mandate.py`)**:
   - **Loophole Plugged**: Buyers accept voluntary EMI plans to get new shipments released, then default on EMI #2 without consequence.
   - **System Logic**: Requires buyers to authorize an e-NACH / NPCI digital auto-debit mandate before activating an EMI plan. Under Section 25 of the Payment and Settlement Systems Act (PSSA 2007), an e-NACH bounce carries criminal bank bounce liabilities without requiring court litigation.

6. **Automated Credit Safeguard & Diplomatic ERP Hold (`credit_safeguard.py`)**:
   - Compares total buyer outstanding balance against their set credit limit. Auto-generates an operational hold advisory on new shipments when limits are breached, framing the hold as an automatic system ERP rule.

7. **Whitelabel Corporate Buyer Guest Portal**:
   - Tokenized public links for corporate treasury and accounting teams to review delivery proof, claim prompt discounts, approve EMI plans with 1-click e-NACH mandate auth, or trigger TReDS acceptance.

---

## 💻 Tech Stack
- **Frontend**: Next.js 16/15 (App Router), TypeScript, Tailwind CSS, Lucide React, Recharts
- **Backend**: FastAPI (Python 3.12 / 3.11), Pydantic v2, Async SQLAlchemy 2.0, Celery & Redis task architecture
- **OCR Engine**: Document inspector analyzing rubber stamps, signatures, inward date stamps, and acceptance seals
- **Database**: SQLite / PostgreSQL with full ORM models

---

## 🚀 Key Endpoints & Pages
- **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Frontend Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **OCR Health & 15-Day Lock**: [http://localhost:3000/invoices/health-check](http://localhost:3000/invoices/health-check)
- **Settlement & e-NACH Builder**: [http://localhost:3000/settlement-builder](http://localhost:3000/settlement-builder)
- **Dual-Rail Financing**: [http://localhost:3000/treds](http://localhost:3000/treds)
- **Credit Safeguards**: [http://localhost:3000/credit-safeguards](http://localhost:3000/credit-safeguards)
- **Diplomatic Reminders**: [http://localhost:3000/reminders](http://localhost:3000/reminders)
