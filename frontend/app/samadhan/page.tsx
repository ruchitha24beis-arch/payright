"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Scale, 
  ShieldCheck, 
  FileText, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Lock, 
  Building2, 
  Copy, 
  Check, 
  Sparkles,
  Info,
  Calendar,
  Layers,
  ChevronRight,
  Gavel
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";

interface EligibleInvoice {
  invoice_id: number;
  invoice_number: string;
  vendor_id: number;
  vendor_name: string;
  vendor_udyam: string;
  buyer_id: number;
  buyer_name: string;
  buyer_gstin: string;
  principal_amount: number;
  paid_amount: number;
  balance_due: number;
  invoice_date: string;
  due_date: string;
  delivery_date: string;
  days_since_delivery: number;
  is_over_45_days: boolean;
  pod_health_score: number;
  is_deemed_accepted: boolean;
  accrued_sec16_interest: number;
  total_statutory_claim: number;
  is_eligible: boolean;
  status: string;
  po_number: string;
}

interface DossierResponse {
  success: boolean;
  dossier_id: number;
  dossier_number: string;
  filing_status: string;
  pdf_download_url: string;
  total_principal: number;
  total_interest: number;
  total_claim_amount: number;
  form_1_data: any;
  official_portal_url: string;
  checklist: Array<{
    step: number;
    portal_field: string;
    action: string;
    value: string;
  }>;
}

