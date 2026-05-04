"use client";

import React, { useState } from "react";
import {
  Activity, BadgeCheck, OctagonAlert, CircleDot, ListChecks,
  Calendar, ChevronDown, ChevronRight, User, Users, UserPlus,
  Clock, Flag, Target, CheckCircle2, Send, AtSign,
  ArrowRight, ArrowDown, GitBranch, GitMerge, Link2,
  MessageSquare, Paperclip, Tag, Edit3, MoreHorizontal,
  Plus, X, Check, AlertTriangle,
} from "lucide-react";

/* ── DATA ────────────────────────────────────────────── */

const PROJ = { name: "Command Center v5", color: "#6366F1", progress: 20, done: 2, total: 10, active: 3, blocked: 1, target: "2026-07-31", start: "2026-04-01" };

const TASK = {
  id: "t1", title: "Implement Phase B — Fill/RAG",
  desc: "Build the RAG pipeline using vLLM with guided JSON decoding. This phase takes the understood query from Phase A and fills it with relevant data from PostgreSQL via retrieval-augmented generation. The output is a structured JSON payload that Phase C consumes for grid packing.",
  status: "active", priority: "high", assignee: "Rohith",
  due: "2026-04-25", start: "2026-04-10", est: "16h", actual: "6h",
  deps: ["t9", "t10"] as string[],
  tags: ["pipeline", "vLLM", "RAG"],
  subtasks: [
    { id: "s1", title: "Setup vLLM guided decoding schema", done: true },
    { id: "s2", title: "Implement PostgreSQL context retriever", done: true },
    { id: "s3", title: "Build prompt template with RAG context", done: false },
    { id: "s4", title: "Add structured JSON output validation", done: false },
    { id: "s5", title: "Write integration tests", done: false },
  ],
};

const ALL_TASKS = [
  { id: "t1",  title: "Implement Phase B — Fill/RAG",   status: "active",  assignee: "Rohith", due: "2026-04-25", start: "2026-04-10", est: "16h", deps: ["t9", "t10"] },
  { id: "t3",  title: "Phase C — Grid Pack",             status: "blocked", assignee: "",       due: "2026-05-10", start: "2026-04-26", est: "12h", deps: ["t1"] },
  { id: "t4",  title: "Widget renderer PR merge",        status: "active",  assignee: "Arjun",  due: "2026-04-11", start: "2026-04-09", est: "1h", deps: [] },
  { id: "t5",  title: "Write RAG integration tests",     status: "todo",    assignee: "Rohith", due: "2026-04-22", start: "2026-04-18", est: "4h", deps: ["t1"] },
  { id: "t8",  title: "Widget Renderer refactor",        status: "done",    assignee: "Arjun",  due: "2026-04-16", start: "2026-04-08", est: "8h", deps: [] },
  { id: "t9",  title: "Design pipeline architecture",    status: "done",    assignee: "Rohith", due: "2026-04-10", start: "2026-04-01", est: "8h", deps: [] },
  { id: "t10", title: "Phase A — Understand",            status: "done",    assignee: "Rohith", due: "2026-04-15", start: "2026-04-05", est: "12h", deps: [] },
];

const COMMENTS = [
  { id: "c1", author: "Rohith", avatar: "R", time: "2h ago", text: "Started on the prompt template. Using Qwen3.5's native structured output — much cleaner than the old regex approach.", mentions: [] },
  { id: "c2", author: "Priya", avatar: "P", time: "1h ago", text: "@Rohith should we use the same PostgreSQL connection pool from Phase A or create a new one? Don't want to hit connection limits.", mentions: ["Rohith"] },
  { id: "c3", author: "Rohith", avatar: "R", time: "45m ago", text: "@Priya reuse the existing pool — it's already configured for 20 connections. I'll add a note in the code.", mentions: ["Priya"] },
  { id: "c4", author: "Arjun", avatar: "A", time: "20m ago", text: "FYI the widget renderer PR is ready for merge. Once that's in, the output from Phase B can be tested end-to-end with the new renderer.", mentions: [] },
];

const PEOPLE = ["Rohith", "Priya", "Arjun", "Meera"];

