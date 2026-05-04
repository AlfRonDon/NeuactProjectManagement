import { create } from "zustand";
import {
  acceptSuggestion as apiAcceptSuggestion,
  assignDris as apiAssignDris,
  createBlocker as apiCreateBlocker,
  createDependency as apiCreateDependency,
  createMilestone as apiCreateMilestone,
  createProject as apiCreateProject,
  createSprint as apiCreateSprint,
  createTask as apiCreateTask,
  deleteDependency as apiDeleteDependency,
  deleteMilestone as apiDeleteMilestone,
  deleteProject as apiDeleteProject,
  deleteTask as apiDeleteTask,
  dismissSuggestion as apiDismissSuggestion,
  escalateBlocker as apiEscalateBlocker,
  fetchActivities as apiFetchActivities,
  fetchBlockers as apiFetchBlockers,
  fetchCalendar as apiFetchCalendar,
  fetchDependencies as apiFetchDependencies,
  fetchMilestones as apiFetchMilestones,
  fetchNotifications as apiFetchNotifications,
  fetchPortfolioDashboard as apiFetchPortfolioDashboard,
  fetchProjects as apiFetchProjects,
  fetchSprints as apiFetchSprints,
  fetchTasks as apiFetchTasks,
  fetchUsers as apiFetchUsers,
  fetchWorkload as apiFetchWorkload,
  lockBacklog as apiLockBacklog,
  patchMilestone as apiPatchMilestone,
  patchNotification as apiPatchNotification,
  patchProject as apiPatchProject,
  patchSprint as apiPatchSprint,
  patchTask as apiPatchTask,
  pullWork as apiPullWork,
  reassignBlocker as apiReassignBlocker,
  resolveBlocker as apiResolveBlocker,
  setReviewSla as apiSetReviewSla,
  snoozeBlocker as apiSnoozeBlocker,
  takeSprintSnapshot as apiTakeSprintSnapshot,
  unlockBacklog as apiUnlockBacklog,
} from "@/lib/api";

export type SliceStatus = "idle" | "loading" | "ready" | "error";

export interface DashboardProject {
  id: string;
  name: string;
  short: string;
  progress: number;
  done: number;
  total: number;
  active: number;
  blocked: number;
  target: string;
  start: string;
  color: string;
  description?: string;
  risk?: string;
  trend?: string;
  daysLeft?: number;
}

export interface DashboardTask {
  id: string;
  title: string;
  project: string;
  projectId: string;
  status: string;
  due: string;
  est: string;
  priority: string;
  assignee: string;
  due_date: string;
  depends_on: string[];
}

export interface DashboardNotification {
  id: string;
  cat: string;
  title: string;
  desc: string;
  project: string;
  from: string;
  time: string;
  read: boolean;
  actions: any[];
  relatedId?: string | null;
}

export interface DashboardStats {
  totalTasks: number;
  totalDone: number;
  totalActive: number;
  totalBlocked: number;
  totalTodo: number;
  overallPct: number;
}

export interface PMStoreState {
  projects: any[];
  tasks: any[];
  notifications: any[];
  portfolio: any | null;
  users: any[];
  activities: any[];
  sprints: any[];
  blockers: any[];
  milestones: any[];
  dependencies: any[];
  calendar: any | null;
  workload: any | null;

  projectsStatus: SliceStatus;
  tasksStatus: SliceStatus;
  notificationsStatus: SliceStatus;
  portfolioStatus: SliceStatus;
  usersStatus: SliceStatus;
  activitiesStatus: SliceStatus;
  sprintsStatus: SliceStatus;
  blockersStatus: SliceStatus;
  milestonesStatus: SliceStatus;
  dependenciesStatus: SliceStatus;
  calendarStatus: SliceStatus;
  workloadStatus: SliceStatus;
  error: string | null;
  sliceErrors: Record<string, string | null>;

