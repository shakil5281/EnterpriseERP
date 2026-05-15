import axios from "axios";
import api from "../api";
import { unwrapApiData } from "@/lib/api-response";

/** Matches Swagger: `/api/v1/Addresses/...` (capital A, plural). */
const ADDR = "Addresses";

function asArray<T>(data: unknown): T[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data as T[];
  if (typeof data === "object" && data !== null && "items" in data) {
    const items = (data as { items?: unknown }).items;
    if (Array.isArray(items)) return items as T[];
  }
  return [];
}

function parseList<T>(responseData: unknown): T[] {
  const raw = unwrapApiData<unknown>(responseData);
  return asArray<T>(raw);
}

function idPath(id: number | string): string {
  return encodeURIComponent(String(id));
}

function is404(e: unknown): boolean {
  return axios.isAxiosError(e) && e.response?.status === 404;
}

/** Unwrap mutation responses; tolerate empty 204 bodies. */
function writeMutation(responseData: unknown): unknown {
  if (responseData === undefined || responseData === null || responseData === "") {
    return undefined;
  }
  return unwrapApiData<unknown>(responseData);
}

export interface Country {
  id: number;
  nameEn: string;
  nameBn?: string;
}

export interface Division {
  id: number;
  nameEn: string;
  nameBn?: string;
  countryId: number;
  countryName?: string;
}

export interface District {
  id: number;
  nameEn: string;
  nameBn?: string;
  divisionId: number;
  divisionName?: string;
}

export interface Thana {
  id: number;
  nameEn: string;
  nameBn?: string;
  districtId: number;
  districtName?: string;
}

export interface PostOffice {
  id: number;
  nameEn: string;
  nameBn?: string;
  code: string;
  districtId: number;
  districtName?: string;
}

async function getDivisionsForCountry(countryId: number): Promise<Division[]> {
  const response = await api.get<unknown>(`${ADDR}/countries/${idPath(countryId)}/divisions`);
  return parseList<Division>(response.data);
}

async function getDistrictsForDivision(divisionId: number): Promise<District[]> {
  const response = await api.get<unknown>(`${ADDR}/divisions/${idPath(divisionId)}/districts`);
  return parseList<District>(response.data);
}

async function getThanasForDistrict(districtId: number): Promise<Thana[]> {
  try {
    const response = await api.get<unknown>(`${ADDR}/districts/${idPath(districtId)}/thanas`);
    return parseList<Thana>(response.data);
  } catch (e) {
    if (!is404(e)) throw e;
    const response = await api.get<unknown>(`${ADDR}/thanas`, { params: { districtId } });
    return parseList<Thana>(response.data);
  }
}

