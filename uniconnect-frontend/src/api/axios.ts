import axios, { AxiosError, AxiosResponse } from "axios";

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  "http://localhost:8080";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("uniconnect_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Backend envelope: { success: true, data: ... } or { success: false, error: "..." }
interface APIEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Unwrap the envelope on success responses
api.interceptors.response.use(
  (response: AxiosResponse<APIEnvelope<unknown>>) => {
    if (
      response.data &&
      typeof response.data === "object" &&
      "success" in response.data
    ) {
      if (response.data.success) {
        return { ...response, data: response.data.data };
      }
      return Promise.reject(
        new Error(response.data.error || "An unexpected error occurred")
      );
    }
    return response;
  },
  (error: AxiosError<APIEnvelope<unknown>>) => {
    // 401 → clear token and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem("uniconnect_token");
      localStorage.removeItem("uniconnect_user");
      if (
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/register" &&
        window.location.pathname !== "/"
      ) {
        window.location.href = "/login";
      }
    }

    const message =
      error.response?.data?.error ||
      error.message ||
      "Network error. Please try again.";
    return Promise.reject(new Error(message));
  }
);

// Typed request helpers
export async function apiGet<T>(url: string): Promise<T> {
  const res = await api.get<T>(url);
  return res.data;
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.post<T>(url, body);
  return res.data;
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.put<T>(url, body);
  return res.data;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const res = await api.delete<T>(url);
  return res.data;
}
