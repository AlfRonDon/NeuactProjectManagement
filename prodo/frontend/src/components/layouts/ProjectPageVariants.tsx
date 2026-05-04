"use client";

import React, { useState } from "react";
import {
  Activity, BadgeCheck, OctagonAlert, CircleDot, ListChecks,
  Calendar, ChevronDown, Filter, Search,
  Rocket, Bug, Wrench, Sparkles, FileText, Users,
  ArrowRight, GitBranch, Clock, Flag,
  MoreHorizontal, ChevronRight,
} from "lucide-react";

/* ── SHARED DATA ─────────────────────────────────────── */

const PROJ = { name: "Command Center v5", color: "#6366F1", progress: 20, done: 2, total: 10, active: 3, blocked: 1, target: "2026-07-31", start: "2026-04-01" };

const TASKS = [
  { id: "t1",  title: "Implement Phase B — Fill/RAG",   desc: "RAG pipeline with vLLM guided decoding", status: "active",  priority: "high",   assignee: "Rohith", due: "2026-04-25", start: "2026-04-10", est: "16h", deps: [] as string[] },
  { id: "t2",  title: "Fix bento grid overflow bug",     desc: "Grid items overflow on narrow viewports", status: "active",  priority: "urgent", assignee: "Rohith", due: "2026-04-11", start: "2026-04-10", est: "2h", deps: [] },
  { id: "t3",  title: "Phase C — Grid Pack",             desc: "Bento grid packing algorithm", status: "blocked", priority: "high",   assignee: "",       due: "2026-05-10", start: "2026-04-26", est: "12h", deps: ["t1"] },
  { id: "t4",  title: "Widget renderer PR merge",        desc: "", status: "active",  priority: "urgent", assignee: "Arjun",  due: "2026-04-11", start: "2026-04-09", est: "1h", deps: [] },
  { id: "t5",  title: "Write RAG integration tests",     desc: "Full integration test suite for Phase B", status: "todo",    priority: "medium", assignee: "",       due: "2026-04-22", start: "2026-04-18", est: "4h", deps: [] },
  { id: "t6",  title: "Deploy pipeline fix on staging",  desc: "CI job #482 timed out", status: "blocked", priority: "high",   assignee: "",       due: "2026-04-13", start: "2026-04-11", est: "3h", deps: [] },
  { id: "t7",  title: "Write unit tests for Phase B",    desc: "", status: "todo",    priority: "medium", assignee: "",       due: "2026-04-22", start: "2026-04-18", est: "6h", deps: [] },
  { id: "t8",  title: "Widget Renderer refactor",        desc: "Complete rewrite with React.memo", status: "done",    priority: "high",   assignee: "Arjun",  due: "2026-04-16", start: "2026-04-08", est: "8h", deps: [] },
  { id: "t9",  title: "Design pipeline architecture",    desc: "Define the A→B→C→D pipeline", status: "done",    priority: "high",   assignee: "Rohith", due: "2026-04-10", start: "2026-04-01", est: "8h", deps: [] },
  { id: "t10", title: "Phase A — Understand",            desc: "NL query parsing with Qwen3.5", status: "done",    priority: "high",   assignee: "Rohith", due: "2026-04-15", start: "2026-04-05", est: "12h", deps: [] },
];

const CHANGELOGS = [
  { version: "v4.2.0", date: "Apr 8", title: "AI Dashboard Pipeline", changes: [
    { type: "feature" as const, title: "Phase A - Understand" }, { type: "feature" as const, title: "Phase B - Fill/RAG" },
    { type: "improvement" as const, title: "vLLM guided JSON" }, { type: "fix" as const, title: "Widget memory leak" },
  ], contributors: ["Rohith", "Priya"] },
  { version: "v4.1.0", date: "Mar 20", title: "Widget System v2", changes: [
    { type: "feature" as const, title: "Gantt, Risk Radar widgets" }, { type: "breaking" as const, title: "Widget API v1 deprecated" },
  ], contributors: ["Rohith", "Arjun"] },
];

