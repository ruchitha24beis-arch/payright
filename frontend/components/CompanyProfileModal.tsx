"use client";

import { X, Building2, CheckCircle2, ShieldCheck, Landmark, ReceiptText } from "lucide-react";

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CompanyProfileModal({ isOpen, onClose }: CompanyProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-[#163A5F] text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold text-lg">
              AP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Apex Precision Components Pvt Ltd</h2>
                <span className="flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  <CheckCircle2 className="w-3 h-3 text-emerald-300" /> Udyam Verified
                </span>
              </div>
              <p className="text-xs text-slate-200">Registered MSME Profile & Financial Settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          {/* Statutory Registration Details */}
          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-[#2563EB]" /> Statutory Enterprise Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Udyam Registration Number</span>
                <span className="font-mono font-bold text-slate-900 text-xs">UDYAM-MH-03-0049281</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">MSME Classification</span>
                <span className="font-semibold text-slate-900 text-xs">Small Enterprise (Manufacturing)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">GSTIN</span>
                <span className="font-mono font-bold text-slate-900 text-xs">27AAACA1234A1Z5</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Registered State / Jurisdiction</span>
                <span className="font-semibold text-slate-900 text-xs">Maharashtra, India</span>
              </div>
            </div>
          </div>

          {/* TReDS and Settlement Escrow */}
          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-[#2563EB]" /> TReDS Settlement & Banking Escrow
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Primary TReDS Exchange</span>
                <span className="font-semibold text-slate-900 text-xs">RXIL (ID: RX-MSME-99214)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Secondary Exchanges</span>
                <span className="font-semibold text-slate-900 text-xs">M1xchange &bull; Invoicemart</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Settlement Account</span>
                <span className="font-mono font-semibold text-slate-900 text-xs">HDFC Bank A/C ...889211</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Corporate Tax Rate Parameter</span>
                <span className="font-bold text-[#163A5F] text-xs">30.0% (Section 43B(h))</span>
              </div>
            </div>
          </div>

          {/* Trust Banner */}
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11px]">
              MSME credentials automatically embed into generated Section 43B(h) Audit Reconciliation Packs and Corporate Buyer Guest Portals.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#163A5F] hover:bg-[#102B47] text-white text-xs font-semibold rounded-lg transition"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
