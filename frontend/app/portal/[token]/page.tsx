"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import { 
  ShieldCheck, 
  AlertTriangle, 
  FileCheck2, 
  Handshake, 
  Coins, 
  Calendar, 
  CheckCircle2, 
  Building2, 
  Clock, 
  ArrowRight,
  ExternalLink,
  Lock,
  Download,
  ReceiptText
} from "lucide-react";

interface GuestPortalData {
  portal_token: string;
  invoice: {
    id: number;
    invoice_number: string;
    principal_amount: number;
    paid_amount: number;
    balance_due: number;
    invoice_date: string;
    due_date: string;
    delivery_date: string;
    status: string;
    po_number: string;
    goods_description: string;
    document_health_score: number;
    po_file_url: string | null;
    pod_file_url: string | null;
  };
  vendor: {
    name: string;
    gstin: string;
    udyam_reg_number: string;
    category: string;
    contact_email: string;
  };
  buyer: {
    name: string;
    gstin: string;
    credit_limit: number;
  };
  compliance: {
    days_overdue: number;
    section_43bh: {
      principal_at_risk: number;
      direct_tax_deduction_loss: number;
      estimated_advance_tax_interest: number;
      total_tax_cash_penalty: number;
      explanation: string;
    };
    section_16_interest: {
      days_overdue: number;
      statutory_rate_annual_percent: number;
      accrued_interest: number;
      total_with_interest: number;
      statutory_note: string;
    };
    tax_banner_headline: string;
    tax_banner_subtext: string;
  };
  early_discount_offer: {
    discount_percent: number;
    discount_amount: number;
    net_payable: number;
    expiry_days: number;
  };
  active_emi_plan: {
    id: number;
    total_installments: number;
    cash_discount_percent: number;
    discounted_principal: number;
    amount_per_installment: number;
    status: string;
    schedules: Array<{
      installment_number: number;
      due_date: string;
      amount: number;
      status: string;
      units_to_release: number;
    }>;
  } | null;
}

