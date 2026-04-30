"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, Activity, CheckCircle2, OctagonAlert, CircleDot,
  TrendingDown, AlertTriangle, BarChart3, Layers,
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import RiskRadar from "@/components/widgets/risk-radar";
import { riskData, burndownData } from "@/components/layouts/fixtures";

/* ── SHARED DATA ─────────────────────────────────────────── */

const PROJECTS = [
  { name: "Command Center v5", short: "CCv5", color: "#3b82f6", progress: 42, done: 5, active: 3, blocked: 1, total: 12, deadline: 97, health: "on-track" as const, lead: "Rohith" },
  { name: "NeuactReport v3", short: "NRv3", color: "#8b5cf6", progress: 31, done: 3, active: 2, blocked: 0, total: 8, deadline: 37, health: "at-risk" as const, lead: "Priya" },
  { name: "Spot Particle", short: "Spot", color: "#f59e0b", progress: 68, done: 6, active: 1, blocked: 2, total: 9, deadline: 5, health: "critical" as const, lead: "Arjun" },
];

const TOTALS = { done: 14, active: 6, blocked: 3, todo: 6, total: 29 };
const OVERALL_PCT = Math.round((TOTALS.done / TOTALS.total) * 100);
const NEAREST_DEADLINE = Math.min(...PROJECTS.map(p => p.deadline));

const STAGES = ["Research", "Design", "Build", "Test", "Ship"] as const;
const STAGE_DATA: Record<string, { stage: string; done: number; total: number; status: string }[]> = {
  CCv5: [{ stage: "Research", done: 2, total: 2, status: "done" }, { stage: "Design", done: 2, total: 2, status: "done" }, { stage: "Build", done: 1, total: 4, status: "active" }, { stage: "Test", done: 0, total: 2, status: "todo" }, { stage: "Ship", done: 0, total: 2, status: "blocked" }],
  NRv3: [{ stage: "Research", done: 1, total: 1, status: "done" }, { stage: "Design", done: 1, total: 1, status: "done" }, { stage: "Build", done: 1, total: 3, status: "active" }, { stage: "Test", done: 0, total: 1, status: "todo" }, { stage: "Ship", done: 0, total: 1, status: "backlog" }],
  Spot: [{ stage: "Research", done: 1, total: 1, status: "done" }, { stage: "Design", done: 2, total: 2, status: "done" }, { stage: "Build", done: 2, total: 4, status: "blocked" }, { stage: "Test", done: 0, total: 1, status: "todo" }, { stage: "Ship", done: 1, total: 1, status: "done" }],
};

const HEALTH_COLORS = {
  "on-track": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", label: "On Track" },
  "at-risk": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", label: "At Risk" },
  "critical": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", label: "Critical" },
};

const STAGE_COLORS: Record<string, { bg: string; text: string; fill: string }> = {
  done: { bg: "bg-emerald-50", text: "text-emerald-700", fill: "bg-emerald-500" },
  active: { bg: "bg-amber-50", text: "text-amber-700", fill: "bg-amber-500" },
  blocked: { bg: "bg-red-50", text: "text-red-700", fill: "bg-red-500" },
  todo: { bg: "bg-blue-50", text: "text-blue-700", fill: "bg-blue-400" },
  backlog: { bg: "bg-neutral-50", text: "text-neutral-500", fill: "bg-neutral-300" },
};

const deadlineColor = (d: number) => d <= 7 ? "text-red-600" : d <= 30 ? "text-amber-600" : "text-emerald-600";
const deadlineBgClass = (d: number) => d <= 7 ? "bg-red-50 border-red-200" : d <= 30 ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200";

const CIRC = 2 * Math.PI * 42;

const toSlug = (name: string) => `/project/${name.toLowerCase().replace(/\s+/g, "-")}`;

/* ── Shared: Header ─────────────────────────────────────── */
function KPIHeader() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return (
    <div className="px-3 py-2 bg-white border-b border-neutral-100 flex items-center justify-between shrink-0">
      <div>
        <div className="text-[11px] uppercase font-bold text-neutral-400 tracking-widest">{greeting}, <span className="text-sm">Rohith</span></div>
        <div className="text-[11px] text-neutral-500">{TOTALS.done}/{TOTALS.total} tasks &middot; {PROJECTS.length} projects</div>
      </div>
    </div>
  );
}

/* ── Shared: Segment bar (no All tab) ──────────────────── */
function SegmentBar({ sel, onSelect }: { sel: string | null; onSelect: (s: string | null) => void }) {
  return (
    <div className="flex h-12 rounded-xl overflow-hidden gap-[2px] bg-neutral-100 flex-1">
      {PROJECTS.map(p => {
        const active = sel === p.short;
        return (
          <button key={p.short} onClick={() => onSelect(active ? null : p.short)}
            className="relative h-full flex items-center justify-center transition-all"
            style={{ flex: p.total, backgroundColor: active ? p.color : `${p.color}30` }}>
            <div className="flex flex-col items-center justify-center px-2">
              <span className={`text-[11px] font-bold ${active ? "text-white" : "text-neutral-700"}`}>{p.short}</span>
              <span className={`text-[11px] ${active ? "text-white/70" : "text-neutral-400"}`}>{p.progress}% done</span>
            </div>
            {active && <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30" />}
          </button>
        );
      })}
    </div>
  );
}

/* ── Shared: Project detail (left panel) ──────────────── */
function ProjectDetailPanel({ proj }: { proj: typeof PROJECTS[0] }) {
  const router = useRouter();
  const h = HEALTH_COLORS[proj.health];
  return (
    <div className="flex-1 bg-white rounded-lg border border-neutral-200 p-2 flex flex-col cursor-pointer hover:border-neutral-300 transition-colors"
      onClick={() => router.push(toSlug(proj.name))}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: proj.color }} />
        <span className="text-xs font-bold text-neutral-900">{proj.name}</span>
        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full border ml-auto ${h.bg} ${h.text} ${h.border}`}>{h.label}</span>
      </div>
      <div className="mb-1.5">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[11px] text-neutral-400">Progress</span>
          <span className="text-[11px] font-black text-neutral-700">{proj.progress}%</span>
        </div>
        <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${proj.progress}%`, backgroundColor: proj.color }} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 mb-1.5">
        <div className="bg-emerald-50 rounded p-1 text-center">
          <div className="text-xs font-black text-emerald-700">{proj.done}</div>
          <div className="text-[11px] text-emerald-600">Done</div>
        </div>
        <div className="bg-amber-50 rounded p-1 text-center">
          <div className="text-xs font-black text-amber-700">{proj.active}</div>
          <div className="text-[11px] text-amber-600">Active</div>
        </div>
        <div className="bg-red-50 rounded p-1 text-center">
          <div className="text-xs font-black text-red-700">{proj.blocked}</div>
          <div className="text-[11px] text-red-600">Blocked</div>
        </div>
      </div>
      <div className="flex-1 bg-purple-50 rounded border border-purple-100 p-1.5">
        <div className="flex items-center gap-1 mb-1">
          <div className="w-3 h-3 rounded-full bg-purple-600 flex items-center justify-center">
            <span className="text-[11px] font-black text-white">AI</span>
          </div>
          <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wide">Assessment</span>
        </div>
        <p className="text-[11px] text-purple-700 leading-relaxed">
          {proj.health === "critical"
            ? `Blocked — ${proj.blocked} task${proj.blocked > 1 ? "s" : ""} need attention. ${proj.deadline}d left.`
            : proj.health === "at-risk"
            ? `${proj.progress}% done, ${proj.active} active. ${proj.deadline}d left — watch scope.`
            : `On track at ${proj.progress}%. ${proj.done} shipped, ${proj.deadline}d to go.`
          }
        </p>
      </div>
      <div className="flex items-center text-[11px] mt-1.5 text-neutral-400">
        <span>{proj.lead} &middot; {proj.total} tasks</span>
      </div>
    </div>
  );
}


/* ── Shared: Status panel (right — deadline + pipeline) ── */
function StatusPanel({ sel }: { sel: string }) {
  const router = useRouter();
  const proj = PROJECTS.find(p => p.short === sel)!;
  const h = HEALTH_COLORS[proj.health];
  const stages = STAGE_DATA[sel] || [];

  return (
    <div className="flex-1 bg-white rounded-lg border border-neutral-200 p-2 flex flex-col cursor-pointer hover:border-neutral-300 transition-colors"
      onClick={() => router.push(`${toSlug(proj.name)}?tab=pipeline`)}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: proj.color }} />
          <span className="text-sm font-bold text-neutral-900">{proj.short} Status</span>
        </div>
        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full border ${h.bg} ${h.text} ${h.border}`}>{h.label}</span>
      </div>
      <div className={`rounded border p-1.5 mb-1.5 text-center ${deadlineBgClass(proj.deadline)}`}>
        <div className={`text-xl font-black ${deadlineColor(proj.deadline)}`}>{proj.deadline}d</div>
        <div className="text-[11px] text-neutral-500">until deadline</div>
        {proj.deadline <= 7 && (
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <AlertTriangle className="w-2.5 h-2.5 text-red-500" />
            <span className="text-[11px] font-bold text-red-600">Urgent</span>
          </div>
        )}
      </div>
      <span className="text-[11px] text-neutral-400 uppercase tracking-widest font-bold mb-1">Pipeline</span>
      <div className="flex-1 space-y-1">
        {stages.map(s => {
          const sc = STAGE_COLORS[s.status];
          const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
          const Icon = s.status === "done" ? CheckCircle2 : s.status === "blocked" ? OctagonAlert : s.status === "active" ? Activity : CircleDot;
          return (
            <div key={s.stage} className="flex items-center gap-1.5">
              <Icon className={`w-2.5 h-2.5 shrink-0 ${sc.text}`} />
              <span className="text-[11px] font-medium text-neutral-600 w-10 shrink-0">{s.stage}</span>
              <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${sc.fill}`} style={{ width: `${pct}%` }} />
              </div>
              <span className={`text-[11px] font-bold ${sc.text} w-6 text-right`}>{s.done}/{s.total}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Sprint chart tooltip ──────────────────────────────────── */
const SprintTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-neutral-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-neutral-800">
      <div className="font-bold mb-1">{label}</div>
      <div className="flex items-center gap-3">
        <span className="text-blue-400">Planned: {payload[0]?.value}</span>
        <span className="text-amber-400">Actual: {payload[1]?.value}</span>
      </div>
      {payload[0]?.payload?.annotation && (
        <div className="mt-1 pt-1 border-t border-neutral-700 text-neutral-300">{payload[0].payload.annotation}</div>
      )}
    </div>
  );
};

/* ── Sprint Section — card style, flex height ──────────────  */
function SprintSection({ sel }: { sel: string }) {
  const router = useRouter();
  const proj = PROJECTS.find(p => p.short === sel) || PROJECTS[0];
  const lastPoint = burndownData.points[burndownData.points.length - 1];
  const delta = lastPoint.actual - lastPoint.planned;
  return (
    <div className="bg-white rounded-lg border border-neutral-200 flex flex-col flex-1 min-h-0 cursor-pointer hover:border-neutral-300 transition-colors"
      onClick={() => router.push(`${toSlug(proj.name)}?tab=sprint`)}>
      <div className="px-2.5 py-1.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <TrendingDown className="w-3 h-3 text-neutral-400" />
          <span className="text-sm font-bold text-neutral-900">Sprint 12</span>
          <span className="text-[11px] text-neutral-400">Apr 1–20</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex flex-col items-center px-1.5 py-0.5 bg-neutral-50 rounded border border-neutral-100">
            <span className="text-[11px] text-neutral-400 uppercase leading-none">Vel</span>
            <span className="text-[11px] font-black text-neutral-800">{burndownData.velocity}/d</span>
          </div>
          <div className="flex flex-col items-center px-1.5 py-0.5 bg-neutral-50 rounded border border-neutral-100">
            <span className="text-[11px] text-neutral-400 uppercase leading-none">Ends</span>
            <span className="text-[11px] font-black text-neutral-800">{burndownData.projectedEndDate}</span>
          </div>
          <div className="flex flex-col items-center px-1.5 py-0.5 bg-amber-50 rounded border border-amber-200">
            <span className="text-[11px] text-amber-600 uppercase leading-none">Behind</span>
            <span className="text-[11px] font-black text-amber-700">{delta} tasks</span>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 px-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={burndownData.points} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="planGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.08} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="actualGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#a3a3a3" }} tickLine={false} axisLine={{ stroke: "#e5e5e5" }} />
            <YAxis tick={{ fontSize: 11, fill: "#a3a3a3" }} tickLine={false} axisLine={false} domain={[0, burndownData.totalTasks]} width={24} />
            <Tooltip content={<SprintTooltip />} />
            <ReferenceArea x1="Apr 7" x2="Apr 9" fill="#fef2f2" />
            <Area type="monotone" dataKey="planned" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="5 3" fill="url(#planGrad)" dot={false} />
            <Area type="monotone" dataKey="actual" stroke="#f59e0b" strokeWidth={2.5} fill="url(#actualGrad2)" dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }} />
            <ReferenceLine x="Apr 7" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 2"
              label={{ value: "Blocked", position: "insideTopLeft", fill: "#ef4444", fontSize: 11, fontWeight: 700 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-3 px-2.5 pb-1 pt-0.5 text-[11px] text-neutral-400 shrink-0">
        <span className="flex items-center gap-1"><svg width="12" height="6"><line x1="0" y1="3" x2="12" y2="3" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 2" /></svg> Planned</span>
        <span className="flex items-center gap-1"><svg width="12" height="6"><line x1="0" y1="3" x2="12" y2="3" stroke="#f59e0b" strokeWidth="2" /></svg> Actual</span>
        <span className="flex items-center gap-1"><span className="w-2 h-1.5 rounded-sm bg-red-100 border border-red-200 inline-block" /> Behind</span>
      </div>
    </div>
  );
}

/* ── Diagnostic data ───────────────────────────────────────── */
const DIAG_AXES = [
  { axis: "Scope Creep",   actual: 88, target: 20, description: "Features added mid-sprint without trade-offs" },
  { axis: "Slow Reviews",  actual: 82, target: 25, description: "Avg 2.3 days to get PR reviewed" },
  { axis: "Missing Owner", actual: 70, target: 15, description: "3 tasks with no assigned lead" },
  { axis: "Ext. Deps",     actual: 65, target: 30, description: "Waiting on external API confirmation" },
  { axis: "Context Switch",actual: 55, target: 20, description: "4 people on 2+ projects simultaneously" },
  { axis: "Tech Debt",     actual: 38, target: 25, description: "Legacy module slowing build phase" },
];

const diagTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-neutral-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-neutral-800 max-w-[200px]">
      <div className="font-bold mb-1">{d?.axis}</div>
      <div className="text-amber-400 mb-1">Impact: {d?.actual}/100</div>
      <div className="text-neutral-300">{d?.description}</div>
    </div>
  );
};

const diagTooltipDual = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-neutral-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-neutral-800 max-w-[200px]">
      <div className="font-bold mb-1">{d?.axis}</div>
      <div className="flex gap-3">
        <span className="text-red-400">Actual: {d?.actual}</span>
        <span className="text-emerald-400">Target: {d?.target}</span>
      </div>
      <div className="text-neutral-300 mt-1">{d?.description}</div>
    </div>
  );
};

const severityColor = (s: number) =>
  s >= 75 ? { text: "text-red-700", bg: "bg-red-50", bar: "#ef4444", border: "border-red-200" }
  : s >= 55 ? { text: "text-amber-700", bg: "bg-amber-50", bar: "#f59e0b", border: "border-amber-200" }
  : { text: "text-emerald-700", bg: "bg-emerald-50", bar: "#22c55e", border: "border-emerald-200" };

