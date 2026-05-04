"use client";

import React, { useState, useEffect } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer,
} from "recharts";
import { useRouter } from "next/navigation";
import { usePMStore, selectDashboardProjects } from "@/lib/store";
import { fetchDiagnostic, lockBacklog, setReviewSla, assignDris, escalateBlocker } from "@/lib/api";

/* ── Fallback data ────────────────────────────────────── */

const DIAG_AXES = [
  { axis: "Scope Creep", actual: 88 },
  { axis: "Slow Reviews", actual: 82 },
  { axis: "Missing Owner", actual: 70 },
  { axis: "Ext. Deps", actual: 65 },
  { axis: "Context Switch", actual: 55 },
  { axis: "Tech Debt", actual: 35 },
];

const LAST_SPRINT: Record<string, number> = {
  "Scope Creep": 65, "Slow Reviews": 78, "Missing Owner": 60,
  "Ext. Deps": 50, "Context Switch": 70, "Tech Debt": 40,
};

const ACTIONS: Record<string, string> = {
  "Scope Creep": "Lock backlog →",
  "Slow Reviews": "Set review SLA →",
  "Missing Owner": "Assign DRIs →",
  "Ext. Deps": "Escalate →",
};

const BAR_COLORS = [
  "#dc2626", "#ea580c", "#f59e0b", "#fbbf24", "#fcd34d", "#d6cfc1",
];

/* ── Helpers ──────────────────────────────────────────── */

function deltaColor(i: number): string {
  if (i === 0) return "text-[#dc2626]";
  if (i === 1) return "text-[#ea580c]";
  if (i <= 3) return "text-[#b45309]";
  return "text-[#059669]";
}

const toSlug = (name: string) => `/project/${name.toLowerCase().replace(/\s+/g, "-")}`;

/* ── Radar tick ───────────────────────────────────────── */

function RadarTick({ x, y, payload, mergedData }: any) {
  const name: string = payload?.value || "";
  const entry = mergedData?.find((d: any) => d.axis === name);
  const delta = entry ? entry.current - entry.last : 0;
  const isTop = entry?.current >= 70;

  // Push labels outward
  const cx = 137, cy = 137;
  const dx = x - cx, dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const push = 18;
  const px = x + (dx / dist) * push;
  const py = y + (dy / dist) * push;

  const color = isTop ? "#1a1208" : "#5a4f3f";
  const fontSize = isTop ? 11 : 10.5;
  const arrow = delta >= 23 ? " ↑↑" : delta > 0 ? " ↑" : " ↓";

  return (
    <text
      x={px} y={py} textAnchor="middle" dominantBaseline="central"
      fill={name === "Scope Creep" ? "#dc2626" : color}
      fontSize={fontSize} fontWeight={600} fontFamily="'Geist', sans-serif"
    >
      {name}{arrow}
    </text>
  );
}

/* ── Radar dot ────────────────────────────────────────── */

function RadarDot({ cx, cy, index, mergedData }: any) {
  const entry = mergedData?.[index];
  const score = entry?.current ?? 0;
  const fill = score >= 60 ? "#ea580c" : "#059669";
  const r = score >= 80 ? 5 : 3.8;
  return <circle cx={cx} cy={cy} r={r} fill={fill} stroke="none" />;
}

/* ── Component ────────────────────────────────────────── */

interface DiagnosticCardProps {
  projectShort?: string;
  sprintId?: string | null;
  topBlockerId?: string | null;
}

