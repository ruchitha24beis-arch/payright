"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Factory, 
  ArrowLeft, 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function SupplierLoginPage() {
  const router = useRouter();
  const { loginSupplier } = useAuth();
  const [email, setEmail] = useState("supplier@apex.in");
  const [password, setPassword] = useState("supplier123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const ok = await loginSupplier(email, password);
      if (ok) {
        router.push("/dashboard");
      } else {
        setError("Invalid supplier credentials. Please verify your email and password.");
      }
    } catch (err: any) {
      setError(err?.message || "Authentication service error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Switch Role / Back to Login Hub</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-blue-500/5">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Factory className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20">
              MSME Supplier Auth
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight">
            MSME Supplier Sign In
          </h2>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            Access statutory trade governance, Section 43B(h) recovery, and commercial settlement tools.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Registered Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="accounts@apexprecision.in"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/20 transition disabled:opacity-50"
              >
                {loading ? "Authenticating Supplier..." : "Sign In to Supplier Workspace"}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials Preview */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-xs text-slate-400">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300">Demo MSME Supplier Account:</span>
              <button
                type="button"
                onClick={() => {
                  setEmail("supplier@apex.in");
                  setPassword("supplier123");
                }}
                className="text-[11px] text-blue-400 hover:underline"
              >
                Auto-Fill
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 font-mono text-[11px] space-y-1">
              <div>Email: <span className="text-slate-200">supplier@apex.in</span></div>
              <div>Password: <span className="text-slate-200">supplier123</span></div>
              <div className="text-[10px] text-slate-500">Company: Apex Precision Engineering (Micro Enterprise)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
