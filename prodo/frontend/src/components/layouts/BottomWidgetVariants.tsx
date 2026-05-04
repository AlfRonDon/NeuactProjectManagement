"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import SprintCard from "@/components/widgets/SprintCard";
import DiagnosticCard from "@/components/widgets/DiagnosticCard";
import WorkloadCard from "@/components/widgets/WorkloadCard";
import ProjectCards from "@/components/widgets/ProjectCards";
import ProjectDetail from "@/components/widgets/ProjectDetail";
import {
  Shield,
  Activity,
  CheckCircle2,
  OctagonAlert,
  CircleDot,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import RiskRadar from "@/components/widgets/risk-radar";
import { riskData, burndownData } from "@/components/layouts/fixtures";
import {
  fetchProjectDashboard,
  fetchSprintTimeline,
  fetchBlockersPanel,
  fetchDiagnostic,
  fetchWorkload,
  lockBacklog,
  setReviewSla,
  assignDris,
  escalateBlocker,
  snoozeBlocker,
} from "@/lib/api";
import { usePMStore, selectDashboardProjects } from "@/lib/store";
import { STATUS_HEX, SERIES_COLORS, NEUTRAL, FONT_SANS, FONT_MONO } from "@/design";
import type { DashboardProject } from "@/lib/store";

/* ── Types ────────────────────────────────────────────────── */

type ProjectRow = {
  id?: string;
  name: string;
  short: string;
  color: string;
  progress: number;
  done: number;
  active: number;
  blocked: number;
  total: number;
  deadline: number;
  health: "on-track" | "at-risk" | "critical";
  lead: string;
};

/* ── Store → ProjectRow conversion ───────────────────────── */

function storeToProjectRows(storeProjects: DashboardProject[]): ProjectRow[] {
  if (!storeProjects || storeProjects.length === 0) return [];
  return storeProjects.map((p) => {
    const targetDate = p.target ? new Date(p.target).getTime() : 0;
    const now = Date.now();
    const deadline = targetDate ? Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24)) : 999;
    let health: "on-track" | "at-risk" | "critical" = "on-track";
    if (deadline < 7 && p.progress < 80) health = "critical";
    else if (deadline < 14 && p.progress < 60) health = "at-risk";
    return {
      id: p.id,
      name: p.name,
      short: p.short,
      color: p.color,
      progress: p.progress,
      done: p.done,
      active: p.active,
      blocked: p.blocked,
      total: p.total,
      deadline,
      health,
      lead: "",
    };
  });
}

function useProjects(): ProjectRow[] {
  const storeProjects = usePMStore(selectDashboardProjects);
  return storeToProjectRows(storeProjects);
}

/* ── Constants ────────────────────────────────────────────── */

const STAGES = ["Research", "Design", "Build", "Test", "Ship"];

const STAGE_DATA: Record<string, { stage: string; done: number; total: number; status: string }[]> = {
  CCv5: [
    { stage: "Research", done: 2, total: 2, status: "done" },
    { stage: "Design", done: 2, total: 2, status: "done" },
    { stage: "Build", done: 1, total: 4, status: "active" },
    { stage: "Test", done: 0, total: 2, status: "todo" },
    { stage: "Ship", done: 0, total: 2, status: "blocked" },
  ],
  NRv3: [
    { stage: "Research", done: 1, total: 1, status: "done" },
    { stage: "Design", done: 1, total: 1, status: "done" },
    { stage: "Build", done: 1, total: 3, status: "active" },
    { stage: "Test", done: 0, total: 1, status: "todo" },
    { stage: "Ship", done: 0, total: 1, status: "backlog" },
  ],
  Spot: [
    { stage: "Research", done: 1, total: 1, status: "done" },
    { stage: "Design", done: 2, total: 2, status: "done" },
    { stage: "Build", done: 2, total: 4, status: "blocked" },
    { stage: "Test", done: 0, total: 1, status: "todo" },
    { stage: "Ship", done: 1, total: 1, status: "done" },
  ],
};

