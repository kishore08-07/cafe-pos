import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: ApiError | null;
  timestamp: string;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code = 'API_ERROR',
    public details?: unknown
  ) {
    super(message);
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setSession, clearSession } = useAuthStore.getState();
  if (!refreshToken) return null;
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) {
    clearSession();
    return null;
  }
  const payload = (await response.json()) as ApiResponse<AuthResponse>;
  setSession(payload.data);
  return payload.data.accessToken;
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 401 && retry && useAuthStore.getState().refreshToken) {
    const nextToken = await refreshAccessToken();
    if (nextToken) return api<T>(path, options, false);
  }
  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    if (!response.ok) throw new ApiClientError(`Request failed (${response.status})`, response.status);
    return (await response.blob()) as T;
  }

  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !payload.success) {
    throw new ApiClientError(
      payload.error?.message ?? `Request failed (${response.status})`,
      response.status,
      payload.error?.code,
      payload.error?.details
    );
  }
  return payload.data;
}

export interface AuthResponse {
  userId: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  accessToken: string;
  refreshToken: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const downloadApiFile = async (path: string, filename: string) => {
  const blob = await api<Blob>(path);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};