  fetchProjects: () => Promise<any[]>;
  fetchTasks: (projectId?: string) => Promise<any[]>;
  fetchNotifications: () => Promise<any[]>;
  fetchPortfolio: () => Promise<any | null>;
  fetchUsers: () => Promise<any[]>;
  fetchActivities: (projectId?: string, type?: string) => Promise<any[]>;
  fetchSprints: (projectId?: string, status?: string) => Promise<any[]>;
  fetchBlockers: (projectId?: string, status?: string, severity?: string) => Promise<any[]>;
  fetchMilestones: (projectId?: string) => Promise<any[]>;
  fetchDependencies: (projectId?: string, taskId?: string) => Promise<any[]>;
  fetchCalendar: (view?: string, date?: string, assignee?: string, projectId?: string, weeks?: number) => Promise<any | null>;
  fetchWorkload: (projectId?: string, weeks?: number) => Promise<any | null>;
  fetchAll: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  refreshProjectScoped: (projectId?: string) => Promise<void>;

  createProject: (data: Parameters<typeof apiCreateProject>[0]) => Promise<any>;
  patchProject: (id: string, data: Record<string, any>) => Promise<any>;
  deleteProject: (id: string) => Promise<any>;
  createTask: (data: Parameters<typeof apiCreateTask>[0]) => Promise<any>;
  patchTask: (id: string, data: Record<string, any>) => Promise<any>;
  deleteTask: (id: string) => Promise<any>;
  assignTask: (id: string, assigneeId?: string | null) => Promise<any>;
  moveTaskStatus: (id: string, status: string) => Promise<any>;

  createMilestone: (data: Parameters<typeof apiCreateMilestone>[0]) => Promise<any>;
  patchMilestone: (id: string, data: Record<string, any>) => Promise<any>;
  deleteMilestone: (id: string) => Promise<any>;
  createDependency: (data: Parameters<typeof apiCreateDependency>[0]) => Promise<any>;
  deleteDependency: (id: string) => Promise<any>;
  createBlocker: (data: Parameters<typeof apiCreateBlocker>[0]) => Promise<any>;
  escalateBlocker: (id: string) => Promise<any>;
  snoozeBlocker: (id: string, hours?: number) => Promise<any>;
  reassignBlocker: (id: string, assigneeId: string) => Promise<any>;
  resolveBlocker: (id: string) => Promise<any>;
  pullWork: (taskId: string, assigneeId: string) => Promise<any>;

  createSprint: (data: Parameters<typeof apiCreateSprint>[0]) => Promise<any>;
  patchSprint: (id: string, data: Record<string, any>) => Promise<any>;
  lockBacklog: (id: string) => Promise<any>;
  unlockBacklog: (id: string) => Promise<any>;
  setReviewSla: (id: string, hours: number) => Promise<any>;
  assignDris: (id: string) => Promise<any>;
  takeSprintSnapshot: (id: string) => Promise<any>;

  markNotificationRead: (id: string) => Promise<any>;
  markAllNotificationsRead: () => Promise<void>;
  patchNotification: (id: string, data: Record<string, any>) => Promise<any>;
  acceptSuggestion: (projectId: string, suggestion: string) => Promise<any>;
  dismissSuggestion: (projectId: string, suggestionType: string, suggestionData: any, reason?: string) => Promise<any>;
}

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function asArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function normalizeStatus(status: string) {
  return status === "in_progress" ? "active" : status || "todo";
}

function userName(user: any) {
  return user?.display_name || user?.name || user?.username || user?.email || "Unknown";
}

function userId(user: any) {
  return user?.keycloak_id || user?.id || user?.username || "";
}

function taskAssigneeName(task: any) {
  return (
    task?.assignee_detail?.display_name ||
    task?.assignee_detail?.username ||
    task?.assignee_name ||
    task?.assignee_display ||
    task?.assignee ||
    ""
  );
}

function taskDependencyIds(task: any) {
  return task?.depends_on || task?.depends || task?.dependencies || [];
}

