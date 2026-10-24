"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  AlertTriangle, 
  Percent, 
  Coins, 
  Handshake, 
  FileCheck2, 
  Building2, 
  Send, 
  Search, 
  Filter, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  FileText,
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";

interface MetricData {
  total_outstanding: number;
  total_43bh_exposure: number;
  total_sec16_interest: number;
  total_recovered: number;
  active_emi_plans_count: number;
  invoices_count: number;
}

interface AgingBucket {
  bucket: string;
  amount: number;
  count: number;
  fill: string;
}

interface HealthTier {
  tier: string;
  count: number;
}

interface InvoiceItem {
  id: number;
  invoice_number: string;
  vendor_name: string;
  buyer_name: string;
  principal_amount: number;
  paid_amount: number;
  due_date: string;
  days_overdue: number;
  status: string;
  document_health_score: number;
  section_43bh_tax_exposure: number;
  section_16_interest: number;
  portal_token: string;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [agingData, setAgingData] = useState<AgingBucket[]>([]);
  const [healthData, setHealthData] = useState<HealthTier[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortField, setSortField] = useState<"days_overdue" | "principal_amount" | "tax_exposure">("days_overdue");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, invRes] = await Promise.all([
          fetch("http://localhost:8000/api/v1/analytics/dashboard"),
          fetch("http://localhost:8000/api/v1/invoices")
        ]);
        if (dashRes.ok && invRes.ok) {
          const dashJson = await dashRes.json();
          const invJson = await invRes.json();
          setMetrics(dashJson.metrics);
          setAgingData(dashJson.aging_chart);
          setHealthData(dashJson.health_chart);
          setInvoices(invJson);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Filtered & Sorted invoices
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        const matchesSearch = 
          inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.buyer_name.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;

        if (statusFilter === "OVERDUE_45") {
          return inv.days_overdue > 45;
        } else if (statusFilter === "OVERDUE_15_45") {
          return inv.days_overdue >= 15 && inv.days_overdue <= 45;
        } else if (statusFilter === "ACTIVE_EMI") {
          return inv.status === "PARTIAL_EMI";
        } else if (statusFilter === "PAID") {
          return inv.status === "PAID";
        }
        return true;
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (sortField === "days_overdue") {
          valA = a.days_overdue;
          valB = b.days_overdue;
        } else if (sortField === "principal_amount") {
          valA = a.principal_amount;
          valB = b.principal_amount;
        } else if (sortField === "tax_exposure") {
          valA = a.section_43bh_tax_exposure;
          valB = b.section_43bh_tax_exposure;
        }
        return sortOrder === "desc" ? valB - valA : valA - valB;
      });
  }, [invoices, searchQuery, statusFilter, sortField, sortOrder]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#163A5F] border-t-transparent animate-spin" />
        <p className="text-xs font-medium text-[#64748B]">Loading receivables and compliance data...</p>
      </div>
    );
  }

  // Refined palette colors for aging chart
  const agingColors = ["#16A34A", "#2563EB", "#D97706", "#DC2626"];

  return (
    <div className="space-y-6">
      {/* Top Banner: Statutory Reminder */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#0F172A]">
                Section 43B(h) Commercial Reconciliation Console
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                FY 2024-25 Active
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Preserving corporate client relationships by presenting 30% tax deduction loss calculations as mutual audit incentives instead of hostile court threats.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/settlement-builder"
            className="px-3.5 py-2 rounded-lg bg-[#163A5F] hover:bg-[#102B47] text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
          >
            <Handshake className="w-3.5 h-3.5" />
            <span>Create EMI Plan</span>
          </Link>
          <Link
            href="/invoices/health-check"
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-[#163A5F] text-xs font-semibold border border-[#E2E8F0] flex items-center gap-1.5 transition"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
            <span>OCR Health Check</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Outstanding */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Total Outstanding
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#0F172A] mt-2.5 tabular-nums">
            {formatINR(metrics?.total_outstanding || 0)}
          </div>
          <div className="text-xs text-[#64748B] mt-1.5 flex items-center gap-1.5">
            <span className="font-semibold text-[#2563EB]">{metrics?.invoices_count} Invoices</span>
            <span>across registered buyers</span>
          </div>
        </div>

        {/* Metric 2: Section 43B(h) Tax Exposure */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
              Sec 43B(h) Tax At Risk
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-2.5 tabular-nums">
            {formatINR(metrics?.total_43bh_exposure || 0)}
          </div>
          <div className="text-xs text-amber-800 mt-1.5 font-medium">
            Direct ~30% corporate tax deduction loss for buyer
          </div>
        </div>

        {/* Metric 3: Section 16 Interest */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              MSMED Sec 16 Interest
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#0F172A] mt-2.5 tabular-nums">
            {formatINR(metrics?.total_sec16_interest || 0)}
          </div>
          <div className="text-xs text-[#64748B] mt-1.5">
            3x RBI Bank Rate (20.25% p.a. Compounding)
          </div>
        </div>

        {/* Metric 4: Active EMI Schedules */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Active EMI Schedules
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center">
              <Handshake className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#0F172A] mt-2.5 tabular-nums">
            {metrics?.active_emi_plans_count} Structured Plans
          </div>
          <div className="text-xs text-emerald-700 mt-1.5 font-medium">
            Pro-rata goods releases active
          </div>
        </div>
      </div>

      {/* Analytics Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aging Breakdown Bar Chart */}
        <div className="lg:col-span-2 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-bold text-sm text-[#0F172A]">
                Receivables Aging & Section 43B(h) Thresholds
              </h2>
              <p className="text-xs text-[#64748B]">
                Invoices approaching or past the 45-day statutory MSMED deduction cliff
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0] self-start sm:self-auto">
              Amounts in INR
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <XAxis 
                  dataKey="bucket" 
                  tick={{ fill: "#64748B", fontSize: 11 }} 
                  interval={0}
                  tickLine={false}
                  axisLine={{ stroke: "#E2E8F0" }}
                />
                <YAxis 
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  tickFormatter={(val) => `₹${val / 100000}L`}
                  tickLine={false}
                  axisLine={{ stroke: "#E2E8F0" }}
                />
                <Tooltip 
                  formatter={(val: any) => [formatINR(Number(val)), "Principal Due"]}
                  contentStyle={{ 
                    backgroundColor: "#FFFFFF", 
                    borderColor: "#E2E8F0", 
                    borderRadius: "8px", 
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    fontSize: "12px",
                    color: "#0F172A"
                  }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {agingData.map((_, index) => (
                    <Cell key={`aging-${index}`} fill={agingColors[index % agingColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* POD Evidentiary Health Readiness */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-sm text-[#0F172A]">
                Delivery Proof Legal Readiness
              </h2>
              <FileCheck2 className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xs text-[#64748B] mb-4">
              AI verification of buyer stamps, receiver signatures & date seals before dispute escalation.
            </p>

            <div className="space-y-2.5">
              {healthData.map((tier, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: agingColors[i % agingColors.length] }}
                    />
                    <span className="text-xs font-medium text-slate-700">{tier.tier}</span>
                  </div>
                  <span className="text-xs font-bold text-[#163A5F] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                    {tier.count} docs
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] mt-4">
            <Link
              href="/invoices/health-check"
              className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold flex items-center justify-center gap-1 py-1"
            >
              <span>Inspect Missing Signatures & Stamps</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Invoice Management Console */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-xs overflow-hidden">
        {/* Header with Search, Filter & Stats */}
        <div className="p-4 sm:p-5 border-b border-[#E2E8F0] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-base text-[#0F172A]">
                Payment Tracking & Commercial Recovery Console
              </h2>
              <p className="text-xs text-[#64748B]">
                Track statutory deduction deadlines, initiate diplomatic reconciliation, or discount via TReDS
              </p>
            </div>
            <div className="text-xs text-[#64748B] font-medium self-start sm:self-auto">
              Showing <span className="font-bold text-[#0F172A]">{filteredInvoices.length}</span> of {invoices.length} registered bills
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search invoice number or buyer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#0F172A] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2563EB] focus:bg-white transition"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  statusFilter === "ALL"
                    ? "bg-[#163A5F] text-white"
                    : "bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] hover:text-[#0F172A]"
                }`}
              >
                All Invoices
              </button>
              <button
                onClick={() => setStatusFilter("OVERDUE_45")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  statusFilter === "OVERDUE_45"
                    ? "bg-red-700 text-white"
                    : "bg-[#F8FAFC] text-red-700 border border-red-200 hover:bg-red-50"
                }`}
              >
                Overdue &gt; 45d
              </button>
              <button
                onClick={() => setStatusFilter("OVERDUE_15_45")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  statusFilter === "OVERDUE_15_45"
                    ? "bg-amber-700 text-white"
                    : "bg-[#F8FAFC] text-amber-800 border border-amber-200 hover:bg-amber-50"
                }`}
              >
                15 - 45d Cliff
              </button>
              <button
                onClick={() => setStatusFilter("ACTIVE_EMI")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  statusFilter === "ACTIVE_EMI"
                    ? "bg-[#16A34A] text-white"
                    : "bg-[#F8FAFC] text-[#16A34A] border border-emerald-200 hover:bg-emerald-50"
                }`}
              >
                Active EMI
              </button>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#64748B] uppercase tracking-wider font-semibold border-b border-[#E2E8F0]">
              <tr>
                <th className="py-3 px-4">Invoice / Vendor</th>
                <th className="py-3 px-4">Corporate Buyer</th>
                <th className="py-3 px-4 text-right">Principal Due</th>
                <th className="py-3 px-4">Days Overdue</th>
                <th className="py-3 px-4 text-right">Sec 43B(h) Tax Risk</th>
                <th className="py-3 px-4">Doc Health</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Reconciliation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-slate-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No matching invoices found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search query or status filter.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#0F172A]">{inv.invoice_number}</div>
                      <div className="text-[11px] text-[#64748B]">{inv.vendor_name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#0F172A]">{inv.buyer_name}</div>
                      <div className="text-[11px] text-[#64748B]">Due: {inv.due_date}</div>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      <div className="font-bold text-[#0F172A]">{formatINR(inv.principal_amount)}</div>
                      {inv.paid_amount > 0 && (
                        <div className="text-[10px] text-[#16A34A] font-medium">
                          Paid: {formatINR(inv.paid_amount)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        inv.days_overdue > 45 
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : inv.days_overdue >= 15
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-blue-50 text-[#2563EB] border border-blue-200"
                      }`}>
                        {inv.days_overdue} days
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      <span className="font-bold text-amber-900">
                        {formatINR(inv.section_43bh_tax_exposure)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              inv.document_health_score >= 80 ? "bg-[#16A34A]" :
                              inv.document_health_score >= 50 ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${inv.document_health_score}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-slate-700">
                          {inv.document_health_score}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                        inv.status === "PARTIAL_EMI"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : inv.status === "PAID"
                          ? "bg-emerald-50 text-[#16A34A] border border-emerald-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/portal/${inv.portal_token}`}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="Corporate Buyer Portal Link"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href="/settlement-builder"
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                          title="Create EMI Schedule"
                        >
                          <Handshake className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href="/reminders"
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#2563EB] border border-blue-200 transition"
                          title="Send Diplomatic Reminder"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href="/treds"
                          className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition"
                          title="TReDS Bill Discounting"
                        >
                          <Coins className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
