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
  Sparkles,
  Layers,
  Clock,
  ShieldCheck,
  Building2,
  FileText
} from "lucide-react";

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
  schedules: ScheduleItem[];
}

export default function SettlementBuilderPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [orders, setOrders] = useState<LinkedOrderItem[]>([]);
  const [activePlans, setActivePlans] = useState<EMIPlanItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Builder form state
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [installments, setInstallments] = useState<number>(3);
  const [cashDiscount, setCashDiscount] = useState<number>(2.5);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      const [invRes, ordRes, planRes] = await Promise.all([
        fetch("http://localhost:8000/api/v1/invoices"),
        fetch("http://localhost:8000/api/v1/safeguards/orders"),
        fetch("http://localhost:8000/api/v1/settlements/plans")
      ]);

      if (invRes.ok && ordRes.ok && planRes.ok) {
        const invData = await invRes.json();
        const ordData = await ordRes.json();
        const planData = await planRes.json();

        setInvoices(invData);
        setOrders(ordData);
        setActivePlans(planData);

        if (invData.length > 0 && selectedInvoiceId === null) {
          setSelectedInvoiceId(invData[0].id);
        }
        if (ordData.length > 0 && selectedOrderId === null) {
          setSelectedOrderId(ordData[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId);
  const principal = selectedInvoice?.principal_amount || 0;
  const discountAmount = principal * (cashDiscount / 100.0);
  const discountedPrincipal = principal - discountAmount;
  const amountPerInstallment = installments > 0 ? discountedPrincipal / installments : 0;

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);
  const unitsPerInstallment = selectedOrder && installments > 0
    ? Math.floor(selectedOrder.unreleased_units / installments)
    : 0;

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) return;

    setSubmitting(true);
    setActionSuccess(null);

    try {
      const res = await fetch("http://localhost:8000/api/v1/settlements/create-emi-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: selectedInvoiceId,
          total_installments: installments,
          cash_discount_percent: cashDiscount,
          linked_order_id: selectedOrderId,
          notes: notes || `Commercial Preservation Agreement: ${installments}-month EMI with ${cashDiscount}% prompt discount.`
        })
      });

      if (res.ok) {
        setActionSuccess("EMI Settlement Agreement formulated successfully!");
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
      const res = await fetch(`http://localhost:8000/api/v1/settlements/pay-installment/${scheduleId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_reference: `RTGS/CMS/${Date.now().toString().slice(-6)}`,
          paid_date: new Date().toISOString().split("T")[0]
        })
      });

      if (res.ok) {
        const resData = await res.json();
        setActionSuccess(`Installment cleared! ${resData.milestone_units_released_now} units released to buyer.`);
        await fetchInitialData();
      }
    } catch (err) {
      console.error(err);
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
        <p className="text-xs font-medium text-[#64748B]">Loading settlement parameters &amp; active schedules...</p>
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
              Interactive Settlement &amp; Pro-Rata EMI Builder
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Commercial Preservation
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Bridge corporate buyer cashflow constraints by structuring overdue bills into 2–4 EMIs, offering early prompt cash credits, and unlocking subsequent shipments pro-rata per payment.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#64748B] bg-[#F8FAFC] px-3 py-2 rounded-lg border border-[#E2E8F0]">
          <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
          <span>Keeps buyer factory lines running without taking bad debt write-offs</span>
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

      {/* Main Grid: Builder Form & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Builder Form */}
        <div className="lg:col-span-5 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
            <Handshake className="w-4 h-4 text-[#2563EB]" />
            <span>Configure Settlement Structure</span>
          </h2>

          <form onSubmit={handleCreatePlan} className="space-y-4">
            {/* Choose Invoice */}
            <div>
              <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                Select Overdue Invoice
              </label>
              <select
                value={selectedInvoiceId || ""}
                onChange={(e) => setSelectedInvoiceId(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#0F172A] focus:outline-hidden focus:border-[#2563EB] focus:bg-white transition"
              >
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number} &bull; {inv.buyer_name} &bull; {formatINR(inv.principal_amount)}
                  </option>
                ))}
              </select>
            </div>

            {/* Installments Selector */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#0F172A] mb-1.5">
                <span>Number of Installments (EMIs)</span>
                <span className="text-[#2563EB] font-bold">{installments} Monthly Payments</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[2, 3, 4].map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setInstallments(n)}
                    className={`py-2 rounded-lg text-xs font-bold transition border ${
                      installments === n
                        ? "bg-[#163A5F] text-white border-[#163A5F] shadow-xs"
                        : "bg-[#F8FAFC] text-slate-700 border-[#E2E8F0] hover:bg-slate-100"
                    }`}
                  >
                    {n} EMIs
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Discount Incentive Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#0F172A] mb-1.5">
                <span>Prompt Settlement Cash Discount</span>
                <span className="text-[#16A34A] font-bold">{cashDiscount.toFixed(1)}% Credit</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="5.0"
                step="0.5"
                value={cashDiscount}
                onChange={(e) => setCashDiscount(parseFloat(e.target.value))}
                className="w-full accent-[#2563EB] bg-slate-200 rounded-lg cursor-pointer h-2"
              />
              <div className="flex justify-between text-[10px] text-[#64748B] mt-1">
                <span>0% (Standard)</span>
                <span>2.5% (Recommended)</span>
                <span>5.0% (Fast Clear)</span>
              </div>
            </div>

            {/* Linked Open Order for Pro-Rata Milestones */}
            <div>
              <label className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5 mb-1">
                <PackageCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Link Open Order for Milestone Shipment Releases</span>
              </label>
              <select
                value={selectedOrderId || ""}
                onChange={(e) => setSelectedOrderId(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#0F172A] focus:outline-hidden focus:border-[#2563EB] focus:bg-white transition"
              >
                <option value="">No linked shipment lock</option>
                {orders.map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    {ord.po_number}: {ord.item_description} ({ord.unreleased_units} units held)
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-[#64748B] mt-1">
                Pro-rata release: <strong>{unitsPerInstallment} units</strong> automatically cleared per EMI installment payment.
              </p>
            </div>

            {/* Custom Notes */}
            <div>
              <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                Commercial Note for Buyer Finance Team
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Structured across Q3 corporate treasury cycle"
                className="w-full px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#0F172A] focus:outline-hidden focus:border-[#2563EB] focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-[#163A5F] hover:bg-[#102B47] font-semibold text-xs text-white shadow-xs transition disabled:opacity-50"
            >
              {submitting ? "Formulating Agreement..." : "Formulate & Send EMI Agreement"}
            </button>
          </form>
        </div>

        {/* Right Col: Live Schedule Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Live Structured Schedule Preview</span>
              </h2>
              <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {cashDiscount}% Instant Discount
              </span>
            </div>

            {/* Financial Summary Strip */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
              <div>
                <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">
                  Original Principal
                </span>
                <span className="text-sm sm:text-base font-bold text-[#0F172A] mt-1 block tabular-nums">
                  {formatINR(principal)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#16A34A] uppercase font-bold tracking-wider block">
                  Prompt Discount
                </span>
                <span className="text-sm sm:text-base font-bold text-[#16A34A] mt-1 block tabular-nums">
                  -{formatINR(discountAmount)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#2563EB] uppercase font-bold tracking-wider block">
                  Net Payable
                </span>
                <span className="text-sm sm:text-base font-bold text-[#2563EB] mt-1 block tabular-nums">
                  {formatINR(discountedPrincipal)}
                </span>
              </div>
            </div>

            {/* Pro-Rata Milestones Table */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block">
                Pro-Rata Milestone Breakdown
              </span>

              {Array.from({ length: installments }).map((_, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-between hover:bg-[#F8FAFC] transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563EB] font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#0F172A]">
                        Installment {idx + 1}
                      </div>
                      <div className="text-[10px] text-[#64748B] flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Due in {(idx + 1) * 30} days
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    {unitsPerInstallment > 0 && (
                      <div className="text-left hidden sm:block">
                        <div className="text-[11px] font-bold text-[#16A34A] flex items-center gap-1">
                          <PackageCheck className="w-3.5 h-3.5" /> +{unitsPerInstallment} Units
                        </div>
                        <div className="text-[9px] text-[#64748B]">Unlocks on payment</div>
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-[#0F172A] tabular-nums">
                        {formatINR(amountPerInstallment)}
                      </div>
                      <div className="text-[10px] text-[#64748B]">30-day rest</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Preservation Strategy Callout */}
            <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950">
              <strong className="block mb-0.5 text-emerald-900">Commercial Relationship Preservation:</strong>
              This structure frames shipment hold releases as standard ERP milestone management, giving corporate accounts payable time to clear dues without operational stoppage or friction.
            </div>
          </div>
        </div>
      </div>

      {/* Active Plans Console with Live Simulated Installment Clearance */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2563EB]" />
            <span>Active EMI Agreements &amp; Pro-Rata Release Fulfillment</span>
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time tracking of active corporate buyer installment schedules. Record payments below to simulate milestone goods releases.
          </p>
        </div>

        <div className="space-y-4">
          {activePlans.length === 0 ? (
            <div className="p-8 text-center text-slate-500 border border-dashed border-[#E2E8F0] rounded-xl">
              <Handshake className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No active EMI agreements yet</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Configure and save a plan using the builder form above.</p>
            </div>
          ) : (
            activePlans.map((plan) => (
              <div key={plan.id} className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#0F172A]">{plan.invoice_number}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-blue-50 text-[#2563EB] border border-blue-200">
                        {plan.status}
                      </span>
                      <span className="text-[10px] text-[#16A34A] font-semibold bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200">
                        {plan.cash_discount_percent}% Discount Applied
                      </span>
                    </div>
                    <div className="text-xs text-[#64748B] mt-1">
                      Corporate Buyer: <strong className="text-[#0F172A]">{plan.buyer_name}</strong> &bull; Total Settled: {formatINR(plan.discounted_principal)}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-[#64748B] block">Monthly Installment</span>
                    <span className="text-sm font-bold text-[#0F172A] tabular-nums">{formatINR(plan.amount_per_installment)}</span>
                  </div>
                </div>

                {/* Installments Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {plan.schedules.map((sch) => (
                    <div
                      key={sch.id}
                      className={`p-3 rounded-lg border bg-white transition ${
                        sch.status === "PAID"
                          ? "border-emerald-300 bg-emerald-50/30"
                          : "border-[#E2E8F0]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-[#64748B]">
                          EMI #{sch.installment_number}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                          sch.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {sch.status}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-[#0F172A] tabular-nums">{formatINR(sch.amount)}</div>
                      <div className="text-[10px] text-[#64748B] mt-0.5">Due: {sch.due_date}</div>

                      {sch.units_to_release > 0 && (
                        <div className="mt-2 pt-2 border-t border-[#E2E8F0] text-[10px] flex items-center justify-between">
                          <span className="text-[#64748B]">Shipment Batch:</span>
                          <span className={`font-bold ${sch.units_released_flag ? "text-[#16A34A]" : "text-amber-800"}`}>
                            {sch.units_released_flag ? "✓ Released" : `Locked (${sch.units_to_release} u)`}
                          </span>
                        </div>
                      )}

                      {sch.status !== "PAID" && (
                        <button
                          onClick={() => handlePayInstallment(sch.id)}
                          className="mt-2.5 w-full py-1 rounded-md bg-[#16A34A] hover:bg-emerald-700 text-white font-semibold text-[11px] transition shadow-xs"
                        >
                          Record Payment &amp; Release
                        </button>
                      )}

                      {sch.status === "PAID" && sch.payment_reference && (
                        <div className="mt-2 text-[9px] text-slate-500 font-mono truncate">
                          Ref: {sch.payment_reference}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