const STATUS: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  active:  { label: "Active",  dot: "bg-warn-solid",  bg: "bg-warn-bg",  text: "text-warn-fg",  border: "border-warn-solid/20" },
  blocked: { label: "Blocked", dot: "bg-bad-solid",    bg: "bg-bad-bg",    text: "text-bad-fg",    border: "border-bad-solid/20" },
  todo:    { label: "To Do",   dot: "bg-info-solid",   bg: "bg-info-bg",   text: "text-info-fg",   border: "border-info-solid/20" },
  done:    { label: "Done",    dot: "bg-ok-solid",  bg: "bg-ok-bg",  text: "text-ok-fg",  border: "border-ok-solid/20" },
};

const PRIORITY: Record<string, { dot: string; label: string }> = {
  urgent: { dot: "bg-bad-solid", label: "Urgent" }, high: { dot: "bg-hot-solid", label: "High" },
  medium: { dot: "bg-warn-solid", label: "Medium" }, low: { dot: "bg-neutral-300", label: "Low" },
};

const CHANGE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  feature: { icon: Sparkles, color: "text-info-fg", bg: "bg-info-bg border-info-solid/20" },
  fix: { icon: Bug, color: "text-bad-fg", bg: "bg-bad-bg border-bad-solid/20" },
  improvement: { icon: Wrench, color: "text-warn-fg", bg: "bg-warn-bg border-warn-solid/20" },
  breaking: { icon: Rocket, color: "text-bad-fg", bg: "bg-bad-bg border-bad-solid/20" },
};

const TODAY = new Date("2026-04-11");
function daysUntil(d: string) { const diff = Math.ceil((new Date(d).getTime() - TODAY.getTime()) / 86400000); return diff < 0 ? `${Math.abs(diff)}d over` : diff === 0 ? "today" : `${diff}d`; }

const todo = PROJ.total - PROJ.done - PROJ.active - PROJ.blocked;
const dl = Math.ceil((new Date(PROJ.target).getTime() - TODAY.getTime()) / 86400000);

/* ── Shared sub-components ───────────────────────────── */

function KpiBar() {
  const stats = [
    { icon: BadgeCheck, label: "Done", value: PROJ.done, color: "text-ok-fg", bg: "bg-ok-bg" },
    { icon: Activity, label: "Active", value: PROJ.active, color: "text-warn-fg", bg: "bg-warn-bg" },
    { icon: OctagonAlert, label: "Blocked", value: PROJ.blocked, color: PROJ.blocked > 0 ? "text-bad-fg" : "text-neutral-300", bg: PROJ.blocked > 0 ? "bg-bad-bg" : "bg-neutral-50" },
    { icon: CircleDot, label: "To Do", value: todo, color: "text-info-fg", bg: "bg-info-bg" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PROJ.color }} />
        <span className="text-sm font-serif font-bold text-neutral-950">{PROJ.name}</span>
        <div className="flex-1" />
        <span className="text-xs font-bold text-neutral-500">{PROJ.progress}%</span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-warn-bg text-warn-fg">{dl}d left</span>
      </div>
      <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${PROJ.progress}%`, backgroundColor: PROJ.color }} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {stats.map((s, i) => { const I = s.icon; return (
          <div key={i} className={`${s.bg} rounded-lg p-2.5 flex flex-col items-center gap-0.5`}>
            <I className={`w-3.5 h-3.5 ${s.color}`} />
            <span className={`text-base font-black ${s.color}`}>{s.value}</span>
            <span className={`text-xs font-semibold ${s.color} opacity-80`}>{s.label}</span>
          </div>
        ); })}
      </div>
    </div>
  );
}

function MiniChangelog() {
  return (
    <div className="space-y-3">
      {CHANGELOGS.map(r => (
        <div key={r.version} className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-950 font-mono">{r.version}</span>
            <span className="text-xs text-neutral-400">{r.date}</span>
            <span className="text-xs text-neutral-500">— {r.title}</span>
          </div>
          {r.changes.map((c, i) => { const M = CHANGE_META[c.type]; const CI = M.icon; return (
            <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${M.bg}`}>
              <CI className={`w-3 h-3 ${M.color} shrink-0`} />
              <span className="text-xs text-neutral-700">{c.title}</span>
            </div>
          ); })}
        </div>
      ))}
    </div>
  );
}

