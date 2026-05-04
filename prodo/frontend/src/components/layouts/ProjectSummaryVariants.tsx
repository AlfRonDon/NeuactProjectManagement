"use client";

import React from "react";
import {
  ArrowUp, ArrowDown, AlertTriangle, CheckCircle2, Clock,
  Flag, Target, TrendingUp, Users, Zap, Brain, Sparkles,
  OctagonAlert, Activity, ExternalLink,
} from "lucide-react";

const PROJECTS = [
  { name: "Command Center v5", short: "CCv5", color: "#6366F1", progress: 30, tasks: 10, done: 3, active: 3, blocked: 1, target: "2026-07-31", start: "2026-04-01" },
  { name: "NeuactReport v3", short: "NRv3", color: "#8B5CF6", progress: 33, tasks: 6, done: 2, active: 2, blocked: 0, target: "2026-06-01", start: "2026-03-15" },
  { name: "Spot Particle", short: "Spot", color: "#EC4899", progress: 50, tasks: 6, done: 3, active: 1, blocked: 1, target: "2026-04-30", start: "2026-03-01" },
];

const total = PROJECTS.reduce((s, p) => s + p.tasks, 0);
const done = PROJECTS.reduce((s, p) => s + p.done, 0);
const blocked = PROJECTS.reduce((s, p) => s + p.blocked, 0);
const active = PROJECTS.reduce((s, p) => s + p.active, 0);
const overallPct = Math.round((done / total) * 100);

function dl(t: string) { return Math.ceil((new Date(t).getTime() - new Date().getTime()) / 86400000); }
function pace(p: typeof PROJECTS[0]) {
  const td = Math.ceil((new Date(p.target).getTime() - new Date(p.start).getTime()) / 86400000);
  const el = Math.ceil((new Date().getTime() - new Date(p.start).getTime()) / 86400000);
  const delta = p.progress - Math.round(Math.min(100, (el / td) * 100));
  return delta >= 5 ? { label: "Ahead", color: "text-ok-fg", bg: "bg-ok-bg" } : delta >= -10 ? { label: "On track", color: "text-warn-fg", bg: "bg-warn-bg" } : { label: "Behind", color: "text-bad-fg", bg: "bg-bad-bg" };
}
const closest = [...PROJECTS].sort((a, b) => dl(a.target) - dl(b.target))[0];

const AI_BRIEF = `Across ${PROJECTS.length} projects you're tracking ${total} tasks with ${done} done and ${active} actively in progress. ${closest.name} is closest to deadline — ${dl(closest.target)} days left with ${closest.tasks - closest.done} tasks remaining. ${blocked > 0 ? `${blocked} task${blocked > 1 ? "s" : ""} blocked and need attention.` : "No blockers — clear path forward."}`;


/* ═══════════════════════════════════════════════════════════
   VARIANT A — Card Stack
   Project cards stacked with progress bars, inline stats,
   donut summary at top, AI brief at bottom
   ═══════════════════════════════════════════════════════════ */
