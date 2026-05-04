"use client";

import React, { useState, useEffect } from "react";
import { Shield, AlertTriangle, TrendingUp, TrendingDown, Clock } from "lucide-react";
import RiskRadar from "@/components/widgets/risk-radar";
import { riskData } from "@/components/layouts/fixtures";
import { PageShell, CARD, SECTION_TITLE, CARD_TITLE_WITH_ICON, PROGRESS_BAR_TRACK, PROGRESS_BAR_FILL } from "@/design";
import { fetchRiskHistory } from "@/lib/api";

const RISK_DETAILS: Record<string, { description: string; mitigation: string; trend: "up" | "down" | "flat" }> = {
  Scope: { description: "Features added mid-sprint. 2 new tasks added in W15 without removing existing work.", mitigation: "Freeze scope for remaining sprint. Defer new requests to next sprint.", trend: "up" },
  Deadline: { description: "4 tasks behind schedule. Phase B slipping may cascade to Phase C and D.", mitigation: "Add parallel track for Phase C prep. Consider reducing Phase D scope.", trend: "up" },
  Resource: { description: "Rohith owns 67% of active tasks. Bus factor is 1 for critical path.", mitigation: "Pair Arjun on Phase B for knowledge transfer. Redistribute 2 tasks to Priya.", trend: "flat" },
  Deps: { description: "Phase C blocked by Phase B. Manageable chain depth but single-threaded.", mitigation: "Identify any Phase C prep work that can start now without Phase B output.", trend: "down" },
  "Tech Debt": { description: "Clean codebase. Minor gaps in test coverage for Phase A.", mitigation: "Schedule test writing in next sprint. No urgent action needed.", trend: "down" },
  External: { description: "vLLM API dependency. Model updates may break guided decoding schema.", mitigation: "Pin vLLM version. Add schema validation tests. Monitor release notes.", trend: "flat" },
};

export default function RisksPage() {
  const [riskHistory, setRiskHistory] = useState<any[]>([]);

  useEffect(() => {
    // Risk history requires project ID — skip if none available
    // Will be empty until a project is selected
  }, []);

  const riskBadgeClass =
    riskData.overallRisk === "high" ? "bg-bad-bg text-bad-fg border border-bad-solid/20" :
    riskData.overallRisk === "medium" ? "bg-warn-bg text-warn-fg border border-warn-solid/20" :
    "bg-ok-bg text-ok-fg border border-ok-solid/20";

  return (
    <PageShell
      title="Risk Assessment"
      contentMode="scroll"
      headerRight={
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${riskBadgeClass}`}>
          {riskData.overallRisk.toUpperCase()} RISK
        </span>
      }
    >
      {/* Radar chart + AI summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className={CARD} style={{ height: "400px" }}>
          <RiskRadar data={riskData} />
        </div>
        <div className={`${CARD} p-5 space-y-4`}>
          <div className={CARD_TITLE_WITH_ICON}>
            <Shield className="w-5 h-5 text-bad-fg" />
            <span className={SECTION_TITLE}>AI Assessment</span>
          </div>
          <p className="text-sm text-neutral-600 leading-relaxed">{riskData.aiSummary}</p>
          <div className="bg-bad-bg rounded-lg border border-bad-solid/20 p-4">
            <div className="text-xs font-bold text-bad-fg uppercase mb-2">Critical Attention Areas</div>
            <div className="space-y-2">
              {riskData.axes.filter(a => a.score > 60).map(a => (
                <div key={a.axis} className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-bad-fg shrink-0" />
                  <span className="text-sm font-medium text-bad-fg">{a.axis}</span>
                  <span className="text-sm text-bad-fg ml-auto font-bold">{a.score}/100</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Per-axis detail cards */}
      <div className="grid grid-cols-2 gap-4">
        {riskData.axes.map(axis => {
          const detail = RISK_DETAILS[axis.axis];
          const TrendIcon = detail?.trend === "up" ? TrendingUp : detail?.trend === "down" ? TrendingDown : TrendingUp;
          const trendColor = detail?.trend === "up" ? "text-bad-fg" : detail?.trend === "down" ? "text-ok-fg" : "text-neutral-400";
          const scoreColor = axis.score > 70 ? "bg-bad-solid" : axis.score > 50 ? "bg-warn-solid" : "bg-ok-solid";
          const scoreBadge = axis.score > 70 ? "bg-bad-bg text-bad-fg" : axis.score > 50 ? "bg-warn-bg text-warn-fg" : "bg-ok-bg text-ok-fg";
          const borderColor = axis.score > 70 ? "border-bad-solid/20" : axis.score > 50 ? "border-warn-solid/20" : "border-neutral-200";

          return (
            <div key={axis.axis} className={`bg-white rounded-lg border p-4 ${borderColor}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={SECTION_TITLE}>{axis.axis}</span>
                <div className="flex-1" />
                <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                <div className={`text-sm font-bold px-2 py-0.5 rounded-lg ${scoreBadge}`}>{axis.score}</div>
              </div>
              <div className={PROGRESS_BAR_TRACK + " mb-3"}>
                <div className={`${PROGRESS_BAR_FILL} ${scoreColor}`} style={{ width: `${axis.score}%` }} />
              </div>
              <div className="text-xs text-neutral-600 mb-2">{axis.description}</div>
              {detail && (
                <>
                  <div className="text-xs text-neutral-500 mb-1">{detail.description}</div>
                  <div className="bg-info-bg rounded-lg p-2 mt-2">
                    <div className="text-xs font-semibold text-info-fg">Mitigation</div>
                    <div className="text-xs text-info-fg mt-0.5">{detail.mitigation}</div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Risk History Audit Trail */}
      {riskHistory.length > 0 && (
        <div className={`${CARD} overflow-hidden`}>
          <div className="px-5 py-3 border-b border-neutral-100">
            <div className={CARD_TITLE_WITH_ICON}>
              <Clock className="w-4 h-4 text-neutral-400" />
              <span className={SECTION_TITLE}>Risk History</span>
              <span className="text-xs text-neutral-400 ml-2">{riskHistory.length} changes</span>
            </div>
          </div>
          <div className="divide-y divide-neutral-100 max-h-64 overflow-y-auto">
            {riskHistory.map((entry: any) => (
              <div key={entry.id} className="px-5 py-3 flex items-center gap-3">
                <div className="text-xs text-neutral-400 shrink-0 w-24">{new Date(entry.created_at).toLocaleDateString()}</div>
                <span className="text-xs font-medium text-neutral-700">{entry.project_name}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                  entry.from_label === "high" ? "bg-bad-bg text-bad-fg" :
                  entry.from_label === "medium" ? "bg-warn-bg text-warn-fg" :
                  "bg-ok-bg text-ok-fg"
                }`}>{entry.from_label}</span>
                <span className="text-xs text-neutral-400">→</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                  entry.to_label === "high" ? "bg-bad-bg text-bad-fg" :
                  entry.to_label === "medium" ? "bg-warn-bg text-warn-fg" :
                  "bg-ok-bg text-ok-fg"
                }`}>{entry.to_label}</span>
                {entry.reason && <span className="text-xs text-neutral-500 flex-1 truncate">{entry.reason}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}
