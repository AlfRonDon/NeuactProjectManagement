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
    <div className="bg-neutral-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-neutral-800">
      <div className="font-bold mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <span className="text-blue-400">Planned: {payload[0]?.value}</span>
        <span className="text-amber-400">Actual: {payload[1]?.value}</span>
      </div>
      {annotation && (
        <div className="mt-1 pt-1 border-t border-neutral-700 text-neutral-300">
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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-full flex flex-col">
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
            <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-medium">
              <AlertTriangle className="w-3 h-3" />
              {delta} tasks behind
            </div>
          )}
          {isAhead && (
            <div className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100 font-medium">
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
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "#a3a3a3" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e5e5" }}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "#a3a3a3" }}
            tickLine={false}
            axisLine={false}
            domain={[0, data.totalTasks]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="planned"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#plannedGrad)"
            strokeDasharray="6 3"
          />
          <Area
            type="monotone"
            dataKey="actual"
            stroke="#f59e0b"
            strokeWidth={2.5}
            fill="url(#actualGrad)"
          />
          {data.annotations.map((ann) => (
            <ReferenceLine
              key={ann.date}
              x={ann.date}
              stroke={ann.type === "warning" ? "#ef4444" : ann.type === "success" ? "#22c55e" : "#a3a3a3"}
              strokeDasharray="4 2"
              label={{
                value: ann.label,
                position: "top",
                fill: "#737373",
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
          <div className="w-4 h-0.5 bg-blue-500" style={{ borderTop: "2px dashed #3b82f6" }} />
          <span className="text-xs text-neutral-400">Planned</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-amber-500" />
          <span className="text-xs text-neutral-400">Actual</span>
        </div>
      </div>
    </div>
  );
}