function mapPortfolioProjects(portfolio: any | null): DashboardProject[] {
  if (!portfolio?.cards) return [];
  return portfolio.cards.map((c: any) => ({
    id: c.id,
    name: c.name,
    short: c.short || c.name?.slice(0, 4) || "",
    progress: c.progress || 0,
    done: c.done_count || 0,
    total: c.task_count || 0,
    active: Math.max(0, (c.task_count || 0) - (c.done_count || 0) - (c.blocked_count || 0)),
    blocked: c.blocked_count || 0,
    target: c.target_date || "",
    start: c.start_date || "",
    color: c.color || "#6366F1",
    description: c.description,
    risk: c.risk,
    trend: c.trend,
    daysLeft: c.days_left,
  }));
}

function mapApiProjects(projects: any[]): DashboardProject[] {
  return projects.map((p: any) => ({
    id: p.id,
    name: p.name,
    short: p.short || p.name?.slice(0, 4) || "",
    progress: p.progress || 0,
    done: p.done_count || 0,
    total: p.task_count || 0,
    active: p.active_count || 0,
    blocked: p.blocked_count || 0,
    target: p.target_date || "",
    start: p.start_date || "",
    color: p.color || "#6366F1",
    description: p.description,
  }));
}

let cachedPortfolio: any | null | undefined;
let cachedProjectSource: any[] | undefined;
let cachedDashboardProjects: DashboardProject[] = [];

export function selectDashboardProjects(state: PMStoreState): DashboardProject[] {
  if (state.portfolio === cachedPortfolio && state.projects === cachedProjectSource) {
    return cachedDashboardProjects;
  }
  const portfolioProjects = mapPortfolioProjects(state.portfolio);
  cachedPortfolio = state.portfolio;
  cachedProjectSource = state.projects;
  cachedDashboardProjects = portfolioProjects.length > 0 ? portfolioProjects : mapApiProjects(state.projects);
  return cachedDashboardProjects;
}

let cachedTaskSource: any[] | undefined;
let cachedTaskProjects: DashboardProject[] | undefined;
let cachedDashboardTasks: DashboardTask[] = [];

export function selectDashboardTasks(state: PMStoreState): DashboardTask[] {
  const projects = selectDashboardProjects(state);
  if (state.tasks === cachedTaskSource && projects === cachedTaskProjects) {
    return cachedDashboardTasks;
  }
  cachedTaskSource = state.tasks;
  cachedTaskProjects = projects;
  cachedDashboardTasks = state.tasks.map((t: any) => {
    const project = projects.find((p) => p.id === t.project);
    return {
      id: t.id,
      title: t.title,
      project: project?.short || "",
      projectId: t.project,
      status: normalizeStatus(t.status),
      due: t.due_date || "",
      est: t.estimated_hours ? `${t.estimated_hours}h` : "",
      priority: t.priority || "medium",
      assignee: taskAssigneeName(t),
      due_date: t.due_date || "",
      depends_on: taskDependencyIds(t),
    };
  });
  return cachedDashboardTasks;
}

let cachedBoardTaskSource: any[] | undefined;
let cachedBoardTasks: any[] = [];

export function selectBoardTasks(state: PMStoreState) {
  if (state.tasks === cachedBoardTaskSource) return cachedBoardTasks;
  cachedBoardTaskSource = state.tasks;
  cachedBoardTasks = state.tasks.map((t: any) => ({
    id: t.id,
    title: t.title,
    status: t.status || "todo",
    assignee: taskAssigneeName(t),
    due_date: t.due_date || "",
    priority: t.priority || "medium",
    depends_on: taskDependencyIds(t),
  }));
  return cachedBoardTasks;
}

let cachedOptionProjects: DashboardProject[] | undefined;
let cachedProjectOptions: { id: string; name: string; short: string }[] = [];

export function selectProjectOptions(state: PMStoreState) {
  const projects = selectDashboardProjects(state);
  if (projects === cachedOptionProjects) return cachedProjectOptions;
  cachedOptionProjects = projects;
  cachedProjectOptions = projects.map((p) => ({ id: p.id, name: p.name, short: p.short }));
  return cachedProjectOptions;
}

let cachedNotificationSource: any[] | undefined;
let cachedDashboardNotifications: DashboardNotification[] = [];

