
// All communication with the Express backend goes through this file.

const TOKEN_KEY = "elsewhere-token";

// Live backend URL is configured through Vite environment variables.
// Empty fallback preserves your existing local Vite proxy setup.
const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(method, url, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();

  if (token) headers.Authorization = `Bearer ${token}`;

  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api${url}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Can't reach the server. Is the backend running?");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Something went wrong");
    error.status = response.status;
    throw error;
  }

  return data;
}

export const api = {
  get: (url) => request("GET", url),
  post: (url, body) => request("POST", url, body),
  put: (url, body) => request("PUT", url, body),
  patch: (url, body) => request("PATCH", url, body),
  delete: (url) => request("DELETE", url),
};
