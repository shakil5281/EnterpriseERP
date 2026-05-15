import api from "../api";
import { unwrapApiData } from "@/lib/api-response";

const ORG = "Organogram";

/** Organogram list endpoints may return `T[]` or a paged `{ items: T[] }` like other APIs. */
function asArray<T>(data: unknown): T[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data as T[];
  if (typeof data === "object" && data !== null && "items" in data) {
    const items = (data as { items?: unknown }).items;
    if (Array.isArray(items)) return items as T[];
  }
  return [];
}

/** Matches `company.ts` — synthetic int for legacy selects keyed by numeric id. */
function stableIntFromGuid(guid: string): number {
  const hex = guid.replace(/-/g, "").slice(0, 8);
  const n = parseInt(hex, 16);
  return Number.isFinite(n) ? n | 0 : 0;
}

interface CompanySummaryRow {
  id: string;
  companyNameEn: string;
}

async function listCompanySummaries(): Promise<CompanySummaryRow[]> {
  const response = await api.get<unknown>("companies", {
    params: { Page: 1, PageSize: 500 },
  });
  const page = unwrapApiData<{ items: CompanySummaryRow[] }>(response.data);
  return page.items ?? [];
}

async function companyGuidFromLegacyCompanyId(companyId: number): Promise<string | undefined> {
  const rows = await listCompanySummaries();
  return rows.find((c) => stableIntFromGuid(c.id) === companyId)?.id;
}

interface DepartmentApi {
  id: string;
  companyId: string;
  nameEn: string;
  nameBn: string;
  code: string | null;
}

interface SectionApi {
  id: string;
  departmentId: string;
  nameEn: string;
  nameBn: string;
  code: string | null;
}

interface DesignationApi {
  id: string;
  sectionId: string;
  nameEn: string;
  nameBn: string;
  code: string | null;
}

interface LineApi {
  id: string;
  sectionId: string;
  nameEn: string;
  nameBn: string;
  code: string | null;
}

export interface Department {
  id: number;
  entityId: string;
  companyId: string;
  nameEn: string;
  nameBn?: string;
  code?: string;
  companyName?: string;
}

export interface Section {
  id: number;
  entityId: string;
  departmentId: string;
  nameEn: string;
  nameBn?: string;
  code?: string;
  departmentName?: string;
  companyName?: string;
  companyId?: string;
}

export interface Designation {
  id: number;
  entityId: string;
  sectionId: string;
  nameEn: string;
  nameBn?: string;
  code?: string;
  sectionName?: string;
  departmentName?: string;
  companyName?: string;
  nightBill?: number;
  holidayBill?: number;
  attendanceBonus?: number;
  isNightBillEligible?: boolean;
  isStaff?: boolean;
}

export interface Line {
  id: number;
  entityId: string;
  sectionId: string;
  nameEn: string;
  nameBn?: string;
  code?: string;
  sectionName?: string;
  departmentName?: string;
  companyName?: string;
}

export interface Shift {
  id: number;
  nameEn: string;
  nameBn?: string;
  inTime: string;
  outTime: string;
  lateInTime?: string;
  lunchTimeStart?: string;
  lunchHour: number;
  weekends?: string;
  companyId?: number;
  companyName?: string;
  status: string;
}

export interface Group {
  id: number;
  nameEn: string;
  nameBn?: string;
  companyId?: number;
  companyName?: string;
}

export interface Floor {
  id: number;
  nameEn: string;
  nameBn?: string;
  companyId?: number;
  companyName?: string;
}

function mapDepartment(row: DepartmentApi, companyName?: string): Department {
  return {
    id: stableIntFromGuid(row.id),
    entityId: row.id,
    companyId: row.companyId,
    nameEn: row.nameEn,
    nameBn: row.nameBn || undefined,
    code: row.code ?? undefined,
    companyName,
  };
}

function mapSection(
  row: SectionApi,
  extras?: { departmentName?: string; companyName?: string; companyId?: string },
): Section {
  return {
    id: stableIntFromGuid(row.id),
    entityId: row.id,
    departmentId: row.departmentId,
    nameEn: row.nameEn,
    nameBn: row.nameBn || undefined,
    code: row.code ?? undefined,
    ...extras,
  };
}

function mapDesignation(row: DesignationApi, extras?: Partial<Designation>): Designation {
  return {
    id: stableIntFromGuid(row.id),
    entityId: row.id,
    sectionId: row.sectionId,
    nameEn: row.nameEn,
    nameBn: row.nameBn || undefined,
    code: row.code ?? undefined,
    ...extras,
  };
}

