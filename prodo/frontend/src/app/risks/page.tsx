"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import RiskRadar from "@/components/widgets/risk-radar";
import { riskData } from "@/components/layouts/fixtures";
import UserAvatar from "@/components/UserAvatar";

const RISK_DETAILS: Record<string, { description: string; mitigation: string; trend: "up" | "down" | "flat" }> = {
  Scope: { description: "Features added mid-sprint. 2 new tasks added in W15 without removing existing work.", mitigation: "Freeze scope for remaining sprint. Defer new requests to next sprint.", trend: "up" },
  Deadline: { description: "4 tasks behind schedule. Phase B slipping may cascade to Phase C and D.", mitigation: "Add parallel track for Phase C prep. Consider reducing Phase D scope.", trend: "up" },
  Resource: { description: "Rohith owns 67% of active tasks. Bus factor is 1 for critical path.", mitigation: "Pair Arjun on Phase B for knowledge transfer. Redistribute 2 tasks to Priya.", trend: "flat" },
  Deps: { description: "Phase C blocked by Phase B. Manageable chain depth but single-threaded.", mitigation: "Identify any Phase C prep work that can start now without Phase B output.", trend: "down" },
  "Tech Debt": { description: "Clean codebase. Minor gaps in test coverage for Phase A.", mitigation: "Schedule test writing in next sprint. No urgent action needed.", trend: "down" },
  External: { description: "vLLM API dependency. Model updates may break guided decoding schema.", mitigation: "Pin vLLM version. Add schema validation tests. Monitor release notes.", trend: "flat" },
};

export default function RisksPage() {
  return (
    <div className="h-screen bg-neutral-100 overflow-hidden flex flex-col">
      <div className="bg-white border-b border-neutral-200 px-5 py-2 flex items-center gap-3 shrink-0">
        <Link href="/" className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-neutral-500" />
        </Link>
        <div className="w-6 h-6 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-xs font-bold shrink-0">N</div>
        <span className="text-sm font-semibold text-neutral-700">Risk Assessment</span>
        <div className="flex-1" />
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
          riskData.overallRisk === "high" ? "bg-red-50 text-red-600 border border-red-200" :
          riskData.overallRisk === "medium" ? "bg-amber-50 text-amber-600 border border-amber-200" :
          "bg-green-50 text-green-600 border border-green-200"
        }`}>{riskData.overallRisk.toUpperCase()} RISK</span>
        <UserAvatar />
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Radar chart + AI summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-neutral-200" style={{ height: "400px" }}>
            <RiskRadar data={riskData} />
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-500" />
              <span className="text-sm font-bold text-neutral-900">AI Assessment</span>
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed">{riskData.aiSummary}</p>
            <div className="bg-red-50 rounded-xl border border-red-200 p-4">
              <div className="text-xs font-bold text-red-700 uppercase mb-2">Critical Attention Areas</div>
              <div className="space-y-2">
                {riskData.axes.filter(a => a.score > 60).map(a => (
                  <div key={a.axis} className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span className="text-sm font-medium text-red-800">{a.axis}</span>
                    <span className="text-sm text-red-600 ml-auto font-bold">{a.score}/100</span>
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
            const trendColor = detail?.trend === "up" ? "text-red-500" : detail?.trend === "down" ? "text-green-500" : "text-neutral-400";
            return (
              <div key={axis.axis} className={`bg-white rounded-xl border p-4 ${axis.score > 70 ? "border-red-200" : axis.score > 50 ? "border-amber-200" : "border-neutral-200"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-neutral-900">{axis.axis}</span>
                  <div className="flex-1" />
                  <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                  <div className={`text-sm font-bold px-2 py-0.5 rounded-lg ${
                    axis.score > 70 ? "bg-red-50 text-red-600" : axis.score > 50 ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"
                  }`}>{axis.score}</div>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-neutral-100 rounded-full mb-3">
                  <div className={`h-full rounded-full ${axis.score > 70 ? "bg-red-500" : axis.score > 50 ? "bg-amber-400" : "bg-green-400"}`} style={{ width: `${axis.score}%` }} />
                </div>
                <div className="text-xs text-neutral-600 mb-2">{axis.description}</div>
                {detail && (
                  <>
                    <div className="text-xs text-neutral-500 mb-1">{detail.description}</div>
                    <div className="bg-blue-50 rounded-lg p-2 mt-2">
                      <div className="text-xs font-semibold text-blue-700">Mitigation</div>
                      <div className="text-xs text-blue-600 mt-0.5">{detail.mitigation}</div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
