"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  Bell, 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  Coins, 
  ChevronDown,
  Plus,
  Building2,
  LogIn,
  LogOut,
  UserCheck,
  Sparkles
} from "lucide-react";
import LegalGuidanceModal from "./LegalGuidanceModal";
import CompanyProfileModal from "./CompanyProfileModal";
import AuthModal from "./AuthModal";
import CreateInvoiceModal from "./CreateInvoiceModal";
import CreateBuyerModal from "./CreateBuyerModal";
import { useAuth } from "@/context/AuthContext";

interface AppHeaderProps {
  onToggleSidebar: () => void;
}

export default function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const pathname = usePathname();
  const { user, company, logout, authModalOpen, setAuthModalOpen } = useAuth();

  const [legalOpen, setLegalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [createBuyerOpen, setCreateBuyerOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);

  const getPageTitle = (path: string) => {
    switch (path) {
      case "/dashboard":
        return { title: "Dashboard", subtitle: "Live receivables and Section 43B(h) tracking" };
      case "/invoices/health-check":
        return { title: "Document Health", subtitle: "Delivery proof scoring and deemed acceptance locks" };
      case "/settlement-builder":
        return { title: "Settlement & EMI", subtitle: "Installment schedules with automated e-NACH mandates" };
      case "/treds":
        return { title: "TReDS Financing", subtitle: "Instant bill discounting at institutional discount rates" };
      case "/credit-safeguards":
        return { title: "Credit Limits", subtitle: "Automated exposure monitoring and shipment advisories" };
      case "/reminders":
        return { title: "Reminders", subtitle: "Audit-friendly payment notices and settlement proposals" };
      case "/":
        return { title: "Overview", subtitle: "Intelligent accounting overlay for MSMEs" };
      default:
        return { title: "Chanakya", subtitle: "Receivables & Recovery Engine" };
    }
  };

  const currentMeta = getPageTitle(pathname);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "AP";

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
            <p className="hidden md:block text-[11px] text-[#64748B] font-medium">
              {currentMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Quick Actions, Compliance Badge, Notifications, User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Action: New Invoice */}
          <button
            onClick={() => setCreateInvoiceOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-xs font-semibold text-white shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Invoice</span>
            <span className="sm:hidden">Invoice</span>
          </button>

          {/* Quick Action: Add Buyer */}
          <button
            onClick={() => setCreateBuyerOpen(true)}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>+ Buyer</span>
          </button>

          {/* MSME Legal Rights Button */}
          <button
            onClick={() => setLegalOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition shadow-2xs"
          >
            <Scale className="w-3.5 h-3.5 text-blue-600" />
            <span>Statutory Rules</span>
          </button>

          {/* Compliance Pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{company?.sec_43bh_eligible ? "43B(h) Active" : "Sec 16 Active"}</span>
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
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-[#E2E8F0] shadow-xl py-2 z-50 text-xs">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-[#0F172A]">Recent Alerts</span>
                  <span className="text-[10px] text-[#64748B]">Audit events</span>
                </div>

                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  <div className="p-3 hover:bg-slate-50 transition flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900 block">Credit Limit Advisory</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Shipment hold advisory rule active when balance breaches set limit.
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">Live Audit</span>
                    </div>
                  </div>

                  <div className="p-3 hover:bg-slate-50 transition flex items-start gap-2.5">
                    <Coins className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900 block">15-Day Contractual Seal</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Invoices past 15 days automatically locked with SHA-256 audit trail.
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">Statutory Lock</span>
                    </div>
                  </div>
                </div>

                <div className="p-2 border-t border-slate-100 text-center">
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1.5 pl-2 sm:pr-3 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 transition text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs">
                {initials}
              </div>
              <div className="hidden sm:block">
                <span className="font-semibold text-xs text-[#0F172A] block leading-tight">
                  {user?.name || "MSME User"}
                </span>
                <span className="text-[10px] text-[#64748B] block font-medium">
                  {company?.name ? company.name.slice(0, 18) + (company.name.length > 18 ? "..." : "") : "Enterprise"}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-[#E2E8F0] shadow-xl py-2 z-50 text-xs">
                <div className="px-4 py-2 border-b border-slate-100">
                  <span className="font-bold text-[#0F172A] block">{user?.name}</span>
                  <span className="text-[11px] text-slate-500 block truncate">{user?.email}</span>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200">
                    {company?.name || "Registered Enterprise"}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setProfileOpen(true);
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                  >
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span>Company Profile &amp; Udyam</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setAuthModalOpen(true);
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                  >
                    <UserCheck className="w-4 h-4 text-slate-500" />
                    <span>Switch User / Persona</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 font-semibold transition"
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      <LegalGuidanceModal isOpen={legalOpen} onClose={() => setLegalOpen(false)} />
      <CompanyProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <CreateInvoiceModal
        isOpen={createInvoiceOpen}
        onClose={() => setCreateInvoiceOpen(false)}
        onSuccess={() => {
          if (typeof window !== "undefined") {
            window.location.reload();
          }
        }}
        onOpenCreateBuyer={() => {
          setCreateInvoiceOpen(false);
          setCreateBuyerOpen(true);
        }}
      />
      <CreateBuyerModal
        isOpen={createBuyerOpen}
        onClose={() => setCreateBuyerOpen(false)}
        onSuccess={() => {
          setCreateInvoiceOpen(true);
        }}
      />
    </>
  );
}

