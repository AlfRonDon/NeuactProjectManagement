"use client";

import React, { useState } from "react";
import {
  Siren, Clock, GitBranch, AlertTriangle, Activity, TrendingDown, Flame,
} from "lucide-react";

import DependencyGraph from "@/components/widgets/dependency-graph";
import Burndown from "@/components/widgets/burndown";
import TimelineSwimLanes from "@/components/widgets/timeline-swimlanes";

import { boardTasks, depGraphData, burndownData, swimData } from "./fixtures";

function WarRoomLayout() {
  const criticalTasks = boardTasks.filter((t) => t.priority === "critical" || (t.depends_on && t.depends_on.length > 0 && t.status !== "done"));
  const blockedCount = boardTasks.filter((t) => t.depends_on.length > 0 && t.status !== "done").length;
  const daysToAlpha = 36;

  return (
    <div className="h-[700px] rounded-xl overflow-hidden border border-red-900/50 bg-neutral-950 flex flex-col text-white">
      {/* Emergency header */}
      <div className="px-5 py-3 bg-red-950/50 border-b border-red-900/50 flex items-center gap-3">
        <Siren className="w-5 h-5 text-red-400 animate-pulse" />
        <h3 className="text-sm font-bold text-red-300">WAR ROOM — Alpha Release</h3>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-red-500/20 px-3 py-1 rounded-full border border-red-500/30">
            <Clock className="w-3 h-3 text-red-400" />
            <span className="text-xs font-bold text-red-300 tabular-nums">{daysToAlpha}d to Alpha</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] text-red-400">LIVE</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status strip */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Critical Path", value: "6 tasks", icon: GitBranch, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
            { label: "Blocked", value: `${blockedCount}`, icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
            { label: "Velocity", value: "1.2/day", icon: Activity, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
            { label: "Burndown Gap", value: "+2 tasks", icon: TrendingDown, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
          ].map((s) => (
            <div key={s.label} className={`rounded-lg border p-3 ${s.bg}`}>
              <div className="flex items-center gap-1.5"><s.icon className={`w-3.5 h-3.5 ${s.color}`} /><span className="text-[9px] uppercase tracking-widest text-neutral-500">{s.label}</span></div>
              <div className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Two column: deps + burndown */}
        <div className="grid grid-cols-2 gap-3">
          <DependencyGraph data={depGraphData} />
          <Burndown data={burndownData} />
        </div>

        {/* Critical task list */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="text-[9px] uppercase font-bold tracking-widest text-red-400 mb-3 flex items-center gap-2">
            <Flame className="w-3.5 h-3.5" /> Critical & Blocked Tasks
          </div>
          <div className="space-y-2">
            {criticalTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2 border border-white/5 hover:border-red-500/30 transition-colors cursor-pointer">
                <div className={`w-2 h-2 rounded-full shrink-0 ${t.status === "done" ? "bg-green-500" : t.priority === "critical" ? "bg-red-500 animate-pulse" : "bg-amber-400"}`} />
                <span className="text-xs font-medium text-white flex-1">{t.title}</span>
                <span className="text-[9px] text-neutral-500">{t.assignee || "Unassigned"}</span>
                {t.depends_on.length > 0 && <span className="text-[8px] text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded">BLOCKED</span>}
                <span className="text-[9px] text-neutral-500">{t.due_date}</span>
              </div>
            ))}
          </div>
        </div>

        <TimelineSwimLanes data={swimData} />
      </div>
    </div>
  );
}

export default WarRoomLayout;
