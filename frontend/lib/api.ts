const RAW_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
export const API_BASE = RAW_BASE.replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const hasBody = method === "POST" || method === "PUT" || method === "PATCH";
  const headers: Record<string, string> = { ...(init.headers as any) };
  if (hasBody && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers,
  });
  const text = await res.text();
  const body = text ? safeParse(text) : null;
  if (!res.ok) {
    throw new ApiError(
      (body as any)?.detail ?? res.statusText ?? "Request failed",
      res.status,
      body,
    );
  }
  return body as T;
}

export const apiGet = <T = unknown>(p: string) => api<T>(p);
export const apiPost = <T = unknown>(p: string, body?: unknown) =>
  api<T>(p, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined });
export const apiPut = <T = unknown>(p: string, body?: unknown) =>
  api<T>(p, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined });
export const apiPatch = <T = unknown>(p: string, body?: unknown) =>
  api<T>(p, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined });

function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
