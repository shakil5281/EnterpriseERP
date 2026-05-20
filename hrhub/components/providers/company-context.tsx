"use client";

import * as React from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { companyService, type Company } from "@/lib/services/company";

import {
  ACTIVE_KEY,
  setActiveCompanyId as persistActiveCompanyId,
  syncActiveCompanyStorage,
} from "@/lib/active-company-storage";

const STORAGE_KEY = ACTIVE_KEY;

type CompanyContextValue = {
  companies: Company[];
  activeCompanyId: string | null;
  setActiveCompanyId: (id: string) => void;
  loading: boolean;
  isSuperAdmin: boolean;
};

const CompanyContext = React.createContext<CompanyContextValue | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyIdState] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const isSuperAdmin = !!user?.roles?.includes("SuperAdmin");

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!user) {
        setCompanies([]);
        setActiveCompanyIdState(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const list = isSuperAdmin
          ? await companyService.getAll()
          : await companyService.getMine();
        if (cancelled) return;

        setCompanies(list);
        syncActiveCompanyStorage({
          allowedCompanyIds: user.assignedCompanyIds ?? list.map((c) => c.entityId),
          defaultCompanyId: user.defaultCompanyId ?? user.assignedCompanyIds?.[0] ?? null,
          isSuperAdmin,
        });
        const stored =
          typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
        const defaultFromProfile = user.defaultCompanyId ?? user.assignedCompanyIds?.[0] ?? null;
        const valid =
          stored && list.some((c) => c.entityId === stored)
            ? stored
            : defaultFromProfile && list.some((c) => c.entityId === defaultFromProfile)
              ? defaultFromProfile
              : list[0]?.entityId ?? null;

        setActiveCompanyIdState(valid);
        if (valid) {
          persistActiveCompanyId(valid);
        }
      } catch (e) {
        console.error("Failed to load companies", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user, isSuperAdmin]);

  const setActiveCompanyId = React.useCallback((id: string) => {
    setActiveCompanyIdState(id);
    persistActiveCompanyId(id);
  }, []);

  return (
    <CompanyContext.Provider
      value={{ companies, activeCompanyId, setActiveCompanyId, loading, isSuperAdmin }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompanyContext() {
  const ctx = React.useContext(CompanyContext);
  if (!ctx) {
    throw new Error("useCompanyContext must be used within CompanyProvider");
  }
  return ctx;
}
