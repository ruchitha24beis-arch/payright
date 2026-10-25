"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  Send, 
  Mail, 
  MessageSquare, 
  Copy, 
  Check, 
  CheckCircle2, 
  Coins, 
  Percent, 
  ShieldCheck, 
  Building2,
  ExternalLink,
  AlertTriangle,
  FileCheck2,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Link2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";

interface BuyerAccount {
  id: number;
  name: string;
  gstin: string;
  annual_turnover?: number;
  mca_filing_status?: string;
  total_outstandings?: number;
}

interface InvoiceItem {
  id: number;
  invoice_number: string;
  vendor_id: number;
  vendor_name: string;
  buyer_id: number;
  buyer_name: string;
  principal_amount: number;
  paid_amount?: number;
  balance_due?: number;
  invoice_date?: string;
  due_date: string;
  days_overdue: number;
  portal_token?: string;
}

interface ConsolidatedLinkResult {
  token: string;
  portal_url: string;
  buyer_name: string;
  invoice_count: number;
  total_principal: number;
  combined_sec16_interest: number;
  sec43bh_exposure: number;
  is_tax_loss_buyer: boolean;
}

export default function RemindersPage() {
  const { company } = useAuth();
  const [buyers, setBuyers] = useState<BuyerAccount[]>([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState<number | null>(null);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  // Action states
  const [consolidatedResult, setConsolidatedResult] = useState<ConsolidatedLinkResult | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState(false);

  // Active message template tab
  const [activeTab, setActiveTab] = useState<"CONSOLIDATED_PORTAL" | "WHATSAPP_BATCH" | "EMAIL_DISALLOWANCE">("CONSOLIDATED_PORTAL");

  // 1. Fetch all buyer accounts for the MSME vendor
  useEffect(() => {
    async function loadBuyers() {
      try {
        const vendorId = company?.id || 1;
        const res = await fetch(`${API_BASE_URL}/api/v1/vendors/buyers-treasury?vendor_id=${vendorId}`);
        if (res.ok) {
          const data: BuyerAccount[] = await res.json();
          setBuyers(data);
          if (data.length > 0) {
            setSelectedBuyerId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch buyers:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBuyers();
  }, [company?.id]);

  // 2. Fetch all unpaid/partially paid invoices for the selected buyer account
  useEffect(() => {
    if (!selectedBuyerId) return;
    async function loadInvoicesForBuyer() {
      setInvoicesLoading(true);
      setConsolidatedResult(null);
      setDispatchStatus(null);
      try {
        const vendorId = company?.id || 1;
        const res = await fetch(`${API_BASE_URL}/api/v1/invoices?vendor_id=${vendorId}&buyer_id=${selectedBuyerId}`);
        if (res.ok) {
          const data: InvoiceItem[] = await res.json();
          setInvoices(data);
          // By default, select all invoices for convenience
          setSelectedInvoiceIds(data.map(i => i.id));
        }
      } catch (err) {
        console.error("Failed to load invoices for buyer:", err);
      } finally {
        setInvoicesLoading(false);
      }
    }
    loadInvoicesForBuyer();
  }, [selectedBuyerId, company?.id]);

  // Compute live aggregated metrics for selected invoices
  const selectedInvoices = useMemo(() => {
    return invoices.filter(i => selectedInvoiceIds.includes(i.id));
  }, [invoices, selectedInvoiceIds]);

  const aggregatedMetrics = useMemo(() => {
    const count = selectedInvoices.length;
    let totalPrincipal = 0;
    let combinedSec16Interest = 0;

    selectedInvoices.forEach(inv => {
      const unpaid = inv.principal_amount - (inv.paid_amount || 0);
      totalPrincipal += unpaid;
      if (inv.days_overdue > 0) {
        // Approximate monthly compound interest at 3x RBI Rate (17.25% p.a.)
        const monthlyRate = 0.1725 / 12.0;
        const months = inv.days_overdue / 30.0;
        const interest = unpaid * (Math.pow(1 + monthlyRate, months) - 1);
        combinedSec16Interest += interest;
      }
    });

    const activeBuyer = buyers.find(b => b.id === selectedBuyerId);
    const isTaxLossExempt = activeBuyer?.mca_filing_status === "TAX_LOSS_EXEMPT";
    const sec43bhTaxRisk = isTaxLossExempt ? 0 : totalPrincipal * 0.30; // ~30% corporate tax bracket

    return {
      count,
      totalPrincipal,
      combinedSec16Interest,
      sec43bhTaxRisk,
      isTaxLossExempt
    };
  }, [selectedInvoices, buyers, selectedBuyerId]);

  // Toggle single invoice
  const toggleInvoice = (id: number) => {
    setSelectedInvoiceIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Toggle all invoices
  const toggleSelectAll = () => {
    if (selectedInvoiceIds.length === invoices.length) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(invoices.map(i => i.id));
    }
  };

  // Action 1: Generate Consolidated Recovery Link
  const handleGenerateConsolidatedLink = async () => {
    if (!selectedBuyerId || selectedInvoiceIds.length === 0) return;
    setGeneratingLink(true);
    setDispatchStatus(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/reminders/consolidated-portal-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_id: selectedBuyerId,
          invoice_ids: selectedInvoiceIds,
          channel: "GUEST_PORTAL"
        })
      });
      if (res.ok) {
        const data = await res.json();
        setConsolidatedResult(data);
        setActiveTab("CONSOLIDATED_PORTAL");
      }
    } catch (err) {
      console.error("Failed to generate link:", err);
    } finally {
      setGeneratingLink(false);
    }
  };

  // Action 2: Dispatch Batch WhatsApp Advisory
  const handleDispatchWhatsApp = async () => {
    if (!selectedBuyerId || selectedInvoiceIds.length === 0) return;
    setDispatching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/reminders/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_id: selectedBuyerId,
          invoice_ids: selectedInvoiceIds,
          channel: "WHATSAPP",
          notes: "Consolidated Batch Section 43B(h) and Section 16 Advisory"
        })
      });
      if (res.ok) {
        setDispatchStatus("Batch WhatsApp Advisory queued and dispatched to Corporate Treasury!");
      }
    } catch (err) {
      console.error("Failed to dispatch WhatsApp:", err);
    } finally {
      setDispatching(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const currentBuyer = buyers.find(b => b.id === selectedBuyerId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Multi-Invoice Reminders &amp; Recovery Hub
            </h1>
            <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
              Account-Level Recovery
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Group multiple invoices per corporate buyer, consolidate Section 43B(h) tax risks, and generate single-token settlement links.
          </p>
        </div>

        {/* Account / Buyer Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-[#0F172A] shrink-0">
            Select Account / Buyer:
          </label>
          <div className="relative min-w-[240px]">
            <select
              value={selectedBuyerId || ""}
              onChange={(e) => setSelectedBuyerId(Number(e.target.value))}
              className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-blue-600 shadow-xs appearance-none cursor-pointer pr-8"
            >
              {buyers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (Turnover: ₹{b.annual_turnover || 0} Cr)
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
              ▼
            </div>
          </div>
        </div>
      </div>

      {/* Live Summary Card: Selected Invoices & Aggregated Statutory Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Selected Invoices</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-[#0F172A] mt-2">
            {aggregatedMetrics.count} <span className="text-xs font-normal text-slate-500">of {invoices.length} selected</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Account: {currentBuyer?.name || "Corporate Buyer"}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Aggregated Dues Amount</span>
            <Coins className="w-4 h-4 text-slate-900" />
          </div>
          <div className="text-2xl font-bold text-[#0F172A] mt-2">
            ₹{aggregatedMetrics.totalPrincipal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Combined principal balance
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Sec 43B(h) Tax Disallowance</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">
            ₹{aggregatedMetrics.sec43bhTaxRisk.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {aggregatedMetrics.isTaxLossExempt ? "Exempt (Buyer Tax-Loss)" : "~30% Corporate Tax Outflow Risk"}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Combined Sec 16 Interest</span>
            <ShieldCheck className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">
            ₹{aggregatedMetrics.combinedSec16Interest.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Compound interest at 3x RBI Bank Rate
          </div>
        </div>
      </div>

      {/* Main Multi-Invoice Table Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="font-bold text-sm text-[#0F172A]">
              Open Invoices for {currentBuyer?.name || "Selected Buyer"}
            </h2>
            <p className="text-xs text-[#64748B]">
              Check boxes to include in consolidated recovery link and batch communications
            </p>
          </div>

          {/* Batch Actions Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleGenerateConsolidatedLink}
              disabled={generatingLink || selectedInvoiceIds.length === 0}
              className="px-3.5 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-2 transition disabled:opacity-40 shadow-xs"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>{generatingLink ? "Generating Link..." : "Generate Consolidated Recovery Link"}</span>
            </button>

            <button
              onClick={handleDispatchWhatsApp}
              disabled={dispatching || selectedInvoiceIds.length === 0}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition disabled:opacity-40 shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{dispatching ? "Dispatching..." : "Dispatch Batch WhatsApp Advisory"}</span>
            </button>

            <Link
              href={`/settlement-builder?buyer_id=${selectedBuyerId}&invoices=${selectedInvoiceIds.join(",")}`}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-xs"
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Build Consolidated e-NACH EMI Plan</span>
            </Link>
          </div>
        </div>

        {dispatchStatus && (
          <div className="m-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{dispatchStatus}</span>
          </div>
        )}

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={selectedInvoiceIds.length === invoices.length && invoices.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4 text-right">Principal</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Aging / Overdue</th>
                <th className="py-3 px-4">Section 43B(h) Risk</th>
                <th className="py-3 px-4 text-right">Individual Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] font-medium text-[#0F172A]">
              {invoicesLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Loading account receivables...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No open invoices found for this corporate account.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isSelected = selectedInvoiceIds.includes(inv.id);
                  const unpaid = inv.principal_amount - (inv.paid_amount || 0);
                  const taxRisk = aggregatedMetrics.isTaxLossExempt ? 0 : unpaid * 0.30;

                  return (
                    <tr 
                      key={inv.id} 
                      className={`hover:bg-slate-50/80 transition cursor-pointer ${isSelected ? "bg-blue-50/30" : ""}`}
                      onClick={() => toggleInvoice(inv.id)}
                    >
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleInvoice(inv.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-700">
                        ₹{inv.principal_amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ₹{unpaid.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {inv.due_date}
                      </td>
                      <td className="py-3 px-4">
                        {inv.days_overdue > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            {inv.days_overdue}d Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Current
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          ₹{taxRisk.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/portal/${inv.portal_token}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <span>Portal</span>
                          <ExternalLink className="w-3 h-3" />
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

      {/* Generated Consolidated Link Card */}
      {consolidatedResult && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Consolidated Recovery Token Active</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight">
                Account Settlement Link for {consolidatedResult.buyer_name}
              </h3>
              <p className="text-xs text-slate-300">
                Bundles {consolidatedResult.invoice_count} invoices totaling ₹{consolidatedResult.total_principal.toLocaleString("en-IN")}. Corporate AP can reconcile all items in a single click.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700 px-3.5 py-2.5 rounded-xl font-mono text-xs text-slate-200">
                <span className="truncate max-w-[200px] sm:max-w-[280px]">
                  {typeof window !== "undefined" ? window.location.origin : ""}{consolidatedResult.portal_url}
                </span>
                <button
                  onClick={() => copyToClipboard(`${typeof window !== "undefined" ? window.location.origin : ""}${consolidatedResult.portal_url}`)}
                  className="p-1 hover:text-white transition text-slate-400"
                  title="Copy Link"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <Link
                href={consolidatedResult.portal_url}
                target="_blank"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-blue-500/20"
              >
                <span>Open Buyer View</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
