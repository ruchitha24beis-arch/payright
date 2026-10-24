"use client";

import { X, Scale, FileText, Percent, AlertCircle, ShieldCheck, ExternalLink } from "lucide-react";

interface LegalGuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LegalGuidanceModal({ isOpen, onClose }: LegalGuidanceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-[#163A5F] text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">MSME Statutory Rights & Legal Framework</h2>
              <p className="text-xs text-slate-200">
                Non-litigious commercial preservation under Income Tax Act & MSMED Act, 2006
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-sm text-slate-700">
          {/* Section 43B(h) */}
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-semibold">
                Section 43B(h)
              </span>
              <span>Income Tax Act, 1961 (Direct 30% Tax Disallowance)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Amounts due to registered Micro and Small enterprises remaining unpaid beyond <strong>15 days</strong> (or up to <strong>45 days</strong> if specified in a written agreement) are <strong>strictly disallowed as business expenses</strong> in the buyer&apos;s corporate tax computation for that financial year.
            </p>
            <div className="text-xs bg-white p-2.5 rounded-lg border border-amber-200 text-amber-900 font-medium">
              Impact on Corporate Buyer: Disallowed expenses are added back to taxable income, imposing an immediate ~30% corporate tax cash outflow at fiscal year-end.
            </div>
          </div>

          {/* Section 16 & Section 23 MSMED Act */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-[#163A5F] font-bold">
                <Percent className="w-4 h-4 text-[#2563EB]" />
                <span>Section 16: Penal Interest</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                If the buyer fails to pay within 45 days, interest is mandatory at <strong>3 times the RBI Bank Rate</strong> compounded monthly (currently ~<strong>20.25% p.a.</strong>).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-red-900 font-bold">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Section 23: Non-Deductible</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Penal interest paid or payable under Section 16 is explicitly <strong>not allowed as a tax-deductible expense</strong> for the corporate buyer under the Income Tax Act.
              </p>
            </div>
          </div>

          {/* Section 15 & TReDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-[#163A5F] font-bold">
                <FileText className="w-4 h-4 text-[#2563EB]" />
                <span>Section 15: Maximum Period</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Payment must be completed within 15 days in the absence of an agreement, and cannot exceed 45 days even if mutually agreed in a contract.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>TReDS Institutional Factoring</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                RBI-authorized exchanges (RXIL, M1xchange, Invoicemart) allow MSMEs to factor accepted bills institutionally without buyer conflict or recourse.
              </p>
            </div>
          </div>

          {/* Non-litigious notice */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Chanakya Relationship Preservation Protocol:</span> All platform communications, tax notes, and reminders are framed constructively as audit reconciliation advisories, completely avoiding hostile litigation threats while delivering maximum recovery leverage.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between rounded-b-2xl">
          <span className="text-xs text-slate-500 font-medium">
            Ministry of MSME, Govt. of India &bull; Central Board of Direct Taxes (CBDT)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#163A5F] hover:bg-[#102B47] text-white text-xs font-semibold rounded-lg transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
