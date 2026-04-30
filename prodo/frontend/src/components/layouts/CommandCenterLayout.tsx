"use client";

import React, { useState } from "react";
import {
  Home, LayoutGrid, Link2, Layers, GitBranch, TrendingDown, Shield, Users,
  FolderOpen, ChevronDown,
} from "lucide-react";

import TaskBoard from "@/components/widgets/task-board";
import StoryMap from "@/components/widgets/story-map";
import DependencyGraph from "@/components/widgets/dependency-graph";
import Burndown from "@/components/widgets/burndown";
import RiskRadar from "@/components/widgets/risk-radar";
import PeopleHeatmap from "@/components/widgets/people-heatmap";
import TimelineSwimLanes from "@/components/widgets/timeline-swimlanes";

import { boardTasks, burndownData, riskData, peopleData, depGraphData, swimData, storyMapData } from "./fixtures";

export default function CommandCenterLayout() {
  const [view, setView] = useState<string>("overview");
  const nav = [
    { id: "overview", icon: Home, label: "Overview" },
    { id: "board", icon: LayoutGrid, label: "Board" },
    { id: "timeline", icon: Link2, label: "Timeline" },
    { id: "storymap", icon: Layers, label: "Story Map" },
    { id: "deps", icon: GitBranch, label: "Dependencies" },
    { id: "burndown", icon: TrendingDown, label: "Burndown" },
    { id: "risk", icon: Shield, label: "Risk" },
    { id: "people", icon: Users, label: "People" },
  ];

  return (
    <div className="flex h-[700px] rounded-xl overflow-hidden border border-neutral-200">
      {/* Sidebar */}
      <div className="w-48 bg-neutral-900 text-white flex flex-col shrink-0">
        <div className="px-3 py-3 border-b border-white/10 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-[10px] font-bold">N</div>
          <div className="text-[11px] font-bold">Neuact PM</div>
        </div>
        <div className="px-2 py-2 border-b border-white/10">
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-white/10 rounded text-[10px]">
            <FolderOpen className="w-3 h-3 text-neutral-400" />
            <span className="font-medium">CC v5</span>
            <ChevronDown className="w-3 h-3 text-neutral-500 ml-auto" />
          </div>
        </div>
        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
          {nav.map((n) => (
            <button key={n.id} onClick={() => setView(n.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[10px] text-left transition-all ${view === n.id ? "bg-white/15 text-white" : "text-neutral-400 hover:bg-white/5"}`}>
              <n.icon className={`w-3.5 h-3.5 ${view === n.id ? "text-blue-400" : ""}`} />
              {n.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 bg-neutral-50 overflow-y-auto p-4">
        {view === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {[{ l: "Done", v: "2", c: "text-green-600" }, { l: "Active", v: "3", c: "text-amber-600" }, { l: "Todo", v: "2", c: "text-blue-600" }, { l: "Backlog", v: "2", c: "text-neutral-400" }].map((k) => (
                <div key={k.l} className="bg-white rounded-lg border p-3"><div className="text-[9px] text-neutral-400 uppercase font-bold">{k.l}</div><div className={`text-xl font-bold ${k.c}`}>{k.v}</div></div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3"><Burndown data={burndownData} /><RiskRadar data={riskData} /></div>
            <PeopleHeatmap data={peopleData} />
          </div>
        )}
        {view === "board" && <TaskBoard tasks={boardTasks} />}
        {view === "timeline" && <TimelineSwimLanes data={swimData} />}
        {view === "storymap" && <StoryMap data={storyMapData} />}
        {view === "deps" && <DependencyGraph data={depGraphData} />}
        {view === "burndown" && <Burndown data={burndownData} />}
        {view === "risk" && <RiskRadar data={riskData} />}
        {view === "people" && <PeopleHeatmap data={peopleData} />}
      </div>
    </div>
  );
}
