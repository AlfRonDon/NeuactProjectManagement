"use client";

import React from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Shield, AlertTriangle, CheckCircle2 } from "lucide-react";

interface RiskAxis {
  axis: string;
  score: number; // 0-100
  description: string;
}

interface RiskRadarData {
  projectName: string;
  overallRisk: "low" | "medium" | "high" | "critical";
  axes: RiskAxis[];
  aiSummary: string;
}

const RISK_COLOR: Record<string, { fill: string; stroke: string; bg: string; text: string }> = {
  low: { fill: "rgba(34, 197, 94, 0.15)", stroke: "#22c55e", bg: "bg-green-50", text: "text-green-700" },
  medium: { fill: "rgba(234, 179, 8, 0.15)", stroke: "#eab308", bg: "bg-yellow-50", text: "text-yellow-700" },
  high: { fill: "rgba(249, 115, 22, 0.15)", stroke: "#f97316", bg: "bg-orange-50", text: "text-orange-700" },
  critical: { fill: "rgba(239, 68, 68, 0.2)", stroke: "#ef4444", bg: "bg-red-50", text: "text-red-700" },
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  return (
    <div className="bg-neutral-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-neutral-800 max-w-[200px]">
      <div className="font-bold mb-1">{data?.axis}</div>
      <div className="text-amber-400 mb-1">Score: {data?.score}/100</div>
      <div className="text-neutral-300">{data?.description}</div>
    </div>
  );
};

export default function RiskRadar({ data }: { data: RiskRadarData }) {
  const colors = RISK_COLOR[data.overallRisk] || RISK_COLOR.medium;
  const highRisks = data.axes.filter((a) => a.score >= 70);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-neutral-400" />
          <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400">
            Risk Radar — {data.projectName}
          </h3>
        </div>
        <div
          className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded border ${colors.bg} ${colors.text}`}
        >
          {data.overallRisk === "low" || data.overallRisk === "medium" ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <AlertTriangle className="w-3 h-3" />
          )}
          {data.overallRisk} risk
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data.axes} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="#e5e5e5" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fontSize: 11, fill: "#737373" }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#a3a3a3" }}
              tickCount={5}
            />
            <Radar
              dataKey="score"
              stroke={colors.stroke}
              fill={colors.fill}
              strokeWidth={2}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>

        <div className="flex flex-col justify-center">
          {/* AI Summary */}
          <div className="bg-neutral-50 rounded-lg border border-neutral-100 p-3 mb-3">
            <div className="text-xs uppercase font-bold tracking-widest text-neutral-400 mb-1.5">
              AI Assessment
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              {data.aiSummary}
            </p>
          </div>

          {/* High risk axes */}
          {highRisks.length > 0 && (
            <div>
              <div className="text-xs uppercase font-bold tracking-widest text-red-400 mb-2">
                Attention Areas
              </div>
              <div className="space-y-1.5">
                {highRisks.map((r) => (
                  <div
                    key={r.axis}
                    className="flex items-center justify-between bg-red-50 rounded px-2.5 py-1.5 border border-red-100"
                  >
                    <span className="text-xs font-medium text-red-700">
                      {r.axis}
                    </span>
                    <span className="text-xs font-bold text-red-600">
                      {r.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All scores */}
          <div className="mt-3 space-y-1">
            {data.axes
              .filter((a) => a.score < 70)
              .map((a) => (
                <div key={a.axis} className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 w-24 truncate">
                    {a.axis}
                  </span>
                  <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${a.score}%`,
                        backgroundColor:
                          a.score > 50 ? "#f59e0b" : "#22c55e",
                      }}
                    />
                  </div>
                  <span className="text-xs text-neutral-400 w-6 text-right">
                    {a.score}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