export default function DiagnosticCard({ projectShort = "CCv5", sprintId, topBlockerId }: DiagnosticCardProps) {
  const router = useRouter();
  const projects = usePMStore(selectDashboardProjects);
  const proj = projects.find(p => p.short === projectShort) || projects[0];
  const [diagData, setDiagData] = useState<any>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!proj?.id) return;
    let cancelled = false;
    fetchDiagnostic(proj.id, sprintId || undefined)
      .then(data => { if (!cancelled) setDiagData(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [proj?.id, sprintId]);

  // Merge API or fallback
  const dimensions = diagData?.dimensions || DIAG_AXES.map(a => ({
    name: a.axis, score: a.actual,
    delta: a.actual - (LAST_SPRINT[a.axis] ?? a.actual),
    action: ACTIONS[a.axis] ? a.axis.toLowerCase().replace(/\s+/g, "_") : null,
    action_label: ACTIONS[a.axis] || null,
  }));

  const sorted = [...dimensions].sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0));
  const totalGap = sorted.reduce((s: number, a: any) => s + (a.score ?? 0), 0);
  const top3Sum = sorted.slice(0, 3).reduce((s: number, a: any) => s + (a.score ?? 0), 0);
  const top3Pct = diagData?.top3_contribution ?? (totalGap > 0 ? Math.round((top3Sum / totalGap) * 100) : 60);
  const bracketPct = totalGap > 0 ? Math.round((top3Sum / totalGap) * 100) : 64;

  const mergedData = sorted.map((a: any) => ({
    axis: a.name || a.axis,
    current: a.score ?? 0,
    last: (a.score ?? 0) - (a.delta ?? 0),
  }));

  const handleAction = async (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    if (actionBusy || !sprintId) return;
    setActionBusy(action);
    try {
      if (action === "lock_backlog" || action === "scope_creep") await lockBacklog(sprintId);
      else if (action === "set_review_sla" || action === "slow_reviews") await setReviewSla(sprintId, 24);
      else if (action === "assign_dris" || action === "missing_owner") await assignDris(sprintId);
      else if (action === "escalate" || action === "ext._deps" || action === "ext_deps") {
        if (topBlockerId) await escalateBlocker(topBlockerId);
      }
    } catch {}
    setActionBusy(null);
  };

  return (
    <div
      className="bg-white rounded-lg border border-neutral-200 shadow-xsmall flex flex-col h-full overflow-hidden cursor-pointer"
      onClick={() => proj && router.push(`${toSlug(proj.name)}?tab=diagnostic`)}
    >
      {/* Header */}
      <div className="px-5 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
            <path d="M7 0L14 7L7 18L0 7Z" fill="#EA580C" />
          </svg>
          <span className="text-base font-bold text-neutral-950">Sprint Diagnostic</span>
          <span className="text-sm text-neutral-500">· root cause</span>
        </div>
        <span className="text-xs font-bold text-[#b45309] uppercase tracking-[1.2px]">The 80/20 of this sprint</span>
      </div>

      {/* Body: radar left | 80/20 right */}
      <div className="flex flex-1 min-h-0 px-3 pb-2 gap-0">

        {/* LEFT: Radar */}
        <div className="w-[275px] shrink-0 relative -ml-2" style={{ height: "100%" }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={mergedData} cx="50%" cy="48%" outerRadius="60%">
                <PolarGrid stroke="#E9E5E4" strokeWidth={0.8} />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={(tickProps: any) => <RadarTick {...tickProps} mergedData={mergedData} />}
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="last" dataKey="last"
                  stroke="#938A89" fill="none" strokeWidth={1.5} strokeDasharray="6 4"
                  dot={false}
                />
                <Radar name="current" dataKey="current"
                  stroke="#EA580C" fill="rgba(234,88,12,0.10)" strokeWidth={2.5}
                  dot={(dotProps: any) => <RadarDot {...dotProps} mergedData={mergedData} />}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5">
              <div style={{ width: 16, height: 0, borderTop: "2.5px solid #EA580C" }} />
              <span className="text-[10px] text-neutral-500">this sprint</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 16, height: 0, borderTop: "1.5px dashed #938A89" }} />
              <span className="text-[10px] text-neutral-500">last sprint</span>
            </div>
          </div>
        </div>

        {/* RIGHT: 80/20 */}
        <div className="flex-1 min-w-0 flex flex-col justify-between pt-1 pb-1">
          {/* Headline */}
          <p className="text-base text-neutral-950 leading-[20px]">
            <span className="font-bold">~{top3Pct}%</span>{" of your sprint gap traces back to the "}
            <span className="font-bold text-[#c2410c]">top 3 friction sources</span>
          </p>

          {/* Bracket */}
          <div className="mt-1 mb-1 relative h-[18px]">
            <div className="absolute top-[9px] left-0 border-t-[1.5px] border-neutral-500" style={{ width: `${bracketPct}%` }} />
            <div className="absolute left-0 top-0 h-[18px] border-l-[1.5px] border-neutral-500" />
            <div className="absolute top-0 h-[18px] border-l-[1.5px] border-neutral-500" style={{ left: `${bracketPct}%` }} />
            <div className="absolute -top-[3px]" style={{ left: `${bracketPct / 2}%`, transform: "translateX(-50%)" }}>
              <span className="text-xs font-bold text-white px-3 py-[3px] rounded-full" style={{ background: "#c2410c" }}>~{top3Pct}%</span>
            </div>
          </div>

          {/* Proportional bar */}
          <div className="flex h-[44px] overflow-hidden rounded-md">
            {sorted.map((a: any, i: number) => (
              <div key={a.name || a.axis} className="flex items-center justify-center"
                style={{ flex: a.score ?? 35, backgroundColor: BAR_COLORS[i] || BAR_COLORS[5] }}>
                <span className={`font-mono font-bold ${i < 3 ? "text-white text-[22px]" : i < 5 ? "text-[#1a1208] text-[22px]" : "text-[#5a4f3f] text-[18px]"}`}>
                  {a.score ?? 0}
                </span>
              </div>
            ))}
          </div>

          {/* Labels + deltas + buttons (per column) */}
          <div className="flex mt-0">
            {sorted.map((a: any, i: number) => {
              const delta = a.delta ?? 0;
              const dClr = deltaColor(i);
              const actionKey = a.action || null;
              const actionLabel = a.action_label || ACTIONS[a.name || a.axis] || "";
              const weight = a.score ?? 35;
              const axisName = a.name || a.axis;
              return (
                <div key={axisName} className="flex flex-col items-center text-center gap-1" style={{ flex: weight, minWidth: 0 }}>
                  <span className={`text-xs leading-[1.2] ${i < 4 ? "font-bold text-[#1a1208]" : "font-normal text-[#5a4f3f]"}`}>
                    {axisName.split(" ").map((w: string, wi: number) => <span key={wi} className="block">{w}</span>)}
                  </span>
                  <span className={`text-[13px] font-bold whitespace-nowrap ${dClr}`}>
                    {delta >= 0 ? "+" : "−"}{Math.abs(delta)} {delta >= 23 ? "↑↑" : delta > 0 ? "↑" : "↓"}
                  </span>
                  {actionLabel ? (
                    <button
                      onClick={(e) => handleAction(e, actionKey || axisName.toLowerCase().replace(/[\s.]+/g, "_"))}
                      disabled={!sprintId || actionBusy !== null}
                      className={`text-xs font-semibold rounded-full px-2 py-[2px] whitespace-nowrap disabled:opacity-50 ${
                        i === 0 ? "bg-[#1a1208] text-white" : "bg-white text-[#1a1208] border border-[#1a1208]"
                      }`}>
                      {actionBusy === (actionKey || axisName.toLowerCase().replace(/[\s.]+/g, "_")) ? "..." : actionLabel}
                    </button>
                  ) : (
                    <span className="text-xs text-[#9c8870] whitespace-nowrap">on track</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <p className="text-xs text-[#9c8870]">
            {diagData?.rule || "Width = contribution to the gap. Fix from the left to recover the most velocity."}
          </p>
        </div>
      </div>
    </div>
  );
}
