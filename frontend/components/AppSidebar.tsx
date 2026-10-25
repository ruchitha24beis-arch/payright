"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileCheck2, 
  Handshake, 
  Coins, 
  ShieldAlert, 
  Send, 
  Home, 
  ExternalLink, 
  X,
  CheckCircle2
} from "lucide-react";

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AppSidebar({ isOpen = true, onClose }: AppSidebarProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/invoices/health-check", label: "Document Health", icon: FileCheck2 },
    { href: "/settlement-builder", label: "Settlement & EMI", icon: Handshake },
    { href: "/treds", label: "TReDS Financing", icon: Coins },
    { href: "/credit-safeguards", label: "Credit Limits", icon: ShieldAlert },
    { href: "/reminders", label: "Reminders", icon: Send },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 z-40 lg:hidden transition-opacity duration-200 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-[#E2E8F0] flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand Logo & Name */}
          <div className="h-16 px-5 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-[#0F172A] flex items-center justify-center text-white font-bold text-base shadow-xs group-hover:bg-[#1E293B] transition">
                C
              </div>
              <div>
                <span className="font-bold text-[#0F172A] text-base tracking-tight block">
                  Chanakya
                </span>
                <span className="text-[10px] text-[#64748B] block font-medium">
                  Receivables Overlay
                </span>
              </div>
            </Link>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="p-3 space-y-1">
            <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
              Navigation
            </div>

            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#0F172A] text-white font-semibold shadow-xs"
                      : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#64748B]"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="pt-4">
              <div className="px-3 pb-1.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                Portals &amp; Overview
              </div>
              <Link
                href="/"
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  pathname === "/"
                    ? "bg-[#0F172A] text-white font-semibold shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                }`}
              >
                <Home className="w-4 h-4 text-[#64748B]" />
                <span>Overview</span>
              </Link>

              <Link
                href="/portal/745ddfcf7a0642419b2dcee2b13b9f56"
                target="_blank"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors mt-0.5"
              >
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-4 h-4 text-amber-600" />
                  <span>Buyer Portal</span>
                </div>
                <span className="text-[10px] text-slate-400">Live</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer info card */}
        <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="px-3 py-2.5 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-[#0F172A]">
                Plugin Sync Active
              </span>
            </div>
            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Connected
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

