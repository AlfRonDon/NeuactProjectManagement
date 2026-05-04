"use client";

import React, { useMemo } from "react";

/* ── Types ───────────────────────────────────────────── */

export interface StatusBoardTask {
  id: string;
  title: string;
  status: string; // "todo" | "active" | "blocked" | "done"
  assignee?: string;
  start?: string; // date string e.g. "2026-04-13"
  duration?: number; // days
  deps?: string[]; // task titles this depends on
  blocks?: string[]; // task titles this blocks
  phase?: string;
  isCriticalPath?: boolean;
}

export interface StatusBoardProps {
  tasks: StatusBoardTask[];
  onSelect?: (taskId: string | null) => void;
  selected?: string | null;
  onDone?: () => void;
}

/* ── Constants ───────────────────────────────────────── */

const COLUMNS = [
  { key: "todo", label: "To Do", dotClass: "bg-neutral-400" },
  { key: "active", label: "Active", dotClass: "bg-warn-solid" },
  { key: "blocked", label: "Blocked", dotClass: "bg-bad-solid" },
  { key: "done", label: "Done", dotClass: "bg-ok-solid" },
] as const;

type StatusKey = (typeof COLUMNS)[number]["key"];

const STATUS_TIMELINE_COLOR: Record<string, string> = {
  todo: "#a0a0a0",
  active: "var(--warn-solid, #ef9f27)",
  blocked: "var(--bad-solid, #a32d2d)",
  done: "var(--ok-solid, #97c459)",
};

/* Known avatar palettes — falls back to hash-based for unknown names */
const AVATAR_PALETTE: Record<string, { bg: string; fg: string }> = {
  rohith: { bg: "#cecbf6", fg: "#26215c" },
  arjun: { bg: "#9fe1cb", fg: "#04342c" },
};

function getAvatarStyle(name: string): { bg: string; fg: string } {
  const key = name.toLowerCase().trim();
  if (AVATAR_PALETTE[key]) return AVATAR_PALETTE[key];
  // deterministic hash fallback
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  const bgs = ["#E0E7FF", "#CCFBF1", "#FCE7F3", "#EDE9FE", "#FEF3C7"];
  const fgs = ["#3730A3", "#115E59", "#9D174D", "#5B21B6", "#92400E"];
  const idx = h % 5;
  return { bg: bgs[idx], fg: fgs[idx] };
}

/* ── Helpers ─────────────────────────────────────────── */

function parseDate(d?: string): Date | null {
  if (!d) return null;
  const t = new Date(d);
  return isNaN(t.getTime()) ? null : t;
}

