"use client";

import React, { useState } from "react";
import {
  Target, ChevronRight, CheckCircle2,
} from "lucide-react";

import Burndown from "@/components/widgets/burndown";

import { boardTasks, burndownData } from "./fixtures";

export default function FocusModeLayout() {
  const [phase, setPhase] = useState<"pick" | "work" | "done">("pick");
  const aiPicks = boardTasks.filter((t) => t.status === "todo" || t.status === "in_progress").slice(0, 3);
  const [focused, setFocused] = useState<any>(aiPicks[0]);

  return (
    <div className="h-[700px] rounded-xl overflow-hidden border border-neutral-200 bg-white flex flex-col">
      {/* Minimal header */}
      <div className="px-6 py-4 flex items-center gap-3 border-b">
        <Target className="w-5 h-5 text-neutral-400" />
        <span className="text-sm font-bold text-neutral-900">Focus Mode</span>
        <span className="text-[10px] text-neutral-400">CC v5</span>
        <div className="flex-1" />
        <div className="flex gap-1">
          {(["pick", "work", "done"] as const).map((p) => (
            <button key={p} onClick={() => setPhase(p)}
              className={`text-[10px] font-medium px-3 py-1.5 rounded-full capitalize transition-all ${phase === p ? "bg-neutral-900 text-white" : "text-neutral-400 hover:bg-neutral-100"}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        {phase === "pick" && (
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <div className="text-3xl mb-2">{"\u{1F9E0}"}</div>
              <h2 className="text-xl font-bold text-neutral-900">What should you work on?</h2>
              <p className="text-xs text-neutral-400 mt-1">AI-ranked by impact, urgency, and dependencies</p>
            </div>
            <div className="space-y-3">
              {aiPicks.map((task, i) => (
                <button key={task.id} onClick={() => { setFocused(task); setPhase("work"); }}
                  className="w-full text-left bg-neutral-50 hover:bg-blue-50 border border-neutral-200 hover:border-blue-300 rounded-xl p-4 transition-all group">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 ${i === 0 ? "bg-blue-500" : i === 1 ? "bg-neutral-400" : "bg-neutral-300"}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-neutral-800">{task.title}</div>
                      <div className="text-[10px] text-neutral-400 mt-1">
                        {task.priority} priority &middot; {task.estimated_hours}h estimated
                        {task.depends_on.length > 0 && ` \u00B7 Blocks ${task.depends_on.length} task`}
                      </div>
                      <div className="text-[10px] text-blue-600 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {i === 0 ? "\u{1F525} Highest impact \u2014 blocks 2 downstream tasks" :
                         i === 1 ? "\u23F0 Due in 5 days, medium effort" :
                         "\u{1F4CB} Good starter \u2014 low dependencies"}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-blue-400 mt-1 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === "work" && focused && (
          <div className="w-full max-w-2xl">
            <div className="text-center mb-6">
              <div className="inline-block text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-3 py-1 rounded-full mb-3">In Progress</div>
              <h2 className="text-2xl font-bold text-neutral-900">{focused.title}</h2>
              <p className="text-xs text-neutral-400 mt-1">{focused.estimated_hours}h estimated &middot; Due {focused.due_date}</p>
            </div>

            {/* Context cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-neutral-50 rounded-xl border p-4">
                <div className="text-[9px] uppercase font-bold text-neutral-400 mb-2">Dependencies</div>
                {focused.depends_on.length > 0 ? (
                  <div className="text-xs text-red-600">Blocked by {focused.depends_on.length} task</div>
                ) : (
                  <div className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> No blockers</div>
                )}
              </div>
              <div className="bg-neutral-50 rounded-xl border p-4">
                <div className="text-[9px] uppercase font-bold text-neutral-400 mb-2">Sprint Impact</div>
                <div className="text-xs text-neutral-600">Completing this unblocks E2E testing phase</div>
              </div>
            </div>

            {/* Inline burndown context */}
            <Burndown data={burndownData} />

            <div className="flex justify-center gap-3 mt-6">
              <button onClick={() => setPhase("done")} className="bg-green-500 text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-green-600 transition-colors">
                Mark Complete
              </button>
              <button className="text-sm text-neutral-500 px-4 py-2.5 rounded-xl border hover:bg-neutral-50 transition-colors">
                I'm Blocked
              </button>
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="text-center">
            <div className="text-5xl mb-4">{"\u{1F389}"}</div>
            <h2 className="text-xl font-bold text-neutral-900">Nice work!</h2>
            <p className="text-xs text-neutral-400 mt-1">Task completed. Here's what changed:</p>
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-left max-w-sm mx-auto">
              <div className="text-[10px] text-green-700 space-y-1">
                <div>{"\u2713"} Sprint progress: 22% {"\u2192"} 33%</div>
                <div>{"\u2713"} Unblocked: "E2E Testing"</div>
                <div>{"\u2713"} Burndown updated</div>
              </div>
            </div>
            <button onClick={() => setPhase("pick")} className="mt-6 bg-neutral-900 text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-neutral-800 transition-colors">
              Pick Next Task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
