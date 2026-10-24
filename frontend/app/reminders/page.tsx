"use client";

import { useEffect, useState } from "react";
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
  ExternalLink
} from "lucide-react";

interface InvoiceItem {
  id: number;
  invoice_number: string;
  vendor_name: string;
  buyer_name: string;
  principal_amount: number;
  due_date: string;
  days_overdue: number;
}

interface TemplateItem {
  template_id: string;
  title: string;
  subject?: string;
  body?: string;
  text?: string;
}

interface ReminderPayload {
  invoice_number: string;
  buyer_name: string;
  principal_amount: number;
  corporate_tax_exposure: number;
  early_discount_savings: number;
  templates: {
    email_tax_advisory: TemplateItem;
    whatsapp_tax_advisory: TemplateItem;
    email_early_discount: TemplateItem;
    email_emi_offer: TemplateItem;
    whatsapp_erp_safeguard: TemplateItem;
  };
}

export default function RemindersPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [reminderData, setReminderData] = useState<ReminderPayload | null>(null);
  const [selectedTab, setSelectedTab] = useState<"EMAIL_TAX" | "WA_TAX" | "EMAIL_DISCOUNT" | "EMAIL_EMI" | "WA_ERP">("EMAIL_TAX");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function fetchInvoices() {
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
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (!selectedInvoiceId) return;
    async function fetchReminders() {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/reminders/generate/${selectedInvoiceId}`);
        if (res.ok) {
          const data = await res.json();
          setReminderData(data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchReminders();
  }, [selectedInvoiceId]);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDispatch = async (channel: string, templateId: string) => {
    if (!selectedInvoiceId) return;
    setSending(true);
    setDispatchStatus(null);

    try {
      const res = await fetch("http://localhost:8000/api/v1/reminders/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: selectedInvoiceId,
          channel: channel,
          template_id: templateId
        })
      });
      if (res.ok) {
        const json = await res.json();
        setDispatchStatus(json.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
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
        <p className="text-xs font-medium text-[#64748B]">Synthesizing diplomatic communication templates...</p>
      </div>
    );
  }

  const templates = reminderData?.templates;
  let activeTemplate: TemplateItem | undefined;
  let channel = "EMAIL";

  if (selectedTab === "EMAIL_TAX") {
    activeTemplate = templates?.email_tax_advisory;
    channel = "EMAIL";
  } else if (selectedTab === "WA_TAX") {
    activeTemplate = templates?.whatsapp_tax_advisory;
    channel = "WHATSAPP";
  } else if (selectedTab === "EMAIL_DISCOUNT") {
    activeTemplate = templates?.email_early_discount;
    channel = "EMAIL";
  } else if (selectedTab === "EMAIL_EMI") {
    activeTemplate = templates?.email_emi_offer;
    channel = "EMAIL";
  } else if (selectedTab === "WA_ERP") {
    activeTemplate = templates?.whatsapp_erp_safeguard;
    channel = "WHATSAPP";
  }

  const messageText = activeTemplate?.body || activeTemplate?.text || "";

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-[#0F172A]">
              Diplomatic Relationship-Preserving Reminders
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
              Audit-Centric &bull; Zero Hostility
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Generate polite, tax-focused notifications framed around corporate Section 43B(h) audit reconciliation, prompt cash credits, and flexible installment support.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#64748B] bg-[#F8FAFC] px-3 py-2 rounded-lg border border-[#E2E8F0]">
          <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
          <span>Zero legal threats &bull; Maximum commercial leverage</span>
        </div>
      </div>

      {dispatchStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{dispatchStatus}</span>
          </div>
          <button onClick={() => setDispatchStatus(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">&times;</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Account & Template Chooser */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-3">
            <h2 className="font-bold text-xs text-[#0F172A] uppercase tracking-wider">
              Select Corporate Account
            </h2>
            <select
              value={selectedInvoiceId || ""}
              onChange={(e) => setSelectedInvoiceId(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#0F172A] focus:outline-hidden focus:border-[#2563EB] focus:bg-white transition"
            >
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoice_number} &bull; {inv.buyer_name} ({formatINR(inv.principal_amount)})
                </option>
              ))}
            </select>

            {reminderData && (
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1.5 pt-2">
                <div className="flex justify-between text-[#64748B]">
                  <span>Sec 43B(h) Buyer Tax Exposure:</span>
                  <span className="font-bold text-amber-900 tabular-nums">{formatINR(reminderData.corporate_tax_exposure)}</span>
                </div>
                <div className="flex justify-between text-[#64748B]">
                  <span>2.5% Prompt Settlement Credit:</span>
                  <span className="font-bold text-[#16A34A] tabular-nums">-{formatINR(reminderData.early_discount_savings)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Template Selection Tabs */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-xs text-[#0F172A] uppercase tracking-wider">
              Diplomatic Template &amp; Channel
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => setSelectedTab("EMAIL_TAX")}
                className={`w-full text-left p-3 rounded-lg border text-xs transition flex items-center justify-between ${
                  selectedTab === "EMAIL_TAX"
                    ? "bg-blue-50/80 border-[#2563EB] text-[#0F172A]"
                    : "bg-[#F8FAFC] border-[#E2E8F0] text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#2563EB]" />
                  <div>
                    <div className="font-semibold text-xs text-[#0F172A]">Sec 43B(h) Audit Reconciliation</div>
                    <div className="text-[10px] text-[#64748B]">Corporate tax deduction preservation advisory</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedTab("WA_TAX")}
                className={`w-full text-left p-3 rounded-lg border text-xs transition flex items-center justify-between ${
                  selectedTab === "WA_TAX"
                    ? "bg-emerald-50/80 border-emerald-400 text-[#0F172A]"
                    : "bg-[#F8FAFC] border-[#E2E8F0] text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-[#16A34A]" />
                  <div>
                    <div className="font-semibold text-xs text-[#0F172A]">WhatsApp: Tax Compliance Alert</div>
                    <div className="text-[10px] text-[#64748B]">Concise, polite message with direct link</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedTab("EMAIL_DISCOUNT")}
                className={`w-full text-left p-3 rounded-lg border text-xs transition flex items-center justify-between ${
                  selectedTab === "EMAIL_DISCOUNT"
                    ? "bg-emerald-50/80 border-emerald-400 text-[#0F172A]"
                    : "bg-[#F8FAFC] border-[#E2E8F0] text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Coins className="w-4 h-4 text-[#16A34A]" />
                  <div>
                    <div className="font-semibold text-xs text-[#0F172A]">Prompt Cash Discount Incentive</div>
                    <div className="text-[10px] text-[#64748B]">2.5% immediate credit for clearance</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedTab("EMAIL_EMI")}
                className={`w-full text-left p-3 rounded-lg border text-xs transition flex items-center justify-between ${
                  selectedTab === "EMAIL_EMI"
                    ? "bg-purple-50/80 border-purple-400 text-[#0F172A]"
                    : "bg-[#F8FAFC] border-[#E2E8F0] text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Percent className="w-4 h-4 text-purple-700" />
                  <div>
                    <div className="font-semibold text-xs text-[#0F172A]">Structured Monthly Installment Offer</div>
                    <div className="text-[10px] text-[#64748B]">3-month EMI invitation to ease treasury</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedTab("WA_ERP")}
                className={`w-full text-left p-3 rounded-lg border text-xs transition flex items-center justify-between ${
                  selectedTab === "WA_ERP"
                    ? "bg-amber-50/80 border-amber-400 text-[#0F172A]"
                    : "bg-[#F8FAFC] border-[#E2E8F0] text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <div>
                    <div className="font-semibold text-xs text-[#0F172A]">WhatsApp: Automated ERP Hold Advisory</div>
                    <div className="text-[10px] text-[#64748B]">Framed as system policy, zero friction</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Message Preview & Dispatch */}
        <div className="lg:col-span-7">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">
                  Live Template Preview
                </span>
                <h3 className="font-bold text-[#0F172A] text-sm mt-0.5">{activeTemplate?.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(messageText)}
                  className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
                <button
                  onClick={() => handleDispatch(channel, activeTemplate?.template_id || "")}
                  disabled={sending}
                  className="px-3.5 py-1.5 rounded-lg bg-[#163A5F] hover:bg-[#102B47] text-xs font-semibold text-white flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sending ? "Sending..." : `Dispatch via ${channel}`}</span>
                </button>
              </div>
            </div>

            {/* Email Subject line */}
            {activeTemplate?.subject && (
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                <span className="text-[10px] text-[#64748B] uppercase font-bold block mb-0.5">Subject:</span>
                <span className="text-[#0F172A] font-semibold">{activeTemplate.subject}</span>
              </div>
            )}

            {/* Message Body */}
            <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed max-h-[440px] overflow-y-auto">
              {messageText}
            </div>

            <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span>
                100% Relationship Preservation: Contains zero aggressive litigation language or MSME Samadhaan court filing threats.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