function formatShortDate(d: Date): string {
  const mon = d.toLocaleString("en-US", { month: "short" }).toLowerCase();
  return `${mon} ${d.getDate()}`;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/* ── Sprint window computation ───────────────────────── */

function computeSprintWindow(tasks: StatusBoardTask[]): { start: Date; end: Date; days: number } {
  const now = new Date();
  let earliest = now;
  let latest = new Date(now.getTime() + 30 * 86_400_000);

  for (const t of tasks) {
    const s = parseDate(t.start);
    if (s) {
      if (s < earliest) earliest = s;
      const end = new Date(s.getTime() + (t.duration ?? 7) * 86_400_000);
      if (end > latest) latest = end;
    }
  }
  // add padding
  earliest = new Date(earliest.getTime() - 2 * 86_400_000);
  latest = new Date(latest.getTime() + 2 * 86_400_000);

  return { start: earliest, end: latest, days: Math.max(1, daysBetween(earliest, latest)) };
}

/* ── Dependency label builder ────────────────────────── */

interface DepLabel {
  type: "needs" | "blocks" | "unblocked" | "none";
  text: string;
  dotColor: string;
}

function buildDepLabels(task: StatusBoardTask, allTasks: StatusBoardTask[]): DepLabel[] {
  const labels: DepLabel[] = [];
  const taskMap = new Map(allTasks.map(t => [t.id, t]));
  const titleMap = new Map(allTasks.map(t => [t.title.toLowerCase(), t]));

  // deps = tasks this task depends on (needs)
  if (task.deps && task.deps.length > 0) {
    for (const depRef of task.deps) {
      const depTask = taskMap.get(depRef) ?? titleMap.get(depRef.toLowerCase());
      if (depTask) {
        const isDone = depTask.status === "done";
        if (isDone) {
          labels.push({ type: "unblocked", text: depTask.title.toLowerCase(), dotColor: "var(--ok-solid, #97c459)" });
        } else {
          labels.push({ type: "needs", text: depTask.title.toLowerCase(), dotColor: "var(--warn-solid, #ef9f27)" });
        }
      } else {
        labels.push({ type: "needs", text: depRef.toLowerCase(), dotColor: "var(--warn-solid, #ef9f27)" });
      }
    }
  }

  // blocks = tasks this task blocks
  if (task.blocks && task.blocks.length > 0) {
    for (const blockRef of task.blocks) {
      const blTask = taskMap.get(blockRef) ?? titleMap.get(blockRef.toLowerCase());
      labels.push({
        type: "blocks",
        text: (blTask?.title ?? blockRef).toLowerCase(),
        dotColor: "var(--bad-solid, #a32d2d)",
      });
    }
  }

  // Also check reverse: any task whose deps include this task's id or title
  for (const other of allTasks) {
    if (other.id === task.id) continue;
    const thisBlocks = other.deps?.some(d =>
      d === task.id || d.toLowerCase() === task.title.toLowerCase()
    );
    if (thisBlocks && !labels.some(l => l.type === "blocks" && l.text === other.title.toLowerCase())) {
      labels.push({
        type: "blocks",
        text: other.title.toLowerCase(),
        dotColor: "var(--bad-solid, #a32d2d)",
      });
    }
  }

  if (labels.length === 0) {
    labels.push({ type: "none", text: "no dependencies", dotColor: "transparent" });
  }

  return labels;
}

/* ── Critical path computation ───────────────────────── */

interface CriticalPathChip {
  label: string;
  status: string;
}

function buildCriticalPath(tasks: StatusBoardTask[]): {
  chips: CriticalPathChip[];
  endStatus: string;
  hasNoOwner: boolean;
} {
  const cpTasks = tasks.filter(t => t.isCriticalPath).sort((a, b) => {
    const sa = parseDate(a.start);
    const sb = parseDate(b.start);
    if (sa && sb) return sa.getTime() - sb.getTime();
    return 0;
  });

  const chips = cpTasks.map(t => ({
    label: (t.phase ?? t.title).toLowerCase(),
    status: t.status,
  }));

  const lastTask = cpTasks[cpTasks.length - 1];
  const endStatus = lastTask?.status ?? "todo";
  const hasNoOwner = cpTasks.some(t => !t.assignee);

  return { chips, endStatus, hasNoOwner };
}

const CP_CHIP_STYLES: Record<string, { bg: string; text: string }> = {
  done: { bg: "bg-ok-bg", text: "text-ok-fg" },
  active: { bg: "bg-warn-bg", text: "text-warn-fg" },
  blocked: { bg: "bg-bad-bg", text: "text-bad-fg" },
  todo: { bg: "bg-neutral-100", text: "text-neutral-500" },
};

/* ── Footer message builder ──────────────────────────── */

function buildFooterMessage(tasks: StatusBoardTask[]): string {
  const blocked = tasks.filter(t => t.status === "blocked");
  const unassigned = tasks.filter(t => !t.assignee);

  const parts: string[] = [];
  if (blocked.length > 0) {
    parts.push(`${blocked.length} task${blocked.length > 1 ? "s" : ""} blocked — cascading risk on downstream work`);
  }
  if (unassigned.length > 0) {
    parts.push(`${unassigned.length} unassigned task${unassigned.length > 1 ? "s" : ""} need owners`);
  }
  if (parts.length === 0) {
    parts.push("all tasks have owners and no blockers detected");
  }
  return parts.join(". ") + ".";
}

/* ── Mini Timeline ───────────────────────────────────── */

function MiniTimeline({ task, sprint }: {
  task: StatusBoardTask;
  sprint: { start: Date; end: Date; days: number };
}) {
  const taskStart = parseDate(task.start);
  const dur = task.duration ?? 7;
  const isBlocked = task.status === "blocked";
  const today = new Date();

  if (!taskStart) {
    return (
      <div className="w-full h-1 rounded-full" style={{ backgroundColor: isBlocked ? "#f7c1c1" : "#e5e3dd" }} />
    );
  }

  const offsetPct = Math.max(0, Math.min(100,
    (daysBetween(sprint.start, taskStart) / sprint.days) * 100
  ));
  const widthPct = Math.max(2, Math.min(100 - offsetPct,
    (dur / sprint.days) * 100
  ));
  const todayPct = (daysBetween(sprint.start, today) / sprint.days) * 100;
  const showToday = todayPct >= 0 && todayPct <= 100;

  const barColor = STATUS_TIMELINE_COLOR[task.status] ?? "#a0a0a0";

  return (
    <div className="relative w-full h-1 rounded-full" style={{ backgroundColor: isBlocked ? "#f7c1c1" : "#e5e3dd" }}>
      <div
        className="absolute top-0 h-full rounded-full"
        style={{
          left: `${offsetPct}%`,
          width: `${widthPct}%`,
          backgroundColor: barColor,
        }}
      />
      {showToday && (
        <div
          className="absolute top-[-2px] h-[8px] w-px"
          style={{
            left: `${todayPct}%`,
            backgroundColor: "rgba(226, 75, 74, 0.6)",
          }}
        />
      )}
    </div>
  );
}

/* ── Task Card ───────────────────────────────────────── */

function TaskCard({ task, allTasks, sprint, isSelected, onSelect }: {
  task: StatusBoardTask;
  allTasks: StatusBoardTask[];
  sprint: { start: Date; end: Date; days: number };
  isSelected: boolean;
  onSelect?: (id: string | null) => void;
}) {
  const isBlocked = task.status === "blocked";
  const isDone = task.status === "done";
  const depLabels = useMemo(() => buildDepLabels(task, allTasks), [task, allTasks]);

  // Date row
  const taskStart = parseDate(task.start);
  const dur = task.duration ?? 0;
  let dateStr = "";
  let durationStr = "";
  let isLate = false;

  if (taskStart && dur > 0) {
    const endDate = new Date(taskStart.getTime() + dur * 86_400_000);
    dateStr = `${formatShortDate(taskStart)} → ${endDate.getDate()}`;
    durationStr = `${dur}d`;

    // Check if overdue
    const today = new Date();
    if (endDate < today && task.status !== "done") {
      const lateDays = daysBetween(endDate, today);
      durationStr = lateDays > 0 ? `${lateDays}d late` : "overdue";
      isLate = true;
    }
  }

  // Avatar
  const hasAssignee = !!task.assignee;
  const avatarStyle = hasAssignee ? getAvatarStyle(task.assignee!) : null;

  return (
    <button
      onClick={() => onSelect?.(isSelected ? null : task.id)}
      className={`
        w-full text-left rounded-lg border p-2.5 transition-all
        ${isBlocked
          ? "bg-[#fcebeb] border-[#f09595]"
          : "bg-white border-neutral-200"
        }
        ${isSelected ? "ring-2 ring-neutral-950 ring-offset-1" : ""}
        ${isDone ? "opacity-[0.92]" : ""}
        hover:shadow-sm
      `}
    >
      {/* 1. Title row */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`text-md font-medium leading-tight truncate flex-1 ${isBlocked ? "text-[#501313]" : "text-neutral-950"}`}>
          {task.title}
        </span>
        {task.isCriticalPath && (
          <span className="w-1.5 h-1.5 rounded-full bg-bad-solid shrink-0" />
        )}
      </div>

      {/* 2. Assignee row */}
      <div className="flex items-center gap-1.5 mb-2">
        {hasAssignee ? (
          <>
            <div
              className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
              style={{ backgroundColor: avatarStyle!.bg, color: avatarStyle!.fg }}
            >
              {task.assignee!.charAt(0).toUpperCase()}
            </div>
            <span className={`text-xs ${isBlocked ? "text-[#501313]" : "text-neutral-700"}`}>
              {task.assignee}
            </span>
          </>
        ) : (
          <>
            <div className="w-[18px] h-[18px] rounded-full border border-dashed border-bad-solid bg-[#fcebeb] flex items-center justify-center text-[9px] font-bold text-[#501313] shrink-0">
              ?
            </div>
            <span className="text-xs text-bad-fg font-medium">unassigned</span>
          </>
        )}
      </div>

      {/* 3. Mini timeline */}
      <div className="mb-1.5">
        <MiniTimeline task={task} sprint={sprint} />
      </div>

      {/* 4. Date row */}
      {(dateStr || durationStr) && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-neutral-500">{dateStr}</span>
          <span className={`text-xs ${isLate ? "text-bad-fg font-medium" : "text-neutral-500"}`}>
            {durationStr}
          </span>
        </div>
      )}

      {/* 5. Separator */}
      <div className="border-t border-neutral-200 my-1.5" />

      {/* 6. Dependencies */}
      <div className="flex flex-wrap gap-x-2 gap-y-1">
        {depLabels.map((dep, i) => (
          <span key={i} className="flex items-center gap-1">
            {dep.type !== "none" && (
              <span
                className="w-[5px] h-[5px] rounded-full shrink-0"
                style={{ backgroundColor: dep.dotColor }}
              />
            )}
            <span className={`text-xs ${isBlocked ? "text-[#501313]" : "text-neutral-500"}`}>
              {dep.type !== "none" && (
                <span className="font-medium">{dep.type}</span>
              )}
              {dep.type !== "none" ? ` · ${dep.text}` : dep.text}
            </span>
          </span>
        ))}
      </div>
    </button>
  );
}