export function selectDashboardNotifications(state: PMStoreState): DashboardNotification[] {
  if (state.notifications === cachedNotificationSource) return cachedDashboardNotifications;
  cachedNotificationSource = state.notifications;
  cachedDashboardNotifications = state.notifications.map((n: any) => ({
    id: n.id,
    cat: n.category || n.cat || "ai",
    title: n.title,
    desc: n.description || n.desc || "",
    project: n.project_short || n.project || "",
    from: n.from_user || n.from || "System",
    time: n.time_ago || n.time || "",
    read: Boolean(n.read),
    actions: n.actions || [],
    relatedId: n.related_id || n.relatedId || null,
  }));
  return cachedDashboardNotifications;
}

export function selectUnreadNotificationCount(state: PMStoreState) {
  return state.notifications.filter((n: any) => !n.read).length;
}

let cachedStatsProjects: DashboardProject[] | undefined;
let cachedDashboardStats: DashboardStats = {
  totalTasks: 0,
  totalDone: 0,
  totalActive: 0,
  totalBlocked: 0,
  totalTodo: 0,
  overallPct: 0,
};

export function selectDashboardStats(state: PMStoreState): DashboardStats {
  const projects = selectDashboardProjects(state);
  if (projects === cachedStatsProjects) return cachedDashboardStats;
  const totalTasks = projects.reduce((sum, p) => sum + (p.total || 0), 0);
  const totalDone = projects.reduce((sum, p) => sum + (p.done || 0), 0);
  const totalActive = projects.reduce((sum, p) => sum + (p.active || 0), 0);
  const totalBlocked = projects.reduce((sum, p) => sum + (p.blocked || 0), 0);
  const totalTodo = Math.max(0, totalTasks - totalDone - totalActive - totalBlocked);
  const overallPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
  cachedStatsProjects = projects;
  cachedDashboardStats = { totalTasks, totalDone, totalActive, totalBlocked, totalTodo, overallPct };
  return cachedDashboardStats;
}

let cachedCalendarSource: any[] | undefined;
let cachedCalendarData: any | null | undefined;
let cachedCalendarTasks: any[] = [];

export function selectCalendarTasks(state: PMStoreState) {
  if (state.tasks === cachedCalendarSource && state.calendar === cachedCalendarData) return cachedCalendarTasks;
  cachedCalendarSource = state.tasks;
  cachedCalendarData = state.calendar;
  const source = Array.isArray(state.calendar?.tasks) && state.calendar.tasks.length > 0 ? state.calendar.tasks : state.tasks;
  cachedCalendarTasks = source.map((t: any) => ({
    id: t.id,
    title: t.title,
    description: t.description || undefined,
    status: t.status || "todo",
    priority: t.priority || undefined,
    assignee: taskAssigneeName(t),
    start: t.start_date || t.start || undefined,
    due: t.due_date || t.due || undefined,
    duration: t.duration || (t.estimated_hours ? Math.max(1, Math.round(t.estimated_hours / 8)) : 3),
    estimated_hours: t.estimated_hours || undefined,
    deps: taskDependencyIds(t),
    blocks: t.blocks || [],
    phase: t.phase || undefined,
  }));
  return cachedCalendarTasks;
}

let cachedGanttSource: any[] | undefined;
let cachedGanttTasks: any[] = [];

export function selectGanttTasks(state: PMStoreState) {
  if (state.tasks === cachedGanttSource) return cachedGanttTasks;
  cachedGanttSource = state.tasks;
  const starts = state.tasks
    .map((t: any) => t.start_date || t.due_date)
    .filter(Boolean)
    .map((d: string) => new Date(d).getTime());
  const epoch = starts.length > 0 ? Math.min(...starts) : Date.now();
  cachedGanttTasks = state.tasks.map((t: any) => {
    const taskStart = t.start_date || t.due_date;
    const start = taskStart
      ? Math.max(0, Math.round((new Date(taskStart).getTime() - epoch) / 86_400_000))
      : 0;
    return {
      id: t.id,
      title: t.title,
      start,
      duration: t.estimated_hours ? Math.max(1, Math.round(t.estimated_hours / 8)) : 3,
      status: t.status || "todo",
      deps: taskDependencyIds(t),
      phase: t.phase || undefined,
      assignee: taskAssigneeName(t),
    };
  });
  return cachedGanttTasks;
}

