"use client";

import React, { useState, useEffect } from "react";
import { Activity, MessageSquare, ArrowRight, UserPlus, AlertTriangle, CheckCircle2, Flag, Sparkles } from "lucide-react";
import { PageShell, CARD, SECTION_TITLE } from "@/design";
import { usePMStore } from "@/lib/store";

const TYPE_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  status_change: { label: "Status", color: "text-info-fg", bg: "bg-info-bg", icon: ArrowRight },
  assignment: { label: "Assignment", color: "text-warn-fg", bg: "bg-warn-bg", icon: UserPlus },
  comment: { label: "Comment", color: "text-neutral-600", bg: "bg-neutral-100", icon: MessageSquare },
  creation: { label: "Created", color: "text-ok-fg", bg: "bg-ok-bg", icon: CheckCircle2 },
  blocker: { label: "Blocker", color: "text-bad-fg", bg: "bg-bad-bg", icon: AlertTriangle },
  escalation: { label: "Escalation", color: "text-hot-fg", bg: "bg-hot-bg", icon: Flag },
  ai: { label: "AI", color: "text-purple-600", bg: "bg-purple-50", icon: Sparkles },
};

export default function ActivityPage() {
  const activities = usePMStore(s => s.activities);
  const activitiesStatus = usePMStore(s => s.activitiesStatus);
  const fetchActivities = usePMStore(s => s.fetchActivities);
  const projects = usePMStore(s => s.projects);
  const projectsStatus = usePMStore(s => s.projectsStatus);
  const fetchProjects = usePMStore(s => s.fetchProjects);
  const [projectFilter, setProjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    if (projectsStatus === "idle") fetchProjects().catch(() => {});
  }, [fetchProjects, projectsStatus]);

  useEffect(() => {
    const pId = projectFilter === "all" ? undefined : projectFilter;
    const t = typeFilter === "all" ? undefined : typeFilter;
    fetchActivities(pId, t).catch(() => {});
  }, [fetchActivities, projectFilter, typeFilter]);

  const loading = activitiesStatus === "idle" || activitiesStatus === "loading";

  return (
    <PageShell title="Activity Feed" contentMode="scroll"
      headerRight={
        <div className="flex gap-2">
          <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
            className="text-xs border border-neutral-200 rounded-lg px-2 py-1 bg-white text-neutral-700">
            <option value="all">All Projects</option>
            {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="text-xs border border-neutral-200 rounded-lg px-2 py-1 bg-white text-neutral-700">
            <option value="all">All Types</option>
            {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      }>

      <div className={`${CARD} overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center text-xs text-neutral-400">Loading...</div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">No activity found</div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {activities.map((a: any) => {
              const meta = TYPE_META[a.activity_type] || TYPE_META.status_change;
              const Icon = meta.icon;
              return (
                <div key={a.id} className="px-5 py-3 flex items-start gap-3 hover:bg-neutral-50 transition-colors">
                  <div className={`w-7 h-7 rounded-lg ${meta.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-neutral-950">{a.title}</span>
                      <span className={`text-2xs font-bold px-1.5 py-0.5 rounded ${meta.bg} ${meta.color}`}>{meta.label}</span>
                    </div>
                    {a.description && <p className="text-xs text-neutral-500 line-clamp-2">{a.description}</p>}
                    <div className="flex items-center gap-2 mt-1 text-2xs text-neutral-400">
                      {a.task_title && <span>{a.task_title}</span>}
                      {a.triggered_by_detail?.display_name && <span>by {a.triggered_by_detail.display_name}</span>}
                      <span>{new Date(a.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
