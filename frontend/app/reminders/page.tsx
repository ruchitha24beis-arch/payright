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
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";

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
  const { company } = useAuth();
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
        const vendorParam = company?.id ? `?vendor_id=${company.id}` : "";
        const res = await fetch(`${API_BASE_URL}/api/v1/invoices${vendorParam}`);
        if (res.ok) {
          const data = await res.json();
          setInvoices(data);
          if (data.length > 0) {
            setSelectedInvoiceId(data[0].id);
          } else {
            setSelectedInvoiceId(null);
            setReminderData(null);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, [company?.id]);

  useEffect(() => {
    if (!selectedInvoiceId) return;
    async function fetchReminders() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/reminders/generate/${selectedInvoiceId}`);
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
      const res = await fetch(`${API_BASE_URL}/api/v1/reminders/send`, {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
              Diplomatic Reminders
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Audit-Centric
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Audit-friendly payment notices and structured settlement proposals.
          </p>
        </div>
      </div>

      {dispatchStatus && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{dispatchStatus}</span>
          </div>
          <button onClick={() => setDispatchStatus(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 cursor-pointer">&times;</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Account & Template Chooser */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs space-y-2.5">
            <h2 className="font-bold text-xs text-[#0F172A] uppercase tracking-wider">
              Select Account
            </h2>
            <select
              value={selectedInvoiceId || ""}
              onChange={(e) => setSelectedInvoiceId(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#0F172A] focus:outline-hidden focus:border-blue-600 focus:bg-white transition"
            >
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoice_number} · {inv.buyer_name} ({formatINR(inv.principal_amount)})
                </option>
              ))}
            </select>

            {reminderData && (
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1">
                <div className="flex justify-between text-[#64748B]">
                  <span>Sec 43B(h) Tax Exposure:</span>
                  <span className="font-bold text-amber-900 tabular-nums">{formatINR(reminderData.corporate_tax_exposure)}</span>
                </div>
                <div className="flex justify-between text-[#64748B]">
                  <span>Prompt Cash Savings:</span>
                  <span className="font-bold text-emerald-700 tabular-nums">-{formatINR(reminderData.early_discount_savings)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Template Selection Tabs */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs space-y-2.5">
            <h3 className="font-bold text-xs text-[#0F172A] uppercase tracking-wider">
              Select Template
            </h3>

            <div className="space-y-1.5">
              <button
                onClick={() => setSelectedTab("EMAIL_TAX")}
                className={`w-full text-left p-2.5 rounded-lg border text-xs transition cursor-pointer flex items-center justify-between ${
                  selectedTab === "EMAIL_TAX"
                    ? "bg-blue-50/80 border-blue-600 text-[#0F172A]"
                    : "bg-[#F8FAFC] border-[#E2E8F0] text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-semibold text-xs text-[#0F172A]">Sec 43B(h) Audit Notice</div>
                    <div className="text-[10px] text-[#64748B]">Year-end corporate tax deduction alert</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedTab("WA_TAX")}
                className={`w-full text-left p-2.5 rounded-lg border text-xs transition cursor-pointer flex items-center justify-between ${
                  selectedTab === "WA_TAX"
                    ? "bg-emerald-50/80 border-emerald-500 text-[#0F172A]"
                    : "bg-[#F8FAFC] border-[#E2E8F0] text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-xs text-[#0F172A]">WhatsApp: Tax Compliance Alert</div>
                    <div className="text-[10px] text-[#64748B]">Concise message with direct settlement link</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedTab("EMAIL_DISCOUNT")}
                className={`w-full text-left p-2.5 rounded-lg border text-xs transition cursor-pointer flex items-center justify-between ${
                  selectedTab === "EMAIL_DISCOUNT"
                    ? "bg-emerald-50/80 border-emerald-500 text-[#0F172A]"
                    : "bg-[#F8FAFC] border-[#E2E8F0] text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-xs text-[#0F172A]">Prompt Cash Discount Offer</div>
                    <div className="text-[10px] text-[#64748B]">2.5% immediate credit for clearance</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedTab("EMAIL_EMI")}
                className={`w-full text-left p-2.5 rounded-lg border text-xs transition cursor-pointer flex items-center justify-between ${
                  selectedTab === "EMAIL_EMI"
                    ? "bg-purple-50/80 border-purple-500 text-[#0F172A]"
                    : "bg-[#F8FAFC] border-[#E2E8F0] text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-purple-700" />
                  <div>
                    <div className="font-semibold text-xs text-[#0F172A]">Structured Installment Proposal</div>
                    <div className="text-[10px] text-[#64748B]">3-month EMI invitation to ease cash flow</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedTab("WA_ERP")}
                className={`w-full text-left p-2.5 rounded-lg border text-xs transition cursor-pointer flex items-center justify-between ${
                  selectedTab === "WA_ERP"
                    ? "bg-amber-50/80 border-amber-500 text-[#0F172A]"
                    : "bg-[#F8FAFC] border-[#E2E8F0] text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <div>
                    <div className="font-semibold text-xs text-[#0F172A]">WhatsApp: ERP Hold Advisory</div>
                    <div className="text-[10px] text-[#64748B]">Automated policy notice without confrontation</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Message Preview & Dispatch */}
        <div className="lg:col-span-7">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
              <div>
                <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">
                  Template Preview
                </span>
                <h3 className="font-bold text-[#0F172A] text-sm mt-0.5">{activeTemplate?.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(messageText)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1 transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
                <button
                  onClick={() => handleDispatch(channel, activeTemplate?.template_id || "")}
                  disabled={sending}
                  className="px-3.5 py-1.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-xs font-semibold text-white flex items-center gap-1.5 shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sending ? "Sending..." : `Dispatch (${channel})`}</span>
                </button>
              </div>
            </div>

            {/* Email Subject line */}
            {activeTemplate?.subject && (
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                <span className="text-[10px] text-[#64748B] uppercase font-bold block mb-0.5">Subject:</span>
                <span className="text-[#0F172A] font-medium">{activeTemplate.subject}</span>
              </div>
            )}

            {/* Message Body */}
            <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
              {messageText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
