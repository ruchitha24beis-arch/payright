"use client";

import { useEffect, useState } from "react";
import { 
  FileCheck2, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldCheck, 
  Search, 
  ArrowRight, 
  Info,
  Lock,
  Clock,
  FileCode2,
  Building2,
  Tag,
  Plus
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import CreateInvoiceModal from "@/components/CreateInvoiceModal";

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

interface DeemedAcceptanceInfo {
  delivery_date: string;
  lock_deadline: string;
  days_elapsed: number;
  days_remaining: number;
  is_locked: boolean;
  lock_status: string;
  status_label: string;
  badge_color: string;
  statutory_rule: string;
}

interface InvoiceItem {
  id: number;
  invoice_number: string;
  status?: string;
  vendor_name: string;
  buyer_name: string;
  principal_amount: number;
  po_number: string;
  goods_description: string;
  document_health_score: number;
  legal_health_score?: number;
  deemed_acceptance_date?: string;
  deemed_acceptance_clause?: string;
  deemed_acceptance_info?: DeemedAcceptanceInfo;
  acceptance_audit_log?: any;
  vendor_major_activity?: string;
  vendor_enterprise_class?: string;
  sec_43bh_eligible?: boolean;
  ocr_details: DocDetails | null;
}

export default function DocumentHealthCheckPage() {
  const { company } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);

  // Form states for test upload
  const [invNum, setInvNum] = useState("INV/NEW/24-25/101");
  const [poNum, setPoNum] = useState("PO-TATA-2024-9988");
  const [amount, setAmount] = useState("1500000");
  const [vendorId, setVendorId] = useState(company?.id?.toString() || "1");
  const [buyerId, setBuyerId] = useState("6");

  useEffect(() => {
    fetchInvoices();
  }, [company?.id]);

  async function fetchInvoices() {
    try {
      const vendorParam = company?.id ? `?vendor_id=${company.id}` : "";
      const res = await fetch(`${API_BASE_URL}/api/v1/invoices${vendorParam}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
        if (data.length > 0) {
          setSelectedInvoice(data[0]);
        } else {
          setSelectedInvoice(null);
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
    formData.append("vendor_id", vendorId);
    formData.append("buyer_id", buyerId);
    formData.append("principal_amount", amount);
    formData.append("invoice_date_val", "2026-10-01");
    formData.append("due_date_val", "2026-10-16");
    formData.append("delivery_date_val", "2026-10-01");
    formData.append("po_number", poNum);
    formData.append("goods_description", "Precision Engineering Parts");

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/invoices/upload`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const resJson = await res.json();
        setUploadMessage(resJson.message);
        await fetchInvoices();
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoice_number.toLowerCase().includes(searchFilter.toLowerCase()) ||
    inv.buyer_name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#163A5F] border-t-transparent animate-spin" />
        <p className="text-xs font-medium text-[#64748B]">Inspecting delivery proof documents &amp; deemed acceptance clocks...</p>
      </div>
    );
  }

  const ocr = selectedInvoice?.ocr_details;
  const lockInfo = selectedInvoice?.deemed_acceptance_info;
  const isDeemedLocked = lockInfo?.is_locked || selectedInvoice?.status === "DEEMED_ACCEPTED";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
              Document Health &amp; Acceptance Lock
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              MSMED Sec 2(b)
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Audit delivery proof readiness and 15-day statutory deemed acceptance status.
          </p>
        </div>

        <button
          onClick={() => setCreateInvoiceOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-2 transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>+ New Invoice</span>
        </button>
      </div>

      {/* Main Grid: Selector & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Invoice Selector & Upload */}
        <div className="space-y-4">
          {/* Invoice Selector */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Select Invoice
              </span>
              <span className="text-[11px] text-[#64748B] font-mono">{filteredInvoices.length} Available</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search invoice or buyer..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:outline-hidden focus:border-blue-600 transition"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredInvoices.map((inv) => {
                const isSelected = selectedInvoice?.id === inv.id;
                const isLocked = inv.deemed_acceptance_info?.is_locked || inv.status === "DEEMED_ACCEPTED";
                return (
                  <button
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition flex flex-col gap-1.5 cursor-pointer ${
                      isSelected
                        ? "border-[#0F172A] bg-slate-50 shadow-xs"
                        : "border-[#E2E8F0] hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F172A]">{inv.invoice_number}</span>
                      <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                        inv.document_health_score >= 85 
                          ? "bg-emerald-100 text-emerald-900"
                          : inv.document_health_score >= 65
                          ? "bg-blue-100 text-blue-900"
                          : "bg-amber-100 text-amber-900"
                      }`}>
                        {inv.document_health_score}%
                      </span>
                    </div>

                    <div className="text-[11px] text-[#64748B] flex items-center justify-between">
                      <span>{inv.buyer_name}</span>
                      <span className="font-semibold text-slate-800">{formatINR(inv.principal_amount)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                      {isLocked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                          <Lock className="w-2.5 h-2.5" /> Deemed Accepted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700">
                          <Clock className="w-2.5 h-2.5" /> {inv.deemed_acceptance_info?.days_remaining || 0}d lock timer
                        </span>
                      )}

                      {inv.vendor_major_activity === "TRADING" && (
                        <span className="ml-auto text-[9px] font-bold px-1 rounded-xs bg-amber-100 text-amber-900">
                          TRADER
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Simulation Upload */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs space-y-3">
            <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-blue-600" />
              <span>Simulate PO &amp; POD Upload</span>
            </span>

            <form onSubmit={handleSimulateUpload} className="space-y-2.5 text-xs">
              <div>
                <label className="text-[11px] text-[#64748B] font-semibold block mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={invNum}
                  onChange={(e) => setInvNum(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-[#64748B] font-semibold block mb-1">PO Ref</label>
                  <input
                    type="text"
                    value={poNum}
                    onChange={(e) => setPoNum(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#64748B] font-semibold block mb-1">Amount (INR)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-2 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold text-xs transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {uploading ? "Analyzing & Sealing Clock..." : "Run OCR & Start 15-Day Lock"}
              </button>

              {uploadMessage && (
                <div className="p-2 rounded bg-emerald-50 text-emerald-800 text-[11px] font-semibold">
                  ✓ {uploadMessage}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right 2 Columns: Dossier Inspection & Checkpoints */}
        <div className="lg:col-span-2 space-y-4">
          {selectedInvoice && (
            <>
              {/* Deemed Acceptance Lock Banner */}
              <div className={`p-4 rounded-xl border shadow-xs ${
                isDeemedLocked 
                  ? "bg-emerald-50/70 border-emerald-300"
                  : "bg-blue-50/70 border-blue-300"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5 mb-2.5 border-current/20">
                  <div className="flex items-center gap-2">
                    {isDeemedLocked ? (
                      <Lock className="w-4 h-4 text-emerald-700" />
                    ) : (
                      <Clock className="w-4 h-4 text-blue-700" />
                    )}
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                      15-Day Deemed Acceptance Lock (MSMED Sec 2(b))
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isDeemedLocked ? "bg-emerald-200 text-emerald-900" : "bg-blue-200 text-blue-900"
                  }`}>
                    {isDeemedLocked ? "LOCKED & SEALED" : `${lockInfo?.days_remaining || 0} Days Remaining`}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {selectedInvoice.deemed_acceptance_clause || (
                      "Notice of Statutory Acceptance: Consignment delivered on " + 
                      (selectedInvoice.deemed_acceptance_date || "delivery date") + 
                      ". Under MSMED Act Sec 2(b), silence after 15 calendar days creates irrevocable acceptance."
                    )}
                  </p>

                  <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                    {selectedInvoice.acceptance_audit_log && (
                      <button
                        onClick={() => setShowAuditModal(true)}
                        className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[11px] flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                      >
                        <FileCode2 className="w-3 h-3" />
                        <span>View Cryptographic Seal (SHA-256)</span>
                      </button>
                    )}

                    <div className="text-[11px] text-slate-600 font-medium">
                      Sec 43B(h): <strong className={selectedInvoice.sec_43bh_eligible !== false ? "text-emerald-700" : "text-amber-800"}>
                        {selectedInvoice.sec_43bh_eligible !== false ? "Eligible" : "Exempted (Trader)"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Health Score Overview Card */}
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                      Evidentiary Health Score
                    </span>
                    <div className="text-2xl font-bold text-[#0F172A] mt-0.5 tabular-nums">
                      {selectedInvoice.document_health_score}%
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      selectedInvoice.document_health_score >= 85
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : selectedInvoice.document_health_score >= 65
                        ? "bg-blue-50 text-blue-800 border border-blue-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}>
                      {ocr?.grade_label || "Defense Ready"}
                    </span>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      {ocr?.recommendation || "Full evidentiary backing."}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      selectedInvoice.document_health_score >= 85
                        ? "bg-emerald-600"
                        : selectedInvoice.document_health_score >= 65
                        ? "bg-blue-600"
                        : "bg-amber-600"
                    }`}
                    style={{ width: `${selectedInvoice.document_health_score}%` }}
                  />
                </div>
              </div>

              {/* Checkpoints Breakdown */}
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs space-y-2.5">
                <h2 className="font-bold text-xs text-[#0F172A] uppercase tracking-wider">
                  Evidentiary Checkpoints
                </h2>

                <div className="space-y-2">
                  {ocr?.checkpoints?.map((cp, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-xs transition ${
                        cp.status === "PASSED"
                          ? "bg-emerald-50/30 border-emerald-200"
                          : cp.status === "WARNING"
                          ? "bg-blue-50/30 border-blue-200"
                          : "bg-amber-50/30 border-amber-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {cp.status === "PASSED" ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : cp.status === "WARNING" ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          <span className="font-bold text-[#0F172A]">{cp.name}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-700 text-[11px]">
                          {cp.score} / {cp.weight} pts
                        </span>
                      </div>

                      <p className="text-[11px] text-[#64748B] mt-1">{cp.description}</p>
                      
                      <div className="mt-1.5 text-[10px] font-medium text-slate-700 bg-white/70 px-2 py-1 rounded border border-current/10">
                        {cp.remediation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Unalterable Audit Log Modal */}
      {showAuditModal && selectedInvoice?.acceptance_audit_log && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] max-w-lg w-full p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2 text-emerald-800">
                <Lock className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-[#0F172A]">
                  Cryptographic Seal (SHA-256)
                </h3>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-[#64748B]">
              Sealed under MSMED Act Section 2(b) upon completion of the 15-day objection period.
            </p>

            <div className="p-3 bg-slate-900 rounded-lg text-emerald-400 font-mono text-[11px] overflow-x-auto space-y-1">
              <div className="text-amber-400 break-all font-bold">
                {selectedInvoice.acceptance_audit_log.cryptographic_seal_hash}
              </div>
              <div className="text-slate-500 pt-1 text-[10px]">// Timestamp: {selectedInvoice.acceptance_audit_log.timestamp || "2026-10-16T12:00:00Z"}</div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-3 py-1.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        isOpen={createInvoiceOpen}
        onClose={() => setCreateInvoiceOpen(false)}
        onCreated={fetchInvoices}
      />
    </div>
  );
}
