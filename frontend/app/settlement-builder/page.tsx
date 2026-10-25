"use client";

import { useEffect, useState } from "react";
import { 
  Handshake, 
  Coins, 
  Percent, 
  PackageCheck, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Clock, 
  ShieldCheck, 
  Building2, 
  Lock,
  AlertTriangle,
  ExternalLink,
  Copy,
  Zap
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";

interface InvoiceItem {
  id: number;
  invoice_number: string;
  vendor_name: string;
  buyer_name: string;
  principal_amount: number;
  paid_amount: number;
  due_date: string;
  status: string;
  days_overdue: number;
}

interface LinkedOrderItem {
  id: number;
  po_number: string;
  vendor_name: string;
  buyer_name: string;
  item_description: string;
  total_units: number;
  units_released: number;
  unreleased_units: number;
}

interface ScheduleItem {
  id: number;
  installment_number: number;
  due_date: string;
  amount: number;
  status: string;
  paid_date: string | null;
  payment_reference: string | null;
  enach_execution_status?: string;
  units_to_release: number;
  units_released_flag: boolean;
}

interface EMIPlanItem {
  id: number;
  invoice_id: number;
  invoice_number: string;
  vendor_name: string;
  buyer_name: string;
  total_installments: number;
  cash_discount_percent: number;
  original_principal: number;
  discounted_principal: number;
  amount_per_installment: number;
  status: string;
  notes: string;
  enach_mandate_status?: string;
  umrn?: string;
  mandate_auth_url?: string;
  sec25_liability_acknowledged?: boolean;
  schedules: ScheduleItem[];
}

export default function SettlementBuilderPage() {
  const { company } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [orders, setOrders] = useState<LinkedOrderItem[]>([]);
  const [activePlans, setActivePlans] = useState<EMIPlanItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Builder form state
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [installments, setInstallments] = useState<number>(3);
  const [cashDiscount, setCashDiscount] = useState<number>(3.0);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [bankName, setBankName] = useState<string>("HDFC Bank Corporate Treasury");
  const [accountLast4, setAccountLast4] = useState<string>("4109");
  
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [createdMandateInfo, setCreatedMandateInfo] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (company?.bank_name) {
      setBankName(company.bank_name);
    }
    if (company?.bank_account_number) {
      setAccountLast4(company.bank_account_number.slice(-4));
    }
  }, [company]);

  useEffect(() => {
    fetchInitialData();
  }, [company?.id]);

  async function fetchInitialData() {
    try {
      const vendorParam = company?.id ? `?vendor_id=${company.id}` : "";
      const [invRes, ordRes, planRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/invoices${vendorParam}`),
        fetch(`${API_BASE_URL}/api/v1/safeguards/orders${vendorParam}`),
        fetch(`${API_BASE_URL}/api/v1/settlements/plans${vendorParam}`)
      ]);

      if (invRes.ok && ordRes.ok && planRes.ok) {
        const invData = await invRes.json();
        const ordData = await ordRes.json();
        const planData = await planRes.json();
        setInvoices(invData);
        setOrders(ordData);
        setActivePlans(planData);
        if (invData.length > 0) {
          setSelectedInvoiceId(invData[0].id);
        } else {
          setSelectedInvoiceId(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId);
  const principal = selectedInvoice?.principal_amount || 0;
  const discountAmount = principal * (cashDiscount / 100.0);
  const discountedPrincipal = principal - discountAmount;
  const amountPerInstallment = roundToTwo(discountedPrincipal / installments);

  function roundToTwo(num: number) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) return;

    setSubmitting(true);
    setActionSuccess(null);
    setCreatedMandateInfo(null);

    try {
      const payload = {
        invoice_id: selectedInvoiceId,
        total_installments: installments,
        cash_discount_percent: cashDiscount,
        linked_order_id: selectedOrderId,
        notes: notes || undefined,
        enable_enach: true,
        bank_name: bankName,
        account_last4: accountLast4
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/settlements/create-emi-enach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setActionSuccess(`EMI Plan created successfully with e-NACH Mandate ${data.umrn}!`);
        setCreatedMandateInfo(data);
        await fetchInitialData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayInstallment = async (scheduleId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/settlements/pay-installment/${scheduleId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_reference: `CMS/ACH/${Date.now().toString().slice(-6)}`
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActionSuccess(data.message);
        await fetchInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestDebitHit = async (scheduleId: number, simulateBounce: boolean = false) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/settlements/enach/trigger-debit/${scheduleId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulate_bounce: simulateBounce })
      });
      if (res.ok) {
        const data = await res.json();
        setActionSuccess(data.message + (simulateBounce ? " - Section 25 Statutory Default Registered!" : ""));
        await fetchInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#163A5F] border-t-transparent animate-spin" />
        <p className="text-xs font-medium text-[#64748B]">Loading settlement configurations &amp; e-NACH mandate protocols...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
              Settlement &amp; EMI Builder
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              e-NACH Protected
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Convert overdue receivables into 2–4 installments with prompt cash discounts and automated bank debits.
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 cursor-pointer">&times;</button>
        </div>
      )}

      {/* Main Builder & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Config Form (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <form onSubmit={handleCreatePlan} className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4">
            <div className="border-b border-[#E2E8F0] pb-2.5">
              <h2 className="font-bold text-xs text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                <Coins className="w-4 h-4 text-blue-600" />
                <span>Configure Installment Schedule</span>
              </h2>
            </div>

            {/* Select Overdue Invoice */}
            <div>
              <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                Target Overdue Invoice
              </label>
              <select
                value={selectedInvoiceId || ""}
                onChange={(e) => setSelectedInvoiceId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:outline-hidden focus:border-blue-600 font-medium"
              >
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number} · {inv.buyer_name} · {formatINR(inv.principal_amount)} ({inv.days_overdue}d overdue)
                  </option>
                ))}
              </select>
            </div>

            {/* Installments & Cash Discount Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-[#0F172A]">
                  <span>Number of EMIs</span>
                  <span className="font-bold text-blue-700 px-2 py-0.5 rounded bg-blue-100">{installments} Months</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="4"
                  step="1"
                  value={installments}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                  className="w-full accent-[#0F172A]"
                />
              </div>

              <div className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-[#0F172A]">
                  <span>Prompt Cash Discount</span>
                  <span className="font-bold text-emerald-800 px-2 py-0.5 rounded bg-emerald-100">{cashDiscount}% Off</span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="5.0"
                  step="0.5"
                  value={cashDiscount}
                  onChange={(e) => setCashDiscount(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>
            </div>

            {/* e-NACH Bank Auto-Debit Configuration */}
            <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>e-NACH Auto-Debit Protection (Sec 25 PSSA)</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900">
                  Auto-Enforced
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="text-[11px] text-emerald-900 font-semibold block mb-1">Buyer Clearing Bank</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white text-xs font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-emerald-900 font-semibold block mb-1">A/C Number (Last 4)</label>
                  <input
                    type="text"
                    value={accountLast4}
                    onChange={(e) => setAccountLast4(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white text-xs font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Link to Open Purchase Order for Pro-Rata Release */}
            <div>
              <label className="text-xs font-semibold text-[#0F172A] block mb-1 flex items-center gap-1.5">
                <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Link to Purchase Order (Pro-Rata Release)</span>
              </label>
              <select
                value={selectedOrderId || ""}
                onChange={(e) => setSelectedOrderId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:outline-hidden"
              >
                <option value="">-- Financial Settlement Only --</option>
                {orders.map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    {ord.po_number} · {ord.item_description} ({ord.unreleased_units} unreleased units)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{submitting ? "Creating Plan & Mandate..." : "Create EMI Plan & Issue e-NACH Link"}</span>
            </button>
          </form>

          {/* Newly Generated Mandate Info Box */}
          {createdMandateInfo && (
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-blue-600" /> e-NACH Mandate Link Ready
                </span>
                <span className="font-mono text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full font-bold">
                  {createdMandateInfo.umrn}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`http://localhost:3000${createdMandateInfo.mandate_auth_url}`}
                  className="flex-1 px-2.5 py-1 text-xs rounded border border-blue-300 bg-white font-mono text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`http://localhost:3000${createdMandateInfo.mandate_auth_url}`);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Preview Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-3.5 sticky top-6">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
              <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Settlement Preview
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {cashDiscount}% Discount
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-[#64748B]">
                <span>Original Principal:</span>
                <span className="font-bold text-[#0F172A] tabular-nums">{formatINR(principal)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Prompt Cash Savings:</span>
                <span className="font-bold tabular-nums">-{formatINR(discountAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#0F172A] pt-2 border-t border-[#E2E8F0]">
                <span>Settlement Total:</span>
                <span className="text-blue-700 tabular-nums">{formatINR(discountedPrincipal)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-700 pt-1">
                <span>Per Monthly EMI:</span>
                <span className="font-mono text-emerald-800 text-sm tabular-nums">{formatINR(amountPerInstallment)} / mo</span>
              </div>
            </div>

            {/* Projected EMI Schedules */}
            <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                {installments}-Month Installment Timeline
              </span>

              <div className="space-y-1.5">
                {Array.from({ length: installments }).map((_, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#0F172A]">EMI #{idx + 1}</span>
                      <span className="text-[10px] text-[#64748B] block">Month +{idx + 1}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-blue-700 tabular-nums">{formatINR(amountPerInstallment)}</span>
                      <span className="text-[10px] text-emerald-700 block font-semibold flex items-center gap-1 justify-end">
                        <ShieldCheck className="w-2.5 h-2.5" /> e-NACH
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px]">
              <strong>Section 25 PSSA Safeguard:</strong> Unpaid e-NACH debits carry statutory bank bounce liability.
            </div>
          </div>
        </div>
      </div>

      {/* Existing Active EMI Plans Table */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div>
            <h2 className="font-bold text-xs text-[#0F172A] uppercase tracking-wider">
              Active Structured Plans &amp; e-NACH Executions
            </h2>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Track cleared installments and auto-debit executions
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {activePlans.length} Active Plans
          </span>
        </div>

        <div className="divide-y divide-[#E2E8F0]">
          {activePlans.map((plan) => (
            <div key={plan.id} className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#0F172A]">{plan.invoice_number}</span>
                    <span className="text-xs text-[#64748B]">&bull; {plan.buyer_name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-900">
                      {plan.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5 flex items-center gap-2">
                    <span>Discounted Principal: <strong className="text-slate-900">{formatINR(plan.discounted_principal)}</strong></span>
                    <span>&bull;</span>
                    <span>e-NACH Mandate: <strong className="font-mono text-emerald-800">{plan.umrn || "UMRN-REGISTERED"}</strong></span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-[#2563EB]">
                    {formatINR(plan.amount_per_installment)} / installment
                  </span>
                </div>
              </div>

              {/* Installment Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {plan.schedules.map((sch) => (
                  <div key={sch.id} className="p-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs flex flex-col justify-between gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#0F172A]">EMI #{sch.installment_number}</span>
                      <span className={`font-semibold text-[10px] px-1.5 py-0.2 rounded ${
                        sch.status === "PAID" 
                          ? "bg-emerald-100 text-emerald-900" 
                          : "bg-amber-100 text-amber-900"
                      }`}>
                        {sch.status}
                      </span>
                    </div>

                    <div className="font-bold text-slate-900 tabular-nums">{formatINR(sch.amount)}</div>
                    <div className="text-[10px] text-[#64748B]">Due: {sch.due_date}</div>

                    {sch.units_to_release > 0 && (
                      <div className="text-[10px] text-[#16A34A] font-semibold">
                        {sch.units_released_flag ? "✓ Units Dispatched" : `Unlocks ${sch.units_to_release} units`}
                      </div>
                    )}

                    {sch.status !== "PAID" && (
                      <div className="pt-1 flex gap-1">
                        <button
                          onClick={() => handleTestDebitHit(sch.id, false)}
                          className="flex-1 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition"
                          title="Simulate successful e-NACH auto-debit"
                        >
                          Auto-Debit Hit
                        </button>
                        <button
                          onClick={() => handleTestDebitHit(sch.id, true)}
                          className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] transition"
                          title="Simulate bounced mandate under Sec 25 PSSA"
                        >
                          Test Bounce
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
