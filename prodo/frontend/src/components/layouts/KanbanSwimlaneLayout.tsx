"use client";

import React, { useState } from "react";
import {
  Columns3, User, Users, ChevronDown, ChevronRight, GripVertical, Circle,
} from "lucide-react";

import { boardTasks } from "./fixtures";

const statuses = ["backlog", "todo", "in_progress", "in_review", "done"] as const;
const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
  backlog: { label: "Backlog", color: "text-neutral-400", bg: "bg-neutral-500/20" },
  todo: { label: "To Do", color: "text-blue-400", bg: "bg-blue-500/20" },
  in_progress: { label: "In Progress", color: "text-amber-400", bg: "bg-amber-500/20" },
  in_review: { label: "In Review", color: "text-purple-400", bg: "bg-purple-500/20" },
  done: { label: "Done", color: "text-green-400", bg: "bg-green-500/20" },
};

const priorityDot: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-amber-500",
  medium: "bg-blue-400",
  low: "bg-neutral-400",
};

export default function KanbanSwimlaneLayout() {
  const assignees = Array.from(new Set(boardTasks.filter((t) => t.assignee).map((t) => t.assignee)));
  const lanes = [...assignees, "Unassigned"];

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (lane: string) => setCollapsed((prev) => ({ ...prev, [lane]: !prev[lane] }));

  const getTasksFor = (lane: string, status: string) =>
    boardTasks.filter((t) => {
      const a = t.assignee || "Unassigned";
      return a === lane && t.status === status;
    });

  const laneTaskCount = (lane: string) => boardTasks.filter((t) => (t.assignee || "Unassigned") === lane).length;

  return (
    <div className="h-[700px] rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 flex flex-col text-white">
      {/* Header */}
      <div className="px-5 py-3 border-b border-white/10 flex items-center gap-3 shrink-0">
        <Columns3 className="w-5 h-5 text-teal-400" />
        <h3 className="text-sm font-bold">Kanban Swimlanes</h3>
        <span className="text-[10px] text-neutral-500">by person</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-[10px] text-neutral-500">{assignees.length} people &middot; {boardTasks.length} tasks</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex border-b border-white/10 shrink-0">
        <div className="w-40 shrink-0 px-4 py-2 border-r border-white/10">
          <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-500">Assignee</span>
        </div>
        <div className="flex-1 flex">
          {statuses.map((s) => (
            <div key={s} className="flex-1 px-3 py-2 border-r border-white/5 last:border-r-0">
              <div className="flex items-center gap-1.5">
                <Circle className={`w-2 h-2 ${statusMeta[s].color}`} />
                <span className={`text-[9px] uppercase font-bold tracking-widest ${statusMeta[s].color}`}>{statusMeta[s].label}</span>
                <span className="text-[8px] text-neutral-600 ml-auto">
                  {boardTasks.filter((t) => t.status === s).length}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Swimlane rows */}
      <div className="flex-1 overflow-y-auto">
        {lanes.map((lane) => {
          const isCollapsed = collapsed[lane];
          const count = laneTaskCount(lane);
          const isUnassigned = lane === "Unassigned";

          return (
            <div key={lane} className="border-b border-white/5">
              {/* Lane header row */}
              <div className="flex">
                <button onClick={() => toggle(lane)}
                  className="w-40 shrink-0 px-4 py-3 border-r border-white/10 flex items-center gap-2 hover:bg-white/5 transition-colors text-left">
                  {isCollapsed ? <ChevronRight className="w-3 h-3 text-neutral-500" /> : <ChevronDown className="w-3 h-3 text-neutral-500" />}
                  <User className={`w-3.5 h-3.5 ${isUnassigned ? "text-neutral-600" : "text-teal-400"}`} />
                  <span className={`text-xs font-medium ${isUnassigned ? "text-neutral-500 italic" : "text-white"}`}>{lane}</span>
                  <span className="text-[8px] text-neutral-600 ml-auto">{count}</span>
                </button>

                {!isCollapsed && (
                  <div className="flex-1 flex">
                    {statuses.map((status) => {
                      const tasks = getTasksFor(lane, status);
                      return (
                        <div key={status} className="flex-1 px-2 py-2 border-r border-white/5 last:border-r-0">
                          <div className="space-y-1.5">
                            {tasks.map((task) => (
                              <div key={task.id}
                                className="bg-white/5 rounded-lg px-2.5 py-2 border border-white/5 hover:border-teal-500/30 transition-colors cursor-pointer group">
                                <div className="flex items-start gap-1.5">
                                  <GripVertical className="w-3 h-3 text-neutral-700 opacity-0 group-hover:opacity-100 mt-0.5 shrink-0 transition-opacity" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-medium text-white truncate">{task.title}</div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <div className={`w-1.5 h-1.5 rounded-full ${priorityDot[task.priority]}`} />
                                      <span className="text-[8px] text-neutral-500">{task.priority}</span>
                                      {task.estimated_hours && <span className="text-[8px] text-neutral-600">{task.estimated_hours}h</span>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {tasks.length === 0 && (
                              <div className="h-8 rounded-lg border border-dashed border-white/5 flex items-center justify-center">
                                <span className="text-[8px] text-neutral-700">--</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {isCollapsed && (
                  <div className="flex-1 flex items-center px-4">
                    <div className="flex gap-3">
                      {statuses.map((s) => {
                        const c = getTasksFor(lane, s).length;
                        return c > 0 ? (
                          <span key={s} className={`text-[9px] ${statusMeta[s].color}`}>
                            {statusMeta[s].label}: {c}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer summary */}
      <div className="px-5 py-2 border-t border-white/10 flex items-center gap-4 shrink-0 bg-white/[0.02]">
        {statuses.map((s) => {
          const count = boardTasks.filter((t) => t.status === s).length;
          return (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-sm ${statusMeta[s].bg}`} />
              <span className="text-[9px] text-neutral-500">{statusMeta[s].label}: <span className="text-white font-medium">{count}</span></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
