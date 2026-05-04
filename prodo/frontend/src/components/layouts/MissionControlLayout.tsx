"use client";

import React, { useState } from "react";
import {
  Gauge, Sparkles,
} from "lucide-react";

import TaskBoard from "@/components/widgets/task-board";
import Burndown from "@/components/widgets/burndown";
import RiskRadar from "@/components/widgets/risk-radar";
import DependencyGraph from "@/components/widgets/dependency-graph";
import PeopleHeatmap from "@/components/widgets/people-heatmap";
import TimelineSwimLanes from "@/components/widgets/timeline-swimlanes";

import { boardTasks, burndownData, riskData, swimData, depGraphData, peopleData } from "./fixtures";

export default function MissionControlLayout() {
  const [widgets, setWidgets] = useState([
    { id: "burn", label: "Burndown", size: "half" },
    { id: "risk", label: "Risk Radar", size: "half" },
    { id: "timeline", label: "Timeline", size: "full" },
    { id: "deps", label: "Dependencies", size: "half" },
    { id: "people", label: "People", size: "half" },
    { id: "board", label: "Board", size: "full" },
  ]);

  const widgetContent: Record<string, React.ReactNode> = {
    burn: <Burndown data={burndownData} />,
    risk: <RiskRadar data={riskData} />,
    timeline: <TimelineSwimLanes data={swimData} />,
    deps: <DependencyGraph data={depGraphData} />,
    people: <PeopleHeatmap data={peopleData} />,
    board: <TaskBoard tasks={boardTasks} />,
  };

  return (
    <div className="h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-neutral-900 flex flex-col">
      {/* Header */}
      <div className="px-5 py-3 border-b border-white/10 flex items-center gap-3">
        <Gauge className="w-5 h-5 text-blue-400" />
        <h3 className="text-sm font-bold text-white">Mission Control</h3>
        <span className="text-xs text-neutral-500">CC v5 — Sprint 12</span>
        <div className="flex-1" />
        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 border border-white/10">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <input placeholder="Ask AI..." className="bg-transparent text-sm text-white outline-none w-48 placeholder-neutral-500" />
        </div>
        <div className="flex gap-1">
          {["live", "1h", "1d", "1w"].map((t) => (
            <button key={t} className={`text-[9px] font-mono px-2 py-1 rounded ${t === "live" ? "bg-green-500/20 text-green-400" : "text-neutral-500 hover:text-neutral-300"}`}>{t}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {widgets.map((w) => (
            <div key={w.id} className={w.size === "full" ? "col-span-2" : ""}>
              {widgetContent[w.id]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
