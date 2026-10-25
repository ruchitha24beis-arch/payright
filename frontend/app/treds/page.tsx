"use client";

import { useEffect, useState } from "react";
import { 
  Coins, 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Zap, 
  Layers,
  Banknote,
  Info,
  Check,
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface InvoiceItem {
  id: number;
  invoice_number: string;
  vendor_name: string;
  buyer_name: string;
  principal_amount: number;
  status: string;
  document_health_score: number;
  financing_rail?: string;
  financing_status?: string;
  financing_details?: any;
}

interface FinancierBid {
  financier: string;
  rate: number;
  status: string;
}

interface BidResult {
  bid_id: string;
  exchange: string;
  exchange_code: string;
  invoice_number: string;
  principal_amount: number;
  tenor_days: number;
  annual_discount_rate_percent: number;
  discount_charge: number;
  treds_platform_fee: number;
  net_immediate_disbursal: number;
  settlement_timeline: string;
  recourse: string;
  bids: FinancierBid[];
}

import { useAuth } from "@/context/AuthContext";

export default function TReDSFactoringPage() {
  const { company } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [selectedExchange, setSelectedExchange] = useState<string>("RXIL");
  const [preferredRail, setPreferredRail] = useState<string>("AUTO");
  const [bidData, setBidData] = useState<BidResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingBids, setFetchingBids] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  useEffect(() => {
    loadInvoices();
  }, [company?.id]);

  async function loadInvoices() {
    try {
      const vendorParam = company?.id ? `?vendor_id=${company.id}` : "";
      const res = await fetch(`${API_BASE_URL}/api/v1/invoices${vendorParam}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
        if (data.length > 0) {
          setSelectedInvoiceId(data[0].id);
        } else {
          setSelectedInvoiceId(null);
          setBidData(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId);

  const handleFetchBids = async () => {
    if (!selectedInvoiceId) return;
    setFetchingBids(true);
    setSuccessResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/treds/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: selectedInvoiceId,
          exchange_code: selectedExchange
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBidData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingBids(false);
    }
  };

  const handleExecuteDualRail = async () => {
    if (!selectedInvoiceId) return;
    setExecuting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/financing/dual-rail-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: selectedInvoiceId,
          preferred_rail: preferredRail
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessResult({
          message: data.safeguard_explanation,
          net_disbursal: data.net_immediate_disbursal,
          active_rail: data.active_rail,
          rate: data.applied_discount_rate_pa,
          request_id: data.request_id
        });
        await loadInvoices();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExecuting(false);
    }
  };

  const handleForceFailover = async () => {
    if (!selectedInvoiceId) return;
    setExecuting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/financing/force-failover/${selectedInvoiceId}`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setSuccessResult({
          message: data.message,
          net_disbursal: data.net_disbursal_amount,
          active_rail: data.active_rail,
          rate: 10.8,
          request_id: "NBFC-FAILOVER-CLEARANCE"
        });
        await loadInvoices();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExecuting(false);
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#163A5F] border-t-transparent animate-spin" />
        <p className="text-xs font-medium text-[#64748B]">Connecting to Dual-Rail Financing (TReDS &amp; NBFC gateways)...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
              TReDS Invoice Financing
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Dual-Rail Active
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Instant non-recourse bill discounting at ~8% p.a. with automated NBFC failover protection.
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successResult && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Financing Active ({successResult.active_rail})</span>
          </div>
          <p className="text-xs text-slate-700">
            {successResult.message}
          </p>
          <div className="text-[11px] font-mono text-emerald-800 font-semibold">
            Net Disbursal: {formatINR(successResult.net_disbursal)} · Rate: {successResult.rate}% p.a.
          </div>
        </div>
      )}

      {/* Dual-Rail Engine Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Config Card (6 cols) */}
        <div className="lg:col-span-6 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-2.5 border-[#E2E8F0]">
            <h2 className="font-bold text-xs text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Select Invoice &amp; Routing</span>
            </h2>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                Select Invoice
              </label>
              <select
                value={selectedInvoiceId || ""}
                onChange={(e) => {
                  setSelectedInvoiceId(Number(e.target.value));
                  setBidData(null);
                }}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#0F172A] focus:outline-hidden focus:border-blue-600 font-medium"
              >
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number} · {inv.buyer_name} · {formatINR(inv.principal_amount)} ({inv.financing_rail || "NONE"})
                  </option>
                ))}
              </select>
            </div>

            {/* Routing Mode */}
            <div>
              <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                Financing Routing Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPreferredRail("AUTO")}
                  className={`p-3 rounded-lg border text-left text-xs transition cursor-pointer ${
                    preferredRail === "AUTO"
                      ? "border-blue-600 bg-blue-50/50 shadow-xs"
                      : "border-[#E2E8F0] hover:bg-slate-50"
                  }`}
                >
                  <div className="font-bold text-blue-900">Rail 1 (TReDS Auto)</div>
                  <div className="text-[10px] text-blue-700 mt-0.5">~8.1% p.a. · 7-day buyer window</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPreferredRail("RAIL_2_NBFC")}
                  className={`p-3 rounded-lg border text-left text-xs transition cursor-pointer ${
                    preferredRail === "RAIL_2_NBFC"
                      ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                      : "border-[#E2E8F0] hover:bg-slate-50"
                  }`}
                >
                  <div className="font-bold text-emerald-900">Direct Rail 2 (NBFC)</div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">~10.8% p.a. · Instant on verified POD</div>
                </button>
              </div>
            </div>

            {/* TReDS Exchange Selector */}
            <div>
              <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                Exchange Platform
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { code: "RXIL", name: "RXIL", rate: "8.1%" },
                  { code: "M1_XCHANGE", name: "M1xchange", rate: "8.3%" },
                  { code: "INVOICEMART", name: "Invoicemart", rate: "7.9%" }
                ].map((exch) => (
                  <button
                    key={exch.code}
                    type="button"
                    onClick={() => {
                      setSelectedExchange(exch.code);
                      setBidData(null);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                      selectedExchange === exch.code
                        ? "border-[#0F172A] bg-slate-50 text-[#0F172A] font-bold"
                        : "border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A]"
                    }`}
                  >
                    <div className="text-xs">{exch.name}</div>
                    <div className="text-[10px] text-[#64748B]">{exch.rate} avg</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleExecuteDualRail}
                disabled={executing}
                className="flex-1 py-2.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {executing ? "Processing..." : "Initiate Dual-Rail Financing"}
              </button>

              <button
                type="button"
                onClick={handleFetchBids}
                disabled={fetchingBids}
                className="px-4 py-2.5 rounded-lg bg-white border border-[#E2E8F0] text-slate-700 hover:bg-slate-50 font-bold text-xs transition disabled:opacity-50 cursor-pointer"
              >
                {fetchingBids ? "..." : "Fetch Bids"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Status & Failover Inspection (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b pb-2.5 border-[#E2E8F0]">
              <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Financing Status
              </span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                {selectedInvoice?.financing_rail || "NONE"}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex justify-between items-center">
                <div>
                  <span className="text-[#64748B] block text-[11px]">Active Rail</span>
                  <span className="font-bold text-[#0F172A] text-sm">{selectedInvoice?.financing_rail || "NONE"}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px]">POD Legal Score</span>
                  <span className="font-bold text-emerald-700 text-sm">{selectedInvoice?.document_health_score}%</span>
                </div>
              </div>

              {selectedInvoice?.financing_rail === "RAIL_1_TREDS" && (
                <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      <span>7-Day Buyer Approval Window</span>
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    If buyer does not approve on TReDS within 7 days, system auto-fails over to Private NBFC Anchor Financing.
                  </p>
                  <button
                    onClick={handleForceFailover}
                    disabled={executing}
                    className="w-full py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Force Failover to Rail 2 NBFC
                  </button>
                </div>
              )}

              {selectedInvoice?.financing_rail === "RAIL_2_NBFC" && (
                <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/70 space-y-1">
                  <span className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Rail 2 Private NBFC Disbursed</span>
                  </span>
                  <p className="text-[11px] text-emerald-800">
                    Funded institutional-side on verified POD documents with non-recourse assumption.
                  </p>
                </div>
              )}
            </div>

            {/* Simulated Bids Table */}
            {bidData && (
              <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider block">
                  Financier Competitive Bids ({bidData.exchange})
                </span>

                <div className="space-y-1.5">
                  {bidData.bids.map((b, i) => (
                    <div key={i} className="p-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-[#0F172A]">{b.financier}</span>
                        <span className="text-[10px] text-emerald-700 block font-semibold">{b.status}</span>
                      </div>
                      <span className="font-mono font-bold text-blue-700 text-sm">{b.rate}% p.a.</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
