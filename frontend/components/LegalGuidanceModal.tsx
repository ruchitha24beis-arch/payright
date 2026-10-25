"use client";

import { X, Scale, FileText, Percent, AlertCircle, ShieldCheck, Lock, Handshake } from "lucide-react";

interface LegalGuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LegalGuidanceModal({ isOpen, onClose }: LegalGuidanceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-[#0F172A] text-white rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Statutory Rights &amp; Safeguards</h2>
              <p className="text-[11px] text-slate-300">
                Non-litigious commercial preservation framework
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3.5 text-xs text-slate-700">
          {/* Section 43B(h) */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
            <div className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px]">Sec 43B(h)</span>
              <span>Income Tax Act (Year-End 30% Tax Disallowance)</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
              <li>Unpaid dues beyond 15–45 days are added back to the buyer&apos;s taxable income.</li>
              <li>Applies strictly to Micro &amp; Small manufacturers and services.</li>
              <li>Traders are exempted; engine automatically pivots to Section 16 penal interest.</li>
            </ul>
          </div>

          {/* 15-Day Deemed Acceptance */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
            <div className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-blue-200 text-blue-900 text-[10px]">Sec 2(b)</span>
              <span>15-Day Deemed Acceptance Lock</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
              <li>Buyers must report material defects within 15 days of physical delivery.</li>
              <li>If silent after 15 days, invoices lock with an unalterable SHA-256 audit seal.</li>
              <li>Prevents retroactive frivolous disputes during payment reconciliation.</li>
            </ul>
          </div>

          {/* e-NACH Criminal Liability */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <div className="font-bold text-emerald-950 mb-1 flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 text-[10px]">Sec 25 PSSA</span>
              <span>e-NACH Mandate Auto-Debit Protection</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
              <li>Settlement plans are authorized via NPCI digital e-NACH mandates.</li>
              <li>Bounced auto-debits carry statutory bank bounce liability without civil court suits.</li>
            </ul>
          </div>

          {/* Section 16 & Section 23 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900 mb-1">Sec 16: 3x RBI Interest</div>
              <p className="text-slate-600">
                Mandatory compounding monthly interest (~20.25% p.a.) on delayed MSME payments.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900 mb-1">Sec 23: Non-Deductible</div>
              <p className="text-slate-600">
                Penal interest cannot be claimed as a business tax expense by the corporate buyer.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between rounded-b-2xl">
          <span className="text-[11px] text-slate-500">
            MSMED Act 2006 · Income Tax Act 1961 · RBI Guidelines
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
