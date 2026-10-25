"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
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
  Layers,
  Zap,
  Info
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

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
    financing_rail?: string;
    financing_status?: string;
    deemed_acceptance?: {
      delivery_date: string;
      lock_deadline: string;
      days_elapsed: number;
      days_remaining: number;
      is_locked: boolean;
      lock_status: string;
      status_label: string;
      badge_color: string;
    };
    deemed_acceptance_clause?: string;
    acceptance_audit_log?: any;
  };
  vendor: {
    name: string;
    gstin: string;
    udyam_reg_number: string;
    category: string;
    major_activity?: string;
    sec_43bh_eligible?: boolean;
    contact_email: string;
  };
  buyer: {
    name: string;
    gstin: string;
    credit_limit: number;
    is_tax_loss?: boolean;
  };
  compliance: {
    days_overdue: number;
    primary_safeguard_mode: string;
    buyer_is_tax_loss: boolean;
    vendor_eligible_43bh: boolean;
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
    total_buyer_avoidable_loss: number;
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
    original_principal: number;
    discounted_principal: number;
    amount_per_installment: number;
    status: string;
    enach_mandate_status?: string;
    umrn?: string;
    mandate_auth_url?: string;
    sec25_liability_acknowledged?: boolean;
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
  const params = useParams();
  const token = params?.token as string;

  const [portalData, setPortalData] = useState<GuestPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [utrTouched, setUtrTouched] = useState(false);
  const [processing, setProcessing] = useState(false);

  const utrRegex = /^[A-Za-z0-9]{12,22}$/;
  const trimmedUtr = utrNumber.trim();
  const isUtrValid = utrRegex.test(trimmedUtr);
  const showUtrError = utrTouched && !isUtrValid;

  useEffect(() => {
    if (!token) return;
    async function fetchPortalData() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/guest/portal/${token}`);
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
    if (actionType === "SUBMIT_PAYMENT") {
      setUtrTouched(true);
      if (!isUtrValid) {
        return;
      }
    }
    setProcessing(true);
    setActionSuccess(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/guest/portal/${token}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          payment_reference: actionType === "SUBMIT_PAYMENT" ? trimmedUtr.toUpperCase() : "NEFT-CONFIRMED-PORTAL"
        })
      });
      const resJson = await res.json();
      if (res.ok) {
        setActionSuccess(resJson.message);
        const refetch = await fetch(`${API_BASE_URL}/api/v1/guest/portal/${token}`);
        if (refetch.ok) setPortalData(await refetch.json());
      } else {
        setError(resJson.detail || "Action failed to process");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to submit request");
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
  const isTaxLossBuyer = compliance.buyer_is_tax_loss;
  const isTraderVendor = !compliance.vendor_eligible_43bh;
  const isDeemedLocked = invoice.deemed_acceptance?.is_locked || invoice.status === "DEEMED_ACCEPTED";

  return (
    <div className="space-y-6">
      {/* 15-Day Deemed Acceptance Contractual Lock Banner */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isDeemedLocked 
          ? "bg-emerald-50 border-emerald-300 text-emerald-900"
          : "bg-blue-50 border-blue-300 text-blue-900"
      }`}>
        <div className="flex items-center gap-2.5">
          {isDeemedLocked ? (
            <Lock className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <Clock className="w-5 h-5 text-blue-600 shrink-0" />
          )}
          <div>
            <div className="font-bold text-xs uppercase tracking-wide flex items-center gap-2">
              <span>MSMED Act Sec 2(b) &bull; Statutory 15-Day Deemed Acceptance Status</span>
              <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full font-bold ${
                isDeemedLocked ? "bg-emerald-200 text-emerald-900" : "bg-blue-200 text-blue-900"
              }`}>
                {isDeemedLocked ? "CONTRACTUALLY LOCKED" : `${invoice.deemed_acceptance?.days_remaining || 0}d REMAINING`}
              </span>
            </div>
            <p className="text-[11px] mt-0.5 opacity-90">
              {isDeemedLocked 
                ? "Physical delivery was completed > 15 days ago with zero formal portal dispute. Goods and invoice are irrevocably deemed accepted under statutory commercial estoppel."
                : `Delivered on ${invoice.delivery_date}. Corporate quality review window active for ${invoice.deemed_acceptance?.days_remaining || 0} more days.`}
            </p>
          </div>
        </div>

        {invoice.acceptance_audit_log && (
          <span className="text-[10px] font-mono font-bold bg-white px-2.5 py-1 rounded border border-emerald-300 shrink-0 self-start sm:self-auto">
            SHA-256 SEAL VERIFIED
          </span>
        )}
      </div>

      {/* Dynamic Tax & Penal Interest Advisory Banner */}
      <div className={`rounded-xl border p-6 shadow-xs space-y-4 ${
        isTaxLossBuyer
          ? "border-purple-300 bg-purple-50/60"
          : isTraderVendor
          ? "border-blue-300 bg-blue-50/60"
          : "border-amber-300 bg-amber-50/60"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-current/20">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-white text-slate-800 flex items-center justify-center font-bold text-xs shadow-2xs">
              §
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {isTaxLossBuyer
                ? "Corporate Audit Advisory • MSMED Section 16 Non-Deductible Penal Interest"
                : isTraderVendor
                ? "Commercial Preservation Advisory • MSMED Section 16 Compound Penal Interest"
                : "Statutory Corporate Tax Advisory • Section 43B(h) Income Tax Act"}
            </span>
          </div>

          <span className="text-[11px] font-mono bg-white px-2.5 py-0.5 rounded-full text-slate-700 border border-current/20">
            MSME Udyam: {vendor.udyam_reg_number}
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

        {/* Financial Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {isTaxLossBuyer || isTraderVendor ? (
            <>
              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">
                  MSMED Statutory Rate
                </span>
                <div className="text-base font-bold text-[#0F172A] mt-0.5 tabular-nums">
                  {compliance.section_16_interest.statutory_rate_annual_percent}% p.a.
                </div>
                <span className="text-[10px] text-purple-900 font-semibold block mt-0.5">3x RBI Bank Rate</span>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">
                  Accrued Penal Compound Interest
                </span>
                <div className="text-base font-bold text-purple-900 mt-0.5 tabular-nums">
                  +{formatINR(compliance.section_16_interest.accrued_interest)}
                </div>
                <span className="text-[10px] text-red-600 font-bold block mt-0.5">Compounded Monthly</span>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">
                  Tax Deductibility (Sec 23)
                </span>
                <div className="text-base font-black text-red-700 mt-0.5">
                  NON-DEDUCTIBLE
                </div>
                <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Direct cash loss</span>
              </div>
            </>
          ) : (
            <>
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
                  Advance Tax Shortfall (Sec 234B/C)
                </span>
                <div className="text-base font-bold text-amber-900 mt-0.5 tabular-nums">
                  +{formatINR(compliance.section_43bh.estimated_advance_tax_interest)}
                </div>
                <span className="text-[10px] text-[#64748B] block mt-0.5">Quarterly Shortfall Penalty</span>
              </div>

              <div className="p-3 rounded-lg bg-white border border-amber-200">
                <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">
                  Avoidable Cash Outflow
                </span>
                <div className="text-base font-black text-amber-900 mt-0.5 tabular-nums">
                  {formatINR(compliance.section_43bh.total_tax_cash_penalty)}
                </div>
                <span className="text-[10px] text-[#16A34A] font-bold block mt-0.5">Preserved upon clearance</span>
              </div>
            </>
          )}
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
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-3">
          <h2 className="font-bold text-xs text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#2563EB]" />
            <span>Corporate Parties &amp; Verification</span>
          </h2>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] uppercase font-bold block">Billed Corporate Buyer</span>
              <div className="font-bold text-[#0F172A] text-sm mt-0.5 flex items-center gap-1.5">
                <span>{buyer.name}</span>
                {buyer.is_tax_loss && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-xs bg-purple-100 text-purple-900 font-bold">
                    TAX LOSS
                  </span>
                )}
              </div>
              <div className="text-[#64748B] mt-0.5">GSTIN: {buyer.gstin}</div>
            </div>

            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] uppercase font-bold block">Registered MSME Vendor</span>
              <div className="font-bold text-[#0F172A] text-sm mt-0.5">{vendor.name}</div>
              <div className="text-[#64748B] mt-0.5">GSTIN: {vendor.gstin} &bull; Category: {vendor.category} ({vendor.major_activity || "MANUFACTURING"})</div>
              <div className="text-[#16A34A] font-mono mt-0.5 font-semibold">Udyam No: {vendor.udyam_reg_number}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-xs text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#16A34A]" />
              <span>Invoice &amp; POD Health Dossier</span>
            </h2>
            <span className="text-xs font-mono font-bold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200">
              {invoice.document_health_score}% Audit Ready
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
              <span className="text-[10px] text-[#64748B] uppercase font-bold block">Delivery Date</span>
              <div className="font-bold text-[#0F172A] mt-0.5">{invoice.delivery_date}</div>
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
              invoice.status === "PAID" 
                ? "bg-emerald-50 text-[#16A34A] border border-emerald-200" 
                : isDeemedLocked
                ? "bg-emerald-50 text-emerald-900 border border-emerald-300"
                : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}>
              {invoice.status}
            </span>
          </div>
        </div>
      </div>

      {/* Resolution Actions Grid: 3 Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Option 1: 1-Click e-NACH Mandate Approval */}
        <div className="rounded-xl border border-emerald-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Option 1: e-NACH Auto-Debit
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-sm">
              Sec 25 PSSA
            </span>
          </div>

          {active_emi_plan ? (
            <div className="space-y-3">
              <p className="text-xs text-[#64748B]">
                Approve {active_emi_plan.total_installments} structured installments of <strong>{formatINR(active_emi_plan.amount_per_installment)}</strong> via automated e-NACH clearing:
              </p>

              <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">UMRN Identifier:</span>
                  <span className="font-mono font-bold text-slate-800">{active_emi_plan.umrn || "UMRN-NPCI-GEN"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Mandate Status:</span>
                  <span className="font-bold text-emerald-700">{active_emi_plan.enach_mandate_status || "REGISTERED"}</span>
                </div>
              </div>

              {active_emi_plan.enach_mandate_status !== "ACTIVE" ? (
                <button
                  onClick={() => handleAction("AUTHORIZE_ENACH")}
                  disabled={processing}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{processing ? "Authorizing..." : "1-Click Authorize e-NACH Mandate"}</span>
                </button>
              ) : (
                <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs text-center border border-emerald-300">
                  ✓ e-NACH Mandate Authorized &amp; Active
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-[#64748B]">
              No active EMI plan generated for this invoice.
            </div>
          )}
        </div>

        {/* Option 2: Dual-Rail TReDS Approval */}
        <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" /> Option 2: TReDS Factor Approval
            </span>
            <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-sm">
              Rail 1
            </span>
          </div>

          <p className="text-xs text-[#64748B]">
            Approve invoice on TReDS (RXIL/M1xchange). The institutional banking pool instantly funds the MSME while your company clears on standard 60-day credit terms:
          </p>

          <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-[#64748B]">Exchange Auction Rate:</span>
              <span className="font-bold text-blue-700">~8.1% p.a.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Supplier Disbursal:</span>
              <span className="font-bold text-emerald-700">Within 24 Hours</span>
            </div>
          </div>

          {invoice.financing_status !== "RAIL_1_APPROVED_DISBURSED" && invoice.status !== "DISCOUNTED_TREDS" ? (
            <button
              onClick={() => handleAction("APPROVE_TREDS")}
              disabled={processing}
              className="w-full py-2.5 rounded-lg bg-[#163A5F] hover:bg-[#102B47] text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
            >
              {processing ? "Approving..." : "Approve on TReDS (Avert NBFC Failover)"}
            </button>
          ) : (
            <div className="p-2.5 rounded-lg bg-blue-100 text-blue-900 font-bold text-xs text-center border border-blue-300">
              ✓ Approved &amp; Disbursed on TReDS
            </div>
          )}
        </div>

        {/* Option 3: Prompt Settlement with Cash Discount */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wide flex items-center gap-1.5">
              <Coins className="w-4 h-4" /> Option 3: Instant Remittance
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-sm border border-emerald-200">
              Save {early_discount_offer.discount_percent}%
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1 text-xs">
            <div className="flex justify-between text-[#64748B]">
              <span>Principal:</span>
              <span className="text-[#0F172A] tabular-nums">{formatINR(invoice.balance_due)}</span>
            </div>
            <div className="flex justify-between text-[#16A34A]">
              <span>Prompt Credit:</span>
              <span className="tabular-nums">-{formatINR(early_discount_offer.discount_amount)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[#0F172A] pt-1 border-t border-[#E2E8F0]">
              <span>Net Remittance:</span>
              <span className="text-[#16A34A] tabular-nums">{formatINR(early_discount_offer.net_payable)}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div>
              <label htmlFor="utr-input" className="block text-[11px] font-bold text-[#64748B] mb-1">
                NEFT / RTGS / UTR Reference Number
              </label>
              <input
                id="utr-input"
                type="text"
                placeholder="e.g. CMS123456789012"
                maxLength={22}
                value={utrNumber}
                onChange={(e) => {
                  setUtrNumber(e.target.value);
                  if (!utrTouched) setUtrTouched(true);
                }}
                onBlur={() => setUtrTouched(true)}
                className={`w-full px-3 py-2 rounded-lg border text-xs font-mono tracking-wide transition uppercase ${
                  showUtrError
                    ? "border-red-400 bg-red-50/40 text-red-900 focus:outline-none focus:ring-1 focus:ring-red-400"
                    : isUtrValid
                    ? "border-emerald-400 bg-emerald-50/40 text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    : "border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] focus:outline-none focus:border-blue-400"
                }`}
              />
              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                {showUtrError ? (
                  <p className="text-red-600 flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                    <span>Please enter a valid 12–22 character UTR/NEFT/RTGS number</span>
                  </p>
                ) : isUtrValid ? (
                  <p className="text-emerald-700 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    <span>Valid banking reference ({trimmedUtr.length} chars)</span>
                  </p>
                ) : (
                  <span className="text-[10px] text-[#64748B]">
                    12–22 alphanumeric characters required
                  </span>
                )}
                <span className={`text-[10px] font-mono ml-auto ${
                  isUtrValid 
                    ? "text-emerald-700 font-bold" 
                    : trimmedUtr.length > 0 
                    ? "text-amber-700" 
                    : "text-[#94A3B8]"
                }`}>
                  {trimmedUtr.length}/22
                </span>
              </div>
            </div>

            <button
              id="confirm-remittance-button"
              onClick={() => handleAction("SUBMIT_PAYMENT")}
              disabled={processing || !isUtrValid}
              className="w-full py-2.5 rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <Coins className="w-4 h-4" />
              <span>{processing ? "Confirming Remittance..." : "Confirm Remittance Advice"}</span>
            </button>
          </div>
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
