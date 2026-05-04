"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea,
} from "recharts";
import { usePMStore, selectDashboardProjects } from "@/lib/store";

/* ── Types ─────────────────────────────────────────────── */

interface SprintCardProps {
  projectShort?: string;
}

/* ── Fallback chart data ──────────────────────────────── */

const FALLBACK_CHART = [
  { date: "Apr 1", planned: 9, actual: 9 },
  { date: "Apr 3", planned: 8, actual: 8 },
  { date: "Apr 5", planned: 7, actual: 7 },
  { date: "Apr 7", planned: 6, actual: 7 },
  { date: "Apr 9", planned: 5, actual: 6, forecast: 6 },
  { date: "Apr 12", planned: 4, actual: null, forecast: 5 },
  { date: "Apr 16", planned: 2, actual: null, forecast: 3 },
  { date: "Apr 20", planned: 0, actual: null, forecast: 1 },
  { date: "Apr 24", planned: null, actual: null, forecast: 0 },
];

const BLOCKER = {
  title: "Auth integration · Platform team",
  detail: "3 tasks waiting on SSO config · stalled 4 days",
  avatar: "PT",
  avatarBg: "#f5c4b3",
  avatarFg: "#4a1b0c",
};

const AI_INSIGHT = "Resolving the blocker recovers ~2 days. Forecast assumes current pace continues.";

/* ── Tooltip ──────────────────────────────────────────── */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid #E9E5E4", borderRadius: 8,
      padding: "8px 12px", fontFamily: "'Geist', sans-serif", fontSize: 11,
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    }}>
      <div style={{ fontWeight: 600, color: "#1A1716", marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

/* ── Component ────────────────────────────────────────── */

export default function SprintCard({ projectShort = "CCv5" }: SprintCardProps) {
  const projects = usePMStore(selectDashboardProjects);
  const proj = projects.find(p => p.short === projectShort) || projects[0];
  const [chartData, setChartData] = useState(FALLBACK_CHART);
  const [sprintMeta, setSprintMeta] = useState({
    title: "Sprint 12", range: "Apr 1–20", shipDate: "Ships Apr 24",
    lateDays: 4, pace: "0.4/d", paceFrom: "1.2", remaining: "6 tasks", daysLeft: 11,
  });

  // Blocked zone indices (which chart points are in the blocked zone)
  const blockedStart = 2; // Apr 5
  const blockedEnd = 4;   // Apr 9
  const todayIdx = 4;     // Apr 9

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-xsmall flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="px-5 py-3 flex items-end justify-between shrink-0">
        <div>
          <div className="text-xs text-neutral-500">
            {sprintMeta.title} · {sprintMeta.range} · forecast
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xl font-bold text-neutral-950">{sprintMeta.shipDate}</span>
            {sprintMeta.lateDays > 0 && (
              <span className="text-xs font-semibold text-bad-fg bg-bad-bg px-2 py-0.5 rounded-full">
                +{sprintMeta.lateDays} days late
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <div className="text-xs text-neutral-400">Pace</div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-neutral-950">{sprintMeta.pace}</span>
              <span className="text-xs text-neutral-400">↓ from {sprintMeta.paceFrom}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-neutral-400">Remaining</div>
            <span className="text-lg font-bold text-neutral-950">{sprintMeta.remaining}</span>
          </div>
          <div className="text-right">
            <div className="text-xs text-neutral-400">Days left</div>
            <span className="text-lg font-bold text-neutral-950">{sprintMeta.daysLeft}</span>
          </div>
        </div>
      </div>

      {/* ── Burndown Chart ── */}
      <div className="flex-1 min-h-0 px-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E9E5E4" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fontFamily: "'Geist', sans-serif", fill: "#938A89" }}
              tickLine={false}
              axisLine={{ stroke: "#E9E5E4" }}
            />
            <YAxis
              tick={{ fontSize: 11, fontFamily: "'Geist', sans-serif", fill: "#938A89" }}
              tickLine={false}
              axisLine={false}
              domain={[0, 9]}
              ticks={[0, 3, 6, 9]}
            />
            <Tooltip content={<ChartTooltip />} />

            {/* Blocked zone */}
            <ReferenceArea
              x1={chartData[blockedStart]?.date}
              x2={chartData[blockedEnd]?.date}
              fill="rgba(239,68,68,0.08)"
              stroke="none"
              label={{ value: "blocked", position: "insideTop", fill: "#991B1B", fontSize: 11, fontFamily: "'Geist', sans-serif" }}
            />

            {/* Today line */}
            <ReferenceLine
              x={chartData[todayIdx]?.date}
              stroke="#1A1716"
              strokeWidth={1}
              strokeDasharray="none"
              label={{ value: "Today", position: "insideTopRight", fill: "#1A1716", fontSize: 11, fontWeight: 600, fontFamily: "'Geist', sans-serif" }}
            />

            {/* Sprint end line */}
            <ReferenceLine
              x="Apr 20"
              stroke="#938A89"
              strokeWidth={1}
              strokeDasharray="4 4"
              label={{ value: "Sprint end", position: "insideTopRight", fill: "#938A89", fontSize: 11, fontFamily: "'Geist', sans-serif" }}
            />

            {/* Planned line (dashed grey) */}
            <Area
              type="monotone" dataKey="planned" name="Planned"
              stroke="#938A89" strokeWidth={1.5} strokeDasharray="6 4"
              fill="none" dot={false} connectNulls
            />

            {/* Actual line (solid orange) */}
            <Area
              type="monotone" dataKey="actual" name="Actual"
              stroke="#EA580C" strokeWidth={2.5}
              fill="rgba(234,88,12,0.08)" dot={false} connectNulls
            />

            {/* Forecast line (dashed orange) */}
            <Area
              type="monotone" dataKey="forecast" name="Forecast"
              stroke="#EA580C" strokeWidth={1.5} strokeDasharray="6 4"
              fill="none" dot={false} connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Legend ── */}
      <div className="px-5 py-1 flex items-center gap-5 shrink-0">
        <div className="flex items-center gap-1.5">
          <div style={{ width: 14, height: 0, borderTop: "1.5px dashed #938A89" }} />
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

      {/* ── Blocker banner ── */}
      <div className="mx-5 mb-2 rounded-lg overflow-hidden" style={{ border: "1px solid #E9E5E4", background: "#FBFAFA" }}>
        <div className="flex items-center gap-3 px-4 py-2.5" style={{ borderLeft: "3px solid #EF4444" }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: BLOCKER.avatarBg, color: BLOCKER.avatarFg }}
          >
            {BLOCKER.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-neutral-950">{BLOCKER.title}</div>
            <div className="text-xs text-neutral-500">{BLOCKER.detail}</div>
          </div>
          <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-950 hover:bg-neutral-50 shrink-0">
            Escalate ↗
          </button>
        </div>
      </div>

      {/* ── AI footer ── */}
      <div className="px-5 pb-3 flex items-start gap-2 shrink-0">
        <span className="text-2xs font-bold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded shrink-0">AI</span>
        <span className="text-xs text-neutral-500">{AI_INSIGHT}</span>
      </div>
    </div>
  );
}
