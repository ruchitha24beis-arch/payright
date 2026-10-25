"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  FileText, 
  Upload, 
  ShieldCheck, 
  Lock, 
  Calendar, 
  Coins, 
  Building2, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Plus
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";

interface BuyerOption {
  id: number;
  name: string;
  gstin: string;
  credit_limit: number;
  is_tax_loss: boolean;
  corporate_tax_rate: number;
}

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onCreated?: () => void;
  onOpenCreateBuyer?: () => void;
}

export default function CreateInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
  onCreated,
  onOpenCreateBuyer
}: CreateInvoiceModalProps) {
  const { company } = useAuth();
  const [buyers, setBuyers] = useState<BuyerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingBuyers, setFetchingBuyers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form inputs
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [selectedBuyerId, setSelectedBuyerId] = useState<number | "">("");
  const [principalAmount, setPrincipalAmount] = useState<number | "">("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 45);
    return d.toISOString().split("T")[0];
  });
  const [poNumber, setPoNumber] = useState("");
  const [goodsDescription, setGoodsDescription] = useState("Commercial Precision Machinery Consignment");

  // Document upload state
  const [poFile, setPoFile] = useState<File | null>(null);
  const [podFile, setPodFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadBuyers();
      // Generate default unique invoice number
      if (!invoiceNumber) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        setInvoiceNumber(`INV-${new Date().getFullYear()}-${rand}`);
      }
    }
  }, [isOpen]);

  async function loadBuyers() {
    setFetchingBuyers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/vendors/buyers`);
      if (res.ok) {
        const data = await res.json();
        setBuyers(data);
        if (data.length > 0 && !selectedBuyerId) {
          setSelectedBuyerId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch buyers", err);
    } finally {
      setFetchingBuyers(false);
    }
  }

  if (!isOpen) return null;

  const selectedBuyer = buyers.find((b) => b.id === Number(selectedBuyerId));

  // Live Calculations
  const amountNum = Number(principalAmount) || 0;
  const isTrader = company?.major_activity === "TRADING";
  const isBuyerTaxLoss = selectedBuyer?.is_tax_loss || false;
  const is43bEligible = !isTrader && !isBuyerTaxLoss && (company?.enterprise_class === "MICRO" || company?.enterprise_class === "SMALL");
  const estimatedTaxPenalty = is43bEligible ? amountNum * (selectedBuyer?.corporate_tax_rate || 0.30) : 0;
  const estimatedAnnualSec16Interest = amountNum * 0.1725; // ~17.25% p.a. (3x RBI rate)

  // 15-day deemed acceptance lock date
  const deliv = deliveryDate ? new Date(deliveryDate) : new Date(invoiceDate);
  const lockDeadline = new Date(deliv);
  lockDeadline.setDate(lockDeadline.getDate() + 15);
  const lockDeadlineStr = lockDeadline.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber || !selectedBuyerId || !principalAmount || !invoiceDate || !dueDate) {
      setError("Please fill in all mandatory fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const vendorId = company?.id || 1;

      if (poFile || podFile) {
        // Multipart Form Upload
        const formData = new FormData();
        formData.append("invoice_number", invoiceNumber);
        formData.append("vendor_id", String(vendorId));
        formData.append("buyer_id", String(selectedBuyerId));
        formData.append("principal_amount", String(principalAmount));
        formData.append("invoice_date_val", invoiceDate);
        formData.append("due_date_val", dueDate);
        formData.append("delivery_date_val", deliveryDate || invoiceDate);
        if (poNumber) formData.append("po_number", poNumber);
        if (goodsDescription) formData.append("goods_description", goodsDescription);
        if (poFile) formData.append("po_file", poFile);
        if (podFile) formData.append("pod_file", podFile);

        const res = await fetch(`${API_BASE_URL}/api/v1/invoices/upload`, {
          method: "POST",
          body: formData
        });

        if (!res.ok) {
          throw new Error("Failed to upload invoice");
        }
      } else {
        // JSON Creation
        const res = await fetch(`${API_BASE_URL}/api/v1/invoices/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoice_number: invoiceNumber,
            vendor_id: vendorId,
            buyer_id: Number(selectedBuyerId),
            principal_amount: Number(principalAmount),
            invoice_date: invoiceDate,
            due_date: dueDate,
            delivery_date: deliveryDate || invoiceDate,
            po_number: poNumber || null,
            goods_description: goodsDescription || "Commercial Supplies"
          })
        });

        if (!res.ok) {
          throw new Error("Failed to create invoice");
        }
      }

      if (onSuccess) onSuccess();
      if (onCreated) onCreated();
      onClose();
    } catch (err: any) {
      console.error("Create invoice error:", err);
      setError(err.message || "Failed to submit invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-6 overflow-hidden">
        {/* Header */}
        <div className="bg-[#163A5F] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider">
              Real User Entry · 15-Day Lock Engine
            </span>
          </div>
          <h2 className="text-xl font-bold">Register Real Commercial Invoice</h2>
          <p className="text-xs text-slate-200 mt-1">
            Issued by <strong className="text-white">{company?.name || "Your MSME"}</strong>. 
            Automatically embeds Section 43B(h) protection, 15-day deemed acceptance lock, and buyer portal.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Invoice # & Buyer Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Number *
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value.toUpperCase())}
                required
                placeholder="e.g. INV-2026-8801"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Corporate Buyer *
                </label>
                {onOpenCreateBuyer && (
                  <button
                    type="button"
                    onClick={onOpenCreateBuyer}
                    className="text-[10px] text-blue-600 hover:underline font-semibold flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Add Buyer
                  </button>
                )}
              </div>
              <select
                value={selectedBuyerId}
                onChange={(e) => setSelectedBuyerId(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
              >
                {fetchingBuyers ? (
                  <option value="">Loading corporate buyers...</option>
                ) : buyers.length === 0 ? (
                  <option value="">No buyers found. Click Add Buyer above.</option>
                ) : (
                  buyers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.gstin})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Row 2: Principal Amount & PO Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Principal Amount (INR ₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={principalAmount}
                  onChange={(e) => setPrincipalAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  required
                  placeholder="500000"
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purchase Order (PO) Number
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="e.g. PO-TM-2026-904"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 3: Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Date *
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Delivery Date (POD) *
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Statutory Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Goods Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Goods / Scope of Supply
            </label>
            <input
              type="text"
              value={goodsDescription}
              onChange={(e) => setGoodsDescription(e.target.value)}
              placeholder="e.g. CNC Milled Components, Batch #992"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* File Uploads for PO and POD */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              Document Upload &amp; OCR Verification (Optional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Purchase Order (PDF / Image)
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setPoFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Proof of Delivery / Lorry Receipt (POD)
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setPodFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>
            </div>
          </div>

          {/* Statutory Live Preview Box */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Statutory Safeguard Preview:
              </span>
              <span className="text-[11px] font-semibold text-blue-800">
                15-Day Lock: {lockDeadlineStr}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="p-2 rounded-lg bg-white border border-blue-100">
                <span className="text-slate-500 block">Sec 43B(h) Tax Impact:</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {is43bEligible ? `₹${estimatedTaxPenalty.toLocaleString("en-IN")} Penalty` : "Sec 16 Interest Pivot"}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-blue-100">
                <span className="text-slate-500 block">Sec 16 Compound Rate:</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  17.25% p.a. (3x RBI Bank Rate)
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition"
            >
              {loading ? (
                <span>Registering Invoice...</span>
              ) : (
                <>
                  <span>Save Invoice &amp; Activate 15-Day Lock</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
