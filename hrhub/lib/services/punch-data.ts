import api from "../api";
import { getHttpErrorMessage } from "../api-response";
import { PagedResult, downloadBlob, unwrapResponse } from "./api-helpers";

async function postPunchData<T>(path: string): Promise<T> {
  try {
    const response = await api.post<unknown>(path);
    return unwrapResponse<T>(response);
  } catch (error) {
    throw new Error(getHttpErrorMessage(error, "Punch-data request failed"));
  }
}

export type PunchDirection = "In" | "Out" | "Unknown";
export type PunchLogStatus = "Pending" | "Processing" | "Completed" | "Failed";

export interface PunchRecord {
  id: string;
  logFileId: string;
  companyId: number;
  punchNumber: number;
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
  punchNumber: number;
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
  punchNumber?: number;
  direction?: PunchDirection;
  logFileId?: string;
  from?: string;
  to?: string;
}

export type MachineConnectionStatus = "Unknown" | "Connected" | "Disconnected";

export interface PunchMachine {
  id: string;
  companyId: number;
  deviceCode: string;
  deviceName: string;
  machineNo: number;
  ipAddress: string;
  port: number;
  useTcp: boolean;
  productName?: string;
  serialNumber?: string;
  isActive: boolean;
  lastConnectionStatus: MachineConnectionStatus | string;
  lastError?: string;
  lastConnectedAt?: string;
  lastSyncedAt?: string;
  lastSyncRecordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePunchMachinePayload {
  companyId: number;
  deviceCode: string;
  deviceName: string;
  machineNo: number;
  ipAddress: string;
  port: number;
  useTcp?: boolean;
  productName?: string;
  serialNumber?: string;
  password?: number;
  isActive?: boolean;
}

export interface PunchMachineQuery {
  companyId?: number;
  status?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface DeviceSyncHistory {
  id: string;
  companyId: number;
  machineId: string;
  triggerType: string;
  syncStartedAt: string;
  syncEndedAt?: string;
  totalLogs: number;
  newLogs: number;
  duplicateLogs: number;
  failedLogs: number;
  status: string;
  errorMessage?: string;
  logFileId?: string;
}

export interface SyncHistoryQuery {
  companyId?: number;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface MachineConnectionResult {
  connected: boolean;
  checkedAt: string;
  deviceId?: string;
  firmware?: string;
  deviceClock?: string;
  totalRecords: number;
  totalUsers: number;
}

export interface MachineSyncResult {
  history: DeviceSyncHistory;
  logFile?: PunchLogFile;
  process?: {
    processedCount?: number;
    skippedCount?: number;
    errorCount?: number;
  };
  connection?: MachineConnectionResult;
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

  listMachines: async (params: PunchMachineQuery = {}): Promise<PagedResult<PunchMachine>> => {
    const response = await api.get<unknown>("punch-data/machines", { params });
    return unwrapResponse<PagedResult<PunchMachine>>(response);
  },

  saveMachine: async (payload: CreatePunchMachinePayload): Promise<PunchMachine> => {
    const response = await api.post<unknown>("punch-data/machines", payload);
    return unwrapResponse<PunchMachine>(response);
  },

  testConnection: async (machineId: string): Promise<MachineConnectionResult> => {
    return postPunchData<MachineConnectionResult>(
      `punch-data/machines/${encodeURIComponent(machineId)}/connect`,
    );
  },

  syncMachine: async (machineId: string, options?: { useRemote?: boolean }): Promise<MachineSyncResult> => {
    try {
      const params: Record<string, string> = {};
      if (options?.useRemote) {
        params.useRemote = "true";
      }
      const response = await api.post<unknown>(
        `punch-data/machines/${encodeURIComponent(machineId)}/sync`,
        null,
        { params },
      );
      return unwrapResponse<MachineSyncResult>(response);
    } catch (error) {
      throw new Error(getHttpErrorMessage(error, "Machine sync failed"));
    }
  },

  collectRemote: async (data: {
    companyId: number;
    from?: string;
    to?: string;
    batchSize?: number;
  }) => {
    const response = await api.post<unknown>("punch-data/remote/collect", {
      companyId: data.companyId,
      from: data.from,
      to: data.to,
      batchSize: data.batchSize,
    });
    return unwrapResponse<{
      inserted: number;
      duplicates: number;
      remoteRows: number;
      pages: number;
    }>(response);
  },

  listSyncHistories: async (
    params: SyncHistoryQuery = {},
  ): Promise<PagedResult<DeviceSyncHistory>> => {
    const response = await api.get<unknown>("punch-data/sync-histories", { params });
    return unwrapResponse<PagedResult<DeviceSyncHistory>>(response);
  },
};
