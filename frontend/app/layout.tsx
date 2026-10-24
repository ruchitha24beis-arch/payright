import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chanakya | MSME Commercial Preservation & Payment Recovery (LS-03)",
  description: "Recover overdue MSME receivables while 100% preserving corporate relationships via Section 43B(h), EMI installments, pro-rata releases, and silent TReDS discounting.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F8FAFC] text-[#0F172A] min-h-screen font-sans antialiased selection:bg-[#2563EB] selection:text-white">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