const ACTIVITY_LOG = [
  { time: "3h ago", action: "Rohith moved task to Active", type: "status" },
  { time: "2h ago", action: "Rohith added subtask: Setup vLLM guided decoding schema", type: "subtask" },
  { time: "2h ago", action: "Rohith completed subtask: Setup vLLM guided decoding schema", type: "done" },
  { time: "1.5h ago", action: "Rohith completed subtask: Implement PostgreSQL context retriever", type: "done" },
  { time: "1h ago", action: "Priya commented", type: "comment" },
  { time: "45m ago", action: "Rohith replied to Priya", type: "comment" },
  { time: "30m ago", action: "Rohith updated estimated hours: 12h → 16h", type: "edit" },
  { time: "20m ago", action: "Arjun commented", type: "comment" },
];

const STATUS: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  active:  { label: "Active",  dot: "bg-warn-solid",  bg: "bg-warn-bg",  text: "text-warn-fg",  border: "border-warn-solid/20" },
  blocked: { label: "Blocked", dot: "bg-bad-solid",    bg: "bg-bad-bg",    text: "text-bad-fg",    border: "border-bad-solid/20" },
  todo:    { label: "To Do",   dot: "bg-info-solid",   bg: "bg-info-bg",   text: "text-info-fg",   border: "border-info-solid/20" },
  done:    { label: "Done",    dot: "bg-ok-solid",  bg: "bg-ok-bg",  text: "text-ok-fg",  border: "border-ok-solid/20" },
};

const PRIORITY_META: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  urgent: { label: "Urgent", dot: "bg-bad-solid", bg: "bg-bad-bg", text: "text-bad-fg" },
  high: { label: "High", dot: "bg-hot-solid", bg: "bg-hot-bg", text: "text-hot-fg" },
  medium: { label: "Medium", dot: "bg-warn-solid", bg: "bg-warn-bg", text: "text-warn-fg" },
  low: { label: "Low", dot: "bg-neutral-300", bg: "bg-neutral-50", text: "text-neutral-500" },
};


/* ═══════════════════════════════════════════════════════════
   VARIANT 1 — DETAIL TAB
   Rich task detail: description, subtasks, fields, assignment,
   comments with @mentions, activity log
   ═══════════════════════════════════════════════════════════ */
