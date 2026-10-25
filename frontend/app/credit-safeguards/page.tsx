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
  ArrowRight,
  Plus
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import CreateBuyerModal from "@/components/CreateBuyerModal";

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
  const { company } = useAuth();
  const [evaluations, setEvaluations] = useState<BuyerEvaluation[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [createBuyerOpen, setCreateBuyerOpen] = useState(false);

  async function loadData() {
    try {
      const vendorParam = company?.id ? `?vendor_id=${company.id}` : "";
      const res = await fetch(`${API_BASE_URL}/api/v1/safeguards/buyers-evaluation${vendorParam}`);
      if (res.ok) {
        const data = await res.json();
        setEvaluations(data);
        if (data.length > 0) {
          setSelectedBuyer(data[0]);
        } else {
          setSelectedBuyer(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [company?.id]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
              Credit Limit Safeguards
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Policy-Enforced
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time exposure monitoring and automated ERP shipment holds.
          </p>
        </div>

        <button
          onClick={() => setCreateBuyerOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>+ Add Corporate Buyer</span>
        </button>
      </div>

      {/* Corporate Buyer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {evaluations.map((buyer) => (
          <div
            key={buyer.buyer_id}
            onClick={() => setSelectedBuyer(buyer)}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              selectedBuyer?.buyer_id === buyer.buyer_id
                ? "bg-white border-[#0F172A] ring-1 ring-[#0F172A] shadow-xs"
                : "bg-white border-[#E2E8F0] hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
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
            <div className="text-[11px] text-[#64748B]">GSTIN: {buyer.gstin}</div>

            {/* Meter Progress */}
            <div className="mt-3 space-y-1">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    buyer.utilization_pct > 100 ? "bg-red-600" :
                    buyer.utilization_pct > 80 ? "bg-amber-500" : "bg-emerald-600"
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
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
            <div>
              <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block">
                Buyer Profile
              </span>
              <h2 className="text-base font-bold text-[#0F172A] mt-0.5">{selectedBuyer.buyer_name}</h2>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-[#64748B] block">Excess Beyond Cap</span>
              <div className="text-base font-bold text-red-700 tabular-nums">
                {selectedBuyer.excess_amount > 0 ? formatINR(selectedBuyer.excess_amount) : "₹0 (Compliant)"}
              </div>
            </div>
          </div>

          {/* 4 Financial Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">Credit Limit</span>
              <div className="text-sm font-bold text-[#0F172A] mt-0.5 tabular-nums">{formatINR(selectedBuyer.credit_limit)}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">Outstanding</span>
              <div className="text-sm font-bold text-[#0F172A] mt-0.5 tabular-nums">{formatINR(selectedBuyer.current_outstanding)}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">Pending Orders</span>
              <div className="text-sm font-bold text-blue-700 mt-0.5 tabular-nums">{formatINR(selectedBuyer.pending_order_value)}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">Headroom</span>
              <div className="text-sm font-bold text-emerald-700 mt-0.5 tabular-nums">{formatINR(selectedBuyer.available_headroom)}</div>
            </div>
          </div>

          {/* Diplomatic Hold Advisory Notice */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                <span>Diplomatic Hold Notice</span>
              </h3>
              <button
                onClick={() => handleCopy(selectedBuyer.diplomatic_explanation)}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
              {selectedBuyer.diplomatic_explanation}
            </div>
          </div>
        </div>
      )}

      {/* Create Buyer Modal */}
      <CreateBuyerModal
        isOpen={createBuyerOpen}
        onClose={() => setCreateBuyerOpen(false)}
        onCreated={loadData}
      />
    </div>
  );
}