export const addressService = {
  // Countries — GET/POST/PUT `/Addresses/countries`, DELETE `/Addresses/countries/{id}`
  getCountries: async () => {
    const response = await api.get<unknown>(`${ADDR}/countries`);
    return parseList<Country>(response.data);
  },
  createCountry: async (data: { nameEn: string; nameBn?: string }) => {
    const body = {
      id: null as number | null,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
    };
    const response = await api.post<unknown>(`${ADDR}/countries`, body);
    return writeMutation(response.data);
  },
  updateCountry: async (id: number, data: { nameEn: string; nameBn?: string }) => {
    const response = await api.put<unknown>(`${ADDR}/countries`, {
      id,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
    });
    return writeMutation(response.data);
  },
  deleteCountry: async (id: number) => {
    const response = await api.delete<unknown>(`${ADDR}/countries/${idPath(id)}`);
    return writeMutation(response.data);
  },

  // Divisions — GET `/Addresses/countries/{countryId}/divisions`, POST/PUT `/Addresses/divisions`, DELETE `/Addresses/divisions/{id}`
  getDivisions: async (countryId?: number) => {
    if (countryId !== undefined && countryId !== null && !Number.isNaN(countryId)) {
      const rows = await getDivisionsForCountry(countryId);
      const country = (await addressService.getCountries()).find((c) => c.id === countryId);
      const countryName = country?.nameEn;
      return rows.map((d) => ({
        ...d,
        countryId: d.countryId ?? countryId,
        countryName: d.countryName ?? countryName,
      }));
    }
    const countries = await addressService.getCountries();
    const nested = await Promise.all(
      countries.map(async (c) => {
        const rows = await getDivisionsForCountry(c.id);
        return rows.map((d) => ({
          ...d,
          countryId: d.countryId ?? c.id,
          countryName: d.countryName ?? c.nameEn,
        }));
      }),
    );
    return nested.flat();
  },
  createDivision: async (data: { nameEn: string; nameBn?: string; countryId: number }) => {
    const body = {
      id: null as number | null,
      countryId: data.countryId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
    };
    const response = await api.post<unknown>(`${ADDR}/divisions`, body);
    return writeMutation(response.data);
  },
  updateDivision: async (id: number, data: { nameEn: string; nameBn?: string; countryId: number }) => {
    const response = await api.put<unknown>(`${ADDR}/divisions`, {
      id,
      countryId: data.countryId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
    });
    return writeMutation(response.data);
  },
  deleteDivision: async (id: number) => {
    const response = await api.delete<unknown>(`${ADDR}/divisions/${idPath(id)}`);
    return writeMutation(response.data);
  },

  // Districts — GET `/Addresses/divisions/{divisionId}/districts`, POST/PUT `/Addresses/districts`, DELETE `/Addresses/districts/{id}`
  getDistricts: async (divisionId?: number) => {
    if (divisionId !== undefined && divisionId !== null && !Number.isNaN(divisionId)) {
      const rows = await getDistrictsForDivision(divisionId);
      return rows.map((r) => ({
        ...r,
        divisionId: r.divisionId ?? divisionId,
      }));
    }
    const divisions = await addressService.getDivisions();
    const nested = await Promise.all(
      divisions.map(async (div) => {
        const rows = await getDistrictsForDivision(div.id);
        return rows.map((r) => ({
          ...r,
          divisionId: r.divisionId ?? div.id,
          divisionName: r.divisionName ?? div.nameEn,
        }));
      }),
    );
    return nested.flat();
  },
  createDistrict: async (data: { nameEn: string; nameBn?: string; divisionId: number }) => {
    const body = {
      id: null as number | null,
      divisionId: data.divisionId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
    };
    const response = await api.post<unknown>(`${ADDR}/districts`, body);
    return writeMutation(response.data);
  },
  updateDistrict: async (id: number, data: { nameEn: string; nameBn?: string; divisionId: number }) => {
    const response = await api.put<unknown>(`${ADDR}/districts`, {
      id,
      divisionId: data.divisionId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
    });
    return writeMutation(response.data);
  },
  deleteDistrict: async (id: number) => {
    const response = await api.delete<unknown>(`${ADDR}/districts/${idPath(id)}`);
    return writeMutation(response.data);
  },

  /**
   * Thanas — GET `/Addresses/districts/{districtId}/thanas` (nested, same style as divisions/districts).
   * Without `districtId`: GET `/Addresses/thanas` (list all, if supported by API).
   */
  getThanas: async (districtId?: number) => {
    if (districtId !== undefined && districtId !== null && !Number.isNaN(districtId)) {
      const rows = await getThanasForDistrict(districtId);
      return rows.map((t) => ({
        ...t,
        districtId: t.districtId ?? districtId,
      }));
    }
    const response = await api.get<unknown>(`${ADDR}/thanas`);
    return parseList<Thana>(response.data);
  },
  createThana: async (data: { nameEn: string; nameBn?: string; districtId: number }) => {
    const body = {
      id: null as number | null,
      districtId: data.districtId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
    };
    const response = await api.post<unknown>(`${ADDR}/thanas`, body);
    return writeMutation(response.data);
  },
  updateThana: async (id: number, data: { nameEn: string; nameBn?: string; districtId: number }) => {
    const response = await api.put<unknown>(`${ADDR}/thanas`, {
      id,
      districtId: data.districtId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
    });
    return writeMutation(response.data);
  },
  deleteThana: async (id: number) => {
    const response = await api.delete<unknown>(`${ADDR}/thanas/${idPath(id)}`);
    return writeMutation(response.data);
  },

  /**
   * Post offices — nested GETs aligned with address hierarchy:
   * - `districtId`: GET `/Addresses/districts/{id}/postoffices`
   * - `thanaId`: GET `/Addresses/thanas/{id}/postoffices`
   * - neither: GET `/Addresses/postoffices`
   */
  getPostOffices: async (filters?: { districtId?: number; thanaId?: number }) => {
    if (filters?.districtId != null && !Number.isNaN(filters.districtId)) {
      const did = filters.districtId;
      try {
        const response = await api.get<unknown>(`${ADDR}/districts/${idPath(did)}/postoffices`);
        return parseList<PostOffice>(response.data);
      } catch (e) {
        if (!is404(e)) throw e;
        const response = await api.get<unknown>(`${ADDR}/postoffices`, { params: { districtId: did } });
        return parseList<PostOffice>(response.data);
      }
    }
    if (filters?.thanaId != null && !Number.isNaN(filters.thanaId)) {
      const tid = filters.thanaId;
      try {
        const response = await api.get<unknown>(`${ADDR}/thanas/${idPath(tid)}/postoffices`);
        return parseList<PostOffice>(response.data);
      } catch (e) {
        if (!is404(e)) throw e;
        const response = await api.get<unknown>(`${ADDR}/postoffices`, { params: { thanaId: tid } });
        return parseList<PostOffice>(response.data);
      }
    }
    const response = await api.get<unknown>(`${ADDR}/postoffices`);
    return parseList<PostOffice>(response.data);
  },

  createPostOffice: async (data: { nameEn: string; nameBn?: string; code: string; districtId: number }) => {
    const body = {
      id: null as number | null,
      districtId: data.districtId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
      code: data.code,
    };
    const response = await api.post<unknown>(`${ADDR}/postoffices`, body);
    return writeMutation(response.data);
  },
  updatePostOffice: async (
    id: number,
    data: { nameEn: string; nameBn?: string; code: string; districtId: number },
  ) => {
    const response = await api.put<unknown>(`${ADDR}/postoffices`, {
      id,
      districtId: data.districtId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
      code: data.code,
    });
    return writeMutation(response.data);
  },
  deletePostOffice: async (id: number) => {
    const response = await api.delete<unknown>(`${ADDR}/postoffices/${idPath(id)}`);
    return writeMutation(response.data);
  },

  exportTemplate: async () => {
    const response = await api.get(`${ADDR}/export-template`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Address_Template.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  exportDemo: async () => {
    const response = await api.get(`${ADDR}/export-demo`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Address_Demo_Data.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  importExcel: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<unknown>(`${ADDR}/import`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return unwrapApiData<unknown>(response.data);
  },
};