function PortalContent() {
  const routeParams = useParams();
  const token = (routeParams?.token as string) || "";

  const [portalData, setPortalData] = useState<GuestPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) return;
    async function fetchPortalData() {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/guest/portal/${token}`);
        if (!res.ok) {
          throw new Error("Invalid or expired portal token");
        }
        const data = await res.json();
        setPortalData(data);
      } catch (err: any) {
        setError(err.message || "Failed to load portal view");
      } finally {
        setLoading(false);
      }
    }
    fetchPortalData();
  }, [token]);

  const handleAction = async (actionType: string) => {
    setProcessing(true);
    setActionSuccess(null);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/guest/portal/${token}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          payment_reference: utrNumber || "NEFT-CONFIRMED-PORTAL"
        })
      });
      if (res.ok) {
        const resJson = await res.json();
        setActionSuccess(resJson.message);
        const refetch = await fetch(`http://localhost:8000/api/v1/guest/portal/${token}`);
        if (refetch.ok) setPortalData(await refetch.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
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
        <p className="text-xs font-medium text-[#64748B]">Verifying corporate guest settlement token...</p>
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-xl bg-white border border-[#E2E8F0] text-center space-y-3 shadow-xs">
        <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto" />
        <h2 className="text-base font-bold text-[#0F172A]">Portal Access Link Expired or Invalid</h2>
        <p className="text-xs text-[#64748B]">
          Please contact the vendor accounts receivable desk for an updated corporate reconciliation link.
        </p>
      </div>
    );
  }

  const { invoice, vendor, buyer, compliance, early_discount_offer, active_emi_plan } = portalData;

  return (
    <div className="space-y-6">
      {/* Top Banner: Section 43B(h) Audit Reconciliation Notice */}
      <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
              §
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Statutory Corporate Tax Advisory &bull; Section 43B(h) Income Tax Act
            </span>
          </div>
          <span className="text-[11px] font-mono bg-white px-2.5 py-0.5 rounded-full text-slate-700 border border-amber-200">
            MSME Supplier Udyam: {vendor.udyam_reg_number}
          </span>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] leading-tight">
            {compliance.tax_banner_headline}
          </h1>
          <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed">
            {compliance.tax_banner_subtext}
          </p>
        </div>

        {/* Corporate Tax Impact Figures */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-lg bg-white border border-amber-200">
            <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">
              Disallowed Expense Deduction
            </span>
            <div className="text-base font-bold text-[#0F172A] mt-0.5 tabular-nums">
              {formatINR(compliance.section_43bh.direct_tax_deduction_loss)}
            </div>
            <span className="text-[10px] text-amber-900 font-semibold block mt-0.5">30% Corporate Tax Impact</span>
          </div>

          <div className="p-3 rounded-lg bg-white border border-amber-200">
            <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">
              Advance Tax Interest (Sec 234B/C)
            </span>
            <div className="text-base font-bold text-amber-900 mt-0.5 tabular-nums">
              +{formatINR(compliance.section_43bh.estimated_advance_tax_interest)}
            </div>
            <span className="text-[10px] text-[#64748B] block mt-0.5">Quarterly Shortfall Impact</span>
          </div>

          <div className="p-3 rounded-lg bg-white border border-amber-200">
            <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">
              Total Avoidable Cash Outflow
            </span>
            <div className="text-base font-black text-amber-900 mt-0.5 tabular-nums">
              {formatINR(compliance.section_43bh.total_tax_cash_penalty)}
            </div>
            <span className="text-[10px] text-[#16A34A] font-bold block mt-0.5">Saved upon clearance</span>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">&times;</button>
        </div>
      )}

      {/* Invoice Particulars & Parties */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Parties Card */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-3">
          <h2 className="font-bold text-xs text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#2563EB]" />
            <span>Corporate Parties &amp; Ledger Verification</span>
          </h2>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] uppercase font-bold block">Billed Corporate Buyer</span>
              <div className="font-bold text-[#0F172A] text-sm mt-0.5">{buyer.name}</div>
              <div className="text-[#64748B] mt-0.5">GSTIN: {buyer.gstin}</div>
            </div>

            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] uppercase font-bold block">Registered MSME Vendor</span>
              <div className="font-bold text-[#0F172A] text-sm mt-0.5">{vendor.name}</div>
              <div className="text-[#64748B] mt-0.5">GSTIN: {vendor.gstin} &bull; Category: {vendor.category} Enterprise</div>
              <div className="text-[#16A34A] font-mono mt-0.5 font-semibold">Udyam No: {vendor.udyam_reg_number}</div>
            </div>
          </div>
        </div>

        {/* Invoice Summary Card */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-xs text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#16A34A]" />
              <span>Invoice Particulars &amp; POD Health</span>
            </h2>
            <span className="text-xs font-mono font-bold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200">
              {invoice.document_health_score}% Doc Health
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] uppercase font-bold block">Invoice Number</span>
              <div className="font-bold text-[#0F172A] mt-0.5">{invoice.invoice_number}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] uppercase font-bold block">PO Reference</span>
              <div className="font-bold text-[#0F172A] mt-0.5">{invoice.po_number || "Verified PO"}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] uppercase font-bold block">Invoice Date</span>
              <div className="font-bold text-[#0F172A] mt-0.5">{invoice.invoice_date}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] uppercase font-bold block">Agreed Due Date</span>
              <div className="font-bold text-amber-900 mt-0.5">{invoice.due_date} ({compliance.days_overdue}d past)</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs">
            <div>
              <span className="text-[#64748B]">Current Outstanding Balance:</span>
              <div className="text-lg font-bold text-[#0F172A] tabular-nums">{formatINR(invoice.balance_due)}</div>
            </div>
            <span className={`px-2 py-0.5 rounded-sm text-xs font-bold ${
              invoice.status === "PAID" ? "bg-emerald-50 text-[#16A34A] border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}>
              {invoice.status}
            </span>
          </div>
        </div>
      </div>

      {/* Resolution Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option A: Prompt Settlement Credit */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wide flex items-center gap-1.5">
              <Coins className="w-4 h-4" /> Option A: Prompt Settlement Credit
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-sm border border-emerald-200">
              Save {early_discount_offer.discount_percent}%
            </span>
          </div>

          <p className="text-xs text-[#64748B]">
            Clear invoice now to deduct an immediate <strong className="text-[#16A34A] font-semibold">{formatINR(early_discount_offer.discount_amount)}</strong> prompt payment credit:
          </p>

          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 text-xs">
            <div className="flex justify-between text-[#64748B]">
              <span>Standard Principal</span>
              <span className="text-[#0F172A] tabular-nums">{formatINR(invoice.balance_due)}</span>
            </div>
            <div className="flex justify-between text-[#16A34A]">
              <span>Prompt Settlement Credit</span>
              <span className="tabular-nums">-{formatINR(early_discount_offer.discount_amount)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[#0F172A] pt-2 border-t border-[#E2E8F0]">
              <span>Net Remittance Amount</span>
              <span className="text-[#16A34A] tabular-nums">{formatINR(early_discount_offer.net_payable)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Enter NEFT / RTGS / UTR Reference Number"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#0F172A] focus:outline-hidden focus:border-[#2563EB] focus:bg-white transition"
            />
            <button
              onClick={() => handleAction("SUBMIT_PAYMENT")}
              disabled={processing}
              className="w-full py-2 rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50"
            >
              {processing ? "Processing..." : "Confirm Remittance & Claim Discount"}
            </button>
          </div>
        </div>

        {/* Option B: Structured EMI Installment Plan */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wide flex items-center gap-1.5">
              <Handshake className="w-4 h-4" /> Option B: Structured Installment Schedule
            </span>
            <span className="text-[10px] bg-blue-50 text-[#2563EB] font-bold px-2 py-0.5 rounded-sm border border-blue-200">
              Treasury Preserving
            </span>
          </div>

          {active_emi_plan ? (
            <div className="space-y-3">
              <p className="text-xs text-[#64748B]">
                A structured {active_emi_plan.total_installments}-month installment schedule is ready for corporate approval:
              </p>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {active_emi_plan.schedules.map((sch) => (
                  <div key={sch.installment_number} className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#0F172A]">EMI #{sch.installment_number}</span>
                      <span className="text-[10px] text-[#64748B] block">Due: {sch.due_date}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#2563EB] tabular-nums">{formatINR(sch.amount)}</span>
                      <span className={`text-[10px] block font-semibold ${sch.status === "PAID" ? "text-[#16A34A]" : "text-amber-800"}`}>
                        {sch.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {active_emi_plan.status !== "ACCEPTED" && active_emi_plan.status !== "COMPLETED" && (
                <button
                  onClick={() => handleAction("ACCEPT_EMI")}
                  disabled={processing}
                  className="w-full py-2 rounded-lg bg-[#163A5F] hover:bg-[#102B47] text-white font-semibold text-xs shadow-xs transition disabled:opacity-50"
                >
                  {processing ? "Confirming..." : "Approve Installment Schedule"}
                </button>
              )}

              {active_emi_plan.status === "ACCEPTED" && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold text-center">
                  ✓ Installment Plan Accepted &amp; Active
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-center space-y-1.5">
              <Clock className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-700 font-semibold">No active EMI plan generated yet</p>
              <p className="text-[11px] text-[#64748B]">
                Contact vendor finance desk or choose Option A to settle directly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GuestPortalPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#163A5F] border-t-transparent animate-spin" />
        <p className="text-xs font-medium text-[#64748B]">Loading corporate reconciliation portal...</p>
      </div>
    }>
      <PortalContent />
    </Suspense>
  );
}
