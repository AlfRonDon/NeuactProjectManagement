"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  const slug = params.slug as string;

  const [proj, setProj] = useState<any>(null);
  const [tasks, setTasks] = useState<TaskT[]>([]);
  const [changelogs, setChangelogs] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({});

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

      {/* Split pane */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* ── LEFT PANE ── */}
        <div className="w-[500px] bg-white border-r border-neutral-200 flex flex-col shrink-0">
          {/* Project header — clickable to show overview */}
          <button
            onClick={() => setSelectedTask(null)}
            className={`px-4 py-3 border-b shrink-0 text-left transition-colors ${!selectedTask ? "bg-blue-50/50" : "hover:bg-neutral-50"}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: proj.color }} />
              <span className="text-xs font-bold text-neutral-900 truncate">{proj.name}</span>
              <div className="flex-1" />
              <span className="text-xs text-neutral-400">{proj.done}/{proj.total}</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${proj.progress}%`, backgroundColor: proj.color }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-neutral-500">{proj.progress}%</span>
              <span className={`text-xs ${dl < 30 ? "text-amber-500 font-semibold" : "text-neutral-400"}`}>{dl}d left</span>
            </div>
          </button>

          {/* Filter tags */}
          <div className="px-4 py-2.5 border-b shrink-0 flex gap-2 flex-wrap">
            {[
              { key: "all", label: "All", count: tasks.length, bg: "bg-neutral-100", activeBg: "bg-neutral-900", activeText: "text-white", text: "text-neutral-600" },
              { key: "active", label: "Active", count: tasks.filter(t => t.status === "active").length, bg: "bg-amber-50", activeBg: "bg-amber-500", activeText: "text-white", text: "text-amber-700" },
              { key: "blocked", label: "Blocked", count: tasks.filter(t => t.status === "blocked").length, bg: "bg-red-50", activeBg: "bg-red-500", activeText: "text-white", text: "text-red-700" },
              { key: "todo", label: "To Do", count: tasks.filter(t => t.status === "todo").length, bg: "bg-blue-50", activeBg: "bg-blue-500", activeText: "text-white", text: "text-blue-700" },
              { key: "done", label: "Done", count: tasks.filter(t => t.status === "done").length, bg: "bg-green-50", activeBg: "bg-green-500", activeText: "text-white", text: "text-green-700" },
            ].map(f => (
              <button key={f.key} onClick={() => setStatusFilter(f.key)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === f.key ? `${f.activeBg} ${f.activeText}` : `${f.bg} ${f.text}`
                }`}>
                {f.count} {f.label}
              </button>
            ))}
          </div>

          {/* Urgency filter */}
          <div className="px-4 py-2 border-b shrink-0 flex gap-1.5">
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
          </div>

          {/* Task list */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
            {filtered.map((t) => {
              const isActive = t.id === selectedTask;
              const sMeta = STATUS_META[t.status];
              const pMeta = PRIORITY_META[t.priority];
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTask(isActive ? null : t.id)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    isActive ? "bg-blue-50 border-l-2 border-l-blue-500" : "hover:bg-neutral-50 border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${sMeta?.dot ?? "bg-neutral-300"}`} />
                    <span className="text-xs font-medium text-neutral-800 truncate flex-1">{t.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 ml-4">
                    <span className="text-xs text-neutral-400">{t.assignee || "Unassigned"}</span>
                    <span className="text-xs text-neutral-300">·</span>
                    <span className={`text-xs ${t.status === "done" ? "text-green-500" : "text-neutral-400"}`}>{daysUntil(t.due)}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ml-auto ${
                      t.status === "active" ? "bg-amber-50 text-amber-700" :
                      t.status === "blocked" ? "bg-red-50 text-red-700" :
                      t.status === "todo" ? "bg-blue-50 text-blue-700" :
                      t.status === "done" ? "bg-green-50 text-green-700" :
                      "bg-neutral-50 text-neutral-500"
                    }`}>{sMeta?.label ?? t.status}</span>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-neutral-400">No tasks match this filter</div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANE ── */}
        <div className="flex-1 min-h-0 bg-neutral-50 flex flex-col overflow-hidden">
          {selTask ? (
            <TaskDetailView task={selTask} tasks={tasks} onBack={() => setSelectedTask(null)} swimData={swimData} people={PEOPLE} />
          ) : (
            /* ── OVERVIEW: Project Details + Changelog side by side, Timeline full width ── */
            <div className="p-5 flex flex-col h-full gap-4">
              {/* Top row: Project details left + Changelog right — 50% height */}
              <div className="flex gap-4 min-h-0" style={{ flex: "1 1 50%" }}>
                {/* Project Details */}
                <div className="flex-1 min-w-0 bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col overflow-y-auto">
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

                {/* Changelog — fixed height, scrollable */}
                <div className="flex-1 min-w-0 bg-white rounded-2xl border border-neutral-200 flex flex-col overflow-hidden">
                  <div className="px-5 py-3 border-b flex items-center gap-2 shrink-0">
                    <FileText className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm font-bold text-neutral-900">Changelog</span>
                    <span className="text-xs text-neutral-400">{changelogs.length} releases</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5">
                    <div className="relative">
                      <div className="absolute left-[11px] top-0 bottom-0 w-px bg-neutral-200" />
                      {changelogs.map((release) => {
                        const isExpanded = expandedVersions[release.version] !== false;
                        return (
                          <div key={release.version} className="relative pl-10 pb-6 last:pb-0">
                            <div className="absolute left-1.5 top-1 w-5 h-5 rounded-full border-4 border-white flex items-center justify-center" style={{ backgroundColor: proj.color }}>
                              <Rocket className="w-2.5 h-2.5 text-white" />
                            </div>
                            <button onClick={() => toggleVersion(release.version)} className="flex items-center gap-3 mb-2 w-full text-left">
                              <span className="text-sm font-bold text-neutral-900 font-mono">{release.version}</span>
                              <span className="text-xs text-neutral-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{release.date}</span>
                              <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
                            </button>
                            {isExpanded && (
                              <>
                                <h4 className="text-xs font-semibold text-neutral-700 mb-1">{release.title}</h4>
                                <p className="text-xs text-neutral-500 mb-3">{release.description}</p>
                                <div className="space-y-1.5">
                                  {release.changes.map((change, ci) => {
                                    const meta = changeMeta[change.type];
                                    const CIcon = meta.icon;
                                    return (
                                      <div key={ci} className={`flex items-start gap-2 px-3 py-2 rounded-lg border ${meta.bg}`}>
                                        <CIcon className={`w-3.5 h-3.5 ${meta.color} shrink-0 mt-0.5`} />
                                        <span className="text-xs text-neutral-700 flex-1">{change.title}</span>
                                        {change.taskId && <span className="text-xs text-neutral-400 font-mono shrink-0">{change.taskId}</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="mt-2 flex items-center gap-1">
                                  <span className="text-xs text-neutral-400">Contributors:</span>
                                  {release.contributors.map(c => (
                                    <span key={c} className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">{c}</span>
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

              {/* Timeline — full width, 50% height, no inner surface */}
              <div className="min-h-0 flex flex-col" style={{ flex: "1 1 50%" }}>
                <TimelineSwimLanes data={swimData} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
