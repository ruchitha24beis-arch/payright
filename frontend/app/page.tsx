"use client";

import Link from "next/link";
import { 
  ArrowRight, 
  ShieldCheck, 
  Coins, 
  Handshake, 
  FileCheck2, 
  Database,
  ExternalLink,
  CheckCircle2
} from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-8 py-2 max-w-5xl mx-auto">
      {/* Clean Hero */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 sm:p-12 shadow-xs text-center sm:text-left relative overflow-hidden">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Intelligent Accounting Overlay for MSMEs</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
            Recover Overdue Receivables. <br />
            <span className="text-[#2563EB]">Preserve Buyer Relationships.</span>
          </h1>

          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
            Operates as a zero-friction plugin on top of TallyPrime and Zoho Books. 
            Replaces aggressive legal disputes with constructive Section 43B(h) tax advisories, 
            e-NACH installment plans, and 24-hour TReDS bill discounting.
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-3">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] font-semibold text-xs text-white flex items-center gap-2 shadow-xs transition"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/settlement-builder"
              className="px-5 py-2.5 rounded-lg bg-white hover:bg-slate-50 font-semibold text-xs text-[#0F172A] border border-[#E2E8F0] flex items-center gap-2 transition"
            >
              <Handshake className="w-4 h-4 text-emerald-600" />
              <span>Settlement &amp; EMI</span>
            </Link>
            <Link
              href="/portal/745ddfcf7a0642419b2dcee2b13b9f56"
              target="_blank"
              className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 font-medium text-xs text-[#64748B] border border-[#E2E8F0] flex items-center gap-1.5 transition"
            >
              <span>Buyer Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Key Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] text-center shadow-2xs">
          <div className="text-xl sm:text-2xl font-bold text-[#0F172A] tabular-nums">₹1.24 Cr</div>
          <div className="text-[11px] text-[#64748B] font-medium mt-0.5">Synced Receivables</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] text-center shadow-2xs">
          <div className="text-xl sm:text-2xl font-bold text-amber-900 tabular-nums">30%</div>
          <div className="text-[11px] text-[#64748B] font-medium mt-0.5">Tax Deduction Risk</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] text-center shadow-2xs">
          <div className="text-xl sm:text-2xl font-bold text-blue-700 tabular-nums">15 Days</div>
          <div className="text-[11px] text-[#64748B] font-medium mt-0.5">Deemed Acceptance</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] text-center shadow-2xs">
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 tabular-nums">24 Hours</div>
          <div className="text-[11px] text-[#64748B] font-medium mt-0.5">TReDS Settlement</div>
        </div>
      </div>

      {/* 3 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1 */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs hover:border-slate-300 transition">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
            <Database className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-sm text-[#0F172A] mb-1">1-Click ERP Overlay</h2>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Syncs seamlessly with TallyPrime and Zoho Books without changing your existing accounting workflow or manual ledger entries.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline mt-3"
          >
            <span>Explore Sync</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Pillar 2 */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs hover:border-slate-300 transition">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-sm text-[#0F172A] mb-1">15-Day Contractual Lock</h2>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Automatically seals uncontested invoices under MSMED Act Section 2(b) with SHA-256 audit logs to prevent retroactive dispute stalling.
          </p>
          <Link
            href="/invoices/health-check"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline mt-3"
          >
            <span>Inspect Health</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Pillar 3 */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs hover:border-slate-300 transition">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <Handshake className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-sm text-[#0F172A] mb-1">Structured Settlements</h2>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Converts delayed receivables into 2–4 installments backed by e-NACH auto-debits and pro-rata inventory shipment releases.
          </p>
          <Link
            href="/settlement-builder"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline mt-3"
          >
            <span>Create Plan</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Clean Callout Card */}
      <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-[#0F172A]">Zero Litigation. 100% Relationship Preservation.</h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Keep your business relationships strong while recovering capital through statutory compliance and structured incentives.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold rounded-lg shrink-0 transition text-center shadow-xs"
        >
          Open Dashboard
        </Link>
      </div>
    </div>
  );
}