let cachedDependencyTaskSource: any[] | undefined;
let cachedDependencyTasks: any[] = [];

export function selectDependencyTasks(state: PMStoreState) {
  if (state.tasks === cachedDependencyTaskSource) return cachedDependencyTasks;
  cachedDependencyTaskSource = state.tasks;
  cachedDependencyTasks = state.tasks.map((t: any) => ({
    id: t.id,
    title: t.title,
    status: normalizeStatus(t.status),
    assignee: taskAssigneeName(t),
    estimatedHours: t.estimated_hours || 0,
    startDate: t.start_date || "",
    dueDate: t.due_date || "",
    depends: taskDependencyIds(t),
    phase: t.phase || "",
    priority: t.priority || "medium",
  }));
  return cachedDependencyTasks;
}

let cachedUsersSource: any[] | undefined;
let cachedPeopleOptions: { id: string; keycloak_id: string; name: string; role: string; avatar: string; capacity: number }[] = [];

export function selectPeopleOptions(state: PMStoreState) {
  if (state.users === cachedUsersSource) return cachedPeopleOptions;
  cachedUsersSource = state.users;
  cachedPeopleOptions = state.users.map((u: any) => {
    const name = userName(u);
    return {
      id: userId(u),
      keycloak_id: userId(u),
      name,
      role: u.role || u.title || "Team",
      avatar: name.charAt(0).toUpperCase(),
      capacity: u.weekly_capacity || u.capacity || 40,
    };
  });
  return cachedPeopleOptions;
}

async function settle(actions: Promise<any>[]) {
  await Promise.allSettled(actions);
}

function runInBackground(action: Promise<any>) {
  action.catch(() => undefined);
}