function mapLine(row: LineApi, extras?: Partial<Line>): Line {
  return {
    id: stableIntFromGuid(row.id),
    entityId: row.id,
    sectionId: row.sectionId,
    nameEn: row.nameEn,
    nameBn: row.nameBn || undefined,
    code: row.code ?? undefined,
    ...extras,
  };
}

async function fetchDepartmentsForCompany(companyGuid: string, companyName?: string): Promise<Department[]> {
  const response = await api.get<unknown>(
    `${ORG}/companies/${encodeURIComponent(companyGuid)}/departments`,
  );
  const rows = asArray<DepartmentApi>(unwrapApiData<unknown>(response.data));
  return rows.map((r) => mapDepartment(r, companyName));
}

async function fetchSectionsForDepartment(
  departmentGuid: string,
  extras?: { departmentName?: string; companyName?: string; companyId?: string },
): Promise<Section[]> {
  const response = await api.get<unknown>(
    `${ORG}/departments/${encodeURIComponent(departmentGuid)}/sections`,
  );
  const rows = asArray<SectionApi>(unwrapApiData<unknown>(response.data));
  return rows.map((r) => mapSection(r, extras));
}

async function fetchDesignationsForSection(
  sectionGuid: string,
  extras?: Partial<Designation>,
): Promise<Designation[]> {
  const response = await api.get<unknown>(
    `${ORG}/sections/${encodeURIComponent(sectionGuid)}/designations`,
  );
  const rows = asArray<DesignationApi>(unwrapApiData<unknown>(response.data));
  return rows.map((r) => mapDesignation(r, extras));
}

async function fetchLinesForSection(sectionGuid: string, extras?: Partial<Line>): Promise<Line[]> {
  const response = await api.get<unknown>(`${ORG}/sections/${encodeURIComponent(sectionGuid)}/lines`);
  const rows = asArray<LineApi>(unwrapApiData<unknown>(response.data));
  return rows.map((r) => mapLine(r, extras));
}

/** All sections (all companies) — avoids referencing `organogramService` before init. */
async function fetchAllSectionsInternal(): Promise<Section[]> {
  const depts = await allDepartmentsCached();
  const nested = await Promise.all(
    depts.map((d) =>
      fetchSectionsForDepartment(d.entityId, {
        departmentName: d.nameEn,
        companyName: d.companyName,
        companyId: d.companyId,
      }),
    ),
  );
  return nested.flat();
}

async function allDepartmentsCached(): Promise<Department[]> {
  const companies = await listCompanySummaries();
  const nested = await Promise.all(
    companies.map((c) => fetchDepartmentsForCompany(c.id, c.companyNameEn)),
  );
  return nested.flat();
}

async function resolveDepartmentGuid(departmentId: string | number): Promise<string | undefined> {
  if (typeof departmentId === "string" && departmentId.includes("-")) {
    return departmentId;
  }
  const n = typeof departmentId === "string" ? parseInt(departmentId, 10) : departmentId;
  if (!Number.isFinite(n)) return undefined;
  const all = await allDepartmentsCached();
  return all.find((d) => d.id === n)?.entityId;
}

async function resolveSectionGuid(sectionId: string | number): Promise<string | undefined> {
  if (typeof sectionId === "string" && sectionId.includes("-")) {
    return sectionId;
  }
  const n = typeof sectionId === "string" ? parseInt(sectionId, 10) : sectionId;
  if (!Number.isFinite(n)) return undefined;
  const allSections = await fetchAllSectionsInternal();
  return allSections.find((s) => s.id === n)?.entityId;
}

/** Load departments + sections for filter dropdowns (e.g. Company Organogram). */
export async function loadOrganogramLookup(
  companies: { entityId: string; companyNameEn: string }[],
): Promise<{ departments: Department[]; sections: Section[] }> {
  if (!companies.length) return { departments: [], sections: [] };
  const departments = (
    await Promise.all(
      companies.map((c) => fetchDepartmentsForCompany(c.entityId, c.companyNameEn)),
    )
  ).flat();
  const sections = (
    await Promise.all(
      departments.map((d) =>
        fetchSectionsForDepartment(d.entityId, {
          departmentName: d.nameEn,
          companyName: d.companyName,
          companyId: d.companyId,
        }),
      ),
    )
  ).flat();
  return { departments, sections };
}

