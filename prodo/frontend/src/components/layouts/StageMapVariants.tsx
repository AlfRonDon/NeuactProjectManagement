"use client";

import React from "react";
import { Layers, ChevronRight, CheckCircle2, Clock, OctagonAlert, CircleDot } from "lucide-react";

const PROJECTS = [
  { name: "Command Center v5", short: "CCv5", color: "#6366F1" },
  { name: "NeuactReport v3", short: "NRv3", color: "#8B5CF6" },
  { name: "Spot Particle", short: "Spot", color: "#EC4899" },
];

const STAGES = ["Research", "Design", "Build", "Test", "Ship"];

interface StageTask { title: string; status: string; assignee?: string }
interface ProjectStage { stage: string; tasks: StageTask[] }

const DATA: Record<string, ProjectStage[]> = {
  CCv5: [
    { stage: "Research", tasks: [{ title: "Pipeline architecture", status: "done" }, { title: "vLLM evaluation", status: "done" }] },
    { stage: "Design", tasks: [{ title: "A→B→C→D flow", status: "done" }, { title: "Schema contracts", status: "done" }] },
    { stage: "Build", tasks: [{ title: "Phase A", status: "done" }, { title: "Phase B — RAG", status: "active", assignee: "Rohith" }, { title: "Phase C — Grid", status: "blocked" }, { title: "Phase D", status: "todo" }] },
    { stage: "Test", tasks: [{ title: "Integration tests", status: "todo" }, { title: "E2E tests", status: "backlog" }] },
    { stage: "Ship", tasks: [{ title: "Staging deploy", status: "blocked" }, { title: "Production", status: "backlog" }] },
  ],
  NRv3: [
    { stage: "Research", tasks: [{ title: "Requirements", status: "done" }] },
    { stage: "Design", tasks: [{ title: "Template design", status: "done" }] },
    { stage: "Build", tasks: [{ title: "NL parser", status: "active", assignee: "Rohith" }, { title: "Chart gen", status: "active", assignee: "Priya" }, { title: "PDF export", status: "done" }] },
    { stage: "Test", tasks: [{ title: "E2E plan", status: "todo" }] },
    { stage: "Ship", tasks: [{ title: "Beta release", status: "backlog" }] },
  ],
  Spot: [
    { stage: "Research", tasks: [{ title: "WebGL eval", status: "done" }] },
    { stage: "Design", tasks: [{ title: "Particle arch", status: "done" }, { title: "Color palette", status: "done" }] },
    { stage: "Build", tasks: [{ title: "GPU shaders", status: "done" }, { title: "Audio reactive", status: "done" }, { title: "Spawn fix", status: "active", assignee: "Rohith" }, { title: "Memory leak", status: "blocked" }] },
    { stage: "Test", tasks: [{ title: "Gesture tests", status: "todo" }] },
    { stage: "Ship", tasks: [{ title: "Production", status: "done" }] },
  ],
};

const S_LABEL: Record<string, string> = { done: "Done", active: "Active", in_progress: "Active", blocked: "Blocked", todo: "To Do", backlog: "Backlog" };
const S_COLOR: Record<string, string> = { done: "bg-ok-solid", active: "bg-warn-solid", in_progress: "bg-warn-solid", blocked: "bg-bad-solid", todo: "bg-info-solid", backlog: "bg-neutral-300" };
const S_TEXT: Record<string, string> = { done: "text-ok-fg", active: "text-warn-fg", in_progress: "text-warn-fg", blocked: "text-bad-fg", todo: "text-info-fg", backlog: "text-neutral-500" };
const S_BG: Record<string, string> = { done: "bg-ok-bg", active: "bg-warn-bg", in_progress: "bg-warn-bg", blocked: "bg-bad-bg", todo: "bg-info-bg", backlog: "bg-neutral-50" };

function stageProgress(tasks: StageTask[]) {
  if (tasks.length === 0) return 0;
  return Math.round((tasks.filter(t => t.status === "done").length / tasks.length) * 100);
}

function dominantStatus(tasks: StageTask[]): string {
  if (tasks.length === 0) return "backlog";
  if (tasks.every(t => t.status === "done")) return "done";
  if (tasks.some(t => t.status === "blocked")) return "blocked";
  if (tasks.some(t => t.status === "active" || t.status === "in_progress")) return "active";
  if (tasks.some(t => t.status === "todo")) return "todo";
  return "backlog";
}


/* ═══════════════════════════════════════════════════════════
   VARIANT A — Progress Pipeline
   Horizontal pipeline per project. Each stage is a segment
   with fill showing % done. Tasks listed inside each cell.
   ═══════════════════════════════════════════════════════════ */
