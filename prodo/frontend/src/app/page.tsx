"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VoiceControlBar from "@/components/layer1/VoiceControlBar";
import UserAvatar from "@/components/UserAvatar";
import AdminOverview from "@/components/AdminOverview";
import { useAuth } from "@/lib/AuthProvider";
import {
  selectDashboardNotifications,
  selectDashboardProjects,
  selectDashboardStats,
  selectDashboardTasks,
  usePMStore,
} from "@/lib/store";
import ActivitiesFeed from "@/components/panels/ActivitiesFeed";
import {
  AlertOctagon, Clock, AtSign, Sparkles, Check, BellOff, UserPlus,
  ArrowUpRight, Zap, Flame, CheckCircle2, Bell, Target, Settings,
  ChevronRight, TrendingUp, Calendar, ExternalLink,
  Filter, CheckCheck, Inbox, Brain,
  FolderOpen, ListChecks, CircleDot, OctagonAlert, CalendarDays,
  SquareStack, Activity, CircleAlert, BadgeCheck, Layers,
  GitBranch, BarChart3, FileText, LayoutGrid, Flag,
} from "lucide-react";

const TODAY = new Date();

function daysLeft(d: string) {
  if (!d) return 0;
  return Math.ceil((new Date(d).getTime() - TODAY.getTime()) / 86400000);
}

const CIRC_ENG = 2 * Math.PI * 42;
const STATUS_META_ENG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  active: { label: "Active", dot: "bg-warn-solid", bg: "bg-warn-bg", text: "text-warn-fg" },
  blocked: { label: "Blocked", dot: "bg-bad-solid", bg: "bg-bad-bg", text: "text-bad-fg" },
  todo: { label: "To Do", dot: "bg-info-solid", bg: "bg-info-bg", text: "text-info-fg" },
  done: { label: "Done", dot: "bg-ok-solid", bg: "bg-ok-bg", text: "text-ok-fg" },
};

const CAT_META_ENG: Record<string, { label: string; icon: React.ElementType; dot: string; text: string; border: string; bg: string }> = {
  blocker: { label: "Blocker", icon: AlertOctagon, dot: "bg-bad-solid", text: "text-bad-solid", border: "border-bad-solid", bg: "bg-bad-bg" },
  overdue: { label: "Overdue", icon: Clock, dot: "bg-warn-solid", text: "text-warn-solid", border: "border-warn-solid", bg: "bg-warn-bg" },
  mention: { label: "Mention", icon: AtSign, dot: "bg-info-solid", text: "text-info-solid", border: "border-info-solid", bg: "bg-info-bg" },
  ai: { label: "AI", icon: Sparkles, dot: "bg-purple-500", text: "text-purple-500", border: "border-purple-200", bg: "bg-purple-50" },
};

