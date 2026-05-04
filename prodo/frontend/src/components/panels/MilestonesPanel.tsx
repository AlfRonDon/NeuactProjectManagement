"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { usePMStore } from "@/lib/store";
import { CARD, DIVIDER, INPUT, PROGRESS_BAR_TRACK, PROGRESS_BAR_FILL } from "@/design/tokens";

/* ── Types ─────────────────────────────────────────────── */

interface Task {
  id: string;
  title: string;
  status: string;
  assignee?: string;
  due?: string;
  milestone?: string;
}

interface Milestone {
  id: string;
  name: string;
  due_date: string;
  completed: boolean;
  completed_at?: string;
  description?: string;
  project: string;
}

interface MilestonesPanelProps {
  projectId: string;
  tasks?: Task[];
}

/* ── Helpers ───────────────────────────────────────────── */

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toLowerCase();
}

function fmtDateInput(iso: string): string {
  return iso.slice(0, 10);
}

function daysDiff(iso: string): number {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - TODAY.getTime()) / 86_400_000);
}

function milestoneStatus(m: Milestone): "done" | "overdue" | "upcoming" | "future" {
  if (m.completed) return "done";
  const diff = daysDiff(m.due_date);
  if (diff < 0) return "overdue";
  if (diff <= 14) return "upcoming";
  return "future";
}

function statusInitial(s: string): string {
  if (s === "done") return "done";
  if (s === "in_progress" || s === "active") return "in-progress";
  return "todo";
}

/* ── Diamond SVGs ──────────────────────────────────────── */

function DiamondDone() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0">
      <path d="M7 0L14 7L7 14L0 7Z" fill="#97c459" />
    </svg>
  );
}

function DiamondOverdue() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0">
      <path d="M7 0L14 7L7 14L0 7Z" fill="#e24b4a" />
    </svg>
  );
}

function DiamondUpcoming() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0">
      <path d="M7 1L13 7L7 13L1 7Z" fill="none" stroke="#378add" strokeWidth="1.5" />
    </svg>
  );
}

function DiamondFuture() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0">
      <path d="M7 1L13 7L7 13L1 7Z" fill="none" stroke="#D5CFCE" strokeWidth="1" />
    </svg>
  );
}

function DiamondBlue() {
  return (
    <svg width="18" height="18" viewBox="0 0 14 14" className="shrink-0">
      <path d="M7 1L13 7L7 13L1 7Z" fill="#378add" />
    </svg>
  );
}

/* ── Status Dot ────────────────────────────────────────── */

function StatusDot({ status }: { status: string }) {
  const color =
    status === "done"
      ? "bg-[#97c459]"
      : status === "in-progress"
        ? "bg-[#ef9f27]"
        : "bg-[#378add]";
  return <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />;
}

/* ── Main Component ────────────────────────────────────── */

