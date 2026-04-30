"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { fetchProjects, fetchProjectDetail, fetchChangelogs } from "@/lib/api";
import {
  ArrowLeft, ArrowRight, Activity, BadgeCheck, OctagonAlert, CircleDot,
  ListChecks, Calendar, ExternalLink, ChevronDown, ChevronRight, GitBranch, Flag,
  Tag, Rocket, Bug, Wrench, Sparkles, FileText, TrendingUp, Bell, Settings, Target,
  MessageSquare, Send, UserPlus, Plus, Check, AlertTriangle, Zap, Brain,
} from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import TimelineSwimLanes from "@/components/widgets/timeline-swimlanes";
import DependencyGraph from "@/components/widgets/dependency-graph";
import Burndown from "@/components/widgets/burndown";
import RiskRadar from "@/components/widgets/risk-radar";
import PeopleHeatmap from "@/components/widgets/people-heatmap";
import StoryMap from "@/components/widgets/story-map";
import { burndownData, riskData, peopleData, storyMapData } from "@/components/layouts/fixtures";
import { GanttEditView } from "@/components/layouts";
import NotifPanel from "@/components/widgets/NotifPanel";

/* ── DATA ──────────────────────────────────────────────── */

// ── DATA (populated from API) ──

interface SubTask { id: string; title: string; done: boolean; assignee: string; priority: string; description: string }
interface TaskComment { id: string; author: string; avatar: string; time: string; text: string }
interface TaskT { id: string; title: string; description: string; status: string; priority: string; assignee: string; due: string; est: string; start: string; depends: string[]; subtasks: SubTask[]; comments: TaskComment[]; tags: string[] }

type ChangeType = "feature" | "fix" | "improvement" | "breaking";
interface ChangeEntry { type: ChangeType; title: string; taskId?: string }
interface Release { version: string; date: string; title: string; description: string; changes: ChangeEntry[]; contributors: string[] }

