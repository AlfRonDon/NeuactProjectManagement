import { getKeycloak } from "./keycloak";

const API_BASE = "/api/proxy/projects";
const API_ROOT = "/api/proxy";

function authHeaders() {
  const kc = getKeycloak();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (kc.token) headers["Authorization"] = `Bearer ${kc.token}`;
  return headers;
}

async function apiFetch(path: string) {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  return readJsonResponse(res, "GET");
}

async function apiFetchRoot(path: string) {
  const res = await fetch(`${API_ROOT}${path}`, { headers: authHeaders() });
  return readJsonResponse(res, "GET");
}

async function apiPost(path: string, data: Record<string, any> = {}) {
  const res = await fetch(`${API_BASE}${path}`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) });
  return readJsonResponse(res, "POST");
}

async function apiPatch(path: string, data: Record<string, any>) {
  const res = await fetch(`${API_BASE}${path}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(data) });
  return readJsonResponse(res, "PATCH");
}

async function apiPostRoot(path: string, data: Record<string, any> = {}) {
  const res = await fetch(`${API_ROOT}${path}`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) });
  return readJsonResponse(res, "POST");
}

async function apiDelete(path: string) {
  const res = await fetch(`${API_BASE}${path}`, { method: "DELETE", headers: authHeaders() });
  return readJsonResponse(res, "DELETE");
}

async function readJsonResponse(res: Response, method: string) {
  const text = await res.text();
  const data = text ? parseJsonOrText(text) : null;
  if (!res.ok) {
    const body = formatApiErrorBody(data);
    throw new Error(body ? `${method} ${res.status}: ${body}` : `${method} ${res.status}`);
  }
  return data;
}

function parseJsonOrText(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function formatApiErrorBody(data: any): string {
  if (data == null) return "";
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.map(formatApiErrorBody).filter(Boolean).join("; ");
  if (typeof data !== "object") return String(data);

  const priority = data.detail || data.error || data.message || data.non_field_errors;
  if (priority) return formatApiErrorBody(priority);

  const fieldErrors = Object.entries(data)
    .map(([key, value]) => {
      const message = formatApiErrorBody(value);
      return message ? `${key}: ${message}` : "";
    })
    .filter(Boolean);
  return fieldErrors.join("; ");
}

/* ── Basic CRUD ─────────────────────────────────────────── */

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

export async function createProject(data: { name: string; short?: string; description?: string; color?: string; status?: string; start_date?: string; target_date?: string }) {
  return apiPost("/projects/", data);
}

export async function createTask(data: { title: string; project: string; description?: string; status?: string; priority?: string; assignee?: string; start_date?: string; due_date?: string; estimated_hours?: number }) {
  return apiPost("/tasks/", data);
}

export async function patchNotification(id: string, data: Record<string, any>) {
  return apiPatch(`/notifications/${id}`, data);
}

/* ── Portfolio & Dashboard ──────────────────────────────── */

export async function fetchPortfolioDashboard() {
  return apiFetchRoot("/portfolio/dashboard/");
}

export async function fetchProjectDashboard(projectId: string) {
  return apiFetch(`/projects/${projectId}/dashboard/`);
}

export async function fetchSprintTimeline(projectId: string, sprintId?: string) {
  const q = sprintId ? `?sprint=${sprintId}` : "";
  return apiFetch(`/projects/${projectId}/sprint-timeline/${q}`);
}

export async function fetchBlockersPanel(projectId: string) {
  return apiFetch(`/projects/${projectId}/blockers-panel/`);
}

export async function fetchDiagnostic(projectId: string, sprintId?: string) {
  const q = sprintId ? `?sprint=${sprintId}` : "";
  return apiFetch(`/projects/${projectId}/diagnostic/${q}`);
}

export async function fetchPeople(projectId: string) {
  return apiFetch(`/projects/${projectId}/people/`);
}

export async function fetchWorkload(projectId?: string, weeks?: number) {
  const params = new URLSearchParams();
  if (projectId) params.set("project", projectId);
  if (weeks) params.set("weeks", String(weeks));
  const q = params.toString() ? `?${params}` : "";
  return apiFetchRoot(`/workload/${q}`);
}

export async function fetchMorningBrief() {
  return apiFetchRoot("/brief/");
}

/* ── Sprint Actions ─────────────────────────────────────── */

export async function lockBacklog(sprintId: string) {
  return apiPost(`/sprints/${sprintId}/lock-backlog/`);
}

export async function unlockBacklog(sprintId: string) {
  return apiPost(`/sprints/${sprintId}/unlock-backlog/`);
}

export async function setReviewSla(sprintId: string, hours: number) {
  return apiPost(`/sprints/${sprintId}/set-review-sla/`, { hours });
}

export async function assignDris(sprintId: string) {
  return apiPost(`/sprints/${sprintId}/assign-dris/`);
}

/* ── Blocker Actions ────────────────────────────────────── */

export async function escalateBlocker(blockerId: string) {
  return apiPost(`/blockers/${blockerId}/escalate/`);
}

export async function snoozeBlocker(blockerId: string, hours: number = 24) {
  return apiPost(`/blockers/${blockerId}/snooze/`, { hours });
}

export async function reassignBlocker(blockerId: string, assigneeId: string) {
  return apiPost(`/blockers/${blockerId}/reassign/`, { assignee: assigneeId });
}

export async function resolveBlocker(blockerId: string) {
  return apiPost(`/blockers/${blockerId}/resolve/`);
}

/* ── Users & Auth ──────────────────────────────────────── */

export async function fetchUsers() {
  return apiFetchRoot("/users/");
}

export async function fetchMe() {
  return apiFetchRoot("/auth/me/");
}

/* ── Calendar ──────────────────────────────────────────── */

export async function fetchCalendar(view?: string, date?: string, assignee?: string, projectId?: string, weeks?: number) {
  const params = new URLSearchParams();
  if (view) params.set("view", view);
  if (date) params.set("date", date);
  if (assignee) params.set("assignee", assignee);
  if (projectId) params.set("project", projectId);
  if (weeks) params.set("weeks", String(weeks));
  const q = params.toString() ? `?${params}` : "";
  return apiFetchRoot(`/calendar/${q}`);
}

/* ── Subtasks ──────────────────────────────────────────── */

export async function fetchSubtasks(taskId: string) {
  return apiFetch(`/tasks/${taskId}/subtasks/`);
}

export async function createSubtask(taskId: string, data: { title: string; assignee?: string; priority?: string; description?: string }) {
  return apiPost(`/tasks/${taskId}/subtasks/`, data);
}

export async function patchSubtask(taskId: string, subtaskId: string, data: Record<string, any>) {
  return apiPatch(`/tasks/${taskId}/subtasks/${subtaskId}`, data);
}

export async function deleteSubtask(taskId: string, subtaskId: string) {
  return apiDelete(`/tasks/${taskId}/subtasks/${subtaskId}/`);
}

/* ── Comments ──────────────────────────────────────────── */

export async function fetchComments(taskId: string) {
  return apiFetch(`/tasks/${taskId}/comments/`);
}

export async function createComment(taskId: string, data: { text: string }) {
  return apiPost(`/tasks/${taskId}/comments/`, data);
}

export async function deleteComment(taskId: string, commentId: string) {
  return apiDelete(`/tasks/${taskId}/comments/${commentId}/`);
}

/* ── Task Updates ──────────────────────────────────────── */

export async function patchTask(id: string, data: Record<string, any>) {
  return apiPatch(`/tasks/${id}/`, data);
}

export async function deleteTask(id: string) {
  return apiDelete(`/tasks/${id}/`);
}

export async function fetchTaskDetailFull(id: string) {
  return apiFetch(`/tasks/${id}/detail_full/`);
}

/* ── Project Actions ───────────────────────────────────── */

export async function patchProject(id: string, data: Record<string, any>) {
  return apiPatch(`/projects/${id}/`, data);
}

export async function deleteProject(id: string) {
  return apiDelete(`/projects/${id}/`);
}

export async function fetchProjectOverview(id: string) {
  return apiFetch(`/projects/${id}/overview/`);
}

export async function fetchProjectSprint(id: string) {
  return apiFetch(`/projects/${id}/sprint/`);
}

export async function fetchProjectTasksList(id: string, filters?: Record<string, string>) {
  const params = new URLSearchParams(filters);
  const q = params.toString() ? `?${params}` : "";
  return apiFetch(`/projects/${id}/tasks_list/${q}`);
}

export async function fetchProjectBrief(id: string) {
  return apiFetch(`/projects/${id}/brief/`);
}

export async function fetchProjectPipeline(id: string) {
  return apiFetch(`/projects/${id}/pipeline/`);
}

export async function fetchProjectGantt(id: string) {
  return apiFetch(`/projects/${id}/gantt/`);
}

/* ── Milestones ────────────────────────────────────────── */

export async function fetchMilestones(projectId?: string) {
  const q = projectId ? `?project=${projectId}` : "";
  return apiFetch(`/milestones/${q}`);
}

export async function createMilestone(data: { name: string; due_date: string; project: string }) {
  return apiPost("/milestones/", data);
}

export async function patchMilestone(id: string, data: Record<string, any>) {
  return apiPatch(`/milestones/${id}/`, data);
}

export async function deleteMilestone(id: string) {
  return apiDelete(`/milestones/${id}/`);
}

/* ── Categories ────────────────────────────────────────── */

export async function fetchCategories() {
  return apiFetch("/categories/");
}

export async function createCategory(data: { name: string; color?: string }) {
  return apiPost("/categories/", data);
}

export async function deleteCategory(id: string) {
  return apiDelete(`/categories/${id}/`);
}

/* ── Dependencies ──────────────────────────────────────── */

export async function fetchDependencies(projectId?: string, taskId?: string) {
  const params = new URLSearchParams();
  if (projectId) params.set("project", projectId);
  if (taskId) params.set("task", taskId);
  const q = params.toString() ? `?${params}` : "";
  return apiFetch(`/dependencies/${q}`);
}

export async function createDependency(data: { predecessor: string; successor: string; dependency_type?: string; lag_days?: number }) {
  return apiPost("/dependencies/", data);
}

export async function deleteDependency(id: string) {
  return apiDelete(`/dependencies/${id}/`);
}

/* ── Activities ────────────────────────────────────────── */

export async function fetchActivities(projectId?: string, type?: string) {
  const params = new URLSearchParams();
  if (projectId) params.set("project", projectId);
  if (type) params.set("type", type);
  const q = params.toString() ? `?${params}` : "";
  return apiFetch(`/activities/${q}`);
}

/* ── Sprints ───────────────────────────────────────────── */

export async function fetchSprints(projectId?: string, status?: string) {
  const params = new URLSearchParams();
  if (projectId) params.set("project", projectId);
  if (status) params.set("status", status);
  const q = params.toString() ? `?${params}` : "";
  return apiFetch(`/sprints/${q}`);
}

export async function createSprint(data: { project: string; name: string; start_date: string; end_date: string }) {
  return apiPost("/sprints/", data);
}

export async function patchSprint(id: string, data: Record<string, any>) {
  return apiPatch(`/sprints/${id}/`, data);
}

export async function takeSprintSnapshot(sprintId: string) {
  return apiPost(`/sprints/${sprintId}/take-snapshot/`);
}

/* ── Blockers ──────────────────────────────────────────── */

export async function fetchBlockers(projectId?: string, status?: string, severity?: string) {
  const params = new URLSearchParams();
  if (projectId) params.set("project", projectId);
  if (status) params.set("status", status);
  if (severity) params.set("severity", severity);
  const q = params.toString() ? `?${params}` : "";
  return apiFetch(`/blockers/${q}`);
}

export async function createBlocker(data: { project: string; task?: string; reason: string; severity?: string; assigned_to?: string }) {
  return apiPost("/blockers/", data);
}

/* ── AI Suggestions ────────────────────────────────────── */

export async function acceptSuggestion(projectId: string, suggestion: string) {
  return apiPostRoot("/suggestions/accept/", { project_id: projectId, suggestion });
}

export async function dismissSuggestion(projectId: string, suggestionType: string, suggestionData: any, reason?: string) {
  return apiPostRoot("/suggestions/dismiss/", { project_id: projectId, suggestion_type: suggestionType, suggestion_data: suggestionData, reason });
}

/* ── Risk History ──────────────────────────────────────── */

export async function fetchRiskHistory(projectId?: string) {
  const q = projectId ? `?project=${projectId}` : "";
  return apiFetchRoot(`/risk-history/${q}`);
}

/* ── Workload Pull ─────────────────────────────────────── */

export async function pullWork(taskId: string, assigneeId: string) {
  return apiPostRoot("/workload/pull/", { task_id: taskId, assignee_id: assigneeId });
}
