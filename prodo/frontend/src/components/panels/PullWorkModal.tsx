"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { usePMStore } from "@/lib/store";

/* ── Types ─────────────────────────────────────────────── */

interface Task {
  id: string;
  title: string;
  project_name?: string;
  priority: string;
  estimated_hours?: number;
  assignee?: string | null;
}

export interface PullWorkModalProps {
  personName: string;
  personId: string;
  currentHours?: number;
  capacityHours?: number;
  onClose: () => void;
  onPulled?: () => void;
}

/* ── Constants ─────────────────────────────────────────── */

const AVATAR_COLORS: Record<string, { bg: string; fg: string }> = {
  rohith: { bg: "#cecbf6", fg: "#26215c" },
  priya: { bg: "#f5c4b3", fg: "#4a1b0c" },
  arjun: { bg: "#9fe1cb", fg: "#04342c" },
};

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
  backlog: 4,
};

const PRIORITY_DOT: Record<string, string> = {
  urgent: "#e24b4a",
  high: "#e24b4a",
  medium: "#ef9f27",
  low: "#85b7eb",
  backlog: "#888780",
};

/* ── Component ─────────────────────────────────────────── */

export default function PullWorkModal({
  personName,
  personId,
  currentHours = 32,
  capacityHours = 40,
  onClose,
  onPulled,
}: PullWorkModalProps) {
  const [unassignedTasks, setUnassignedTasks] = useState<Task[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pulling, setPulling] = useState(false);
  const [error, setError] = useState("");
  const tasks = usePMStore(s => s.tasks);
  const tasksStatus = usePMStore(s => s.tasksStatus);
  const fetchTasks = usePMStore(s => s.fetchTasks);
  const pullWork = usePMStore(s => s.pullWork);

  /* ── Fetch unassigned tasks on mount ─────────────────── */

  useEffect(() => {
    if (tasksStatus === "idle") fetchTasks().catch((e: any) => setError(e.message));
  }, [fetchTasks, tasksStatus]);

  useEffect(() => {
    const unassigned = tasks.filter((t: Task) => !t.assignee);
    unassigned.sort(
      (a: Task, b: Task) =>
        (PRIORITY_ORDER[a.priority] ?? 99) -
        (PRIORITY_ORDER[b.priority] ?? 99)
    );
    setUnassignedTasks(unassigned);
  }, [tasks, personId]);

  /* ── Derived values ──────────────────────────────────── */

  const selectedHours = useMemo(() => {
    let sum = 0;
    for (const t of unassignedTasks) {
      if (selected.has(t.id)) sum += t.estimated_hours ?? 0;
    }
    return sum;
  }, [unassignedTasks, selected]);

  const projectedHours = currentHours + selectedHours;
  const capacityPct = capacityHours > 0 ? (projectedHours / capacityHours) * 100 : 0;
  const currentPct = capacityHours > 0 ? (currentHours / capacityHours) * 100 : 0;

  const capacityColor =
    capacityPct > 95 ? "#a32d2d" : capacityPct > 75 ? "#ef9f27" : "#34a853";

  /* ── Handlers ────────────────────────────────────────── */

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handlePull = useCallback(async () => {
    if (selected.size === 0) return;
    setPulling(true);
    setError("");
    try {
      for (const taskId of Array.from(selected)) {
        await pullWork(taskId, personId);
      }
      onPulled?.();
      onClose();
    } catch (e: any) {
      setError(e.message || "Unable to pull work");
    } finally {
      setPulling(false);
    }
  }, [selected, personId, onPulled, onClose]);

  /* ── Avatar ──────────────────────────────────────────── */

  const nameKey = personName.toLowerCase().split(" ")[0];
  const avatarColor = AVATAR_COLORS[nameKey] ?? { bg: "#d4d2cf", fg: "#3a3835" };
  const initials = personName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  /* ── Render ──────────────────────────────────────────── */

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", fontFamily: "'Geist', sans-serif" }}
      onClick={onClose}
    >
      {/* Modal card */}
      <div
        className="relative flex flex-col"
        style={{
          width: 480,
          backgroundColor: "#ffffff",
          borderRadius: 12,
          padding: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: avatarColor.bg,
              color: avatarColor.fg,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {initials}
          </div>

          <div className="flex flex-col min-w-0">
            <span style={{ fontSize: 15, fontWeight: 500, color: "#1a1917" }}>
              Pull work for {personName}
            </span>
            <span style={{ fontSize: 11, color: "#8a8885" }}>
              Currently assigned: {currentHours}h this week
            </span>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="ml-auto flex items-center justify-center shrink-0"
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              fontSize: 18,
              color: "#8a8885",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            &times;
          </button>
        </div>

        {/* ── Capacity card ───────────────────────────── */}
        <div
          className="flex flex-col gap-2"
          style={{
            marginTop: 16,
            backgroundColor: "#faeeda",
            border: "1px solid #ba7517",
            borderRadius: 8,
            padding: 12,
          }}
        >
          {/* Cap header */}
          <div className="flex items-center justify-between">
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#412402",
                letterSpacing: "0.03em",
              }}
            >
              CAPACITY THIS WEEK
            </span>
            <span style={{ fontSize: 11, color: "#412402" }}>
              {capacityHours}h max
            </span>
          </div>

          {/* Bar */}
          <div
            className="relative w-full"
            style={{
              height: 14,
              borderRadius: 9999,
              backgroundColor: "#ffffff",
            }}
          >
            {/* Projected fill (lighter amber) */}
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: `${Math.min(capacityPct, 100)}%`,
                borderRadius: 9999,
                backgroundColor: "#f5d89a",
                transition: "width 0.2s ease",
              }}
            />
            {/* Current fill (amber) */}
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: `${Math.min(currentPct, 100)}%`,
                borderRadius: 9999,
                backgroundColor: "#ef9f27",
                transition: "width 0.2s ease",
              }}
            />
            {/* Capacity red line */}
            <div
              className="absolute inset-y-0"
              style={{
                left: "100%",
                width: 2,
                backgroundColor: "#a32d2d",
                transform: "translateX(-2px)",
                borderRadius: 1,
              }}
            />
          </div>

          {/* Cap footer */}
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 11, color: "#412402" }}>
              {currentHours}h current &rarr; {projectedHours}h projected
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: capacityColor,
              }}
            >
              {Math.round(capacityPct)}%
            </span>
          </div>
        </div>

        {/* ── Task list header ────────────────────────── */}
        <div
          className="flex items-center justify-between"
          style={{ marginTop: 16, marginBottom: 8 }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#8a8885",
              letterSpacing: "0.03em",
            }}
          >
            {unassignedTasks.length} UNASSIGNED TASKS
          </span>
          <span style={{ fontSize: 11, color: "#8a8885" }}>
            sort: priority &#x25BE;
          </span>
        </div>

        {/* ── Task rows ───────────────────────────────── */}
        <div
          className="flex flex-col overflow-y-auto"
          style={{ gap: 6, maxHeight: 320 }}
        >
          {unassignedTasks.map((task) => {
            const isSelected = selected.has(task.id);
            const isBacklog = task.priority === "backlog";
            const dotColor = PRIORITY_DOT[task.priority] ?? "#888780";
            const priorityLabel = task.priority ?? "backlog";
            const hours = task.estimated_hours ?? 0;

            return (
              <button
                key={task.id}
                type="button"
                className="flex items-center w-full text-left"
                style={{
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: isSelected
                    ? "1.5px solid #378add"
                    : "1px solid #E9E5E4",
                  backgroundColor: "#ffffff",
                  opacity: isBacklog ? 0.6 : 1,
                  cursor: "pointer",
                  transition: "border-color 0.15s ease",
                }}
                onClick={() => toggle(task.id)}
              >
                {/* Checkbox */}
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    border: isSelected ? "none" : "1.5px solid #E9E5E4",
                    backgroundColor: isSelected ? "#378add" : "#ffffff",
                  }}
                >
                  {isSelected && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                    >
                      <path
                        d="M2 5.2L4.2 7.4L8 3"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>

                {/* Priority dot */}
                <div
                  className="shrink-0"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: dotColor,
                  }}
                />

                {/* Text */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#1a1917",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {task.title}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: "#8a8885",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {task.project_name ? `${task.project_name} \u00B7 ` : "PIPE \u00B7 "}
                    {priorityLabel} priority \u00B7 best fit
                  </span>
                </div>

                {/* Hours */}
                <span
                  className="shrink-0"
                  style={{ fontSize: 11, fontWeight: 500, color: "#1a1917" }}
                >
                  {hours}h
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-3 text-xs rounded-md px-3 py-2" style={{ background: "#fcebeb", color: "#991B1B" }}>
            {error}
          </div>
        )}

        {/* ── Footer ──────────────────────────────────── */}
        <div
          style={{
            marginTop: 16,
            borderTop: "0.5px solid #E9E5E4",
            paddingTop: 14,
          }}
          className="flex items-center justify-end gap-3"
        >
          <button
            onClick={onClose}
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#3a3835",
              padding: "7px 16px",
              borderRadius: 6,
              border: "1px solid #b4b2a9",
              backgroundColor: "#ffffff",
              cursor: "pointer",
            }}
          >
            cancel
          </button>
          <button
            onClick={handlePull}
            disabled={selected.size === 0 || pulling}
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#ffffff",
              padding: "7px 16px",
              borderRadius: 6,
              border: "none",
              backgroundColor:
                selected.size === 0 || pulling ? "#93bde6" : "#378add",
              cursor: selected.size === 0 || pulling ? "default" : "pointer",
              transition: "background-color 0.15s ease",
            }}
          >
            {pulling
              ? "pulling\u2026"
              : `pull ${selected.size} task${selected.size !== 1 ? "s" : ""} \u00B7 ${selectedHours}h \u2192`}
          </button>
        </div>
      </div>
    </div>
  );
}