const changeMeta: Record<ChangeType, { icon: React.ElementType; color: string; bg: string }> = {
  feature:     { icon: Sparkles, color: "text-blue-600",   bg: "bg-blue-50 border-blue-200" },
  fix:         { icon: Bug,      color: "text-red-600",    bg: "bg-red-50 border-red-200" },
  improvement: { icon: Wrench,   color: "text-amber-600",  bg: "bg-amber-50 border-amber-200" },
  breaking:    { icon: Rocket,   color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string; border: string }> = {
  active:  { label: "Active",  color: "text-amber-700",  bg: "bg-amber-50",  dot: "bg-amber-400",  border: "border-amber-200" },
  blocked: { label: "Blocked", color: "text-red-700",    bg: "bg-red-50",    dot: "bg-red-500",    border: "border-red-200" },
  todo:    { label: "To Do",   color: "text-blue-700",   bg: "bg-blue-50",   dot: "bg-blue-400",   border: "border-blue-200" },
  done:    { label: "Done",    color: "text-green-700",  bg: "bg-green-50",  dot: "bg-green-500",  border: "border-green-200" },
};

const PRIORITY_META: Record<string, { dot: string }> = {
  urgent: { dot: "bg-red-500" }, high: { dot: "bg-orange-400" }, medium: { dot: "bg-yellow-400" }, low: { dot: "bg-neutral-300" },
};

const TODAY = new Date();

function daysUntil(d: string) {
  const diff = Math.ceil((new Date(d).getTime() - TODAY.getTime()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "today";
  return `${diff}d`;
}

/* ── SWIM DATA BUILDER ────────────────────────────────── */
function buildSwimData(proj: any, tasks: TaskT[]) {
  const people = Array.from(new Set(tasks.filter(t => t.assignee).map(t => t.assignee)));
  if (tasks.some(t => !t.assignee)) people.push("Unassigned");

  const lanes = people.map(p => ({ id: p.toLowerCase().replace(/\s+/g, "-"), label: p }));

  const statusMap: Record<string, "done" | "in_progress" | "todo" | "backlog"> = {
    done: "done", active: "in_progress", blocked: "in_progress", todo: "todo",
  };

  const swimTasks = tasks.filter(t => t.start && t.due).map(t => ({
    id: t.id,
    label: t.title,
    startDate: t.start,
    endDate: t.due,
    status: statusMap[t.status] || "todo" as const,
    lane: (t.assignee || "Unassigned").toLowerCase().replace(/\s+/g, "-"),
  }));

  return {
    title: proj.name,
    range: { start: proj.start, end: proj.target },
    lanes,
    tasks: swimTasks,
    milestones: [{ id: "target", label: "Target", date: proj.target }],
  };
}

// PEOPLE derived from tasks at render time

function getAiSuggestions(task: TaskT, tasks: TaskT[]) {
  const suggestions: { icon: React.ElementType; text: string; type: string }[] = [];
  const blocks = tasks.filter(t => t.depends.includes(task.id));
  if (blocks.length > 0) suggestions.push({ icon: Zap, text: `${blocks.length} task${blocks.length > 1 ? "s" : ""} blocked by this — consider prioritizing to unblock downstream work.`, type: "priority" });
  if (!task.assignee) suggestions.push({ icon: UserPlus, text: "This task is unassigned. Rohith has capacity (2 active tasks) — consider assigning.", type: "assign" });
  if (task.subtasks.length > 0 && task.subtasks.filter(s => !s.done).some(s => !s.assignee)) suggestions.push({ icon: UserPlus, text: "Some subtasks are unassigned. Distribute to parallelize work.", type: "assign" });
  const daysLeft = Math.ceil((new Date(task.due).getTime() - TODAY.getTime()) / 86400000);
  if (daysLeft <= 3 && task.status !== "done") suggestions.push({ icon: AlertTriangle, text: `Due in ${daysLeft}d — at current pace, estimated completion may slip. Consider reducing scope or adding help.`, type: "risk" });
  if (task.depends.length > 0 && tasks.filter(t => task.depends.includes(t.id) && t.status === "done").length === task.depends.length) suggestions.push({ icon: Zap, text: "All dependencies are resolved — this task is ready to start or accelerate.", type: "ready" });
  if (suggestions.length === 0) suggestions.push({ icon: Brain, text: "Task looks on track. No blockers or risks detected.", type: "ok" });
  return suggestions;
}

/* ── TASK DETAIL VIEW ──────────────────────────────────── */

function TaskDetailView({ task, tasks, onBack, swimData, people }: {
  task: TaskT;
  tasks: TaskT[];
  onBack: () => void;
  swimData: any;
  people: string[];
}) {
  const [tab, setTab] = useState<"detail" | "deps" | "timeline">("detail");
  const [showAssign, setShowAssign] = useState(false);
  const [expandedSubtask, setExpandedSubtask] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const s = STATUS_META[task.status];
  const pMeta: Record<string, { label: string; bg: string; text: string }> = {
    urgent: { label: "Urgent", bg: "bg-red-50", text: "text-red-700" },
    high: { label: "High", bg: "bg-orange-50", text: "text-orange-700" },
    medium: { label: "Medium", bg: "bg-yellow-50", text: "text-yellow-700" },
    low: { label: "Low", bg: "bg-neutral-50", text: "text-neutral-500" },
  };
  const p = pMeta[task.priority];
  const subtasksDone = task.subtasks.filter(st => st.done).length;
  const suggestions = getAiSuggestions(task, tasks);

  // Build dependency graph data for the DependencyGraph widget
  const depGraphData = (() => {
    const relevantIds = new Set([task.id, ...task.depends, ...tasks.filter(t => t.depends.includes(task.id)).map(t => t.id)]);
    // also add deps of deps for context
    tasks.forEach(t => { if (relevantIds.has(t.id)) t.depends.forEach(d => relevantIds.add(d)); });
    const statusMap: Record<string, "done" | "in_progress" | "todo" | "backlog"> = { done: "done", active: "in_progress", blocked: "in_progress", todo: "todo" };
    const priorityMap: Record<string, "low" | "medium" | "high" | "critical"> = { low: "low", medium: "medium", high: "high", urgent: "critical" };
    const nodes = tasks.filter(t => relevantIds.has(t.id)).map(t => ({
      id: t.id, label: t.title, status: statusMap[t.status] ?? ("todo" as const), priority: priorityMap[t.priority] ?? ("medium" as const), estimatedHours: parseInt(t.est), assignee: t.assignee || undefined,
    }));
    const edges = tasks.filter(t => relevantIds.has(t.id)).flatMap(t => t.depends.filter(d => relevantIds.has(d)).map(d => ({ from: d, to: t.id })));
    const criticalPath = [task.id, ...tasks.filter(t => t.depends.includes(task.id)).map(t => t.id)];
    return { nodes, edges, criticalPath };
  })();

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="px-5 py-2 border-b flex items-center gap-1 shrink-0 bg-white sticky top-0 z-10">
        {(["detail", "deps", "timeline"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize transition-colors ${
              tab === t ? "bg-neutral-900 text-white" : "text-neutral-400 hover:bg-neutral-100"
            }`}>
            {t === "deps" ? "Dependencies" : t === "detail" ? "Detail" : "Timeline"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {/* ── DETAIL TAB ── */}
        {tab === "detail" && (
          <div className="space-y-5">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${s?.bg ?? ""} ${s?.color ?? ""} border ${s?.border ?? ""}`}>{s?.label ?? task.status}</span>
                {p && <span className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${p.bg} ${p.text}`}>{p.label}</span>}
                {task.tags?.map(tag => (
                  <span key={tag} className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
              <h2 className="text-lg font-bold text-neutral-900">{task.title}</h2>
              {task.description && <p className="text-sm text-neutral-600 mt-2 leading-relaxed">{task.description}</p>}
            </div>

            {/* AI Suggestions */}
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-bold text-purple-700">AI Suggestions</span>
              </div>
              <div className="space-y-2">
                {suggestions.map((sg, i) => {
                  const SgIcon = sg.icon;
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <SgIcon className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-purple-800">{sg.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fields grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-neutral-200 rounded-xl p-3 relative">
                <div className="text-xs text-neutral-400 uppercase font-semibold">Assignee</div>
                <div className="flex items-center gap-2 mt-1">
                  {task.assignee ? (
                    <>
                      <div className="w-6 h-6 rounded-full bg-neutral-900 flex items-center justify-center text-xs font-bold text-white">{task.assignee[0]}</div>
                      <span className="text-sm font-medium text-neutral-700">{task.assignee}</span>
                    </>
                  ) : <span className="text-sm text-neutral-400">Unassigned</span>}
                  <button onClick={() => setShowAssign(!showAssign)} className="ml-auto p-1 rounded hover:bg-neutral-100">
                    <UserPlus className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                </div>
                {showAssign && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-neutral-200 rounded-xl shadow-lg z-20 p-2">
                    <div className="text-xs text-neutral-400 px-2 py-1 font-semibold">Assign to:</div>
                    {people.map(pp => (
                      <button key={pp} onClick={() => setShowAssign(false)}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-neutral-50 flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold">{pp[0]}</div>
                        <span className={pp === task.assignee ? "font-bold text-neutral-900" : "text-neutral-600"}>{pp}</span>
                        {pp === task.assignee && <Check className="w-3 h-3 text-green-500 ml-auto" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="border border-neutral-200 rounded-xl p-3">
                <div className="text-xs text-neutral-400 uppercase font-semibold">Due Date</div>
                <div className="text-sm font-medium text-neutral-700 mt-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-neutral-400" /> {task.due}</div>
              </div>
              <div className="border border-neutral-200 rounded-xl p-3">
                <div className="text-xs text-neutral-400 uppercase font-semibold">Start Date</div>
                <div className="text-sm font-medium text-neutral-700 mt-1">{task.start}</div>
              </div>
              <div className="border border-neutral-200 rounded-xl p-3">
                <div className="text-xs text-neutral-400 uppercase font-semibold">Estimated</div>
                <div className="text-sm font-medium text-neutral-700 mt-1">{task.est}</div>
              </div>
              <div className="border border-neutral-200 rounded-xl p-3">
                <div className="text-xs text-neutral-400 uppercase font-semibold">Progress</div>
                <div className="text-sm font-medium text-neutral-700 mt-1">{task.subtasks.length > 0 ? `${subtasksDone}/${task.subtasks.length} subtasks` : "—"}</div>
              </div>
              <div className="border border-neutral-200 rounded-xl p-3">
                <div className="text-xs text-neutral-400 uppercase font-semibold">Dependencies</div>
                <div className="text-sm font-medium text-neutral-700 mt-1">{task.depends.length} upstream</div>
              </div>
            </div>

            {/* Subtasks */}
            {task.subtasks.length > 0 && (
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-neutral-50 border-b flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-neutral-400" />
                  <span className="text-sm font-bold text-neutral-900">Subtasks</span>
                  <span className="text-xs text-neutral-400">{subtasksDone}/{task.subtasks.length}</span>
                  <div className="flex-1" />
                  <div className="w-20 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${(subtasksDone / task.subtasks.length) * 100}%` }} />
                  </div>
                </div>
                <div className="divide-y divide-neutral-100">
                  {task.subtasks.map(st => {
                    const isExpanded = expandedSubtask === st.id;
                    return (
                      <div key={st.id}>
                        <button onClick={() => setExpandedSubtask(isExpanded ? null : st.id)} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-neutral-50 transition-colors">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${st.done ? "bg-green-500 border-green-500" : "border-neutral-300"}`}>
                            {st.done && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className={`text-sm flex-1 ${st.done ? "line-through text-neutral-400" : "text-neutral-700"}`}>{st.title}</span>
                          <ChevronRight className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-3 pl-11 space-y-2">
                            {st.description && <p className="text-xs text-neutral-500">{st.description}</p>}
                            <div className="flex items-center gap-3 text-xs text-neutral-500">
                              <span className="flex items-center gap-1">
                                {st.assignee ? <><div className="w-4 h-4 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold">{st.assignee[0]}</div> {st.assignee}</> : "Unassigned"}
                              </span>
                              <span>·</span>
                              <span className="capitalize">{st.priority}</span>
                              <span>·</span>
                              <span className={st.done ? "text-green-500" : "text-neutral-400"}>{st.done ? "Done" : "Pending"}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-neutral-400 hover:bg-neutral-50">
                    <Plus className="w-3.5 h-3.5" /> Add subtask
                  </button>
                </div>
              </div>
            )}

            {/* Comments */}
            {(task.comments.length > 0 || true) && (
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-neutral-50 border-b flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-neutral-400" />
                  <span className="text-sm font-bold text-neutral-900">Comments</span>
                  <span className="text-xs text-neutral-400">{task.comments.length}</span>
                </div>
                {task.comments.length > 0 && (
                  <div className="divide-y divide-neutral-100">
                    {task.comments.map(c => (
                      <div key={c.id} className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-full bg-neutral-900 flex items-center justify-center text-xs font-bold text-white shrink-0">{c.avatar}</div>
                          <span className="text-xs font-semibold text-neutral-800">{c.author}</span>
                          <span className="text-xs text-neutral-400">{c.time}</span>
                        </div>
                        <p className="text-sm text-neutral-600 ml-8">{c.text.split(/(@\w+)/g).map((part, i) =>
                          part.startsWith("@") ? <span key={i} className="text-blue-500 font-medium">{part}</span> : part
                        )}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="px-4 py-3 bg-neutral-50 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-neutral-900 flex items-center justify-center text-xs font-bold text-white shrink-0">R</div>
                    <input value={commentText} onChange={e => setCommentText(e.target.value)}
                      placeholder="Write a comment... use @ to tag people"
                      className="flex-1 text-sm bg-white border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-blue-300 placeholder-neutral-400" />
                    <button className="p-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800"><Send className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── DEPENDENCIES TAB ── */}
        {tab === "deps" && (
          <div className="space-y-5">
            {/* AI Suggestions for deps */}
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-bold text-purple-700">AI Suggestions</span>
              </div>
              <div className="space-y-2 text-xs text-purple-800">
                {tasks.filter(t => t.depends.includes(task.id)).length > 0 && (
                  <div className="flex items-start gap-2"><Zap className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />Completing this task will unblock {tasks.filter(t => t.depends.includes(task.id)).length} downstream task{tasks.filter(t => t.depends.includes(task.id)).length > 1 ? "s" : ""} — total of ~{tasks.filter(t => t.depends.includes(task.id)).reduce((a, t) => a + parseInt(t.est), 0)}h of work.</div>
                )}
                {task.depends.length > 0 && task.depends.every(d => tasks.find(t => t.id === d)?.status === "done") && (
                  <div className="flex items-start gap-2"><Zap className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />All upstream dependencies are resolved. This task is clear to accelerate.</div>
                )}
                {task.depends.some(d => tasks.find(t => t.id === d)?.status !== "done") && (
                  <div className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />Some upstream tasks are still in progress. Consider checking in with assignees.</div>
                )}
              </div>
            </div>

            {/* Dependency Graph — no wrapper surface */}
            <DependencyGraph data={depGraphData} />

            {/* Impact summary */}
            {tasks.filter(t => t.depends.includes(task.id)).length > 0 && (
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-bold text-amber-700">Impact if delayed</span>
                </div>
                <div className="space-y-2">
                  {tasks.filter(t => t.depends.includes(task.id)).map(t => (
                    <div key={t.id} className="flex items-start gap-2 text-sm text-amber-800">
                      <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div><span className="font-medium">{t.title}</span> — {STATUS_META[t.status]?.label}, due {t.due}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TIMELINE TAB ── */}
        {tab === "timeline" && (
          <div>
            <div className="text-xs text-neutral-500 mb-3">{task.start} → {task.due} · {task.est}</div>
            <TimelineSwimLanes data={swimData} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── PAGE ──────────────────────────────────────────────── */

export default function ProjectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const initialTab = searchParams.get("tab") || "overview";

  const [proj, setProj] = useState<any>(null);
  const [tasks, setTasks] = useState<TaskT[]>([]);
  const [changelogs, setChangelogs] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({});
  const [overviewTab, setOverviewTab] = useState<string>(initialTab);
  const [editMode, setEditMode] = useState(false);
  const [ganttOverrides, setGanttOverrides] = useState<Record<string, Record<string, any>>>({});
  const [deletedTaskIds, setDeletedTaskIds] = useState<Set<string>>(new Set());

  // Build current gantt task map for cascade calculations
  const getGanttTask = useCallback((id: string) => {
    const t = tasks.find(x => x.id === id);
    if (!t) return null;
    const ov = ganttOverrides[id] || {};
    return {
      id: t.id,
      start: ov.start ?? Math.max(0, Math.ceil((new Date(t.start || t.due).getTime() - new Date("2026-04-01").getTime()) / 86400000)),
      duration: ov.duration ?? Math.max(3, parseInt(t.est) || 7),
      deps: t.depends || [],
    };
  }, [tasks, ganttOverrides]);

  // Cascade: push all downstream dependents forward (Finish-to-Start)
  const cascadeDownstream = useCallback((changedId: string, newEnd: number, overrides: Record<string, Record<string, any>>) => {
    const result = { ...overrides };
    // Find all tasks that depend on changedId
    const dependents = tasks.filter(t => (t.depends || []).includes(changedId) && !deletedTaskIds.has(t.id));
    for (const dep of dependents) {
      const depOv = result[dep.id] || {};
      const depStart = depOv.start ?? Math.max(0, Math.ceil((new Date(dep.start || dep.due).getTime() - new Date("2026-04-01").getTime()) / 86400000));
      // If dependent starts before the new end of the changed task, push it forward
      if (depStart < newEnd) {
        result[dep.id] = { ...depOv, start: newEnd };
        // Recursively cascade further downstream
        const depDur = depOv.duration ?? Math.max(3, parseInt(dep.est) || 7);
        const furtherResult = cascadeDownstream(dep.id, newEnd + depDur, result);
        Object.assign(result, furtherResult);
      }
    }
    return result;
  }, [tasks, deletedTaskIds]);

  const handleGanttTaskUpdate = useCallback((id: string, field: string, value: any) => {
    if (field === "_delete") {
      setDeletedTaskIds(prev => new Set(prev).add(id));
    } else {
      setGanttOverrides(prev => {
        const next = { ...prev, [id]: { ...prev[id], [field]: value } };

        // Cascade on start or duration changes
        if (field === "start" || field === "duration") {
          const task = getGanttTask(id);
          if (task) {
            const newStart = field === "start" ? value : (next[id]?.start ?? task.start);
            const newDur = field === "duration" ? value : (next[id]?.duration ?? task.duration);
            const newEnd = newStart + newDur;
            const cascaded = cascadeDownstream(id, newEnd, next);
            return cascaded;
          }
        }
        return next;
      });
    }
  }, [getGanttTask, cascadeDownstream]);

  const [showCols, setShowCols] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(() => new Set(["assignee", "status"]));
  const toggleCol = (col: string) => setVisibleCols(prev => { const n = new Set(prev); n.has(col) ? n.delete(col) : n.add(col); return n; });

  useEffect(() => {
    fetchProjects().then(async (projects: any[]) => {
      // Find project by slug (name slugified)
      const match = projects.find((p: any) => p.name.toLowerCase().replace(/\s+/g, "-") === slug);
      if (!match) { setLoading(false); return; }

      const detail = await fetchProjectDetail(match.id);
      const projData = {
        id: match.id, name: match.name, short: match.short, color: match.color || "#3b82f6",
        description: match.description, status: match.status,
        progress: match.progress, done: match.done_count, total: match.task_count,
        active: match.active_count, blocked: match.blocked_count,
        target: match.target_date, start: match.start_date,
        slug,
      };
      setProj(projData);

      // Map tasks from detail
      const taskList: TaskT[] = (detail.tasks || []).map((t: any) => ({
        id: t.id, title: t.title, description: t.description || "",
        status: t.status === "in_progress" ? "active" : t.status,
        priority: t.priority, assignee: t.assignee || "",
        due: t.due_date || "", est: t.estimated_hours ? `${t.estimated_hours}h` : "",
        start: t.start_date || "", depends: t.depends_on || [],
        subtasks: (t.subtasks || []).map((s: any) => ({ id: s.id, title: s.title, done: s.done, assignee: s.assignee || "", priority: s.priority || "medium", description: s.description || "" })),
        comments: (t.comments || []).map((c: any) => ({ id: c.id, author: c.author, avatar: c.avatar || c.author?.[0]?.toUpperCase() || "?", time: c.created_at ? new Date(c.created_at).toLocaleDateString() : "", text: c.text })),
        tags: t.tags || [],
      }));
      setTasks(taskList);

      // Map changelogs
      const clogs: Release[] = (detail.changelogs || []).map((cl: any) => ({
        version: cl.version, date: cl.date, title: cl.title, description: cl.description || "",
        changes: (cl.entries || []).map((e: any) => ({ type: e.type as ChangeType, title: e.title, taskId: e.task_id_ref || undefined })),
        contributors: cl.contributors || [],
      }));
      setChangelogs(clogs);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="h-screen bg-neutral-100 flex items-center justify-center">
        <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-sm font-bold animate-pulse">N</div>
      </div>
    );
  }

  if (!proj) {
    return (
      <div className="h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-lg font-bold text-neutral-900">Project not found</div>
          <Link href="/" className="text-sm text-blue-500 hover:underline">← Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const daysNum = (d: string) => d ? Math.ceil((new Date(d).getTime() - TODAY.getTime()) / 86400000) : 0;
  const filtered = tasks.filter(t => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (urgencyFilter === "urgent") return t.priority === "urgent" || t.priority === "high";
    if (urgencyFilter === "today") return t.status !== "done" && daysNum(t.due) <= 0;
    if (urgencyFilter === "week") return t.status !== "done" && daysNum(t.due) <= 7;
    if (urgencyFilter === "upcoming") return t.status !== "done" && daysNum(t.due) > 7;
    return true;
  });
  const todo = proj.total - proj.done - proj.active - proj.blocked;
  const dl = proj.target ? Math.ceil((new Date(proj.target).getTime() - TODAY.getTime()) / 86400000) : 0;
  const swimData = buildSwimData(proj, tasks);
  const selTask = tasks.find(t => t.id === selectedTask);
  const PEOPLE = Array.from(new Set(tasks.filter(t => t.assignee).map(t => t.assignee)));

  const stats = [
    { icon: BadgeCheck,   label: "Done",    value: proj.done,    color: "text-green-600", bg: "bg-green-50" },
    { icon: Activity,     label: "Active",  value: proj.active,  color: "text-amber-600", bg: "bg-amber-50" },
    { icon: OctagonAlert, label: "Blocked", value: proj.blocked, color: proj.blocked > 0 ? "text-red-500" : "text-neutral-300", bg: proj.blocked > 0 ? "bg-red-50" : "bg-neutral-50" },
    { icon: CircleDot,    label: "To Do",   value: todo,         color: "text-blue-500",  bg: "bg-blue-50" },
  ];

  const toggleVersion = (v: string) => setExpandedVersions(prev => ({ ...prev, [v]: !prev[v] }));

  const totalBlocked = tasks.filter(t => t.status === "blocked").length;

  return (
    <div className="h-screen bg-neutral-100 overflow-hidden flex flex-col">
      {/* ── TOP BAR ── */}
      <div className="bg-white border-b border-neutral-200 px-5 py-2 flex items-center gap-3 shrink-0">
        <Link href="/" className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-neutral-500" />
        </Link>
        <div className="w-6 h-6 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-xs font-bold shrink-0">N</div>
        <div className="flex-1" />
        <button className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${
          totalBlocked > 0 ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200" : "text-neutral-300 cursor-default"
        }`}>
          <Target className="w-3.5 h-3.5" /> Focus
        </button>
        <Link href="/calendar" className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
          <Calendar className="w-4 h-4 text-neutral-400" />
        </Link>
        <button className="relative p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
          <Bell className="w-4 h-4 text-neutral-400" />
        </button>
        <button className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
          <Settings className="w-4 h-4 text-neutral-400" />
        </button>
        <UserAvatar />
      </div>

      {/* Edit mode — full screen GanttEditView */}
      {editMode && (
        <div className="flex-1 overflow-hidden min-h-0 p-2 bg-neutral-50">
          <GanttEditView
            tasks={filtered
              .filter(t => !deletedTaskIds.has(t.id))
              .map(t => {
                const ov = ganttOverrides[t.id] || {};
                return {
                  id: t.id, title: ov.title || t.title,
                  start: ov.start ?? Math.max(0, Math.ceil((new Date(t.start || t.due).getTime() - new Date("2026-04-01").getTime()) / 86400000)),
                  duration: ov.duration ?? Math.max(3, parseInt(t.est) || 7),
                  status: ov.status || t.status, deps: t.depends || [],
                  phase: ov.phase || "Build", assignee: ov.assignee || t.assignee || "Unassigned",
                  statusLabel: STATUS_META[ov.status || t.status]?.label,
                };
              })}
            selected={selectedTask}
            onSelect={setSelectedTask}
            onDone={() => setEditMode(false)}
            onTaskUpdate={handleGanttTaskUpdate}
          />
        </div>
      )}

      {/* Normal split pane — hidden when editing */}
      <div className={`flex-1 flex overflow-hidden min-h-0 p-2 gap-2 bg-neutral-50 ${editMode ? "hidden" : ""}`}>
        {/* ── LEFT PANE ── */}
        <div className="w-[500px] flex flex-col gap-2 shrink-0">
          {/* Project header card — KPI cards act as filters */}
          <div className="bg-white rounded-lg border border-neutral-200 px-3 py-2.5 shrink-0">
            <div className="flex items-center gap-2 mb-2 cursor-pointer" onClick={() => { setSelectedTask(null); setStatusFilter("all"); }}>
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: proj.color }} />
              <span className="text-sm font-bold text-neutral-900 truncate">{proj.name}</span>
              <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden mx-1">
                <div className="h-full rounded-full" style={{ width: `${proj.progress}%`, backgroundColor: proj.color }} />
              </div>
              <span className="text-[11px] font-bold text-neutral-600">{proj.done}/{proj.total}</span>
              <span className={`text-[11px] font-bold ${dl <= 14 ? "text-red-600" : dl <= 30 ? "text-amber-600" : "text-neutral-400"}`}>{dl}d</span>
            </div>
            <div className="flex gap-1.5">
              {([
                { key: "all", count: proj.total, bg: "bg-neutral-50", border: "border-neutral-100", text: "text-neutral-700", sub: "text-neutral-500", label: "Total", activeBorder: "border-neutral-500" },
                { key: "active", count: proj.active, bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-700", sub: "text-amber-600", label: "Active", activeBorder: "border-amber-500" },
                { key: "blocked", count: proj.blocked, bg: proj.blocked > 0 ? "bg-red-50" : "bg-neutral-50", border: proj.blocked > 0 ? "border-red-100" : "border-neutral-100", text: proj.blocked > 0 ? "text-red-700" : "text-neutral-400", sub: proj.blocked > 0 ? "text-red-600" : "text-neutral-400", label: "Blocked", activeBorder: "border-red-500" },
                { key: "todo", count: todo, bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-700", sub: "text-blue-600", label: "To Do", activeBorder: "border-blue-500" },
                { key: "done", count: proj.done, bg: "bg-green-50", border: "border-green-100", text: "text-green-700", sub: "text-green-600", label: "Done", activeBorder: "border-green-500" },
              ] as const).map(f => (
                <button key={f.key} onClick={() => setStatusFilter(statusFilter === f.key ? "all" : f.key)}
                  className={`flex-1 rounded p-1.5 text-center border-2 transition-all cursor-pointer ${statusFilter === f.key ? `${f.bg} ${f.activeBorder} shadow-sm` : `${f.bg} ${f.border} border`}`}>
                  <div className={`text-sm font-black ${f.text}`}>{f.count}</div>
                  <div className={`text-[11px] ${f.sub}`}>{f.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Task list card */}
          <div className="bg-white rounded-lg border border-neutral-200 flex flex-col flex-1 min-h-0 overflow-hidden">

            {/* Urgency filter + column toggle */}
            <div className="px-3 py-1.5 border-b shrink-0 flex items-center gap-1.5">
              {[
                { key: "all", label: "All" },
                { key: "urgent", label: "Urgent" },
                { key: "today", label: "Today" },
                { key: "week", label: "This Week" },
                { key: "upcoming", label: "Upcoming" },
              ].map(f => (
                <button key={f.key} onClick={() => setUrgencyFilter(f.key)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-all ${
                    urgencyFilter === f.key ? "bg-neutral-900 text-white" : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50"
                  }`}>
                  {f.label}
                </button>
              ))}
              <div className="flex-1" />
              <div className="relative">
                <button onClick={() => setShowCols(!showCols)}
                  className="text-[11px] text-neutral-400 hover:text-neutral-700 px-2 py-0.5 rounded hover:bg-neutral-100">
                  Columns
                </button>
                {showCols && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg border border-neutral-200 shadow-lg z-20 p-2 w-36">
                    {[
                      { key: "assignee", label: "Assignee" },
                      { key: "due", label: "Due Date" },
                      { key: "est", label: "Estimate" },
                      { key: "status", label: "Status" },
                      { key: "priority", label: "Priority" },
                    ].map(col => (
                      <label key={col.key} className="flex items-center gap-2 py-1 cursor-pointer">
                        <input type="checkbox" checked={visibleCols.has(col.key)} onChange={() => toggleCol(col.key)}
                          className="w-3 h-3 rounded border-neutral-300" />
                        <span className="text-[11px] text-neutral-700">{col.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Task list — with toggleable columns */}
            <div className="flex-1 overflow-y-auto">
            {filtered.map((t) => {
              const isActive = t.id === selectedTask;
              const sMeta = STATUS_META[t.status];
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTask(isActive ? null : t.id)}
                  className={`w-full text-left px-3 transition-colors border-b border-neutral-100 ${
                    isActive ? "bg-blue-50 border-l-2 border-l-blue-500" : "hover:bg-neutral-50 border-l-2 border-l-transparent"
                  }`}
                  style={{ paddingTop: 10, paddingBottom: 10 }}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${sMeta?.dot ?? "bg-neutral-300"}`} />
                    <span className="text-xs font-medium text-neutral-800 truncate flex-1">{t.title}</span>
                    {visibleCols.has("status") && (
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg shrink-0 ${
                        t.status === "active" ? "bg-amber-50 text-amber-700" :
                        t.status === "blocked" ? "bg-red-50 text-red-700" :
                        t.status === "todo" ? "bg-blue-50 text-blue-700" :
                        t.status === "done" ? "bg-green-50 text-green-700" :
                        "bg-neutral-50 text-neutral-500"
                      }`}>{sMeta?.label ?? t.status}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 ml-4 text-[11px] text-neutral-400">
                    {visibleCols.has("assignee") && <span>{t.assignee || "Unassigned"}</span>}
                    {visibleCols.has("assignee") && visibleCols.has("due") && <span className="text-neutral-300">&middot;</span>}
                    {visibleCols.has("due") && <span className={t.status === "done" ? "text-green-500" : ""}>{daysUntil(t.due)}</span>}
                    {visibleCols.has("est") && <><span className="text-neutral-300">&middot;</span><span>{t.est}</span></>}
                    {visibleCols.has("priority") && <><span className="text-neutral-300">&middot;</span><span className="capitalize">{t.priority}</span></>}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-neutral-400">No tasks match this filter</div>
            )}
          </div>
          </div>
        </div>

        {/* ── RIGHT PANE ── */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {selTask ? (
            <TaskDetailView task={selTask} tasks={tasks} onBack={() => setSelectedTask(null)} swimData={swimData} people={PEOPLE} />
          ) : (
            <div className="flex flex-col h-full gap-2">
              {!editMode && <>
              {/* Overview tab bar */}
              <div className="flex items-center gap-1 shrink-0">
                {[
                  { key: "overview", label: "Overview" },
                  { key: "pipeline", label: "Pipeline" },
                  { key: "sprint", label: "Sprint Health" },
                  { key: "diagnostic", label: "Diagnostic" },
                  { key: "people", label: "People" },
                ].map(t => (
                  <button key={t.key} onClick={() => setOverviewTab(t.key)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                      overviewTab === t.key ? "bg-neutral-900 text-white" : "text-neutral-400 hover:bg-neutral-100"
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Pipeline tab */}
              {overviewTab === "pipeline" && (
                <div className="flex-1 min-h-0 bg-white rounded-lg border border-neutral-200 overflow-hidden">
                  <StoryMap data={storyMapData} />
                </div>
              )}

              {/* Sprint Health tab */}
              {overviewTab === "sprint" && (
                <div className="flex-1 min-h-0 bg-white rounded-lg border border-neutral-200 overflow-hidden">
                  <Burndown data={burndownData} />
                </div>
              )}

              {/* Diagnostic tab */}
              {overviewTab === "diagnostic" && (
                <div className="flex-1 min-h-0 bg-white rounded-lg border border-neutral-200 overflow-hidden">
                  <RiskRadar data={riskData} />
                </div>
              )}

              {/* People tab */}
              {overviewTab === "people" && (
                <div className="flex-1 min-h-0 bg-white rounded-lg border border-neutral-200 overflow-hidden">
                  <PeopleHeatmap data={peopleData} />
                </div>
              )}

              {/* Overview tab — original content */}
              {overviewTab === "overview" && (<>
              {/* Top row: Project details left + Changelog right — 50% height */}
              <div className="flex gap-4 min-h-0" style={{ flex: "1 1 50%" }}>
                {/* Project Details */}
                <div className="flex-1 min-w-0 bg-white rounded-lg border border-neutral-200 p-5 flex flex-col overflow-y-auto">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: proj.color }} />
                    <span className="text-base font-bold text-neutral-900">{proj.name}</span>
                    <span className="text-xs font-bold text-neutral-500 ml-auto">{proj.progress}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden mb-4">
                    <div className="h-full rounded-full" style={{ width: `${proj.progress}%`, backgroundColor: proj.color }} />
                  </div>

                  {/* Stats as tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {stats.map((st, i) => (
                      <span key={i} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${st.bg} ${st.color}`}>
                        {st.value} {st.label}
                      </span>
                    ))}
                  </div>

                  {/* Project details */}
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-neutral-400 uppercase font-semibold block mb-0.5">Start</span>
                        <span className="text-neutral-700 font-medium">{proj.start}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 uppercase font-semibold block mb-0.5">Target</span>
                        <span className="text-neutral-700 font-medium">{proj.target}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 uppercase font-semibold block mb-0.5">Days Left</span>
                        <span className={`font-medium ${dl < 30 ? "text-amber-600" : "text-neutral-700"}`}>{dl}d</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 uppercase font-semibold block mb-0.5">Tasks</span>
                        <span className="text-neutral-700 font-medium">{proj.done}/{proj.total} done</span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-neutral-100">
                      <span className="text-neutral-400 uppercase font-semibold block mb-1">Team</span>
                      <div className="flex gap-1.5">
                        {PEOPLE.map(p => (
                          <div key={p} className="flex items-center gap-1.5 bg-neutral-50 rounded-full px-2.5 py-1 border border-neutral-100">
                            <div className="w-4 h-4 rounded-full bg-neutral-900 flex items-center justify-center text-xs font-bold text-white">{p[0]}</div>
                            <span className="text-xs text-neutral-600">{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-neutral-100">
                      <span className="text-neutral-400 uppercase font-semibold block mb-1">Description</span>
                      <p className="text-neutral-600 leading-relaxed">AI-powered project management dashboard with real-time pipeline orchestration, voice-first interaction, and intelligent task scheduling.</p>
                    </div>
                  </div>
                </div>

                {/* Activity — project-specific notifications */}
                <div className="flex-1 min-w-0 bg-white rounded-lg border border-neutral-200 flex flex-col overflow-hidden">
                  <NotifPanel />
                </div>
              </div>

              {/* Timeline — read-only Gantt view with hover Edit button */}
              <div className="min-h-0 flex flex-col relative group/timeline" style={{ flex: "1 1 50%" }}>
                <GanttEditView
                  tasks={filtered.map(t => {
                    const ov = ganttOverrides[t.id] || {};
                    return {
                      id: t.id, title: ov.title || t.title,
                      start: ov.start ?? Math.max(0, Math.ceil((new Date(t.start || t.due).getTime() - new Date("2026-04-01").getTime()) / 86400000)),
                      duration: ov.duration ?? Math.max(3, parseInt(t.est) || 7),
                      status: ov.status || t.status, deps: t.depends || [],
                      phase: ov.phase || "Build", assignee: ov.assignee || t.assignee || "Unassigned",
                      statusLabel: STATUS_META[ov.status || t.status]?.label,
                    };
                  })}
                  selected={selectedTask}
                  onSelect={setSelectedTask}
                />
                {/* Hover Edit button — top right */}
                <div className="absolute top-1 right-1 opacity-0 group-hover/timeline:opacity-100 transition-opacity z-20">
                  <button onClick={() => setEditMode(true)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-700 bg-white border border-neutral-200 shadow-md px-2.5 py-1 rounded-lg hover:bg-neutral-50 transition-colors">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Edit
                  </button>
                </div>
              </div>
              </>)}
              </>}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
