# Chanakya: MSME Commercial Preservation & Payment Recovery Platform (LS-03)

A complete, fully functional enterprise platform enabling Micro, Small, and Medium Enterprises (MSMEs) to recover overdue payments from corporate buyers while **100% preserving commercial relationships**.

---

## 🏛️ Core Philosophy & Statutory Framework
Strictly excludes all aggressive litigation engines, legal threat dossiers, or government court filing threats. Instead, the platform leverages commercial and tax preservation:
1. **Section 43B(h) Income Tax Act Engine**: Disallows unpaid MSME business expenses at fiscal year-end, inflicting a direct ~30% corporate income tax cash outflow on delinquent corporate buyers. The platform automatically calculates this tax penalty and presents it to corporate buyer finance teams as an audit reconciliation incentive.
2. **Section 16 MSMED Act Penal Interest Engine**: Calculates 3x RBI Bank Rate (~20.25% p.a.) compounded monthly. Flags statutory note under Section 23 highlighting that this interest is non-tax-deductible for the buyer.
3. **OCR Document Health Inspector**: Pre-empts commercial disputes by scoring delivery proof legal readiness (0–100%) against buyer company rubber stamps, authorized receiver signatures, inward gate entry timestamps, and clean acceptance notes.
4. **Interactive EMI & Pro-Rata Order Release Builder**: Structures frozen dues into 2–4 EMIs with 2–5% prompt payment cash discounts. Locks pending open purchase orders and unlocks goods pro-rata per cleared installment.
5. **Silent TReDS Bill Factoring Bridge**: Simulates RBI-approved exchange integrations (RXIL, M1xchange, Invoicemart) allowing MSMEs to discount accepted invoices institutional-side at 8% p.a. within 24 hours without recourse or buyer conflict.
6. **Automated Credit Safeguard & Diplomatic ERP Hold**: Detects buyer credit limit breaches and generates polite ERP system hold advisories, completely shielding account reps from personal confrontation.
7. **Whitelabel Corporate Buyer Guest Portal**: Tokenized public links for corporate treasury and accounting teams to review delivery proof, claim prompt discounts, or approve installment plans.

---

## 💻 Tech Stack
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Lucide React, Recharts
- **Backend**: FastAPI (Python 3.12), Pydantic v2, Async SQLAlchemy 2.0, aiosqlite
- **OCR Engine**: Document inspector analyzing rubber stamps, signatures, inward date stamps, and acceptance seals
- **Database**: SQLite / PostgreSQL with full ORM models

---

## 🚀 Running Applications
- **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Frontend Web Application**: [http://localhost:3000](http://localhost:3000)
- **Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **OCR Doc Health Inspector**: [http://localhost:3000/invoices/health-check](http://localhost:3000/invoices/health-check)
- **Settlement & EMI Builder**: [http://localhost:3000/settlement-builder](http://localhost:3000/settlement-builder)
- **Silent TReDS Factoring**: [http://localhost:3000/treds](http://localhost:3000/treds)
- **Credit Safeguards**: [http://localhost:3000/credit-safeguards](http://localhost:3000/credit-safeguards)
- **Diplomatic Reminders**: [http://localhost:3000/reminders](http://localhost:3000/reminders)
- **Buyer Portal Preview**: [http://localhost:3000/portal/745ddfcf7a0642419b2dcee2b13b9f56](http://localhost:3000/portal/745ddfcf7a0642419b2dcee2b13b9f56)
