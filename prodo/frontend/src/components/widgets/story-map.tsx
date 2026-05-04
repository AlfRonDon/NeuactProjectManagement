"use client";

import React, { useState } from "react";
import { ChevronRight, Layers } from "lucide-react";

interface StoryMapTask {
  id: string;
  title: string;
  status: "backlog" | "todo" | "in_progress" | "in_review" | "done";
  priority: "low" | "medium" | "high" | "critical";
  assignee?: string;
}

interface StoryMapRow {
  epic: string;
  description: string;
  phases: {
    name: string;
    tasks: StoryMapTask[];
  }[];
}

const STATUS_DOT: Record<string, string> = {
  backlog: "bg-neutral-300",
  todo: "bg-info-solid",
  in_progress: "bg-warn-solid",
  in_review: "bg-info-solid/70",
  done: "bg-ok-solid",
};

const PRIORITY_RING: Record<string, string> = {
  critical: "ring-2 ring-bad-solid",
  high: "ring-2 ring-hot-solid",
  medium: "",
  low: "opacity-70",
};

export default function StoryMap({ data }: { data: StoryMapRow[] }) {
  const [expandedEpic, setExpandedEpic] = useState<string | null>(null);
  const phases = data[0]?.phases.map((p) => p.name) || [];

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-xsmall p-5 overflow-x-auto">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-4 h-4 text-neutral-400" />
        <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400">
          Story Map
        </h3>
        <span className="text-xs text-neutral-300 ml-auto">
          {data.length} epics &middot; {phases.length} phases
        </span>
      </div>

      {/* Phase headers */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `180px repeat(${phases.length}, 1fr)` }}>
        <div />
        {phases.map((phase) => (
          <div
            key={phase}
            className="text-xs uppercase font-bold tracking-widest text-neutral-400 text-center px-2 py-1.5 bg-neutral-50 rounded border border-neutral-100"
          >
            {phase}
          </div>
        ))}

        {/* Epic rows */}
        {data.map((row) => (
          <React.Fragment key={row.epic}>
            {/* Epic label */}
            <button
              onClick={() => setExpandedEpic(expandedEpic === row.epic ? null : row.epic)}
              className="text-left px-3 py-2 rounded-lg bg-neutral-900 text-white text-xs font-semibold flex items-center gap-2 hover:bg-neutral-800 transition-colors"
            >
              <ChevronRight
                className={`w-3 h-3 transition-transform ${expandedEpic === row.epic ? "rotate-90" : ""}`}
              />
              <div>
                <div className="leading-tight">{row.epic}</div>
                <div className="text-xs text-neutral-400 font-normal mt-0.5">
                  {row.description}
                </div>
              </div>
            </button>

            {/* Phase cells */}
            {row.phases.map((phase) => (
              <div
                key={`${row.epic}-${phase.name}`}
                className="bg-neutral-50/50 rounded border border-dashed border-neutral-200 p-1.5 min-h-[60px] flex flex-wrap gap-1 content-start"
              >
                {phase.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`group relative bg-white rounded-md border border-neutral-200 px-2 py-1.5 text-xs leading-tight shadow-xsmall hover:shadow-md transition-shadow cursor-pointer max-w-full ${PRIORITY_RING[task.priority]}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[task.status]}`} />
                      <span className="truncate font-medium text-neutral-700">
                        {task.title}
                      </span>
                    </div>
                    {task.assignee && (
                      <div className="text-xs text-neutral-400 mt-0.5 pl-3">
                        {task.assignee}
                      </div>
                    )}

                    {/* Hover tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-neutral-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {task.title} — {task.status.replace("_", " ")}
                    </div>
                  </div>
                ))}
                {phase.tasks.length === 0 && (
                  <div className="w-full h-full flex items-center justify-center text-xs text-neutral-300">
                    —
                  </div>
                )}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-neutral-100">
        {Object.entries(STATUS_DOT).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-xs text-neutral-400 capitalize">
              {status.replace("_", " ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
