"use client";

import React, { useState } from "react";
import {
  Activity, AlertTriangle, ArrowDown, ArrowUp, BarChart3, CheckCircle2,
  Clock, Flag, Flame, GitBranch, Layers, OctagonAlert, Shield,
  Target, TrendingDown, TrendingUp, Users, Zap, CircleDot,
} from "lucide-react";

/* ── SHARED DATA ─────────────────────────────────────── */

const PROJECTS = [
  { name: "Command Center v5", short: "CCv5", color: "#6366F1", progress: 20, done: 2, total: 10, active: 3, blocked: 1, target: "2026-07-31", health: "at-risk" },
  { name: "NeuactReport v3", short: "NRv3", color: "#8B5CF6", progress: 33, done: 2, total: 6, active: 2, blocked: 0, target: "2026-06-01", health: "on-track" },
  { name: "Spot Particle", short: "Spot", color: "#EC4899", progress: 50, done: 3, total: 6, active: 1, blocked: 1, target: "2026-04-30", health: "behind" },
];

const TEAM = [
  { name: "Rohith", role: "Lead", active: 4, done: 5, capacity: 40, hoursLogged: 38, avatar: "R" },
  { name: "Priya", role: "Frontend", active: 2, done: 3, capacity: 40, hoursLogged: 30, avatar: "P" },
  { name: "Arjun", role: "Backend", active: 2, done: 2, capacity: 40, hoursLogged: 28, avatar: "A" },
];

const RISKS = [
  { label: "Scope", score: 72, max: 100 },
  { label: "Deadline", score: 85, max: 100 },
  { label: "Resource", score: 58, max: 100 },
  { label: "Dependencies", score: 45, max: 100 },
  { label: "Tech Debt", score: 30, max: 100 },
];

const VELOCITY = [
  { week: "W10", done: 3 }, { week: "W11", done: 2 }, { week: "W12", done: 4 },
  { week: "W13", done: 2 }, { week: "W14", done: 3 }, { week: "W15", done: 5 },
];

const BLOCKERS = [
  { task: "Phase C — Grid Pack", project: "CCv5", days: 3, assignee: "" },
  { task: "Deploy pipeline fix", project: "CCv5", days: 1, assignee: "" },
  { task: "Particle memory leak", project: "Spot", days: 2, assignee: "Rohith" },
];

const MILESTONES = [
  { name: "Alpha Release", project: "CCv5", date: "May 1", daysLeft: 9, status: "upcoming" },
  { name: "Spot v2.2", project: "Spot", date: "Apr 30", daysLeft: 8, status: "at-risk" },
  { name: "NRv3 Beta", project: "NRv3", date: "May 15", daysLeft: 23, status: "on-track" },
];

const TODAY = new Date();
const totalDone = PROJECTS.reduce((s, p) => s + p.done, 0);
const totalTasks = PROJECTS.reduce((s, p) => s + p.total, 0);
const totalBlocked = PROJECTS.reduce((s, p) => s + p.blocked, 0);
const overallProgress = Math.round((totalDone / totalTasks) * 100);

const healthColor = (h: string) => h === "on-track" ? "text-ok-fg" : h === "at-risk" ? "text-warn-fg" : "text-bad-fg";
const healthBg = (h: string) => h === "on-track" ? "bg-ok-bg border-ok-fg/20" : h === "at-risk" ? "bg-warn-bg border-warn-fg/20" : "bg-bad-bg border-bad-fg/20";
const healthDot = (h: string) => h === "on-track" ? "bg-ok-fg" : h === "at-risk" ? "bg-warn-fg" : "bg-bad-fg";


/* ═══════════════════════════════════════════════════════════
   VARIANT A — Executive Summary
   Big numbers, sparkline trends, project health cards,
   team utilization bars, milestone countdown
   ═══════════════════════════════════════════════════════════ */