export function TaskDetailVariantA() {
  const [showAssign, setShowAssign] = useState(false);
  const [commentText, setCommentText] = useState("");
  const s = STATUS[TASK.status];
  const p = PRIORITY_META[TASK.priority];
  const subtasksDone = TASK.subtasks.filter(s => s.done).length;

  return (
    <div className="h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-white flex flex-col">
      <div className="px-5 py-3 border-b flex items-center gap-3 shrink-0">
        <Edit3 className="w-5 h-5 text-neutral-400" />
        <h3 className="text-sm font-serif font-bold text-neutral-950">Task Detail</h3>
        <div className="flex-1" />
        <MoreHorizontal className="w-4 h-4 text-neutral-400 cursor-pointer" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-5">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${s.bg} ${s.text} border ${s.border}`}>{s.label}</span>
              <span className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${p.bg} ${p.text}`}>{p.label}</span>
              <div className="flex gap-1 ml-2">
                {TASK.tags.map(tag => (
                  <span key={tag} className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
            <h2 className="text-lg font-bold text-neutral-950">{TASK.title}</h2>
            <p className="text-sm text-neutral-600 mt-2 leading-relaxed">{TASK.desc}</p>
          </div>

          {/* Fields grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Assignee — with reassign */}
            <div className="border border-neutral-200 rounded-lg p-3 relative">
              <div className="text-xs text-neutral-400 uppercase font-semibold">Assignee</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-6 h-6 rounded-full bg-neutral-900 flex items-center justify-center text-xs font-bold text-white">{TASK.assignee[0]}</div>
                <span className="text-sm font-medium text-neutral-700">{TASK.assignee}</span>
                <button onClick={() => setShowAssign(!showAssign)} className="ml-auto p-1 rounded hover:bg-neutral-100">
                  <UserPlus className="w-3.5 h-3.5 text-neutral-400" />
                </button>
              </div>
              {showAssign && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg z-10 p-2">
                  <div className="text-xs text-neutral-400 px-2 py-1 font-semibold">Reassign to:</div>
                  {PEOPLE.map(p => (
                    <button key={p} onClick={() => setShowAssign(false)}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-neutral-50 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold">{p[0]}</div>
                      <span className={p === TASK.assignee ? "font-bold text-neutral-950" : "text-neutral-600"}>{p}</span>
                      {p === TASK.assignee && <Check className="w-3 h-3 text-ok-solid ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="border border-neutral-200 rounded-lg p-3">
              <div className="text-xs text-neutral-400 uppercase font-semibold">Due Date</div>
              <div className="text-sm font-medium text-neutral-700 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" /> {TASK.due}
              </div>
            </div>
            <div className="border border-neutral-200 rounded-lg p-3">
              <div className="text-xs text-neutral-400 uppercase font-semibold">Start Date</div>
              <div className="text-sm font-medium text-neutral-700 mt-1">{TASK.start}</div>
            </div>
            <div className="border border-neutral-200 rounded-lg p-3">
              <div className="text-xs text-neutral-400 uppercase font-semibold">Estimated</div>
              <div className="text-sm font-medium text-neutral-700 mt-1">{TASK.est}</div>
            </div>
            <div className="border border-neutral-200 rounded-lg p-3">
              <div className="text-xs text-neutral-400 uppercase font-semibold">Actual</div>
              <div className="text-sm font-medium text-neutral-700 mt-1">{TASK.actual}</div>
            </div>
            <div className="border border-neutral-200 rounded-lg p-3">
              <div className="text-xs text-neutral-400 uppercase font-semibold">Progress</div>
              <div className="text-sm font-medium text-neutral-700 mt-1">{subtasksDone}/{TASK.subtasks.length} subtasks</div>
            </div>
          </div>

          {/* Subtasks */}
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-neutral-50 border-b flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-neutral-400" />
              <span className="text-sm font-serif font-bold text-neutral-950">Subtasks</span>
              <span className="text-xs text-neutral-400">{subtasksDone}/{TASK.subtasks.length}</span>
              <div className="flex-1" />
              <div className="w-20 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full bg-ok-solid rounded-full" style={{ width: `${(subtasksDone / TASK.subtasks.length) * 100}%` }} />
              </div>
            </div>
            <div className="divide-y divide-neutral-100">
              {TASK.subtasks.map(st => (
                <div key={st.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${st.done ? "bg-ok-solid border-ok-solid" : "border-neutral-300"}`}>
                    {st.done && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-sm ${st.done ? "line-through text-neutral-400" : "text-neutral-700"}`}>{st.title}</span>
                </div>
              ))}
              <button className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-neutral-400 hover:bg-neutral-50">
                <Plus className="w-3.5 h-3.5" /> Add subtask
              </button>
            </div>
          </div>

          {/* Comments */}
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-neutral-50 border-b flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-neutral-400" />
              <span className="text-sm font-serif font-bold text-neutral-950">Comments</span>
              <span className="text-xs text-neutral-400">{COMMENTS.length}</span>
            </div>
            <div className="divide-y divide-neutral-100">
              {COMMENTS.map(c => (
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
            {/* Comment input */}
            <div className="px-4 py-3 bg-neutral-50 border-t">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-neutral-900 flex items-center justify-center text-xs font-bold text-white shrink-0">R</div>
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Write a comment... use @ to tag people"
                  className="flex-1 text-sm bg-white border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-blue-300 placeholder-neutral-400"
                />
                <button className="p-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   VARIANT 2 — DEPENDENCIES TAB
   Visual dependency chain, blockers, downstream, impact analysis
   ═══════════════════════════════════════════════════════════ */
export function TaskDetailVariantB() {
  const upstreamIds = TASK.deps;
  const upstream = upstreamIds.map(id => ALL_TASKS.find(t => t.id === id)).filter(Boolean) as typeof ALL_TASKS;
  const downstream = ALL_TASKS.filter(t => t.deps.includes(TASK.id));
  const indirect = ALL_TASKS.filter(t => t.deps.some(d => downstream.map(x => x.id).includes(d)));

  return (
    <div className="h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-white flex flex-col">
      <div className="px-5 py-3 border-b flex items-center gap-3 shrink-0">
        <GitBranch className="w-5 h-5 text-neutral-400" />
        <h3 className="text-sm font-serif font-bold text-neutral-950">Dependencies</h3>
        <span className="text-xs text-neutral-400">— {TASK.title}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Summary strip */}
        <div className="flex gap-3">
          <div className="flex-1 bg-ok-bg rounded-lg border border-ok-solid/20 p-3 text-center">
            <div className="text-lg font-black text-ok-fg">{upstream.length}</div>
            <div className="text-xs font-semibold text-ok-fg">Depends on</div>
          </div>
          <div className="flex-1 bg-warn-bg rounded-lg border border-warn-solid/20 p-3 text-center">
            <div className="text-lg font-black text-warn-fg">{downstream.length}</div>
            <div className="text-xs font-semibold text-warn-fg">Blocks</div>
          </div>
          <div className="flex-1 bg-bad-bg rounded-lg border border-bad-solid/20 p-3 text-center">
            <div className="text-lg font-black text-bad-fg">{upstream.filter(t => t.status !== "done").length}</div>
            <div className="text-xs font-semibold text-bad-fg">Unresolved</div>
          </div>
        </div>

        {/* Visual chain */}
        <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-5">
          <h4 className="text-xs font-bold text-neutral-500 uppercase mb-4">Dependency Chain</h4>

          {/* Upstream */}
          <div className="space-y-2 mb-4">
            <div className="text-xs text-neutral-400 font-semibold flex items-center gap-1"><ArrowDown className="w-3 h-3" /> Upstream (depends on)</div>
            {upstream.map(t => {
              const ts = STATUS[t.status];
              return (
                <div key={t.id} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-neutral-200">
                  <div className={`w-2.5 h-10 rounded-full ${ts?.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-800">{t.title}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">{t.assignee || "Unassigned"} · {ts?.label}</div>
                  </div>
                  {t.status === "done" ? (
                    <CheckCircle2 className="w-5 h-5 text-ok-solid shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-warn-solid shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Current task */}
          <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3 border-2 border-blue-300 my-2">
            <div className="w-2.5 h-10 rounded-full bg-blue-500" />
            <div className="flex-1">
              <div className="text-sm font-serif font-bold text-neutral-950">{TASK.title}</div>
              <div className="text-xs text-blue-600 font-medium">Current task</div>
            </div>
            <Target className="w-5 h-5 text-blue-500 shrink-0" />
          </div>

          {/* Downstream */}
          <div className="space-y-2 mt-4">
            <div className="text-xs text-neutral-400 font-semibold flex items-center gap-1"><ArrowDown className="w-3 h-3" /> Downstream (blocks)</div>
            {downstream.map(t => {
              const ts = STATUS[t.status];
              return (
                <div key={t.id} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-neutral-200">
                  <div className={`w-2.5 h-10 rounded-full ${ts?.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-800">{t.title}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">{t.assignee || "Unassigned"} · {ts?.label}</div>
                  </div>
                  <OctagonAlert className="w-5 h-5 text-bad-fg shrink-0" />
                </div>
              );
            })}
            {downstream.length === 0 && <div className="text-xs text-neutral-400 pl-4">Nothing downstream</div>}
          </div>
        </div>

        {/* Impact analysis */}
        <div className="bg-warn-bg rounded-2xl border border-warn-solid/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-warn-fg" />
            <span className="text-sm font-bold text-warn-fg">Impact if delayed</span>
          </div>
          <div className="space-y-2 text-sm text-warn-fg">
            {downstream.map(t => (
              <div key={t.id} className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-warn-solid shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">{t.title}</span>
                  <span className="text-warn-fg"> — currently {STATUS[t.status]?.label.toLowerCase()}, due {t.due}</span>
                </div>
              </div>
            ))}
            {indirect.length > 0 && (
              <div className="text-xs text-warn-fg mt-2 pt-2 border-t border-warn-solid/20">
                + {indirect.length} indirectly affected task{indirect.length > 1 ? "s" : ""} downstream
              </div>
            )}
            <div className="text-xs text-warn-fg font-medium mt-2">
              Total delay cascade: {downstream.length + indirect.length} tasks · ~{downstream.reduce((a, t) => a + parseInt(t.est), 0)}h of work blocked
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   VARIANT 3 — TIMELINE TAB
   Task in timeline context, Gantt-style bars, milestones
   ═══════════════════════════════════════════════════════════ */
export function TaskDetailVariantC() {
  const rangeStart = new Date("2026-04-01");
  const rangeEnd = new Date("2026-05-15");
  const totalDays = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / 86400000);
  const today = new Date("2026-04-11");
  const todayPct = Math.ceil((today.getTime() - rangeStart.getTime()) / 86400000) / totalDays * 100;

  const taskBar = (t: typeof ALL_TASKS[0]) => {
    const s = Math.max(0, Math.ceil((new Date(t.start).getTime() - rangeStart.getTime()) / 86400000));
    const e = Math.ceil((new Date(t.due).getTime() - rangeStart.getTime()) / 86400000);
    return { left: (s / totalDays) * 100, width: Math.max(3, ((e - s) / totalDays) * 100) };
  };

  const weeks = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() + i * 7);
    return d;
  });

  return (
    <div className="h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-white flex flex-col">
      <div className="px-5 py-3 border-b flex items-center gap-3 shrink-0">
        <Activity className="w-5 h-5 text-neutral-400" />
        <h3 className="text-sm font-serif font-bold text-neutral-950">Timeline</h3>
        <span className="text-xs text-neutral-400">— {TASK.title}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Task summary */}
        <div className="flex items-center gap-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="w-2 h-12 rounded-full bg-blue-500 shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-serif font-bold text-neutral-950">{TASK.title}</div>
            <div className="text-xs text-neutral-500 mt-0.5">{TASK.start} → {TASK.due} · {TASK.est} estimated · {TASK.actual} logged</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-black text-blue-600">38%</div>
            <div className="text-xs text-blue-400">progress</div>
          </div>
        </div>

        {/* Gantt chart */}
        <div className="bg-neutral-50 rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b flex items-center gap-2 bg-white">
            <span className="text-sm font-serif font-bold text-neutral-950">Project Timeline</span>
            <div className="flex-1" />
            <span className="text-xs text-neutral-400">Apr 1 — May 15, 2026</span>
          </div>

          {/* Week headers */}
          <div className="flex border-b relative">
            <div className="w-32 shrink-0 border-r bg-white" />
            <div className="flex-1 flex relative">
              {weeks.map((w, i) => (
                <div key={i} className="border-r border-neutral-200 text-center py-1.5" style={{ width: `${(7 / totalDays) * 100}%` }}>
                  <span className="text-xs text-neutral-400">{w.toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Task rows */}
          <div>
            {ALL_TASKS.filter(t => t.start).map(t => {
              const bar = taskBar(t);
              const isCurrent = t.id === TASK.id;
              const ts = STATUS[t.status];
              return (
                <div key={t.id} className={`flex items-center border-b border-neutral-100 ${isCurrent ? "bg-blue-50/50" : ""}`}>
                  <div className="w-32 shrink-0 border-r px-3 py-2">
                    <div className={`text-xs truncate ${isCurrent ? "font-bold text-blue-700" : "text-neutral-600"}`}>{t.title.slice(0, 20)}{t.title.length > 20 ? "…" : ""}</div>
                    <div className="text-xs text-neutral-400">{t.assignee || "—"}</div>
                  </div>
                  <div className="flex-1 relative h-10">
                    <div
                      className={`absolute top-2 h-6 rounded-md flex items-center px-2 ${isCurrent ? "bg-blue-500 ring-2 ring-blue-300" : ts?.dot ?? "bg-neutral-300"}`}
                      style={{ left: `${bar.left}%`, width: `${bar.width}%` }}
                    >
                      <span className={`text-xs font-medium truncate ${isCurrent ? "text-white" : "text-white/80"}`}>{t.title.slice(0, 15)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Today line overlay hint */}
          <div className="px-4 py-2 bg-white border-t flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-bad-solid" />
            <span className="text-xs text-neutral-500">Today: Apr 11</span>
            <div className="flex-1" />
            <Flag className="w-3 h-3 text-neutral-400" />
            <span className="text-xs text-neutral-400">Target: {new Date(PROJ.target).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
          </div>
        </div>

        {/* Activity log */}
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span className="text-sm font-serif font-bold text-neutral-950">Activity</span>
          </div>
          <div className="divide-y divide-neutral-100">
            {ACTIVITY_LOG.map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  a.type === "done" ? "bg-ok-solid" : a.type === "comment" ? "bg-info-solid" : a.type === "status" ? "bg-warn-solid" : "bg-neutral-300"
                }`} />
                <span className="text-xs text-neutral-600 flex-1">{a.action}</span>
                <span className="text-xs text-neutral-400 shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
