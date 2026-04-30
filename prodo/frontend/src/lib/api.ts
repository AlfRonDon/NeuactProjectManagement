import { getKeycloak } from "./keycloak";

const API_BASE = "/api/proxy/projects";

async function apiFetch(path: string) {
  const kc = getKeycloak();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (kc.token) {
    headers["Authorization"] = `Bearer ${kc.token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function fetchProjects() {
  return apiFetch("/projects/");
}

export async function fetchProjectDetail(id: string) {
  return apiFetch(`/projects/${id}/`);
}

export async function fetchTasks(projectId?: string) {
  const q = projectId ? `?project=${projectId}` : "";
  return apiFetch(`/tasks/${q}`);
}

export async function fetchTaskDetail(id: string) {
  return apiFetch(`/tasks/${id}/`);
}

export async function fetchNotifications() {
  return apiFetch("/notifications/");
}

export async function fetchChangelogs(projectId?: string) {
  const q = projectId ? `?project=${projectId}` : "";
  return apiFetch(`/changelogs/${q}`);
}

export async function patchNotification(id: string, data: Record<string, any>) {
  const kc = (await import("./keycloak")).getKeycloak();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (kc.token) headers["Authorization"] = `Bearer ${kc.token}`;
  const res = await fetch(`/api/proxy/projects/notifications/${id}`, { method: "PATCH", headers, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(`PATCH ${res.status}`);
  return res.json();
}