/* ── Engineer Activity Panel ─────────────────────────────── */
function EngNotifPanel() {
  const [cat, setCat] = useState("all");
  const notifs = usePMStore(selectDashboardNotifications);
  const markNotificationRead = usePMStore(s => s.markNotificationRead);
  const markAllNotificationsRead = usePMStore(s => s.markAllNotificationsRead);
  const [sel, setSel] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sel && notifs[0]?.id) setSel(notifs[0].id);
    if (sel && notifs.length > 0 && !notifs.some(n => n.id === sel)) setSel(notifs[0].id);
  }, [notifs, sel]);

  const markRead = (id: string) => {
    markNotificationRead(id).then(() => setError("")).catch((e: any) => setError(e.message));
  };

  const filtered = cat === "all" ? notifs : notifs.filter(n => n.cat === cat);
  const selected = notifs.find(n => n.id === sel);
  const unread = notifs.filter(n => !n.read).length;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <div className="px-3 py-2 border-b border-neutral-100 flex items-center gap-2 shrink-0">
        <span className="text-sm font-serif font-bold text-neutral-950">Activity</span>
        {unread > 0 && <span className="text-sm bg-bad-solid text-white font-bold px-1.5 py-0.5 rounded-full">{unread}</span>}
        <button onClick={() => { markAllNotificationsRead().then(() => setError("")).catch((e: any) => setError(e.message)); }}
          className="ml-auto text-sm text-neutral-400 hover:text-neutral-700 flex items-center gap-1">
          <CheckCheck className="w-3 h-3" /> All read
        </button>
      </div>
      {error && <div className="mx-3 mt-2 text-xs text-bad-fg bg-bad-bg rounded px-2 py-1">{error}</div>}
      <div className="px-3 py-1.5 border-b border-neutral-100 flex gap-1 shrink-0">
        {["all", "blocker", "overdue", "mention", "ai"].map(c => {
          const meta = CAT_META_ENG[c];
          const count = c === "all" ? unread : notifs.filter(n => n.cat === c && !n.read).length;
          return (
            <button key={c} onClick={() => setCat(c)}
              className={`text-sm font-semibold px-2 py-1 rounded-lg flex items-center gap-1 transition-all ${cat === c ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100"}`}>
              {meta ? <meta.icon className="w-3 h-3" /> : <Inbox className="w-3 h-3" />}
              {meta?.label ?? "All"}
              {count > 0 && <span className={`text-sm font-bold px-1 rounded-full ${cat === c ? "bg-white/25" : "bg-neutral-200"}`}>{count}</span>}
            </button>
          );
        })}
      </div>
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex-[3] overflow-y-auto border-r border-neutral-100">
          {filtered.map(n => {
            const meta = CAT_META_ENG[n.cat] || CAT_META_ENG.blocker;
            const NIcon = meta.icon;
            const isActive = sel === n.id;
            return (
              <div key={n.id} onClick={() => { setSel(n.id); markRead(n.id); }}
                className={`px-3 py-2 border-b border-neutral-100 cursor-pointer transition-colors relative ${isActive ? "bg-neutral-50" : "hover:bg-neutral-50"}`}>
                {!n.read && <div className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full ${meta.dot}`} />}
                <div className="flex items-start gap-2">
                  <div className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center ${meta.bg} border ${meta.border}`}>
                    <NIcon className={`w-3 h-3 ${meta.text}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1 mb-0.5">
                      <span className={`text-xs font-semibold leading-snug ${!n.read ? "text-neutral-950" : "text-neutral-500"}`}>{n.title}</span>
                      <span className="text-sm text-neutral-400 shrink-0">{n.time}</span>
                    </div>
                    <div className="text-sm text-neutral-500 line-clamp-1">{n.desc}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-sm font-semibold ${meta.text}`}>{meta.label}</span>
                      <span className="text-sm text-neutral-400">{n.project}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {selected && (
          <div className="flex-[2] min-w-0 flex flex-col overflow-y-auto">
            <div className={`px-3 py-2 border-b border-neutral-100 ${CAT_META_ENG[selected.cat]?.bg || "bg-neutral-50"}`}>
              <div className={`text-sm font-bold uppercase tracking-wider flex items-center gap-1 mb-1 ${CAT_META_ENG[selected.cat]?.text}`}>
                {CAT_META_ENG[selected.cat]?.label}
              </div>
              <div className="text-xs font-bold text-neutral-950">{selected.title}</div>
            </div>
            <div className="p-3 flex-1">
              <p className="text-xs text-neutral-600 leading-relaxed mb-3">{selected.desc}</p>
              <div className="text-sm text-neutral-400 mb-4">{selected.from} · {selected.project} · {selected.time}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Engineer Dashboard ──────────────────────────────────── */
function EngineerDashboard() {
  const router = useRouter();
  const projects = usePMStore(selectDashboardProjects);
  const tasks = usePMStore(selectDashboardTasks);
  const { totalTasks, totalDone, totalActive, totalBlocked, totalTodo, overallPct } = usePMStore(selectDashboardStats);
  const [selProject, setSelProject] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const filteredTasks = tasks.filter(t => {
    if (selProject !== "all" && t.project !== projects.find((p: any) => p.id === selProject)?.short) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (urgencyFilter === "urgent") return t.priority === "urgent" || t.priority === "high";
    if (urgencyFilter === "today") return t.status !== "done" && daysLeft(t.due) <= 0;
    if (urgencyFilter === "week") return t.status !== "done" && daysLeft(t.due) <= 7;
    return true;
  });

  const toSlug = (name: string) => `/project/${name.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="h-full flex gap-2">
      {/* LEFT — Overview + Tasks */}
      <div className="w-[50vw] flex flex-col gap-2">
        {/* Greeting + stats */}
        <div className="bg-white rounded-lg border border-neutral-200 p-2.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-[44px] h-[44px] shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border-subtle)" strokeWidth="7" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--ok-solid)" strokeWidth="7"
                  strokeDasharray={`${(totalDone / (totalTasks || 1)) * CIRC_ENG} ${CIRC_ENG}`} strokeLinecap="round" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--warn-solid)" strokeWidth="7"
                  strokeDasharray={`${(totalActive / (totalTasks || 1)) * CIRC_ENG} ${CIRC_ENG}`}
                  strokeDashoffset={`${-(totalDone / (totalTasks || 1)) * CIRC_ENG}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-mono font-black text-neutral-950">{overallPct}%</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-sm text-neutral-400 uppercase tracking-widest">{greeting}</div>
              <div className="text-sm text-neutral-500">{totalDone}/{totalTasks} tasks · {projects.length} projects</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <div className="bg-ok-bg rounded px-2 py-1 text-center border border-ok-solid/20">
                <div className="text-xs font-black text-ok-fg">{totalDone}</div>
                <div className="text-sm text-ok-fg">Done</div>
              </div>
              <div className="bg-warn-bg rounded px-2 py-1 text-center border border-warn-solid/20">
                <div className="text-xs font-black text-warn-fg">{totalActive}</div>
                <div className="text-sm text-warn-fg">Active</div>
              </div>
              <div className="bg-bad-bg rounded px-2 py-1 text-center border border-bad-solid/20">
                <div className="text-xs font-black text-bad-fg">{totalBlocked}</div>
                <div className="text-sm text-bad-fg">Blocked</div>
              </div>
              <div className="bg-info-bg rounded px-2 py-1 text-center border border-info-solid/20">
                <div className="text-xs font-black text-info-fg">{totalTodo}</div>
                <div className="text-sm text-info-fg">To Do</div>
              </div>
            </div>
          </div>
        </div>

        {/* Project selector — segment bar */}
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shrink-0">
          <div className="flex h-10 gap-[2px] bg-neutral-100">
            <button onClick={() => setSelProject("all")}
              className={`relative h-full flex items-center justify-center px-3 transition-all`}
              style={{ flex: 2, backgroundColor: selProject === "all" ? "#3D3837" : "#3D383715" }}>
              <span className={`text-sm font-bold ${selProject === "all" ? "text-white" : "text-neutral-600"}`}>All</span>
            </button>
            {projects.map((p: any) => {
              const active = selProject === p.id;
              return (
                <button key={p.id} onClick={() => setSelProject(active ? "all" : p.id)}
                  className="relative h-full flex items-center justify-center transition-all"
                  style={{ flex: p.total || 1, backgroundColor: active ? p.color : `${p.color}30` }}>
                  <div className="flex flex-col items-center px-1">
                    <span className={`text-sm font-bold ${active ? "text-white" : "text-neutral-700"}`}>{p.short}</span>
                    <span className={`text-sm ${active ? "text-white/70" : "text-neutral-400"}`}>{p.progress}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Task list card */}
        <div className="bg-white rounded-lg border border-neutral-200 flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Status filter */}
          <div className="px-3 py-1.5 border-b border-neutral-100 flex gap-1.5 shrink-0 flex-wrap">
            {[
              { key: "all", label: "All", count: filteredTasks.length },
              { key: "active", label: "Active", count: filteredTasks.filter(t => t.status === "active").length },
              { key: "blocked", label: "Blocked", count: filteredTasks.filter(t => t.status === "blocked").length },
              { key: "todo", label: "To Do", count: filteredTasks.filter(t => t.status === "todo").length },
              { key: "done", label: "Done", count: filteredTasks.filter(t => t.status === "done").length },
            ].map(f => {
              const meta = STATUS_META_ENG[f.key];
              return (
                <button key={f.key} onClick={() => setStatusFilter(f.key)}
                  className={`text-sm font-semibold px-2 py-1 rounded-lg transition-all ${
                    statusFilter === f.key ? "bg-neutral-900 text-white" : meta ? `${meta.bg} ${meta.text}` : "bg-neutral-100 text-neutral-600"
                  }`}>
                  {f.count} {f.label}
                </button>
              );
            })}
            <div className="flex-1" />
            {["all", "urgent", "today", "week"].map(f => (
              <button key={f} onClick={() => setUrgencyFilter(f)}
                className={`text-sm font-medium px-2 py-1 rounded-lg transition-all ${
                  urgencyFilter === f ? "bg-neutral-900 text-white" : "text-neutral-400 hover:bg-neutral-100"
                }`}>
                {f === "all" ? "All" : f === "urgent" ? "Urgent" : f === "today" ? "Today" : "This Week"}
              </button>
            ))}
          </div>

          {/* Task rows */}
          <div className="flex-1 overflow-y-auto">
            {filteredTasks.filter(t => statusFilter === "all" || t.status === statusFilter).map(t => {
              const s = STATUS_META_ENG[t.status] || STATUS_META_ENG.todo;
              const dl = daysLeft(t.due);
              return (
                <div key={t.id} onClick={() => router.push(toSlug(projects.find((p: any) => p.short === t.project)?.name || ""))}
                  className="px-3 py-2 border-b border-neutral-50 hover:bg-neutral-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                    <span className="text-xs font-medium text-neutral-800 truncate flex-1">{t.title}</span>
                    <span className="text-sm text-neutral-400 shrink-0">{t.project}</span>
                    <span className={`text-sm font-semibold px-2 py-0.5 rounded-lg shrink-0 ${s.bg} ${s.text}`}>{s.label}</span>
                    <span className={`text-sm font-bold shrink-0 ${dl < 0 ? "text-bad-fg" : dl <= 3 ? "text-warn-fg" : "text-neutral-400"}`}>
                      {dl < 0 ? `${Math.abs(dl)}d overdue` : dl === 0 ? "today" : `${dl}d`}
                    </span>
                  </div>
                </div>
              );
            })}
            {filteredTasks.length === 0 && <div className="px-3 py-8 text-center text-xs text-neutral-400">No tasks match</div>}
          </div>
        </div>
      </div>

      {/* RIGHT — Activity */}
      <div className="flex-1 min-h-0">
        <EngNotifPanel />
      </div>
    </div>
  );
}

// ── CREATE DROPDOWN (Figma: dark button with chevron, dropdown menu) ──

function CreateDropdown({ onCreateTask, onCreateProject }: { onCreateTask: () => void; onCreateProject: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button onClick={() => setOpen(!open)}
        className="bg-neutral-900 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-neutral-800 transition-colors">
        <span className="text-lg leading-none">+</span> Create
        <ChevronRight className={`w-3 h-3 opacity-40 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg border border-neutral-200 shadow-lg overflow-hidden min-w-[140px]">
            <button onClick={() => { setOpen(false); onCreateTask(); }}
              className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 transition-colors">
              <span className="text-base leading-none text-neutral-400">+</span> Task
            </button>
            <div className="h-px bg-neutral-100" />
            <button onClick={() => { setOpen(false); onCreateProject(); }}
              className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 transition-colors">
              <span className="text-base leading-none text-neutral-400">+</span> Project
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── ADMIN PAGE WRAPPER (unified header + AdminOverview with wired create modals) ──

function AdminPageWrapper({ greeting, nearestDeadline, user }: { greeting: string; nearestDeadline: number; user: any }) {
  return (
    <div className="h-full bg-neutral-50 overflow-hidden flex flex-col">
      <div className="flex-1 min-h-0">
        <AdminOverview />
      </div>
      <VoiceControlBar />
    </div>
  );
}

// ── PAGE ─────────────────────────────────────────────────────

export default function TestLandingPage() {
  const { user, loading } = useAuth();
  const projects = usePMStore(selectDashboardProjects);
  const projectsStatus = usePMStore(s => s.projectsStatus);
  const tasksStatus = usePMStore(s => s.tasksStatus);
  const notificationsStatus = usePMStore(s => s.notificationsStatus);
  const portfolioStatus = usePMStore(s => s.portfolioStatus);
  const fetchAll = usePMStore(s => s.fetchAll);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const needsFetch = [projectsStatus, tasksStatus, notificationsStatus, portfolioStatus].some(status => status === "idle");
    if (needsFetch) fetchAll().catch(err => console.error("API fetch failed:", err));
  }, [fetchAll, projectsStatus, tasksStatus, notificationsStatus, portfolioStatus]);

  const dataLoading = projects.length === 0 && [projectsStatus, tasksStatus, notificationsStatus].some(status => status === "idle" || status === "loading");

  if (loading || dataLoading) {
    return (
      <div className="h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg mx-auto animate-pulse object-cover" />
          <div className="text-sm text-neutral-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-sm font-bold mx-auto">N</div>
          <div className="text-sm text-neutral-500">No projects found</div>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const deadlines = projects.map((p: any) => daysLeft(p.target)).filter((d: number) => d > 0);
    const nearestDeadline = deadlines.length > 0 ? Math.min(...deadlines) : 0;

    return (
      <AdminPageWrapper
        greeting={greeting}
        nearestDeadline={nearestDeadline}
        user={user}
      />
    );
  }

  // Everyone else (engineer or unknown role) gets the engineer/V1A layout
  return (
    <div className="h-screen bg-neutral-50 overflow-hidden flex flex-col">
      <div className="bg-white border-b border-neutral-200 px-5 py-2 flex items-center gap-3 shrink-0">
        <img src="/logo.png" alt="Logo" className="w-6 h-6 rounded-lg shrink-0 object-cover" />
        <span className="text-sm font-semibold text-neutral-700">My Work</span>
        <div className="flex-1" />
        <Link href="/calendar" className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
          <Calendar className="w-4 h-4 text-neutral-400" />
        </Link>
        <button className="relative p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
          <Bell className="w-4 h-4 text-neutral-400" />
        </button>
        <UserAvatar />
      </div>
      <div className="flex-1 min-h-0 p-3">
        <EngineerDashboard />
      </div>
      <VoiceControlBar />
    </div>
  );
}
