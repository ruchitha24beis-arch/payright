"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  Bell, 
  Scale, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Coins, 
  ExternalLink,
  ChevronDown,
  User
} from "lucide-react";
import LegalGuidanceModal from "./LegalGuidanceModal";
import CompanyProfileModal from "./CompanyProfileModal";

interface AppHeaderProps {
  onToggleSidebar: () => void;
}

export default function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const pathname = usePathname();
  const [legalOpen, setLegalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  const getPageTitle = (path: string) => {
    switch (path) {
      case "/dashboard":
        return { title: "Executive Receivables Dashboard", subtitle: "MSME Commercial Preservation & Compliance Overview" };
      case "/invoices/health-check":
        return { title: "OCR Document Health Inspector", subtitle: "Pre-empt commercial disputes with legal evidentiary scoring" };
      case "/settlement-builder":
        return { title: "Settlement & Pro-Rata EMI Builder", subtitle: "Structured installment schedules with unlocked shipment batches" };
      case "/treds":
        return { title: "Silent TReDS Bill Factoring Desk", subtitle: "24-hr institutional invoice discounting at 8% p.a. without buyer conflict" };
      case "/credit-safeguards":
        return { title: "Credit Limit Safeguards & ERP Hold", subtitle: "Algorithmic audit-backed shipment advisories to shield sales reps" };
      case "/reminders":
        return { title: "Diplomatic Multi-Channel Reminders", subtitle: "Tax deduction advisories and audit reconciliation notifications" };
      case "/":
        return { title: "Chanakya Platform Overview", subtitle: "Commercial Preservation & Payment Recovery" };
      default:
        return { title: "Chanakya Platform", subtitle: "MSME Payment Recovery Engine" };
    }
  };

  const currentMeta = getPageTitle(pathname);

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Mobile menu button & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-sm sm:text-base font-bold text-[#0F172A] tracking-tight">
              {currentMeta.title}
            </h1>
            <p className="hidden md:block text-[11px] text-[#64748B] -mt-0.5 font-medium">
              {currentMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Actions, Compliance Badge, Notifications, User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* MSME Legal Rights Button */}
          <button
            onClick={() => setLegalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-slate-100 text-xs font-semibold text-[#163A5F] transition"
          >
            <Scale className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Legal Guidance</span>
          </button>

          {/* Compliance Pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Sec 43B(h) Verified</span>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                if (unreadCount > 0) setUnreadCount(0);
              }}
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-[#E2E8F0] shadow-xl py-2 z-50 text-xs">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-[#0F172A]">Statutory & Compliance Alerts</span>
                  <span className="text-[11px] text-[#64748B]">Real-time audit events</span>
                </div>

                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  <div className="p-3 hover:bg-slate-50 transition flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 block">Tata Motors Credit Breach</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Credit utilization reached 104%. Automated diplomatic ERP hold triggered.
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">12 mins ago</span>
                    </div>
                  </div>

                  <div className="p-3 hover:bg-slate-50 transition flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Scale className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 block">45-Day Sec 43B(h) Threshold</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Invoice INV-001 crossed statutory deadline. ₹13.72L corporate tax disallowance flagged.
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">1 hour ago</span>
                    </div>
                  </div>

                  <div className="p-3 hover:bg-slate-50 transition flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Coins className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 block">RXIL Institutional Bid Received</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        State Bank of India bid at 7.90% p.a. discount rate for accepted bill.
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">3 hours ago</span>
                    </div>
                  </div>
                </div>

                <div className="p-2 border-t border-slate-100 text-center">
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="text-[11px] text-[#2563EB] hover:underline font-semibold"
                  >
                    Close Alerts
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2 p-1.5 pl-2 sm:pr-3 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 transition text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-[#163A5F] text-white flex items-center justify-center font-bold text-xs">
              AP
            </div>
            <div className="hidden sm:block">
              <span className="font-semibold text-xs text-[#0F172A] block leading-tight">
                Apex Precision
              </span>
              <span className="text-[10px] text-[#64748B] block font-medium">
                UDYAM-MH-03
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>
        </div>
      </header>

      {/* Modals */}
      <LegalGuidanceModal isOpen={legalOpen} onClose={() => setLegalOpen(false)} />
      <CompanyProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
