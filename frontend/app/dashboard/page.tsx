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
  Search, 
  Filter, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ExternalLink,
  Lock,
  Layers,
  ArrowRight,
  RefreshCw,
  Database,
  Cloud,
  Zap,
  Check,
  Plus,
  Trash2,
  RotateCcw
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
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import CreateInvoiceModal from "@/components/CreateInvoiceModal";
import CreateBuyerModal from "@/components/CreateBuyerModal";

interface MetricData {
  total_outstanding: number;
  total_43bh_exposure: number;
  total_sec16_interest: number;
  total_recovered: number;
  active_emi_plans_count: number;
  active_enach_mandates_count: number;
  enach_protected_amount: number;
  deemed_accepted_count: number;
  invoices_count: number;
  dual_rail_cash_flow?: {
    rail_1_treds_pending_amount: number;
    rail_2_nbfc_disbursed_amount: number;
    total_financed_liquidity: number;
  };
  safeguards_active?: {
    trader_exemption_applied_count: number;
    buyer_tax_loss_pivot_count: number;
    deemed_acceptance_locks: number;
  };
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

interface DeemedAcceptanceInfo {
  delivery_date: string;
  lock_deadline: string;
  days_elapsed: number;
  days_remaining: number;
  is_locked: boolean;
  lock_status: string;
  status_label: string;
  badge_color: string;
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
  legal_health_score: number;
  section_43bh_tax_exposure: number;
  section_16_interest: number;
  portal_token: string;
  deemed_acceptance_info?: DeemedAcceptanceInfo;
  financing_rail?: string;
  financing_status?: string;
  buyer_is_tax_loss?: boolean;
  vendor_major_activity?: string;
  sec_43bh_eligible?: boolean;
}

export default function DashboardPage() {
  const { user, company, clearDemoData, resetDemoData, dataMode, setDataMode } = useAuth();
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [agingData, setAgingData] = useState<AgingBucket[]>([]);
  const [healthData, setHealthData] = useState<HealthTier[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals for real user data entry
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [createBuyerOpen, setCreateBuyerOpen] = useState(false);

  // Sync state for Tally and Zoho overlay buttons
  const [syncingTally, setSyncingTally] = useState(false);
  const [syncingZoho, setSyncingZoho] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortField, setSortField] = useState<"days_overdue" | "principal_amount" | "tax_exposure">("days_overdue");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  async function fetchData() {
    try {
      const vendorParam = company?.id ? `?vendor_id=${company.id}` : "";
      const [dashRes, invRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/analytics/dashboard${vendorParam}`),
        fetch(`${API_BASE_URL}/api/v1/invoices${vendorParam}`)
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

  useEffect(() => {
    fetchData();
  }, [company?.id]);

  const handleSyncTally = async () => {
    setSyncingTally(true);
    setSyncSuccessMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/sync/tally`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setSyncSuccessMessage(`✓ TallyPrime ERP Synchronized: ${data.invoices_imported_count} overdue ledgers imported (${formatINR(data.total_receivables_synced)}) with signed POD metadata.`);
        await fetchData();
      }
    } catch (err) {
      console.error("Tally sync failed", err);
    } finally {
      setSyncingTally(false);
    }
  };

  const handleSyncZoho = async () => {
    setSyncingZoho(true);
    setSyncSuccessMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/sync/zoho`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setSyncSuccessMessage(`✓ Zoho Books Cloud Sync Complete: ${data.invoices_imported_count} invoices imported (${formatINR(data.total_receivables_synced)}) and line-item inventory release milestones mapped.`);
        await fetchData();
      }
    } catch (err) {
      console.error("Zoho sync failed", err);
    } finally {
      setSyncingZoho(false);
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        const matchesSearch = 
          inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.buyer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.vendor_name.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;

        if (statusFilter === "DEEMED_ACCEPTED") {
          return inv.status === "DEEMED_ACCEPTED";
        } else if (statusFilter === "OVERDUE_45") {
          return inv.days_overdue > 45;
        } else if (statusFilter === "ACTIVE_EMI") {
          return inv.status === "PARTIAL_EMI";
        } else if (statusFilter === "FINANCED_DUAL_RAIL") {
          return inv.financing_rail === "RAIL_1_TREDS" || inv.financing_rail === "RAIL_2_NBFC";
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
        <p className="text-xs font-medium text-[#64748B]">Connecting to Accounting ERP Overlays &amp; Receivables...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clean Dashboard Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Receivables Dashboard</h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {company?.name || "Enterprise"} Active
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {dataMode === "LIVE" ? "Live Business Mode" : "Demo Samples"}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real commercial receivables for <strong>{company?.name}</strong>. Synchronized with statutory safeguards.
          </p>
        </div>

        {/* Real User Data Actions & Sync Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setCreateInvoiceOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-2 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>+ New Invoice</span>
          </button>

          <button
            onClick={() => setCreateBuyerOpen(true)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>+ Add Buyer</span>
          </button>

          <button
            onClick={handleSyncTally}
            disabled={syncingTally || syncingZoho}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            {syncingTally ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Database className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>{syncingTally ? "Syncing..." : "Sync Tally"}</span>
          </button>

          <button
            onClick={handleSyncZoho}
            disabled={syncingTally || syncingZoho}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            {syncingZoho ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>{syncingZoho ? "Syncing..." : "Sync Zoho"}</span>
          </button>
        </div>
      </div>

      {/* Data Scope Mode Strip */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-slate-700">
            <strong>Logged-in MSME:</strong> {company?.name} (GSTIN: <span className="font-mono font-semibold">{company?.gstin}</span>) &bull; 
            {company?.sec_43bh_eligible ? " Section 43B(h) Active" : " Section 16 Interest Pivot"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              if (confirm("Clear demonstration sample invoices and start with your own 100% clean live invoices?")) {
                await clearDemoData();
                await fetchData();
              }
            }}
            className="text-[11px] text-red-600 hover:text-red-700 hover:underline font-semibold flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Demo Samples</span>
          </button>
          <span className="text-slate-300">&bull;</span>
          <button
            onClick={async () => {
              await resetDemoData();
              await fetchData();
            }}
            className="text-[11px] text-blue-600 hover:text-blue-700 hover:underline font-semibold flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reload Samples</span>
          </button>
        </div>
      </div>

      {/* Sync Success Notification */}
      {syncSuccessMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncSuccessMessage}</span>
          </div>
          <button onClick={() => setSyncSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 cursor-pointer">&times;</button>
        </div>
      )}

      {/* Compact Safeguards Status Strip */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Statutory Safeguards:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[#64748B]">15-Day Lock:</span>
            <span className="font-bold text-[#0F172A]">{metrics?.deemed_accepted_count || 4} Sealed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Handshake className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[#64748B]">e-NACH:</span>
            <span className="font-bold text-[#0F172A]">{metrics?.active_enach_mandates_count || 2} Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[#64748B]">Sec 16 Fallback:</span>
            <span className="font-bold text-amber-900">20.25% p.a.</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Outstanding */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#64748B] font-medium">
            <span>Total Outstanding</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-[#0F172A] mt-2 tabular-nums">
            {formatINR(metrics?.total_outstanding || 0)}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">
            {metrics?.invoices_count || 0} Synced Invoices
          </div>
        </div>

        {/* Metric 2: Section 43B(h) Tax Exposure */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
            <span>Sec 43B(h) Tax at Risk</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-2 tabular-nums">
            {formatINR(metrics?.total_43bh_exposure || 0)}
          </div>
          <div className="text-[11px] text-amber-800 mt-1">
            30% Corporate Tax Disallowance
          </div>
        </div>

        {/* Metric 3: Active e-NACH Mandates */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
            <span>e-NACH Protected</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-2 tabular-nums">
            {formatINR(metrics?.enach_protected_amount || 0)}
          </div>
          <div className="text-[11px] text-emerald-800 mt-1">
            {metrics?.active_enach_mandates_count || 0} Mandates · Sec 25 PSSA
          </div>
        </div>

        {/* Metric 4: Financed Liquidity */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#64748B] font-medium">
            <span>Financed Liquidity</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-[#0F172A] mt-2 tabular-nums">
            {formatINR(metrics?.dual_rail_cash_flow?.rail_2_nbfc_disbursed_amount || metrics?.total_recovered || 0)}
          </div>
          <div className="text-[11px] text-indigo-700 mt-1">
            TReDS &amp; NBFC Disbursals
          </div>
        </div>
      </div>

      {/* Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Aging Breakdown Bar Chart */}
        <div className="lg:col-span-2 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-sm text-[#0F172A]">Aging Breakdown</h2>
              <p className="text-xs text-[#64748B]">Overdue invoices by Section 43B(h) timeline</p>
            </div>
            <span className="text-[10px] font-mono text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
              INR (₹ Lakhs)
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
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
                    fontSize: "12px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.08)"
                  }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {agingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || "#2563EB"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Liquidity Distribution Card */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-sm text-[#0F172A]">Dual-Rail Liquidity</h2>
            <p className="text-xs text-[#64748B]">Non-recourse cash flow channels</p>
          </div>

          <div className="space-y-3 py-2">
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block">Rail 1 (TReDS)</span>
                <span className="text-sm font-bold text-blue-600">
                  {formatINR(metrics?.dual_rail_cash_flow?.rail_1_treds_pending_amount || 840000)}
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                7-Day Window
              </span>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Rail 2 (NBFC Anchor)</span>
                <span className="text-sm font-bold text-emerald-900">
                  {formatINR(metrics?.dual_rail_cash_flow?.rail_2_nbfc_disbursed_amount || 735000)}
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Disbursed
              </span>
            </div>

            <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-900 font-bold uppercase tracking-wider block">Sec 16 Penal Interest</span>
                <span className="text-sm font-bold text-amber-900">
                  {formatINR(metrics?.total_sec16_interest || 0)}
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                3x RBI Rate
              </span>
            </div>
          </div>

          <Link
            href="/treds"
            className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1 justify-end pt-1"
          >
            <span>Discount Invoices</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Invoice Ledger Table */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-xs overflow-hidden">
        {/* Search & Filter Header */}
        <div className="p-3.5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8FAFC]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search invoice number, buyer, or vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] bg-white focus:outline-hidden focus:border-blue-600 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#64748B]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white focus:outline-hidden"
            >
              <option value="ALL">All Invoices</option>
              <option value="DEEMED_ACCEPTED">Deemed Accepted (15-Day Lock)</option>
              <option value="OVERDUE_45">Overdue &gt; 45 Days</option>
              <option value="ACTIVE_EMI">Active EMI</option>
              <option value="PAID">Settled / Paid</option>
            </select>
          </div>
        </div>

        {/* Clean Invoices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                <th className="py-3 px-4">Invoice</th>
                <th className="py-3 px-4">Buyer &amp; Vendor</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Acceptance Status</th>
                <th className="py-3 px-4">Tax / Penal Impact</th>
                <th className="py-3 px-4 text-center">Health</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <FileCheck2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-semibold text-slate-800 mb-1">No Invoices Found</h4>
                      <p className="text-xs text-slate-500 mb-4">
                        {dataMode === "LIVE" 
                          ? "You are in Live Business mode. Create your first real invoice or import via Tally/Zoho to get started." 
                          : "No invoices match the current filter or search criteria."}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCreateInvoiceOpen(true)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-400" />
                          <span>+ Create Real Invoice</span>
                        </button>
                        {dataMode === "LIVE" && (
                          <button
                            onClick={async () => {
                              await resetDemoData();
                              await fetchData();
                            }}
                            className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                            <span>Load Demo Records</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                const isDeemedLocked = inv.deemed_acceptance_info?.is_locked || inv.status === "DEEMED_ACCEPTED";
                const isTrader = inv.vendor_major_activity === "TRADING";
                const isTaxLoss = inv.buyer_is_tax_loss;

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#0F172A]">{inv.invoice_number}</div>
                      <div className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5">
                        <span>{inv.due_date}</span>
                        <span>·</span>
                        <span className={inv.days_overdue > 45 ? "text-red-600 font-bold" : "text-amber-800"}>
                          {inv.days_overdue}d overdue
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                        <span>{inv.buyer_name}</span>
                        {isTaxLoss && (
                          <span className="text-[9px] px-1 py-0.2 rounded-xs bg-purple-100 text-purple-800 font-bold">
                            TAX LOSS
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5">
                        <span>{inv.vendor_name}</span>
                        {isTrader && (
                          <span className="text-[9px] px-1 py-0.2 rounded-xs bg-amber-100 text-amber-900 font-bold">
                            TRADER
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 tabular-nums">
                      <div className="font-bold text-[#0F172A]">{formatINR(inv.principal_amount)}</div>
                      {inv.paid_amount > 0 && (
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          Paid: {formatINR(inv.paid_amount)}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {isDeemedLocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <Lock className="w-3 h-3 text-emerald-700" /> DEEMED ACCEPTED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          <Clock className="w-3 h-3 text-blue-600" /> {inv.deemed_acceptance_info?.days_remaining || 0}d lock timer
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {isTaxLoss || isTrader ? (
                        <div>
                          <span className="text-[11px] font-bold text-amber-900 block">
                            +{formatINR(inv.section_16_interest)}
                          </span>
                          <span className="text-[10px] text-[#64748B]">
                            {isTaxLoss ? "Sec 16 Compounding" : "Trader MSME Rule"}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[11px] font-bold text-amber-900 block">
                            {formatINR(inv.section_43bh_tax_exposure)}
                          </span>
                          <span className="text-[10px] text-[#64748B]">
                            30% Sec 43B(h) Risk
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                        inv.document_health_score >= 85 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : inv.document_health_score >= 65
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}>
                        {inv.document_health_score}%
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/portal/${inv.portal_token}`}
                          target="_blank"
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[#0F172A] font-semibold text-[11px] inline-flex items-center gap-1 transition"
                        >
                          <span>Portal</span>
                          <ExternalLink className="w-3 h-3 text-[#64748B]" />
                        </Link>
                        <Link
                          href="/settlement-builder"
                          className="px-2.5 py-1 rounded bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold text-[11px] inline-flex items-center gap-1 transition"
                        >
                          <span>EMI</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real Invoicing & Buyer Modals */}
      <CreateInvoiceModal
        isOpen={createInvoiceOpen}
        onClose={() => setCreateInvoiceOpen(false)}
        onCreated={fetchData}
      />
      <CreateBuyerModal
        isOpen={createBuyerOpen}
        onClose={() => setCreateBuyerOpen(false)}
        onCreated={fetchData}
      />
    </div>
  );
}
