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
  Check
} from "lucide-react";

interface InvoiceItem {
  id: number;
  invoice_number: string;
  vendor_name: string;
  buyer_name: string;
  principal_amount: number;
  status: string;
  document_health_score: number;
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

export default function TReDSFactoringPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [selectedExchange, setSelectedExchange] = useState<string>("RXIL");
  const [bidData, setBidData] = useState<BidResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingBids, setFetchingBids] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  useEffect(() => {
    async function loadInvoices() {
      try {
        const res = await fetch("http://localhost:8000/api/v1/invoices");
        if (res.ok) {
          const data = await res.json();
          setInvoices(data);
          if (data.length > 0) {
            setSelectedInvoiceId(data[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadInvoices();
  }, []);

  const handleFetchBids = async () => {
    if (!selectedInvoiceId) return;
    setFetchingBids(true);
    setSuccessResult(null);

    try {
      const res = await fetch("http://localhost:8000/api/v1/treds/bids", {
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

  const handleExecuteDiscount = async () => {
    if (!selectedInvoiceId) return;
    setExecuting(true);

    try {
      const res = await fetch("http://localhost:8000/api/v1/treds/discount-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: selectedInvoiceId,
          exchange_code: selectedExchange,
          selected_rate: bidData?.annual_discount_rate_percent || 8.1
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessResult(data);
        const invRes = await fetch("http://localhost:8000/api/v1/invoices");
        if (invRes.ok) {
          setInvoices(await invRes.json());
        }
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
        <p className="text-xs font-medium text-[#64748B]">Connecting to RBI TReDS exchange gateways...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-[#0F172A]">
              Silent TReDS Bill Discounting Bridge
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
              RBI Approved Exchanges
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Discount verified corporate receivables Institutional-Side at ~8% p.a. without buyer tension. Receive working capital in 24 hours with zero recourse.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#64748B] bg-[#F8FAFC] px-3 py-2 rounded-lg border border-[#E2E8F0]">
          <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
          <span>Non-Recourse Factoring &bull; Zero Buyer Conflict</span>
        </div>
      </div>

      {successResult && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-[#16A34A] font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>Silent TReDS Bill Factoring Executed Successfully</span>
          </div>
          <p className="text-xs text-slate-700">
            {successResult.commercial_preservation_benefit}
          </p>
          <div className="text-[11px] font-mono text-emerald-800 font-semibold pt-1">
            Transaction UTR: {successResult.transaction_reference} &bull; Net Disbursal: {formatINR(successResult.net_credited_amount)}
          </div>
        </div>
      )}

      {/* Grid: Exchange Selector & Bids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Setup & Exchange Selector */}
        <div className="lg:col-span-5 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
            <Coins className="w-4 h-4 text-purple-700" />
            <span>Select Invoice &amp; Exchange</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                Select Invoice to Factor
              </label>
              <select
                value={selectedInvoiceId || ""}
                onChange={(e) => {
                  setSelectedInvoiceId(Number(e.target.value));
                  setBidData(null);
                }}
                className="w-full px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#0F172A] focus:outline-hidden focus:border-[#2563EB] focus:bg-white transition"
              >
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number} &bull; {inv.buyer_name} &bull; {formatINR(inv.principal_amount)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                TReDS Exchange Platform
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
                    className={`p-3 rounded-lg border text-left transition ${
                      selectedExchange === exch.code
                        ? "bg-purple-50 border-purple-300 text-purple-950 font-semibold"
                        : "bg-[#F8FAFC] border-[#E2E8F0] text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="font-bold text-xs">{exch.name}</div>
                    <div className="text-[10px] text-purple-700 font-mono mt-0.5">{exch.rate} avg</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleFetchBids}
              disabled={fetchingBids}
              className="w-full py-2.5 rounded-lg bg-[#163A5F] hover:bg-[#102B47] font-semibold text-xs text-white shadow-xs transition disabled:opacity-50"
            >
              {fetchingBids ? "Polling Exchange Orderbook..." : "Request Institutional Bids"}
            </button>

            <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B] space-y-1">
              <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Why Silent TReDS Factoring?</span>
              </span>
              <p className="leading-relaxed">
                Because the buyer is an approved corporate with verified credit, institutional financiers bid to buy the accepted bill directly. You receive immediate cash in 24 hours without any awkward collection calls.
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Bids Breakdown */}
        <div className="lg:col-span-7">
          {bidData ? (
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div>
                  <span className="text-[10px] font-mono text-purple-700 uppercase font-bold tracking-wider">
                    Bid Reference: {bidData.bid_id}
                  </span>
                  <h2 className="font-bold text-[#0F172A] text-base mt-0.5">{bidData.exchange}</h2>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#64748B]">Institutional Rate</span>
                  <div className="text-lg font-black text-[#16A34A] tabular-nums">
                    {bidData.annual_discount_rate_percent}% p.a.
                  </div>
                </div>
              </div>

              {/* Financial Calculation Strip */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
                <div>
                  <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">
                    Face Value
                  </span>
                  <span className="text-sm sm:text-base font-bold text-[#0F172A] mt-1 block tabular-nums">
                    {formatINR(bidData.principal_amount)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-800 uppercase font-bold tracking-wider block">
                    Discount Charge (60D)
                  </span>
                  <span className="text-sm sm:text-base font-bold text-amber-800 mt-1 block tabular-nums">
                    -{formatINR(bidData.discount_charge)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#16A34A] uppercase font-bold tracking-wider block">
                    24-Hr Net Disbursal
                  </span>
                  <span className="text-sm sm:text-base font-bold text-[#16A34A] mt-1 block tabular-nums">
                    {formatINR(bidData.net_immediate_disbursal)}
                  </span>
                </div>
              </div>

              {/* Live Bank Bidders List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block">
                  Live Institutional Bidders
                </span>
                {bidData.bids.map((b, i) => (
                  <div key={i} className="p-3 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-between text-xs hover:bg-[#F8FAFC] transition">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-purple-700" />
                      <span className="font-semibold text-[#0F172A]">{b.financier}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[#0F172A] font-bold">{b.rate.toFixed(2)}% p.a.</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleExecuteDiscount}
                disabled={executing}
                className="w-full py-2.5 rounded-lg bg-[#163A5F] hover:bg-[#102B47] font-semibold text-xs text-white shadow-xs transition disabled:opacity-50"
              >
                {executing ? "Processing Exchange Settlement..." : "Accept Best Bid & Disburse Within 24 Hours"}
              </button>
            </div>
          ) : (
            <div className="p-10 rounded-xl border border-dashed border-[#E2E8F0] bg-white text-center space-y-2">
              <Coins className="w-8 h-8 text-slate-300 mx-auto" />
              <h2 className="font-semibold text-[#0F172A] text-xs">No Active Exchange Session</h2>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                Select an invoice on the left and click &apos;Request Institutional Bids&apos; to view quotes from RXIL, M1xchange, and Invoicemart.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