function MiniTimeline() {
  const people = ["Rohith", "Arjun", "Unassigned"];
  const rangeStart = new Date("2026-04-01");
  const rangeEnd = new Date("2026-05-15");
  const totalDays = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / 86400000);
  return (
    <div className="space-y-1">
      {people.map(p => {
        const pt = TASKS.filter(t => (p === "Unassigned" ? !t.assignee : t.assignee === p) && t.start);
        if (pt.length === 0) return null;
        return (
          <div key={p} className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 w-16 shrink-0 truncate">{p}</span>
            <div className="flex-1 relative h-6">
              {pt.map(t => {
                const s = Math.max(0, Math.ceil((new Date(t.start).getTime() - rangeStart.getTime()) / 86400000));
                const e = Math.ceil((new Date(t.due).getTime() - rangeStart.getTime()) / 86400000);
                const left = (s / totalDays) * 100;
                const width = Math.max(3, ((e - s) / totalDays) * 100);
                return (
                  <div key={t.id} className={`absolute top-1 h-4 rounded ${STATUS[t.status]?.dot ?? "bg-neutral-300"} cursor-pointer`}
                    style={{ left: `${left}%`, width: `${width}%` }} title={t.title} />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskDetailPanel({ task }: { task: typeof TASKS[0] }) {
  const [tab, setTab] = useState<"detail" | "deps" | "timeline">("detail");
  const s = STATUS[task.status];
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b flex items-center gap-1 shrink-0 bg-white">
        {(["detail", "deps", "timeline"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize transition-colors ${tab === t ? "bg-neutral-900 text-white" : "text-neutral-400 hover:bg-neutral-100"}`}>
            {t === "deps" ? "Dependencies" : t === "detail" ? "Detail" : "Timeline"}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "detail" && (
          <div className="space-y-4">
            <div>
              <div className={`inline-block text-xs font-bold uppercase px-2.5 py-0.5 rounded-full mb-2 ${s?.bg} ${s?.text} border ${s?.border}`}>{s?.label}</div>
              <h2 className="text-base font-serif font-bold text-neutral-950">{task.title}</h2>
              {task.desc && <p className="text-xs text-neutral-500 mt-1">{task.desc}</p>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[{ l: "Assignee", v: task.assignee || "Unassigned" }, { l: "Priority", v: task.priority }, { l: "Due", v: task.due }, { l: "Estimated", v: task.est }, { l: "Start", v: task.start }, { l: "Status", v: s?.label ?? task.status }].map(f => (
                <div key={f.l} className="bg-white rounded-lg border border-neutral-200 p-2.5">
                  <div className="text-xs text-neutral-400 uppercase font-semibold">{f.l}</div>
                  <div className="text-sm font-medium text-neutral-700 mt-0.5 capitalize">{f.v}</div>
                </div>
              ))}
            </div>
            {task.deps.length > 0 && (
              <div className="bg-bad-bg border border-bad-solid/20 rounded-lg p-3">
                <div className="text-xs text-bad-fg uppercase font-bold">Blocked by</div>
                <div className="text-sm text-bad-fg mt-1">{task.deps.map(d => TASKS.find(t => t.id === d)?.title ?? d).join(", ")}</div>
              </div>
            )}
          </div>
        )}
        {tab === "deps" && (
          <div className="space-y-3">
            <h3 className="text-sm font-serif font-bold text-neutral-950">Dependency Chain</h3>
            {task.deps.length === 0 && <div className="text-xs text-neutral-400">No dependencies</div>}
            {task.deps.map(depId => {
              const dep = TASKS.find(t => t.id === depId);
              if (!dep) return null;
              const ds = STATUS[dep.status];
              return (
                <div key={depId} className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200">
                  <div className={`w-2 h-8 rounded-full ${ds?.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-800">{dep.title}</div>
                    <div className="text-xs text-neutral-500">{dep.assignee || "Unassigned"} · {ds?.label}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-300" />
                </div>
              );
            })}
            <h3 className="text-sm font-bold text-neutral-950 mt-4">Blocks</h3>
            {TASKS.filter(t => t.deps.includes(task.id)).length === 0 && <div className="text-xs text-neutral-400">Nothing blocked by this task</div>}
            {TASKS.filter(t => t.deps.includes(task.id)).map(t => {
              const ds = STATUS[t.status];
              return (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200">
                  <ArrowRight className="w-4 h-4 text-neutral-300" />
                  <div className={`w-2 h-8 rounded-full ${ds?.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-800">{t.title}</div>
                    <div className="text-xs text-neutral-500">{t.assignee || "Unassigned"} · {ds?.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {tab === "timeline" && (
          <div className="space-y-3">
            <h3 className="text-sm font-serif font-bold text-neutral-950">Task in context</h3>
            <div className="text-xs text-neutral-500 mb-2">{task.start} → {task.due} · {task.est}</div>
            <MiniTimeline />
          </div>
        )}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   VARIANT A — Flat list + filter pills | Stacked overview
   Left: filter pills + flat task list
   Right: Overview (KPI → Timeline → Changelog) or Task Detail (tabbed)
   ═══════════════════════════════════════════════════════════ */
export function ProjectPageVariantA() {
  const [sel, setSel] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = statusFilter === "all" ? TASKS : TASKS.filter(t => t.status === statusFilter);
  const task = TASKS.find(t => t.id === sel);

  return (
    <div className="flex h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-white">
      {/* Left */}
      <div className="w-[320px] border-r flex flex-col shrink-0">
        <div className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <ListChecks className="w-4 h-4 text-neutral-400" />
            <span className="text-sm font-serif font-bold text-neutral-950">Tasks</span>
            <span className="text-xs bg-neutral-100 text-neutral-400 px-1.5 py-0.5 rounded">{filtered.length}</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {["all", "active", "blocked", "todo", "done"].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setSel(null); }}
                className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize transition-colors ${statusFilter === s ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100"}`}>
                {s === "all" ? "All" : STATUS[s]?.label ?? s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
          {filtered.map(t => {
            const isActive = t.id === sel;
            return (
              <button key={t.id} onClick={() => setSel(isActive ? null : t.id)}
                className={`w-full text-left px-4 py-3 transition-colors ${isActive ? "bg-blue-50 border-l-2 border-l-blue-500" : "hover:bg-neutral-50 border-l-2 border-l-transparent"}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS[t.status]?.dot}`} />
                  <span className="text-xs font-medium text-neutral-800 truncate flex-1">{t.title}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY[t.priority]?.dot}`} />
                </div>
                <div className="flex items-center gap-2 mt-1 ml-4 text-xs text-neutral-400">
                  <span>{t.assignee || "Unassigned"}</span>
                  <span>·</span>
                  <span>{daysUntil(t.due)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {/* Right */}
      <div className="flex-1 bg-neutral-50 overflow-y-auto">
        {task ? (
          <TaskDetailPanel task={task} />
        ) : (
          <div className="p-5 space-y-5">
            <KpiBar />
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="flex items-center gap-2 mb-3"><Activity className="w-4 h-4 text-neutral-400" /><span className="text-sm font-serif font-bold text-neutral-950">Timeline</span></div>
              <MiniTimeline />
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-neutral-400" /><span className="text-sm font-serif font-bold text-neutral-950">Changelog</span></div>
              <MiniChangelog />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   VARIANT B — Grouped by status left | Tabbed right pane
   Left: tasks grouped under status headers (collapsible)
   Right: top-level tabs: Overview | Changelog | selected task
   ═══════════════════════════════════════════════════════════ */
export function ProjectPageVariantB() {
  const [sel, setSel] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<"overview" | "changelog">("overview");
  const task = TASKS.find(t => t.id === sel);

  const groups = ["active", "blocked", "todo", "done"];

  return (
    <div className="flex h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-white">
      {/* Left: grouped */}
      <div className="w-[320px] border-r flex flex-col shrink-0">
        <div className="px-4 py-3 border-b shrink-0 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PROJ.color }} />
          <span className="text-sm font-serif font-bold text-neutral-950">{PROJ.name}</span>
          <div className="flex-1" />
          <span className="text-xs text-neutral-400">{PROJ.done}/{PROJ.total}</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {groups.map(status => {
            const group = TASKS.filter(t => t.status === status);
            if (group.length === 0) return null;
            const s = STATUS[status];
            return (
              <div key={status}>
                <div className={`px-4 py-2 ${s.bg} border-b ${s.border} flex items-center gap-2`}>
                  <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                  <span className={`text-xs font-bold uppercase ${s.text}`}>{s.label}</span>
                  <span className="text-xs text-neutral-400">{group.length}</span>
                </div>
                {group.map(t => (
                  <button key={t.id} onClick={() => { setSel(t.id); setRightTab("overview"); }}
                    className={`w-full text-left px-4 py-2.5 border-b border-neutral-100 transition-colors ${sel === t.id ? "bg-blue-50 border-l-2 border-l-blue-500" : "hover:bg-neutral-50 border-l-2 border-l-transparent"}`}>
                    <div className="text-xs font-medium text-neutral-800 truncate">{t.title}</div>
                    <div className="text-xs text-neutral-400 mt-0.5">{t.assignee || "Unassigned"} · {daysUntil(t.due)}</div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      {/* Right: tabbed */}
      <div className="flex-1 bg-neutral-50 flex flex-col">
        <div className="bg-white border-b px-4 py-2 flex items-center gap-1 shrink-0">
          {(["overview", "changelog"] as const).map(t => (
            <button key={t} onClick={() => { setRightTab(t); setSel(null); }}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize transition-colors ${rightTab === t && !sel ? "bg-neutral-900 text-white" : "text-neutral-400 hover:bg-neutral-100"}`}>
              {t}
            </button>
          ))}
          {task && (
            <span className="text-xs text-blue-500 font-medium ml-2 flex items-center gap-1">
              <ChevronRight className="w-3 h-3" /> {task.title.slice(0, 30)}{task.title.length > 30 ? "…" : ""}
            </span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {task ? (
            <TaskDetailPanel task={task} />
          ) : rightTab === "overview" ? (
            <div className="p-5 space-y-5">
              <KpiBar />
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <div className="flex items-center gap-2 mb-3"><Activity className="w-4 h-4 text-neutral-400" /><span className="text-sm font-serif font-bold text-neutral-950">Timeline</span></div>
                <MiniTimeline />
              </div>
            </div>
          ) : (
            <div className="p-5">
              <MiniChangelog />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   VARIANT C — Narrow sidebar + wide detail | Overview & tasks side by side
   Left: KPI summary + narrow task names
   Right: two-column — overview top, selected task bottom
   ═══════════════════════════════════════════════════════════ */
export function ProjectPageVariantC() {
  const [sel, setSel] = useState<string | null>(null);
  const task = TASKS.find(t => t.id === sel);

  return (
    <div className="flex h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-white">
      {/* Left: narrow */}
      <div className="w-[240px] border-r flex flex-col shrink-0">
        <div className="px-3 py-3 border-b shrink-0 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PROJ.color }} />
            <span className="text-xs font-bold text-neutral-950 truncate">{PROJ.name}</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${PROJ.progress}%`, backgroundColor: PROJ.color }} />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">{PROJ.progress}%</span>
            <span className="text-neutral-400">{dl}d left</span>
          </div>
        </div>
        <div className="px-3 py-2 border-b shrink-0">
          <div className="flex items-center gap-1.5 bg-neutral-100 rounded-lg px-2.5 py-1.5">
            <Search className="w-3 h-3 text-neutral-400" />
            <input placeholder="Search tasks..." className="bg-transparent text-xs outline-none flex-1 placeholder-neutral-400" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {TASKS.map(t => (
            <button key={t.id} onClick={() => setSel(sel === t.id ? null : t.id)}
              className={`w-full text-left px-3 py-2 border-b border-neutral-50 transition-colors flex items-center gap-2 ${sel === t.id ? "bg-blue-50" : "hover:bg-neutral-50"}`}>
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS[t.status]?.dot}`} />
              <span className="text-xs text-neutral-700 truncate flex-1">{t.title}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Right */}
      <div className="flex-1 flex flex-col bg-neutral-50 min-h-0">
        {/* Top: overview always visible */}
        <div className={`${task ? "h-[45%]" : "flex-1"} overflow-y-auto border-b p-4 space-y-4 transition-all`}>
          <KpiBar />
          <div className="bg-white rounded-lg border border-neutral-200 p-3">
            <div className="flex items-center gap-2 mb-2"><Activity className="w-3.5 h-3.5 text-neutral-400" /><span className="text-xs font-bold text-neutral-950">Timeline</span></div>
            <MiniTimeline />
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-3">
            <div className="flex items-center gap-2 mb-2"><FileText className="w-3.5 h-3.5 text-neutral-400" /><span className="text-xs font-bold text-neutral-950">Changelog</span></div>
            <MiniChangelog />
          </div>
        </div>
        {/* Bottom: task detail (if selected) */}
        {task && (
          <div className="flex-1 min-h-0">
            <TaskDetailPanel task={task} />
          </div>
        )}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   VARIANT D — Three columns: tasks | detail | context
   Most information-dense layout
   ═══════════════════════════════════════════════════════════ */
export function ProjectPageVariantD() {
  const [sel, setSel] = useState("t1");
  const task = TASKS.find(t => t.id === sel)!;
  const s = STATUS[task.status];

  return (
    <div className="flex h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-white">
      {/* Col 1: task list */}
      <div className="w-[260px] border-r flex flex-col shrink-0">
        <div className="px-3 py-2.5 border-b shrink-0 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PROJ.color }} />
          <span className="text-xs font-bold text-neutral-950">{PROJ.name}</span>
          <div className="flex-1" />
          <Filter className="w-3 h-3 text-neutral-400 cursor-pointer" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {TASKS.map(t => (
            <button key={t.id} onClick={() => setSel(t.id)}
              className={`w-full text-left px-3 py-2.5 border-b border-neutral-50 transition-colors ${sel === t.id ? "bg-blue-50 border-l-2 border-l-blue-500" : "hover:bg-neutral-50 border-l-2 border-l-transparent"}`}>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS[t.status]?.dot}`} />
                <span className="text-xs text-neutral-800 truncate">{t.title}</span>
              </div>
              <div className="text-xs text-neutral-400 mt-0.5 ml-3.5">{t.assignee || "—"} · {daysUntil(t.due)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Col 2: task detail */}
      <div className="w-[340px] border-r flex flex-col shrink-0 bg-white overflow-y-auto">
        <div className="px-4 py-3 border-b shrink-0">
          <div className={`inline-block text-xs font-bold uppercase px-2 py-0.5 rounded-full mb-1.5 ${s.bg} ${s.text} border ${s.border}`}>{s.label}</div>
          <h2 className="text-sm font-serif font-bold text-neutral-950">{task.title}</h2>
          {task.desc && <p className="text-xs text-neutral-500 mt-1">{task.desc}</p>}
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[{ l: "Assignee", v: task.assignee || "Unassigned" }, { l: "Priority", v: task.priority }, { l: "Due", v: task.due }, { l: "Est.", v: task.est }].map(f => (
              <div key={f.l} className="border border-neutral-200 rounded-lg p-2">
                <div className="text-xs text-neutral-400 uppercase font-semibold">{f.l}</div>
                <div className="text-xs font-medium text-neutral-700 capitalize mt-0.5">{f.v}</div>
              </div>
            ))}
          </div>
          {task.deps.length > 0 && (
            <div className="bg-bad-bg border border-bad-solid/20 rounded-lg p-2.5">
              <div className="text-xs text-bad-fg font-bold flex items-center gap-1"><GitBranch className="w-3 h-3" /> Blocked by</div>
              {task.deps.map(d => <div key={d} className="text-xs text-bad-fg mt-1">{TASKS.find(t => t.id === d)?.title}</div>)}
            </div>
          )}
          {TASKS.filter(t => t.deps.includes(task.id)).length > 0 && (
            <div className="bg-warn-bg border border-warn-solid/20 rounded-lg p-2.5">
              <div className="text-xs text-warn-fg font-bold flex items-center gap-1"><Flag className="w-3 h-3" /> Blocks</div>
              {TASKS.filter(t => t.deps.includes(task.id)).map(t => <div key={t.id} className="text-xs text-warn-fg mt-1">{t.title}</div>)}
            </div>
          )}
        </div>
      </div>

      {/* Col 3: context */}
      <div className="flex-1 bg-neutral-50 overflow-y-auto p-4 space-y-4">
        <KpiBar />
        <div className="bg-white rounded-lg border border-neutral-200 p-3">
          <div className="flex items-center gap-2 mb-2"><Activity className="w-3.5 h-3.5 text-neutral-400" /><span className="text-xs font-bold text-neutral-950">Timeline</span></div>
          <MiniTimeline />
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-3">
          <div className="flex items-center gap-2 mb-2"><FileText className="w-3.5 h-3.5 text-neutral-400" /><span className="text-xs font-bold text-neutral-950">Changelog</span></div>
          <MiniChangelog />
        </div>
      </div>
    </div>
  );
}
