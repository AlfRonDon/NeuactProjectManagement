"use client";

import React, { useState } from "react";
import {
  Filter, Search, MoreHorizontal,
} from "lucide-react";

import Burndown from "@/components/widgets/burndown";
import DependencyGraph from "@/components/widgets/dependency-graph";
import TimelineSwimLanes from "@/components/widgets/timeline-swimlanes";

import { boardTasks, burndownData, depGraphData, swimData } from "./fixtures";

export default function SplitPaneLayout() {
  const [selected, setSelected] = useState<string>("3");
  const [rightTab, setRightTab] = useState<"detail" | "deps" | "timeline">("detail");
  const task = boardTasks.find((t) => t.id === selected);

  const statusColors: Record<string, string> = {
    done: "bg-ok-solid", in_progress: "bg-warn-solid", in_review: "bg-info-solid", todo: "bg-info-solid", backlog: "bg-neutral-300",
  };

  return (
    <div className="flex h-[700px] rounded-lg overflow-hidden border border-neutral-200">
      {/* Left: task list */}
      <div className="w-[340px] bg-white border-r flex flex-col shrink-0">
        <div className="px-4 py-3 border-b flex items-center gap-2">
          <h3 className="text-sm font-serif font-bold text-neutral-950">Tasks</h3>
          <span className="text-xs text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">{boardTasks.length}</span>
          <div className="flex-1" />
          <button className="text-[9px] text-neutral-400 flex items-center gap-1 hover:text-neutral-600"><Filter className="w-3 h-3" /> Filter</button>
        </div>
        <div className="px-3 py-2 border-b">
          <div className="flex items-center gap-1.5 bg-neutral-100 rounded-lg px-2.5 py-1.5">
            <Search className="w-3 h-3 text-neutral-400" />
            <input placeholder="Search..." className="bg-transparent text-sm outline-none flex-1 placeholder-neutral-400" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y">
          {boardTasks.map((t) => (
            <button key={t.id} onClick={() => setSelected(t.id)}
              className={`w-full text-left px-4 py-3 transition-colors ${selected === t.id ? "bg-info-bg border-l-2 border-l-info-solid" : "hover:bg-neutral-50 border-l-2 border-l-transparent"}`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full shrink-0 ${statusColors[t.status]}`} />
                <span className="text-xs font-medium text-neutral-800 truncate">{t.title}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 ml-4">
                {t.assignee && <span className="text-[9px] text-neutral-400">{t.assignee}</span>}
                {t.due_date && <span className="text-[9px] text-neutral-400">{t.due_date}</span>}
                <span className={`text-[8px] font-bold uppercase ml-auto ${t.priority === "critical" ? "text-bad-fg" : t.priority === "high" ? "text-hot-fg" : "text-neutral-400"}`}>{t.priority}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: detail */}
      <div className="flex-1 bg-neutral-50 flex flex-col">
        {task ? (
          <>
            {/* Tabs */}
            <div className="bg-white border-b px-4 py-2 flex items-center gap-1">
              {(["detail", "deps", "timeline"] as const).map((tab) => (
                <button key={tab} onClick={() => setRightTab(tab)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors capitalize ${rightTab === tab ? "bg-neutral-900 text-white" : "text-neutral-400 hover:bg-neutral-100"}`}>
                  {tab === "deps" ? "Dependencies" : tab === "detail" ? "Detail" : "Timeline"}
                </button>
              ))}
              <div className="flex-1" />
              <button className="text-xs text-neutral-400 hover:text-neutral-600"><MoreHorizontal className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {rightTab === "detail" && (
                <div className="space-y-4">
                  <div>
                    <div className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 ${task.status === "done" ? "bg-ok-bg text-ok-fg" : task.status === "in_progress" ? "bg-warn-bg text-warn-fg" : "bg-info-bg text-info-fg"}`}>{task.status.replace("_", " ")}</div>
                    <h2 className="text-lg font-bold text-neutral-950">{task.title}</h2>
                    {task.description && <p className="text-xs text-neutral-500 mt-1">{task.description}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ l: "Assignee", v: task.assignee || "Unassigned" }, { l: "Priority", v: task.priority }, { l: "Due", v: task.due_date }, { l: "Est. Hours", v: task.estimated_hours || "\u2014" }].map((f) => (
                      <div key={f.l} className="bg-white rounded-lg border p-3"><div className="text-[9px] text-neutral-400 uppercase font-bold">{f.l}</div><div className="text-sm font-medium text-neutral-700 mt-0.5 capitalize">{String(f.v)}</div></div>
                    ))}
                  </div>
                  {task.depends_on.length > 0 && (
                    <div className="bg-bad-bg border border-bad-solid/20 rounded-lg p-3">
                      <div className="text-[9px] text-bad-fg uppercase font-bold">Blocked by</div>
                      <div className="text-xs text-bad-fg mt-1">{task.depends_on.length} dependency</div>
                    </div>
                  )}
                  <Burndown data={burndownData} />
                </div>
              )}
              {rightTab === "deps" && <DependencyGraph data={depGraphData} />}
              {rightTab === "timeline" && <TimelineSwimLanes data={swimData} />}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-neutral-400">Select a task</div>
        )}
      </div>
    </div>
  );
}
