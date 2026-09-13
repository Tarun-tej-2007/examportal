const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function api(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("exam_token") : null;
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export function saveSession(data: any) {
  localStorage.setItem("exam_token", data.token);
  localStorage.setItem("exam_user", JSON.stringify(data.user));
}

export function getUser() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("exam_user") || "null"); } catch { return null; }
}

export function logout() {
  localStorage.removeItem("exam_token");
  localStorage.removeItem("exam_user");
}
