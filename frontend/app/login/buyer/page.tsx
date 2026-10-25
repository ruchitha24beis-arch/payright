"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  ArrowLeft, 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound,
  AlertCircle,
  Coins
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function BuyerLoginPage() {
  const router = useRouter();
  const { loginBuyer } = useAuth();
  const [email, setEmail] = useState("buyer@tatamotors.com");
  const [password, setPassword] = useState("buyer123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const ok = await loginBuyer(email, password);
      if (ok) {
        router.push("/buyer/dashboard");
      } else {
        setError("Invalid corporate buyer credentials. Please verify your email and password.");
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-indigo-500/5">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
              Corporate AP Portal
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight">
            Corporate Buyer AP Sign In
          </h2>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            Enterprise treasury access for accounts payable reconciliation, prompt discount capture, and 43B(h) compliance.
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
                Corporate Treasury Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ap.treasury@tatamotors.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
              >
                {loading ? "Authenticating Treasury..." : "Sign In to Corporate AP Desk"}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials Preview */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-xs text-slate-400">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300">Demo Corporate Account:</span>
              <button
                type="button"
                onClick={() => {
                  setEmail("buyer@tatamotors.com");
                  setPassword("buyer123");
                }}
                className="text-[11px] text-indigo-400 hover:underline"
              >
                Auto-Fill
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 font-mono text-[11px] space-y-1">
              <div>Email: <span className="text-slate-200">buyer@tatamotors.com</span></div>
              <div>Password: <span className="text-slate-200">buyer123</span></div>
              <div className="text-[10px] text-slate-500">Company: Tata Motors Commercial Vehicles (Large Enterprise)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
