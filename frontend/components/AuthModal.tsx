"use client";

import { useState } from "react";
import { 
  X, 
  User, 
  Building2, 
  Lock, 
  Mail, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Phone,
  Landmark,
  Briefcase
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("rajesh@apexprecision.in");
  const [loginPassword, setLoginPassword] = useState("admin123");

  // Registration form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("FINANCE_HEAD");
  const [regCompany, setRegCompany] = useState("");
  const [regGstin, setRegGstin] = useState("");
  const [regUdyam, setRegUdyam] = useState("");
  const [regClass, setRegClass] = useState("MICRO");
  const [regActivity, setRegActivity] = useState("MANUFACTURING");
  const [regPhone, setRegPhone] = useState("");
  const [regBankAccount, setRegBankAccount] = useState("");
  const [regBankIfsc, setRegBankIfsc] = useState("");

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const success = await login(loginEmail, loginPassword);
    setLoading(false);
    if (success) {
      onClose();
    } else {
      setError("Invalid email or password. Please check your credentials.");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword || !regCompany || !regGstin) {
      setError("Please fill in all required fields (Name, Email, Password, Company Name, GSTIN).");
      return;
    }
    setLoading(true);
    setError(null);
    const success = await register({
      name: regName,
      email: regEmail,
      password: regPassword,
      role: regRole,
      company_name: regCompany,
      gstin: regGstin,
      udyam_reg_number: regUdyam || undefined,
      enterprise_class: regClass,
      major_activity: regActivity,
      phone: regPhone || undefined,
      bank_account_number: regBankAccount || undefined,
      bank_ifsc: regBankIfsc || undefined
    });
    setLoading(false);
    if (success) {
      onClose();
    } else {
      setError("Registration failed. Please verify that this email or GSTIN is not already registered.");
    }
  };

  const setQuickPersona = (name: string, email: string, comp: string, role: string) => {
    setLoginEmail(email);
    setLoginPassword("admin123");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0F172A] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              MSME User Identity &amp; Auth
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">
            {tab === "LOGIN" ? "Sign In to Your Business Account" : "Register Your MSME Enterprise"}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {tab === "LOGIN"
              ? "Access your live commercial receivables, Section 43B(h) compliance, and settlement tools."
              : "Set up your registered company profile with Udyam verification & custom buyer tracking."}
          </p>

          {/* Tab Switcher */}
          <div className="flex gap-2 mt-5 p-1 bg-white/10 rounded-xl max-w-xs text-xs font-semibold">
            <button
              onClick={() => { setTab("LOGIN"); setError(null); }}
              className={`flex-1 py-1.5 rounded-lg text-center transition ${
                tab === "LOGIN" ? "bg-white text-slate-900 shadow-xs" : "text-white/80 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab("REGISTER"); setError(null); }}
              className={`flex-1 py-1.5 rounded-lg text-center transition ${
                tab === "REGISTER" ? "bg-white text-slate-900 shadow-xs" : "text-white/80 hover:text-white"
              }`}
            >
              Register New MSME
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {tab === "LOGIN" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    placeholder="you@company.in"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick Persona Switcher for Instant Testing */}
              <div className="pt-4 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                  Quick Switch Persona (1-Click Test Login):
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setQuickPersona("Rajesh Sharma", "rajesh@apexprecision.in", "Apex Precision", "FINANCE_HEAD")}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-left transition"
                  >
                    <span className="font-bold text-slate-900 block text-xs">Rajesh Sharma</span>
                    <span className="text-[10px] text-slate-500 block">Apex Precision (Micro MSME)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickPersona("Admin", "admin@chanakya.in", "Chanakya MSME", "ADMIN")}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-left transition"
                  >
                    <span className="font-bold text-slate-900 block text-xs">System Admin</span>
                    <span className="text-[10px] text-slate-500 block">Platform Administrator</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    placeholder="e.g. Ramesh Gupta"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="ramesh@myenterprise.in"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designation / Role
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="FINANCE_HEAD">Finance Head / Director</option>
                    <option value="ACCOUNTS_RECEIVABLE">Accounts Receivable Specialist</option>
                    <option value="ADMIN">Managing Partner / Owner</option>
                  </select>
                </div>
              </div>

              {/* Company Details Section */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-900 block mb-2 uppercase tracking-wider">
                  Enterprise Information
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Company / Firm Name *
                    </label>
                    <input
                      type="text"
                      value={regCompany}
                      onChange={(e) => setRegCompany(e.target.value)}
                      required
                      placeholder="e.g. Bharat Tech Components LLP"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      GSTIN (15 Digits) *
                    </label>
                    <input
                      type="text"
                      value={regGstin}
                      onChange={(e) => setRegGstin(e.target.value.toUpperCase())}
                      required
                      maxLength={15}
                      placeholder="27AAACB1234F1Z5"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Udyam Registration Number
                    </label>
                    <input
                      type="text"
                      value={regUdyam}
                      onChange={(e) => setRegUdyam(e.target.value.toUpperCase())}
                      placeholder="UDYAM-MH-01-0012345"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      MSME Category
                    </label>
                    <select
                      value={regClass}
                      onChange={(e) => setRegClass(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="MICRO">Micro Enterprise (&lt; ₹1 Cr / ₹5 Cr)</option>
                      <option value="SMALL">Small Enterprise (&lt; ₹10 Cr / ₹50 Cr)</option>
                      <option value="MEDIUM">Medium Enterprise (&lt; ₹50 Cr / ₹250 Cr)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Major Activity
                    </label>
                    <select
                      value={regActivity}
                      onChange={(e) => setRegActivity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="MANUFACTURING">Manufacturing (Sec 43B(h) Covered)</option>
                      <option value="SERVICES">Services (Sec 43B(h) Covered)</option>
                      <option value="TRADING">Trading / Retail (Sec 16 Interest Covered)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Banking details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Settlement Bank Account #
                    </label>
                    <input
                      type="text"
                      value={regBankAccount}
                      onChange={(e) => setRegBankAccount(e.target.value)}
                      placeholder="e.g. 50200012345678"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Bank IFSC
                    </label>
                    <input
                      type="text"
                      value={regBankIfsc}
                      onChange={(e) => setRegBankIfsc(e.target.value.toUpperCase())}
                      placeholder="HDFC0001234"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition mt-4"
              >
                {loading ? (
                  <span>Registering Enterprise...</span>
                ) : (
                  <>
                    <span>Complete Enterprise Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
