"use client";

import React, { useState, useEffect } from "react";
import { PeopleVariantA as WorkloadCalendar } from "@/components/layouts";
import { boardTasks } from "@/components/layouts/fixtures";
import { PageShell, CARD, CARD_HEADER, SECTION_TITLE, STATUS_META, STATUS_BADGE } from "@/design";
import PullWorkModal from "@/components/panels/PullWorkModal";
import { usePMStore } from "@/lib/store";

const TEAM = [
  { name: "Rohith", role: "Lead", avatar: "R", capacity: 40 },
  { name: "Priya", role: "Frontend", avatar: "P", capacity: 40 },
  { name: "Arjun", role: "Backend", avatar: "A", capacity: 40 },
];

export default function PeoplePage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [showPullWork, setShowPullWork] = useState(false);
  const users = usePMStore(s => s.users);
  const usersStatus = usePMStore(s => s.usersStatus);
  const fetchUsers = usePMStore(s => s.fetchUsers);
  const tasks = usePMStore(s => s.tasks);
  const tasksStatus = usePMStore(s => s.tasksStatus);
  const fetchTasks = usePMStore(s => s.fetchTasks);

  useEffect(() => {
    if (usersStatus === "idle") fetchUsers().catch(() => {});
    if (tasksStatus === "idle") fetchTasks().catch(() => {});
  }, [fetchTasks, fetchUsers, tasksStatus, usersStatus]);

  const team = users.length > 0
    ? users.map((u: any) => {
        const name = u.display_name || u.name || u.username || u.email || "Unknown";
        return {
          id: u.keycloak_id || u.id || u.username,
          name,
          role: u.role || u.title || "Team",
          avatar: name.charAt(0).toUpperCase(),
          capacity: u.weekly_capacity || u.capacity || 40,
        };
      }).filter((u: any) => Boolean(u.id))
    : usersStatus === "error"
      ? TEAM.map(t => ({ id: t.name.toLowerCase(), ...t }))
      : [];

  const tasksToUse = tasks.length > 0 || tasksStatus !== "error"
    ? tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        assigneeId: t.assignee || t.assignee_detail?.keycloak_id || "",
        assignee: t.assignee_detail?.display_name || t.assignee_detail?.username || t.assignee || "",
        due_date: t.due_date || "",
        priority: t.priority || "medium",
      }))
    : boardTasks.map((t: any) => ({ ...t, assigneeId: t.assignee }));

  const selPerson = team.find(t => t.id === selected);
  const selTasks = selected ? tasksToUse.filter((t: any) => t.assigneeId === selected || t.assignee === selPerson?.name) : [];

  return (
    <PageShell title="Team & People" contentMode="flush">
      <div className="flex-1 flex overflow-hidden min-h-0 h-full">
        {/* Left: team list */}
        <div className="w-[300px] bg-white border-r border-neutral-200 flex flex-col shrink-0">
          <div className={CARD_HEADER}>
            <span className={SECTION_TITLE}>Team Members</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {team.map(t => {
              const tasks = tasksToUse.filter((tk: any) => tk.assigneeId === t.id || tk.assignee === t.name);
              const done = tasks.filter(tk => tk.status === "done").length;
              const active = tasks.filter(tk => ["in_progress", "active"].includes(tk.status)).length;
              const isActive = selected === t.id;
              return (
                <button key={t.id} onClick={() => setSelected(isActive ? null : t.id)}
                  className={`w-full text-left px-4 py-3 border-b border-neutral-100 transition-colors ${isActive ? "bg-info-bg border-l-2 border-l-info-solid" : "hover:bg-neutral-50 border-l-2 border-l-transparent"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-neutral-900 flex items-center justify-center text-sm font-bold text-white">{t.avatar}</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-neutral-950">{t.name}</div>
                      <div className="text-xs text-neutral-400">{t.role} · {t.capacity}h/wk</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-ok-fg font-semibold">{done} done</div>
                      <div className="text-xs text-warn-fg">{active} active</div>
                    </div>
                  </div>
                </button>
              );
            })}
            {team.length === 0 && (
              <div className="px-4 py-6 text-sm text-neutral-400">Loading team...</div>
            )}
          </div>
        </div>

        {/* Right: detail */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {selPerson ? (
            <>
              {/* Person header */}
              <div className={`${CARD} p-5 flex items-center gap-4`}>
                <div className="w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center text-xl font-bold text-white">{selPerson.avatar}</div>
                <div className="flex-1">
                  <div className="text-lg font-bold text-neutral-950">{selPerson.name}</div>
                  <div className="text-sm text-neutral-500">{selPerson.role} · {selPerson.capacity}h/wk capacity</div>
                </div>
                <button onClick={() => setShowPullWork(true)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shrink-0">
                  Pull Work
                </button>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-ok-bg rounded-lg px-4 py-2">
                    <div className="text-lg font-black text-ok-fg">{selTasks.filter(t => t.status === "done").length}</div>
                    <div className="text-xs text-ok-fg">Done</div>
                  </div>
                  <div className="bg-warn-bg rounded-lg px-4 py-2">
                    <div className="text-lg font-black text-warn-fg">{selTasks.filter(t => ["in_progress", "active"].includes(t.status)).length}</div>
                    <div className="text-xs text-warn-fg">Active</div>
                  </div>
                  <div className="bg-info-bg rounded-lg px-4 py-2">
                    <div className="text-lg font-black text-info-fg">{selTasks.filter(t => ["todo", "backlog"].includes(t.status)).length}</div>
                    <div className="text-xs text-info-fg">To Do</div>
                  </div>
                </div>
              </div>

              {/* Task list */}
              <div className={`${CARD} overflow-hidden`}>
                <div className="px-5 py-3 border-b">
                  <span className={SECTION_TITLE}>Tasks</span>
                  <span className="text-xs text-neutral-400 ml-2">{selTasks.length}</span>
                </div>
                <div className="divide-y divide-neutral-100">
                  {selTasks.map(t => {
                    const meta = STATUS_META[t.status] || STATUS_META.todo;
                    return (
                      <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                        <div className={`w-2 h-2 rounded-full ${meta.dot}`} />
                        <span className="text-sm text-neutral-800 flex-1">{t.title}</span>
                        <span className="text-xs text-neutral-400">{t.due_date}</span>
                        <span className={`${STATUS_BADGE} ${meta.bg} ${meta.text}`}>{meta.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <WorkloadCalendar />
          )}
        </div>
      </div>

      {showPullWork && selPerson && (
        <PullWorkModal
          personName={selPerson.name}
          personId={selPerson.id}
          currentHours={selTasks.filter((t: any) => ["in_progress", "active"].includes(t.status)).length * 8}
          capacityHours={selPerson.capacity}
          onClose={() => setShowPullWork(false)}
          onPulled={() => setShowPullWork(false)}
        />
      )}
    </PageShell>
  );
}
