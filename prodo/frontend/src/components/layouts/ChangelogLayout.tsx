"use client";

import React, { useState } from "react";
import {
  FileText, Tag, Rocket, Bug, Wrench, Sparkles, Calendar, TrendingUp,
  ChevronDown, ExternalLink,
} from "lucide-react";

type ChangeType = "feature" | "fix" | "improvement" | "breaking";

interface ChangeEntry {
  type: ChangeType;
  title: string;
  taskId?: string;
}

interface Release {
  version: string;
  date: string;
  title: string;
  description: string;
  changes: ChangeEntry[];
  contributors: string[];
}

const changeMeta: Record<ChangeType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  feature: { label: "Feature", icon: Sparkles, color: "text-info-fg", bg: "bg-info-bg border-info-solid/20" },
  fix: { label: "Fix", icon: Bug, color: "text-bad-fg", bg: "bg-bad-bg border-bad-solid/20" },
  improvement: { label: "Improvement", icon: Wrench, color: "text-warn-fg", bg: "bg-warn-bg border-warn-solid/20" },
  breaking: { label: "Breaking", icon: Rocket, color: "text-bad-fg", bg: "bg-bad-bg border-bad-solid/20" },
};

const releases: Release[] = [
  {
    version: "v4.2.0", date: "Apr 8, 2026", title: "AI Dashboard Pipeline", description: "Major release: the full A-B-C-D pipeline for AI-generated dashboards is now live.",
    changes: [
      { type: "feature", title: "Phase A - Understand: NL query parsing with Qwen3.5", taskId: "CCv5-12" },
      { type: "feature", title: "Phase B - Fill/RAG: context retrieval from PostgreSQL", taskId: "CCv5-15" },
      { type: "feature", title: "Phase C - Grid Pack: bento grid layout algorithm", taskId: "CCv5-18" },
      { type: "feature", title: "Phase D - Assemble: final dashboard renderer", taskId: "CCv5-21" },
      { type: "improvement", title: "vLLM guided JSON decoding for structured outputs", taskId: "CCv5-22" },
      { type: "fix", title: "Fixed memory leak in widget renderer during hot-reload", taskId: "CCv5-24" },
    ],
    contributors: ["Rohith", "Priya"],
  },
  {
    version: "v4.1.1", date: "Mar 28, 2026", title: "Hotfix: Burndown Widget", description: "Patch release fixing critical rendering issues in the burndown chart.",
    changes: [
      { type: "fix", title: "Burndown chart SVG overflow on mobile viewports", taskId: "CCv5-30" },
      { type: "fix", title: "Incorrect velocity calculation with zero-hour tasks", taskId: "CCv5-31" },
      { type: "improvement", title: "Added tooltip hover states to all chart data points" },
    ],
    contributors: ["Arjun"],
  },
  {
    version: "v4.1.0", date: "Mar 20, 2026", title: "Widget System v2", description: "Complete rewrite of the widget rendering system with 8 chart types.",
    changes: [
      { type: "feature", title: "New widget types: Gantt, Risk Radar, Dependency Graph", taskId: "CCv5-35" },
      { type: "feature", title: "Story Map widget for epic-level planning", taskId: "CCv5-36" },
      { type: "breaking", title: "Widget API v1 deprecated, v2 schema required", taskId: "CCv5-37" },
      { type: "improvement", title: "50% reduction in widget render time via React.memo", taskId: "CCv5-38" },
      { type: "fix", title: "Timeline swimlanes misaligned with DST transitions", taskId: "CCv5-40" },
    ],
    contributors: ["Rohith", "Priya", "Arjun"],
  },
  {
    version: "v4.0.0", date: "Mar 5, 2026", title: "Command Center v4 Launch", description: "Initial public release of Command Center v4 with AI-powered project management.",
    changes: [
      { type: "feature", title: "Project dashboard with real-time metrics", taskId: "CCv5-01" },
      { type: "feature", title: "Voice-first interaction prototype", taskId: "CCv5-05" },
      { type: "feature", title: "PostgreSQL time-series data backend (276 GB)", taskId: "CCv5-08" },
      { type: "breaking", title: "New authentication flow replaces legacy tokens", taskId: "CCv5-09" },
      { type: "improvement", title: "Dark mode support across all layouts" },
    ],
    contributors: ["Rohith", "Priya", "Arjun", "Meera"],
  },
];

