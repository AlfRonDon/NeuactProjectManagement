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
import {
  RISK_COLOR_HEX, CHART_TOOLTIP_STYLE, NEUTRAL, STATUS_HEX, FONT_SANS, FONT_MONO,
} from "@/design";

interface RiskAxis {
  axis: string;
  score: number;
  description: string;
}

interface RiskRadarData {
  projectName: string;
  overallRisk: "low" | "medium" | "high" | "critical";
  axes: RiskAxis[];
  aiSummary: string;
}

const RISK_COLOR: Record<string, { fill: string; stroke: string; bg: string; text: string }> = {
  low:      { ...RISK_COLOR_HEX.low,      bg: "bg-ok-bg",   text: "text-ok-fg" },
  medium:   { ...RISK_COLOR_HEX.medium,   bg: "bg-warn-bg", text: "text-warn-fg" },
  high:     { ...RISK_COLOR_HEX.high,     bg: "bg-hot-bg",  text: "text-hot-fg" },
  critical: { ...RISK_COLOR_HEX.critical, bg: "bg-bad-bg",  text: "text-bad-fg" },
};

/* CMD-style tooltip — white, subtle border, Geist font */
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  return (
    <div style={{ ...CHART_TOOLTIP_STYLE, fontSize: 12, maxWidth: 200 }}>
      <div style={{ fontWeight: 600, color: NEUTRAL[950], marginBottom: 4 }}>{data?.axis}</div>
      <div style={{ fontFamily: FONT_MONO, color: NEUTRAL[950], marginBottom: 4 }}>Score: <b>{data?.score}</b>/100</div>
      <div style={{ color: NEUTRAL[500], fontSize: 11 }}>{data?.description}</div>
    </div>
  );
};

/* Radar label tick — matches Sprint Diagnostic style: pushed outward, semibold, warm colors */
function RiskRadarTick(props: any) {
  const { x, y, payload, cx: chartCx, cy: chartCy, data } = props;
  const axis = data?.find((d: any) => d.axis === payload.value);
  const score = axis?.score ?? 0;
  // High scores = warm/red, low = green/muted
  const fill = score >= 70 ? STATUS_HEX.bad.fg : score >= 50 ? NEUTRAL[950] : NEUTRAL[700];
  const dx = x - chartCx;
  const dy = y - chartCy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const push = 8 + Math.abs(dx / len) * 18;
  const lx = x + (dx / len) * push;
  const ly = y + (dy / len) * push;

  return (
    <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
      fill={fill} fontSize={11} fontWeight={600} fontFamily={FONT_SANS}>
      {payload.value}
    </text>
  );
}

export default function RiskRadar({ data }: { data: RiskRadarData }) {
  const colors = RISK_COLOR[data.overallRisk] || RISK_COLOR.medium;
  const highRisks = data.axes.filter((a) => a.score >= 70);

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-xsmall p-4 h-full flex flex-col">
      {/* Header — same style as Sprint Diagnostic */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-base font-serif font-semibold text-neutral-950">Risk Radar</span>
          <span className="text-sm text-neutral-500">· {data.projectName}</span>
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${colors.bg} ${colors.text}`}>
          {data.overallRisk === "low" || data.overallRisk === "medium" ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <AlertTriangle className="w-3 h-3" />
          )}
          {data.overallRisk} risk
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
        {/* Radar chart — matches Sprint Diagnostic: no tick numbers, warm grid, pushed labels */}
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data.axes} cx="50%" cy="50%" outerRadius="65%">
            <PolarGrid stroke="#E9E5E4" strokeWidth={0.8} />
            <PolarAngleAxis
              dataKey="axis"
              tick={(tickProps: any) => <RiskRadarTick {...tickProps} data={data.axes} />}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              dataKey="score"
              stroke={colors.stroke}
              fill={colors.fill}
              strokeWidth={2.5}
              dot={{ r: 4, fill: colors.stroke, stroke: "none" }}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>

        {/* Right side — AI + scores */}
        <div className="flex flex-col justify-center gap-2">
          {/* AI Summary */}
          <div className="bg-neutral-50 rounded-lg border border-neutral-100 p-3">
            <div className="text-xs uppercase font-bold tracking-widest text-neutral-500 mb-1">
              AI Assessment
            </div>
            <p className="text-sm text-neutral-700 leading-relaxed">
              {data.aiSummary}
            </p>
          </div>

          {/* High risk axes */}
          {highRisks.length > 0 && (
            <div>
              <div className="text-xs uppercase font-bold tracking-widest text-bad-solid mb-1.5">
                Attention Areas
              </div>
              <div className="space-y-1">
                {highRisks.map((r) => (
                  <div key={r.axis}
                    className="flex items-center justify-between bg-bad-bg rounded-lg px-3 py-1.5 border border-bad-solid/20">
                    <span className="text-sm font-semibold text-bad-fg">{r.axis}</span>
                    <span className="text-sm font-mono font-bold text-bad-fg">{r.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lower scores — bar chart style */}
          <div className="space-y-1">
            {data.axes
              .filter((a) => a.score < 70)
              .map((a) => (
                <div key={a.axis} className="flex items-center gap-2">
                  <span className="text-sm text-neutral-500 w-20 truncate">{a.axis}</span>
                  <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${a.score}%`,
                        backgroundColor: a.score > 50 ? STATUS_HEX.warn.solid : STATUS_HEX.ok.solid,
                      }}
                    />
                  </div>
                  <span className="text-sm font-mono text-neutral-500 w-6 text-right">{a.score}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
