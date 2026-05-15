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
