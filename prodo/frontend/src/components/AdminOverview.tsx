"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home, LayoutGrid, GitBranch, TrendingDown, Users, ExternalLink, Layers, Brain,
  CheckCircle2, OctagonAlert, Activity, CircleDot,
} from "lucide-react";

import Burndown from "@/components/widgets/burndown";
import RiskRadar from "@/components/widgets/risk-radar";
import PeopleHeatmap from "@/components/widgets/people-heatmap";
import DependencyGraph from "@/components/widgets/dependency-graph";
import StoryMap from "@/components/widgets/story-map";
import TaskBoard from "@/components/widgets/task-board";

import { boardTasks, burndownData, riskData, peopleData, depGraphData, storyMapData } from "@/components/layouts/fixtures";

type View = "overview" | "board" | "people" | "deps" | "burndown-risk" | "storymap";

const TABS: { id: View; icon: React.ElementType; label: string }[] = [
  { id: "overview", icon: Home, label: "Overview" },
  { id: "board", icon: LayoutGrid, label: "Board" },
  { id: "people", icon: Users, label: "People" },
  { id: "deps", icon: GitBranch, label: "Dependencies" },
  { id: "burndown-risk", icon: TrendingDown, label: "Burndown & Risk" },
  { id: "storymap", icon: Layers, label: "Story Map" },
];

const PROJECTS = [
  { name: "Command Center v5", short: "CCv5", color: "#3b82f6", progress: 30, tasks: 10, done: 3, active: 3, blocked: 1, target: "2026-07-31" },
  { name: "NeuactReport v3", short: "NRv3", color: "#8b5cf6", progress: 33, tasks: 6, done: 2, active: 2, blocked: 0, target: "2026-06-01" },
  { name: "Spot Particle", short: "Spot", color: "#f59e0b", progress: 50, tasks: 6, done: 3, active: 1, blocked: 1, target: "2026-04-30" },
];

const totalProjectTasks = PROJECTS.reduce((s, p) => s + p.tasks, 0);
const totalProjectDone = PROJECTS.reduce((s, p) => s + p.done, 0);
const totalProjectBlocked = PROJECTS.reduce((s, p) => s + p.blocked, 0);
const overallPct = Math.round((totalProjectDone / totalProjectTasks) * 100);

function getPace(p: typeof PROJECTS[0]) {
  const today = new Date();
  const start = new Date("2026-03-01");
  const target = new Date(p.target);
  const totalDays = Math.ceil((target.getTime() - start.getTime()) / 86400000);
  const elapsed = Math.ceil((today.getTime() - start.getTime()) / 86400000);
  const expectedPct = Math.round(Math.min(100, (elapsed / totalDays) * 100));
  const delta = p.progress - expectedPct;
  return delta >= 5 ? { label: "Ahead", color: "text-green-600" } : delta >= -10 ? { label: "On track", color: "text-amber-600" } : { label: "Behind", color: "text-red-600" };
}

function daysLeft(target: string) {
  return Math.ceil((new Date(target).getTime() - new Date().getTime()) / 86400000);
}

// Find key insights for the brief
const closestProject = [...PROJECTS].sort((a, b) => daysLeft(a.target) - daysLeft(b.target))[0];
const mostOpenProject = [...PROJECTS].sort((a, b) => (b.tasks - b.done) - (a.tasks - a.done))[0];
const noBlockerProject = PROJECTS.find(p => p.blocked === 0);

