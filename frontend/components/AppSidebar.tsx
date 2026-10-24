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
  ShieldCheck,
  Building2,
  X
} from "lucide-react";

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AppSidebar({ isOpen = true, onClose }: AppSidebarProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/invoices/health-check", label: "Doc Health Inspector", icon: FileCheck2 },
    { href: "/settlement-builder", label: "Settlement & EMI Builder", icon: Handshake },
    { href: "/treds", label: "Silent TReDS Factoring", icon: Coins },
    { href: "/credit-safeguards", label: "Credit Safeguards", icon: ShieldAlert },
    { href: "/reminders", label: "Diplomatic Reminders", icon: Send },
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
              <div className="w-9 h-9 rounded-xl bg-[#163A5F] flex items-center justify-center text-white font-bold text-base shadow-xs group-hover:bg-[#102B47] transition">
                C
              </div>
              <div>
                <span className="font-bold text-[#163A5F] text-base tracking-tight block">
                  Chanakya
                </span>
                <span className="text-[10px] text-[#64748B] block font-medium -mt-0.5">
                  MSME Commercial Recovery
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
            <div className="px-3 py-2 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
              Commercial Engine
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
                      ? "bg-[#163A5F] text-white font-semibold shadow-xs"
                      : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#64748B]"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="pt-3">
              <div className="px-3 py-2 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Overview & Portal
              </div>
              <Link
                href="/"
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  pathname === "/"
                    ? "bg-[#163A5F] text-white font-semibold shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                }`}
              >
                <Home className="w-4 h-4 text-[#64748B]" />
                <span>Executive Overview</span>
              </Link>

              <Link
                href="/portal/745ddfcf7a0642419b2dcee2b13b9f56"
                target="_blank"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors mt-0.5"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>Buyer Portal Preview</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer info card */}
        <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span className="text-[11px] font-bold text-[#163A5F]">
                Sec 43B(h) Engine Active
              </span>
            </div>
            <p className="text-[10px] text-[#64748B] leading-tight">
              30% Tax deduction disallowance penalty calculation enforced for FY 2024-25.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