export function StageMapVariantA() {
  return (
    <div className="h-[500px] rounded-lg overflow-hidden border border-neutral-200 bg-white flex flex-col">
      <div className="px-5 py-3 border-b flex items-center gap-2 shrink-0">
        <Layers className="w-5 h-5 text-indigo-500" />
        <span className="text-sm font-serif font-bold text-neutral-950">Progress Pipeline</span>
        <span className="text-xs text-neutral-400 ml-1">stages × projects</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {PROJECTS.map(p => {
          const stages = DATA[p.short] || [];
          return (
            <div key={p.short}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-sm font-semibold text-neutral-950">{p.name}</span>
              </div>
              <div className="flex gap-1">
                {STAGES.map((stageName, i) => {
                  const sd = stages.find(s => s.stage === stageName);
                  const tasks = sd?.tasks || [];
                  const pct = stageProgress(tasks);
                  const dom = dominantStatus(tasks);
                  return (
                    <div key={stageName} className="flex-1 flex flex-col">
                      {/* Stage header */}
                      <div className="text-xs font-semibold text-neutral-500 text-center mb-1">{stageName}</div>
                      {/* Progress bar */}
                      <div className="h-2 bg-neutral-100 rounded-full mb-1.5">
                        <div className={`h-full rounded-full ${S_COLOR[dom]}`} style={{ width: `${pct}%` }} />
                      </div>
                      {/* Task chips */}
                      <div className="space-y-1">
                        {tasks.map((t, j) => (
                          <div key={j} className={`text-xs px-2 py-1 rounded-md ${S_BG[t.status]} ${S_TEXT[t.status]} font-medium truncate`}>
                            {t.title}
                          </div>
                        ))}
                      </div>
                      {/* Arrow */}
                      {i < STAGES.length - 1 && (
                        <div className="flex justify-end -mr-2 mt-1">
                          <ChevronRight className="w-3 h-3 text-neutral-300" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   VARIANT B — Kanban Stages
   Each stage is a column. Projects are rows. Cell shows
   task count badge + status icon. Click-free overview.
   ═══════════════════════════════════════════════════════════ */
export function StageMapVariantB() {
  return (
    <div className="h-[500px] rounded-lg overflow-hidden border border-neutral-200 bg-white flex flex-col">
      <div className="px-5 py-3 border-b flex items-center gap-2 shrink-0">
        <Layers className="w-5 h-5 text-indigo-500" />
        <span className="text-sm font-serif font-bold text-neutral-950">Stage Board</span>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-4 py-3 w-40">Project</th>
              {STAGES.map(s => (
                <th key={s} className="text-center text-xs font-semibold text-neutral-500 uppercase px-2 py-3">{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PROJECTS.map(p => {
              const stages = DATA[p.short] || [];
              return (
                <tr key={p.short} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-sm font-medium text-neutral-800">{p.short}</span>
                    </div>
                  </td>
                  {STAGES.map(stageName => {
                    const sd = stages.find(s => s.stage === stageName);
                    const tasks = sd?.tasks || [];
                    const dom = dominantStatus(tasks);
                    const doneCount = tasks.filter(t => t.status === "done").length;
                    const pct = stageProgress(tasks);
                    const StatusIcon = dom === "done" ? CheckCircle2 : dom === "blocked" ? OctagonAlert : dom === "active" ? Clock : CircleDot;
                    return (
                      <td key={stageName} className="px-2 py-3 text-center">
                        <div className={`inline-flex flex-col items-center gap-1 rounded-lg px-3 py-2 ${S_BG[dom]} min-w-[64px]`}>
                          <StatusIcon className={`w-4 h-4 ${S_TEXT[dom]}`} />
                          <span className={`text-sm font-bold ${S_TEXT[dom]}`}>{doneCount}/{tasks.length}</span>
                          <span className={`text-xs ${S_TEXT[dom]} opacity-70`}>{S_LABEL[dom]}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   VARIANT C — Phase Cards
   Each project gets a horizontal row of phase cards.
   Cards show task list, completion ring, dominant status.
   ═══════════════════════════════════════════════════════════ */
export function StageMapVariantC() {
  return (
    <div className="h-[500px] rounded-lg overflow-hidden border border-neutral-200 bg-white flex flex-col">
      <div className="px-5 py-3 border-b flex items-center gap-2 shrink-0">
        <Layers className="w-5 h-5 text-indigo-500" />
        <span className="text-sm font-serif font-bold text-neutral-950">Phase Cards</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {PROJECTS.map(p => {
          const stages = DATA[p.short] || [];
          return (
            <div key={p.short}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-sm font-serif font-bold text-neutral-950">{p.name}</span>
              </div>
              <div className="flex gap-2">
                {STAGES.map((stageName, i) => {
                  const sd = stages.find(s => s.stage === stageName);
                  const tasks = sd?.tasks || [];
                  const pct = stageProgress(tasks);
                  const dom = dominantStatus(tasks);
                  const circ = 2 * Math.PI * 14;
                  return (
                    <React.Fragment key={stageName}>
                      <div className={`flex-1 rounded-lg border p-3 ${dom === "done" ? "border-ok-solid/20 bg-ok-bg/50" : dom === "blocked" ? "border-bad-solid/20 bg-bad-bg/50" : dom === "active" ? "border-warn-solid/20 bg-warn-bg/50" : "border-neutral-200"}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="relative w-8 h-8 shrink-0">
                            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                              <circle cx="18" cy="18" r="14" fill="none" stroke="var(--border-subtle)" strokeWidth="3" />
                              <circle cx="18" cy="18" r="14" fill="none" stroke={pct === 100 ? "var(--ok-solid)" : p.color} strokeWidth="3" strokeDasharray={`${(pct / 100) * circ} ${circ}`} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-bold text-neutral-700">{pct}%</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-neutral-800">{stageName}</div>
                            <div className="text-xs text-neutral-500">{tasks.filter(t => t.status === "done").length}/{tasks.length}</div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {tasks.map((t, j) => (
                            <div key={j} className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${S_COLOR[t.status]}`} />
                              <span className="text-xs text-neutral-700 truncate">{t.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {i < STAGES.length - 1 && (
                        <div className="flex items-center shrink-0">
                          <ChevronRight className="w-4 h-4 text-neutral-300" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   VARIANT D — Heat Grid
   Matrix: projects × stages. Cell color = stage health.
   Hover shows task details. Dense, scannable.
   ═══════════════════════════════════════════════════════════ */
export function StageMapVariantD() {
  return (
    <div className="h-[500px] rounded-lg overflow-hidden border border-neutral-200 bg-neutral-900 text-white flex flex-col">
      <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2 shrink-0">
        <Layers className="w-5 h-5 text-indigo-400" />
        <span className="text-sm font-bold">Stage Heat Grid</span>
        <div className="flex-1" />
        <div className="flex gap-3 text-xs">
          {[{ l: "Complete", c: "bg-ok-solid" }, { l: "Active", c: "bg-warn-solid" }, { l: "Blocked", c: "bg-bad-solid" }, { l: "Pending", c: "bg-info-solid/50" }].map(s => (
            <div key={s.l} className="flex items-center gap-1.5"><div className={`w-2.5 h-2.5 rounded-sm ${s.c}`} /><span className="text-neutral-400">{s.l}</span></div>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {/* Headers */}
        <div className="flex mb-2">
          <div className="w-36 shrink-0" />
          {STAGES.map(s => (
            <div key={s} className="flex-1 text-center text-xs font-semibold text-neutral-500 uppercase">{s}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="space-y-2">
          {PROJECTS.map(p => {
            const stages = DATA[p.short] || [];
            return (
              <div key={p.short} className="flex items-stretch gap-1.5">
                <div className="w-36 shrink-0 flex items-center gap-2 pr-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-sm font-medium">{p.name}</span>
                </div>
                {STAGES.map(stageName => {
                  const sd = stages.find(s => s.stage === stageName);
                  const tasks = sd?.tasks || [];
                  const dom = dominantStatus(tasks);
                  const pct = stageProgress(tasks);
                  const doneCount = tasks.filter(t => t.status === "done").length;

                  const cellBg = dom === "done" ? "bg-ok-solid/20 border-ok-solid/30"
                    : dom === "blocked" ? "bg-bad-solid/20 border-bad-solid/30"
                    : dom === "active" ? "bg-warn-solid/20 border-warn-solid/30"
                    : dom === "todo" ? "bg-info-solid/10 border-info-solid/20"
                    : "bg-white/5 border-white/10";

                  return (
                    <div key={stageName} className={`flex-1 rounded-lg border p-2 ${cellBg} flex flex-col justify-between group cursor-default`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold ${dom === "done" ? "text-ok-fg" : dom === "blocked" ? "text-bad-fg" : dom === "active" ? "text-warn-fg" : "text-neutral-500"}`}>
                          {doneCount}/{tasks.length}
                        </span>
                        {pct === 100 && <CheckCircle2 className="w-3 h-3 text-ok-solid" />}
                      </div>
                      {/* Task names on hover */}
                      <div className="space-y-0.5">
                        {tasks.map((t, j) => (
                          <div key={j} className="flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${S_COLOR[t.status]}`} />
                            <span className="text-xs text-neutral-400 truncate">{t.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