export default function SamadhanHubPage() {
  const { company } = useAuth();
  const [invoices, setInvoices] = useState<EligibleInvoice[]>([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dossierResult, setDossierResult] = useState<DossierResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedData, setCopiedData] = useState(false);

  useEffect(() => {
    async function loadEligibleInvoices() {
      try {
        const vendorId = company?.id || 1;
        const res = await fetch(`${API_BASE_URL}/api/v1/samadhan/eligible-invoices?vendor_id=${vendorId}`);
        if (res.ok) {
          const data = await res.json();
          const eligible = data.eligible_invoices || [];
          setInvoices(eligible);
          // By default, select all eligible invoices
          setSelectedInvoiceIds(eligible.map((i: EligibleInvoice) => i.invoice_id));
        }
      } catch (err) {
        console.error("Failed to load MSEFC eligible invoices:", err);
      } finally {
        setLoading(false);
      }
    }
    loadEligibleInvoices();
  }, [company?.id]);

  const selectedInvoices = invoices.filter(i => selectedInvoiceIds.includes(i.invoice_id));
  const totalPrincipal = selectedInvoices.reduce((sum, i) => sum + i.balance_due, 0);
  const totalInterest = selectedInvoices.reduce((sum, i) => sum + i.accrued_sec16_interest, 0);
  const totalStatutoryClaim = totalPrincipal + totalInterest;

  const toggleInvoice = (id: number) => {
    setSelectedInvoiceIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedInvoiceIds.length === invoices.length) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(invoices.map(i => i.invoice_id));
    }
  };

  const handleGenerateDossier = async () => {
    if (selectedInvoiceIds.length === 0) return;
    setGenerating(true);
    setError(null);
    try {
      const vendorId = company?.id || 1;
      const res = await fetch(`${API_BASE_URL}/api/v1/samadhan/generate-claim-dossier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendorId,
          invoice_ids: selectedInvoiceIds,
          representative_name: company?.contact_person || "Rajesh Sharma",
          remarks: "Pre-litigation conciliation claim generated via Chanakya Governance Engine"
        })
      });
      const data = await res.json();
      if (res.ok) {
        setDossierResult(data);
      } else {
        setError(data.detail || "Failed to generate claim dossier");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to generate claim dossier");
    } finally {
      setGenerating(false);
    }
  };

  const copyChecklistToClipboard = () => {
    if (!dossierResult) return;
    const text = `MSME SAMADHAN FORM-1 FILING DATA:
Dossier: ${dossierResult.dossier_number}
Vendor Udyam: ${company?.udyam_reg_number || "UDYAM-MH-01-0012345"}
Principal Claim: INR ${dossierResult.total_principal.toFixed(2)}
Section 16 Penal Interest (3x RBI Bank Rate): INR ${dossierResult.total_interest.toFixed(2)}
Total MSEFC Claim: INR ${dossierResult.total_claim_amount.toFixed(2)}
Invoices: ${selectedInvoices.map(i => i.invoice_number).join(", ")}`;
    
    navigator.clipboard.writeText(text);
    setCopiedData(true);
    setTimeout(() => setCopiedData(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Statutory Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Scale className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight">
                  MSME Samadhan Statutory Escalation Hub
                </h1>
                <span className="text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  MSEFC Pre-Litigation Conciliation
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Direct statutory escalation under Section 18 of the MSMED Act 2006. Automatically filters invoices delivered &gt;45 days ago with contractually locked Proof of Delivery (POD) and calculates statutory compound interest at 3x the RBI Bank Rate.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <a
              href="https://samadhaan.msme.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-2"
            >
              <span>samadhaan.msme.gov.in</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleGenerateDossier}
              disabled={generating || selectedInvoiceIds.length === 0}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Gavel className="w-4 h-4" />
              <span>{generating ? "Generating Court Dossier..." : "1-Click Claim Dossier Generator"}</span>
            </button>
          </div>
        </div>

        {/* Live Aggregated Claim Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Eligible Invoices (&gt;45d)
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {selectedInvoices.length} <span className="text-xs font-normal text-slate-400">of {invoices.length}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Passed 15-day deemed acceptance
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Unpaid Principal Balance
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              ₹{totalPrincipal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Delivered commercial supplies
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Accrued Sec 16 Interest
            </div>
            <div className="text-2xl font-bold text-rose-400 mt-1">
              ₹{totalInterest.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] text-rose-400/80 mt-0.5">
              3x RBI Bank Rate compounded monthly
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Total MSEFC Claim Value
            </div>
            <div className="text-2xl font-bold text-amber-400 mt-1">
              ₹{totalStatutoryClaim.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] text-amber-400/80 mt-0.5">
              Statutory demand amount
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Generated Court Dossier Modal / Banner */}
      {dossierResult && (
        <div className="bg-white rounded-2xl border-2 border-amber-500 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Statutory Form-1 Application Dossier Prepared</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Dossier Number: <span className="font-mono text-amber-600">{dossierResult.dossier_number}</span>
              </h2>
              <p className="text-xs text-slate-600">
                Total Statutory Claim: <span className="font-bold text-slate-900">₹{dossierResult.total_claim_amount.toLocaleString("en-IN")}</span> (Principal: ₹{dossierResult.total_principal.toLocaleString("en-IN")} + Sec 16 Interest: ₹{dossierResult.total_interest.toLocaleString("en-IN")})
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`${API_BASE_URL}${dossierResult.pdf_download_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 transition shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download Court-Ready PDF</span>
              </a>

              <button
                onClick={copyChecklistToClipboard}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-2 transition border border-slate-300"
              >
                {copiedData ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedData ? "Copied Filing Metrics!" : "Copy Portal Fields"}</span>
              </button>

              <a
                href={dossierResult.official_portal_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-sm"
              >
                <span>Open samadhaan.msme.gov.in</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Step-by-Step Filing Checklist Mapped to samadhaan.msme.gov.in */}
          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Step-by-Step Government Portal Submission Mapping:</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {dossierResult.checklist.map((c) => (
                <div key={c.step} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="font-bold text-slate-900 mb-1">
                    Step {c.step}: {c.portal_field}
                  </div>
                  <div className="text-slate-600 text-[11px] mb-1.5">{c.action}</div>
                  <div className="font-mono text-[11px] font-semibold text-indigo-700 bg-white p-1.5 rounded border border-slate-200 truncate">
                    {c.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Eligible Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="font-bold text-sm text-slate-900">
              Eligible Invoices for MSEFC Statutory Filing
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Filtered by Section 15 threshold (&gt;45 days from delivery date) with deemed acceptance lock
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              {selectedInvoiceIds.length} of {invoices.length} selected
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={selectedInvoiceIds.length === invoices.length && invoices.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Corporate Buyer</th>
                <th className="py-3 px-4">Delivery Date &amp; Aging</th>
                <th className="py-3 px-4">Acceptance Lock</th>
                <th className="py-3 px-4 text-right">Principal Unpaid</th>
                <th className="py-3 px-4 text-right">Sec 16 Interest</th>
                <th className="py-3 px-4 text-right">Total Claim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Scanning commercial receivables for MSMED Act Section 15 compliance...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    No invoices currently exceed the statutory 45-day threshold. All active receivables are within statutory limits.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isSelected = selectedInvoiceIds.includes(inv.invoice_id);

                  return (
                    <tr 
                      key={inv.invoice_id}
                      onClick={() => toggleInvoice(inv.invoice_id)}
                      className={`hover:bg-slate-50/80 transition cursor-pointer ${isSelected ? "bg-amber-50/30" : ""}`}
                    >
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleInvoice(inv.invoice_id)}
                          className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        {inv.invoice_number}
                        <div className="text-[10px] text-slate-400 font-normal">
                          PO: {inv.po_number || "Direct"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{inv.buyer_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{inv.buyer_gstin}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800">{inv.delivery_date}</div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded mt-0.5">
                          {inv.days_since_delivery} days elapsed (&gt;45d)
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <Lock className="w-3 h-3 text-emerald-600" />
                          POD {inv.pod_health_score}% Locked
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        ₹{inv.balance_due.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                        +₹{inv.accrued_sec16_interest.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </td>

                      <td className="py-3.5 px-4 text-right font-extrabold text-amber-700">
                        ₹{inv.total_statutory_claim.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
