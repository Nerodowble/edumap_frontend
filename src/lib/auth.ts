export const getToken = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

export const setToken = (token: string) =>
  localStorage.setItem("auth_token", token);

export const removeToken = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
};

export interface AuthUser {
  nome: string;
  email: string;
  role: "admin_geral" | "admin_escolar" | "professor";
  escola: string;
}

export const getUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("auth_user");
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUser; } catch { return null; }
};

export const setUser = (user: AuthUser) =>
  localStorage.setItem("auth_user", JSON.stringify(user));

export const isAuthenticated = (): boolean => !!getToken();

export const logout = () => {
  removeToken();
  if (typeof window !== "undefined") window.location.href = "/login";
};

export const ROLE_LABEL: Record<string, string> = {
  admin_geral:    "Admin Geral",
  admin_escolar:  "Admin Escolar",
  professor:      "Professor",
};