/* ── Diagnostic A — Delay Factors Radar ───────────────────── */
function DiagnosticSectionA() {
  const sorted = [...DIAG_AXES].sort((a, b) => b.actual - a.actual);
  const top = sorted[0];
  return (
    <div className="bg-white border-t border-neutral-200">
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-xs font-bold text-neutral-900">Sprint Diagnostic</span>
          <span className="text-[11px] text-neutral-400">· delay factor analysis</span>
        </div>
        <div className="flex items-center gap-1.5 bg-red-50 text-red-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-red-200">
          <AlertTriangle className="w-3 h-3" />Primary: {top.axis}
        </div>
      </div>
      <div className="p-4 grid grid-cols-2 gap-4">
        {/* Radar */}
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={DIAG_AXES} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#e5e5e5" />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: "#737373" }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 11, fill: "#a3a3a3" }} tickCount={4} />
              <Radar dataKey="actual" stroke="#ef4444" fill="rgba(239,68,68,0.15)" strokeWidth={2} />
              <Tooltip content={diagTooltip} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        {/* Right panel */}
        <div className="flex flex-col justify-center space-y-2">
          {sorted.map(a => {
            const c = severityColor(a.actual);
            return (
              <div key={a.axis} className={`rounded-lg border px-3 py-2 ${c.bg} ${c.border}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11px] font-bold ${c.text}`}>{a.axis}</span>
                  <span className={`text-[11px] font-black ${c.text}`}>{a.actual}</span>
                </div>
                <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${a.actual}%`, backgroundColor: c.bar }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Diagnostic B — Target vs Actual Dual Radar ────────────── */
function DiagnosticSectionB() {
  const deltas = [...DIAG_AXES].map(a => ({ ...a, delta: a.actual - a.target }))
    .sort((a, b) => b.delta - a.delta);
  return (
    <div className="bg-white border-t border-neutral-200">
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-xs font-bold text-neutral-900">Sprint Diagnostic</span>
          <span className="text-[11px] text-neutral-400">· target vs actual</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-500 inline-block" /> Target</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block" /> Actual</span>
        </div>
      </div>
      <div className="p-4 grid grid-cols-2 gap-4">
        {/* Dual radar */}
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={DIAG_AXES} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#e5e5e5" />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: "#737373" }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 11, fill: "#a3a3a3" }} tickCount={4} />
              {/* Target — green, thin */}
              <Radar dataKey="target" stroke="#22c55e" fill="rgba(34,197,94,0.12)" strokeWidth={1.5} strokeDasharray="4 2" />
              {/* Actual — red, bold */}
              <Radar dataKey="actual" stroke="#ef4444" fill="rgba(239,68,68,0.18)" strokeWidth={2.5} />
              <Tooltip content={diagTooltipDual} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        {/* Delta breakdown — worst gap first */}
        <div className="flex flex-col justify-center">
          <div className="text-[11px] text-neutral-400 uppercase tracking-widest font-bold mb-2">Gap (Actual − Target)</div>
          <div className="space-y-1.5">
            {deltas.map(a => {
              const c = severityColor(a.actual);
              return (
                <div key={a.axis} className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-700 w-24 shrink-0 truncate">{a.axis}</span>
                  <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${a.actual}%`, backgroundColor: c.bar }} />
                  </div>
                  <span className={`text-[11px] font-bold w-8 text-right ${c.text}`}>+{a.delta}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 bg-purple-50 border border-purple-100 rounded-lg p-2.5">
            <div className="text-[11px] text-purple-600 uppercase tracking-wide font-bold mb-0.5">AI Read</div>
            <p className="text-[11px] text-purple-700 leading-relaxed">Scope creep + review bottleneck account for 58% of the gap. Address these first.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Diagnostic C — Verdict-First Layout ───────────────────── */
function DiagnosticSectionC({ sel }: { sel: string }) {
  const router = useRouter();
  const proj = PROJECTS.find(p => p.short === sel) || PROJECTS[0];
  const sorted = [...DIAG_AXES].sort((a, b) => b.actual - a.actual);
  const [primary, ...rest] = sorted;
  const pc = severityColor(primary.actual);
  return (
    <div className="bg-white rounded-lg border border-neutral-200 flex flex-col flex-1 min-h-0 cursor-pointer hover:border-neutral-300 transition-colors"
      onClick={() => router.push(`${toSlug(proj.name)}?tab=diagnostic`)}>
      <div className="px-2.5 py-1.5 flex items-center gap-1.5 shrink-0">
        <Shield className="w-3 h-3 text-orange-500" />
        <span className="text-sm font-bold text-neutral-900">Sprint Diagnostic</span>
        <span className="text-[11px] text-neutral-400">&middot; root cause</span>
      </div>
      <div className="px-2.5 pb-2 grid grid-cols-2 gap-2 flex-1 min-h-0">
        <div className="min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={DIAG_AXES} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#e5e5e5" />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: "#737373" }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 11, fill: "#a3a3a3" }} tickCount={4} />
              <Radar dataKey="actual" stroke="#f97316" fill="rgba(249,115,22,0.15)" strokeWidth={2} />
              <Tooltip content={diagTooltip} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col">
          <div className={`rounded border p-2 mb-1.5 ${pc.bg} ${pc.border}`}>
            <div className={`text-[11px] font-bold uppercase tracking-widest ${pc.text}`}>Primary Cause</div>
            <div className={`text-sm font-black ${pc.text}`}>{primary.axis}</div>
            <div className={`text-[11px] ${pc.text} opacity-80`}>{primary.description}</div>
            <div className={`text-[11px] font-black mt-1 ${pc.text}`}>{primary.actual}/100</div>
          </div>
          <div className="text-[11px] text-neutral-400 uppercase tracking-widest font-bold mb-1">Contributing</div>
          <div className="space-y-0.5 flex-1">
            {rest.slice(0, 4).map(a => {
              const c = severityColor(a.actual);
              return (
                <div key={a.axis} className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: c.bar }} />
                  <span className="text-[11px] text-neutral-700 w-20 shrink-0 truncate">{a.axis}</span>
                  <div className="flex-1 h-1 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${a.actual}%`, backgroundColor: c.bar }} />
                  </div>
                  <span className={`text-[11px] font-bold w-4 text-right ${c.text}`}>{a.actual}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-1 bg-purple-50 border border-purple-100 rounded p-1.5">
            <p className="text-[11px] text-purple-700 leading-relaxed">Scope creep + review speed = ~60% of gap.</p>
          </div>
        </div>
      </div>
    </div>
  );
}




/* ── Shared top section (KPI strip + project split panel) ── */
function TopSection({ sel, setSel }: { sel: string; setSel: (s: string) => void }) {
  const proj = PROJECTS.find(p => p.short === sel)!;
  return (
    <>
      {/* Overview strip: ring + cards + segment bar */}
      <div className="bg-white rounded-lg border border-neutral-200 p-2 flex items-center gap-2 shrink-0">
        <div className="relative w-[44px] h-[44px] shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#f5f5f5" strokeWidth="7" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#22c55e" strokeWidth="7"
              strokeDasharray={`${(TOTALS.done / TOTALS.total) * CIRC} ${CIRC}`} strokeLinecap="round" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#f59e0b" strokeWidth="7"
              strokeDasharray={`${(TOTALS.active / TOTALS.total) * CIRC} ${CIRC}`}
              strokeDashoffset={`${-(TOTALS.done / TOTALS.total) * CIRC}`} strokeLinecap="round" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#ef4444" strokeWidth="7"
              strokeDasharray={`${(TOTALS.blocked / TOTALS.total) * CIRC} ${CIRC}`}
              strokeDashoffset={`${-((TOTALS.done + TOTALS.active) / TOTALS.total) * CIRC}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] font-black text-neutral-900">{OVERALL_PCT}%</span>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <div className="bg-neutral-50 rounded px-2 py-1 text-center border border-neutral-100">
            <div className="text-xs font-black text-neutral-800">{PROJECTS.length}</div>
            <div className="text-[11px] text-neutral-400 uppercase">Proj</div>
          </div>
          <div className="bg-neutral-50 rounded px-2 py-1 text-center border border-neutral-100">
            <div className="text-xs font-black text-neutral-800">{TOTALS.total}</div>
            <div className="text-[11px] text-neutral-400 uppercase">Tasks</div>
          </div>
          <div className="bg-emerald-50 rounded px-2 py-1 text-center border border-emerald-100">
            <div className="text-xs font-black text-emerald-700">{TOTALS.done}</div>
            <div className="text-[11px] text-emerald-600 uppercase">Done</div>
          </div>
          <div className={`rounded px-2 py-1 text-center border ${NEAREST_DEADLINE <= 7 ? "bg-red-50 border-red-100" : NEAREST_DEADLINE <= 30 ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100"}`}>
            <div className={`text-xs font-black ${deadlineColor(NEAREST_DEADLINE)}`}>{NEAREST_DEADLINE}d</div>
            <div className={`text-[11px] uppercase ${deadlineColor(NEAREST_DEADLINE)}`}>Due</div>
          </div>
        </div>
        <div className="w-px self-stretch bg-neutral-100" />
        <div className="flex h-10 rounded-lg overflow-hidden gap-[2px] bg-neutral-100 flex-1">
          {PROJECTS.map(p => {
            const active = sel === p.short;
            return (
              <button key={p.short} onClick={() => setSel(p.short)}
                className="relative h-full flex items-center justify-center transition-all"
                style={{ flex: p.total, backgroundColor: active ? p.color : `${p.color}30` }}>
                <div className="flex flex-col items-center justify-center px-1">
                  <span className={`text-[11px] font-bold ${active ? "text-white" : "text-neutral-700"}`}>{p.short}</span>
                  <span className={`text-[11px] ${active ? "text-white/70" : "text-neutral-400"}`}>{p.progress}%</span>
                </div>
                {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30" />}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <ProjectDetailPanel proj={proj} />
        <StatusPanel sel={sel} />
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   VARIANT A — KPI Dashboard
   ═══════════════════════════════════════════════════════════ */
export function BottomWidgetVariantA() {
  const [sel, setSel] = useState<string>("CCv5");
  return (
    <div className="w-[50vw] h-full bg-neutral-50 flex flex-col">
      <KPIHeader />
      <div className="flex-1 flex flex-col gap-2 p-2 min-h-0">
        <TopSection sel={sel} setSel={setSel} />
        <SprintSection sel={sel} />
        <DiagnosticSectionC sel={sel} />
      </div>
    </div>
  );
}


/* ── People data per project ──────────────────────────────── */
const PEOPLE_DATA: Record<string, { name: string; role: string; avatar: string; capacity: number; done: number; active: number; blocked: number; hours: number[]; tasks: { title: string; status: string }[] }[]> = {
  CCv5: [
    { name: "Rohith", role: "Lead", avatar: "R", capacity: 40, done: 3, active: 2, blocked: 0, hours: [45, 48, 42, 44], tasks: [{ title: "Phase B — Fill/RAG", status: "active" }, { title: "Fix bento grid bug", status: "active" }, { title: "Pipeline architecture", status: "done" }, { title: "Phase A — Understand", status: "done" }, { title: "Write RAG tests", status: "todo" }] },
    { name: "Priya", role: "Frontend", avatar: "P", capacity: 40, done: 1, active: 1, blocked: 1, hours: [32, 35, 38, 30], tasks: [{ title: "Gantt chart widget", status: "active" }, { title: "Deploy staging fix", status: "blocked" }, { title: "Color palette", status: "done" }] },
    { name: "Arjun", role: "Backend", avatar: "A", capacity: 40, done: 1, active: 1, blocked: 0, hours: [28, 30, 35, 25], tasks: [{ title: "Widget Renderer PR", status: "active" }, { title: "Widget Renderer refactor", status: "done" }] },
  ],
  NRv3: [
    { name: "Rohith", role: "Lead", avatar: "R", capacity: 40, done: 1, active: 1, blocked: 0, hours: [20, 22, 18, 15], tasks: [{ title: "NL query parser", status: "active" }, { title: "Setup vLLM config", status: "done" }] },
    { name: "Priya", role: "Frontend", avatar: "P", capacity: 40, done: 1, active: 1, blocked: 0, hours: [15, 18, 20, 12], tasks: [{ title: "Chart auto-gen", status: "active" }, { title: "PDF export", status: "done" }] },
  ],
  Spot: [
    { name: "Arjun", role: "Backend", avatar: "A", capacity: 40, done: 3, active: 1, blocked: 1, hours: [35, 38, 30, 28], tasks: [{ title: "Spawn fix", status: "active" }, { title: "Memory leak", status: "blocked" }, { title: "GPU compute shaders", status: "done" }, { title: "Audio reactive", status: "done" }, { title: "WebGL renderer", status: "done" }] },
    { name: "Rohith", role: "Lead", avatar: "R", capacity: 40, done: 1, active: 0, blocked: 0, hours: [10, 8, 12, 10], tasks: [{ title: "WebGL evaluation", status: "done" }] },
  ],
};

const WEEKS = ["W14", "W15", "W16", "W17"];

const loadStatus = (avg: number, cap: number) => {
  const r = avg / cap;
  return r > 1 ? { label: "Overloaded", text: "text-red-700", bg: "bg-red-50", border: "border-red-200", bar: "bg-red-500" }
    : r > 0.85 ? { label: "Near Cap", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", bar: "bg-amber-500" }
    : r > 0.6 ? { label: "Full", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", bar: "bg-blue-500" }
    : { label: "Available", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", bar: "bg-emerald-500" };
};

const heatCellColor = (h: number, cap: number) => {
  const r = h / cap;
  if (r > 1) return "bg-red-500 text-white";
  if (r > 0.9) return "bg-orange-400 text-white";
  if (r > 0.75) return "bg-yellow-300 text-neutral-800";
  if (r > 0.5) return "bg-green-400 text-neutral-800";
  return "bg-green-200 text-neutral-700";
};

const taskStatusDot: Record<string, string> = {
  active: "bg-amber-400", done: "bg-emerald-500", blocked: "bg-red-500", todo: "bg-blue-400",
};


/* ═══════════════════════════════════════════════════════════
   PEOPLE — Heatmap + Assignments Combined
   Per-person: heatmap row (weeks) + task chips below
   ═══════════════════════════════════════════════════════════ */
export function PeopleVariantA({ project = "CCv5" }: { project?: string }) {
  const router = useRouter();
  const proj = PROJECTS.find(p => p.short === project) || PROJECTS[0];
  const people = PEOPLE_DATA[project] || PEOPLE_DATA.CCv5;

  return (
    <div className="bg-white cursor-pointer hover:bg-neutral-50/50 transition-colors"
      onClick={() => router.push(`${toSlug(proj.name)}?tab=people`)}>
      <div className="px-3 py-1.5 space-y-1.5">
        {people.map(p => {
          const avg = Math.round(p.hours.reduce((s, h) => s + h, 0) / p.hours.length);
          const ls = loadStatus(avg, p.capacity);
          const pct = Math.min(100, Math.round((avg / p.capacity) * 100));
          const activeTasks = p.tasks.filter(t => t.status === "active");
          const blockedTasks = p.tasks.filter(t => t.status === "blocked");
          const doneTasks = p.tasks.filter(t => t.status === "done");
          const todoTasks = p.tasks.filter(t => t.status === "todo");
          return (
            <div key={p.name} className="rounded-lg border border-neutral-200 overflow-hidden">
              <div className="px-2.5 py-1.5 flex items-center gap-1.5 bg-neutral-50/50">
                <div className="w-6 h-6 rounded-full bg-neutral-900 flex items-center justify-center text-[11px] font-bold text-white shrink-0">{p.avatar}</div>
                <div className="w-14 shrink-0">
                  <div className="text-xs font-bold text-neutral-900 leading-none">{p.name}</div>
                  <div className="text-[11px] text-neutral-400">{p.role}</div>
                </div>
                <div className="w-12 shrink-0">
                  <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${ls.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-[11px] text-center font-bold text-neutral-500">{pct}%</div>
                </div>
                <span className={`text-[11px] font-bold px-1 py-0.5 rounded-full border shrink-0 ${ls.bg} ${ls.text} ${ls.border}`}>{ls.label}</span>
                <div className="w-px h-4 bg-neutral-200 shrink-0" />
                <div className="flex gap-0.5 flex-1">
                  {p.hours.map((h, i) => (
                    <div key={i} className={`flex-1 h-5 rounded flex items-center justify-center text-[11px] font-bold ${heatCellColor(h, p.capacity)}`}>
                      {h}
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-2.5 py-1 flex flex-wrap gap-0.5 border-t border-neutral-100">
                {[...blockedTasks, ...activeTasks, ...todoTasks, ...doneTasks].map((t, i) => (
                  <div key={i} className="flex items-center gap-0.5 bg-neutral-50 rounded px-1.5 py-0.5 border border-neutral-100">
                    <div className={`w-1 h-1 rounded-full shrink-0 ${taskStatusDot[t.status] || "bg-neutral-300"}`} />
                    <span className={`text-xs ${t.status === "done" ? "text-neutral-400 line-through" : t.status === "blocked" ? "text-red-700 font-medium" : "text-neutral-700"}`}>{t.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* ── Task list data ───────────────────────────────────────── */
const TASK_LIST = [
  { id: "t1", title: "Phase B — Fill/RAG", status: "active", priority: "high", assignee: "Rohith", due: "Apr 25" },
  { id: "t2", title: "Fix bento grid overflow bug", status: "active", priority: "urgent", assignee: "Rohith", due: "Apr 11" },
  { id: "t3", title: "Phase C — Grid Pack", status: "blocked", priority: "high", assignee: "", due: "May 10" },
  { id: "t4", title: "Widget renderer PR merge", status: "active", priority: "urgent", assignee: "Arjun", due: "Apr 11" },
  { id: "t5", title: "Write RAG integration tests", status: "todo", priority: "medium", assignee: "Rohith", due: "Apr 22" },
  { id: "t6", title: "Deploy pipeline fix on staging", status: "blocked", priority: "high", assignee: "Priya", due: "Apr 13" },
  { id: "t7", title: "Write unit tests for Phase B", status: "todo", priority: "medium", assignee: "", due: "Apr 22" },
  { id: "t8", title: "Widget Renderer refactor", status: "done", priority: "high", assignee: "Arjun", due: "Apr 16" },
  { id: "t9", title: "Design pipeline architecture", status: "done", priority: "high", assignee: "Rohith", due: "Apr 10" },
  { id: "t10", title: "Phase A — Understand", status: "done", priority: "high", assignee: "Rohith", due: "Apr 15" },
];

const TASK_STATUS: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  active: { label: "Active", dot: "bg-amber-400", bg: "bg-amber-50", text: "text-amber-700" },
  blocked: { label: "Blocked", dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700" },
  todo: { label: "To Do", dot: "bg-blue-400", bg: "bg-blue-50", text: "text-blue-700" },
  done: { label: "Done", dot: "bg-emerald-500", bg: "bg-green-50", text: "text-green-700" },
};

const TASK_PROJ = { name: "Command Center v5", short: "CCv5", color: "#3b82f6", progress: 30, done: 3, total: 10, active: 3, blocked: 2, todo: 2, daysLeft: 95 };


/* ═══════════════════════════════════════════════════════════
   TASK WIDGET A — Inline header + filters + list
   Project info as a compact inline header row at top,
   status filter pills below, then task list.
   ═══════════════════════════════════════════════════════════ */
export function TaskWidgetVariantA() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? TASK_LIST : TASK_LIST.filter(t => t.status === filter);
  const counts = { all: TASK_LIST.length, active: TASK_LIST.filter(t => t.status === "active").length, blocked: TASK_LIST.filter(t => t.status === "blocked").length, todo: TASK_LIST.filter(t => t.status === "todo").length, done: TASK_LIST.filter(t => t.status === "done").length };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 flex flex-col overflow-hidden" style={{ maxHeight: 500 }}>
      {/* Inline project header */}
      <div className="px-3 py-2.5 border-b border-neutral-100 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: TASK_PROJ.color }} />
        <span className="text-sm font-bold text-neutral-900">{TASK_PROJ.name}</span>
        <div className="flex-1" />
        <div className="w-24 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${TASK_PROJ.progress}%`, backgroundColor: TASK_PROJ.color }} />
        </div>
        <span className="text-[11px] font-bold text-neutral-600">{TASK_PROJ.done}/{TASK_PROJ.total}</span>
        <span className="text-[11px] text-neutral-400">{TASK_PROJ.daysLeft}d</span>
      </div>

      {/* Filter pills */}
      <div className="px-3 py-2 border-b border-neutral-100 flex gap-1.5 shrink-0">
        {(["all", "active", "blocked", "todo", "done"] as const).map(f => {
          const meta = f === "all" ? null : TASK_STATUS[f];
          const count = counts[f];
          return (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                filter === f ? "bg-neutral-900 text-white" : meta ? `${meta.bg} ${meta.text}` : "bg-neutral-100 text-neutral-600"
              }`}>
              {count} {meta?.label ?? "All"}
            </button>
          );
        })}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-50">
        {filtered.map(t => {
          const s = TASK_STATUS[t.status];
          return (
            <div key={t.id} className="px-3 py-2.5 hover:bg-neutral-50 transition-colors">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full shrink-0 ${s?.dot}`} />
                <span className="text-xs font-medium text-neutral-800 truncate flex-1">{t.title}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${s?.bg} ${s?.text}`}>{s?.label}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 ml-4 text-[11px] text-neutral-400">
                <span>{t.assignee || "Unassigned"}</span>
                <span>&middot;</span>
                <span>{t.due}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   TASK WIDGET B — Stats strip header + list
   Project name + progress ring + stat badges in a row,
   task list below. No separate filter — status badges
   act as filters.
   ═══════════════════════════════════════════════════════════ */
export function TaskWidgetVariantB() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? TASK_LIST : TASK_LIST.filter(t => t.status === filter);
  const counts = { all: TASK_LIST.length, active: TASK_LIST.filter(t => t.status === "active").length, blocked: TASK_LIST.filter(t => t.status === "blocked").length, todo: TASK_LIST.filter(t => t.status === "todo").length, done: TASK_LIST.filter(t => t.status === "done").length };
  const miniCirc = 2 * Math.PI * 14;

  return (
    <div className="bg-white rounded-lg border border-neutral-200 flex flex-col overflow-hidden" style={{ maxHeight: 500 }}>
      {/* Header: ring + name + stat badges */}
      <div className="px-3 py-2.5 border-b border-neutral-100">
        <div className="flex items-center gap-2.5 mb-2">
          {/* Mini ring */}
          <div className="relative w-9 h-9 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#f0f0f0" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="14" fill="none" stroke={TASK_PROJ.color} strokeWidth="2.5"
                strokeDasharray={`${(TASK_PROJ.progress / 100) * miniCirc} ${miniCirc}`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[9px] font-black text-neutral-700">{TASK_PROJ.progress}%</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-neutral-900 truncate">{TASK_PROJ.name}</div>
            <div className="text-[11px] text-neutral-400">{TASK_PROJ.done}/{TASK_PROJ.total} tasks &middot; {TASK_PROJ.daysLeft}d left</div>
          </div>
        </div>
        {/* Stat badges — clickable as filters */}
        <div className="flex gap-1.5">
          {(["all", "active", "blocked", "todo", "done"] as const).map(f => {
            const meta = f === "all" ? null : TASK_STATUS[f];
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === f ? "bg-neutral-900 text-white" : meta ? `${meta.bg} ${meta.text}` : "bg-neutral-100 text-neutral-600"
                }`}>
                <div className="text-sm font-black">{counts[f]}</div>
                <div className="text-[10px] font-medium">{meta?.label ?? "All"}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-50">
        {filtered.map(t => {
          const s = TASK_STATUS[t.status];
          return (
            <div key={t.id} className="px-3 py-2.5 hover:bg-neutral-50 transition-colors flex items-center gap-2">
              <div className={`w-2 h-8 rounded-full shrink-0 ${s?.dot}`} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-neutral-800 truncate">{t.title}</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">{t.assignee || "Unassigned"} &middot; {t.due}</div>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg shrink-0 ${s?.bg} ${s?.text}`}>{s?.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   TASK WIDGET C — Segmented progress header + compact list
   A segmented progress bar (done/active/blocked/todo) as
   the header with project info. Click segments to filter.
   Compact task rows below.
   ═══════════════════════════════════════════════════════════ */
export function TaskWidgetVariantC() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? TASK_LIST : TASK_LIST.filter(t => t.status === filter);
  const counts = { active: TASK_LIST.filter(t => t.status === "active").length, blocked: TASK_LIST.filter(t => t.status === "blocked").length, todo: TASK_LIST.filter(t => t.status === "todo").length, done: TASK_LIST.filter(t => t.status === "done").length };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 flex flex-col overflow-hidden" style={{ maxHeight: 500 }}>
      {/* Header: name + days left */}
      <div className="px-3 py-2.5 border-b border-neutral-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TASK_PROJ.color }} />
            <span className="text-sm font-bold text-neutral-900">{TASK_PROJ.name}</span>
          </div>
          <span className="text-[11px] text-neutral-400">{TASK_PROJ.progress}% &middot; {TASK_PROJ.daysLeft}d left</span>
        </div>

        {/* Segmented progress bar — clickable */}
        <div className="flex h-6 rounded-lg overflow-hidden gap-px mb-1.5">
          {([
            { key: "done", count: counts.done, color: "#22c55e", label: "Done" },
            { key: "active", count: counts.active, color: "#f59e0b", label: "Active" },
            { key: "blocked", count: counts.blocked, color: "#ef4444", label: "Blocked" },
            { key: "todo", count: counts.todo, color: "#3b82f6", label: "To Do" },
          ] as const).map(seg => (
            <button key={seg.key} onClick={() => setFilter(filter === seg.key ? "all" : seg.key)}
              className="h-full flex items-center justify-center transition-all"
              style={{
                flex: seg.count || 0.3,
                backgroundColor: filter === seg.key || filter === "all" ? seg.color : `${seg.color}30`,
                opacity: filter === "all" || filter === seg.key ? 1 : 0.4,
              }}>
              <span className={`text-[10px] font-bold ${filter === seg.key || filter === "all" ? "text-white" : "text-neutral-600"}`}>
                {seg.count} {seg.label}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between text-[11px] text-neutral-400">
          <span>{TASK_PROJ.done}/{TASK_PROJ.total} done</span>
          <button onClick={() => setFilter("all")} className={`text-[11px] font-medium ${filter !== "all" ? "text-blue-500 hover:underline" : "text-neutral-300"}`}>
            {filter !== "all" ? "Clear filter" : ""}
          </button>
        </div>
      </div>

      {/* Compact task list */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-50">
        {filtered.map(t => {
          const s = TASK_STATUS[t.status];
          return (
            <div key={t.id} className="px-3 py-2 hover:bg-neutral-50 transition-colors flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${s?.dot}`} />
              <span className="text-xs text-neutral-800 truncate flex-1">{t.title}</span>
              <span className="text-[11px] text-neutral-400 shrink-0">{t.assignee || "—"}</span>
              <span className="text-[11px] text-neutral-300 shrink-0">{t.due}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   GANTT CHART VARIANTS (A / B / C) — Primavera-style
   ══════════════════════════════════════════════════════════════ */

interface GanttTask {
  id: string;
  title: string;
  assignee: string;
  start: number;
  duration: number;
  status: "done" | "active" | "blocked" | "todo";
  phase: string;
  deps: string[];
  subtasks: number;
}

const GANTT_TASKS: GanttTask[] = [
  { id: "g1", title: "Design pipeline architecture", assignee: "Rohith", start: 0, duration: 10, status: "done", phase: "Research", deps: [], subtasks: 2 },
  { id: "g2", title: "Phase A — Understand", assignee: "Rohith", start: 5, duration: 10, status: "done", phase: "Research", deps: ["g1"], subtasks: 0 },
  { id: "g3", title: "Phase B — Fill/RAG", assignee: "Rohith", start: 10, duration: 15, status: "active", phase: "Build", deps: ["g2"], subtasks: 3 },
  { id: "g4", title: "Gantt chart widget", assignee: "Priya", start: 12, duration: 8, status: "active", phase: "Build", deps: [], subtasks: 1 },
  { id: "g5", title: "Widget Renderer refactor", assignee: "Arjun", start: 8, duration: 8, status: "done", phase: "Build", deps: [], subtasks: 0 },
  { id: "g6", title: "Phase C — Grid Pack", assignee: "", start: 26, duration: 15, status: "blocked", phase: "Build", deps: ["g3"], subtasks: 2 },
  { id: "g7", title: "Deploy pipeline fix", assignee: "Priya", start: 11, duration: 3, status: "blocked", phase: "Ship", deps: [], subtasks: 0 },
  { id: "g8", title: "Write RAG tests", assignee: "Rohith", start: 18, duration: 4, status: "todo", phase: "Test", deps: [], subtasks: 0 },
  { id: "g9", title: "E2E testing", assignee: "", start: 41, duration: 10, status: "todo", phase: "Test", deps: ["g6"], subtasks: 4 },
  { id: "g10", title: "Production deploy", assignee: "", start: 51, duration: 5, status: "todo", phase: "Ship", deps: ["g9"], subtasks: 0 },
];

const GANTT_TOTAL_DAYS = 60;
const GANTT_TODAY = 11;
const GANTT_ROW_H = 32;
const GANTT_START_DATE = new Date(2026, 3, 1); // Apr 1, 2026

const GANTT_STATUS_COLORS: Record<string, { bar: string; badge: string; badgeText: string; dot: string }> = {
  done:    { bar: "bg-emerald-500", badge: "bg-emerald-50", badgeText: "text-emerald-700", dot: "bg-emerald-500" },
  active:  { bar: "bg-amber-500",   badge: "bg-amber-50",   badgeText: "text-amber-700",   dot: "bg-amber-500" },
  blocked: { bar: "bg-red-500",     badge: "bg-red-50",     badgeText: "text-red-700",     dot: "bg-red-500" },
  todo:    { bar: "bg-blue-400",    badge: "bg-blue-50",    badgeText: "text-blue-700",    dot: "bg-blue-400" },
};

const CRITICAL_PATH = ["g1", "g2", "g3", "g6", "g9", "g10"];

function ganttWeekLabels(): { label: string; day: number }[] {
  const labels: { label: string; day: number }[] = [];
  for (let d = 0; d < GANTT_TOTAL_DAYS; d += 7) {
    const dt = new Date(GANTT_START_DATE);
    dt.setDate(dt.getDate() + d);
    labels.push({ label: `${dt.toLocaleString("en-US", { month: "short" })} ${dt.getDate()}`, day: d });
  }
  return labels;
}

const GANTT_WEEKS = ganttWeekLabels();

function GanttDependencyArrows({ tasks, rowIndex, dayPx }: { tasks: GanttTask[]; rowIndex: Record<string, number>; dayPx: number }) {
  const taskMap = Object.fromEntries(tasks.map(t => [t.id, t]));
  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ width: GANTT_TOTAL_DAYS * dayPx, height: Object.keys(rowIndex).length * GANTT_ROW_H }}>
      {tasks.flatMap(t =>
        t.deps.map(depId => {
          const dep = taskMap[depId];
          if (!dep || rowIndex[depId] === undefined || rowIndex[t.id] === undefined) return null;
          const fromX = (dep.start + dep.duration) * dayPx;
          const fromY = rowIndex[depId] * GANTT_ROW_H + GANTT_ROW_H / 2;
          const toX = t.start * dayPx;
          const toY = rowIndex[t.id] * GANTT_ROW_H + GANTT_ROW_H / 2;
          const isCrit = CRITICAL_PATH.includes(depId) && CRITICAL_PATH.includes(t.id);
          return (
            <g key={`${depId}-${t.id}`}>
              <path
                d={`M${fromX},${fromY} L${fromX + 6},${fromY} L${fromX + 6},${toY} L${toX},${toY}`}
                fill="none"
                stroke={isCrit ? "#ef4444" : "#94a3b8"}
                strokeWidth={isCrit ? 1.5 : 1}
                strokeDasharray={isCrit ? "" : "3 2"}
              />
              <polygon
                points={`${toX},${toY} ${toX - 4},${toY - 3} ${toX - 4},${toY + 3}`}
                fill={isCrit ? "#ef4444" : "#94a3b8"}
              />
            </g>
          );
        })
      )}
    </svg>
  );
}


/* ═══════════════════════════════════════════════════════════
   GANTT — Unified with toggleable columns + group-by
   Classic split: table left, chart right.
   Columns toggleable. Group by: None / Phase / Person.
   ═══════════════════════════════════════════════════════════ */

type GanttColumn = "assignee" | "start" | "duration" | "status" | "phase" | "subtasks";
const GANTT_COLUMN_DEFS: { key: GanttColumn; label: string; w: string }[] = [
  { key: "assignee", label: "Assignee", w: "w-20" },
  { key: "start", label: "Start", w: "w-12" },
  { key: "duration", label: "Dur", w: "w-10" },
  { key: "status", label: "Status", w: "w-16" },
  { key: "phase", label: "Phase", w: "w-16" },
  { key: "subtasks", label: "Sub", w: "w-8" },
];

const GANTT_PHASES_LIST = ["Research", "Build", "Test", "Ship"];
const GANTT_PEOPLE = ["Rohith", "Priya", "Arjun", "Unassigned"];

function ganttDayLabel(day: number) {
  const dt = new Date(GANTT_START_DATE);
  dt.setDate(dt.getDate() + day);
  return `${dt.toLocaleString("en-US", { month: "short" })} ${dt.getDate()}`;
}

/* GanttChart — shared row model with sidebar.
   Accepts a `rows` array of { type: "header"|"task", ... }.
   Both sidebar and Gantt iterate this same array.
   The sidebar renders it as list items, the Gantt renders bars.
   Group-by toggle lives here and emits the grouped rows via onRowsChange. */

export type GanttRow = { type: "header"; label: string } | { type: "task"; task: { id: string; title: string; start: number; duration: number; status: string; deps: string[]; phase?: string; assignee?: string; statusLabel?: string; [key: string]: any } };
type GanttGroupBy = "none" | "phase" | "person";

const GANTT_HEADER_H = 24;
const GANTT_PHASES_ORDER = ["Research", "Build", "Test", "Ship"];
const GANTT_PEOPLE_ORDER = ["Rohith", "Priya", "Arjun", "Unassigned"];

function buildGanttRows(tasks: any[], groupBy: GanttGroupBy): GanttRow[] {
  const rows: GanttRow[] = [];
  if (groupBy === "none") {
    (tasks as any[]).forEach((t: any) => rows.push({ type: "task", task: t }));
  } else if (groupBy === "phase") {
    GANTT_PHASES_ORDER.forEach(phase => {
      const phTasks = (tasks as any[]).filter((t: any) => (t.phase || "Build") === phase);
      if (phTasks.length > 0) {
        rows.push({ type: "header", label: phase });
        phTasks.forEach((t: any) => rows.push({ type: "task", task: t }));
      }
    });
  } else {
    GANTT_PEOPLE_ORDER.forEach(person => {
      const pTasks = (tasks as any[]).filter((t: any) => (t.assignee || "Unassigned") === person);
      if (pTasks.length > 0) {
        rows.push({ type: "header", label: person });
        pTasks.forEach((t: any) => rows.push({ type: "task", task: t }));
      }
    });
  }
  return rows;
}

/* GanttEditView — integrated sidebar + gantt in one component.
   Left: task list. Right: Gantt bars. Both in the same scroll container.
   No separate scroll sync needed — they scroll together naturally. */
export function GanttEditView({ tasks, allTasks, selected, onSelect, onDone, onTaskUpdate, onTaskAdd }: {
  tasks: { id: string; title: string; start: number; duration: number; status: string; deps: string[]; phase?: string; assignee?: string; statusLabel?: string; [key: string]: any }[];
  allTasks?: any[];
  selected?: string | null;
  onSelect?: (id: string | null) => void;
  onDone?: () => void;
  onTaskUpdate?: (id: string, field: string, value: any) => void;
  onTaskAdd?: () => void;
}) {
  const [groupBy, setGroupBy] = useState<GanttGroupBy>("none");
  const [editField, setEditField] = useState<{ id: string; field: string } | null>(null);
  const [showColMenu, setShowColMenu] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(() => new Set(["assignee", "status"]));
  const toggleCol = (col: string) => setVisibleCols(prev => { const n = new Set(prev); n.has(col) ? n.delete(col) : n.add(col); return n; });
  const [dragging, setDragging] = React.useState<{ id: string; mode: "move" | "resize"; startX: number; origStart: number; origDur: number } | null>(null);
  const [visibleDays, setVisibleDays] = useState(GANTT_TOTAL_DAYS);
  const chartRef = React.useRef<HTMLDivElement>(null);
  const [chartContainerW, setChartContainerW] = useState(600);
  const RH = 40;

  // Measure chart container width for responsive dayPx
  React.useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const measure = () => setChartContainerW(el.clientWidth);
    measure();
    const obs = new ResizeObserver(() => measure());
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const sidebarW = 200 + visibleCols.size * 60;
  const availableChartW = Math.max(200, chartContainerW - sidebarW);
  const dayPx = Math.max(4, availableChartW / visibleDays);
  const chartW = GANTT_TOTAL_DAYS * dayPx;

  // Dynamic week labels based on zoom level
  const weekInterval = visibleDays <= 14 ? 2 : visibleDays <= 30 ? 7 : 7;
  const dynamicWeeks = React.useMemo(() => {
    const labels: { label: string; day: number }[] = [];
    for (let d = 0; d < GANTT_TOTAL_DAYS; d += weekInterval) {
      const dt = new Date(GANTT_START_DATE);
      dt.setDate(dt.getDate() + d);
      labels.push({ label: `${dt.toLocaleString("en-US", { month: "short" })} ${dt.getDate()}`, day: d });
    }
    return labels;
  }, [weekInterval]);

  const rows = React.useMemo(() => buildGanttRows(tasks, groupBy), [tasks, groupBy]);

  const rowIndex: Record<string, number> = {};
  rows.forEach((r, i) => { if (r.type === "task") rowIndex[r.task.id] = i; });
  const taskItems = rows.filter(r => r.type === "task").map(r => (r as any).task);
  const taskMap = Object.fromEntries(taskItems.map((t: any) => [t.id, t]));
  const selTask = selected ? taskItems.find((t: any) => t.id === selected) : null;

  // Compute violated dependencies (Finish-to-Start: task starts before dep finishes)
  const violatedDeps = React.useMemo(() => {
    const violations = new Set<string>();
    taskItems.forEach((t: any) => {
      (t.deps || []).forEach((depId: string) => {
        const dep = taskMap[depId];
        if (dep && t.start < dep.start + dep.duration) {
          violations.add(`${depId}->${t.id}`);
        }
      });
    });
    return violations;
  }, [taskItems, taskMap]);

  // Tasks with conflicts (for highlighting bars)
  const conflictTasks = React.useMemo(() => {
    const ids = new Set<string>();
    violatedDeps.forEach(v => { const [, to] = v.split("->"); ids.add(to); });
    return ids;
  }, [violatedDeps]);

  const handleFieldEdit = (id: string, field: string, value: any) => {
    if (onTaskUpdate) onTaskUpdate(id, field, value);
    setEditField(null);
  };

  const handleDragStart = (e: React.MouseEvent, id: string, mode: "move" | "resize") => {
    e.stopPropagation();
    const task = taskItems.find((t: any) => t.id === id);
    if (!task) return;
    setDragging({ id, mode, startX: e.clientX, origStart: task.start, origDur: task.duration });
  };

  React.useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      const dx = Math.round((e.clientX - dragging.startX) / dayPx);
      if (dragging.mode === "move") {
        const newStart = Math.max(0, dragging.origStart + dx);
        if (onTaskUpdate) onTaskUpdate(dragging.id, "start", newStart);
      } else {
        const newDur = Math.max(1, dragging.origDur + dx);
        if (onTaskUpdate) onTaskUpdate(dragging.id, "duration", newDur);
      }
    };
    const handleUp = () => setDragging(null);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
  }, [dragging, dayPx, onTaskUpdate]);

  const handleDelete = (id: string) => {
    if (onTaskUpdate) onTaskUpdate(id, "_delete", true);
    if (selected === id && onSelect) onSelect(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white rounded-lg border border-neutral-200">
      {/* Toolbar */}
      <div className="px-3 py-1.5 border-b border-neutral-100 flex items-center gap-2 shrink-0">
        <span className="text-sm font-bold text-neutral-900">Edit Plan</span>
        <span className="text-[11px] text-neutral-400">{taskItems.length} tasks</span>
        <div className="flex-1" />
        {/* Zoom / visible days */}
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-neutral-400">View:</span>
          {([
            { days: 14, label: "2W" },
            { days: 30, label: "1M" },
            { days: 60, label: "All" },
          ] as const).map(z => (
            <button key={z.days} onClick={() => setVisibleDays(z.days)}
              className={`px-2 py-0.5 rounded transition-all ${visibleDays === z.days ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100"}`}>
              {z.label}
            </button>
          ))}
        </div>
        <div className="w-px h-4 bg-neutral-200" />
        {/* Group by */}
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-neutral-400">Group:</span>
          {(["none", "phase", "person"] as const).map(g => (
            <button key={g} onClick={() => setGroupBy(g)}
              className={`px-2 py-0.5 rounded transition-all ${groupBy === g ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100"}`}>
              {g === "none" ? "None" : g === "phase" ? "Phase" : "Person"}
            </button>
          ))}
        </div>
        <div className="w-px h-4 bg-neutral-200" />
        {onTaskAdd && (
          <button onClick={onTaskAdd} className="text-xs font-medium px-3 py-1 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors">+ Add Task</button>
        )}
        {onDone && (
          <button onClick={onDone} className="text-xs font-medium px-3 py-1 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors">Done</button>
        )}
      </div>

      {/* Single scroll container: sidebar + chart side by side */}
      <div className="flex-1 overflow-auto min-h-0" ref={chartRef}>
        <div className="flex" style={{ minWidth: sidebarW + chartW }}>

          {/* Left: task list column (sticky horizontally) */}
          <div className="shrink-0 sticky left-0 z-20 bg-white border-r border-neutral-200" style={{ width: sidebarW }}>
            {/* Header row with column toggle */}
            <div className="h-6 border-b border-neutral-100 bg-neutral-50 px-3 flex items-center">
              <span className="text-[11px] font-bold text-neutral-400 uppercase flex-1">Tasks</span>
              {visibleCols.has("assignee") && <span className="text-[11px] font-bold text-neutral-400 uppercase w-[56px] text-center shrink-0">Assign</span>}
              {visibleCols.has("duration") && <span className="text-[11px] font-bold text-neutral-400 uppercase w-[40px] text-center shrink-0">Dur</span>}
              {visibleCols.has("phase") && <span className="text-[11px] font-bold text-neutral-400 uppercase w-[50px] text-center shrink-0">Phase</span>}
              {visibleCols.has("status") && <span className="text-[11px] font-bold text-neutral-400 uppercase w-[52px] text-center shrink-0">Status</span>}
              <div className="relative ml-1">
                <button onClick={() => setShowColMenu(!showColMenu)} className="text-[11px] text-neutral-400 hover:text-neutral-700 px-1">
                  &#9776;
                </button>
                {showColMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg border border-neutral-200 shadow-lg z-30 p-2 w-32">
                    {[
                      { key: "assignee", label: "Assignee" },
                      { key: "duration", label: "Duration" },
                      { key: "phase", label: "Phase" },
                      { key: "status", label: "Status" },
                    ].map(col => (
                      <label key={col.key} className="flex items-center gap-2 py-1 cursor-pointer">
                        <input type="checkbox" checked={visibleCols.has(col.key)} onChange={() => toggleCol(col.key)}
                          className="w-3 h-3 rounded border-neutral-300" />
                        <span className="text-[11px] text-neutral-700">{col.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Rows — same order as Gantt */}
            {rows.map((row, i) => {
              if (row.type === "header") {
                return (
                  <div key={`sh-${row.label}-${i}`} className="flex items-center px-3 bg-neutral-50 border-b border-neutral-100"
                    style={{ height: RH }}>
                    <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">{row.label}</span>
                  </div>
                );
              }
              const t = row.task;
              const sc = GANTT_STATUS_COLORS[t.status] || GANTT_STATUS_COLORS.todo;
              const isSel = selected === t.id;
              const isConflict = conflictTasks.has(t.id);
              return (
                <div key={t.id}
                  onClick={() => onSelect?.(isSel ? null : t.id)}
                  className={`group/row flex items-center gap-2 px-3 border-b cursor-pointer transition-colors ${isConflict ? "border-red-200 bg-red-50/30" : "border-neutral-100"} ${isSel ? "bg-blue-50 border-l-2 border-l-blue-500" : "hover:bg-neutral-50 border-l-2 border-l-transparent"}`}
                  style={{ height: RH }}>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isConflict ? "bg-red-500" : sc.dot}`} />
                  <span className="text-xs text-neutral-800 truncate flex-1">{t.title}</span>
                  {visibleCols.has("assignee") && <span className="text-[11px] text-neutral-500 w-[56px] text-center truncate shrink-0">{t.assignee || "—"}</span>}
                  {visibleCols.has("duration") && <span className="text-[11px] text-neutral-400 w-[40px] text-center shrink-0">{t.duration}d</span>}
                  {visibleCols.has("phase") && <span className="text-[11px] text-neutral-400 w-[50px] text-center shrink-0">{t.phase || "—"}</span>}
                  {visibleCols.has("status") && <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded w-[52px] text-center shrink-0 ${sc.badge} ${sc.badgeText}`}>{t.statusLabel || t.status}</span>}
                  {/* Delete button — visible on hover */}
                  <button onClick={e => { e.stopPropagation(); handleDelete(t.id); }}
                    className="w-4 h-4 rounded flex items-center justify-center text-neutral-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover/row:opacity-100 transition-all shrink-0"
                    title="Delete task">
                    <span className="text-xs leading-none">&times;</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right: Gantt chart column — responsive: min-height fills rows, stretches to container */}
          <div className="relative" style={{ width: chartW, minHeight: rows.length * RH + 24, height: "100%" }}>
            {/* Week headers */}
            <div className="sticky top-0 bg-white z-10 border-b border-neutral-100 flex" style={{ height: 24 }}>
              {dynamicWeeks.map(w => (
                <div key={w.day} className="text-[11px] text-neutral-400 px-1 flex items-center absolute" style={{ left: w.day * dayPx }}>
                  {w.label}
                </div>
              ))}
            </div>

            {/* Task area — positioned after week header */}
            <div className="absolute" style={{ top: 24, width: chartW, height: rows.length * RH }}>
              {/* Grid lines */}
              {dynamicWeeks.map(w => (
                <div key={w.day} className="absolute top-0 bottom-0 border-l border-neutral-50" style={{ left: w.day * dayPx }} />
              ))}

              {/* Today marker — faded column */}
              <div className="absolute top-0 bottom-0 z-[5]" style={{ left: GANTT_TODAY * dayPx - dayPx / 2, width: dayPx }}>
                <div className="absolute inset-0 bg-red-500/[0.06]" />
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-red-400/40" />
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-b">Today</div>
              </div>

              {/* Dependency arrows — red when violated, red dashed for critical, gray dashed for normal */}
              <svg className="absolute inset-0 pointer-events-none" style={{ width: chartW, height: rows.length * RH }}>
                {taskItems.flatMap((t: any) =>
                  (t.deps || []).map((depId: string) => {
                    const dep = taskMap[depId];
                    if (!dep || rowIndex[depId] === undefined || rowIndex[t.id] === undefined) return null;
                    const fromX = (dep.start + dep.duration) * dayPx;
                    const fromY = rowIndex[depId] * RH + RH / 2;
                    const toX = t.start * dayPx;
                    const toY = rowIndex[t.id] * RH + RH / 2;
                    const isViolated = violatedDeps.has(`${depId}->${t.id}`);
                    const isCrit = CRITICAL_PATH.includes(depId) && CRITICAL_PATH.includes(t.id);
                    const color = isViolated ? "#ef4444" : isCrit ? "#f97316" : "#94a3b8";
                    const width = isViolated ? 2 : isCrit ? 1.5 : 1;
                    const dash = isViolated ? "" : isCrit ? "" : "3 2";
                    return (
                      <g key={`${depId}-${t.id}`}>
                        <path d={`M${fromX},${fromY} L${fromX + 6},${fromY} L${fromX + 6},${toY} L${toX},${toY}`}
                          fill="none" stroke={color} strokeWidth={width} strokeDasharray={dash} />
                        <polygon points={`${toX},${toY} ${toX - 4},${toY - 3} ${toX - 4},${toY + 3}`} fill={color} />
                        {/* Violation indicator */}
                        {isViolated && (
                          <circle cx={toX} cy={toY} r={4} fill="#ef4444" stroke="white" strokeWidth={1.5} />
                        )}
                      </g>
                    );
                  })
                )}
              </svg>

              {/* Rows — headers get stripe, tasks get bars */}
              {rows.map((row, i) => {
                if (row.type === "header") {
                  return (
                    <div key={`gh-${row.label}-${i}`} className="absolute left-0 right-0 bg-neutral-50/50 border-b border-neutral-100"
                      style={{ top: i * RH, height: RH }} />
                  );
                }
                const t = row.task;
                const sc = GANTT_STATUS_COLORS[t.status] || GANTT_STATUS_COLORS.todo;
                const isCrit = CRITICAL_PATH.includes(t.id);
                const isSel = selected === t.id;
                const isConflict = conflictTasks.has(t.id);
                const barW = Math.max(t.duration * dayPx - 2, 20);
                return (
                  <div key={t.id}
                    onClick={() => onSelect?.(isSel ? null : t.id)}
                    onMouseDown={e => handleDragStart(e, t.id, "move")}
                    className={`absolute flex items-center rounded cursor-grab active:cursor-grabbing transition-all ${sc.bar} ${isSel ? "ring-2 ring-blue-400 ring-offset-1 z-10" : isConflict ? "ring-2 ring-red-400 ring-offset-1" : "hover:opacity-80"} ${isCrit ? "shadow-sm" : ""} ${dragging?.id === t.id ? "opacity-70" : ""}`}
                    style={{
                      left: t.start * dayPx,
                      top: i * RH + 6,
                      width: barW,
                      height: RH - 12,
                    }}>
                    <span className="text-[10px] font-medium text-white truncate px-1.5 flex-1 select-none">{t.title}</span>
                    {/* Resize handle — right edge */}
                    <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-r"
                      onMouseDown={e => { e.stopPropagation(); handleDragStart(e, t.id, "resize"); }} />
                  </div>
                );
              })}

              {/* Row lines */}
              {rows.map((_, i) => (
                <div key={`line-${i}`} className="absolute left-0 right-0 border-b border-neutral-50" style={{ top: (i + 1) * RH }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Editable detail panel — shows below when a task is selected */}
      {selTask && (() => {
        const sc = GANTT_STATUS_COLORS[selTask.status] || GANTT_STATUS_COLORS.todo;
        const depTasks = (selTask.deps || []).map((d: string) => taskItems.find((x: any) => x.id === d)).filter(Boolean);
        const blockedBy = taskItems.filter((t: any) => (t.deps || []).includes(selTask.id));
        const ef = editField;
        const isEditing = (field: string) => ef?.id === selTask.id && ef?.field === field;

        // Compute real dates from GANTT_START_DATE + day offset
        const startDate = new Date(GANTT_START_DATE);
        startDate.setDate(startDate.getDate() + selTask.start);
        const endDate = new Date(GANTT_START_DATE);
        endDate.setDate(endDate.getDate() + selTask.start + selTask.duration);
        const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const fmtShort = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const isOverdue = selTask.start + selTask.duration < GANTT_TODAY && selTask.status !== "done";
        const daysFromToday = selTask.start - GANTT_TODAY;
        const isConflict = conflictTasks.has(selTask.id);

        const EditableField = ({ field, value, label, type = "text", suffix }: { field: string; value: string; label: string; type?: string; suffix?: string }) => (
          <div>
            <span className="text-[11px] text-neutral-400 block mb-0.5">{label}</span>
            {isEditing(field) ? (
              type === "select-status" ? (
                <select autoFocus className="text-xs border border-blue-300 rounded px-1.5 py-1 w-full outline-none bg-white"
                  defaultValue={value} onBlur={e => handleFieldEdit(selTask.id, field, e.target.value)}
                  onChange={e => handleFieldEdit(selTask.id, field, e.target.value)}>
                  <option value="todo">To Do</option><option value="active">Active</option>
                  <option value="blocked">Blocked</option><option value="done">Done</option>
                </select>
              ) : type === "select-phase" ? (
                <select autoFocus className="text-xs border border-blue-300 rounded px-1.5 py-1 w-full outline-none bg-white"
                  defaultValue={value} onBlur={e => handleFieldEdit(selTask.id, field, e.target.value)}
                  onChange={e => handleFieldEdit(selTask.id, field, e.target.value)}>
                  {GANTT_PHASES_ORDER.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              ) : (
                <input autoFocus type={type === "number" ? "number" : "text"} defaultValue={value}
                  className="text-xs border border-blue-300 rounded px-1.5 py-1 w-full outline-none"
                  onBlur={e => handleFieldEdit(selTask.id, field, e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleFieldEdit(selTask.id, field, (e.target as HTMLInputElement).value); }} />
              )
            ) : (
              <span className="text-xs font-medium text-neutral-800 cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                onClick={() => setEditField({ id: selTask.id, field })}>
                {value}{suffix || ""} {value === "—" ? "" : ""}
              </span>
            )}
          </div>
        );

        return (
          <div className={`shrink-0 border-t-2 ${isConflict ? "border-red-400" : "border-neutral-200"} bg-white`}>
            <div className="p-4">
              {/* Row 1: Title bar with status + phase + close */}
              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => setEditField({ id: selTask.id, field: "status" })}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded cursor-pointer hover:opacity-80 ${sc.badge} ${sc.badgeText}`}>
                  {selTask.statusLabel || selTask.status}
                </button>
                {isEditing("title") ? (
                  <input autoFocus defaultValue={selTask.title}
                    className="text-sm font-bold text-neutral-900 border border-blue-300 rounded px-2 py-0.5 flex-1 outline-none"
                    onBlur={e => handleFieldEdit(selTask.id, "title", e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleFieldEdit(selTask.id, "title", (e.target as HTMLInputElement).value); }} />
                ) : (
                  <span className="text-sm font-bold text-neutral-900 truncate cursor-pointer hover:text-blue-600 transition-colors flex-1"
                    onClick={() => setEditField({ id: selTask.id, field: "title" })}>{selTask.title}</span>
                )}
                <span className={`text-[11px] px-2 py-0.5 rounded bg-neutral-100 text-neutral-500`}>{selTask.phase || "Build"}</span>
                {CRITICAL_PATH.includes(selTask.id) && (
                  <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">Critical Path</span>
                )}
                {isConflict && (
                  <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">Conflict</span>
                )}
                <button onClick={() => onSelect?.(null)} className="text-neutral-400 hover:text-neutral-600 p-1 rounded hover:bg-neutral-100">
                  <span className="text-xs">&times;</span>
                </button>
              </div>

              {/* Row 2: Date range visualization + editable fields */}
              <div className="flex gap-4">
                {/* Left: date range card + fields */}
                <div className="flex-1 min-w-0">
                  {/* Date range bar */}
                  <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-[11px] text-neutral-400 block">Start</span>
                        <span className="text-xs font-bold text-neutral-900 cursor-pointer hover:text-blue-600"
                          onClick={() => setEditField({ id: selTask.id, field: "start" })}>
                          {fmtDate(startDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                        <span>&rarr;</span>
                        <span className="font-bold text-neutral-700">{selTask.duration} days</span>
                        <span>&rarr;</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-neutral-400 block">End</span>
                        <span className="text-xs font-bold text-neutral-900">{fmtDate(endDate)}</span>
                      </div>
                    </div>
                    {/* Visual timeline bar */}
                    <div className="relative h-3 bg-neutral-200 rounded-full overflow-hidden">
                      <div className={`absolute h-full rounded-full ${sc.bar}`}
                        style={{ left: `${(selTask.start / GANTT_TOTAL_DAYS) * 100}%`, width: `${(selTask.duration / GANTT_TOTAL_DAYS) * 100}%` }} />
                      {/* Today marker */}
                      <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10" style={{ left: `${(GANTT_TODAY / GANTT_TOTAL_DAYS) * 100}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="text-neutral-400">{fmtShort(GANTT_START_DATE)}</span>
                      <span className={`font-medium ${daysFromToday < 0 ? "text-emerald-600" : daysFromToday === 0 ? "text-blue-600" : daysFromToday <= 3 ? "text-amber-600" : "text-neutral-500"}`}>
                        {daysFromToday < 0 ? `Started ${Math.abs(daysFromToday)}d ago` : daysFromToday === 0 ? "Starts today" : `Starts in ${daysFromToday}d`}
                      </span>
                      <span className="text-neutral-400">{fmtShort(new Date(GANTT_START_DATE.getTime() + GANTT_TOTAL_DAYS * 86400000))}</span>
                    </div>
                  </div>

                  {/* Editable fields grid */}
                  <div className="grid grid-cols-4 gap-3">
                    <EditableField field="assignee" value={selTask.assignee || "Unassigned"} label="Assignee" />
                    <EditableField field="duration" value={String(selTask.duration)} label="Duration" type="number" suffix=" days" />
                    <EditableField field="phase" value={selTask.phase || "Build"} label="Phase" type="select-phase" />
                    <EditableField field="status" value={selTask.status} label="Status" type="select-status" />
                  </div>
                </div>

                {/* Right: dependencies panel */}
                <div className="w-[240px] shrink-0 bg-neutral-50 rounded-lg border border-neutral-200 p-3">
                  {/* Conflict warning */}
                  {isConflict && (
                    <div className="mb-2 bg-red-50 border border-red-200 rounded px-2 py-1.5">
                      <span className="text-[11px] font-bold text-red-700">Dependency conflict</span>
                      <p className="text-[11px] text-red-600 mt-0.5">Starts before a dependency finishes.</p>
                    </div>
                  )}
                  {depTasks.length > 0 && (
                    <div className="mb-3">
                      <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block mb-1.5">Depends on</span>
                      <div className="space-y-1.5">
                        {depTasks.map((d: any) => {
                          const isViolated = violatedDeps.has(`${d.id}->${selTask.id}`);
                          const dEnd = new Date(GANTT_START_DATE);
                          dEnd.setDate(dEnd.getDate() + d.start + d.duration);
                          const dsc = GANTT_STATUS_COLORS[d.status] || GANTT_STATUS_COLORS.todo;
                          return (
                            <div key={d.id} className={`flex items-center gap-2 rounded px-2 py-1.5 ${isViolated ? "bg-red-50 border border-red-200" : "bg-white border border-neutral-100"}`}>
                              <div className={`w-2 h-2 rounded-full shrink-0 ${isViolated ? "bg-red-500" : dsc.dot}`} />
                              <div className="flex-1 min-w-0">
                                <span className={`text-[11px] font-medium block truncate ${isViolated ? "text-red-700" : "text-neutral-800"}`}>{d.title}</span>
                                <span className={`text-[11px] ${isViolated ? "text-red-500" : "text-neutral-400"}`}>Ends {fmtShort(dEnd)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {blockedBy.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block mb-1.5">Blocks</span>
                      <div className="space-y-1.5">
                        {blockedBy.map((d: any) => {
                          const dsc = GANTT_STATUS_COLORS[d.status] || GANTT_STATUS_COLORS.todo;
                          const dStart = new Date(GANTT_START_DATE);
                          dStart.setDate(dStart.getDate() + d.start);
                          return (
                            <div key={d.id} className="flex items-center gap-2 bg-white border border-neutral-100 rounded px-2 py-1.5">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${dsc.dot}`} />
                              <div className="flex-1 min-w-0">
                                <span className="text-[11px] font-medium text-neutral-800 block truncate">{d.title}</span>
                                <span className="text-[11px] text-neutral-400">Starts {fmtShort(dStart)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {depTasks.length === 0 && blockedBy.length === 0 && (
                    <div className="text-center py-2">
                      <span className="text-[11px] text-neutral-400">No dependencies</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* Keep GanttChart export for test-layouts compatibility */
export function GanttChart(props: any) {
  return <GanttEditView {...props} />;
}