const HEALTH_COLORS: Record<string, { bg: string; text: string; fill: string; label: string }> = {
  "on-track": { bg: "bg-ok-bg", text: "text-ok-fg", fill: "fill-ok-solid", label: "On Track" },
  "at-risk": { bg: "bg-warn-bg", text: "text-warn-fg", fill: "fill-warn-solid", label: "At Risk" },
  critical: { bg: "bg-hot-bg", text: "text-hot-fg", fill: "fill-hot-solid", label: "Critical" },
};

const STAGE_COLORS: Record<string, { bg: string; text: string; fill: string }> = {
  done: { bg: "bg-ok-subtle", text: "text-ok-fg", fill: "fill-ok-solid" },
  active: { bg: "bg-warn-subtle", text: "text-warn-fg", fill: "fill-warn-solid" },
  blocked: { bg: "bg-bad-subtle", text: "text-bad-fg", fill: "fill-bad-solid" },
  todo: { bg: "bg-info-subtle", text: "text-info-fg", fill: "fill-info-solid" },
  backlog: { bg: "bg-neutral-100", text: "text-neutral-500", fill: "fill-neutral-400" },
};

function deadlineColor(days: number): string {
  if (days < 7) return "text-bad-fg";
  if (days < 14) return "text-warn-fg";
  return "text-ok-fg";
}

function deadlineBgClass(days: number): string {
  if (days < 7) return "bg-bad-subtle";
  if (days < 14) return "bg-warn-subtle";
  return "bg-ok-subtle";
}

const CIRC = 2 * Math.PI * 42;

const toSlug = (name: string) => `/project/${name.toLowerCase().replace(/\s+/g, "-")}`;

/* ── Diagnostic Data ──────────────────────────────────────── */

const DIAG_AXES = [
  { axis: "Scope Creep", actual: 88 },
  { axis: "Slow Reviews", actual: 82 },
  { axis: "Missing Owner", actual: 70 },
  { axis: "Ext. Deps", actual: 65 },
  { axis: "Context Switch", actual: 55 },
  { axis: "Tech Debt", actual: 35 },
];

const DIAG_ACTIONS: Record<string, string> = {
  "Scope Creep": "Lock backlog \u2192",
  "Slow Reviews": "Set review SLA \u2192",
  "Missing Owner": "Assign DRIs \u2192",
  "Ext. Deps": "Escalate \u2192",
};

const LAST_SPRINT_SCORES: Record<string, number> = {
  "Scope Creep": 65,
  "Slow Reviews": 78,
  "Missing Owner": 60,
  "Ext. Deps": 50,
  "Context Switch": 70,
  "Tech Debt": 40,
};

function deltaColorScale(index: number): string {
  if (index === 0) return "text-bad-fg";
  if (index === 1) return "text-hot-fg";
  if (index <= 3) return "text-warn-fg";
  return "text-ok-fg";
}

/* ═══════════════════════════════════════════════════════════
   1. KPIHeader
   ═══════════════════════════════════════════════════════════ */

function KPIHeader() {
  return null;
}

/* ═══════════════════════════════════════════════════════════
   2. SegmentBar
   ═══════════════════════════════════════════════════════════ */