export const organogramService = {
  getDepartments: async (filters?: { companyId?: string | number }): Promise<Department[]> => {
    if (filters?.companyId === undefined) {
      return allDepartmentsCached();
    }
    const raw = filters.companyId;
    let guid: string | undefined;
    if (typeof raw === "string") {
      guid = raw;
    } else {
      guid = await companyGuidFromLegacyCompanyId(raw);
    }
    if (!guid) return [];
    const row = (await listCompanySummaries()).find((c) => c.id === guid);
    return fetchDepartmentsForCompany(guid, row?.companyNameEn);
  },

  createDepartment: async (data: { nameEn: string; nameBn?: string; companyId: string; code?: string | null }) => {
    const body = {
      id: null as string | null,
      companyId: data.companyId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
      code: data.code ?? null,
    };
    const response = await api.post<unknown>(`${ORG}/departments`, body);
    return unwrapApiData<string>(response.data);
  },

  updateDepartment: async (
    entityId: string,
    data: { nameEn: string; nameBn?: string; companyId: string; code?: string | null },
  ) => {
    const body = {
      id: entityId,
      companyId: data.companyId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
      code: data.code ?? null,
    };
    const response = await api.put<unknown>(`${ORG}/departments`, body);
    return unwrapApiData<string>(response.data);
  },

  deleteDepartment: async (entityId: string) => {
    const response = await api.delete<unknown>(`${ORG}/departments/${encodeURIComponent(entityId)}`);
    return unwrapApiData<string>(response.data);
  },

  getSections: async (filters?: { companyId?: number; departmentId?: string | number }): Promise<Section[]> => {
    void filters?.companyId;
    if (filters?.departmentId === undefined) {
      return fetchAllSectionsInternal();
    }
    const guid = await resolveDepartmentGuid(filters.departmentId);
    if (!guid) return [];
    const d = (await allDepartmentsCached()).find((x) => x.entityId === guid);
    return fetchSectionsForDepartment(guid, {
      departmentName: d?.nameEn,
      companyName: d?.companyName,
      companyId: d?.companyId,
    });
  },

  createSection: async (data: {
    nameEn: string;
    nameBn?: string;
    departmentId: string;
    code?: string | null;
  }) => {
    const body = {
      id: null as string | null,
      departmentId: data.departmentId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
      code: data.code ?? null,
    };
    const response = await api.post<unknown>(`${ORG}/sections`, body);
    return unwrapApiData<string>(response.data);
  },

  updateSection: async (
    entityId: string,
    data: { nameEn: string; nameBn?: string; departmentId: string; code?: string | null },
  ) => {
    const body = {
      id: entityId,
      departmentId: data.departmentId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
      code: data.code ?? null,
    };
    const response = await api.put<unknown>(`${ORG}/sections`, body);
    return unwrapApiData<string>(response.data);
  },

  deleteSection: async (entityId: string) => {
    const response = await api.delete<unknown>(`${ORG}/sections/${encodeURIComponent(entityId)}`);
    return unwrapApiData<string>(response.data);
  },

  getDesignations: async (filters?: {
    companyId?: number;
    departmentId?: string | number;
    sectionId?: string | number;
  }): Promise<Designation[]> => {
    void filters?.companyId;
    void filters?.departmentId;
    if (filters?.sectionId === undefined) {
      const sections = await fetchAllSectionsInternal();
      const nested = await Promise.all(
        sections.map((s) =>
          fetchDesignationsForSection(s.entityId, {
            sectionName: s.nameEn,
            departmentName: s.departmentName,
            companyName: s.companyName,
          }),
        ),
      );
      return nested.flat();
    }
    const guid = await resolveSectionGuid(filters.sectionId);
    if (!guid) return [];
    const s = (await fetchAllSectionsInternal()).find((x) => x.entityId === guid);
    return fetchDesignationsForSection(guid, {
      sectionName: s?.nameEn,
      departmentName: s?.departmentName,
      companyName: s?.companyName,
    });
  },

  createDesignation: async (data: {
    nameEn: string;
    nameBn?: string;
    sectionId: string;
    code?: string | null;
  }) => {
    const body = {
      id: null as string | null,
      sectionId: data.sectionId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
      code: data.code ?? null,
    };
    const response = await api.post<unknown>(`${ORG}/designations`, body);
    return unwrapApiData<string>(response.data);
  },

  updateDesignation: async (
    entityId: string,
    data: { nameEn: string; nameBn?: string; sectionId: string; code?: string | null },
  ) => {
    const body = {
      id: entityId,
      sectionId: data.sectionId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
      code: data.code ?? null,
    };
    const response = await api.put<unknown>(`${ORG}/designations`, body);
    return unwrapApiData<string>(response.data);
  },

  deleteDesignation: async (entityId: string) => {
    const response = await api.delete<unknown>(`${ORG}/designations/${encodeURIComponent(entityId)}`);
    return unwrapApiData<string>(response.data);
  },

  getLines: async (filters?: {
    companyId?: number;
    departmentId?: string | number;
    sectionId?: string | number;
  }): Promise<Line[]> => {
    void filters?.companyId;
    void filters?.departmentId;
    if (filters?.sectionId === undefined) {
      const sections = await fetchAllSectionsInternal();
      const nested = await Promise.all(
        sections.map((s) =>
          fetchLinesForSection(s.entityId, {
            sectionName: s.nameEn,
            departmentName: s.departmentName,
            companyName: s.companyName,
          }),
        ),
      );
      return nested.flat();
    }
    const guid = await resolveSectionGuid(filters.sectionId);
    if (!guid) return [];
    const s = (await fetchAllSectionsInternal()).find((x) => x.entityId === guid);
    return fetchLinesForSection(guid, {
      sectionName: s?.nameEn,
      departmentName: s?.departmentName,
      companyName: s?.companyName,
    });
  },

  createLine: async (data: { nameEn: string; nameBn?: string; sectionId: string; code?: string | null }) => {
    const body = {
      id: null as string | null,
      sectionId: data.sectionId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
      code: data.code ?? null,
    };
    const response = await api.post<unknown>(`${ORG}/lines`, body);
    return unwrapApiData<string>(response.data);
  },

  updateLine: async (
    entityId: string,
    data: { nameEn: string; nameBn?: string; sectionId: string; code?: string | null },
  ) => {
    const body = {
      id: entityId,
      sectionId: data.sectionId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
      code: data.code ?? null,
    };
    const response = await api.put<unknown>(`${ORG}/lines`, body);
    return unwrapApiData<string>(response.data);
  },

  deleteLine: async (entityId: string) => {
    const response = await api.delete<unknown>(`${ORG}/lines/${encodeURIComponent(entityId)}`);
    return unwrapApiData<string>(response.data);
  },

  getShifts: async (params?: { companyName?: string; companyId?: number }) => {
    const response = await api.get<Shift[]>("/shift", { params });
    return response.data;
  },
  getShift: async (id: number) => {
    const response = await api.get<Shift>(`/shift/${id}`);
    return response.data;
  },
  createShift: async (data: {
    nameEn: string;
    nameBn?: string;
    inTime: string;
    outTime: string;
    lateLimit: number;
  }) => {
    const response = await api.post<Shift>("/shift", data);
    return response.data;
  },
  updateShift: async (
    id: number,
    data: { nameEn: string; nameBn?: string; inTime: string; outTime: string; lateLimit: number },
  ) => {
    const response = await api.put<Shift>(`/shift/${id}`, data);
    return response.data;
  },
  deleteShift: async (id: number) => {
    const response = await api.delete(`/shift/${id}`);
    return response.data;
  },

  getGroups: async (params?: { companyName?: string; companyId?: number }) => {
    const response = await api.get<Group[]>(`${ORG}/groups`, { params });
    return response.data;
  },
  createGroup: async (data: { nameEn: string; nameBn?: string; companyId: number; companyName?: string }) => {
    const response = await api.post<Group>(`${ORG}/groups`, data);
    return response.data;
  },
  updateGroup: async (id: number, data: { nameEn: string; nameBn?: string; companyId: number; companyName?: string }) => {
    const response = await api.put(`${ORG}/groups/${id}`, data);
    return response.data;
  },
  deleteGroup: async (id: number) => {
    const response = await api.delete(`${ORG}/groups/${id}`);
    return response.data;
  },

  getFloors: async (params?: { companyName?: string; companyId?: number }) => {
    const response = await api.get<Floor[]>(`${ORG}/floors`, { params });
    return response.data;
  },
  createFloor: async (data: { nameEn: string; nameBn?: string; companyId: number; companyName?: string }) => {
    const response = await api.post<Floor>(`${ORG}/floors`, data);
    return response.data;
  },
  updateFloor: async (id: number, data: { nameEn: string; nameBn?: string; companyId: number; companyName?: string }) => {
    const response = await api.put(`${ORG}/floors/${id}`, data);
    return response.data;
  },
  deleteFloor: async (id: number) => {
    const response = await api.delete(`${ORG}/floors/${id}`);
    return response.data;
  },

  downloadTemplate: async () => {
    const response = await api.get(`${ORG}/export-template`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Organogram_Template.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  importFromExcel: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<ImportResult>(`${ORG}/import`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

export interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  warningCount: number;
  updatedCount: number;
  createdCount: number;
  errors: ImportError[];
  warnings: ImportWarning[];
}

export interface ImportError {
  rowNumber: number;
  field: string;
  message: string;
}

export interface ImportWarning {
  rowNumber: number;
  message: string;
}
