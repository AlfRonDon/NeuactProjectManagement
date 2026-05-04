"use client";

import React from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import { TrendingDown, AlertTriangle } from "lucide-react";

interface BurndownPoint {
  date: string;
  planned: number;
  actual: number;
  annotation?: string;
}

interface BurndownData {
  title: string;
  totalTasks: number;
  points: BurndownPoint[];
  velocity: number; // tasks per day avg
  projectedEndDate?: string;
  annotations: { date: string; label: string; type: "warning" | "info" | "success" }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const annotation = payload[0]?.payload?.annotation;
  return (
    <div style={{ background: "#fff", border: "1px solid #E9E5E4", borderRadius: 8, padding: "8px 12px", fontFamily: "'Geist', sans-serif", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      <div style={{ fontWeight: 600, color: "#1A1716", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", gap: 12 }}>
        <span style={{ color: "#938A89" }}>Planned: <b style={{ color: "#1A1716" }}>{payload[0]?.value}</b></span>
        <span style={{ color: "#938A89" }}>Actual: <b style={{ color: "#6366F1" }}>{payload[1]?.value}</b></span>
      </div>
      {annotation && (
        <div style={{ marginTop: 4, paddingTop: 4, borderTop: "1px solid #E9E5E4", color: "#938A89", fontSize: 11 }}>
          {annotation}
        </div>
      )}
    </div>
  );
};

export default function Burndown({ data }: { data: BurndownData }) {
  const lastPoint = data.points[data.points.length - 1];
  const delta = lastPoint ? lastPoint.actual - lastPoint.planned : 0;
  const isAhead = delta < 0;
  const isBehind = delta > 0;

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-xsmall p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-neutral-400" />
          <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400">
            {data.title}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-neutral-400">
            Velocity: <span className="font-bold text-neutral-600">{data.velocity}/day</span>
          </div>
          {isBehind && (
            <div className="flex items-center gap-1 text-xs text-warn-fg bg-warn-bg px-2 py-0.5 rounded border border-warn-solid/20 font-medium">
              <AlertTriangle className="w-3 h-3" />
              {delta} tasks behind
            </div>
          )}
          {isAhead && (
            <div className="text-xs text-ok-fg bg-ok-bg px-2 py-0.5 rounded border border-ok-solid/20 font-medium">
              {Math.abs(delta)} ahead
            </div>
          )}
        </div>
      </div>

      {data.projectedEndDate && (
        <div className="text-xs text-neutral-400 mb-3">
          Projected completion: <span className="font-medium text-neutral-600">{data.projectedEndDate}</span>
        </div>
      )}

      <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.points} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="plannedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--series-planned)" stopOpacity={0.1} />
              <stop offset="95%" stopColor="var(--series-planned)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--series-1)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--series-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "var(--text-tertiary)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border-subtle)" }}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "var(--text-tertiary)" }}
            tickLine={false}
            axisLine={false}
            domain={[0, data.totalTasks]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="planned"
            stroke="var(--series-planned)"
            strokeWidth={2}
            fill="url(#plannedGrad)"
            strokeDasharray="6 3"
          />
          <Area
            type="monotone"
            dataKey="actual"
            stroke="var(--series-1)"
            strokeWidth={2.5}
            fill="url(#actualGrad)"
          />
          {data.annotations.map((ann) => (
            <ReferenceLine
              key={ann.date}
              x={ann.date}
              stroke={ann.type === "warning" ? "var(--bad-solid)" : ann.type === "success" ? "var(--ok-solid)" : "var(--text-tertiary)"}
              strokeDasharray="4 2"
              label={{
                value: ann.label,
                position: "top",
                fill: "var(--text-secondary)",
                fontSize: 8,
              }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-neutral-100">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-series-planned" style={{ borderTop: "2px dashed var(--series-planned)" }} />
          <span className="text-xs text-neutral-400">Planned</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-series-1" />
          <span className="text-xs text-neutral-400">Actual</span>
        </div>
      </div>
    </div>
  );
}
