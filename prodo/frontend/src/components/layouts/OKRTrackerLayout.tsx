"use client";

import React, { useState } from "react";
import {
  Target, TrendingUp, ChevronDown, ChevronRight, CheckCircle2, Circle, Minus,
  BarChart3,
} from "lucide-react";

interface KeyResult {
  id: string;
  title: string;
  progress: number;
  confidence: number; // 0-100
  target: string;
  current: string;
  linkedTasks: { title: string; status: "done" | "in_progress" | "todo" }[];
}

interface Objective {
  id: string;
  title: string;
  owner: string;
  quarter: string;
  keyResults: KeyResult[];
}

const objectives: Objective[] = [
  {
    id: "o1", title: "Launch CC v5 Alpha with AI-powered dashboards", owner: "Rohith", quarter: "Q2 2026",
    keyResults: [
      { id: "kr1", title: "Pipeline v4.2 processes 100 dashboards under 5s each", progress: 65, confidence: 72, target: "100 dashboards", current: "65 dashboards",
        linkedTasks: [{ title: "Phase A - Understand", status: "done" }, { title: "Phase B - Fill/RAG", status: "in_progress" }, { title: "Phase C - Grid Pack", status: "todo" }] },
      { id: "kr2", title: "Widget rendering covers all 8 chart types", progress: 75, confidence: 85, target: "8 types", current: "6 types",
        linkedTasks: [{ title: "Widget Renderer refactor", status: "in_progress" }, { title: "Gantt chart widget", status: "in_progress" }] },
      { id: "kr3", title: "Voice interaction achieves 90% intent accuracy", progress: 30, confidence: 45, target: "90% accuracy", current: "68% accuracy",
        linkedTasks: [{ title: "Voice integration", status: "todo" }, { title: "STT eval", status: "done" }] },
    ],
  },
  {
    id: "o2", title: "Reduce project delivery risk across all active projects", owner: "Priya", quarter: "Q2 2026",
    keyResults: [
      { id: "kr4", title: "Zero critical blockers open for more than 48h", progress: 40, confidence: 55, target: "0 stale blockers", current: "2 stale blockers",
        linkedTasks: [{ title: "Deploy pipeline fix", status: "in_progress" }, { title: "API dependency resolution", status: "todo" }] },
      { id: "kr5", title: "All projects have bus factor >= 2", progress: 33, confidence: 40, target: "Bus factor 2+", current: "1 of 3 projects",
        linkedTasks: [{ title: "Cross-train Arjun on ML pipeline", status: "todo" }, { title: "Document architecture decisions", status: "in_progress" }] },
      { id: "kr6", title: "Sprint velocity deviation under 15%", progress: 80, confidence: 88, target: "<15% deviation", current: "12% deviation",
        linkedTasks: [{ title: "Estimation calibration", status: "done" }, { title: "Sprint planning v2", status: "done" }] },
    ],
  },
  {
    id: "o3", title: "Establish automated quality gates for continuous delivery", owner: "Arjun", quarter: "Q2 2026",
    keyResults: [
      { id: "kr7", title: "E2E test coverage reaches 80% of critical paths", progress: 20, confidence: 50, target: "80% coverage", current: "16% coverage",
        linkedTasks: [{ title: "E2E testing framework", status: "todo" }, { title: "Playwright setup", status: "todo" }] },
      { id: "kr8", title: "CI pipeline runs under 10 minutes", progress: 90, confidence: 95, target: "<10 min", current: "8.5 min",
        linkedTasks: [{ title: "CI optimization", status: "done" }, { title: "Parallel test runner", status: "done" }] },
      { id: "kr9", title: "Zero production incidents from untested code", progress: 100, confidence: 92, target: "0 incidents", current: "0 incidents",
        linkedTasks: [{ title: "Pre-deploy checklist", status: "done" }] },
    ],
  },
];