export const usePMStore = create<PMStoreState>((set, get) => {
  async function fetchArraySlice(
    statusKey: keyof PMStoreState,
    dataKey: keyof PMStoreState,
    sliceName: string,
    loader: () => Promise<any>,
  ) {
    set({ [statusKey]: "loading", error: null, sliceErrors: { ...get().sliceErrors, [sliceName]: null } } as any);
    try {
      const data = asArray(await loader());
      set({ [dataKey]: data, [statusKey]: "ready" } as any);
      return data;
    } catch (error) {
      const message = messageFromError(error);
      set({ [statusKey]: "error", error: message, sliceErrors: { ...get().sliceErrors, [sliceName]: message } } as any);
      throw error;
    }
  }

  async function fetchObjectSlice(
    statusKey: keyof PMStoreState,
    dataKey: keyof PMStoreState,
    sliceName: string,
    loader: () => Promise<any>,
  ) {
    set({ [statusKey]: "loading", error: null, sliceErrors: { ...get().sliceErrors, [sliceName]: null } } as any);
    try {
      const data = await loader();
      set({ [dataKey]: data ?? null, [statusKey]: "ready" } as any);
      return data ?? null;
    } catch (error) {
      const message = messageFromError(error);
      set({ [statusKey]: "error", error: message, sliceErrors: { ...get().sliceErrors, [sliceName]: message } } as any);
      throw error;
    }
  }

  async function refreshTaskRelated(projectId?: string) {
    await settle([
      get().fetchTasks(),
      get().fetchProjects(),
      get().fetchPortfolio(),
      get().fetchActivities(projectId),
      get().fetchDependencies(projectId),
      get().fetchBlockers(projectId),
      get().fetchCalendar(),
      get().fetchWorkload(projectId),
    ]);
  }

  async function refreshBlockerRelated(projectId?: string) {
    await settle([
      get().fetchBlockers(projectId),
      get().fetchTasks(),
      get().fetchNotifications(),
      get().fetchActivities(projectId),
      get().fetchPortfolio(),
    ]);
  }

  return {
    projects: [],
    tasks: [],
    notifications: [],
    portfolio: null,
    users: [],
    activities: [],
    sprints: [],
    blockers: [],
    milestones: [],
    dependencies: [],
    calendar: null,
    workload: null,

    projectsStatus: "idle",
    tasksStatus: "idle",
    notificationsStatus: "idle",
    portfolioStatus: "idle",
    usersStatus: "idle",
    activitiesStatus: "idle",
    sprintsStatus: "idle",
    blockersStatus: "idle",
    milestonesStatus: "idle",
    dependenciesStatus: "idle",
    calendarStatus: "idle",
    workloadStatus: "idle",
    error: null,
    sliceErrors: {},

    fetchProjects: () => fetchArraySlice("projectsStatus", "projects", "projects", apiFetchProjects),
    fetchTasks: (_projectId?: string) => fetchArraySlice("tasksStatus", "tasks", "tasks", () => apiFetchTasks()),
    fetchNotifications: () => fetchArraySlice("notificationsStatus", "notifications", "notifications", apiFetchNotifications),
    fetchPortfolio: () => fetchObjectSlice("portfolioStatus", "portfolio", "portfolio", apiFetchPortfolioDashboard),
    fetchUsers: () => fetchArraySlice("usersStatus", "users", "users", apiFetchUsers),
    fetchActivities: (projectId?: string, type?: string) => fetchArraySlice("activitiesStatus", "activities", "activities", () => apiFetchActivities(projectId, type)),
    fetchSprints: (projectId?: string, status?: string) => fetchArraySlice("sprintsStatus", "sprints", "sprints", () => apiFetchSprints(projectId, status)),
    fetchBlockers: (projectId?: string, status?: string, severity?: string) => fetchArraySlice("blockersStatus", "blockers", "blockers", () => apiFetchBlockers(projectId, status, severity)),
    fetchMilestones: (projectId?: string) => fetchArraySlice("milestonesStatus", "milestones", "milestones", () => apiFetchMilestones(projectId)),
    fetchDependencies: (projectId?: string, taskId?: string) => fetchArraySlice("dependenciesStatus", "dependencies", "dependencies", () => apiFetchDependencies(projectId, taskId)),
    fetchCalendar: (view?: string, date?: string, assignee?: string, projectId?: string, weeks?: number) =>
      fetchObjectSlice("calendarStatus", "calendar", "calendar", () => apiFetchCalendar(view, date, assignee, projectId, weeks)),
    fetchWorkload: (projectId?: string, weeks?: number) =>
      fetchObjectSlice("workloadStatus", "workload", "workload", () => apiFetchWorkload(projectId, weeks)),

    fetchAll: async () => {
      await get().refreshDashboard();
    },

    refreshDashboard: async () => {
      await settle([
        get().fetchPortfolio(),
        get().fetchProjects(),
        get().fetchTasks(),
        get().fetchNotifications(),
        get().fetchUsers(),
        get().fetchActivities(),
        get().fetchSprints(),
        get().fetchBlockers(),
        get().fetchDependencies(),
        get().fetchCalendar(),
        get().fetchWorkload(),
      ]);
    },

    refreshProjectScoped: async (projectId?: string) => {
      await settle([
        get().fetchProjects(),
        get().fetchTasks(projectId),
        get().fetchPortfolio(),
        get().fetchMilestones(projectId),
        get().fetchDependencies(projectId),
        get().fetchBlockers(projectId),
        get().fetchActivities(projectId),
        get().fetchSprints(projectId),
        get().fetchWorkload(projectId),
      ]);
    },

    createProject: async (data) => {
      const created = await apiCreateProject(data);
      set({
        projects: [created, ...get().projects.filter((p: any) => p.id !== created.id)],
        projectsStatus: "ready",
        error: null,
      });
      runInBackground(settle([get().fetchProjects(), get().fetchPortfolio(), get().fetchActivities()]));
      return created;
    },

    patchProject: async (id, data) => {
      const updated = await apiPatchProject(id, data);
      set({
        projects: get().projects.map((p: any) => (p.id === id ? { ...p, ...updated } : p)),
        projectsStatus: "ready",
        error: null,
      });
      runInBackground(settle([get().fetchProjects(), get().fetchPortfolio(), get().fetchActivities(id)]));
      return updated;
    },

    deleteProject: async (id) => {
      const deleted = await apiDeleteProject(id);
      set({
        projects: get().projects.filter((p: any) => p.id !== id),
        tasks: get().tasks.filter((t: any) => t.project !== id),
        projectsStatus: "ready",
        tasksStatus: "ready",
        error: null,
      });
      runInBackground(get().refreshDashboard());
      return deleted;
    },

    createTask: async (data) => {
      const created = await apiCreateTask(data);
      set({
        tasks: [created, ...get().tasks.filter((t: any) => t.id !== created.id)],
        tasksStatus: "ready",
        error: null,
      });
      runInBackground(refreshTaskRelated((data as any).project));
      return created;
    },

    patchTask: async (id, data) => {
      const existing = get().tasks.find((t: any) => t.id === id);
      const updated = await apiPatchTask(id, data);
      set({
        tasks: get().tasks.map((t: any) => (t.id === id ? { ...t, ...updated } : t)),
        tasksStatus: "ready",
        error: null,
      });
      runInBackground(refreshTaskRelated(updated?.project || existing?.project));
      return updated;
    },

    deleteTask: async (id) => {
      const existing = get().tasks.find((t: any) => t.id === id);
      const deleted = await apiDeleteTask(id);
      set({
        tasks: get().tasks.filter((t: any) => t.id !== id),
        tasksStatus: "ready",
        error: null,
      });
      runInBackground(refreshTaskRelated(existing?.project));
      return deleted;
    },

    assignTask: (id, assigneeId) => get().patchTask(id, { assignee: assigneeId || null }),
    moveTaskStatus: (id, status) => get().patchTask(id, { status }),

    createMilestone: async (data) => {
      const created = await apiCreateMilestone(data);
      await settle([get().fetchMilestones((data as any).project), get().fetchProjects(), get().fetchPortfolio(), get().fetchActivities((data as any).project)]);
      return created;
    },

    patchMilestone: async (id, data) => {
      const existing = get().milestones.find((m: any) => m.id === id);
      const updated = await apiPatchMilestone(id, data);
      await settle([get().fetchMilestones(updated?.project || existing?.project), get().fetchProjects(), get().fetchPortfolio(), get().fetchActivities(updated?.project || existing?.project)]);
      return updated;
    },

    deleteMilestone: async (id) => {
      const existing = get().milestones.find((m: any) => m.id === id);
      const deleted = await apiDeleteMilestone(id);
      await settle([get().fetchMilestones(existing?.project), get().fetchProjects(), get().fetchPortfolio(), get().fetchActivities(existing?.project)]);
      return deleted;
    },

    createDependency: async (data) => {
      const created = await apiCreateDependency(data);
      await settle([get().fetchDependencies(), get().fetchTasks(), get().fetchActivities(), get().fetchPortfolio()]);
      return created;
    },

    deleteDependency: async (id) => {
      const deleted = await apiDeleteDependency(id);
      await settle([get().fetchDependencies(), get().fetchTasks(), get().fetchActivities(), get().fetchPortfolio()]);
      return deleted;
    },

    createBlocker: async (data) => {
      const created = await apiCreateBlocker(data);
      await refreshBlockerRelated((data as any).project);
      return created;
    },

    escalateBlocker: async (id) => {
      const updated = await apiEscalateBlocker(id);
      await refreshBlockerRelated(updated?.project);
      return updated;
    },

    snoozeBlocker: async (id, hours = 24) => {
      const updated = await apiSnoozeBlocker(id, hours);
      await refreshBlockerRelated(updated?.project);
      return updated;
    },

    reassignBlocker: async (id, assigneeId) => {
      const updated = await apiReassignBlocker(id, assigneeId);
      await refreshBlockerRelated(updated?.project);
      return updated;
    },

    resolveBlocker: async (id) => {
      const updated = await apiResolveBlocker(id);
      await refreshBlockerRelated(updated?.project);
      return updated;
    },

    pullWork: async (taskId, assigneeId) => {
      const pulled = await apiPullWork(taskId, assigneeId);
      await refreshTaskRelated(pulled?.project);
      return pulled;
    },

    createSprint: async (data) => {
      const created = await apiCreateSprint(data);
      await settle([get().fetchSprints((data as any).project), get().fetchProjects(), get().fetchPortfolio(), get().fetchActivities((data as any).project)]);
      return created;
    },

    patchSprint: async (id, data) => {
      const existing = get().sprints.find((s: any) => s.id === id);
      const updated = await apiPatchSprint(id, data);
      await settle([get().fetchSprints(updated?.project || existing?.project), get().fetchProjects(), get().fetchPortfolio(), get().fetchActivities(updated?.project || existing?.project)]);
      return updated;
    },

    lockBacklog: async (id) => {
      const updated = await apiLockBacklog(id);
      await settle([get().fetchSprints(updated?.project), get().fetchActivities(updated?.project)]);
      return updated;
    },

    unlockBacklog: async (id) => {
      const updated = await apiUnlockBacklog(id);
      await settle([get().fetchSprints(updated?.project), get().fetchActivities(updated?.project)]);
      return updated;
    },

    setReviewSla: async (id, hours) => {
      const updated = await apiSetReviewSla(id, hours);
      await settle([get().fetchSprints(updated?.project), get().fetchActivities(updated?.project)]);
      return updated;
    },

    assignDris: async (id) => {
      const updated = await apiAssignDris(id);
      await settle([get().fetchSprints(updated?.project), get().fetchUsers(), get().fetchActivities(updated?.project)]);
      return updated;
    },

    takeSprintSnapshot: async (id) => {
      const snapshot = await apiTakeSprintSnapshot(id);
      await settle([get().fetchSprints(snapshot?.project), get().fetchActivities(snapshot?.project)]);
      return snapshot;
    },

    patchNotification: async (id, data) => {
      const previous = get().notifications;
      set({
        notifications: previous.map((n: any) => (n.id === id ? { ...n, ...data } : n)),
        notificationsStatus: "ready",
        error: null,
      });
      try {
        const updated = await apiPatchNotification(id, data);
        set({
          notifications: get().notifications.map((n: any) => (n.id === id ? { ...n, ...updated } : n)),
          notificationsStatus: "ready",
        });
        return updated;
      } catch (error) {
        set({ notifications: previous, notificationsStatus: "error", error: messageFromError(error) });
        throw error;
      }
    },

    markNotificationRead: (id) => get().patchNotification(id, { read: true }),

    markAllNotificationsRead: async () => {
      const previous = get().notifications;
      const unread = previous.filter((n: any) => !n.read);
      set({ notifications: previous.map((n: any) => ({ ...n, read: true })), notificationsStatus: "ready" });
      const results = await Promise.allSettled(unread.map((n: any) => apiPatchNotification(n.id, { read: true })));
      const failed = results.find((r) => r.status === "rejected");
      if (failed) {
        set({ notifications: previous, notificationsStatus: "error", error: messageFromError((failed as PromiseRejectedResult).reason) });
        throw (failed as PromiseRejectedResult).reason;
      }
      await get().fetchNotifications().catch(() => undefined);
    },

    acceptSuggestion: async (projectId, suggestion) => {
      const accepted = await apiAcceptSuggestion(projectId, suggestion);
      await get().refreshProjectScoped(projectId);
      return accepted;
    },

    dismissSuggestion: async (projectId, suggestionType, suggestionData, reason) => {
      const dismissed = await apiDismissSuggestion(projectId, suggestionType, suggestionData, reason);
      await settle([get().fetchNotifications(), get().fetchActivities(projectId)]);
      return dismissed;
    },
  };
});