const filterTypes: (ChangeType | "all")[] = ["all", "feature", "fix", "improvement", "breaking"];

export default function ChangelogLayout() {
  const [typeFilter, setTypeFilter] = useState<ChangeType | "all">("all");
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>(
    Object.fromEntries(releases.map((r) => [r.version, true]))
  );

  const toggleVersion = (v: string) => setExpandedVersions((prev) => ({ ...prev, [v]: !prev[v] }));

  const totalFeatures = releases.reduce((a, r) => a + r.changes.filter((c) => c.type === "feature").length, 0);
  const totalFixes = releases.reduce((a, r) => a + r.changes.filter((c) => c.type === "fix").length, 0);

  return (
    <div className="h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center gap-3 shrink-0">
        <FileText className="w-5 h-5 text-ok-solid" />
        <h3 className="text-sm font-serif font-bold text-neutral-950">Changelog</h3>
        <span className="text-xs text-neutral-400">CC v5</span>
        <div className="flex-1" />
        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <span><span className="font-bold text-neutral-700">{releases.length}</span> releases</span>
          <span><span className="font-bold text-info-fg">{totalFeatures}</span> features</span>
          <span><span className="font-bold text-bad-fg">{totalFixes}</span> fixes</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-6 py-2.5 border-b flex items-center gap-2 shrink-0 bg-neutral-50">
        <Tag className="w-3 h-3 text-neutral-400" />
        {filterTypes.map((ft) => (
          <button key={ft} onClick={() => setTypeFilter(ft)}
            className={`text-xs font-medium px-3 py-1 rounded-full capitalize transition-all ${typeFilter === ft ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-200"}`}>
            {ft === "all" ? "All" : changeMeta[ft].label}
          </button>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-ok-solid" />
          <span className="text-xs text-neutral-500">Shipping velocity: <span className="font-bold text-ok-fg">1.2 releases/week</span></span>
        </div>
      </div>

      {/* Releases */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-6 px-6">
          {/* Timeline line */}
          <div className="relative">
            <div className="absolute left-[11px] top-0 bottom-0 w-px bg-neutral-200" />

            {releases.map((release) => {
              const filtered = typeFilter === "all" ? release.changes : release.changes.filter((c) => c.type === typeFilter);
              if (filtered.length === 0 && typeFilter !== "all") return null;
              const isExpanded = expandedVersions[release.version];

              return (
                <div key={release.version} className="relative pl-10 pb-8">
                  {/* Timeline dot */}
                  <div className="absolute left-1.5 top-1 w-5 h-5 rounded-full bg-ok-solid border-4 border-white flex items-center justify-center">
                    <Rocket className="w-2.5 h-2.5 text-white" />
                  </div>

                  {/* Version header */}
                  <button onClick={() => toggleVersion(release.version)} className="flex items-center gap-3 mb-2 group w-full text-left">
                    <span className="text-sm font-bold text-neutral-950 font-mono">{release.version}</span>
                    <span className="text-xs text-neutral-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{release.date}</span>
                    <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
                  </button>

                  {isExpanded && (
                    <>
                      <h4 className="text-xs font-semibold text-neutral-700 mb-1">{release.title}</h4>
                      <p className="text-xs text-neutral-500 mb-3 leading-relaxed">{release.description}</p>

                      <div className="space-y-1.5">
                        {filtered.map((change, i) => {
                          const meta = changeMeta[change.type];
                          return (
                            <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-lg border ${meta.bg} transition-colors hover:opacity-90`}>
                              <meta.icon className={`w-3.5 h-3.5 ${meta.color} shrink-0 mt-0.5`} />
                              <span className="text-xs text-neutral-700 flex-1">{change.title}</span>
                              {change.taskId && (
                                <span className="text-[8px] text-neutral-400 font-mono flex items-center gap-0.5 shrink-0">
                                  {change.taskId} <ExternalLink className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 flex items-center gap-1">
                        <span className="text-[9px] text-neutral-400">Contributors:</span>
                        {release.contributors.map((c) => (
                          <span key={c} className="text-[9px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">{c}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
