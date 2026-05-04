"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea,
} from "recharts";
import { usePMStore, selectDashboardProjects } from "@/lib/store";
import { fetchSprintTimeline, fetchBlockersPanel } from "@/lib/api";
import { FONT_SANS, CHART_TOOLTIP_STYLE, CHART_GRID_COLOR, NEUTRAL, STATUS_HEX } from "@/design";

/* ── Tooltip ──────────────────────────────────────────── */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={CHART_TOOLTIP_STYLE}>
      <div style={{ fontWeight: 600, color: NEUTRAL[950], marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

/* ── Component ────────────────────────────────────────── */

export default function SprintCard({ projectShort = "CCv5" }: { projectShort?: string }) {
  const projects = usePMStore(selectDashboardProjects);
  const proj = projects.find(p => p.short === projectShort) || projects[0];

  const [chartData, setChartData] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [blocker, setBlocker] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!proj?.id) return;
    let cancelled = false;

    Promise.all([
      fetchSprintTimeline(proj.id).catch(() => null),
      fetchBlockersPanel(proj.id).catch(() => null),
    ]).then(([sprintData, blockerData]) => {
      if (cancelled) return;

      if (sprintData) {
        // Build chart data from planned_line + actual_line + forecast_line
        const planned = sprintData.planned_line || [];
        const actual = sprintData.actual_line || [];
        const forecast = sprintData.forecast_line || [];
        const today = new Date().toISOString().slice(0, 10);

        // Merge all lines into one dataset by date
        const dateMap: Record<string, any> = {};
        for (const p of planned) {
          const d = p.date?.slice(0, 10) || "";
          if (!dateMap[d]) dateMap[d] = { date: new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) };
          dateMap[d].planned = Math.round((p.remaining ?? 0) * 10) / 10;
        }
        for (const a of actual) {
          const d = a.date?.slice(0, 10) || "";
          if (!dateMap[d]) dateMap[d] = { date: new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) };
          dateMap[d].actual = Math.round((a.remaining ?? 0) * 10) / 10;
        }
        for (const f of forecast) {
          const d = f.date?.slice(0, 10) || "";
          if (!dateMap[d]) dateMap[d] = { date: new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) };
          dateMap[d].forecast = Math.round((f.remaining ?? 0) * 10) / 10;
        }
        const merged = Object.entries(dateMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, v]) => v);
        // Sample to ~15 points max for readability
        const step = Math.max(1, Math.floor(merged.length / 15));
        const sampled = merged.filter((_, i) => i % step === 0 || i === merged.length - 1);
        setChartData(sampled);

        // Find today index in sampled data
        const todayFormatted = new Date(today).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const todayIdx = sampled.findIndex(d => d.date === todayFormatted);

        // Extract pace as primitives (not object)
        const paceObj = sprintData.pace || {};
        const paceVal = typeof paceObj === "object" ? paceObj.current : paceObj;
        const pacePrev = typeof paceObj === "object" ? paceObj.previous : "";

        // Sprint metadata
        const sprint = sprintData.sprint || {};
        const summary = sprintData.summary || {};
        const startDate = sprint.start_date || "";
        const endDate = sprint.end_date || "";
        const fmtRange = startDate && endDate
          ? `${new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}–${new Date(endDate).toLocaleDateString("en-US", { day: "numeric" })}`
          : "";

        setMeta({
          title: sprint.name || sprintData.title || "Sprint",
          range: fmtRange,
          shipDate: sprintData.ship_date ? `Ships ${new Date(sprintData.ship_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "",
          lateDays: sprintData.days_late || 0,
          pace: paceVal != null ? `${paceVal}/d` : "",
          paceFrom: pacePrev ? String(pacePrev) : "",
          remaining: `${summary.remaining ?? 0} tasks`,
          daysLeft: sprint.days_left ?? sprintData.days_left ?? 0,
          todayIdx: todayIdx >= 0 ? todayIdx : null,
          blockedStart: sprintData.blocked_start ?? null,
          blockedEnd: sprintData.blocked_end ?? null,
          sprintEndDate: endDate ? new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
          aiInsight: sprintData.ai_insight || sprintData.note || "",
        });
      }

      if (blockerData) {
        const topBlocker = Array.isArray(blockerData) ? blockerData[0] :
          blockerData.blockers?.[0] || blockerData.top_blocker || null;
        if (topBlocker) {
          setBlocker({
            title: topBlocker.task_title || topBlocker.title || topBlocker.reason || "",
            detail: topBlocker.description || topBlocker.reason || "",
            avatar: (topBlocker.assigned_to_detail?.display_name || topBlocker.reported_by_detail?.display_name || "?")[0].toUpperCase(),
            assignee: topBlocker.assigned_to_detail?.display_name || "Unassigned",
          });
        }
      }

      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [proj?.id]);

  if (loading && chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 shadow-xsmall flex items-center justify-center h-full">
        <span className="text-xs text-neutral-400">Loading sprint data...</span>
      </div>
    );
  }

  const m = meta || {};

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-xsmall flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 flex items-end justify-between shrink-0">
        <div>
          <div className="text-xs text-neutral-500">
            {m.title || "Sprint"}{m.range ? ` · ${m.range}` : ""} · forecast
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xl font-bold text-neutral-950">{m.shipDate || "—"}</span>
            {m.lateDays > 0 && (
              <span className="text-xs font-semibold text-bad-fg bg-bad-bg px-2 py-0.5 rounded-full">
                +{m.lateDays} days late
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-6">
          {m.pace && (
            <div className="text-right">
              <div className="text-xs text-neutral-400">Pace</div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-neutral-950">{m.pace}</span>
                {m.paceFrom && <span className="text-xs text-neutral-400">↓ from {m.paceFrom}</span>}
              </div>
            </div>
          )}
          <div className="text-right">
            <div className="text-xs text-neutral-400">Remaining</div>
            <span className="text-lg font-bold text-neutral-950">{m.remaining || "—"}</span>
          </div>
          <div className="text-right">
            <div className="text-xs text-neutral-400">Days left</div>
            <span className="text-lg font-bold text-neutral-950">{m.daysLeft ?? "—"}</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="flex-1 px-2" style={{ minHeight: 120 }}>
          <ResponsiveContainer width="100%" height="100%" minHeight={120}>
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: FONT_SANS, fill: NEUTRAL[500] }} tickLine={false} axisLine={{ stroke: CHART_GRID_COLOR }} />
              <YAxis tick={{ fontSize: 11, fontFamily: FONT_SANS, fill: NEUTRAL[500] }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              {m.blockedStart != null && m.blockedEnd != null && chartData[m.blockedStart] && chartData[m.blockedEnd] && (
                <ReferenceArea x1={chartData[m.blockedStart].date} x2={chartData[m.blockedEnd].date} fill="rgba(239,68,68,0.08)" stroke="none"
                  label={{ value: "blocked", position: "insideTop", fill: STATUS_HEX.bad.fg, fontSize: 11, fontFamily: FONT_SANS }} />
              )}
              {m.todayIdx != null && chartData[m.todayIdx] && (
                <ReferenceLine x={chartData[m.todayIdx].date} stroke="#1A1716" strokeWidth={1}
                  label={{ value: "Today", position: "insideTopRight", fill: NEUTRAL[950], fontSize: 11, fontWeight: 600, fontFamily: FONT_SANS }} />
              )}
              {m.sprintEndDate && (
                <ReferenceLine x={m.sprintEndDate} stroke="#9CA3AF" strokeWidth={1} strokeDasharray="4 4"
                  label={{ value: "Sprint end", position: "insideTopRight", fill: NEUTRAL[500], fontSize: 11, fontFamily: FONT_SANS }} />
              )}
              <Area type="monotone" dataKey="planned" name="Planned" stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="6 4" fill="none" dot={false} connectNulls />
              <Area type="monotone" dataKey="actual" name="Actual" stroke="#EA580C" strokeWidth={2.5} fill="rgba(234,88,12,0.08)" dot={false} connectNulls />
              <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#EA580C" strokeWidth={1.5} strokeDasharray="6 4" fill="none" dot={false} connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend */}
      <div className="px-5 py-1 flex items-center gap-5 shrink-0">
        <div className="flex items-center gap-1.5">
          <div style={{ width: 14, height: 0, borderTop: "1.5px dashed #9CA3AF" }} />
          <span className="text-xs text-neutral-500">Planned</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ width: 14, height: 0, borderTop: "2.5px solid #EA580C" }} />
          <span className="text-xs text-neutral-500">Actual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ width: 14, height: 0, borderTop: "1.5px dashed #EA580C" }} />
          <span className="text-xs text-neutral-500">Forecast</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2.5 rounded-sm" style={{ background: "rgba(239,68,68,0.12)" }} />
          <span className="text-xs text-neutral-500">Blocked</span>
        </div>
      </div>

      {/* Blocker banner (from API) */}
      {blocker && (
        <div className="mx-5 mb-2 rounded-lg overflow-hidden" style={{ border: "1px solid #E9E5E4", background: "#FBFAFA" }}>
          <div className="flex items-center gap-3 px-4 py-2.5" style={{ borderLeft: "3px solid #EF4444" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "#f5c4b3", color: "#4a1b0c" }}>
              {blocker.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-neutral-950 truncate">{blocker.title}</div>
              <div className="text-xs text-neutral-500 truncate">{blocker.detail}</div>
            </div>
            <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-950 hover:bg-neutral-50 shrink-0">
              Escalate ↗
            </button>
          </div>
        </div>
      )}

      {/* AI footer (from API) */}
      {m.aiInsight && (
        <div className="px-5 pb-3 flex items-start gap-2 shrink-0">
          <span className="text-2xs font-bold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded shrink-0">AI</span>
          <span className="text-xs text-neutral-500">{m.aiInsight}</span>
        </div>
      )}
    </div>
  );
}