/* ── Main Component ──────────────────────────────────── */

export default function StatusBoard({ tasks, onSelect, selected, onDone }: StatusBoardProps) {
  const sprint = useMemo(() => computeSprintWindow(tasks), [tasks]);
  const criticalPath = useMemo(() => buildCriticalPath(tasks), [tasks]);
  const footerMsg = useMemo(() => buildFooterMessage(tasks), [tasks]);
  const hasCriticalPath = criticalPath.chips.length > 0;

  // Group tasks by status
  const columns = useMemo(() => {
    const grouped: Record<StatusKey, StatusBoardTask[]> = {
      todo: [], active: [], blocked: [], done: [],
    };
    for (const t of tasks) {
      const key = (t.status as StatusKey) in grouped ? (t.status as StatusKey) : "todo";
      grouped[key].push(t);
    }
    return grouped;
  }, [tasks]);

  return (
    <div className="flex flex-col h-full bg-neutral-50 rounded-lg border border-neutral-200 shadow-xsmall overflow-hidden">

      {/* ── Critical Path Banner ── */}
      {hasCriticalPath && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-neutral-100 border-b border-neutral-200 shrink-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-bad-solid" />
            <span className="text-xs font-semibold text-neutral-700">critical path</span>
          </div>

          <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
            {criticalPath.chips.map((chip, i) => {
              const style = CP_CHIP_STYLES[chip.status] ?? CP_CHIP_STYLES.todo;
              return (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-neutral-400 text-xs shrink-0">→</span>}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${style.bg} ${style.text}`}>
                    {chip.label}
                  </span>
                </React.Fragment>
              );
            })}
          </div>

          <div className="text-xs text-bad-fg shrink-0">
            {criticalPath.endStatus === "blocked" && "ends blocked"}
            {criticalPath.hasNoOwner && " · no owner"}
          </div>
        </div>
      )}

      {/* ── Done button (top-right floating) ── */}
      {onDone && (
        <div className="flex justify-end px-4 pt-2 shrink-0">
          <button
            onClick={onDone}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
          >
            Done
          </button>
        </div>
      )}

      {/* ── Kanban Columns ── */}
      <div className="flex-1 flex gap-3 p-4 overflow-x-auto min-h-0">
        {COLUMNS.map(col => {
          const colTasks = columns[col.key];
          return (
            <div key={col.key} className="flex-1 min-w-[220px] flex flex-col min-h-0">
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={`w-2 h-2 rounded-full ${col.dotClass}`} />
                <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                  {col.label}
                </span>
                <span className="text-xs text-neutral-500 font-medium">
                  {colTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
                {colTasks.length === 0 && (
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-xs text-neutral-400 italic">No tasks</span>
                  </div>
                )}
                {colTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    allTasks={tasks}
                    sprint={sprint}
                    isSelected={selected === task.id}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-2.5 bg-neutral-100 border-t border-neutral-200 shrink-0">
        <p className="text-xs text-neutral-700">
          <span className="font-bold">read at a glance:</span>{" "}
          <span className="font-normal">{footerMsg}</span>
        </p>
      </div>
    </div>
  );
}
