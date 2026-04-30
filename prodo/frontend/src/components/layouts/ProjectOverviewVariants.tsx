"use client";

import React, { useState } from "react";
import {
  Activity, BadgeCheck, OctagonAlert, CircleDot, ListChecks,
  Calendar, ChevronDown, ChevronRight, User, Users,
  Rocket, Bug, Wrench, Sparkles, FileText, TrendingUp,
  AlertTriangle, Clock, Flame, Target, CheckCircle2,
  ArrowRight, BarChart3, Zap, Flag,
} from "lucide-react";

/* ── SHARED DATA ─────────────────────────────────────── */

const PROJ = { name: "Command Center v5", color: "#3b82f6", progress: 20, done: 2, total: 10, active: 3, blocked: 1, target: "2026-07-31", start: "2026-04-01" };

const TASKS = [
  { id: "t1",  title: "Implement Phase B — Fill/RAG",   status: "active",  priority: "high",   assignee: "Rohith", due: "2026-04-25", start: "2026-04-10", est: "16h", deps: [] as string[] },
  { id: "t2",  title: "Fix bento grid overflow bug",     status: "active",  priority: "urgent", assignee: "Rohith", due: "2026-04-11", start: "2026-04-10", est: "2h", deps: [] },
  { id: "t3",  title: "Phase C — Grid Pack",             status: "blocked", priority: "high",   assignee: "",       due: "2026-05-10", start: "2026-04-26", est: "12h", deps: ["t1"] },
  { id: "t4",  title: "Widget renderer PR merge",        status: "active",  priority: "urgent", assignee: "Arjun",  due: "2026-04-11", start: "2026-04-09", est: "1h", deps: [] },
  { id: "t5",  title: "Write RAG integration tests",     status: "todo",    priority: "medium", assignee: "Rohith", due: "2026-04-22", start: "2026-04-18", est: "4h", deps: [] },
  { id: "t6",  title: "Deploy pipeline fix on staging",  status: "blocked", priority: "high",   assignee: "Priya",  due: "2026-04-13", start: "2026-04-11", est: "3h", deps: [] },
  { id: "t7",  title: "Write unit tests for Phase B",    status: "todo",    priority: "medium", assignee: "",       due: "2026-04-22", start: "2026-04-18", est: "6h", deps: [] },
  { id: "t8",  title: "Widget Renderer refactor",        status: "done",    priority: "high",   assignee: "Arjun",  due: "2026-04-16", start: "2026-04-08", est: "8h", deps: [] },
  { id: "t9",  title: "Design pipeline architecture",    status: "done",    priority: "high",   assignee: "Rohith", due: "2026-04-10", start: "2026-04-01", est: "8h", deps: [] },
  { id: "t10", title: "Phase A — Understand",            status: "done",    priority: "high",   assignee: "Rohith", due: "2026-04-15", start: "2026-04-05", est: "12h", deps: [] },
];

const CHANGELOGS = [
  { version: "v4.2.0", date: "Apr 8", title: "AI Dashboard Pipeline", changes: [
    { type: "feature" as const, title: "Phase A - Understand" }, { type: "feature" as const, title: "Phase B - Fill/RAG" },
    { type: "improvement" as const, title: "vLLM guided JSON" }, { type: "fix" as const, title: "Widget memory leak" },
  ]},
  { version: "v4.1.0", date: "Mar 20", title: "Widget System v2", changes: [
    { type: "feature" as const, title: "Gantt, Risk Radar widgets" }, { type: "breaking" as const, title: "Widget API v1 deprecated" },
  ]},
];

