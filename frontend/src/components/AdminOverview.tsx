"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home, LayoutGrid, GitBranch, TrendingDown, Users, ExternalLink, Layers, Brain,
  CheckCircle2, OctagonAlert, Activity, CircleDot, X,
} from "lucide-react";
import { createProject, createTask, fetchProjects } from "@/lib/api";

import Burndown from "@/components/widgets/burndown";
import RiskRadar from "@/components/widgets/risk-radar";
import PeopleHeatmap from "@/components/widgets/people-heatmap";
import DependencyGraph from "@/components/widgets/dependency-graph";
import StoryMap from "@/components/widgets/story-map";
import TaskBoard from "@/components/widgets/task-board";

import { boardTasks, burndownData, riskData, peopleData, depGraphData, storyMapData } from "@/components/layouts/fixtures";
import { BottomWidgetVariantA as KPIDashboard, PeopleVariantA as TeamWidget } from "@/components/layouts";
import NotifPanel from "@/components/widgets/NotifPanel";

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

/* ── Create Task Modal ─────────────────────────────────── */
const INPUT = "w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 bg-white";
const LABEL = "text-[11px] text-neutral-500 uppercase font-bold block mb-1";

function CreateTaskModal({ onClose, projects }: { onClose: () => void; projects: { id: string; name: string; short: string }[] }) {
  const [title, setTitle] = useState("");
  const [project, setProject] = useState(projects[0]?.id || "");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("todo");
  const [assignee, setAssignee] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [tags, setTags] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    if (!project) { setError("Select a project"); return; }
    setSaving(true);
    try {
      await createTask({
        title: title.trim(), project, priority, status,
        assignee: assignee.trim() || undefined,
        start_date: startDate || undefined,
        due_date: dueDate || undefined,
        description: description.trim() || undefined,
        estimated_hours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        ...(tags.trim() ? { tags: tags.split(",").map(t => t.trim()).filter(Boolean) } : {}),
      } as any);
      onClose();
    } catch (e: any) { setError(e.message); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xl w-[480px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
          <span className="text-sm font-bold text-neutral-900">New Task</span>
          <button onClick={onClose} className="p-1 rounded hover:bg-neutral-100"><X className="w-4 h-4 text-neutral-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          {/* Required fields */}
          <div>
            <label className={LABEL}>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" className={INPUT} autoFocus />
          </div>
          <div>
            <label className={LABEL}>Project *</label>
            <select value={project} onChange={e => setProject(e.target.value)} className={INPUT}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={LABEL}>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className={INPUT}>
                <option value="low">Low</option><option value="medium">Medium</option>
                <option value="high">High</option><option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={INPUT}>
                <option value="backlog">Backlog</option><option value="todo">To Do</option>
                <option value="active">Active</option><option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option><option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Assignee</label>
              <input value={assignee} onChange={e => setAssignee(e.target.value)} placeholder="Name" className={INPUT} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={INPUT} />
            </div>
          </div>

          {/* Advanced toggle */}
          <button onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[11px] text-blue-600 font-medium hover:underline">
            {showAdvanced ? "Hide advanced options" : "Show advanced options"}
          </button>

          {showAdvanced && (
            <div className="space-y-3 pt-1 border-t border-neutral-100">
              <div>
                <label className={LABEL}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detailed description..."
                  className={`${INPUT} min-h-[60px] resize-y`} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Estimated Hours</label>
                  <input type="number" value={estimatedHours} onChange={e => setEstimatedHours(e.target.value)} placeholder="e.g. 8"
                    className={INPUT} min="0" step="0.5" />
                </div>
                <div>
                  <label className={LABEL}>Tags</label>
                  <input value={tags} onChange={e => setTags(e.target.value)} placeholder="frontend, bug, api" className={INPUT} />
                </div>
              </div>
            </div>
          )}

          {error && <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
        </div>
        <div className="px-5 py-3 border-t border-neutral-100 flex justify-end gap-2">
          <button onClick={onClose} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="text-xs font-medium px-4 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50">
            {saving ? "Creating..." : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Create Project Modal ─────────────────────────────── */
function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [short, setShort] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [status, setStatus] = useState("active");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    try {
      await createProject({
        name: name.trim(), short: short.trim() || undefined, color, status,
        description: description.trim() || undefined,
        start_date: startDate || undefined, target_date: targetDate || undefined,
      } as any);
      onClose();
    } catch (e: any) { setError(e.message); setSaving(false); }
  };

  const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#22c55e", "#ec4899", "#06b6d4", "#f97316"];

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xl w-[480px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
          <span className="text-sm font-bold text-neutral-900">New Project</span>
          <button onClick={onClose} className="p-1 rounded hover:bg-neutral-100"><X className="w-4 h-4 text-neutral-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          {/* Required fields */}
          <div>
            <label className={LABEL}>Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Project name" className={INPUT} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Short Code</label>
              <input value={short} onChange={e => setShort(e.target.value)} placeholder="e.g. CCv5" maxLength={20} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={INPUT}>
                <option value="planning">Planning</option><option value="active">Active</option>
                <option value="on_hold">On Hold</option><option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Target Date</label>
              <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className={INPUT} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-neutral-400" : "hover:scale-110"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Advanced toggle */}
          <button onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[11px] text-blue-600 font-medium hover:underline">
            {showAdvanced ? "Hide advanced options" : "Show advanced options"}
          </button>

          {showAdvanced && (
            <div className="space-y-3 pt-1 border-t border-neutral-100">
              <div>
                <label className={LABEL}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this project about?"
                  className={`${INPUT} min-h-[60px] resize-y`} rows={3} />
              </div>
            </div>
          )}

          {error && <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
        </div>
        <div className="px-5 py-3 border-t border-neutral-100 flex justify-end gap-2">
          <button onClick={onClose} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="text-xs font-medium px-4 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50">
            {saving ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminOverview() {
  const router = useRouter();
  const [view, setView] = useState<View>("overview");
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string; short: string }[]>([]);

  const openCreateTask = async () => {
    try {
      const p = await fetchProjects();
      setProjects(p.map((x: any) => ({ id: x.id, name: x.name, short: x.short })));
    } catch {}
    setShowCreateTask(true);
  };

  return (
    <div className="h-full flex flex-col bg-neutral-100">
      {showCreateTask && <CreateTaskModal onClose={() => setShowCreateTask(false)} projects={projects} />}
      {showCreateProject && <CreateProjectModal onClose={() => setShowCreateProject(false)} />}
      {/* Content — no tab bar, fits screen */}
      <div className="flex-1 flex flex-col p-3 gap-3 overflow-hidden min-h-0">
        {view === "overview" && (
          <div className="flex-1 flex -m-3 overflow-hidden">
            {/* Left 50% */}
            <div className="w-[50vw] bg-neutral-50">
              <KPIDashboard />
            </div>
            {/* Right 50% */}
            <div className="flex-1 flex flex-col gap-2 p-2 overflow-hidden bg-neutral-50">
              {/* Quick actions */}
              <div className="flex items-center justify-end gap-1.5 shrink-0">
                <button onClick={openCreateTask} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-neutral-900 text-white hover:bg-neutral-800 transition-colors">
                  + Task
                </button>
                <button onClick={() => setShowCreateProject(true)} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 transition-colors">
                  + Project
                </button>
              </div>
              <div className="flex-1 min-h-0 bg-white rounded-lg border border-neutral-200 overflow-hidden">
                <NotifPanel />
              </div>
              <div className="shrink-0 bg-white rounded-lg border border-neutral-200 overflow-hidden">
                <TeamWidget />
              </div>
            </div>
          </div>
        )}

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
