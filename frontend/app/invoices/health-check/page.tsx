"use client";

import { useEffect, useState } from "react";
import { 
  FileCheck2, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldCheck, 
  HelpCircle,
  FileText,
  Search,
  ArrowRight,
  Info
} from "lucide-react";

interface Checkpoint {
  name: string;
  weight: number;
  status: "PASSED" | "FLAGGED" | "WARNING";
  score: number;
  description: string;
  remediation: string;
}

interface DocDetails {
  document_health_score: number;
  health_grade: string;
  grade_label: string;
  color: string;
  checkpoints: Checkpoint[];
  recommendation: string;
}

interface InvoiceItem {
  id: number;
  invoice_number: string;
  vendor_name: string;
  buyer_name: string;
  principal_amount: number;
  po_number: string;
  goods_description: string;
  document_health_score: number;
  ocr_details: DocDetails | null;
}

export default function DocumentHealthCheckPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  // Form states for test upload
  const [invNum, setInvNum] = useState("INV/NEW/24-25/999");
  const [poNum, setPoNum] = useState("PO-TATA-2024-9988");
  const [amount, setAmount] = useState("1500000");

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function fetchInvoices() {
    try {
      const res = await fetch("http://localhost:8000/api/v1/invoices");
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
        if (data.length > 0) {
          setSelectedInvoice(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleSimulateUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append("invoice_number", invNum);
    formData.append("vendor_id", "1");
    formData.append("buyer_id", "6");
    formData.append("principal_amount", amount);
    formData.append("invoice_date_val", "2026-10-01");
    formData.append("due_date_val", "2026-10-16");
    formData.append("po_number", poNum);
    formData.append("goods_description", "Precision Engineering Parts");

    try {
      const res = await fetch("http://localhost:8000/api/v1/invoices/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setUploadMessage("Delivery proof uploaded and analyzed! OCR checklist updated.");
        await fetchInvoices();
      }
    } catch (err) {
      console.error(err);
      setUploadMessage("Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(searchFilter.toLowerCase()) ||
      inv.buyer_name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#163A5F] border-t-transparent animate-spin" />
        <p className="text-xs font-medium text-[#64748B]">Loading document health analyses...</p>
      </div>
    );
  }

  const details = selectedInvoice?.ocr_details;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-[#0F172A]">
              OCR Document Health Inspector & Evidentiary Readiness
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
              Anti-Dispute Audit
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Pre-empt corporate commercial disputes by verifying authorized receiver signatures, buyer company rubber stamps, and inward gate seals.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#64748B] bg-[#F8FAFC] px-3 py-2 rounded-lg border border-[#E2E8F0]">
          <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
          <span>Indisputable evidence prevents delayed invoice rejection</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Upload & Document Selector */}
        <div className="lg:col-span-5 space-y-6">
          {/* Document Upload Card */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
            <h2 className="font-bold text-sm text-[#0F172A] mb-3 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-[#2563EB]" />
              <span>Upload Delivery Proof for OCR Analysis</span>
            </h2>

            <form onSubmit={handleSimulateUpload} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={invNum}
                  onChange={(e) => setInvNum(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#0F172A] focus:outline-hidden focus:border-[#2563EB] focus:bg-white transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                    PO Number
                  </label>
                  <input
                    type="text"
                    value={poNum}
                    onChange={(e) => setPoNum(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#0F172A] focus:outline-hidden focus:border-[#2563EB] focus:bg-white transition"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                    Principal (₹)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#0F172A] focus:outline-hidden focus:border-[#2563EB] focus:bg-white transition tabular-nums"
                    required
                  />
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="p-4 border-2 border-dashed border-[#E2E8F0] hover:border-[#2563EB] rounded-xl text-center bg-[#F8FAFC] transition cursor-pointer">
                <FileText className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs text-slate-700 font-medium">Click to select signed POD challan</p>
                <p className="text-[10px] text-[#64748B] mt-0.5">Supports PDF, PNG, JPG (Checks stamps &amp; signatures)</p>
              </div>

              {uploadMessage && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{uploadMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-2 rounded-lg bg-[#163A5F] hover:bg-[#102B47] text-white font-semibold text-xs transition shadow-xs disabled:opacity-50"
              >
                {uploading ? "Analyzing Evidentiary Health..." : "Score Document Readiness"}
              </button>
            </form>
          </div>

          {/* List of Registered Invoices */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-[#E2E8F0] flex items-center justify-between">
              <span className="font-bold text-xs text-[#0F172A] uppercase tracking-wider">
                Select Invoice to Inspect
              </span>
              <span className="text-[11px] text-[#64748B]">
                {filteredInvoices.length} docs
              </span>
            </div>

            {/* Quick Search */}
            <div className="p-2.5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter invoice or buyer..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 rounded-md border border-[#E2E8F0] bg-white text-xs text-[#0F172A] placeholder:text-slate-400 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="divide-y divide-[#E2E8F0] max-h-96 overflow-y-auto">
              {filteredInvoices.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className={`w-full text-left p-3 transition-colors flex items-center justify-between ${
                    selectedInvoice?.id === inv.id
                      ? "bg-blue-50/70 border-l-4 border-[#2563EB]"
                      : "hover:bg-[#F8FAFC]"
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs text-[#0F172A]">{inv.invoice_number}</div>
                    <div className="text-[11px] text-[#64748B]">{inv.buyer_name}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono font-bold text-xs ${
                      inv.document_health_score >= 80 ? "text-[#16A34A]" :
                      inv.document_health_score >= 50 ? "text-amber-700" : "text-red-700"
                    }`}>
                      {inv.document_health_score}%
                    </div>
                    <div className="text-[10px] text-[#64748B]">Legal Score</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Deep Inspection Scorecard */}
        <div className="lg:col-span-7">
          {selectedInvoice && (
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-xs space-y-6">
              {/* Selected Invoice Details Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div>
                  <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">
                    Evidentiary Audit Sheet
                  </span>
                  <h2 className="text-lg font-bold text-[#0F172A] mt-0.5">
                    {selectedInvoice.invoice_number}
                  </h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Corporate Buyer: <strong className="text-[#0F172A]">{selectedInvoice.buyer_name}</strong> &bull; PO: {selectedInvoice.po_number}
                  </p>
                </div>

                <div className="text-right">
                  <div className={`text-2xl font-black tabular-nums ${
                    selectedInvoice.document_health_score >= 80 ? "text-[#16A34A]" :
                    selectedInvoice.document_health_score >= 50 ? "text-amber-800" : "text-red-700"
                  }`}>
                    {selectedInvoice.document_health_score}%
                  </div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">
                    Readiness Score
                  </span>
                </div>
              </div>

              {/* Progress Bar Meter */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-[#64748B]">
                  <span>Legal Enforceability Meter</span>
                  <span className="font-semibold text-[#0F172A]">
                    {details?.grade_label || "Score Evaluation Complete"}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      selectedInvoice.document_health_score >= 80 ? "bg-[#16A34A]" :
                      selectedInvoice.document_health_score >= 50 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${selectedInvoice.document_health_score}%` }}
                  />
                </div>
              </div>

              {/* Checkpoints Breakdown */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                  <span>Mandatory Evidentiary Checkpoints</span>
                </h3>

                <div className="space-y-2.5">
                  {details?.checkpoints?.map((chk, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white flex items-start justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-start gap-3">
                        {chk.status === "PASSED" ? (
                          <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
                        ) : chk.status === "WARNING" ? (
                          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold text-xs text-[#0F172A] flex items-center gap-2">
                            <span>{chk.name}</span>
                            <span className="text-[10px] font-mono text-[#64748B]">
                              ({chk.score}/{chk.weight} pts)
                            </span>
                          </div>
                          <p className="text-[11px] text-[#64748B] mt-0.5">{chk.description}</p>
                          <div className={`mt-1 text-[11px] font-medium ${
                            chk.status === "PASSED" ? "text-emerald-800" : "text-amber-900"
                          }`}>
                            &bull; Remediation: {chk.remediation}
                          </div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm shrink-0 ${
                        chk.status === "PASSED" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                        chk.status === "WARNING" ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-red-50 text-red-800 border border-red-200"
                      }`}>
                        {chk.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategy Card */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-[#163A5F]">
                <span className="font-bold block mb-1 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[#2563EB]" />
                  <span>Commercial Preservation Strategy</span>
                </span>
                <p className="text-slate-700 leading-relaxed">
                  {details?.recommendation || "Maintain signed delivery proof and gate entry timestamps on record to ensure seamless TReDS bill discounting and clean Section 43B(h) compliance audits."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
