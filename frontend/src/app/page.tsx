"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VoiceControlBar from "@/components/layer1/VoiceControlBar";
import UserAvatar from "@/components/UserAvatar";
import AdminOverview from "@/components/AdminOverview";
import { useAuth } from "@/lib/AuthProvider";
import { fetchProjects, fetchTasks, fetchNotifications, patchNotification } from "@/lib/api";
import {
  AlertOctagon, Clock, AtSign, Sparkles, Check, BellOff, UserPlus,
  ArrowUpRight, Zap, Flame, CheckCircle2, Bell, Target, Settings,
  ChevronRight, TrendingUp, Calendar, ExternalLink,
  Filter, CheckCheck, Inbox, Brain,
  FolderOpen, ListChecks, CircleDot, OctagonAlert, CalendarDays,
  SquareStack, Activity, CircleAlert, BadgeCheck, Layers,
} from "lucide-react";

// ── MUTABLE DATA (populated from API) ────────────────────────

let PROJECTS: any[] = [];
let NOTIFICATIONS: any[] = [];
let FOCUS_TASK = { title: "", due: "", est: "", project: "" };
const TODAY = new Date();
let ALL_TASKS: any[] = [];

let totalTasks = 0;
let totalDone = 0;
let totalActive = 0;
let totalBlocked = 0;
let totalTodo = 0;
let overallPct = 0;

function recomputeStats() {
  totalTasks = PROJECTS.reduce((s: number, p: any) => s + (p.total || 0), 0);
  totalDone = PROJECTS.reduce((s: number, p: any) => s + (p.done || 0), 0);
  totalActive = PROJECTS.reduce((s: number, p: any) => s + (p.active || 0), 0);
  totalBlocked = PROJECTS.reduce((s: number, p: any) => s + (p.blocked || 0), 0);
  totalTodo = Math.max(0, totalTasks - totalDone - totalActive - totalBlocked);
  overallPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
}

function daysLeft(d: string) {
  if (!d) return 0;
  return Math.ceil((new Date(d).getTime() - TODAY.getTime()) / 86400000);
}

const CIRC_ENG = 2 * Math.PI * 42;
const STATUS_META_ENG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  active: { label: "Active", dot: "bg-amber-400", bg: "bg-amber-50", text: "text-amber-700" },
  blocked: { label: "Blocked", dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700" },
  todo: { label: "To Do", dot: "bg-blue-400", bg: "bg-blue-50", text: "text-blue-700" },
  done: { label: "Done", dot: "bg-emerald-500", bg: "bg-green-50", text: "text-green-700" },
};

const CAT_META_ENG: Record<string, { label: string; icon: React.ElementType; dot: string; text: string; border: string; bg: string }> = {
  blocker: { label: "Blocker", icon: AlertOctagon, dot: "bg-red-500", text: "text-red-500", border: "border-red-200", bg: "bg-red-50" },
  overdue: { label: "Overdue", icon: Clock, dot: "bg-amber-500", text: "text-amber-500", border: "border-amber-200", bg: "bg-amber-50" },
  mention: { label: "Mention", icon: AtSign, dot: "bg-blue-500", text: "text-blue-500", border: "border-blue-200", bg: "bg-blue-50" },
  ai: { label: "AI", icon: Sparkles, dot: "bg-purple-500", text: "text-purple-500", border: "border-purple-200", bg: "bg-purple-50" },
};