export function ProjectSummaryVariantA() {
  return (
    <div className="h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-white flex flex-col">
      <div className="px-4 py-3 border-b shrink-0">
        <span className="text-sm font-serif font-bold text-neutral-950">Portfolio Summary</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Overall */}
        <div className="bg-neutral-900 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold opacity-60">Overall Progress</span>
            <span className="text-xs opacity-60">{done}/{total} tasks</span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black">{overallPct}%</span>
            <div className="flex-1 pb-2">
              <div className="w-full h-2 bg-white/20 rounded-full">
                <div className="h-full bg-white rounded-full" style={{ width: `${overallPct}%` }} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-2 text-xs">
            <span><span className="font-bold text-ok-fg">{done}</span> done</span>
            <span><span className="font-bold text-warn-fg">{active}</span> active</span>
            <span className={blocked > 0 ? "text-bad-fg" : ""}><span className="font-bold">{blocked}</span> blocked</span>
          </div>
        </div>

        {/* Project cards */}
        {PROJECTS.map(p => {
          const pc = pace(p);
          const d = dl(p.target);
          return (
            <div key={p.short} className="rounded-lg border border-neutral-200 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-sm font-bold text-neutral-950 flex-1">{p.name}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pc.bg} ${pc.color}`}>{pc.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="w-full h-2 bg-neutral-100 rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${p.progress}%`, backgroundColor: p.color }} />
                  </div>
                </div>
                <span className="text-sm font-mono font-black text-neutral-800">{p.progress}%</span>
              </div>
              <div className="flex gap-4 text-xs text-neutral-500">
                <span><span className="font-semibold text-ok-fg">{p.done}</span> done</span>
                <span><span className="font-semibold text-warn-fg">{p.active}</span> active</span>
                {p.blocked > 0 && <span><span className="font-semibold text-bad-fg">{p.blocked}</span> blocked</span>}
                <span className="ml-auto"><span className={`font-semibold ${d < 30 ? "text-warn-fg" : "text-neutral-700"}`}>{d}d</span> left</span>
              </div>
            </div>
          );
        })}

        {/* Task distribution mini */}
        <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-3">
          <div className="text-xs font-bold text-neutral-500 uppercase mb-2">Distribution</div>
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            {PROJECTS.map(p => (
              <div key={p.short} className="h-full rounded-full" style={{ width: `${(p.tasks / total) * 100}%`, backgroundColor: p.color }} title={`${p.short}: ${p.tasks}`} />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            {PROJECTS.map(p => (
              <span key={p.short} className="text-xs text-neutral-500">{p.short} · {p.tasks}</span>
            ))}
          </div>
        </div>

        {/* AI Brief */}
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-bold text-purple-700 uppercase">AI Brief</span>
          </div>
          <p className="text-xs text-purple-800 leading-relaxed">{AI_BRIEF}</p>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   VARIANT B — Compact Rows + Ring
   Big donut ring center, project rows with inline bars,
   milestone countdown, AI insight
   ═══════════════════════════════════════════════════════════ */
export function ProjectSummaryVariantB() {
  return (
    <div className="h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-white flex flex-col">
      <div className="px-4 py-3 border-b shrink-0">
        <span className="text-sm font-serif font-bold text-neutral-950">Portfolio Pulse</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Big ring + stats */}
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="var(--border-subtle)" strokeWidth="8" />
              {(() => {
                let offset = 0;
                return PROJECTS.map(p => {
                  const pct = (p.done / total) * 251.3;
                  const el = <circle key={p.short} cx="48" cy="48" r="40" fill="none" stroke={p.color} strokeWidth="8" strokeDasharray={`${pct} 251.3`} strokeDashoffset={`${-offset}`} />;
                  offset += pct;
                  return el;
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-mono font-black text-neutral-950">{overallPct}%</span>
              <span className="text-xs text-neutral-400">done</span>
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-ok-solid" />
              <span className="text-xs text-neutral-700"><span className="font-bold">{done}</span> completed</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-warn-solid" />
              <span className="text-xs text-neutral-700"><span className="font-bold">{active}</span> in progress</span>
            </div>
            <div className="flex items-center gap-2">
              <OctagonAlert className="w-3.5 h-3.5 text-bad-solid" />
              <span className="text-xs text-neutral-700"><span className="font-bold">{blocked}</span> blocked</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs text-neutral-700"><span className="font-bold">{total - done - active - blocked}</span> to do</span>
            </div>
          </div>
        </div>

        {/* Project rows */}
        <div className="space-y-1">
          {PROJECTS.map(p => {
            const pc = pace(p);
            const d = dl(p.target);
            return (
              <div key={p.short} className="flex items-center gap-2 py-2 border-b border-neutral-100 last:border-b-0">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-xs font-medium text-neutral-800 w-28 truncate">{p.name}</span>
                <div className="flex-1 h-1.5 bg-neutral-100 rounded-full">
                  <div className="h-full rounded-full" style={{ width: `${p.progress}%`, backgroundColor: p.color }} />
                </div>
                <span className="text-xs font-bold text-neutral-700 w-8 text-right">{p.progress}%</span>
                <span className={`text-xs font-semibold w-14 text-right ${pc.color}`}>{pc.label}</span>
                <span className={`text-xs w-8 text-right ${d < 15 ? "text-bad-solid font-bold" : "text-neutral-400"}`}>{d}d</span>
              </div>
            );
          })}
        </div>

        {/* Deadlines */}
        <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-3">
          <div className="text-xs font-bold text-neutral-500 uppercase mb-2">Deadlines</div>
          <div className="flex gap-2">
            {[...PROJECTS].sort((a, b) => dl(a.target) - dl(b.target)).map(p => {
              const d = dl(p.target);
              return (
                <div key={p.short} className="flex-1 text-center">
                  <div className={`text-xl font-black ${d < 15 ? "text-bad-fg" : d < 40 ? "text-warn-fg" : "text-ok-fg"}`}>{d}d</div>
                  <div className="text-xs text-neutral-500 mt-0.5">{p.short}</div>
                  <div className="text-xs text-neutral-400">{new Date(p.target).toLocaleDateString([], { month: "short", day: "numeric" })}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Brief */}
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-bold text-purple-700 uppercase">AI Summary</span>
          </div>
          <p className="text-xs text-purple-800 leading-relaxed">{AI_BRIEF}</p>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   VARIANT C — Health Traffic Light
   Traffic light dots per project, mini progress arcs,
   risk highlights, blocker callouts, AI brief
   ═══════════════════════════════════════════════════════════ */
export function ProjectSummaryVariantC() {
  return (
    <div className="h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-neutral-900 text-white flex flex-col">
      <div className="px-4 py-3 border-b border-white/10 shrink-0 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-ok-solid animate-pulse" />
        <span className="text-sm font-bold">System Status</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Overall arc */}
        <div className="text-center">
          <div className="relative w-28 h-28 mx-auto">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
              <circle cx="56" cy="56" r="48" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle cx="56" cy="56" r="48" fill="none" stroke="var(--ok-solid)" strokeWidth="8" strokeDasharray={`${overallPct * 3.02} 301.6`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black">{overallPct}%</span>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-3 text-xs">
            <span><span className="font-bold text-ok-fg">{done}</span> done</span>
            <span><span className="font-bold text-warn-fg">{active}</span> active</span>
            <span><span className="font-bold text-bad-fg">{blocked}</span> blocked</span>
          </div>
        </div>

        {/* Project health cards */}
        {PROJECTS.map(p => {
          const pc = pace(p);
          const d = dl(p.target);
          const healthDot = pc.label === "Ahead" ? "bg-ok-solid" : pc.label === "On track" ? "bg-warn-solid" : "bg-bad-solid";
          return (
            <div key={p.short} className="bg-white/5 rounded-lg border border-white/10 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${healthDot}`} />
                <span className="text-sm font-bold flex-1">{p.short}</span>
                <span className="text-xs opacity-60">{d}d left</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full">
                  <div className="h-full rounded-full" style={{ width: `${p.progress}%`, backgroundColor: p.color }} />
                </div>
                <span className="text-xs font-bold">{p.progress}%</span>
              </div>
              <div className="flex gap-3 mt-1.5 text-xs opacity-60">
                <span>{p.done}/{p.tasks} done</span>
                {p.blocked > 0 && <span className="text-bad-fg">{p.blocked} blocked</span>}
              </div>
            </div>
          );
        })}

        {/* Blockers callout */}
        {blocked > 0 && (
          <div className="bg-bad-solid/10 rounded-lg border border-bad-solid/20 p-3">
            <div className="flex items-center gap-2 mb-1">
              <OctagonAlert className="w-3.5 h-3.5 text-bad-fg" />
              <span className="text-xs font-bold text-bad-fg">{blocked} Blocker{blocked > 1 ? "s" : ""}</span>
            </div>
            <p className="text-xs text-bad-solid opacity-80">Tasks blocked across {PROJECTS.filter(p => p.blocked > 0).length} project{PROJECTS.filter(p => p.blocked > 0).length > 1 ? "s" : ""}. Resolve to unblock downstream work.</p>
          </div>
        )}

        {/* AI Brief */}
        <div className="bg-purple-500/10 rounded-lg border border-purple-500/20 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Brain className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-bold text-purple-400 uppercase">AI Brief</span>
          </div>
          <p className="text-xs text-purple-200 leading-relaxed opacity-80">{AI_BRIEF}</p>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   VARIANT D — Minimal Data Wall
   Dense, no decoration, pure information — progress bars,
   numbers, timeline proximity, AI one-liner
   ═══════════════════════════════════════════════════════════ */
export function ProjectSummaryVariantD() {
  return (
    <div className="h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-white flex flex-col">
      <div className="px-4 py-3 border-b shrink-0">
        <span className="text-sm font-serif font-bold text-neutral-950">Portfolio</span>
        <span className="text-xs text-neutral-400 ml-2">{PROJECTS.length} projects · {total} tasks · {done} done</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* Inline overall */}
        <div className="px-4 py-3 border-b flex items-center gap-3">
          <span className="text-3xl font-mono font-black text-neutral-950">{overallPct}%</span>
          <div className="flex-1">
            <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden flex gap-px">
              {PROJECTS.map(p => (
                <div key={p.short} className="h-full" style={{ width: `${(p.tasks / total) * 100}%`, backgroundColor: p.color + "33" }}>
                  <div className="h-full" style={{ width: `${p.progress}%`, backgroundColor: p.color }} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 text-xs shrink-0">
            <span className="text-ok-fg font-bold">{done}✓</span>
            <span className="text-warn-fg font-bold">{active}→</span>
            {blocked > 0 && <span className="text-bad-fg font-bold">{blocked}✕</span>}
          </div>
        </div>

        {/* Project details */}
        {PROJECTS.map(p => {
          const pc = pace(p);
          const d = dl(p.target);
          return (
            <div key={p.short} className="px-4 py-3 border-b">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-sm font-semibold text-neutral-950 flex-1">{p.name}</span>
                <span className={`text-xs font-bold ${pc.color}`}>{pc.label}</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-1.5 bg-neutral-100 rounded-full">
                  <div className="h-full rounded-full" style={{ width: `${p.progress}%`, backgroundColor: p.color }} />
                </div>
                <span className="text-xs font-bold text-neutral-700">{p.progress}%</span>
              </div>
              <div className="flex gap-3 text-xs text-neutral-500">
                <span>{p.done}/{p.tasks} tasks</span>
                <span>{p.active} active</span>
                {p.blocked > 0 && <span className="text-bad-fg">{p.blocked} blocked</span>}
                <span className={`ml-auto font-semibold ${d < 15 ? "text-bad-fg" : "text-neutral-500"}`}>Target: {new Date(p.target).toLocaleDateString([], { month: "short", day: "numeric" })} ({d}d)</span>
              </div>
            </div>
          );
        })}

        {/* AI one-liner */}
        <div className="px-4 py-3 bg-purple-50">
          <div className="flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-500 mt-0.5 shrink-0" />
            <p className="text-xs text-purple-800 leading-relaxed">{AI_BRIEF}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