const STAGES = ["Research", "Design", "Build", "Test", "Ship"];
const PROJECT_STAGES: Record<string, { stage: string; tasks: { title: string; status: string }[] }[]> = {
  "CCv5": [
    { stage: "Research", tasks: [{ title: "Pipeline architecture", status: "done" }, { title: "vLLM evaluation", status: "done" }] },
    { stage: "Design", tasks: [{ title: "A→B→C→D flow", status: "done" }, { title: "Schema contracts", status: "done" }] },
    { stage: "Build", tasks: [{ title: "Phase A — Understand", status: "done" }, { title: "Phase B — Fill/RAG", status: "active" }, { title: "Phase C — Grid Pack", status: "blocked" }, { title: "Phase D — Assemble", status: "todo" }] },
    { stage: "Test", tasks: [{ title: "Integration tests", status: "todo" }, { title: "E2E tests", status: "backlog" }] },
    { stage: "Ship", tasks: [{ title: "Staging deploy", status: "blocked" }, { title: "Production deploy", status: "backlog" }] },
  ],
  "NRv3": [
    { stage: "Research", tasks: [{ title: "Report requirements", status: "done" }] },
    { stage: "Design", tasks: [{ title: "Template engine design", status: "done" }] },
    { stage: "Build", tasks: [{ title: "NL query parser", status: "active" }, { title: "Chart auto-gen", status: "active" }, { title: "PDF export", status: "done" }] },
    { stage: "Test", tasks: [{ title: "E2E test plan", status: "todo" }] },
    { stage: "Ship", tasks: [{ title: "Beta release", status: "backlog" }] },
  ],
  "Spot": [
    { stage: "Research", tasks: [{ title: "WebGL evaluation", status: "done" }] },
    { stage: "Design", tasks: [{ title: "Particle system arch", status: "done" }, { title: "Color palette", status: "done" }] },
    { stage: "Build", tasks: [{ title: "GPU compute shaders", status: "done" }, { title: "Audio reactive", status: "done" }, { title: "Spawn fix", status: "active" }, { title: "Memory leak", status: "blocked" }] },
    { stage: "Test", tasks: [{ title: "Touch gesture tests", status: "todo" }] },
    { stage: "Ship", tasks: [{ title: "Production deploy", status: "done" }] },
  ],
};

const STAGE_STATUS_COLOR: Record<string, string> = {
  done: "bg-green-500", active: "bg-amber-400", "in_progress": "bg-amber-400",
  blocked: "bg-red-500", todo: "bg-blue-400", backlog: "bg-neutral-300",
};

