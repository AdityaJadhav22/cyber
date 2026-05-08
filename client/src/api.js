const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const apiRequest = async (path, { method = "GET", body, token } = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }
  // Unified API response contract from backend: { success, message, data }.
  if (payload && typeof payload === "object" && "success" in payload) {
    return payload.data ?? {};
  }
  return payload;
};
