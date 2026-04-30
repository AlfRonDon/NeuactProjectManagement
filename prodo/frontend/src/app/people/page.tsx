"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Activity, CheckCircle2, OctagonAlert, Clock } from "lucide-react";
import PeopleHeatmap from "@/components/widgets/people-heatmap";
import { peopleData, boardTasks } from "@/components/layouts/fixtures";
import UserAvatar from "@/components/UserAvatar";

const TEAM = [
  { name: "Rohith", role: "Lead", avatar: "R", capacity: 40 },
  { name: "Priya", role: "Frontend", avatar: "P", capacity: 40 },
  { name: "Arjun", role: "Backend", avatar: "A", capacity: 40 },
];

export default function PeoplePage() {
  const [selected, setSelected] = useState<string | null>(null);

  const selPerson = TEAM.find(t => t.name === selected);
  const selTasks = selected ? boardTasks.filter(t => t.assignee === selected) : [];

  return (
    <div className="h-screen bg-neutral-100 overflow-hidden flex flex-col">
      <div className="bg-white border-b border-neutral-200 px-5 py-2 flex items-center gap-3 shrink-0">
        <Link href="/" className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-neutral-500" />
        </Link>
        <div className="w-6 h-6 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-xs font-bold shrink-0">N</div>
        <span className="text-sm font-semibold text-neutral-700">Team & People</span>
        <div className="flex-1" />
        <UserAvatar />
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: team list */}
        <div className="w-[300px] bg-white border-r border-neutral-200 flex flex-col shrink-0">
          <div className="px-4 py-3 border-b shrink-0">
            <span className="text-sm font-bold text-neutral-900">Team Members</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {TEAM.map(t => {
              const tasks = boardTasks.filter(tk => tk.assignee === t.name);
              const done = tasks.filter(tk => tk.status === "done").length;
              const active = tasks.filter(tk => ["in_progress", "active"].includes(tk.status)).length;
              const isActive = selected === t.name;
              return (
                <button key={t.name} onClick={() => setSelected(isActive ? null : t.name)}
                  className={`w-full text-left px-4 py-3 border-b border-neutral-100 transition-colors ${isActive ? "bg-blue-50 border-l-2 border-l-blue-500" : "hover:bg-neutral-50 border-l-2 border-l-transparent"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-neutral-900 flex items-center justify-center text-sm font-bold text-white">{t.avatar}</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-neutral-900">{t.name}</div>
                      <div className="text-xs text-neutral-400">{t.role} · {t.capacity}h/wk</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-green-600 font-semibold">{done} done</div>
                      <div className="text-xs text-amber-600">{active} active</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: detail */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {selPerson ? (
            <>
              {/* Person header */}
              <div className="bg-white rounded-xl border border-neutral-200 p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center text-xl font-bold text-white">{selPerson.avatar}</div>
                <div className="flex-1">
                  <div className="text-lg font-bold text-neutral-900">{selPerson.name}</div>
                  <div className="text-sm text-neutral-500">{selPerson.role} · {selPerson.capacity}h/wk capacity</div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-green-50 rounded-xl px-4 py-2">
                    <div className="text-lg font-black text-green-600">{selTasks.filter(t => t.status === "done").length}</div>
                    <div className="text-xs text-green-500">Done</div>
                  </div>
                  <div className="bg-amber-50 rounded-xl px-4 py-2">
                    <div className="text-lg font-black text-amber-600">{selTasks.filter(t => ["in_progress", "active"].includes(t.status)).length}</div>
                    <div className="text-xs text-amber-500">Active</div>
                  </div>
                  <div className="bg-blue-50 rounded-xl px-4 py-2">
                    <div className="text-lg font-black text-blue-600">{selTasks.filter(t => ["todo", "backlog"].includes(t.status)).length}</div>
                    <div className="text-xs text-blue-500">To Do</div>
                  </div>
                </div>
              </div>

              {/* Task list */}
              <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <div className="px-5 py-3 border-b">
                  <span className="text-sm font-bold text-neutral-900">Tasks</span>
                  <span className="text-xs text-neutral-400 ml-2">{selTasks.length}</span>
                </div>
                <div className="divide-y divide-neutral-100">
                  {selTasks.map(t => {
                    const statusColor: Record<string, string> = { done: "bg-green-500", in_progress: "bg-amber-400", active: "bg-amber-400", todo: "bg-blue-400", backlog: "bg-neutral-300", in_review: "bg-purple-400" };
                    return (
                      <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                        <div className={`w-2 h-2 rounded-full ${statusColor[t.status] || "bg-neutral-300"}`} />
                        <span className="text-sm text-neutral-800 flex-1">{t.title}</span>
                        <span className="text-xs text-neutral-400">{t.due_date}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${
                          t.status === "done" ? "bg-green-50 text-green-700" :
                          t.status === "in_progress" ? "bg-amber-50 text-amber-700" :
                          "bg-neutral-50 text-neutral-500"
                        }`}>{t.status.replace("_", " ")}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Full heatmap when no one selected */
            <PeopleHeatmap data={peopleData} />
          )}
        </div>
      </div>
    </div>
  );
}