function ProjectStageMap() {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-4 h-4 text-indigo-500" />
        <span className="text-sm font-bold text-neutral-900">Project Stages</span>
        <div className="flex-1" />
        <div className="flex gap-3 text-xs">
          {[
            { label: "Done", color: "bg-green-500" },
            { label: "Active", color: "bg-amber-400" },
            { label: "Blocked", color: "bg-red-500" },
            { label: "To Do", color: "bg-blue-400" },
            { label: "Backlog", color: "bg-neutral-300" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${s.color}`} />
              <span className="text-neutral-500">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stage headers */}
      <div className="flex mb-2">
        <div className="w-28 shrink-0" />
        {STAGES.map(s => (
          <div key={s} className="flex-1 text-center text-xs font-bold text-neutral-400 uppercase">{s}</div>
        ))}
      </div>

      {/* Project rows */}
      <div className="space-y-1">
        {PROJECTS.map(p => {
          const stages = PROJECT_STAGES[p.short] || [];
          return (
            <div key={p.short} className="flex items-stretch">
              <div className="w-28 shrink-0 flex items-center gap-2 pr-2 py-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-xs font-medium text-neutral-700 truncate">{p.short}</span>
              </div>
              {STAGES.map(stageName => {
                const stageData = stages.find(s => s.stage === stageName);
                const tasks = stageData?.tasks || [];
                // Determine dominant status
                const allDone = tasks.length > 0 && tasks.every(t => t.status === "done");
                const hasActive = tasks.some(t => t.status === "active" || t.status === "in_progress");
                const hasBlocked = tasks.some(t => t.status === "blocked");

                return (
                  <div key={stageName} className="flex-1 p-1">
                    <div className={`rounded-lg p-1.5 h-full ${allDone ? "bg-green-50" : hasBlocked ? "bg-red-50" : hasActive ? "bg-amber-50" : tasks.length > 0 ? "bg-blue-50" : "bg-neutral-50"}`}>
                      <div className="flex flex-wrap gap-1">
                        {tasks.map((t, i) => (
                          <div key={i} className={`w-2 h-2 rounded-full ${STAGE_STATUS_COLOR[t.status] || "bg-neutral-300"}`} title={`${t.title} (${t.status})`} />
                        ))}
                        {tasks.length === 0 && <div className="w-2 h-2 rounded-full bg-neutral-200" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectSummaryWidget() {
  const router = useRouter();
  const [selProject, setSelProject] = useState<string | null>(null);
  const toProject = (name: string) => router.push(`/project/${name.toLowerCase().replace(/\s+/g, "-")}`);

  const sel = selProject ? PROJECTS.find(p => p.short === selProject) : null;
  const displayProjects = sel ? [sel] : PROJECTS;
  const dispTasks = displayProjects.reduce((s, p) => s + p.tasks, 0);
  const dispDone = displayProjects.reduce((s, p) => s + p.done, 0);
  const dispActive = displayProjects.reduce((s, p) => s + p.active, 0);
  const dispBlocked = displayProjects.reduce((s, p) => s + p.blocked, 0);
  const dispTodo = dispTasks - dispDone - dispActive - dispBlocked;
  const dispPct = dispTasks > 0 ? Math.round((dispDone / dispTasks) * 100) : 0;

  const circ = 2 * Math.PI * 40; // r=40

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col h-full">
      {/* Project selector */}
      <div className="px-3 py-2 border-b border-neutral-100 flex gap-1 flex-wrap shrink-0">
        <button onClick={() => setSelProject(null)}
          className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-all ${!selProject ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100"}`}>
          All Projects
        </button>
        {PROJECTS.map(p => (
          <button key={p.short} onClick={() => setSelProject(p.short)}
            className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${selProject === p.short ? "text-white" : "text-neutral-500 hover:bg-neutral-100"}`}
            style={selProject === p.short ? { backgroundColor: p.color } : {}}>
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: selProject === p.short ? "white" : p.color }} />
            {p.short}
          </button>
        ))}
      </div>

      <div className="overflow-y-auto p-3 space-y-3">
        {/* Ring + stats */}
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="#f3f4f6" strokeWidth="7" />
              {sel ? (
                <circle cx="48" cy="48" r="40" fill="none" stroke={sel.color} strokeWidth="7" strokeDasharray={`${(dispDone / dispTasks) * circ} ${circ}`} strokeLinecap="round" />
              ) : (
                (() => {
                  let offset = 0;
                  return PROJECTS.map(p => {
                    const seg = (p.done / totalProjectTasks) * circ;
                    const el = <circle key={p.short} cx="48" cy="48" r="40" fill="none" stroke={p.color} strokeWidth="7" strokeDasharray={`${seg} ${circ}`} strokeDashoffset={`${-offset}`} strokeLinecap="round" />;
                    offset += seg;
                    return el;
                  });
                })()
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-neutral-900">{dispPct}%</span>
              <span className="text-xs text-neutral-400">done</span>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-xs text-neutral-600"><span className="font-bold text-green-700">{dispDone}</span> Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-xs text-neutral-600"><span className="font-bold text-amber-700">{dispActive}</span> In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-xs text-neutral-600"><span className="font-bold text-red-700">{dispBlocked}</span> Blocked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span className="text-xs text-neutral-600"><span className="font-bold text-blue-700">{dispTodo}</span> To Do</span>
            </div>
          </div>
        </div>

        {/* Project rows (when "All") or single project detail */}
        {!sel ? (
          <div className="space-y-1.5">
            {PROJECTS.map(p => {
              const pc = getPace(p);
              const d = daysLeft(p.target);
              return (
                <button key={p.short} onClick={() => setSelProject(p.short)}
                  className="w-full flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-neutral-50 transition-colors text-left">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="text-xs font-medium text-neutral-800 flex-1 truncate">{p.name}</span>
                  <div className="w-20 h-1.5 bg-neutral-100 rounded-full shrink-0">
                    <div className="h-full rounded-full" style={{ width: `${p.progress}%`, backgroundColor: p.color }} />
                  </div>
                  <span className="text-xs font-bold text-neutral-700 w-8 text-right">{p.progress}%</span>
                  <span className={`text-xs font-semibold w-14 text-right ${pc.color}`}>{pc.label}</span>
                  <span className={`text-xs w-8 text-right ${d < 15 ? "text-red-500 font-bold" : "text-neutral-400"}`}>{d}d</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => toProject(sel.name)}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sel.color }} />
              <span className="text-sm font-bold text-neutral-900">{sel.name}</span>
              <ExternalLink className="w-3 h-3 text-neutral-400" />
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-auto ${getPace(sel).color} ${getPace(sel).color.replace("text-", "bg-").replace("600", "50")}`}>{getPace(sel).label}</span>
            </div>
            <div className="w-full h-2 bg-neutral-100 rounded-full">
              <div className="h-full rounded-full" style={{ width: `${sel.progress}%`, backgroundColor: sel.color }} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-neutral-50 rounded-lg p-2">
                <div className="text-lg font-black text-neutral-800">{sel.tasks}</div>
                <div className="text-xs text-neutral-500">Total</div>
              </div>
              <div className="bg-neutral-50 rounded-lg p-2">
                <div className="text-lg font-black text-neutral-800">{daysLeft(sel.target)}d</div>
                <div className="text-xs text-neutral-500">Left</div>
              </div>
              <div className="bg-neutral-50 rounded-lg p-2">
                <div className="text-lg font-black text-neutral-800">{new Date(sel.target).toLocaleDateString([], { month: "short", day: "numeric" })}</div>
                <div className="text-xs text-neutral-500">Target</div>
              </div>
            </div>
          </div>
        )}

        {/* Deadlines — click to calendar */}
        <div className="bg-neutral-50 rounded-lg border border-neutral-100 p-2.5 cursor-pointer hover:bg-neutral-100 transition-colors" onClick={() => router.push("/calendar")}>
          <div className="text-xs font-bold text-neutral-500 uppercase mb-2">Deadlines</div>
          <div className="flex gap-2">
            {[...displayProjects].sort((a, b) => daysLeft(a.target) - daysLeft(b.target)).map(p => {
              const d = daysLeft(p.target);
              return (
                <div key={p.short} className="flex-1 text-center">
                  <div className={`text-lg font-black ${d < 15 ? "text-red-600" : d < 40 ? "text-amber-600" : "text-green-600"}`}>{d}d</div>
                  <div className="text-xs text-neutral-500">{p.short}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Brief */}
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Brain className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-xs font-bold text-purple-700 uppercase">AI Brief</span>
          </div>
          <p className="text-xs text-purple-800 leading-relaxed">
            {sel
              ? `${sel.name}: ${sel.progress}% done with ${sel.tasks - sel.done} tasks remaining. ${sel.blocked > 0 ? `${sel.blocked} blocker needs resolution. ` : ""}${daysLeft(sel.target) < 15 ? "Deadline approaching — prioritize remaining work." : "On pace for target date."}`
              : `Tracking ${totalProjectTasks} tasks across ${PROJECTS.length} projects — ${totalProjectDone} done. ${closestProject.name} is closest (${daysLeft(closestProject.target)}d). ${totalProjectBlocked > 0 ? `${totalProjectBlocked} blocker${totalProjectBlocked > 1 ? "s" : ""} need attention.` : "No blockers."} Focus: clear ${closestProject.short} items before ${new Date(closestProject.target).toLocaleDateString([], { month: "short", day: "numeric" })}.`
            }
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminOverview() {
  const router = useRouter();
  const [view, setView] = useState<View>("overview");

  return (
    <div className="h-full flex flex-col bg-neutral-100">
      {/* Content — no tab bar, fits screen */}
      <div className="flex-1 flex flex-col p-3 gap-3 overflow-hidden min-h-0">
        {view === "overview" && (<>
            {/* Row 1: Project Summary (30%) + Burndown (70%) */}
            <div className="flex gap-3" style={{ flex: "1 1 50%", minHeight: 0 }}>
              <div className="overflow-y-auto" style={{ flex: "3 1 0" }}>
                <ProjectSummaryWidget />
              </div>
              <div className="cursor-pointer hover:opacity-90 transition-opacity" style={{ flex: "7 1 0" }} onClick={() => router.push("/sprint")}>
                <Burndown data={burndownData} />
              </div>
            </div>

            {/* Row 2: People heatmap + Risk radar */}
            <div className="flex gap-3" style={{ flex: "1 1 30%", minHeight: "360px" }}>
              <div className="flex-1 overflow-y-auto rounded-xl cursor-pointer hover:opacity-90 transition-opacity" onClick={() => router.push("/people")}><PeopleHeatmap data={peopleData} /></div>
              <div className="flex-1 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => router.push("/risks")}><RiskRadar data={riskData} /></div>
            </div>

            {/* Row 3: Stage Board */}
            <div className="bg-white rounded-xl border border-neutral-200 overflow-auto min-h-0" style={{ flex: "0 0 auto" }}>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-4 py-2 w-36">Project</th>
                    {STAGES.map(s => (
                      <th key={s} className="text-center text-xs font-semibold text-neutral-500 uppercase px-2 py-2">{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PROJECTS.map(p => {
                    const stages = PROJECT_STAGES[p.short] || [];
                    return (
                      <tr key={p.short} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 cursor-pointer" onClick={() => router.push(`/project/${p.name.toLowerCase().replace(/\s+/g, "-")}`)}>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="text-sm font-medium text-neutral-800">{p.short}</span>
                          </div>
                        </td>
                        {STAGES.map(stageName => {
                          const sd = stages.find(s => s.stage === stageName);
                          const tasks = sd?.tasks || [];
                          const dom = (() => {
                            if (tasks.length === 0) return "backlog";
                            if (tasks.every(t => t.status === "done")) return "done";
                            if (tasks.some(t => t.status === "blocked")) return "blocked";
                            if (tasks.some(t => t.status === "active")) return "active";
                            if (tasks.some(t => t.status === "todo")) return "todo";
                            return "backlog";
                          })();
                          const doneCount = tasks.filter(t => t.status === "done").length;
                          const StatusIcon = dom === "done" ? CheckCircle2 : dom === "blocked" ? OctagonAlert : dom === "active" ? Activity : CircleDot;
                          const stText: Record<string, string> = { done: "text-green-700", active: "text-amber-700", blocked: "text-red-700", todo: "text-blue-700", backlog: "text-neutral-500" };
                          const stBg: Record<string, string> = { done: "bg-green-50", active: "bg-amber-50", blocked: "bg-red-50", todo: "bg-blue-50", backlog: "bg-neutral-50" };
                          const stLabel: Record<string, string> = { done: "Done", active: "Active", blocked: "Blocked", todo: "To Do", backlog: "—" };
                          return (
                            <td key={stageName} className="px-2 py-2 text-center">
                              <div className={`inline-flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 ${stBg[dom]} min-w-[56px]`}>
                                <StatusIcon className={`w-3.5 h-3.5 ${stText[dom]}`} />
                                <span className={`text-xs font-bold ${stText[dom]}`}>{doneCount}/{tasks.length}</span>
                                <span className={`text-xs ${stText[dom]} opacity-70`}>{stLabel[dom]}</span>
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
        </>)}

        {view === "board" && <TaskBoard tasks={boardTasks} />}
        {view === "people" && <PeopleHeatmap data={peopleData} />}
        {view === "deps" && <DependencyGraph data={depGraphData} />}
        {view === "storymap" && <StoryMap data={storyMapData} />}
        {view === "burndown-risk" && (
          <div className="space-y-4">
            <Burndown data={burndownData} />
            <RiskRadar data={riskData} />
          </div>
        )}
      </div>
    </div>
  );
}
