"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  ShieldCheck, 
  Coins, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  BarChart3, 
  TrendingUp, 
  Scale, 
  FileCheck2,
  ExternalLink,
  Layers,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";

interface BuyerTreasury {
  id: number;
  name: string;
  gstin: string;
  enterprise_class: string;
  credit_limit: number;
  corporate_tax_rate: number;
  is_tax_loss: boolean;
  annual_turnover: number;
  net_profit_margin: number;
  mca_filing_status: string;
  total_outstandings: number;
  credit_utilization_percent: number;
  sec43bh_vulnerable: boolean;
  invoice_count: number;
}

export default function BuyersTreasuryPage() {
  const { company } = useAuth();
  const [buyers, setBuyers] = useState<BuyerTreasury[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTreasury() {
      try {
        const vendorId = company?.id || 1;
        const res = await fetch(`${API_BASE_URL}/api/v1/vendors/buyers-treasury?vendor_id=${vendorId}`);
        if (res.ok) {
          const data = await res.json();
          setBuyers(data);
        }
      } catch (err) {
        console.error("Failed to load buyers treasury data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTreasury();
  }, [company?.id]);

  const totalCorporateTurnover = buyers.reduce((sum, b) => sum + (b.annual_turnover || 0), 0);
  const totalMSMEOutstandings = buyers.reduce((sum, b) => sum + (b.total_outstandings || 0), 0);
  const vulnerableBuyersCount = buyers.filter(b => b.sec43bh_vulnerable).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Corporate Buyer Financials &amp; Outstanding Ledger
            </h1>
            <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
              Treasury Metrics
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Corporate annual turnover, MCA compliance filing status, Section 43B(h) vulnerability, and credit limit utilization across all buyer accounts.
          </p>
        </div>

        <Link
          href="/reminders"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold shadow-xs transition"
        >
          <Layers className="w-4 h-4" />
          <span>Launch Multi-Invoice Reminders</span>
        </Link>
      </div>

      {/* Corporate Financial Health Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Combined Buyer Annual Turnover</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-[#0F172A] mt-2">
            ₹{totalCorporateTurnover.toLocaleString("en-IN")} Cr
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Audited financial turnover across {buyers.length} corporate accounts
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Total MSME Outstandings</span>
            <Coins className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-[#0F172A] mt-2">
            ₹{totalMSMEOutstandings.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Unpaid commercial trade credit to your enterprise
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Section 43B(h) Vulnerability</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">
            {vulnerableBuyersCount} of {buyers.length} Accounts
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Corporate buyers subject to ~30% tax deduction disallowance
          </div>
        </div>
      </div>

      {/* Corporate Treasury Breakdown Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="font-bold text-sm text-[#0F172A]">
              Corporate Enterprise Financial Ledger
            </h2>
            <p className="text-xs text-[#64748B]">
              Real-time synchronization with MCA filings, credit limits, and trade receivables
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Corporate Buyer &amp; Classification</th>
                <th className="py-3 px-4 text-right">Annual Turnover</th>
                <th className="py-3 px-4 text-right">Net Margin</th>
                <th className="py-3 px-4 text-right">Total MSME Outstandings</th>
                <th className="py-3 px-4">Credit Limit &amp; Risk Utilization</th>
                <th className="py-3 px-4">Sec 43B(h) Vulnerability Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] font-medium text-[#0F172A]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Loading Corporate Treasury and MCA filing records...
                  </td>
                </tr>
              ) : buyers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No corporate buyer records found.
                  </td>
                </tr>
              ) : (
                buyers.map((buyer) => {
                  const utilization = Math.min(100, buyer.credit_utilization_percent || 0);
                  const isHighRisk = utilization >= 70;

                  return (
                    <tr key={buyer.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {buyer.name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
                          <span>{buyer.gstin}</span>
                          <span>&bull;</span>
                          <span className="font-sans font-semibold text-slate-600 uppercase text-[10px] bg-slate-100 px-1.5 py-0.2 rounded">
                            {buyer.enterprise_class}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right font-bold text-slate-900">
                        ₹{buyer.annual_turnover?.toLocaleString("en-IN") || 0} Cr
                      </td>

                      <td className="py-4 px-4 text-right font-semibold text-slate-700">
                        {buyer.net_profit_margin ? `${buyer.net_profit_margin}%` : "N/A"}
                      </td>

                      <td className="py-4 px-4 text-right font-extrabold text-slate-900">
                        ₹{buyer.total_outstandings.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        <div className="text-[10px] font-normal text-slate-400">
                          {buyer.invoice_count} invoices
                        </div>
                      </td>

                      <td className="py-4 px-4 min-w-[200px]">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-slate-500 font-medium">Limit: ₹{(buyer.credit_limit / 100000).toFixed(1)}L</span>
                          <span className={`font-bold ${isHighRisk ? "text-rose-600" : "text-emerald-700"}`}>
                            {utilization.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              isHighRisk ? "bg-rose-500" : utilization >= 50 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${utilization}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {buyer.sec43bh_vulnerable ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Vulnerable (~30% Tax Risk)
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              MCA: {buyer.mca_filing_status}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                              <ShieldCheck className="w-3 h-3 text-blue-600" />
                              Exempt (Tax-Loss / Trader)
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              MCA: {buyer.mca_filing_status}
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/reminders?buyer_id=${buyer.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200 transition"
                        >
                          <span>Manage Reminders</span>
                          <ArrowRight className="w-3 h-3" />
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
