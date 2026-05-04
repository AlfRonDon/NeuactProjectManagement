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