const STATUS: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  active:  { label: "Active",  dot: "bg-amber-400",  bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200" },
  blocked: { label: "Blocked", dot: "bg-red-500",    bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200" },
  todo:    { label: "To Do",   dot: "bg-blue-400",   bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200" },
  done:    { label: "Done",    dot: "bg-green-500",  bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200" },
};

const PRIORITY: Record<string, { dot: string }> = {
  urgent: { dot: "bg-red-500" }, high: { dot: "bg-orange-400" }, medium: { dot: "bg-yellow-400" }, low: { dot: "bg-neutral-300" },
};

const CHANGE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  feature: { icon: Sparkles, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  fix: { icon: Bug, color: "text-red-600", bg: "bg-red-50 border-red-200" },
  improvement: { icon: Wrench, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  breaking: { icon: Rocket, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
};

const TODAY = new Date("2026-04-11");
const ME = "Rohith";

function daysUntil(d: string) {
  const diff = Math.ceil((new Date(d).getTime() - TODAY.getTime()) / 86400000);
  return diff < 0 ? `${Math.abs(diff)}d overdue` : diff === 0 ? "today" : `${diff}d`;
}
function daysNum(d: string) { return Math.ceil((new Date(d).getTime() - TODAY.getTime()) / 86400000); }

const todo = PROJ.total - PROJ.done - PROJ.active - PROJ.blocked;
const dl = Math.ceil((new Date(PROJ.target).getTime() - TODAY.getTime()) / 86400000);

/* ── Reusable sub-components ─────────────────────────── */

function TaskRow({ t, compact }: { t: typeof TASKS[0]; compact?: boolean }) {
  const s = STATUS[t.status];
  const dn = daysNum(t.due);
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-neutral-100 bg-white">
      <div className={`w-2 ${compact ? "h-6" : "h-8"} rounded-full shrink-0 ${s?.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-neutral-800 truncate">{t.title}</div>
        {!compact && <div className="text-xs text-neutral-500 mt-0.5">{t.assignee || "Unassigned"} · {t.est}</div>}
      </div>
      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY[t.priority]?.dot}`} />
      <span className={`text-xs font-medium shrink-0 ${dn < 0 ? "text-red-500" : dn <= 3 ? "text-amber-500" : "text-neutral-400"}`}>{daysUntil(t.due)}</span>
    </div>
  );
}

function Section({ icon: Icon, title, count, children, className }: { icon: React.ElementType; title: string; count?: number; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-neutral-200 overflow-hidden ${className ?? ""}`}>
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <Icon className="w-4 h-4 text-neutral-400" />
        <span className="text-sm font-bold text-neutral-900">{title}</span>
        {count !== undefined && <span className="text-xs text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">{count}</span>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   ENGINEER VIEW A — "My Work"
   Focus: my tasks, my blockers, what's next, recent completions
   ═══════════════════════════════════════════════════════════ */
export function EngineerOverviewA() {
  const myTasks = TASKS.filter(t => t.assignee === ME);
  const myActive = myTasks.filter(t => t.status === "active");
  const myTodo = myTasks.filter(t => t.status === "todo");
  const myDone = myTasks.filter(t => t.status === "done");
  const myBlocked = TASKS.filter(t => t.status === "blocked" && t.deps.some(d => TASKS.find(x => x.id === d)?.assignee === ME));
  const urgentToday = myTasks.filter(t => t.status !== "done" && daysNum(t.due) <= 1).sort((a, b) => daysNum(a.due) - daysNum(b.due));

  return (
    <div className="h-[700px] rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 flex flex-col">
      <div className="px-5 py-3 border-b bg-white flex items-center gap-3 shrink-0">
        <User className="w-5 h-5 text-blue-500" />
        <h3 className="text-sm font-bold text-neutral-900">Engineer: My Work</h3>
        <span className="text-xs text-neutral-400">— {ME}</span>
        <div className="flex-1" />
        <span className="text-xs text-neutral-500">{myActive.length} active · {myTodo.length} upcoming</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Urgent / Due today */}
        {urgentToday.length > 0 && (
          <div className="bg-red-50 rounded-2xl border border-red-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-red-500" />
              <span className="text-sm font-bold text-red-700">Needs attention now</span>
              <span className="text-xs text-red-400">{urgentToday.length}</span>
            </div>
            <div className="space-y-2">
              {urgentToday.map(t => <TaskRow key={t.id} t={t} />)}
            </div>
          </div>
        )}

        {/* My active work */}
        <Section icon={Activity} title="Currently working on" count={myActive.length}>
          <div className="space-y-2">
            {myActive.map(t => <TaskRow key={t.id} t={t} />)}
            {myActive.length === 0 && <div className="text-xs text-neutral-400">Nothing active — pick up a task from the queue</div>}
          </div>
        </Section>

        {/* Waiting on me (blocked downstream) */}
        {myBlocked.length > 0 && (
          <Section icon={OctagonAlert} title="Blocked by your work" count={myBlocked.length}>
            <div className="space-y-2">
              {myBlocked.map(t => (
                <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-red-100 bg-red-50/50">
                  <div className="w-2 h-8 rounded-full bg-red-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-800 truncate">{t.title}</div>
                    <div className="text-xs text-red-600 mt-0.5">Waiting on: {t.deps.map(d => TASKS.find(x => x.id === d)?.title).join(", ")}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Up next */}
        <Section icon={Clock} title="Up next" count={myTodo.length}>
          <div className="space-y-2">
            {myTodo.map(t => <TaskRow key={t.id} t={t} />)}
            {myTodo.length === 0 && <div className="text-xs text-neutral-400">Queue is clear</div>}
          </div>
        </Section>

        {/* Recently completed */}
        <Section icon={CheckCircle2} title="Recently completed" count={myDone.length}>
          <div className="space-y-2">
            {myDone.map(t => <TaskRow key={t.id} t={t} compact />)}
          </div>
        </Section>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   ENGINEER VIEW B — "Focus Mode"
   Minimal: one task at a time, today's plan, streak/momentum
   ═══════════════════════════════════════════════════════════ */
export function EngineerOverviewB() {
  const myTasks = TASKS.filter(t => t.assignee === ME && t.status !== "done");
  const sorted = myTasks.sort((a, b) => {
    const pa = a.priority === "urgent" ? 0 : a.priority === "high" ? 1 : 2;
    const pb = b.priority === "urgent" ? 0 : b.priority === "high" ? 1 : 2;
    return pa - pb || daysNum(a.due) - daysNum(b.due);
  });
  const current = sorted[0];
  const rest = sorted.slice(1);
  const myDone = TASKS.filter(t => t.assignee === ME && t.status === "done");

  return (
    <div className="h-[700px] rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 flex flex-col">
      <div className="px-5 py-3 border-b bg-white flex items-center gap-3 shrink-0">
        <Target className="w-5 h-5 text-purple-500" />
        <h3 className="text-sm font-bold text-neutral-900">Engineer: Focus Mode</h3>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-bold text-amber-600">{myDone.length} done</span>
          <span className="text-xs text-neutral-400">this sprint</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Current focus */}
        {current && (
          <div className="rounded-2xl border-2 p-5 space-y-3" style={{ borderColor: PROJ.color + "60", background: PROJ.color + "08" }}>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" style={{ color: PROJ.color }} />
              <span className="text-xs font-bold uppercase" style={{ color: PROJ.color }}>Current focus</span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900">{current.title}</h2>
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {current.est}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due {daysUntil(current.due)}</span>
              <span className={`font-semibold uppercase ${STATUS[current.status]?.text}`}>{STATUS[current.status]?.label}</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden mt-2">
              <div className="h-full rounded-full" style={{ width: "35%", backgroundColor: PROJ.color }} />
            </div>
          </div>
        )}

        {/* Today's plan */}
        <Section icon={Calendar} title="Today's plan">
          <div className="space-y-1.5">
            {sorted.filter(t => daysNum(t.due) <= 7).map((t, i) => (
              <div key={t.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${i === 0 ? "bg-blue-50 border border-blue-200" : "border border-neutral-100"}`}>
                <span className="text-xs font-bold text-neutral-400 w-4">{i + 1}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${STATUS[t.status]?.dot}`} />
                <span className="text-xs text-neutral-800 truncate flex-1">{t.title}</span>
                <span className="text-xs text-neutral-400">{t.est}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Backlog */}
        {rest.filter(t => daysNum(t.due) > 7).length > 0 && (
          <Section icon={ListChecks} title="Later" count={rest.filter(t => daysNum(t.due) > 7).length}>
            <div className="space-y-1.5">
              {rest.filter(t => daysNum(t.due) > 7).map(t => (
                <div key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-neutral-100">
                  <div className={`w-1.5 h-1.5 rounded-full ${STATUS[t.status]?.dot}`} />
                  <span className="text-xs text-neutral-600 truncate flex-1">{t.title}</span>
                  <span className="text-xs text-neutral-400">{daysUntil(t.due)}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Done streak */}
        <Section icon={CheckCircle2} title="Completed">
          <div className="flex gap-2 flex-wrap">
            {myDone.map(t => (
              <span key={t.id} className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-200">{t.title}</span>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   ADMIN VIEW A — "Dashboard"
   Focus: KPIs, team workload, risks, timeline, changelog
   ═══════════════════════════════════════════════════════════ */
export function AdminOverviewA() {
  const people = ["Rohith", "Priya", "Arjun"];
  const blocked = TASKS.filter(t => t.status === "blocked");
  const overdue = TASKS.filter(t => t.status !== "done" && daysNum(t.due) < 0);

  return (
    <div className="h-[700px] rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 flex flex-col">
      <div className="px-5 py-3 border-b bg-white flex items-center gap-3 shrink-0">
        <BarChart3 className="w-5 h-5 text-blue-500" />
        <h3 className="text-sm font-bold text-neutral-900">Admin: Dashboard</h3>
        <div className="flex-1" />
        <span className="text-xs text-neutral-500">{PROJ.progress}% complete · {dl}d to target</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* KPI row */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PROJ.color }} />
            <span className="text-sm font-bold text-neutral-900">{PROJ.name}</span>
            <div className="flex-1" />
            <span className="text-xs font-bold text-neutral-500">{PROJ.progress}%</span>
          </div>
          <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${PROJ.progress}%`, backgroundColor: PROJ.color }} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: BadgeCheck, label: "Done", value: PROJ.done, color: "text-green-600", bg: "bg-green-50" },
              { icon: Activity, label: "Active", value: PROJ.active, color: "text-amber-600", bg: "bg-amber-50" },
              { icon: OctagonAlert, label: "Blocked", value: PROJ.blocked, color: PROJ.blocked > 0 ? "text-red-500" : "text-neutral-300", bg: PROJ.blocked > 0 ? "bg-red-50" : "bg-neutral-50" },
              { icon: CircleDot, label: "To Do", value: todo, color: "text-blue-500", bg: "bg-blue-50" },
            ].map((s, i) => { const I = s.icon; return (
              <div key={i} className={`${s.bg} rounded-xl p-2.5 flex flex-col items-center gap-0.5`}>
                <I className={`w-3.5 h-3.5 ${s.color}`} />
                <span className={`text-base font-black ${s.color}`}>{s.value}</span>
                <span className={`text-xs font-semibold ${s.color} opacity-80`}>{s.label}</span>
              </div>
            ); })}
          </div>
        </div>

        {/* Risk flags */}
        {(blocked.length > 0 || overdue.length > 0) && (
          <div className="bg-red-50 rounded-2xl border border-red-200 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-bold text-red-700">Risk Flags</span>
            </div>
            {blocked.map(t => (
              <div key={t.id} className="flex items-center gap-2 text-xs">
                <OctagonAlert className="w-3 h-3 text-red-500 shrink-0" />
                <span className="text-red-700 font-medium truncate">{t.title}</span>
                <span className="text-red-400 ml-auto shrink-0">blocked</span>
              </div>
            ))}
            {overdue.map(t => (
              <div key={t.id} className="flex items-center gap-2 text-xs">
                <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="text-amber-700 font-medium truncate">{t.title}</span>
                <span className="text-amber-400 ml-auto shrink-0">{daysUntil(t.due)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Team workload */}
        <Section icon={Users} title="Team Workload">
          <div className="space-y-3">
            {people.map(p => {
              const pt = TASKS.filter(t => t.assignee === p);
              const active = pt.filter(t => t.status === "active").length;
              const done = pt.filter(t => t.status === "done").length;
              const totalH = pt.reduce((a, t) => a + parseInt(t.est), 0);
              const load = active >= 3 ? "Overloaded" : active >= 2 ? "Full" : "Available";
              const loadColor = active >= 3 ? "text-red-500" : active >= 2 ? "text-amber-500" : "text-green-500";
              return (
                <div key={p} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-neutral-900 flex items-center justify-center text-xs font-bold text-white shrink-0">{p[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-800">{p}</span>
                      <span className={`text-xs font-semibold ${loadColor}`}>{load}</span>
                    </div>
                    <div className="text-xs text-neutral-400">{active} active · {done} done · {totalH}h total</div>
                  </div>
                  <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${active >= 3 ? "bg-red-400" : active >= 2 ? "bg-amber-400" : "bg-green-400"}`} style={{ width: `${Math.min(100, (active / 3) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Timeline mini */}
        <Section icon={Activity} title="Timeline">
          <div className="space-y-1">
            {["Rohith", "Arjun", "Priya"].map(p => {
              const pt = TASKS.filter(t => t.assignee === p && t.start);
              const rangeStart = new Date("2026-04-01");
              const totalDays = 45;
              return (
                <div key={p} className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500 w-14 shrink-0 truncate">{p}</span>
                  <div className="flex-1 relative h-5">
                    {pt.map(t => {
                      const s = Math.max(0, Math.ceil((new Date(t.start).getTime() - rangeStart.getTime()) / 86400000));
                      const e = Math.ceil((new Date(t.due).getTime() - rangeStart.getTime()) / 86400000);
                      return <div key={t.id} className={`absolute top-0.5 h-4 rounded ${STATUS[t.status]?.dot}`} style={{ left: `${(s / totalDays) * 100}%`, width: `${Math.max(3, ((e - s) / totalDays) * 100)}%` }} title={t.title} />;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Changelog */}
        <Section icon={FileText} title="Recent Releases" count={CHANGELOGS.length}>
          {CHANGELOGS.map(r => (
            <div key={r.version} className="mb-3 last:mb-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-neutral-900 font-mono">{r.version}</span>
                <span className="text-xs text-neutral-400">{r.date}</span>
                <span className="text-xs text-neutral-500">— {r.title}</span>
              </div>
              <div className="space-y-1">
                {r.changes.map((c, i) => { const M = CHANGE_META[c.type]; const CI = M.icon; return (
                  <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${M.bg}`}>
                    <CI className={`w-3 h-3 ${M.color} shrink-0`} />
                    <span className="text-xs text-neutral-700">{c.title}</span>
                  </div>
                ); })}
              </div>
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   ADMIN VIEW B — "Triage"
   Focus: blockers first, overdue, unassigned, team velocity
   Action-oriented for daily standups
   ═══════════════════════════════════════════════════════════ */
export function AdminOverviewB() {
  const blocked = TASKS.filter(t => t.status === "blocked");
  const overdue = TASKS.filter(t => t.status !== "done" && daysNum(t.due) < 0);
  const unassigned = TASKS.filter(t => !t.assignee && t.status !== "done");
  const activeAll = TASKS.filter(t => t.status === "active");
  const doneAll = TASKS.filter(t => t.status === "done");
  const todoAll = TASKS.filter(t => t.status === "todo");
  const people = ["Rohith", "Priya", "Arjun"];

  return (
    <div className="h-[700px] rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 flex flex-col">
      <div className="px-5 py-3 border-b bg-white flex items-center gap-3 shrink-0">
        <Flag className="w-5 h-5 text-red-500" />
        <h3 className="text-sm font-bold text-neutral-900">Admin: Triage</h3>
        <div className="flex-1" />
        <div className="flex items-center gap-3 text-xs">
          <span className="text-red-500 font-bold">{blocked.length} blocked</span>
          <span className="text-amber-500 font-bold">{overdue.length} overdue</span>
          <span className="text-blue-500 font-bold">{unassigned.length} unassigned</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Quick stats bar */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: "Total", value: TASKS.length, bg: "bg-neutral-50", text: "text-neutral-700" },
            { label: "Active", value: activeAll.length, bg: "bg-amber-50", text: "text-amber-700" },
            { label: "Blocked", value: blocked.length, bg: "bg-red-50", text: "text-red-700" },
            { label: "To Do", value: todoAll.length, bg: "bg-blue-50", text: "text-blue-700" },
            { label: "Done", value: doneAll.length, bg: "bg-green-50", text: "text-green-700" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-2 text-center`}>
              <div className={`text-lg font-black ${s.text}`}>{s.value}</div>
              <div className={`text-xs font-semibold ${s.text} opacity-80`}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Blockers — top priority */}
        {blocked.length > 0 && (
          <div className="bg-red-50 rounded-2xl border border-red-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <OctagonAlert className="w-4 h-4 text-red-500" />
              <span className="text-sm font-bold text-red-700">Blockers — resolve first</span>
            </div>
            <div className="space-y-2">
              {blocked.map(t => (
                <div key={t.id} className="bg-white rounded-xl p-3 border border-red-100">
                  <div className="text-sm font-medium text-neutral-800">{t.title}</div>
                  <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                    <span>{t.assignee || "Unassigned"}</span>
                    <span>·</span>
                    <span className="text-red-500 font-medium">Due {daysUntil(t.due)}</span>
                    {t.deps.length > 0 && <>
                      <span>·</span>
                      <span className="text-red-400">Depends on: {t.deps.map(d => TASKS.find(x => x.id === d)?.title).join(", ")}</span>
                    </>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overdue */}
        {overdue.length > 0 && (
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-amber-700">Overdue</span>
            </div>
            <div className="space-y-2">
              {overdue.map(t => <TaskRow key={t.id} t={t} />)}
            </div>
          </div>
        )}

        {/* Unassigned */}
        {unassigned.length > 0 && (
          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-bold text-blue-700">Unassigned — needs owner</span>
            </div>
            <div className="space-y-2">
              {unassigned.map(t => <TaskRow key={t.id} t={t} />)}
            </div>
          </div>
        )}

        {/* Per-person status */}
        <Section icon={Users} title="Team Status">
          <div className="space-y-3">
            {people.map(p => {
              const pt = TASKS.filter(t => t.assignee === p && t.status !== "done");
              const done = TASKS.filter(t => t.assignee === p && t.status === "done").length;
              return (
                <div key={p}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-full bg-neutral-900 flex items-center justify-center text-xs font-bold text-white shrink-0">{p[0]}</div>
                    <span className="text-sm font-medium text-neutral-800">{p}</span>
                    <span className="text-xs text-green-500 font-medium">{done} done</span>
                    <span className="text-xs text-neutral-400">{pt.length} remaining</span>
                  </div>
                  <div className="pl-8 space-y-1">
                    {pt.map(t => (
                      <div key={t.id} className="flex items-center gap-2 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full ${STATUS[t.status]?.dot}`} />
                        <span className="text-neutral-700 truncate flex-1">{t.title}</span>
                        <span className={`${daysNum(t.due) <= 1 ? "text-red-500 font-medium" : "text-neutral-400"}`}>{daysUntil(t.due)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Velocity */}
        <Section icon={TrendingUp} title="Sprint Velocity">
          <div className="flex items-end gap-1 h-16">
            {[3, 2, 4, 2, doneAll.length].map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full rounded-t ${i === 4 ? "bg-blue-400" : "bg-neutral-200"}`} style={{ height: `${(v / 5) * 100}%` }} />
                <span className="text-xs text-neutral-400">W{i + 10}</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-neutral-500 mt-2 text-center">Avg: 2.6 tasks/week · Current: {doneAll.length}</div>
        </Section>
      </div>
    </div>
  );
}
