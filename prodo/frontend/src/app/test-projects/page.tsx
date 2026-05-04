"use client";

import React, { useState } from "react";
import {
  CheckCircle2, Clock, Flame, Zap, Layers,
  ArrowUpRight, Target, Calendar, TrendingUp,
} from "lucide-react";

// ── FIXTURE ───────────────────────────────────────────────────

const PROJECTS = [
  { id: "1", name: "Command Center v5", progress: 20, done: 2, total: 10, blocked: 1, active: 3, target: "2026-07-31" },
  { id: "2", name: "NeuractReport v3",  progress: 33, done: 2, total: 6,  blocked: 0, active: 2, target: "2026-06-01" },
  { id: "3", name: "Spot Particle",     progress: 50, done: 3, total: 6,  blocked: 1, active: 1, target: "2026-04-30" },
];

const TODAY = new Date("2026-04-10");
const totalTasks   = PROJECTS.reduce((s, p) => s + p.total, 0);
const totalDone    = PROJECTS.reduce((s, p) => s + p.done, 0);
const totalActive  = PROJECTS.reduce((s, p) => s + p.active, 0);
const totalBlocked = PROJECTS.reduce((s, p) => s + p.blocked, 0);
const totalTodo    = totalTasks - totalDone - totalActive;
const overallPct   = Math.round((totalDone / totalTasks) * 100);

const nextDeadline = [...PROJECTS]
  .filter((p) => new Date(p.target) >= TODAY)
  .sort((a, b) => new Date(a.target).getTime() - new Date(b.target).getTime())[0];

const daysToNext = nextDeadline
  ? Math.ceil((new Date(nextDeadline.target).getTime() - TODAY.getTime()) / 86400000)
  : null;

// ── VARIANT 1: Stat Strip ────────────────────────────────────
// Clean row of numbers. Minimal, glanceable.

