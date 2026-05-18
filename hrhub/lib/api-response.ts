/** Matches EnterpriseERP ApiResponse<T> (Auth + BuildingBlocks). */
export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  traceId?: string;
  data?: T;
  errors?: Array<{ code?: string; message?: string } | string>;
}

export function unwrapApiData<T>(body: unknown): T {
  const envelope = body as ApiEnvelope<T>;
  if (!envelope || typeof envelope !== "object") {
    throw new Error("Invalid API response");
  }
  if (typeof envelope.success !== "boolean") {
    return body as T;
  }
  if (!envelope.success) {
    const msg =
      envelope.errors
        ?.map((e) => (typeof e === "string" ? e : e.message))
        .filter(Boolean)
        .join("; ") ||
      envelope.message ||
      "Request failed";
    throw new Error(msg);
  }
  if (envelope.data === undefined || envelope.data === null) {
    return undefined as T;
  }
  return envelope.data;
}

export function firstApiErrorMessage(body: unknown): string | undefined {
  const envelope = body as ApiEnvelope<unknown>;
  const first = envelope?.errors?.[0];
  return typeof first === "string" ? first : first?.message;
}

/** Pulls a user-facing message from a failed Axios (or similar) HTTP call. */
export function getHttpErrorMessage(error: unknown, fallback = "Request failed"): string {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const err = error as {
    message?: string;
    response?: { status?: number; data?: unknown };
  };

  const fromBody = firstApiErrorMessage(err.response?.data);
  if (fromBody) {
    if (fromBody.toLowerCase().includes("rwb")) {
      return "Device buffer read failed (RWB). Restart PunchDataService, try Use UDP, then Collect again — if LAN still fails, the server should import from the cloud ZKTeco database when RemoteZktecoDb is configured.";
    }
    const status = err.response?.status;
    return status ? `${fromBody} (HTTP ${status})` : fromBody;
  }

  if (err.response?.status === 502) {
    return "Bad gateway — PunchData service may be stopped, or the device is unreachable on the LAN. Start PunchDataService on port 5050 and ensure the server can reach the device IP.";
  }

  if (err.message && err.message !== "Request failed with status code 502") {
    return err.message;
  }

  if (err.response?.status) {
    return `${fallback} (HTTP ${err.response.status})`;
  }

  return fallback;
}
