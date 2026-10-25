"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  Factory, 
  ShieldCheck, 
  ArrowRight, 
  Coins, 
  FileCheck2, 
  Scale, 
  Lock,
  ChevronRight,
  Sparkles,
  KeyRound
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { loginSupplier, loginBuyer } = useAuth();
  const [selectedRole, setSelectedRole] = useState<"SUPPLIER" | "BUYER">("SUPPLIER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuickDemoLogin = async (role: "SUPPLIER" | "BUYER") => {
    setLoading(true);
    setError(null);
    try {
      if (role === "SUPPLIER") {
        const ok = await loginSupplier("supplier@apex.in", "supplier123");
        if (ok) {
          router.push("/dashboard");
        } else {
          setError("Failed to sign in as MSME Supplier demo user");
        }
      } else {
        const ok = await loginBuyer("buyer@tatamotors.com", "buyer123");
        if (ok) {
          router.push("/buyer/dashboard");
        } else {
          setError("Failed to sign in as Corporate Buyer AP demo user");
        }
      }
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
            C
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
              Chanakya
              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium">
                Enterprise MSME Engine
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Statutory Trade Governance &amp; Commercial Liquidity Platform
            </p>
          </div>
        </div>

        <Link
          href="/portal/745ddfcf7a0642419b2dcee2b13b9f56"
          target="_blank"
          className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 hover:border-slate-600 px-3.5 py-1.5 rounded-lg transition"
        >
          <span>One-Click Guest Link</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Role Selection Container */}
      <div className="max-w-4xl w-full mx-auto py-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Dual-Role Commercial Authentication</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Select Your Organizational Role
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Access statutory recovery safeguards, Section 43B(h) tax analytics, TReDS silent factoring, or corporate treasury accounts payable portals.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Two Dedicated Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: MSME Supplier */}
          <div 
            className={`relative rounded-2xl p-6 sm:p-8 transition-all duration-200 border cursor-pointer ${
              selectedRole === "SUPPLIER" 
                ? "bg-slate-900/90 border-blue-500 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500" 
                : "bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70"
            }`}
            onClick={() => setSelectedRole("SUPPLIER")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Factory className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                MSME Creditor
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              MSME Supplier Workspace
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              For Registered Micro &amp; Small Enterprises. Reconcile invoices with Tally/Zoho, dispatch Section 43B(h) advisories, generate court-ready MSEFC Samadhan claims, and configure multi-invoice payment reminders.
            </p>

            <div className="space-y-2 mb-6 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Automated 15-Day Deemed Acceptance Lock Engine</span>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Multi-Invoice Consolidated Reminders &amp; Portal Links</span>
              </div>
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>1-Click MSME Samadhan Form-1 Application Dossiers</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <Link
                href="/login/supplier"
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs text-center flex items-center justify-center gap-2 transition shadow-md shadow-blue-600/20"
              >
                <span>Sign In as MSME Supplier</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickDemoLogin("SUPPLIER");
                }}
                disabled={loading}
                className="w-full py-2 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/60 transition flex items-center justify-center gap-2"
              >
                <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                <span>Instant Demo (Apex Precision Engineering)</span>
              </button>
            </div>
          </div>

          {/* Card 2: Corporate Buyer AP */}
          <div 
            className={`relative rounded-2xl p-6 sm:p-8 transition-all duration-200 border cursor-pointer ${
              selectedRole === "BUYER" 
                ? "bg-slate-900/90 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500" 
                : "bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70"
            }`}
            onClick={() => setSelectedRole("BUYER")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                Corporate Treasury
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              Corporate Buyer AP Portal
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              For Corporate Treasury, Accounts Payable &amp; Procurement. View consolidated MSME outstandings, manage 43B(h) taxable profit disallowance risks, claim early settlement prompt discounts, and authorize e-NACH plans.
            </p>

            <div className="space-y-2 mb-6 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Corporate Turnover &amp; MCA Filing Status Ledger</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Consolidated Prompt Cash Discount Capture (2.5%)</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Single-Click Account-Level UTR &amp; RTGS Reconciliation</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <Link
                href="/login/buyer"
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs text-center flex items-center justify-center gap-2 transition shadow-md shadow-indigo-600/20"
              >
                <span>Sign In as Corporate Buyer AP</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickDemoLogin("BUYER");
                }}
                disabled={loading}
                className="w-full py-2 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/60 transition flex items-center justify-center gap-2"
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                <span>Instant Demo (Tata Motors CV Ltd)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Legal & Security */}
      <div className="max-w-6xl w-full mx-auto py-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <p>
          Governed under Section 43B(h) of the Income Tax Act &amp; Section 15-24 of the MSMED Act 2006.
        </p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400" /> 256-Bit Financial Encryption
          </span>
          <span>&bull;</span>
          <span className="text-slate-400">Statutory MSEFC Interoperability</span>
        </div>
      </div>
    </div>
  );
}
