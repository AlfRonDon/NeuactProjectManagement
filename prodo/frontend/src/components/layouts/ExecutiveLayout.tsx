"use client";

import React, { useState } from "react";
import {
  Briefcase, CheckCircle2, AlertTriangle, X, Flame,
} from "lucide-react";

import PeopleHeatmap from "@/components/widgets/people-heatmap";

import { peopleData } from "./fixtures";

function ExecutiveLayout() {
  const projects = [
    { name: "Command Center v5", health: "at-risk", progress: 20, risk: 85, milestone: "Alpha — May 15", tasks: 10, done: 2, blockers: 2, lead: "Rohith" },
    { name: "NeuactReport v3", health: "on-track", progress: 55, risk: 35, milestone: "MVP — May 1", tasks: 6, done: 3, blockers: 0, lead: "Priya" },
    { name: "Spot Particle Engine", health: "on-track", progress: 67, risk: 20, milestone: "v1.0 — Apr 30", tasks: 6, done: 4, blockers: 0, lead: "Arjun" },
    { name: "Data Pipeline v2", health: "blocked", progress: 10, risk: 92, milestone: "Prototype — May 20", tasks: 8, done: 1, blockers: 3, lead: "Meera" },
  ];

  const healthColor: Record<string, { bg: string; text: string; dot: string }> = {
    "on-track": { bg: "bg-ok-bg", text: "text-ok-fg", dot: "bg-ok-solid" },
    "at-risk": { bg: "bg-warn-bg", text: "text-warn-fg", dot: "bg-warn-solid" },
    "blocked": { bg: "bg-bad-bg", text: "text-bad-fg", dot: "bg-bad-solid animate-pulse" },
  };

  return (
    <div className="h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-neutral-950 flex flex-col text-white">
      <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
        <Briefcase className="w-5 h-5 text-blue-400" />
        <h3 className="text-sm font-bold">Portfolio Overview</h3>
        <span className="text-xs text-neutral-500">4 active projects</span>
        <div className="flex-1" />
        <span className="text-xs text-neutral-500">Last updated 2 min ago</span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Summary row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "On Track", value: "2", color: "text-ok-solid", icon: CheckCircle2 },
            { label: "At Risk", value: "1", color: "text-warn-solid", icon: AlertTriangle },
            { label: "Blocked", value: "1", color: "text-bad-solid", icon: X },
            { label: "Total Blockers", value: "5", color: "text-bad-solid", icon: Flame },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 rounded-lg border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-[9px] uppercase tracking-widest text-neutral-500">{s.label}</span>
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Project cards */}
        <div className="grid grid-cols-2 gap-3">
          {projects.map((p) => {
            const h = healthColor[p.health];
            return (
              <div key={p.name} className="bg-white/5 rounded-lg border border-white/10 p-5 hover:bg-white/[0.07] transition-colors cursor-pointer group">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${h.dot}`} />
                  <h4 className="text-sm font-bold text-white">{p.name}</h4>
                  <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ml-auto ${h.bg} ${h.text}`}>{p.health}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-white/10 rounded-full mb-3 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${p.health === "blocked" ? "bg-bad-solid" : p.health === "at-risk" ? "bg-warn-solid" : "bg-ok-solid"}`} style={{ width: `${p.progress}%` }} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><div className="text-lg font-bold">{p.progress}%</div><div className="text-[8px] text-neutral-500 uppercase">Progress</div></div>
                  <div><div className="text-lg font-bold">{p.done}/{p.tasks}</div><div className="text-[8px] text-neutral-500 uppercase">Tasks</div></div>
                  <div><div className={`text-lg font-bold ${p.blockers > 0 ? "text-bad-fg" : "text-ok-fg"}`}>{p.blockers}</div><div className="text-[8px] text-neutral-500 uppercase">Blockers</div></div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-neutral-400">{p.milestone}</span>
                  <span className="text-xs text-neutral-500">Lead: {p.lead}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resource overview */}
        <PeopleHeatmap data={peopleData} />
      </div>
    </div>
  );
}

export default ExecutiveLayout;