function SegmentBar({ sel, onSelect }: { sel: string; onSelect: (s: string) => void }) {
  const projects = useProjects();
  if (projects.length === 0) return null;

  return (
    <div className="flex h-12 rounded-lg gap-[2px] bg-neutral-100 overflow-hidden">
      {projects.map((p) => {
        const isActive = p.short === sel;
        return (
          <button
            key={p.short}
            onClick={() => onSelect(p.short)}
            className={`flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
              isActive ? "text-white" : "text-neutral-700 hover:bg-neutral-200"
            }`}
            style={{
              flex: `${p.total || 1} 1 0`,
              backgroundColor: isActive ? p.color : undefined,
            }}
          >
            <span>{p.short}</span>
            <span className="opacity-70">{p.progress}%</span>
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   3. ProjectDetailCompact
   ═══════════════════════════════════════════════════════════ */

function ProjectDetailCompact({ sel }: { sel: string }) {
  const projects = useProjects();
  const router = useRouter();
  const proj = projects.find((p) => p.short === sel) || projects[0];
  if (!proj) return null;

  const stages = STAGE_DATA[proj.short] || [];
  const healthCfg = HEALTH_COLORS[proj.health];
  const healthLabel =
    proj.health === "on-track" ? "On Track" : proj.health === "at-risk" ? "At Risk" : "Critical";

  return (
    <div
      className="bg-white rounded-lg border border-neutral-200 p-3 cursor-pointer hover:shadow-sm transition-shadow"
      onClick={() => router.push(toSlug(proj.name))}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: proj.color }} />
        <span className="text-sm font-semibold text-neutral-900 font-serif">{proj.name}</span>
        <div className="flex-1" />
        <span className="text-xs font-mono text-neutral-500">
          {proj.done}/{proj.total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${proj.progress}%`, backgroundColor: proj.color }}
        />
      </div>

      {/* Stage pipeline */}
      <div className="flex gap-1 mb-2">
        {stages.map((s) => {
          const colors = STAGE_COLORS[s.status] || STAGE_COLORS.backlog;
          const Icon =
            s.status === "done"
              ? CheckCircle2
              : s.status === "blocked"
              ? OctagonAlert
              : s.status === "active"
              ? Activity
              : CircleDot;
          return (
            <div
              key={s.stage}
              className={`flex-1 flex flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 ${colors.bg}`}
            >
              <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
              <span className={`text-[10px] font-bold ${colors.text}`}>
                {s.done}/{s.total}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer: health + deadline */}
      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${healthCfg.bg} ${healthCfg.text}`}
        >
          {healthLabel}
        </span>
        <span className={`text-[10px] font-mono ${deadlineColor(proj.deadline)}`}>
          {proj.deadline}d left
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   4. SprintSection
   ═══════════════════════════════════════════════════════════ */

function SprintSection({
  sel,
  onSprintId,
}: {
  sel: string;
  onSprintId?: (id: string) => void;
}) {
  return <SprintCard projectShort={sel} />;
}

/* ═══════════════════════════════════════════════════════════
   5. DiagnosticSectionA / DiagnosticSectionB (placeholders)
   ═══════════════════════════════════════════════════════════ */

function DiagnosticSectionA() {
  return <div className="bg-white rounded-lg border border-neutral-200 p-3 text-xs text-neutral-400">Diagnostic A</div>;
}

function DiagnosticSectionB() {
  return <div className="bg-white rounded-lg border border-neutral-200 p-3 text-xs text-neutral-400">Diagnostic B</div>;
}

/* ═══════════════════════════════════════════════════════════
   6. DiagRadarTick
   ═══════════════════════════════════════════════════════════ */

function DiagRadarTick(props: any) {
  const { x, y, cx, cy, payload, index } = props;
  const axes = props.axes || DIAG_AXES;
  const axisItem = axes[index];
  const score = axisItem?.actual ?? 0;
  const lastScore = LAST_SPRINT_SCORES[axisItem?.axis] ?? score;
  const delta = score - lastScore;
  const deltaStr = delta > 15 ? "\u2191\u2191" : delta > 0 ? "\u2191" : delta < 0 ? "\u2193" : "";

  let color: string = NEUTRAL[400];
  if (index === 0) color = STATUS_HEX.bad.solid;
  else if (score > 70) color = STATUS_HEX.hot.solid;

  // Push label outward
  const angle = Math.atan2(y - cy, x - cx);
  const offset = 16;
  const tx = x + Math.cos(angle) * offset;
  const ty = y + Math.sin(angle) * offset;

  return (
    <g>
      <text
        x={tx}
        y={ty}
        textAnchor={tx > cx ? "start" : "end"}
        dominantBaseline="central"
        style={{ fontSize: 10, fontFamily: FONT_SANS, fill: color, fontWeight: 500 }}
      >
        {axisItem?.axis}
      </text>
      {deltaStr && (
        <text
          x={tx}
          y={ty + 11}
          textAnchor={tx > cx ? "start" : "end"}
          dominantBaseline="central"
          style={{ fontSize: 9, fontFamily: FONT_MONO, fill: color }}
        >
          {deltaStr}
        </text>
      )}
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════
   7. DiagRadarDot
   ═══════════════════════════════════════════════════════════ */

function DiagRadarDot(props: any) {
  const { cx, cy, index } = props;
  const axes = props.axes || DIAG_AXES;
  const score = axes[index]?.actual ?? 0;
  const fill = score > 60 ? STATUS_HEX.hot.solid : STATUS_HEX.ok.solid;
  return <circle cx={cx} cy={cy} r={3.5} fill={fill} stroke="#fff" strokeWidth={1} />;
}

/* ═══════════════════════════════════════════════════════════
   8. DiagnosticSectionC (Main Diagnostic Card)
   ═══════════════════════════════════════════════════════════ */

function DiagnosticSectionC({
  sel,
  sprintId,
  topBlockerId,
}: {
  sel: string;
  sprintId?: string;
  topBlockerId?: string;
}) {
  return <DiagnosticCard projectShort={sel} sprintId={sprintId} topBlockerId={topBlockerId} />;
}

/* ═══════════════════════════════════════════════════════════
   9. TopSection
   ═══════════════════════════════════════════════════════════ */

function TopSection({ sel, setSel }: { sel: string; setSel: (s: string) => void }) {
  return (
    <div className="space-y-2">
      <ProjectCards selected={sel} onSelect={setSel} />
      <ProjectDetail projectShort={sel} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   10. BottomWidgetVariantA (MAIN EXPORT)
   ═══════════════════════════════════════════════════════════ */

export function BottomWidgetVariantA({
  renderLayout = "full",
  sel,
  onSelChange,
  onSprintId,
  sprintId,
  topBlockerId,
}: {
  renderLayout?: "left-only" | "right-only" | "sprint-only" | "diagnostic-only" | "full";
  sel?: string;
  onSelChange?: (s: string) => void;
  onSprintId?: (id: string) => void;
  sprintId?: string;
  topBlockerId?: string;
}) {
  const [internalSel, setInternalSel] = useState("CCv5");
  const [internalSprintId, setInternalSprintId] = useState<string | undefined>(sprintId);
  const [internalTopBlockerId] = useState<string | undefined>(topBlockerId);

  const activeSel = sel ?? internalSel;
  const handleSel = onSelChange ?? setInternalSel;
  const handleSprintId = onSprintId ?? ((id: string) => setInternalSprintId(id));
  const activeSprintId = sprintId ?? internalSprintId;
  const activeBlockerId = topBlockerId ?? internalTopBlockerId;

  if (renderLayout === "left-only") {
    return <TopSection sel={activeSel} setSel={handleSel} />;
  }

  if (renderLayout === "sprint-only") {
    return <SprintSection sel={activeSel} onSprintId={handleSprintId} />;
  }

  if (renderLayout === "diagnostic-only") {
    return (
      <DiagnosticSectionC
        sel={activeSel}
        sprintId={activeSprintId}
        topBlockerId={activeBlockerId}
      />
    );
  }

  if (renderLayout === "right-only") {
    return (
      <div className="flex flex-col gap-3 h-full">
        <SprintSection sel={activeSel} onSprintId={handleSprintId} />
        <div className="flex-1 min-h-0">
          <DiagnosticSectionC
            sel={activeSel}
            sprintId={activeSprintId}
            topBlockerId={activeBlockerId}
          />
        </div>
      </div>
    );
  }

  // full layout
  return (
    <div className="flex gap-3 h-full">
      {/* Left column */}
      <div className="flex flex-col gap-3" style={{ flex: "4 1 0" }}>
        <TopSection sel={activeSel} setSel={handleSel} />
        <SprintSection sel={activeSel} onSprintId={handleSprintId} />
      </div>
      {/* Right column */}
      <div className="flex-1 min-h-0" style={{ flex: "6 1 0" }}>
        <DiagnosticSectionC
          sel={activeSel}
          sprintId={activeSprintId}
          topBlockerId={activeBlockerId}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   11. Heat styling for PeopleVariantA
   ═══════════════════════════════════════════════════════════ */

const HEAT_STYLE = {
  light: { bg: "bg-ok-subtle", text: "text-ok-fg", label: "Light" },
  busy: { bg: "bg-info-subtle", text: "text-info-fg", label: "Busy" },
  full: { bg: "bg-warn-subtle", text: "text-warn-fg", label: "Full" },
  over: { bg: "bg-bad-subtle", text: "text-bad-fg", label: "Over" },
} as const;

function heatLevel(hours: number, capacity: number): keyof typeof HEAT_STYLE {
  const ratio = hours / capacity;
  if (ratio < 0.6) return "light";
  if (ratio < 0.85) return "busy";
  if (ratio <= 1.0) return "full";
  return "over";
}

/* ═══════════════════════════════════════════════════════════
   12. PeopleVariantA
   ═══════════════════════════════════════════════════════════ */

export function PeopleVariantA({ project = "CCv5" }: { project?: string }) {
  return <WorkloadCard project={project} />;
}

/* ═══════════════════════════════════════════════════════════
   13. GanttEditView
   ═══════════════════════════════════════════════════════════ */

export function GanttEditView() {
  const projects = useProjects();
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const tasks = [
    { id: "g1", label: "Auth API", start: 0, duration: 12, lane: 0, color: STATUS_HEX.info.solid, status: "done" },
    { id: "g2", label: "Dashboard API", start: 8, duration: 17, lane: 0, color: STATUS_HEX.info.solid, status: "active" },
    { id: "g3", label: "Login UI", start: 5, duration: 13, lane: 1, color: SERIES_COLORS[4], status: "done" },
    { id: "g4", label: "Widget Renderer", start: 15, duration: 25, lane: 1, color: SERIES_COLORS[4], status: "active" },
    { id: "g5", label: "Voice Pipeline", start: 20, duration: 25, lane: 2, color: SERIES_COLORS[5], status: "active" },
    { id: "g6", label: "E2E Tests", start: 45, duration: 26, lane: 3, color: STATUS_HEX.ok.solid, status: "todo" },
  ];

  const lanes = ["Backend", "Frontend", "ML", "QA"];
  const totalDays = 90;
  const dayWidth = 8;

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-3 overflow-x-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-serif font-semibold text-neutral-900">Timeline</span>
        <span className="text-[10px] text-neutral-400 font-mono">Apr 1 - Jun 30</span>
      </div>

      {/* Gantt body */}
      <div className="relative" style={{ width: totalDays * dayWidth, minHeight: lanes.length * 36 }}>
        {/* Lane backgrounds */}
        {lanes.map((lane, i) => (
          <div
            key={lane}
            className="absolute left-0 right-0 flex items-center border-b border-neutral-100"
            style={{ top: i * 36, height: 36 }}
          >
            <span className="text-[10px] text-neutral-400 w-16 shrink-0 pl-1">{lane}</span>
          </div>
        ))}

        {/* Task bars */}
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`absolute h-6 rounded cursor-pointer flex items-center px-1.5 text-[9px] font-medium text-white transition-all ${
              selectedTask === task.id ? "ring-2 ring-neutral-900" : "hover:brightness-110"
            }`}
            style={{
              left: 64 + task.start * dayWidth,
              top: task.lane * 36 + 5,
              width: task.duration * dayWidth,
              backgroundColor: task.color,
              opacity: task.status === "done" ? 0.6 : 1,
            }}
            onClick={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
          >
            <span className="truncate">{task.label}</span>
          </div>
        ))}

        {/* Today line */}
        <div
          className="absolute top-0 bottom-0 w-[1px] bg-neutral-900"
          style={{ left: 64 + 33 * dayWidth }}
        />
      </div>
    </div>
  );
}

/* ── Compat stubs for unused variant exports ── */
export function TaskWidgetVariantA() { return null; }
export function TaskWidgetVariantB() { return null; }
export function TaskWidgetVariantC() { return null; }
export function GanttChart(_props: any) { return <GanttEditView />; }

/* ── Compat type exports ── */
export type GanttRow = { id: string; label: string; tasks: any[]; isGroup?: boolean };
