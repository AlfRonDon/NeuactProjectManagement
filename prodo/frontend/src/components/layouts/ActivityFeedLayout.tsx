"use client";

import React, { useState } from "react";
import {
  Inbox, LayoutGrid, Link2, ChevronRight, Mic, Sparkles,
} from "lucide-react";

import Burndown from "@/components/widgets/burndown";
import RiskRadar from "@/components/widgets/risk-radar";
import DependencyGraph from "@/components/widgets/dependency-graph";
import PeopleHeatmap from "@/components/widgets/people-heatmap";
import TimelineSwimLanes from "@/components/widgets/timeline-swimlanes";

import { burndownData, riskData, depGraphData, peopleData, swimData } from "./fixtures";

export default function ActivityFeedLayout() {
  const [panel, setPanel] = useState<string | null>(null);
  const activities = [
    { id: "a1", time: "2 min ago", type: "status", icon: "\u{1F504}", text: "Rohith moved \"Phase B - Fill/RAG\" to In Progress", tag: "in_progress", taskId: "3" },
    { id: "a2", time: "15 min ago", type: "ai", icon: "\u{1F9E0}", text: "AI Alert: Sprint burndown diverging \u2014 2 tasks behind planned velocity", tag: "warning" },
    { id: "a3", time: "1 hr ago", type: "complete", icon: "\u2705", text: "Arjun completed \"Widget Renderer refactor\" \u2014 moved to Review", tag: "done", taskId: "9" },
    { id: "a4", time: "2 hrs ago", type: "blocked", icon: "\u{1F6AB}", text: "\"Phase C - Grid Pack\" is blocked \u2014 waiting on Phase B dependency", tag: "blocked", taskId: "5" },
    { id: "a5", time: "3 hrs ago", type: "comment", icon: "\u{1F4AC}", text: "Priya commented on \"Gantt chart widget\": \"Zoom/pan working, need to add milestone diamonds\"", taskId: "4" },
    { id: "a6", time: "Yesterday", type: "milestone", icon: "\u{1F3C1}", text: "Milestone \"Alpha Release\" is 12 days away \u2014 60% of tasks still open", tag: "warning" },
    { id: "a7", time: "Yesterday", type: "ai", icon: "\u{1F9E0}", text: "AI Suggestion: Move \"Voice integration\" to next sprint to reduce scope risk", tag: "suggestion" },
    { id: "a8", time: "2 days ago", type: "assign", icon: "\u{1F464}", text: "Rohith assigned \"End-to-end testing\" to Backlog \u2014 no assignee yet" },
  ];

  const panels: Record<string, string> = {
    "burndown": "Burndown", "risk": "Risk", "deps": "Dependencies", "people": "People", "timeline": "Timeline",
  };

  return (
    <div className="flex h-[700px] rounded-lg overflow-hidden border border-neutral-200">
      {/* Thin rail */}
      <div className="w-12 bg-neutral-900 flex flex-col items-center py-3 gap-3 shrink-0">
        <div className="w-7 h-7 rounded bg-blue-500 flex items-center justify-center text-white text-xs font-bold">N</div>
        <div className="w-6 h-px bg-white/10 my-1" />
        {[{ id: "inbox", icon: Inbox }, { id: "board", icon: LayoutGrid }, { id: "timeline", icon: Link2 }].map((n) => {
          const Icon = n.icon;
          return (
            <button key={n.id} className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/10 transition-colors">
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Feed */}
      <div className="flex-1 bg-white flex flex-col">
        {/* Header */}
        <div className="px-5 py-3 border-b flex items-center gap-3">
          <h3 className="text-sm font-serif font-bold text-neutral-950">Activity</h3>
          <span className="text-xs text-neutral-400">CC v5</span>
          <div className="flex-1" />
          {/* Context panels */}
          <div className="flex gap-1">
            {Object.entries(panels).map(([id, label]) => (
              <button key={id} onClick={() => setPanel(panel === id ? null : id)}
                className={`text-[9px] font-medium px-2 py-1 rounded-full border transition-all ${panel === id ? "bg-neutral-900 text-white border-neutral-900" : "text-neutral-400 border-neutral-200 hover:border-neutral-400"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Feed items */}
          <div className={`${panel ? "w-1/2 border-r" : "w-full"} overflow-y-auto transition-all`}>
            {/* AI prompt bar */}
            <div className="px-5 py-3 border-b bg-neutral-50">
              <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <input placeholder={"Ask anything... \"What's blocking the release?\""} className="flex-1 text-xs outline-none placeholder-neutral-400" />
                <Mic className="w-4 h-4 text-neutral-300 cursor-pointer hover:text-blue-500 transition-colors" />
              </div>
            </div>

            <div className="divide-y">
              {activities.map((a) => (
                <div key={a.id} className="px-5 py-3 hover:bg-neutral-50 cursor-pointer transition-colors group">
                  <div className="flex items-start gap-3">
                    <div className="text-base mt-0.5">{a.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-neutral-700 leading-relaxed">{a.text}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-neutral-400">{a.time}</span>
                        {a.tag && (
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                            a.tag === "warning" ? "bg-warn-bg text-warn-fg" :
                            a.tag === "done" ? "bg-ok-bg text-ok-fg" :
                            a.tag === "blocked" ? "bg-bad-bg text-bad-fg" :
                            a.tag === "in_progress" ? "bg-info-bg text-info-fg" :
                            "bg-info-bg text-info-fg"
                          }`}>{a.tag}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Context panel */}
          {panel && (
            <div className="w-1/2 overflow-y-auto p-4 bg-neutral-50">
              {panel === "burndown" && <Burndown data={burndownData} />}
              {panel === "risk" && <RiskRadar data={riskData} />}
              {panel === "deps" && <DependencyGraph data={depGraphData} />}
              {panel === "people" && <PeopleHeatmap data={peopleData} />}
              {panel === "timeline" && <TimelineSwimLanes data={swimData} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
