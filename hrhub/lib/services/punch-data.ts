import api from "../api";
import { PagedResult, downloadBlob, unwrapResponse } from "./api-helpers";

export type PunchDirection = "In" | "Out" | "Unknown";
export type PunchLogStatus = "Pending" | "Processing" | "Completed" | "Failed";

export interface PunchRecord {
  id: string;
  logFileId: string;
  companyId: number;
  employeeCode: string;
  deviceId: string;
  punchTime: string;
  direction: PunchDirection;
  source: string;
  createdAt: string;
}

export interface PunchLogFile {
  id: string;
  fileName: string;
  sourceType: string;
  contentType: string;
  deviceId: string;
  companyId: number;
  sizeBytes: number;
  rowCount: number;
  status: PunchLogStatus;
  errorMessage?: string;
  uploadedAt: string;
  processedAt?: string;
}

export interface PunchRecordInput {
  employeeCode: string;
  punchTime: string;
  deviceId?: string;
  deviceSerial?: string;
  direction?: PunchDirection;
  source?: string;
}

export interface PunchBatchPayload {
  companyId?: number;
  deviceId?: string;
  source?: string;
  records: PunchRecordInput[];
}

export interface PunchProcessResult {
  logFileId: string;
  processedCount: number;
  skippedCount?: number;
  errorCount?: number;
  message?: string;
}

export interface PunchLogQuery {
  companyId?: number;
  deviceId?: string;
  status?: PunchLogStatus;
  page?: number;
  pageSize?: number;
}

export interface PunchQuery extends PunchLogQuery {
  employeeCode?: string;
  direction?: PunchDirection;
  logFileId?: string;
  from?: string;
  to?: string;
}

export const punchDataService = {
  uploadLog: async (
    file: File,
    data: { companyId?: number; deviceId?: string; autoProcess?: boolean } = {},
  ): Promise<PunchLogFile> => {
    const form = new FormData();
    form.append("file", file);
    if (data.companyId !== undefined) form.append("companyId", String(data.companyId));
    if (data.deviceId) form.append("deviceId", data.deviceId);
    if (data.autoProcess !== undefined) form.append("autoProcess", String(data.autoProcess));

    const response = await api.post<unknown>("punch-data/logs/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrapResponse<PunchLogFile>(response);
  },

  createBatch: async (payload: PunchBatchPayload, autoProcess = true): Promise<PunchLogFile> => {
    const response = await api.post<unknown>("punch-data/logs/batch", payload, {
      params: { autoProcess },
    });
    return unwrapResponse<PunchLogFile>(response);
  },

  getLogs: async (params: PunchLogQuery = {}): Promise<PagedResult<PunchLogFile>> => {
    const response = await api.get<unknown>("punch-data/logs", { params });
    return unwrapResponse<PagedResult<PunchLogFile>>(response);
  },

  getLog: async (id: string): Promise<PunchLogFile> => {
    const response = await api.get<unknown>(`punch-data/logs/${encodeURIComponent(id)}`);
    return unwrapResponse<PunchLogFile>(response);
  },

  downloadLog: async (id: string, fileName = "punch-log.bin"): Promise<void> => {
    const response = await api.get(`punch-data/logs/${encodeURIComponent(id)}/download`, {
      responseType: "blob",
    });
    downloadBlob(response.data, fileName);
  },

  getLogRecords: async (
    id: string,
    params: Pick<PunchQuery, "page" | "pageSize"> = {},
  ): Promise<PagedResult<PunchRecord>> => {
    const response = await api.get<unknown>(`punch-data/logs/${encodeURIComponent(id)}/records`, {
      params,
    });
    return unwrapResponse<PagedResult<PunchRecord>>(response);
  },

  processLog: async (id: string): Promise<PunchProcessResult> => {
    const response = await api.post<unknown>(`punch-data/logs/${encodeURIComponent(id)}/process`);
    return unwrapResponse<PunchProcessResult>(response);
  },

  processPending: async (limit = 50): Promise<PunchProcessResult[]> => {
    const response = await api.post<unknown>("punch-data/process", null, { params: { limit } });
    return unwrapResponse<PunchProcessResult[]>(response);
  },

  getPunches: async (params: PunchQuery = {}): Promise<PagedResult<PunchRecord>> => {
    const response = await api.get<unknown>("punch-data/punches", { params });
    return unwrapResponse<PagedResult<PunchRecord>>(response);
  },
};
