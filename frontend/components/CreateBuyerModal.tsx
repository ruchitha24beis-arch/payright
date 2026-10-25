"use client";

import { useState } from "react";
import { 
  X, 
  Building2, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight,
  Landmark,
  Scale
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface CreateBuyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (buyer?: any) => void;
  onCreated?: (buyer?: any) => void;
}

export default function CreateBuyerModal({ isOpen, onClose, onSuccess, onCreated }: CreateBuyerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [gstin, setGstin] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [creditLimit, setCreditLimit] = useState<number>(1000000);
  const [corporateTaxRate, setCorporateTaxRate] = useState<number>(0.30);
  const [isTaxLoss, setIsTaxLoss] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !gstin || !email) {
      setError("Please fill in Buyer Company Name, GSTIN, and Accounting Email.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/vendors/buyers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          gstin: gstin.trim().toUpperCase(),
          role: "BUYER",
          email: email.trim(),
          phone: phone.trim() || undefined,
          contact_person: contactPerson.trim() || undefined,
          credit_limit: Number(creditLimit),
          corporate_tax_rate: Number(corporateTaxRate),
          is_tax_loss: isTaxLoss,
          enterprise_category: "MICRO",
          enterprise_class: "MICRO",
          major_activity: "MANUFACTURING"
        })
      });

      if (!res.ok) {
        throw new Error("Failed to register corporate buyer");
      }

      const buyer = await res.json();
      if (onSuccess) onSuccess(buyer);
      if (onCreated) onCreated(buyer);
      onClose();
    } catch (err: any) {
      console.error("Buyer creation error", err);
      setError(err.message || "Failed to add buyer. Please check GSTIN format.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full my-6 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0F172A] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider">
              Corporate Buyer Master Registry
            </span>
          </div>
          <h2 className="text-xl font-bold">Add New Corporate Buyer</h2>
          <p className="text-xs text-slate-300 mt-1">
            Configure credit exposure thresholds and tax disallowance rules for this corporate account.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Corporate Buyer Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Tata Motors Ltd, L&T, Mahindra Heavy"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Buyer GSTIN (15 Digits) *
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                required
                maxLength={15}
                placeholder="27AAACT2727Q1ZW"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Accounts Payable Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ap.desk@tatamotors.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Person Name
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Accounts Manager"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 22 6658 6000"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Credit Limit & Tax Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Credit Limit (INR ₹)
              </label>
              <input
                type="number"
                min="0"
                step="50000"
                value={creditLimit}
                onChange={(e) => setCreditLimit(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Triggers ERP shipment hold advisory when balance breaches limit.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corporate Tax Rate (Sec 43B(h))
              </label>
              <select
                value={corporateTaxRate}
                onChange={(e) => setCorporateTaxRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value={0.30}>30.0% (Standard Domestic Corporate)</option>
                <option value={0.25}>25.0% (New Manufacturing 115BAA)</option>
                <option value={0.22}>22.0% (Concessional Domestic 115BAA)</option>
              </select>
            </div>
          </div>

          {/* Net Tax Loss Flag Safeguard */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <input
              type="checkbox"
              id="taxLossCheck"
              checked={isTaxLoss}
              onChange={(e) => setIsTaxLoss(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="taxLossCheck" className="text-xs text-slate-700 cursor-pointer">
              <strong className="block text-slate-900 font-semibold">
                Buyer is currently in Net Tax Loss (MCA filings)
              </strong>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Automatically activates statutory loophole safeguard: swaps Section 43B(h) tax disallowance messaging for 3x RBI Section 16 compound penal interest.
              </span>
            </label>
          </div>

          {/* Submit */}
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
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition"
            >
              {loading ? (
                <span>Registering Buyer...</span>
              ) : (
                <>
                  <span>Save Corporate Buyer</span>
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