/* ── Engineer Activity Panel ─────────────────────────────── */
function EngNotifPanel() {
  const [cat, setCat] = useState("all");
  const [sel, setSel] = useState(NOTIFICATIONS[0]?.id || "");
  const [notifs, setNotifs] = useState(NOTIFICATIONS);

  const markRead = (id: string) => {
    setNotifs(prev => prev.map(x => x.id === id ? { ...x, read: true } : x));
    patchNotification(id, { read: true }).catch(() => {});
  };

  const filtered = cat === "all" ? notifs : notifs.filter(n => n.cat === cat);
  const selected = notifs.find(n => n.id === sel);
  const unread = notifs.filter(n => !n.read).length;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <div className="px-3 py-2 border-b border-neutral-100 flex items-center gap-2 shrink-0">
        <span className="text-sm font-bold text-neutral-900">Activity</span>
        {unread > 0 && <span className="text-[11px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full">{unread}</span>}
        <button onClick={() => { setNotifs(n => n.map(x => ({ ...x, read: true }))); notifs.filter(x => !x.read).forEach(x => patchNotification(x.id, { read: true }).catch(() => {})); }}
          className="ml-auto text-[11px] text-neutral-400 hover:text-neutral-700 flex items-center gap-1">
          <CheckCheck className="w-3 h-3" /> All read
        </button>
      </div>
      <div className="px-3 py-1.5 border-b border-neutral-100 flex gap-1 shrink-0">
        {["all", "blocker", "overdue", "mention", "ai"].map(c => {
          const meta = CAT_META_ENG[c];
          const count = c === "all" ? unread : notifs.filter(n => n.cat === c && !n.read).length;
          return (
            <button key={c} onClick={() => setCat(c)}
              className={`text-[11px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1 transition-all ${cat === c ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100"}`}>
              {meta ? <meta.icon className="w-3 h-3" /> : <Inbox className="w-3 h-3" />}
              {meta?.label ?? "All"}
              {count > 0 && <span className={`text-[11px] font-bold px-1 rounded-full ${cat === c ? "bg-white/25" : "bg-neutral-200"}`}>{count}</span>}
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
                      <span className={`text-xs font-semibold leading-snug ${!n.read ? "text-neutral-900" : "text-neutral-500"}`}>{n.title}</span>
                      <span className="text-[11px] text-neutral-400 shrink-0">{n.time}</span>
                    </div>
                    <div className="text-[11px] text-neutral-500 line-clamp-1">{n.desc}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[11px] font-semibold ${meta.text}`}>{meta.label}</span>
                      <span className="text-[11px] text-neutral-400">{n.project}</span>
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
              <div className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 mb-1 ${CAT_META_ENG[selected.cat]?.text}`}>
                {CAT_META_ENG[selected.cat]?.label}
              </div>
              <div className="text-xs font-bold text-neutral-900">{selected.title}</div>
            </div>
            <div className="p-3 flex-1">
              <p className="text-xs text-neutral-600 leading-relaxed mb-3">{selected.desc}</p>
              <div className="text-[11px] text-neutral-400 mb-4">{selected.from} · {selected.project} · {selected.time}</div>
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
  const [selProject, setSelProject] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const filteredTasks = ALL_TASKS.filter(t => {
    if (selProject !== "all" && t.project !== PROJECTS.find((p: any) => p.id === selProject)?.short) return false;
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
                <circle cx="50" cy="50" r="42" fill="none" stroke="#f5f5f5" strokeWidth="7" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="#22c55e" strokeWidth="7"
                  strokeDasharray={`${(totalDone / (totalTasks || 1)) * CIRC_ENG} ${CIRC_ENG}`} strokeLinecap="round" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="#f59e0b" strokeWidth="7"
                  strokeDasharray={`${(totalActive / (totalTasks || 1)) * CIRC_ENG} ${CIRC_ENG}`}
                  strokeDashoffset={`${-(totalDone / (totalTasks || 1)) * CIRC_ENG}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-black text-neutral-900">{overallPct}%</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[11px] text-neutral-400 uppercase tracking-widest">{greeting}</div>
              <div className="text-[11px] text-neutral-500">{totalDone}/{totalTasks} tasks · {PROJECTS.length} projects</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <div className="bg-emerald-50 rounded px-2 py-1 text-center border border-emerald-100">
                <div className="text-xs font-black text-emerald-700">{totalDone}</div>
                <div className="text-[11px] text-emerald-600">Done</div>
              </div>
              <div className="bg-amber-50 rounded px-2 py-1 text-center border border-amber-100">
                <div className="text-xs font-black text-amber-700">{totalActive}</div>
                <div className="text-[11px] text-amber-600">Active</div>
              </div>
              <div className="bg-red-50 rounded px-2 py-1 text-center border border-red-100">
                <div className="text-xs font-black text-red-700">{totalBlocked}</div>
                <div className="text-[11px] text-red-600">Blocked</div>
              </div>
              <div className="bg-blue-50 rounded px-2 py-1 text-center border border-blue-100">
                <div className="text-xs font-black text-blue-700">{totalTodo}</div>
                <div className="text-[11px] text-blue-600">To Do</div>
              </div>
            </div>
          </div>
        </div>

        {/* Project selector — segment bar */}
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shrink-0">
          <div className="flex h-10 gap-[2px] bg-neutral-100">
            <button onClick={() => setSelProject("all")}
              className={`relative h-full flex items-center justify-center px-3 transition-all`}
              style={{ flex: 2, backgroundColor: selProject === "all" ? "#171717" : "#17171715" }}>
              <span className={`text-[11px] font-bold ${selProject === "all" ? "text-white" : "text-neutral-600"}`}>All</span>
            </button>
            {PROJECTS.map((p: any) => {
              const active = selProject === p.id;
              return (
                <button key={p.id} onClick={() => setSelProject(active ? "all" : p.id)}
                  className="relative h-full flex items-center justify-center transition-all"
                  style={{ flex: p.total || 1, backgroundColor: active ? p.color : `${p.color}30` }}>
                  <div className="flex flex-col items-center px-1">
                    <span className={`text-[11px] font-bold ${active ? "text-white" : "text-neutral-700"}`}>{p.short}</span>
                    <span className={`text-[11px] ${active ? "text-white/70" : "text-neutral-400"}`}>{p.progress}%</span>
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
                  className={`text-[11px] font-semibold px-2 py-1 rounded-lg transition-all ${
                    statusFilter === f.key ? "bg-neutral-900 text-white" : meta ? `${meta.bg} ${meta.text}` : "bg-neutral-100 text-neutral-600"
                  }`}>
                  {f.count} {f.label}
                </button>
              );
            })}
            <div className="flex-1" />
            {["all", "urgent", "today", "week"].map(f => (
              <button key={f} onClick={() => setUrgencyFilter(f)}
                className={`text-[11px] font-medium px-2 py-1 rounded-lg transition-all ${
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
                <div key={t.id} onClick={() => router.push(toSlug(PROJECTS.find((p: any) => p.short === t.project)?.name || ""))}
                  className="px-3 py-2 border-b border-neutral-50 hover:bg-neutral-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                    <span className="text-xs font-medium text-neutral-800 truncate flex-1">{t.title}</span>
                    <span className="text-[11px] text-neutral-400 shrink-0">{t.project}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg shrink-0 ${s.bg} ${s.text}`}>{s.label}</span>
                    <span className={`text-[11px] font-bold shrink-0 ${dl < 0 ? "text-red-600" : dl <= 3 ? "text-amber-600" : "text-neutral-400"}`}>
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

// ── PAGE ─────────────────────────────────────────────────────

export default function TestLandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin";
  const [selProject, setSelProject] = useState("all");
  const [loaded, setLoaded] = useState(false);
  const [, forceUpdate] = useState(0);

  // Engineer flag
  const isEngineer = !loading && user && user.role === "engineer";

  useEffect(() => {
    Promise.all([fetchProjects(), fetchTasks(), fetchNotifications()])
      .then(([projects, tasks, notifs]) => {
        PROJECTS = projects.map((p: any) => ({
          id: p.id, name: p.name, short: p.short || p.name.slice(0, 4),
          progress: p.progress, done: p.done_count, total: p.task_count,
          active: p.active_count, blocked: p.blocked_count,
          target: p.target_date, start: p.start_date, color: p.color || "#3b82f6",
          description: p.description,
        }));
        ALL_TASKS = tasks.map((t: any) => ({
          id: t.id, title: t.title, project: PROJECTS.find((p: any) => p.id === t.project)?.short || "",
          status: t.status === "in_progress" ? "active" : t.status,
          due: t.due_date, est: t.estimated_hours ? `${t.estimated_hours}h` : "", priority: t.priority,
        }));
        NOTIFICATIONS = notifs.map((n: any) => ({
          id: n.id, cat: n.category, title: n.title, desc: n.description,
          project: n.project_short, from: n.from_user, time: n.time_ago,
          read: n.read, actions: n.actions || [],
        }));
        const activeTask = ALL_TASKS.find((t: any) => t.status === "active" && t.priority === "high");
        if (activeTask) FOCUS_TASK = { title: activeTask.title, due: activeTask.due, est: activeTask.est, project: activeTask.project };
        recomputeStats();
        setLoaded(true);
        forceUpdate(n => n + 1);
      })
      .catch(err => { console.error("API fetch failed:", err); setLoaded(true); });
  }, []);

  const selProj = PROJECTS.find(p => p.id === selProject);

  if (!loaded) {
    return (
      <div className="h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-sm font-bold mx-auto animate-pulse">N</div>
          <div className="text-sm text-neutral-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (PROJECTS.length === 0) {
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
    return (
      <div className="h-screen bg-neutral-100 overflow-hidden flex flex-col">
        {/* ── TOP BAR ── */}
        <div className="bg-white border-b border-neutral-200 px-5 py-2 flex items-center gap-3 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-xs font-bold shrink-0">N</div>
          <span className="text-sm font-semibold text-neutral-700">Portfolio Overview</span>
          <div className="flex-1" />
          <button className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${
            totalBlocked > 0 ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200" : "text-neutral-300 cursor-default"
          }`}>
            <Target className="w-3.5 h-3.5" /> Focus
          </button>
          <Link href="/calendar" className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <Calendar className="w-4 h-4 text-neutral-400" />
          </Link>
          <button className="relative p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <Bell className="w-4 h-4 text-neutral-400" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <Settings className="w-4 h-4 text-neutral-400" />
          </button>
          <UserAvatar />
        </div>
        <div className="flex-1 min-h-0">
          <AdminOverview />
        </div>
        <VoiceControlBar />
      </div>
    );
  }

  // Everyone else (engineer or unknown role) gets the engineer/V1A layout
  return (
    <div className="h-screen bg-neutral-100 overflow-hidden flex flex-col">
      <div className="bg-white border-b border-neutral-200 px-5 py-2 flex items-center gap-3 shrink-0">
        <div className="w-6 h-6 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-xs font-bold shrink-0">N</div>
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
