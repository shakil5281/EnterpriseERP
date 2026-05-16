import api from "../api";
import { unwrapApiData } from "@/lib/api-response";
import { unwrapResponse } from "./api-helpers";

function stableIntFromGuid(guid: string): number {
  const hex = guid.replace(/-/g, "").slice(0, 8);
  const n = parseInt(hex, 16);
  return Number.isFinite(n) ? (n | 0) : 0;
}

/** List row + forms. `id` is a stable synthetic int for legacy UI; `entityId` is the API Guid. */
export interface Company {
  id: number;
  entityId: string;
  companyNameEn: string;
  companyNameBn: string;
  addressEn: string;
  addressBn: string;
  phoneNumber: string;
  registrationNo: string;
  industry: string;
  email: string;
  status: string;
  founded: number;
  branch: number;
  logoPath?: string;
  authorizeSignaturePath?: string;
}

interface CompanySummaryApi {
  id: string;
  companyNameEn: string;
  status: string;
}

interface PagedResultApi<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

interface CompanyDetailsApi {
  id: string;
  companyNameEn: string;
  companyNameBn?: string | null;
  addressEn?: string | null;
  addressBn?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  tradeLicenseNo?: string | null;
  bin?: string | null;
  tin?: string | null;
  logoUrl?: string | null;
  status: string;
  createdAt: string;
}

function mapSummaryToCompany(row: CompanySummaryApi): Company {
  return {
    id: stableIntFromGuid(row.id),
    entityId: row.id,
    companyNameEn: row.companyNameEn,
    companyNameBn: "",
    addressEn: "",
    addressBn: "",
    phoneNumber: "",
    registrationNo: "",
    industry: "-",
    email: "",
    status: row.status,
    founded: new Date().getFullYear(),
    branch: 1,
    logoPath: undefined,
    authorizeSignaturePath: undefined,
  };
}

function mapDetailsToCompany(d: CompanyDetailsApi): Company {
  const created = d.createdAt ? new Date(d.createdAt) : new Date();
  return {
    id: stableIntFromGuid(d.id),
    entityId: d.id,
    companyNameEn: d.companyNameEn,
    companyNameBn: d.companyNameBn ?? "",
    addressEn: d.addressEn ?? "",
    addressBn: d.addressBn ?? "",
    phoneNumber: d.phone ?? "",
    registrationNo: d.tradeLicenseNo ?? "",
    industry: "-",
    email: d.email ?? "",
    status: d.status,
    founded: Number.isFinite(created.getFullYear()) ? created.getFullYear() : new Date().getFullYear(),
    branch: 1,
    logoPath: d.logoUrl ?? undefined,
    authorizeSignaturePath: undefined,
  };
}

function readFormString(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export interface AssignCompanyDto {
  userId: string;
  companyIds: number[];
}

export interface UserCompanyAccess {
  id: string;
  companyId: number;
  isDefaultCompany: boolean;
}

export const companyService = {
  getPage: async (params: { Page?: number; PageSize?: number } = {}): Promise<PagedResultApi<CompanySummaryApi>> => {
    const response = await api.get<unknown>("companies", {
      params: { Page: params.Page ?? 1, PageSize: params.PageSize ?? 20 },
    });
    return unwrapApiData<PagedResultApi<CompanySummaryApi>>(response.data);
  },

  getAll: async (): Promise<Company[]> => {
    const response = await api.get<unknown>("companies", {
      params: { Page: 1, PageSize: 200 },
    });
    const page = unwrapApiData<PagedResultApi<CompanySummaryApi>>(response.data);
    return (page.items ?? []).map(mapSummaryToCompany);
  },

  getById: async (id: string): Promise<Company> => {
    const response = await api.get<unknown>(`companies/${encodeURIComponent(id)}`);
    const dto = unwrapApiData<CompanyDetailsApi>(response.data);
    return mapDetailsToCompany(dto);
  },

  /** Create from browser form (JSON to match `CompaniesController`). */
  create: async (form: FormData): Promise<string> => {
    const body = {
      companyNameEn: readFormString(form, "companyNameEn"),
      companyNameBn: readFormString(form, "companyNameBn") || null,
      addressEn: readFormString(form, "addressEn") || null,
      addressBn: readFormString(form, "addressBn") || null,
      email: readFormString(form, "email") || null,
      phone: readFormString(form, "phoneNumber") || null,
      website: null as string | null,
      tradeLicenseNo: readFormString(form, "registrationNo") || null,
      bin: null as string | null,
      tin: null as string | null,
      logoUrl: null as string | null,
    };
    const response = await api.post<unknown>("companies", body);
    return unwrapApiData<string>(response.data);
  },

  /** Update from browser form (JSON to match `CompaniesController`). */
  update: async (id: string, form: FormData): Promise<void> => {
    const body = {
      companyNameEn: readFormString(form, "companyNameEn"),
      companyNameBn: readFormString(form, "companyNameBn") || null,
      addressEn: readFormString(form, "addressEn") || null,
      addressBn: readFormString(form, "addressBn") || null,
      email: readFormString(form, "email") || null,
      phone: readFormString(form, "phoneNumber") || null,
      website: null as string | null,
      tradeLicenseNo: readFormString(form, "registrationNo") || null,
      bin: null as string | null,
      tin: null as string | null,
      logoUrl: null as string | null,
      status: readFormString(form, "status") || "Active",
    };
    await api.put(`companies/${encodeURIComponent(id)}`, body);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`companies/${encodeURIComponent(id)}`);
  },

  setUserCompanies: async (userId: string, items: { companyId: number; isDefaultCompany: boolean }[]) => {
    const response = await api.post<unknown>(`users/${encodeURIComponent(userId)}/companies`, { items });
    return unwrapResponse<UserCompanyAccess[]>(response);
  },

  getMyCompanies: async () => {
    const response = await api.get<unknown>("auth/me/companies");
    return unwrapResponse<UserCompanyAccess[]>(response);
  },

  assignToUser: async (data: AssignCompanyDto) => {
    return companyService.setUserCompanies(
      data.userId,
      data.companyIds.map((companyId, index) => ({ companyId, isDefaultCompany: index === 0 })),
    );
  },

  getUserCompanies: async (userId: string) => {
    void userId;
    const rows = await companyService.getMyCompanies();
    return rows.map((row) => ({
      id: row.companyId,
      companyId: row.companyId,
      isDefaultCompany: row.isDefaultCompany,
    }));
  },
};