function Variant1() {
  const stats = [
    { label: "Projects",  value: PROJECTS.length,  color: "text-neutral-950", sub: "active" },
    { label: "Tasks",     value: totalTasks,        color: "text-neutral-950", sub: "total" },
    { label: "Done",      value: totalDone,         color: "text-ok-fg",       sub: "completed" },
    { label: "In Progress", value: totalActive,     color: "text-warn-fg",     sub: "ongoing" },
    { label: "Blocked",   value: totalBlocked,      color: totalBlocked > 0 ? "text-bad-fg" : "text-ok-fg", sub: "need action" },
  ];
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5shadow-xsmall">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-neutral-400 uppercase font-bold tracking-widest mb-0.5">Your Overview</div>
          <div className="text-base font-serif font-bold text-neutral-950">Good morning, Rohith</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-neutral-950">{overallPct}%</div>
          <div className="text-[9px] text-neutral-400">overall done</div>
        </div>
      </div>
      {/* Progress bar */}
      <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden mb-5">
        <div className="h-full rounded-full bg-gradient-to-r from-ok-solid to-ok-solid" style={{ width: `${overallPct}%` }} />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-5 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[8px] text-neutral-400 uppercase font-bold tracking-widest">{s.label}</div>
            <div className="text-[8px] text-neutral-300">{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── VARIANT 2: Personal Scorecard ────────────────────────────
// Feels like a personal report card — focus on what needs attention

function Variant2() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-xsmall overflow-hidden">
      {/* Top band */}
      <div className="bg-neutral-900 px-5 py-4 flex items-center justify-between">
        <div>
          <div className="text-[9px] text-neutral-400 uppercase tracking-widest mb-0.5">Rohith · Apr 10</div>
          <div className="text-white text-base font-bold">{PROJECTS.length} projects · {totalTasks} tasks</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">{overallPct}<span className="text-lg text-neutral-400">%</span></div>
          <div className="text-[9px] text-neutral-400">across all work</div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 grid grid-cols-3 gap-3">
        {/* Done */}
        <div className="bg-ok-bg rounded-lg p-3 border border-ok-solid/20">
          <CheckCircle2 className="w-4 h-4 text-ok-solid mb-1.5" />
          <div className="text-2xl font-bold text-ok-fg">{totalDone}</div>
          <div className="text-[9px] text-ok-fg font-medium">tasks done</div>
          <div className="text-[8px] text-ok-solid/60">{totalTasks - totalDone} remaining</div>
        </div>
        {/* Active */}
        <div className="bg-warn-bg rounded-lg p-3 border border-warn-solid/20">
          <Zap className="w-4 h-4 text-warn-solid mb-1.5" />
          <div className="text-2xl font-bold text-warn-fg">{totalActive}</div>
          <div className="text-[9px] text-warn-fg font-medium">in progress</div>
          <div className="text-[8px] text-warn-solid/60">right now</div>
        </div>
        {/* Blocked */}
        <div className={`rounded-lg p-3 border ${totalBlocked > 0 ? "bg-bad-bg border-bad-solid/20" : "bg-neutral-50 border-neutral-100"}`}>
          <Flame className={`w-4 h-4 mb-1.5 ${totalBlocked > 0 ? "text-bad-solid" : "text-neutral-300"}`} />
          <div className={`text-2xl font-bold ${totalBlocked > 0 ? "text-bad-fg" : "text-neutral-400"}`}>{totalBlocked}</div>
          <div className={`text-[9px] font-medium ${totalBlocked > 0 ? "text-bad-fg" : "text-neutral-400"}`}>blocked</div>
          <div className={`text-[8px] ${totalBlocked > 0 ? "text-bad-solid/60" : "text-neutral-300"}`}>{totalBlocked > 0 ? "needs action" : "all clear"}</div>
        </div>
      </div>

      {/* Next deadline */}
      {nextDeadline && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 bg-neutral-50 rounded-lg p-3 border border-neutral-200">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <div className="flex-1 min-w-0">
              <div className="text-[9px] text-neutral-400 uppercase font-bold tracking-widest">Next deadline</div>
              <div className="text-xs font-semibold text-neutral-800 truncate">{nextDeadline.name}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-serif font-bold text-neutral-950">{daysToNext}d</div>
              <div className="text-[8px] text-neutral-400">{nextDeadline.target}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── VARIANT 3: Compact Banner ─────────────────────────────────
// Single horizontal strip, very compact, feels like a nav element

function Variant3() {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-xsmall px-5 py-3.5 flex items-center gap-6">
      {/* Identity */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center text-white text-xs font-bold">R</div>
        <div>
          <div className="text-xs font-bold text-neutral-950">Rohith</div>
          <div className="text-[9px] text-neutral-400">{PROJECTS.length} projects</div>
        </div>
      </div>

      <div className="w-px h-8 bg-neutral-100" />

      {/* Overall ring + % */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative w-8 h-8">
          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="13" fill="none" stroke="var(--border-subtle)" strokeWidth="3" />
            <circle cx="16" cy="16" r="13" fill="none" stroke="var(--ok-solid)" strokeWidth="3"
              strokeDasharray={`${(overallPct / 100) * 81.7} 81.7`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[7px] font-bold text-neutral-950">{overallPct}%</span>
          </div>
        </div>
        <div>
          <div className="text-xs font-bold text-neutral-950">{overallPct}% done</div>
          <div className="text-[9px] text-neutral-400">{totalDone}/{totalTasks} tasks</div>
        </div>
      </div>

      <div className="w-px h-8 bg-neutral-100" />

      {/* Quick stats inline */}
      <div className="flex items-center gap-4 flex-1">
        {[
          { icon: CheckCircle2, label: "Done",    value: totalDone,    color: "text-ok-fg" },
          { icon: Zap,          label: "Active",  value: totalActive,  color: "text-warn-fg" },
          { icon: Flame,        label: "Blocked", value: totalBlocked, color: totalBlocked > 0 ? "text-bad-fg" : "text-neutral-300" },
          { icon: Clock,        label: "To Do",   value: totalTodo,    color: "text-info-fg" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-1.5">
              <Icon className={`w-3.5 h-3.5 ${s.color}`} />
              <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
              <span className="text-[9px] text-neutral-400">{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Next deadline */}
      {nextDeadline && (
        <>
          <div className="w-px h-8 bg-neutral-100" />
          <div className="shrink-0 text-right">
            <div className="text-[9px] text-neutral-400">Next deadline</div>
            <div className="text-xs font-bold text-neutral-950">{nextDeadline.name.split(" ").slice(0, 2).join(" ")}</div>
            <div className="text-[9px] text-warn-fg font-medium">{daysToNext}d away</div>
          </div>
        </>
      )}
    </div>
  );
}

// ── VARIANT 4: Project Rows with personal framing ─────────────
// Shows each project as a personal progress row — "your work here"

function Variant4() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-xsmall p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-base font-serif font-bold text-neutral-950">Your Work</div>
          <div className="text-xs text-neutral-400">{totalTasks} tasks across {PROJECTS.length} projects</div>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span className="w-2 h-2 rounded-full bg-ok-solid inline-block" /> {totalDone} done
          <span className="w-2 h-2 rounded-full bg-warn-solid inline-block ml-2" /> {totalActive} active
          {totalBlocked > 0 && <><span className="w-2 h-2 rounded-full bg-bad-solid inline-block ml-2" /> {totalBlocked} blocked</>}
        </div>
      </div>

      {/* Master bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-neutral-400 font-medium">Overall progress</span>
          <span className="text-xs font-bold text-neutral-700">{overallPct}%</span>
        </div>
        <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden flex">
          <div className="h-full bg-ok-solid" style={{ width: `${(totalDone / totalTasks) * 100}%` }} />
          <div className="h-full bg-warn-solid" style={{ width: `${(totalActive / totalTasks) * 100}%` }} />
          <div className="h-full bg-bad-solid" style={{ width: `${(totalBlocked / totalTasks) * 100}%` }} />
        </div>
        <div className="flex gap-3 mt-1 text-[8px] text-neutral-400">
          <span className="text-ok-fg">{totalDone} done</span>
          <span className="text-warn-fg">{totalActive} active</span>
          <span className={totalBlocked > 0 ? "text-bad-fg" : "text-neutral-300"}>{totalBlocked} blocked</span>
          <span>{totalTodo} todo</span>
        </div>
      </div>

      {/* Per-project mini rows */}
      <div className="space-y-2 pt-1">
        {PROJECTS.map((p) => {
          const dl = Math.ceil((new Date(p.target).getTime() - TODAY.getTime()) / 86400000);
          return (
            <div key={p.id} className="flex items-center gap-3">
              <div className="w-28 shrink-0">
                <div className="text-xs font-semibold text-neutral-700 truncate">{p.name}</div>
              </div>
              <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-neutral-400 rounded-full" style={{ width: `${p.progress}%` }} />
              </div>
              <span className="text-[9px] font-bold text-neutral-500 w-8 text-right shrink-0">{p.progress}%</span>
              <span className="text-[9px] text-neutral-400 w-12 text-right shrink-0">{dl}d left</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── VARIANT 5: Card with urgency signal ───────────────────────
// Personal card that surfaces the ONE thing that needs attention

function Variant5() {
  const urgentProject = PROJECTS.find((p) => p.blocked > 0) || PROJECTS[0];
  const urgentDays = Math.ceil((new Date(urgentProject.target).getTime() - TODAY.getTime()) / 86400000);

  return (
    <div className="grid grid-cols-[1fr_220px] gap-3">
      {/* Left: Aggregate numbers */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xsmall p-5">
        <div className="text-xs uppercase font-bold text-neutral-400 tracking-widest mb-3">Your snapshot · Apr 10</div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="space-y-1">
            <div className="text-3xl font-bold text-neutral-950">{totalTasks}</div>
            <div className="text-[9px] text-neutral-400 uppercase font-bold tracking-widest">Total tasks</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-neutral-950">{PROJECTS.length}</div>
            <div className="text-[9px] text-neutral-400 uppercase font-bold tracking-widest">Projects</div>
          </div>
        </div>
        {/* Segmented bar */}
        <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden flex mb-2">
          <div className="h-full bg-ok-solid" style={{ width: `${(totalDone / totalTasks) * 100}%` }} />
          <div className="h-full bg-warn-solid" style={{ width: `${(totalActive / totalTasks) * 100}%` }} />
          <div className="h-full bg-bad-solid" style={{ width: `${(totalBlocked / totalTasks) * 100}%` }} />
        </div>
        <div className="flex gap-4 text-[9px]">
          <span className="text-ok-fg font-semibold">{totalDone} done</span>
          <span className="text-warn-fg font-semibold">{totalActive} active</span>
          <span className={`font-semibold ${totalBlocked > 0 ? "text-bad-fg" : "text-neutral-300"}`}>{totalBlocked} blocked</span>
          <span className="text-neutral-400">{totalTodo} to do</span>
        </div>
      </div>

      {/* Right: What needs attention */}
      <div className="space-y-2">
        {totalBlocked > 0 && (
          <div className="bg-bad-bg border border-bad-solid/30 rounded-lg p-3.5 flex items-start gap-2.5">
            <Flame className="w-4 h-4 text-bad-solid shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-bad-fg">{totalBlocked} blocked task{totalBlocked > 1 ? "s" : ""}</div>
              <div className="text-[9px] text-bad-solid mt-0.5">Needs your attention now</div>
            </div>
          </div>
        )}
        <div className="bg-white border border-neutral-200 rounded-lg p-3.5 flex items-start gap-2.5">
          <Target className="w-4 h-4 text-info-solid shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="text-[9px] text-neutral-400 uppercase font-bold tracking-widest">Closest deadline</div>
            <div className="text-sm font-bold text-neutral-800 truncate mt-0.5">{urgentProject.name}</div>
            <div className="text-[9px] text-warn-fg font-semibold mt-0.5">{urgentDays}d left · {urgentProject.progress}% done</div>
          </div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-3.5 flex items-start gap-2.5">
          <TrendingUp className="w-4 h-4 text-ok-solid shrink-0 mt-0.5" />
          <div>
            <div className="text-[9px] text-neutral-400 uppercase font-bold tracking-widest">Overall progress</div>
            <div className="text-xl font-bold text-neutral-950 mt-0.5">{overallPct}%</div>
            <div className="text-[9px] text-neutral-400">{totalDone} of {totalTasks} tasks done</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── VARIANT 6: Combined — Big KPIs + Segmented Bar + Project Rows ──

function Variant6() {
  const kpis = [
    { value: PROJECTS.length, label: "Projects",    sub: "active",      color: "text-neutral-950", bg: "bg-neutral-50",  border: "border-neutral-200" },
    { value: totalTasks,      label: "Total Tasks",  sub: "across all",  color: "text-neutral-950", bg: "bg-neutral-50",  border: "border-neutral-200" },
    { value: totalDone,       label: "Done",         sub: "completed",   color: "text-ok-fg",       bg: "bg-ok-bg",       border: "border-ok-solid/30" },
    { value: totalActive,     label: "In Progress",  sub: "ongoing",     color: "text-warn-fg",     bg: "bg-warn-bg",     border: "border-warn-solid/30" },
    { value: totalBlocked,    label: "Blocked",      sub: totalBlocked > 0 ? "need action" : "all clear", color: totalBlocked > 0 ? "text-bad-fg" : "text-ok-fg", bg: totalBlocked > 0 ? "bg-bad-bg" : "bg-neutral-50", border: totalBlocked > 0 ? "border-bad-solid/30" : "border-neutral-200" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-xsmall p-5 space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[9px] uppercase font-bold text-neutral-400 tracking-widest mb-0.5">Your Overview</div>
          <div className="text-base font-serif font-bold text-neutral-950">Good morning, Rohith</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-neutral-950">{overallPct}<span className="text-lg text-neutral-400">%</span></div>
          <div className="text-[9px] text-neutral-400">overall done</div>
        </div>
      </div>

      {/* Big KPI tiles */}
      <div className="grid grid-cols-5 gap-2">
        {kpis.map((k) => (
          <div key={k.label} className={`rounded-lg border ${k.border} ${k.bg} p-3 text-center`}>
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-0.5">{k.label}</div>
            <div className="text-[8px] text-neutral-400 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Segmented master bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Progress breakdown</span>
          <div className="flex gap-3 text-[8px]">
            <span className="text-ok-fg font-semibold">■ Done</span>
            <span className="text-warn-fg font-semibold">■ Active</span>
            <span className={`font-semibold ${totalBlocked > 0 ? "text-bad-fg" : "text-neutral-300"}`}>■ Blocked</span>
            <span className="text-neutral-300 font-semibold">■ Todo</span>
          </div>
        </div>
        <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden flex gap-px">
          <div className="h-full bg-ok-solid rounded-l-full transition-all" style={{ width: `${(totalDone / totalTasks) * 100}%` }} />
          <div className="h-full bg-warn-solid transition-all" style={{ width: `${(totalActive / totalTasks) * 100}%` }} />
          <div className="h-full bg-bad-solid transition-all" style={{ width: `${(totalBlocked / totalTasks) * 100}%` }} />
          <div className="h-full bg-neutral-200 rounded-r-full transition-all" style={{ width: `${(totalTodo / totalTasks) * 100}%` }} />
        </div>
      </div>

      {/* Per-project rows */}
      <div className="space-y-2.5 pt-1 border-t border-neutral-100">
        {PROJECTS.map((p) => {
          const dl = Math.ceil((new Date(p.target).getTime() - TODAY.getTime()) / 86400000);
          const isUrgent = dl < 30 && p.progress < 60;
          return (
            <div key={p.id} className="flex items-center gap-3">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isUrgent ? "bg-warn-solid" : "bg-ok-solid"}`} />
              <div className="w-32 shrink-0">
                <div className="text-xs font-semibold text-neutral-700 truncate">{p.name}</div>
              </div>
              {/* Segmented mini bar */}
              <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-ok-solid" style={{ width: `${(p.done / p.total) * 100}%` }} />
                <div className="h-full bg-warn-solid" style={{ width: `${(p.active / p.total) * 100}%` }} />
                {p.blocked > 0 && <div className="h-full bg-bad-solid" style={{ width: `${(p.blocked / p.total) * 100}%` }} />}
              </div>
              <span className="text-[9px] font-bold text-neutral-600 w-8 text-right shrink-0">{p.progress}%</span>
              <span className={`text-[9px] w-14 text-right shrink-0 font-medium ${dl < 20 ? "text-warn-fg" : "text-neutral-400"}`}>
                {dl < 0 ? `${Math.abs(dl)}d over` : `${dl}d left`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────

const VARIANTS = [
  { id: "v6", label: "Combined ★",       sub: "Big KPI tiles + segmented bar + per-project rows. Stat Strip × Work Summary.", component: <Variant6 /> },
  { id: "v1", label: "Stat Strip",       sub: "Numbers + overall bar. Clean, minimal.", component: <Variant1 /> },
  { id: "v2", label: "Scorecard",        sub: "Dark header + 3 colored metric blocks + next deadline.", component: <Variant2 /> },
  { id: "v3", label: "Compact Banner",   sub: "Single horizontal strip — fits tight between topbar and dashboard.", component: <Variant3 /> },
  { id: "v4", label: "Work Summary",     sub: "Master progress bar + per-project mini rows.", component: <Variant4 /> },
  { id: "v5", label: "Snapshot + Alert", sub: "Aggregate stats left · urgent signals right.", component: <Variant5 /> },
];

export default function TestProjectsPage() {
  const [active, setActive] = useState("v6");
  const current = VARIANTS.find((v) => v.id === active)!;

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-neutral-950">All Projects Overview — 5 Variants</h1>
          <p className="text-neutral-500 text-sm">For an individual contributor. Shows aggregate stats across all their projects.</p>
        </div>

        <div className="flex gap-2 flex-wrap justify-center">
          {VARIANTS.map((v) => (
            <button key={v.id} onClick={() => setActive(v.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                active === v.id
                  ? "bg-neutral-900 text-white border-neutral-900 shadow-md"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
              }`}>
              {v.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 px-4 py-3shadow-xsmall">
          <span className="text-xs font-bold text-neutral-700">{current.label} — </span>
          <span className="text-xs text-neutral-500">{current.sub}</span>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xsmall p-5">
          {current.component}
        </div>

        <div className="rounded-lg border border-dashed border-neutral-300 p-4 bg-neutral-100/50 text-center">
          <span className="text-xs text-neutral-400 font-medium uppercase tracking-widest">↓ Selected project detail (welcome dashboard) sits below ↓</span>
        </div>
      </div>
    </div>
  );
}
