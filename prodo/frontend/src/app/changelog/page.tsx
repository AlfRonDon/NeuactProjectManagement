"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Bug, Wrench, Rocket, ChevronDown, ChevronRight } from "lucide-react";
import { PageShell, CARD, SECTION_TITLE } from "@/design";
import { fetchChangelogs } from "@/lib/api";
import { usePMStore } from "@/lib/store";

const CHANGE_META: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  feature:     { icon: Sparkles, color: "text-info-fg",  bg: "bg-info-bg border border-info-solid/30",  label: "Feature" },
  fix:         { icon: Bug,      color: "text-bad-fg",   bg: "bg-bad-bg border border-bad-solid/30",    label: "Fix" },
  improvement: { icon: Wrench,   color: "text-warn-fg",  bg: "bg-warn-bg border border-warn-solid/30",  label: "Improvement" },
  breaking:    { icon: Rocket,   color: "text-hot-fg",   bg: "bg-hot-bg border border-hot-solid/30",    label: "Breaking" },
};

export default function ChangelogPage() {
  const [changelogs, setChangelogs] = useState<any[]>([]);
  const projects = usePMStore(s => s.projects);
  const projectsStatus = usePMStore(s => s.projectsStatus);
  const fetchProjects = usePMStore(s => s.fetchProjects);
  const [projectFilter, setProjectFilter] = useState("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (projectsStatus === "idle") fetchProjects().catch((e: any) => setError(e.message));
  }, [fetchProjects, projectsStatus]);

  useEffect(() => {
    setLoading(true);
    const pId = projectFilter === "all" ? undefined : projectFilter;
    fetchChangelogs(pId)
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setChangelogs(arr);
        if (arr.length > 0) setExpanded({ [arr[0].id]: true });
        setError("");
        setLoading(false);
      })
      .catch((e: any) => { setChangelogs([]); setError(e.message || "Unable to load changelog"); setLoading(false); });
  }, [projectFilter]);

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <PageShell title="Changelog" contentMode="scroll"
      headerRight={
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
          className="text-xs border border-neutral-200 rounded-lg px-2 py-1 bg-white text-neutral-700">
          <option value="all">All Projects</option>
          {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      }>
      {error && <div className="text-xs text-bad-fg bg-bad-bg px-3 py-2 rounded-lg">{error}</div>}

      {loading ? (
        <div className="p-8 text-center text-xs text-neutral-400">Loading...</div>
      ) : changelogs.length === 0 ? (
        <div className={`${CARD} p-8 text-center text-xs text-neutral-400`}>No changelogs found</div>
      ) : (
        <div className="space-y-4">
          {changelogs.map((cl: any) => {
            const isOpen = expanded[cl.id];
            return (
              <div key={cl.id} className={CARD}>
                <button onClick={() => toggle(cl.id)}
                  className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-neutral-50 transition-colors">
                  {isOpen ? <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-neutral-950">{cl.version}</span>
                      <span className={SECTION_TITLE}>{cl.title}</span>
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      {cl.date}{cl.contributors?.length > 0 && ` · ${cl.contributors.join(", ")}`}
                    </div>
                  </div>
                  <span className="text-xs text-neutral-400">{cl.entries?.length || 0} changes</span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 border-t border-neutral-100 pt-3">
                    {cl.description && <p className="text-xs text-neutral-500 mb-3">{cl.description}</p>}
                    <div className="space-y-2">
                      {(cl.entries || []).map((entry: any, i: number) => {
                        const meta = CHANGE_META[entry.type] || CHANGE_META.feature;
                        const Icon = meta.icon;
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-lg ${meta.bg} flex items-center justify-center shrink-0`}>
                              <Icon className={`w-3 h-3 ${meta.color}`} />
                            </div>
                            <span className="text-xs text-neutral-700 flex-1">{entry.title}</span>
                            <span className={`text-2xs font-bold px-1.5 py-0.5 rounded ${meta.bg} ${meta.color}`}>{meta.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
