"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";

export interface CompanyProfile {
  id: number;
  name: string;
  gstin: string;
  udyam_reg_number?: string | null;
  udyam_verified: boolean;
  udyam_verified_at?: string | null;
  enterprise_category: string;
  enterprise_class: string;
  major_activity: string;
  credit_limit: number;
  is_tax_loss: boolean;
  contact_person?: string | null;
  email: string;
  phone?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
  corporate_tax_rate: number;
  sec_43bh_eligible: boolean;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  company_id?: number | null;
  company?: CompanyProfile | null;
  token?: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: string;
  company_name: string;
  gstin: string;
  udyam_reg_number?: string;
  enterprise_class?: string;
  major_activity?: string;
  phone?: string;
  contact_person?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  company: CompanyProfile | null;
  token: string | null;
  loading: boolean;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  login: (email: string, password: string) => Promise<boolean>;
  loginSupplier: (email: string, password: string) => Promise<boolean>;
  loginBuyer: (email: string, password: string) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<boolean>;
  logout: () => void;
  updateCompany: (data: Partial<CompanyProfile>) => Promise<boolean>;
  clearDemoData: () => Promise<boolean>;
  resetDemoData: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  dataMode: "LIVE" | "DEMO";
  setDataMode: (mode: "LIVE" | "DEMO") => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [dataMode, setDataMode] = useState<"LIVE" | "DEMO">("LIVE");

  // Load active user profile on mount
  async function refreshProfile() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        if (data.company) {
          setCompany(data.company);
        }
        if (data.token) {
          setToken(data.token);
          localStorage.setItem("chanakya_token", data.token);
        }
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        if (data.company) setCompany(data.company);
        if (data.token) {
          setToken(data.token);
          localStorage.setItem("chanakya_token", data.token);
        }
        setAuthModalOpen(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Login failed:", err);
      return false;
    }
  };

  const loginSupplier = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/supplier/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        if (data.company) setCompany(data.company);
        if (data.token) {
          setToken(data.token);
          localStorage.setItem("chanakya_token", data.token);
          localStorage.setItem("chanakya_role", "SUPPLIER");
          if (typeof document !== "undefined") {
            document.cookie = `chanakya_token=${data.token}; path=/; max-age=604800`;
            document.cookie = `chanakya_role=SUPPLIER; path=/; max-age=604800`;
          }
        }
        setAuthModalOpen(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Supplier login failed:", err);
      return false;
    }
  };

  const loginBuyer = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/buyer/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        if (data.company) setCompany(data.company);
        if (data.token) {
          setToken(data.token);
          localStorage.setItem("chanakya_token", data.token);
          localStorage.setItem("chanakya_role", "BUYER");
          if (typeof document !== "undefined") {
            document.cookie = `chanakya_token=${data.token}; path=/; max-age=604800`;
            document.cookie = `chanakya_role=BUYER; path=/; max-age=604800`;
          }
        }
        setAuthModalOpen(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Buyer login failed:", err);
      return false;
    }
  };

  const register = async (payload: RegisterPayload): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        if (data.company) setCompany(data.company);
        if (data.token) {
          setToken(data.token);
          localStorage.setItem("chanakya_token", data.token);
        }
        setAuthModalOpen(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Registration failed:", err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setCompany(null);
    setToken(null);
    localStorage.removeItem("chanakya_token");
    localStorage.removeItem("chanakya_role");
    if (typeof document !== "undefined") {
      document.cookie = "chanakya_token=; path=/; max-age=0";
      document.cookie = "chanakya_role=; path=/; max-age=0";
    }
    setAuthModalOpen(true);
  };

  const updateCompany = async (data: Partial<CompanyProfile>): Promise<boolean> => {
    try {
      const companyId = company?.id;
      const url = companyId 
        ? `${API_BASE_URL}/api/v1/auth/company?company_id=${companyId}`
        : `${API_BASE_URL}/api/v1/auth/company`;

      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const result = await res.json();
        if (result.company) {
          setCompany(result.company);
          if (user) {
            setUser({ ...user, company: result.company });
          }
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error("Update company profile failed:", err);
      return false;
    }
  };

  const clearDemoData = async (): Promise<boolean> => {
    try {
      const companyId = company?.id;
      const url = companyId
        ? `${API_BASE_URL}/api/v1/auth/clear-demo-data?keep_company_id=${companyId}`
        : `${API_BASE_URL}/api/v1/auth/clear-demo-data`;

      const res = await fetch(url, { method: "POST" });
      if (res.ok) {
        setDataMode("LIVE");
        return true;
      }
      return false;
    } catch (err) {
      console.error("Clear demo data failed:", err);
      return false;
    }
  };

  const resetDemoData = async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/reset-demo-data`, { method: "POST" });
      if (res.ok) {
        setDataMode("DEMO");
        await refreshProfile();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Reset demo data failed:", err);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        token,
        loading,
        authModalOpen,
        setAuthModalOpen,
        login,
        loginSupplier,
        loginBuyer,
        register,
        logout,
        updateCompany,
        clearDemoData,
        resetDemoData,
        refreshProfile,
        dataMode,
        setDataMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
