"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  ShieldCheck, 
  Coins, 
  FileCheck2, 
  AlertTriangle, 
  ExternalLink, 
  CheckCircle2, 
  ArrowRight,
  CreditCard,
  Percent,
  Download,
  Calendar,
  Layers,
  Sparkles,
  LogOut
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";

interface InvoiceRecord {
  id: number;
  invoice_number: string;
  vendor_name: string;
  vendor_udyam?: string;
  principal_amount: number;
  paid_amount: number;
  balance_due: number;
  invoice_date: string;
  due_date: string;
  days_overdue: number;
  portal_token: string;
  status: string;
}

export default function BuyerDashboardPage() {
  const { user, company, logout } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [utrSuccess, setUtrSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadBuyerInvoices() {
      try {
        const buyerId = company?.id || user?.company_id || 2;
        const res = await fetch(`${API_BASE_URL}/api/v1/invoices?buyer_id=${buyerId}`);
        if (res.ok) {
          const data = await res.json();
          setInvoices(data);
        }
      } catch (err) {
        console.error("Failed to load buyer AP invoices:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBuyerInvoices();
  }, [company?.id, user?.company_id]);

  const totalPayables = invoices.reduce((acc, inv) => acc + (inv.principal_amount - (inv.paid_amount || 0)), 0);
  const totalInvoices = invoices.length;
  const overdueInvoices = invoices.filter(inv => inv.days_overdue > 0);
  const totalOverdue = overdueInvoices.reduce((acc, inv) => acc + (inv.principal_amount - (inv.paid_amount || 0)), 0);
  const potentialSavings = totalPayables * 0.025; // 2.5% prompt payment discount

  return (
    <div className="space-y-6">
      {/* Enterprise Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold tracking-tight">
                  {company?.name || "Tata Motors Commercial Vehicles Ltd"}
                </h1>
                <span className="text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                  Corporate Treasury AP Portal
                </span>
                <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  MCA Compliant
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                GSTIN: <span className="font-mono text-slate-200">{company?.gstin || "27AAACT0001B1Z2"}</span> &bull; Classification: <span className="text-slate-200">Large Enterprise (₹8,400 Cr Turnover)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-2"
            >
              <span>MSME Supplier Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={logout}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/60 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Corporate Treasury KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Total MSME Payables
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-1">
              ₹{totalPayables.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Across {totalInvoices} active invoices
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Overdue MSME Dues
            </div>
            <div className="text-xl sm:text-2xl font-bold text-rose-400 mt-1">
              ₹{totalOverdue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] text-rose-400/80 mt-0.5">
              {overdueInvoices.length} invoices past MSMED terms
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Prompt Discount Capture
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">
              ₹{potentialSavings.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-0.5">
              2.5% instant savings available
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Section 43B(h) Audit
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-400 mt-1">
              Protected
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Zero disallowance under current status
            </div>
          </div>
        </div>
      </div>

      {utrSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{utrSuccess}</span>
          </div>
          <button onClick={() => setUtrSuccess(null)} className="text-xs text-slate-500 hover:text-slate-800">
            Dismiss
          </button>
        </div>
      )}

      {/* MSME Vendor Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-base text-slate-900 tracking-tight">
              Payables Ledger to MSME Vendors
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Statutory invoice tracking governed by Section 15 of MSMED Act (45-Day Payment Mandate)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              {invoices.length} Invoices Available
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">MSME Vendor</th>
                <th className="py-3 px-4 text-right">Principal</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Aging / Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Loading Corporate Accounts Payable Records...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No open payables records found for this account.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const unpaid = inv.principal_amount - (inv.paid_amount || 0);
                  const isOverdue = inv.days_overdue > 0;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{inv.vendor_name || "Apex Precision"}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {inv.vendor_udyam || "UDYAM-MH-01-0012345"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                        ₹{inv.principal_amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        ₹{unpaid.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {inv.due_date}
                      </td>
                      <td className="py-3.5 px-4">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            {inv.days_overdue}d Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Within Term
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/portal/${inv.portal_token}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200 transition"
                        >
                          <span>Settle &amp; Verify</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
