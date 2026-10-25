"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Building2, 
  CheckCircle2, 
  ShieldCheck, 
  Landmark, 
  ReceiptText, 
  Edit3, 
  Save, 
  Trash2, 
  RotateCcw, 
  AlertTriangle,
  ArrowRight,
  Phone,
  Mail,
  UserCheck
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CompanyProfileModal({ isOpen, onClose }: CompanyProfileModalProps) {
  const { user, company, updateCompany, clearDemoData, resetDemoData, dataMode } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dataActionLoading, setDataActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [gstin, setGstin] = useState("");
  const [udyamRegNumber, setUdyamRegNumber] = useState("");
  const [enterpriseClass, setEnterpriseClass] = useState("MICRO");
  const [majorActivity, setMajorActivity] = useState("MANUFACTURING");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");

  useEffect(() => {
    if (company) {
      setName(company.name || "");
      setGstin(company.gstin || "");
      setUdyamRegNumber(company.udyam_reg_number || "");
      setEnterpriseClass(company.enterprise_class || "MICRO");
      setMajorActivity(company.major_activity || "MANUFACTURING");
      setContactPerson(company.contact_person || "");
      setPhone(company.phone || "");
      setEmail(company.email || "");
      setBankAccount(company.bank_account_number || "");
      setBankIfsc(company.bank_ifsc || "");
    }
  }, [company, isOpen]);

  if (!isOpen) return null;

  const initials = company?.name
    ? company.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "ME";

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);
    const success = await updateCompany({
      name,
      gstin: gstin.toUpperCase(),
      udyam_reg_number: udyamRegNumber.toUpperCase() || null,
      enterprise_class: enterpriseClass,
      major_activity: majorActivity,
      contact_person: contactPerson,
      phone,
      email,
      bank_account_number: bankAccount,
      bank_ifsc: bankIfsc.toUpperCase()
    });
    setSaving(false);
    if (success) {
      setIsEditing(false);
      setStatusMessage("✓ Enterprise profile and Udyam credentials updated successfully.");
    }
  };

  const handleClearData = async () => {
    if (confirm("Are you sure you want to clear all sample demonstration invoices and records? This leaves your active company clean to enter 100% real business data.")) {
      setDataActionLoading(true);
      await clearDemoData();
      setDataActionLoading(false);
      setStatusMessage("✓ Demonstration data cleared. You are now working with your own live business records.");
    }
  };

  const handleResetData = async () => {
    setDataActionLoading(true);
    await resetDemoData();
    setDataActionLoading(false);
    setStatusMessage("✓ Demonstration dataset reloaded.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-[#163A5F] text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-lg">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {company?.name || "MSME Enterprise Profile"}
                </h2>
                {company?.udyam_verified ? (
                  <span className="flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-400/30">
                    <CheckCircle2 className="w-3 h-3 text-emerald-300" /> Udyam Verified
                  </span>
                ) : (
                  <span className="text-[11px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-400/30">
                    Verification Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-200">
                Logged in as <strong>{user?.name}</strong> ({user?.role?.replace("_", " ")})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700 max-h-[72vh] overflow-y-auto">
          {statusMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Section 1: Statutory Enterprise Details */}
          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-blue-600" /> Statutory Enterprise Identification
            </h3>

            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    maxLength={15}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Udyam Registration #</label>
                  <input
                    type="text"
                    value={udyamRegNumber}
                    onChange={(e) => setUdyamRegNumber(e.target.value.toUpperCase())}
                    placeholder="UDYAM-MH-01-0012345"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">MSME Category</label>
                  <select
                    value={enterpriseClass}
                    onChange={(e) => setEnterpriseClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="MICRO">Micro Enterprise</option>
                    <option value="SMALL">Small Enterprise</option>
                    <option value="MEDIUM">Medium Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Major Activity</label>
                  <select
                    value={majorActivity}
                    onChange={(e) => setMajorActivity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="MANUFACTURING">Manufacturing (Sec 43B(h) Protected)</option>
                    <option value="SERVICES">Services (Sec 43B(h) Protected)</option>
                    <option value="TRADING">Trading (Sec 16 Interest Only)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Udyam Registration Number</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {company?.udyam_reg_number || "Not Registered"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">MSME Classification</span>
                  <span className="font-semibold text-slate-900 text-xs">
                    {company?.enterprise_class} Enterprise ({company?.major_activity})
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">GSTIN</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {company?.gstin}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Section 43B(h) Status</span>
                  <span className="font-semibold text-emerald-700 text-xs flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {company?.sec_43bh_eligible ? "Eligible (Manufacturer / Service MSME)" : "Sec 16 Interest Pivot"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: TReDS and Settlement Banking */}
          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-blue-600" /> TReDS Settlement &amp; Banking Escrow
            </h3>

            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Settlement Bank Account #</label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="e.g. 50200012345678"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bank IFSC</label>
                  <input
                    type="text"
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                    placeholder="HDFC0001234"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Primary TReDS Exchange</span>
                  <span className="font-semibold text-slate-900 text-xs">RXIL &bull; M1xchange &bull; Invoicemart</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Settlement Account</span>
                  <span className="font-mono font-semibold text-slate-900 text-xs">
                    {company?.bank_account_number ? `A/C ...${company.bank_account_number.slice(-4)} (${company.bank_ifsc || "IFSC Verified"})` : "Bank Account Configured"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Data Scope & User-Entered Mode */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-xs block">
                  Data Scope Mode
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Choose whether to work with clean user-entered records or sample statutory demonstration benchmarks.
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                dataMode === "LIVE" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
              }`}>
                {dataMode === "LIVE" ? "Live Business Mode" : "Demo Benchmark Mode"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleClearData}
                disabled={dataActionLoading}
                className="px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Clear Sample Data (Switch to 100% Real Invoices)</span>
              </button>

              <button
                type="button"
                onClick={handleResetData}
                disabled={dataActionLoading}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reload Demo Benchmark Samples</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
