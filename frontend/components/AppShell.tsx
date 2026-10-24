"use client";

import { useState, Suspense } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isGuestPortal = pathname?.startsWith("/portal");

  // Whitelabel Corporate Buyer Guest Portal Layout
  if (isGuestPortal) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
        {/* Clean Corporate Buyer Header */}
        <header className="bg-white border-b border-[#E2E8F0] px-4 sm:px-8 py-3.5 sticky top-0 z-50 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#163A5F] text-white flex items-center justify-center font-bold text-base shadow-xs">
                CP
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-sm sm:text-base text-[#0F172A] tracking-tight">
                    Corporate Buyer Settlement &amp; Reconciliation Desk
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Sec 43B(h) Verified
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Direct Enterprise Settlement, Prompt Payment Discounts, and Tax Disallowance Prevention
                </p>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="text-xs text-[#163A5F] hover:text-[#2563EB] font-semibold flex items-center gap-1.5 bg-[#F8FAFC] hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-[#E2E8F0] transition"
            >
              <span>Vendor Backoffice</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Portal Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Portal Footer */}
        <footer className="border-t border-[#E2E8F0] bg-white py-4 text-center text-xs text-[#64748B]">
          <p>
            Chanakya Commercial Preservation Platform &bull; Authorized Corporate Settlement Link &bull; Sec 43B(h) Income Tax Act &amp; MSMED Act 2006
          </p>
        </footer>
      </div>
    );
  }

  // Standard Backoffice SaaS Layout
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      {/* Sidebar */}
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <AppHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        <footer className="border-t border-[#E2E8F0] bg-white py-4 px-6 text-center text-xs text-[#64748B]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>
              Chanakya MSME Commercial Preservation (LS-03) &bull; Built strictly on Section 43B(h), Section 16 MSMED Act, and RBI TReDS Framework
            </p>
            <p className="text-[11px] text-[#64748B]">
              Non-Litigious Recovery Engine &bull; FY 2024-25 Active
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC]" />}>
      <AppShellContent>{children}</AppShellContent>
    </Suspense>
  );
}
