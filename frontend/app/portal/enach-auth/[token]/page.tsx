"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { ShieldCheck, CheckCircle2, Building2, AlertTriangle, ArrowRight, Lock } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

function EnachAuthContent() {
  const searchParams = useSearchParams();
  const umrn = searchParams.get("umrn") || "UMRN-NPCI-2024-DEMO";
  const [bankName, setBankName] = useState("HDFC Bank Corporate Treasury");
  const [authMethod, setAuthMethod] = useState("NET_BANKING");
  const [accountLast4, setAccountLast4] = useState("4109");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthorize = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/settlements/enach/authorize/${umrn}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          umrn,
          auth_method: authMethod,
          bank_name: bankName,
          account_last4: accountLast4
        })
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        setError("Failed to register authorization with NPCI network.");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-12 p-6 sm:p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-lg space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#0F172A]">
              National Automated Clearing House (e-NACH)
            </h1>
            <p className="text-xs text-[#64748B]">NPCI Digital Mandate Authorization Gateway</p>
          </div>
        </div>
        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
          256-bit SSL
        </span>
      </div>

      {success ? (
        <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="text-base font-bold text-emerald-900">
            e-NACH Auto-Debit Mandate Successfully Authorized!
          </h2>
          <p className="text-xs text-emerald-800">
            UMRN <strong className="font-mono">{umrn}</strong> has been registered with NPCI and the clearing house. Monthly installments will clear automatically on scheduled dates.
          </p>
          <div className="pt-2">
            <a
              href="/dashboard"
              className="inline-block px-4 py-2 rounded-lg bg-emerald-700 text-white font-bold text-xs"
            >
              Return to Console
            </a>
          </div>
        </div>
      ) : (
        <>
          {/* Mandate Particulars */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#64748B]">Unique Mandate Ref (UMRN):</span>
              <span className="font-mono font-bold text-[#0F172A]">{umrn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Clearing Frequency:</span>
              <span className="font-bold text-[#0F172A]">Monthly Auto-Debit Hit</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Settlement Rule:</span>
              <span className="font-bold text-emerald-700">Pro-Rata PO Consignment Release</span>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#0F172A] block mb-1">Clearing Bank</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-[#0F172A] block mb-1">Corporate Current Account (Last 4 Digits)</label>
              <input
                type="text"
                value={accountLast4}
                onChange={(e) => setAccountLast4(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-[#0F172A] block mb-1">Authentication Method</label>
              <select
                value={authMethod}
                onChange={(e) => setAuthMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white font-medium"
              >
                <option value="NET_BANKING">Corporate NetBanking (OTP Verified)</option>
                <option value="AADHAAR_ESIGN">Aadhaar e-Sign (UIDAI e-KYC)</option>
                <option value="DEBIT_CARD">Corporate Debit Card Clearance</option>
              </select>
            </div>
          </div>

          {/* Statutory Liability Warning */}
          <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/70 text-amber-950 text-[11px] leading-relaxed space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Section 25 Payment and Settlement Systems Act, 2007:</span>
            </div>
            <p>
              By authorizing this mandate, the buyer acknowledges that electronic auto-debit dishonor carries criminal bank bounce liability equivalent to Section 138 of the Negotiable Instruments Act, attracting up to 2 years imprisonment or fine up to twice the installment amount.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <button
            onClick={handleAuthorize}
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>{submitting ? "Authenticating with Clearing House..." : "Authorize e-NACH Auto-Debit Mandate"}</span>
          </button>
        </>
      )}
    </div>
  );
}

export default function EnachAuthPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        <p className="text-xs font-medium text-[#64748B]">Connecting to NPCI e-NACH Clearing Gateway...</p>
      </div>
    }>
      <EnachAuthContent />
    </Suspense>
  );
}
