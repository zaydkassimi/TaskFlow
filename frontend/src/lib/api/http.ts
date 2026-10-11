import type { ApiErrorBody } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

let accessToken: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;
let authFailureHandler: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAuthFailureHandler(handler: (() => void) | null): void {
  authFailureHandler = handler;
}

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

interface RequestOptions {
  auth?: boolean;
  retryOn401?: boolean;
}

function buildInit(init: RequestInit | undefined, withAuth: boolean): RequestInit {
  const headers = new Headers(init?.headers);
  if (typeof init?.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");
  if (withAuth && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  };
}

function doFetch(
  path: string,
  init: RequestInit | undefined,
  withAuth: boolean,
): Promise<Response> {
  return fetch(`${API_BASE}${path}`, buildInit(init, withAuth));
}

async function parseError(response: Response): Promise<ApiError> {
  let body: Partial<ApiErrorBody> | null = null;
  try {
    body = (await response.json()) as Partial<ApiErrorBody>;
  } catch {
    body = null;
  }
  const message = body?.message ?? response.statusText ?? "Request failed";
  return new ApiError(
    response.status,
    message,
    body?.fieldErrors ?? undefined,
  );
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) {
          accessToken = null;
          return false;
        }
        const data = (await response.json()) as { accessToken: string };
        accessToken = data.accessToken;
        return true;
      } catch {
        accessToken = null;
        return false;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  options: RequestOptions = {},
): Promise<T> {
  const auth = options.auth ?? true;
  const retryOn401 = options.retryOn401 ?? true;

  let response = await doFetch(path, init, auth);

  if (response.status === 401 && auth && retryOn401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await doFetch(path, init, auth);
    } else {
      authFailureHandler?.();
    }
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export type QueryValue = string | number | boolean | null | undefined;

export function toQuery(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}