const confidenceColor = (c: number) => c >= 80 ? "text-green-400" : c >= 50 ? "text-amber-400" : "text-red-400";
const confidenceBg = (c: number) => c >= 80 ? "bg-green-500" : c >= 50 ? "bg-amber-500" : "bg-red-500";
const statusIcon = (s: string) => s === "done" ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : s === "in_progress" ? <Circle className="w-3 h-3 text-amber-400" /> : <Minus className="w-3 h-3 text-neutral-500" />;

export default function OKRTrackerLayout() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ o1: true, o2: false, o3: false });

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const objectiveProgress = (obj: Objective) => Math.round(obj.keyResults.reduce((a, kr) => a + kr.progress, 0) / obj.keyResults.length);
  const objectiveConfidence = (obj: Objective) => Math.round(obj.keyResults.reduce((a, kr) => a + kr.confidence, 0) / obj.keyResults.length);

  return (
    <div className="h-[700px] rounded-xl overflow-hidden border border-neutral-200 bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center gap-3">
        <Target className="w-5 h-5 text-violet-500" />
        <h3 className="text-sm font-bold text-neutral-900">OKR Tracker</h3>
        <span className="text-[10px] text-neutral-400">Q2 2026</span>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-[10px] text-neutral-500">Avg progress: <span className="font-bold text-neutral-800">{Math.round(objectives.reduce((a, o) => a + objectiveProgress(o), 0) / objectives.length)}%</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-[10px] text-neutral-500">Avg confidence: <span className="font-bold text-neutral-800">{Math.round(objectives.reduce((a, o) => a + objectiveConfidence(o), 0) / objectives.length)}%</span></span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {objectives.map((obj) => {
          const prog = objectiveProgress(obj);
          const conf = objectiveConfidence(obj);
          const isOpen = expanded[obj.id];

          return (
            <div key={obj.id} className="bg-neutral-50 rounded-xl border border-neutral-200 overflow-hidden">
              {/* Objective header */}
              <button onClick={() => toggle(obj.id)}
                className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-neutral-100 transition-colors">
                {isOpen ? <ChevronDown className="w-4 h-4 text-neutral-400 mt-0.5" /> : <ChevronRight className="w-4 h-4 text-neutral-400 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-neutral-900">{obj.title}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{obj.owner} &middot; {obj.quarter}</div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-lg font-bold text-neutral-900">{prog}%</div>
                    <div className="text-[8px] uppercase text-neutral-400">Progress</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${confidenceColor(conf)}`}>{conf}%</div>
                    <div className="text-[8px] uppercase text-neutral-400">Confidence</div>
                  </div>
                  <div className="w-24 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${confidenceBg(conf)}`} style={{ width: `${prog}%` }} />
                  </div>
                </div>
              </button>

              {/* Key results */}
              {isOpen && (
                <div className="border-t border-neutral-200">
                  {obj.keyResults.map((kr, i) => (
                    <div key={kr.id} className={`px-5 py-4 ${i < obj.keyResults.length - 1 ? "border-b border-neutral-100" : ""}`}>
                      <div className="flex items-start gap-3 ml-7">
                        <div className="flex-1">
                          <div className="text-xs font-medium text-neutral-800">{kr.title}</div>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${confidenceBg(kr.confidence)}`} style={{ width: `${kr.progress}%` }} />
                            </div>
                            <span className="text-xs font-bold text-neutral-700 tabular-nums w-10 text-right">{kr.progress}%</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-[10px] text-neutral-500">
                            <span>Target: <span className="text-neutral-700 font-medium">{kr.target}</span></span>
                            <span>Current: <span className="text-neutral-700 font-medium">{kr.current}</span></span>
                            <span>Confidence: <span className={`font-bold ${confidenceColor(kr.confidence)}`}>{kr.confidence}%</span></span>
                          </div>
                          {/* Linked tasks */}
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {kr.linkedTasks.map((lt) => (
                              <span key={lt.title} className="inline-flex items-center gap-1 text-[9px] bg-white border border-neutral-200 rounded-full px-2 py-0.5">
                                {statusIcon(lt.status)}
                                <span className="text-neutral-600">{lt.title}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
