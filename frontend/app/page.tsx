"use client";

import Link from "next/link";
import { 
  ShieldCheck, 
  ArrowRight, 
  Coins, 
  Handshake, 
  FileCheck2, 
  Calculator, 
  TrendingUp, 
  Building2,
  Scale,
  CheckCircle2,
  Lock,
  Layers,
  FileText
} from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-8 py-4">
      {/* Hero Card */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 sm:p-10 shadow-xs relative overflow-hidden">
        <div className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
            <span>100% Commercial Relationship Preservation Engine</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
            Recover Overdue Receivables <br />
            <span className="text-[#163A5F]">Without Adversarial Litigation</span>
          </h1>

          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
            Replace aggressive legal threat dossiers with constructive commercial mechanisms:
            <strong className="text-[#0F172A]"> Section 43B(h) Corporate Tax Deduction Advisories</strong>,
            structured <strong className="text-[#0F172A]">EMI installment plans</strong>,
            <strong className="text-[#0F172A]"> pro-rata shipment releases</strong>, and
            <strong className="text-[#0F172A]"> silent 24-hr TReDS bill discounting</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-lg bg-[#163A5F] hover:bg-[#102B47] font-semibold text-xs text-white flex items-center gap-2 shadow-xs transition"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/settlement-builder"
              className="px-5 py-2.5 rounded-lg bg-white hover:bg-slate-50 font-semibold text-xs text-[#0F172A] border border-[#E2E8F0] flex items-center gap-2 transition"
            >
              <Handshake className="w-4 h-4 text-[#16A34A]" />
              <span>Settlement Builder</span>
            </Link>
            <Link
              href="/invoices/health-check"
              className="px-5 py-2.5 rounded-lg bg-white hover:bg-slate-50 font-semibold text-xs text-[#0F172A] border border-[#E2E8F0] flex items-center gap-2 transition"
            >
              <FileCheck2 className="w-4 h-4 text-amber-600" />
              <span>OCR Health Check</span>
            </Link>
            <Link
              href="/treds"
              className="px-5 py-2.5 rounded-lg bg-white hover:bg-slate-50 font-semibold text-xs text-[#0F172A] border border-[#E2E8F0] flex items-center gap-2 transition"
            >
              <Coins className="w-4 h-4 text-purple-600" />
              <span>Silent TReDS</span>
            </Link>
          </div>
        </div>

        {/* Right side statutory stat box */}
        <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 w-72 p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <div className="text-[11px] uppercase text-[#64748B] font-bold tracking-wider mb-1">
            Section 43B(h) Leverage
          </div>
          <div className="text-2xl font-bold text-amber-900 tabular-nums">
            ₹28.52 Lakhs
          </div>
          <p className="text-[11px] text-[#64748B] mt-1 leading-normal">
            Direct 30% corporate income tax loss facing buyers if MSME dues remain uncleared at fiscal year-end.
          </p>
          <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex justify-between items-center text-xs">
            <span className="text-[#64748B]">MSMED Sec 16 Interest</span>
            <span className="text-[#16A34A] font-bold">20.25% p.a.</span>
          </div>
        </div>
      </div>

      {/* 4 Feature Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1 */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
            <Calculator className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-sm text-[#0F172A] mb-1">Sec 43B(h) Tax Engine</h2>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Quantifies the buyer&apos;s lost corporate income tax deduction penalty. Reminds buyers how timely payment directly saves them 30% cash tax disallowances.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline mt-3"
          >
            <span>View Tax Analytics</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Pillar 2 */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center mb-3">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-sm text-[#0F172A] mb-1">OCR Doc Health Inspector</h2>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Scores delivery proof readiness (0–100%) before disputes happen, flagging missing rubber stamps or signatures to make the debt indisputable.
          </p>
          <Link
            href="/invoices/health-check"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline mt-3"
          >
            <span>Inspect Delivery Proofs</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Pillar 3 */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center mb-3">
            <Handshake className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-sm text-[#0F172A] mb-1">Flexible EMI & Pro-Rata</h2>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Breaks frozen receivables into 2–4 EMIs with 2–5% prompt discounts, releasing upcoming shipments in pro-rata batches as each installment clears.
          </p>
          <Link
            href="/settlement-builder"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline mt-3"
          >
            <span>Build Settlement Plan</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Pillar 4 */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-3">
            <Coins className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-sm text-[#0F172A] mb-1">Silent TReDS Factoring</h2>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Simulates institutional bill discounting via RXIL/M1xchange without buyer friction. Get credited within 24 hours at 8% p.a. institutional rates.
          </p>
          <Link
            href="/treds"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline mt-3"
          >
            <span>Discount Bills</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Statutory & Non-Litigious Framework Notice */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-xs">
        <h2 className="font-bold text-sm text-[#0F172A] mb-3 flex items-center gap-2">
          <Scale className="w-4 h-4 text-[#2563EB]" />
          <span>Statutory Framework & Compliance Standards</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#64748B]">
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="font-bold text-[#0F172A] block mb-1">Income Tax Act Sec 43B(h)</span>
            <p>Mandatory fiscal disallowance of unpaid MSME dues beyond 45 days. Adds back full amount to corporate taxable profit.</p>
          </div>
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="font-bold text-[#0F172A] block mb-1">MSMED Act Sec 16 & 23</span>
            <p>Mandatory 3x RBI Bank Rate compounding interest. Interest paid cannot be deducted as business expense by the buyer.</p>
          </div>
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="font-bold text-[#0F172A] block mb-1">RBI TReDS Mechanism</span>
            <p>Non-recourse institutional bill discounting via authorized exchanges without corporate buyer personal friction.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