export default function MilestonesPanel({ projectId, tasks = [] }: MilestonesPanelProps) {
  const fetchMilestones = usePMStore(s => s.fetchMilestones);
  const createMilestone = usePMStore(s => s.createMilestone);
  const patchMilestone = usePMStore(s => s.patchMilestone);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDue, setAddDue] = useState("");
  const [error, setError] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);

  /* Fetch */
  const load = useCallback(async () => {
    try {
      const data: any = await fetchMilestones(projectId);
      const list = Array.isArray(data) ? data : data.results ?? [];
      setMilestones(list);
      setError("");
      if (!selected && list.length > 0) {
        const first = list.find((m: Milestone) => !m.completed && daysDiff(m.due_date) >= 0);
        if (first) setSelected(first.id);
        else setSelected(list[0].id);
      }
    } catch (e: any) {
      setError(e.message || "Unable to load milestones");
    }
  }, [fetchMilestones, projectId, selected]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (adding && addInputRef.current) addInputRef.current.focus();
  }, [adding]);

  /* Derived */
  const sorted = useMemo(
    () => [...milestones].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()),
    [milestones],
  );

  const totalCount = sorted.length;
  const doneCount = sorted.filter((m) => m.completed).length;
  const overdueCount = sorted.filter((m) => !m.completed && daysDiff(m.due_date) < 0).length;

  const selectedMs = sorted.find((m) => m.id === selected) ?? null;
  const selectedTasks = useMemo(
    () => (selected ? tasks.filter((t) => t.milestone === selected) : []),
    [tasks, selected],
  );
  const doneTasks = selectedTasks.filter((t) => t.status === "done");
  const taskPercent = selectedTasks.length > 0 ? Math.round((doneTasks.length / selectedTasks.length) * 100) : 0;

  /* Today line insertion index */
  const todayIndex = useMemo(() => {
    for (let i = 0; i < sorted.length; i++) {
      if (daysDiff(sorted[i].due_date) >= 0 && !sorted[i].completed) return i;
    }
    return sorted.length;
  }, [sorted]);

  /* Handlers */
  const handleToggleComplete = async () => {
    if (!selectedMs) return;
    try {
      await patchMilestone(selectedMs.id, { completed: !selectedMs.completed });
      await load();
    } catch (e: any) {
      setError(e.message || "Unable to update milestone");
    }
  };

  const handleDueChange = async (val: string) => {
    if (!selectedMs) return;
    try {
      await patchMilestone(selectedMs.id, { due_date: val });
      await load();
    } catch (e: any) {
      setError(e.message || "Unable to update milestone");
    }
  };

  const handleAdd = async () => {
    if (!addName.trim()) { setAdding(false); return; }
    try {
      await createMilestone({
        name: addName.trim(),
        due_date: addDue || new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10),
        project: projectId,
      });
      setAddName("");
      setAddDue("");
      setAdding(false);
      await load();
    } catch (e: any) {
      setError(e.message || "Unable to create milestone");
    }
  };

  /* ── Render ──────────────────────────────────────────── */

  const todayLabel = `today \u00b7 ${TODAY.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toLowerCase()}`;

  const VISIBLE_TASKS = 4;
  const visibleTasks = selectedTasks.slice(0, VISIBLE_TASKS);
  const extraCount = selectedTasks.length - VISIBLE_TASKS;

  return (
    <div className="w-full bg-neutral-50 font-sans min-h-0 flex flex-col">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-base font-medium text-neutral-950">Milestones</h2>
          <span className="text-sm text-[#888780]">
            <span className="font-mono">{totalCount}</span> total{" "}
            <span className="mx-0.5">&middot;</span>{" "}
            <span className="font-mono">{doneCount}</span> done{" "}
            <span className="mx-0.5">&middot;</span>{" "}
            <span className="font-mono">{overdueCount}</span> overdue
          </span>
        </div>
        <span className="text-sm text-[#a32d2d] font-medium">{todayLabel}</span>
      </div>
      {error && <div className="mx-5 mb-3 text-xs text-bad-fg bg-bad-bg rounded-lg px-3 py-2">{error}</div>}

      {/* ── Body: Two Columns ──────────────────────────── */}
      <div className="flex flex-1 min-h-0 px-5 pb-5 gap-5">
        {/* ── Left Timeline ────────────────────────────── */}
        <div className="w-[280px] shrink-0 overflow-y-auto pr-2 relative">
          <div className="relative pl-[7px]">
            {/* Vertical line */}
            <div className="absolute left-[13px] top-0 bottom-0 w-px bg-neutral-100" />

            {sorted.map((m, i) => {
              const st = milestoneStatus(m);
              const isSelected = m.id === selected;
              const showTodayBefore = i === todayIndex;

              return (
                <div key={m.id}>
                  {/* Today divider */}
                  {showTodayBefore && (
                    <div className="relative flex items-center my-3 -ml-[7px]">
                      <div className="flex-1 border-t border-dashed border-[#a32d2d]" />
                      <span className="px-2 text-[11px] text-[#a32d2d] font-medium whitespace-nowrap">
                        {todayLabel}
                      </span>
                      <div className="flex-1 border-t border-dashed border-[#a32d2d]" />
                    </div>
                  )}

                  {/* Milestone row */}
                  <button
                    type="button"
                    onClick={() => setSelected(m.id)}
                    className={`
                      relative flex items-start gap-3 w-full text-left py-2.5 px-2 rounded-lg transition-colors
                      ${isSelected && st === "upcoming"
                        ? "border-[1.5px] border-[#378add] bg-[#f1efe8]"
                        : isSelected
                          ? "bg-neutral-100"
                          : "hover:bg-neutral-100/60"
                      }
                    `}
                  >
                    {/* Diamond */}
                    <div className="mt-0.5 relative z-10">
                      {st === "done" && <DiamondDone />}
                      {st === "overdue" && <DiamondOverdue />}
                      {st === "upcoming" && <DiamondUpcoming />}
                      {st === "future" && <DiamondFuture />}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          st === "done"
                            ? "text-neutral-950/60"
                            : st === "overdue"
                              ? "text-[#e24b4a]"
                              : "text-neutral-950"
                        }`}
                      >
                        {m.name}
                      </p>
                      <p
                        className={`text-[11px] mt-0.5 ${
                          st === "done"
                            ? "text-neutral-400"
                            : st === "overdue"
                              ? "text-[#e24b4a]"
                              : "text-neutral-400"
                        }`}
                      >
                        {fmtDate(m.due_date)}
                        {st === "done" && " \u00b7 done"}
                        {st === "overdue" && " \u00b7 overdue"}
                      </p>

                      {/* Progress bar for selected upcoming */}
                      {isSelected && (st === "upcoming" || st === "future") && selectedTasks.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-[#f1efe8]">
                            <div
                              className="h-full rounded-full bg-[#ef9f27] transition-all"
                              style={{ width: `${taskPercent}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-neutral-500">
                            {doneTasks.length} of {selectedTasks.length}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}

            {/* Today divider at end if all milestones are past */}
            {todayIndex === sorted.length && sorted.length > 0 && (
              <div className="relative flex items-center my-3 -ml-[7px]">
                <div className="flex-1 border-t border-dashed border-[#a32d2d]" />
                <span className="px-2 text-[11px] text-[#a32d2d] font-medium whitespace-nowrap">
                  {todayLabel}
                </span>
                <div className="flex-1 border-t border-dashed border-[#a32d2d]" />
              </div>
            )}

            {/* Add milestone */}
            {adding ? (
              <div className="mt-3 ml-[20px]">
                <input
                  ref={addInputRef}
                  type="text"
                  placeholder="Milestone name..."
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                    if (e.key === "Escape") { setAdding(false); setAddName(""); setAddDue(""); }
                  }}
                  className={`${INPUT} mb-1.5`}
                />
                <input
                  type="date"
                  value={addDue}
                  onChange={(e) => setAddDue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                    if (e.key === "Escape") { setAdding(false); setAddName(""); setAddDue(""); }
                  }}
                  className={`${INPUT} text-neutral-500`}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="mt-3 ml-[20px] w-[calc(100%-20px)] py-2.5 border border-dashed border-neutral-200 rounded-lg text-sm text-neutral-400 hover:text-neutral-600 hover:border-neutral-300 transition-colors"
              >
                + add milestone&hellip;
              </button>
            )}
          </div>
        </div>

        {/* ── Right Detail Card ────────────────────────── */}
        <div className="flex-1 min-w-0">
          {selectedMs ? (
            <DetailCard
              milestone={selectedMs}
              tasks={selectedTasks}
              visibleTasks={visibleTasks}
              extraCount={extraCount}
              doneTasks={doneTasks}
              taskPercent={taskPercent}
              onToggleComplete={handleToggleComplete}
              onDueChange={handleDueChange}
            />
          ) : (
            <div className={`${CARD} h-full flex items-center justify-center`}>
              <p className="text-sm text-neutral-400">Select a milestone to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Detail Card ───────────────────────────────────────── */

function DetailCard({
  milestone,
  tasks,
  visibleTasks,
  extraCount,
  doneTasks,
  taskPercent,
  onToggleComplete,
  onDueChange,
}: {
  milestone: Milestone;
  tasks: Task[];
  visibleTasks: Task[];
  extraCount: number;
  doneTasks: Task[];
  taskPercent: number;
  onToggleComplete: () => void;
  onDueChange: (val: string) => void;
}) {
  const st = milestoneStatus(milestone);
  const diff = daysDiff(milestone.due_date);

  const statusLabel =
    st === "done"
      ? "done"
      : st === "overdue"
        ? "overdue"
        : "upcoming";

  const statusPill =
    st === "done"
      ? "bg-ok-bg text-ok-fg"
      : st === "overdue"
        ? "bg-bad-bg text-bad-fg"
        : "bg-[#e6f1fb] text-[#0c447c]";

  const timeLabel =
    st === "done"
      ? `completed ${milestone.completed_at ? fmtDate(milestone.completed_at) : ""}`
      : st === "overdue"
        ? `${Math.abs(diff)} day${Math.abs(diff) !== 1 ? "s" : ""} overdue`
        : `in ${diff} day${diff !== 1 ? "s" : ""}`;

  return (
    <div className="bg-white rounded-xl border-[0.5px] border-neutral-100 h-full flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5 mb-3">
          <DiamondBlue />
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${statusPill}`}>
            {statusLabel}
          </span>
          <span className="text-[11px] text-neutral-400">{timeLabel}</span>
        </div>
        <h3 className="text-lg font-medium text-neutral-950">{milestone.name}</h3>
        {milestone.description && (
          <p className="text-md text-[#5f5e5a] mt-1.5 leading-relaxed">{milestone.description}</p>
        )}
      </div>

      <div className={DIVIDER} />

      {/* Due + Mark Complete */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Due</span>
          <input
            type="date"
            value={fmtDateInput(milestone.due_date)}
            onChange={(e) => onDueChange(e.target.value)}
            className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#378add] bg-white font-mono text-neutral-700"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={milestone.completed}
            onChange={onToggleComplete}
            className="w-4 h-4 rounded border-neutral-300 text-[#97c459] focus:ring-[#97c459] accent-[#97c459]"
          />
          <span className="text-sm text-neutral-500">mark complete</span>
        </label>
      </div>

      <div className={DIVIDER} />

      {/* Tasks section */}
      <div className="px-5 pt-4 pb-5 flex-1">
        {/* Tasks header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            Tasks <span className="mx-1">&middot;</span>{" "}
            <span className="font-mono">{doneTasks.length}</span> of{" "}
            <span className="font-mono">{tasks.length}</span>
          </span>
          <span className="text-[11px] text-neutral-400 font-mono">{taskPercent}% complete</span>
        </div>

        {/* Progress bar */}
        <div className={`${PROGRESS_BAR_TRACK} h-1.5 mb-4`}>
          <div
            className={`${PROGRESS_BAR_FILL} bg-[#ef9f27] transition-all`}
            style={{ width: `${taskPercent}%` }}
          />
        </div>

        {/* Task list */}
        {tasks.length === 0 ? (
          <p className="text-sm text-neutral-400">No tasks linked to this milestone</p>
        ) : (
          <div className="space-y-0.5">
            {visibleTasks.map((t) => {
              const ts = statusInitial(t.status);
              return (
                <div key={t.id} className="flex items-center gap-3 py-2 px-1 rounded hover:bg-neutral-50 transition-colors">
                  <StatusDot status={ts} />
                  <span className="flex-1 text-sm text-neutral-700 truncate">{t.title}</span>
                  <span className="text-[11px] text-neutral-400 shrink-0">
                    {t.assignee ? `${t.assignee.charAt(0).toUpperCase()}` : ""}{t.assignee && t.status === "done" ? " \u00b7 " : ""}{t.status === "done" ? "done" : ""}
                  </span>
                </div>
              );
            })}
            {extraCount > 0 && (
              <button type="button" className="text-[11px] text-[#378add] hover:underline mt-1 pl-1">
                + {extraCount} more
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