export function AdminOverviewVariantA() {
  return (
    <div className="h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-white flex flex-col">
      <div className="px-5 py-3 border-b flex items-center gap-2 shrink-0">
        <BarChart3 className="w-5 h-5 text-blue-500" />
        <h3 className="text-sm font-serif font-bold text-neutral-950">Executive Summary</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Big KPIs */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-neutral-900 rounded-2xl p-4 text-white">
            <div className="text-xs opacity-60 uppercase font-semibold">Overall</div>
            <div className="text-3xl font-black mt-1">{overallProgress}%</div>
            <div className="w-full h-1.5 bg-white/20 rounded-full mt-2"><div className="h-full bg-white rounded-full" style={{ width: `${overallProgress}%` }} /></div>
          </div>
          <div className="bg-ok-bg rounded-2xl p-4 border border-ok-fg/20">
            <div className="text-xs text-ok-fg uppercase font-semibold">Completed</div>
            <div className="text-3xl font-black text-ok-fg mt-1">{totalDone}</div>
            <div className="flex items-center gap-1 mt-1"><ArrowUp className="w-3 h-3 text-ok-fg" /><span className="text-xs text-ok-fg">+3 this week</span></div>
          </div>
          <div className="bg-warn-bg rounded-2xl p-4 border border-warn-fg/20">
            <div className="text-xs text-warn-fg uppercase font-semibold">In Flight</div>
            <div className="text-3xl font-black text-warn-fg mt-1">{PROJECTS.reduce((s, p) => s + p.active, 0)}</div>
            <div className="text-xs text-warn-fg mt-1">across {PROJECTS.length} projects</div>
          </div>
          <div className={`rounded-2xl p-4 border ${totalBlocked > 0 ? "bg-bad-bg border-bad-fg/20" : "bg-neutral-50 border-neutral-200"}`}>
            <div className={`text-xs uppercase font-semibold ${totalBlocked > 0 ? "text-bad-fg" : "text-neutral-400"}`}>Blocked</div>
            <div className={`text-3xl font-black mt-1 ${totalBlocked > 0 ? "text-bad-fg" : "text-neutral-300"}`}>{totalBlocked}</div>
            {totalBlocked > 0 && <div className="text-xs text-bad-fg mt-1">needs attention</div>}
          </div>
        </div>

        {/* Project health cards */}
        <div className="grid grid-cols-3 gap-3">
          {PROJECTS.map(p => (
            <div key={p.short} className={`rounded-lg border p-4 ${healthBg(p.health)}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-sm font-serif font-bold text-neutral-950">{p.name}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-mono font-black text-neutral-800">{p.progress}%</span>
                <span className={`text-xs font-bold uppercase ${healthColor(p.health)}`}>{p.health.replace("-", " ")}</span>
              </div>
              <div className="w-full h-1.5 bg-white/60 rounded-full"><div className="h-full rounded-full" style={{ width: `${p.progress}%`, backgroundColor: p.color }} /></div>
              <div className="flex justify-between mt-2 text-xs text-neutral-500">
                <span>{p.done}/{p.total} done</span>
                <span>{p.blocked > 0 ? `${p.blocked} blocked` : "no blockers"}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Velocity + Team side by side */}
        <div className="grid grid-cols-2 gap-4">
          {/* Velocity */}
          <div className="rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-serif font-bold text-neutral-950">Velocity</span>
              <span className="text-xs text-ok-fg font-medium ml-auto">↑ 18%</span>
            </div>
            <div className="flex items-end gap-1.5 h-20">
              {VELOCITY.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full rounded-t-md ${i === VELOCITY.length - 1 ? "bg-blue-500" : "bg-neutral-200"}`} style={{ height: `${(v.done / 6) * 100}%` }} />
                  <span className="text-xs text-neutral-400">{v.week}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-neutral-500 mt-2 text-center">Avg: {(VELOCITY.reduce((s, v) => s + v.done, 0) / VELOCITY.length).toFixed(1)} tasks/week</div>
          </div>

          {/* Team utilization */}
          <div className="rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-serif font-bold text-neutral-950">Team Load</span>
            </div>
            <div className="space-y-3">
              {TEAM.map(t => {
                const pct = Math.round((t.hoursLogged / t.capacity) * 100);
                const overloaded = pct > 90;
                return (
                  <div key={t.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-neutral-900 flex items-center justify-center text-xs font-bold text-white">{t.avatar}</div>
                        <span className="text-xs font-medium text-neutral-800">{t.name}</span>
                      </div>
                      <span className={`text-xs font-semibold ${overloaded ? "text-bad-fg" : "text-neutral-500"}`}>{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-100 rounded-full">
                      <div className={`h-full rounded-full ${overloaded ? "bg-bad-fg" : pct > 70 ? "bg-warn-fg" : "bg-ok-fg"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Milestones countdown */}
        <div className="rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flag className="w-4 h-4 text-warn-solid" />
            <span className="text-sm font-serif font-bold text-neutral-950">Upcoming Milestones</span>
          </div>
          <div className="flex gap-3">
            {MILESTONES.map(m => (
              <div key={m.name} className={`flex-1 rounded-lg border p-3 ${healthBg(m.status)}`}>
                <div className="text-sm font-semibold text-neutral-800">{m.name}</div>
                <div className="text-xs text-neutral-500 mt-0.5">{m.project} · {m.date}</div>
                <div className={`text-lg font-black mt-1 ${healthColor(m.status)}`}>{m.daysLeft}d</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   VARIANT B — Health Monitor
   Traffic lights per project, risk bars, blocker list,
   burndown sparkline, deadline proximity gauge
   ═══════════════════════════════════════════════════════════ */
export function AdminOverviewVariantB() {
  return (
    <div className="h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-neutral-900 flex flex-col text-white">
      <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2 shrink-0">
        <Shield className="w-5 h-5 text-ok-solid" />
        <h3 className="text-sm font-bold">Health Monitor</h3>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-ok-solid animate-pulse" />
          <span className="text-xs text-neutral-400">Live</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Project health row */}
        <div className="grid grid-cols-3 gap-3">
          {PROJECTS.map(p => (
            <div key={p.short} className="bg-white/5 rounded-lg border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${healthDot(p.health)}`} />
                <span className="text-sm font-bold">{p.short}</span>
                <span className={`text-xs font-bold uppercase ml-auto ${healthColor(p.health)}`}>{p.health.replace("-", " ")}</span>
              </div>
              {/* Mini progress ring */}
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                    <circle cx="28" cy="28" r="24" fill="none" stroke={p.color} strokeWidth="4" strokeDasharray={`${p.progress * 1.51} 151`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-black">{p.progress}%</div>
                </div>
                <div className="text-xs space-y-1 text-neutral-400">
                  <div><span className="text-white font-semibold">{p.done}</span> done</div>
                  <div><span className="text-white font-semibold">{p.active}</span> active</div>
                  <div className={p.blocked > 0 ? "text-bad-fg" : ""}><span className="font-semibold">{p.blocked}</span> blocked</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Risk bars */}
        <div className="bg-white/5 rounded-lg border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-warn-solid" />
            <span className="text-sm font-bold">Risk Assessment</span>
            <span className="text-xs text-bad-fg font-bold ml-auto">HIGH</span>
          </div>
          <div className="space-y-2">
            {RISKS.map(r => (
              <div key={r.label} className="flex items-center gap-3">
                <span className="text-xs text-neutral-400 w-20 shrink-0">{r.label}</span>
                <div className="flex-1 h-2 bg-white/10 rounded-full">
                  <div className={`h-full rounded-full ${r.score > 70 ? "bg-bad-fg" : r.score > 50 ? "bg-warn-fg" : "bg-ok-fg"}`} style={{ width: `${r.score}%` }} />
                </div>
                <span className={`text-xs font-bold w-8 text-right ${r.score > 70 ? "text-bad-fg" : r.score > 50 ? "text-warn-fg" : "text-ok-fg"}`}>{r.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Blockers + Velocity side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bad-bg/10 rounded-lg border border-bad-fg/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <OctagonAlert className="w-4 h-4 text-bad-fg" />
              <span className="text-sm font-bold">Blockers</span>
              <span className="text-xs bg-bad-fg text-white px-2 py-0.5 rounded-full font-bold ml-auto">{BLOCKERS.length}</span>
            </div>
            <div className="space-y-2">
              {BLOCKERS.map((b, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-2.5">
                  <div className="text-xs font-medium text-white">{b.task}</div>
                  <div className="text-xs text-neutral-400 mt-0.5">{b.project} · {b.days}d blocked · {b.assignee || "Unassigned"}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-warn-solid" />
              <span className="text-sm font-bold">Sprint Velocity</span>
            </div>
            <div className="flex items-end gap-2 h-24">
              {VELOCITY.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-neutral-500">{v.done}</span>
                  <div className={`w-full rounded-t ${i === VELOCITY.length - 1 ? "bg-ok-solid" : "bg-white/20"}`} style={{ height: `${(v.done / 6) * 100}%` }} />
                  <span className="text-xs text-neutral-500">{v.week}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Milestone proximity */}
        <div className="bg-white/5 rounded-lg border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold">Deadline Proximity</span>
          </div>
          <div className="flex gap-3">
            {MILESTONES.map(m => (
              <div key={m.name} className="flex-1 text-center">
                <div className={`text-2xl font-black ${m.daysLeft < 10 ? "text-bad-fg" : m.daysLeft < 20 ? "text-warn-fg" : "text-ok-fg"}`}>{m.daysLeft}d</div>
                <div className="text-xs text-neutral-400 mt-1">{m.name}</div>
                <div className="text-xs text-neutral-500">{m.project}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   VARIANT C — Team & Workload Focus
   Per-person cards with task breakdown, capacity gauge,
   project contribution, blockers they own
   ═══════════════════════════════════════════════════════════ */
export function AdminOverviewVariantC() {
  return (
    <div className="h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50 flex flex-col">
      <div className="px-5 py-3 border-b bg-white flex items-center gap-2 shrink-0">
        <Users className="w-5 h-5 text-purple-500" />
        <h3 className="text-sm font-serif font-bold text-neutral-950">Team & Workload</h3>
        <div className="flex-1" />
        <span className="text-xs text-neutral-400">{TEAM.length} members · {PROJECTS.length} projects</span>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Overall pulse */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white rounded-lg border border-neutral-200 p-4 text-center">
            <div className="text-3xl font-mono font-black text-neutral-950">{overallProgress}%</div>
            <div className="text-xs text-neutral-500 mt-1">Overall Progress</div>
          </div>
          <div className="flex-1 bg-white rounded-lg border border-neutral-200 p-4 text-center">
            <div className="text-3xl font-black text-ok-fg">{totalDone}/{totalTasks}</div>
            <div className="text-xs text-neutral-500 mt-1">Tasks Done</div>
          </div>
          <div className="flex-1 bg-white rounded-lg border border-neutral-200 p-4 text-center">
            <div className={`text-3xl font-black ${totalBlocked > 0 ? "text-bad-fg" : "text-neutral-300"}`}>{totalBlocked}</div>
            <div className="text-xs text-neutral-500 mt-1">Blocked</div>
          </div>
          <div className="flex-1 bg-white rounded-lg border border-neutral-200 p-4 text-center">
            <div className="text-3xl font-black text-info-fg">{(VELOCITY.reduce((s, v) => s + v.done, 0) / VELOCITY.length).toFixed(1)}</div>
            <div className="text-xs text-neutral-500 mt-1">Avg Velocity</div>
          </div>
        </div>

        {/* Team cards */}
        <div className="grid grid-cols-3 gap-4">
          {TEAM.map(t => {
            const pct = Math.round((t.hoursLogged / t.capacity) * 100);
            const status = pct > 90 ? "Overloaded" : pct > 70 ? "Full" : "Available";
            const statusColor = pct > 90 ? "text-bad-fg bg-bad-bg border-bad-fg/20" : pct > 70 ? "text-warn-fg bg-warn-bg border-warn-fg/20" : "text-ok-fg bg-ok-bg border-ok-fg/20";
            return (
              <div key={t.name} className="bg-white rounded-lg border border-neutral-200 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-sm font-bold text-white">{t.avatar}</div>
                  <div>
                    <div className="text-sm font-serif font-bold text-neutral-950">{t.name}</div>
                    <div className="text-xs text-neutral-400">{t.role}</div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-auto border ${statusColor}`}>{status}</span>
                </div>
                {/* Capacity gauge */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-500">Capacity</span>
                    <span className="font-semibold text-neutral-700">{t.hoursLogged}/{t.capacity}h</span>
                  </div>
                  <div className="w-full h-3 bg-neutral-100 rounded-full">
                    <div className={`h-full rounded-full ${pct > 90 ? "bg-bad-fg" : pct > 70 ? "bg-warn-fg" : "bg-ok-fg"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </div>
                {/* Task breakdown */}
                <div className="flex gap-2">
                  <div className="flex-1 bg-ok-bg rounded-lg p-2 text-center">
                    <div className="text-lg font-black text-ok-fg">{t.done}</div>
                    <div className="text-xs text-ok-fg">Done</div>
                  </div>
                  <div className="flex-1 bg-warn-bg rounded-lg p-2 text-center">
                    <div className="text-lg font-black text-warn-fg">{t.active}</div>
                    <div className="text-xs text-warn-fg">Active</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Project breakdown per person */}
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="text-sm font-bold text-neutral-950 mb-3">Project Contribution</div>
          <div className="space-y-2">
            {TEAM.map(t => (
              <div key={t.name} className="flex items-center gap-3">
                <span className="text-xs font-medium text-neutral-700 w-16 shrink-0">{t.name}</span>
                <div className="flex-1 flex gap-0.5 h-4 rounded-full overflow-hidden bg-neutral-100">
                  {PROJECTS.map(p => (
                    <div key={p.short} className="h-full" style={{ width: `${100 / PROJECTS.length}%`, backgroundColor: p.color, opacity: 0.7 }} title={p.short} />
                  ))}
                </div>
                <div className="flex gap-1 shrink-0">
                  {PROJECTS.map(p => <div key={p.short} className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} title={p.short} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   VARIANT D — Action Triage
   What needs your attention NOW — blockers, overdue,
   unassigned, risk items, all as actionable cards
   ═══════════════════════════════════════════════════════════ */
export function AdminOverviewVariantD() {
  return (
    <div className="h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50 flex flex-col">
      <div className="px-5 py-3 border-b bg-white flex items-center gap-2 shrink-0">
        <Flame className="w-5 h-5 text-bad-solid" />
        <h3 className="text-sm font-serif font-bold text-neutral-950">Triage — Action Required</h3>
        <div className="flex-1" />
        <span className="text-xs bg-bad-fg text-white px-2.5 py-0.5 rounded-full font-bold">{BLOCKERS.length + 2} items need attention</span>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Priority summary */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-bad-bg rounded-lg border border-bad-fg/20 p-3 text-center">
            <OctagonAlert className="w-5 h-5 text-bad-fg mx-auto" />
            <div className="text-2xl font-black text-bad-fg mt-1">{BLOCKERS.length}</div>
            <div className="text-xs font-semibold text-bad-fg">Blocked</div>
          </div>
          <div className="bg-warn-bg rounded-lg border border-warn-fg/20 p-3 text-center">
            <Clock className="w-5 h-5 text-warn-fg mx-auto" />
            <div className="text-2xl font-black text-warn-fg mt-1">2</div>
            <div className="text-xs font-semibold text-warn-fg">Overdue</div>
          </div>
          <div className="bg-info-bg rounded-lg border border-info-fg/20 p-3 text-center">
            <Users className="w-5 h-5 text-info-fg mx-auto" />
            <div className="text-2xl font-black text-info-fg mt-1">3</div>
            <div className="text-xs font-semibold text-info-fg">Unassigned</div>
          </div>
          <div className="bg-info-bg rounded-lg border border-info-fg/20 p-3 text-center">
            <AlertTriangle className="w-5 h-5 text-info-fg mx-auto" />
            <div className="text-2xl font-black text-info-fg mt-1">1</div>
            <div className="text-xs font-semibold text-info-fg">At Risk</div>
          </div>
        </div>

        {/* Blocker cards */}
        <div className="bg-bad-bg rounded-2xl border border-bad-fg/20 p-4">
          <div className="text-sm font-bold text-bad-fg flex items-center gap-2 mb-3"><OctagonAlert className="w-4 h-4" /> Resolve Now</div>
          <div className="space-y-2">
            {BLOCKERS.map((b, i) => (
              <div key={i} className="bg-white rounded-lg p-3 border border-bad-fg/10 flex items-center gap-3">
                <div className="w-2 h-8 rounded-full bg-bad-fg shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-neutral-800">{b.task}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">{b.project} · blocked {b.days}d</div>
                </div>
                <span className="text-xs font-semibold text-bad-fg shrink-0">{b.assignee || "Needs owner"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* At-risk projects */}
        <div className="bg-warn-bg rounded-2xl border border-warn-fg/20 p-4">
          <div className="text-sm font-bold text-warn-fg flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4" /> Project Health Alerts</div>
          <div className="space-y-2">
            {PROJECTS.filter(p => p.health !== "on-track").map(p => (
              <div key={p.short} className="bg-white rounded-lg p-3 border border-warn-fg/10 flex items-center gap-3">
                <div className="w-2 h-8 rounded-full" style={{ backgroundColor: p.color }} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-neutral-800">{p.name}</div>
                  <div className="text-xs text-neutral-500">{p.progress}% done · {p.blocked} blocked · target {p.target}</div>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${healthBg(p.health)} ${healthColor(p.health)}`}>{p.health.replace("-", " ")}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Milestone warnings */}
        <div className="bg-info-bg rounded-2xl border border-info-fg/20 p-4">
          <div className="text-sm font-bold text-info-fg flex items-center gap-2 mb-3"><Flag className="w-4 h-4" /> Upcoming Deadlines</div>
          <div className="flex gap-3">
            {MILESTONES.map(m => (
              <div key={m.name} className={`flex-1 bg-white rounded-lg p-3 border ${m.daysLeft < 10 ? "border-bad-fg/20" : "border-neutral-100"}`}>
                <div className={`text-xl font-black ${m.daysLeft < 10 ? "text-bad-fg" : "text-neutral-800"}`}>{m.daysLeft}d</div>
                <div className="text-xs font-medium text-neutral-700 mt-1">{m.name}</div>
                <div className="text-xs text-neutral-400">{m.project}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   VARIANT E — Compact Dashboard
   Everything in one view: mini project bars, inline risk,
   team dots, velocity sparkline, blocker count — dense
   ═══════════════════════════════════════════════════════════ */
export function AdminOverviewVariantE() {
  return (
    <div className="h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-white flex flex-col">
      <div className="px-5 py-3 border-b flex items-center gap-2 shrink-0">
        <Layers className="w-5 h-5 text-indigo-500" />
        <h3 className="text-sm font-serif font-bold text-neutral-950">Compact Dashboard</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* Top strip: overall + blockers + velocity inline */}
        <div className="px-5 py-4 border-b flex items-center gap-6">
          <div>
            <div className="text-xs text-neutral-400 uppercase font-semibold">Progress</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-2xl font-mono font-black text-neutral-950">{overallProgress}%</div>
              <div className="w-32 h-2 bg-neutral-100 rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${overallProgress}%` }} /></div>
            </div>
          </div>
          <div className="h-10 w-px bg-neutral-200" />
          <div>
            <div className="text-xs text-neutral-400 uppercase font-semibold">Tasks</div>
            <div className="text-2xl font-mono font-black text-neutral-950 mt-1">{totalDone}<span className="text-neutral-300">/{totalTasks}</span></div>
          </div>
          <div className="h-10 w-px bg-neutral-200" />
          <div>
            <div className="text-xs text-neutral-400 uppercase font-semibold">Blocked</div>
            <div className={`text-2xl font-black mt-1 ${totalBlocked > 0 ? "text-bad-fg" : "text-neutral-300"}`}>{totalBlocked}</div>
          </div>
          <div className="h-10 w-px bg-neutral-200" />
          <div>
            <div className="text-xs text-neutral-400 uppercase font-semibold">Velocity</div>
            <div className="flex items-end gap-0.5 h-8 mt-1">
              {VELOCITY.map((v, i) => (
                <div key={i} className={`w-3 rounded-t ${i === VELOCITY.length - 1 ? "bg-blue-500" : "bg-neutral-200"}`} style={{ height: `${(v.done / 6) * 100}%` }} />
              ))}
            </div>
          </div>
          <div className="flex-1" />
          {/* Team dots */}
          <div className="flex -space-x-1.5">
            {TEAM.map(t => (
              <div key={t.name} className="w-7 h-7 rounded-full bg-neutral-900 flex items-center justify-center text-xs font-bold text-white border-2 border-white" title={t.name}>{t.avatar}</div>
            ))}
          </div>
        </div>

        {/* Projects */}
        <div className="px-5 py-4 border-b space-y-3">
          <div className="text-xs text-neutral-400 uppercase font-semibold mb-2">Projects</div>
          {PROJECTS.map(p => (
            <div key={p.short} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              <span className="text-sm font-medium text-neutral-800 w-40 shrink-0">{p.name}</span>
              <div className="flex-1 h-2 bg-neutral-100 rounded-full">
                <div className="h-full rounded-full" style={{ width: `${p.progress}%`, backgroundColor: p.color }} />
              </div>
              <span className="text-xs font-bold text-neutral-700 w-10 text-right">{p.progress}%</span>
              <div className={`w-2 h-2 rounded-full ${healthDot(p.health)}`} />
              <span className={`text-xs font-semibold w-16 ${healthColor(p.health)}`}>{p.health.replace("-", " ")}</span>
            </div>
          ))}
        </div>

        {/* Risk + Team side by side compact */}
        <div className="flex border-b">
          {/* Risks */}
          <div className="flex-1 px-5 py-4 border-r">
            <div className="text-xs text-neutral-400 uppercase font-semibold mb-3">Risk</div>
            <div className="space-y-2">
              {RISKS.map(r => (
                <div key={r.label} className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500 w-16 shrink-0">{r.label}</span>
                  <div className="flex-1 h-1.5 bg-neutral-100 rounded-full">
                    <div className={`h-full rounded-full ${r.score > 70 ? "bg-bad-fg" : r.score > 50 ? "bg-warn-fg" : "bg-ok-fg"}`} style={{ width: `${r.score}%` }} />
                  </div>
                  <span className="text-xs font-bold text-neutral-500 w-6 text-right">{r.score}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Team load */}
          <div className="flex-1 px-5 py-4">
            <div className="text-xs text-neutral-400 uppercase font-semibold mb-3">Team Load</div>
            <div className="space-y-2">
              {TEAM.map(t => {
                const pct = Math.round((t.hoursLogged / t.capacity) * 100);
                return (
                  <div key={t.name} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-neutral-900 flex items-center justify-center text-xs font-bold text-white shrink-0">{t.avatar}</div>
                    <span className="text-xs text-neutral-700 w-12 shrink-0">{t.name}</span>
                    <div className="flex-1 h-1.5 bg-neutral-100 rounded-full">
                      <div className={`h-full rounded-full ${pct > 90 ? "bg-bad-fg" : pct > 70 ? "bg-warn-fg" : "bg-ok-fg"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                    <span className="text-xs font-bold text-neutral-500 w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Blockers + Milestones */}
        <div className="flex">
          <div className="flex-1 px-5 py-4 border-r">
            <div className="text-xs text-bad-fg uppercase font-semibold mb-2">Blockers</div>
            <div className="space-y-1.5">
              {BLOCKERS.map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-bad-fg shrink-0" />
                  <span className="text-xs text-neutral-700 truncate flex-1">{b.task}</span>
                  <span className="text-xs text-bad-fg shrink-0">{b.days}d</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 px-5 py-4">
            <div className="text-xs text-warn-fg uppercase font-semibold mb-2">Milestones</div>
            <div className="space-y-1.5">
              {MILESTONES.map(m => (
                <div key={m.name} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${healthDot(m.status)}`} />
                  <span className="text-xs text-neutral-700 truncate flex-1">{m.name}</span>
                  <span className={`text-xs font-bold ${m.daysLeft < 10 ? "text-bad-fg" : "text-neutral-400"}`}>{m.daysLeft}d</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
