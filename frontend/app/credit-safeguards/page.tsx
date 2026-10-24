"use client";

import { useEffect, useState } from "react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Building2, 
  Copy, 
  Check, 
  Package, 
  TrendingUp, 
  Percent,
  CheckCircle2,
  Lock,
  ArrowRight
} from "lucide-react";

interface BuyerEvaluation {
  buyer_id: number;
  buyer_name: string;
  gstin: string;
  credit_limit: number;
  current_outstanding: number;
  pending_order_value: number;
  utilization_pct: number;
  projected_utilization_pct: number;
  status: "BREACHED" | "NEAR_LIMIT_WARNING" | "HEALTHY";
  operational_status: string;
  risk_level: string;
  excess_amount: number;
  available_headroom: number;
  advisory_title: string;
  diplomatic_explanation: string;
}

export default function CreditSafeguardsPage() {
  const [evaluations, setEvaluations] = useState<BuyerEvaluation[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("http://localhost:8000/api/v1/safeguards/buyers-evaluation");
        if (res.ok) {
          const data = await res.json();
          setEvaluations(data);
          if (data.length > 0) {
            setSelectedBuyer(data[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <p className="text-xs font-medium text-[#64748B]">Auditing corporate buyer credit limits &amp; ERP policies...</p>
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
              Automated Credit Safeguards &amp; ERP Hold Advisories
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Audit-Enforced Policy
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Eliminate personal confrontation between sales reps and corporate buyers by enforcing algorithmic shipment holds framed as automated internal audit controls.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#64748B] bg-[#F8FAFC] px-3 py-2 rounded-lg border border-[#E2E8F0]">
          <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
          <span>Shields commercial relationships behind system policies</span>
        </div>
      </div>

      {/* Corporate Buyer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {evaluations.map((buyer) => (
          <div
            key={buyer.buyer_id}
            onClick={() => setSelectedBuyer(buyer)}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              selectedBuyer?.buyer_id === buyer.buyer_id
                ? "bg-white border-[#2563EB] ring-2 ring-blue-500/10 shadow-xs"
                : "bg-white border-[#E2E8F0] hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                buyer.status === "BREACHED"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : buyer.status === "NEAR_LIMIT_WARNING"
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
              }`}>
                {buyer.operational_status}
              </span>
              <span className="font-mono text-xs font-bold text-[#0F172A]">
                {buyer.utilization_pct}% Limit
              </span>
            </div>

            <h2 className="font-bold text-sm text-[#0F172A] truncate">{buyer.buyer_name}</h2>
            <div className="text-[11px] text-[#64748B] mt-0.5">GSTIN: {buyer.gstin}</div>

            {/* Meter Progress */}
            <div className="mt-3.5 space-y-1">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    buyer.utilization_pct > 100 ? "bg-[#DC2626]" :
                    buyer.utilization_pct > 80 ? "bg-amber-500" : "bg-[#16A34A]"
                  }`}
                  style={{ width: `${Math.min(100, buyer.utilization_pct)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#64748B] pt-0.5 tabular-nums">
                <span>Dues: {formatINR(buyer.current_outstanding)}</span>
                <span>Cap: {formatINR(buyer.credit_limit)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Buyer Safeguard Detail Panel */}
      {selectedBuyer && (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
            <div>
              <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block">
                Corporate Exposure Profile
              </span>
              <h2 className="text-base font-bold text-[#0F172A] mt-0.5">{selectedBuyer.buyer_name}</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#64748B] block">Excess Beyond Cap</span>
              <div className="text-lg font-bold text-red-700 tabular-nums">
                {selectedBuyer.excess_amount > 0 ? formatINR(selectedBuyer.excess_amount) : "₹0 (Compliant)"}
              </div>
            </div>
          </div>

          {/* 4 Financial Metric Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">Credit Limit</span>
              <div className="text-sm sm:text-base font-bold text-[#0F172A] mt-1 tabular-nums">{formatINR(selectedBuyer.credit_limit)}</div>
            </div>
            <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">Current Outstanding</span>
              <div className="text-sm sm:text-base font-bold text-[#0F172A] mt-1 tabular-nums">{formatINR(selectedBuyer.current_outstanding)}</div>
            </div>
            <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">Pending Orders Value</span>
              <div className="text-sm sm:text-base font-bold text-[#2563EB] mt-1 tabular-nums">{formatINR(selectedBuyer.pending_order_value)}</div>
            </div>
            <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">Available Headroom</span>
              <div className="text-sm sm:text-base font-bold text-[#16A34A] mt-1 tabular-nums">{formatINR(selectedBuyer.available_headroom)}</div>
            </div>
          </div>

          {/* Diplomatic Hold Advisory Notice */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                <span>Auto-Generated Diplomatic ERP Hold Advisory</span>
              </h3>
              <button
                onClick={() => handleCopy(selectedBuyer.diplomatic_explanation)}
                className="text-xs text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 font-semibold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy Template"}</span>
              </button>
            </div>

            <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
              {selectedBuyer.diplomatic_explanation}
            </div>

            <p className="text-[11px] text-[#64748B] italic">
              Notice: Framing the hold as an automated ERP system parameter protects the relationship between your account managers and buyer procurement.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
