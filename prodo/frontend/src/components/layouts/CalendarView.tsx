"use client";

import React, { useState, useMemo } from "react";

/* ── Types ───────────────────────────────────────────── */

export interface CalendarTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  assignee?: string;
  start?: string;
  due?: string;
  duration?: number;
  estimated_hours?: number;
  deps?: string[];
  blocks?: string[];
  phase?: string;
}

export interface CalendarViewProps {
  tasks: CalendarTask[];
}

/* ── Constants ───────────────────────────────────────── */

type TabKey = "weekly" | "monthly" | "split" | "timeline";

const TABS: { key: TabKey; label: string }[] = [
  { key: "weekly", label: "weekly" },
  { key: "monthly", label: "monthly" },
  { key: "split", label: "split" },
  { key: "timeline", label: "timeline" },
];

const STATUS_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  done: { bg: "#c0dd97", border: "#97c459", label: "done" },
  in_progress: { bg: "#faeeda", border: "#ef9f27", label: "in progress" },
  active: { bg: "#faece7", border: "#d85a30", label: "active" },
  blocked: { bg: "#fcebeb", border: "#e24b4a", label: "blocked" },
  in_review: { bg: "#b5d4f4", border: "#378add", label: "in review" },
  todo: { bg: "#e6f1fb", border: "#85b7eb", label: "to do" },
  backlog: { bg: "#e5e5e2", border: "#888780", label: "backlog" },
};

const LEGEND_ITEMS = [
  { color: "#97c459", label: "done" },
  { color: "#ef9f27", label: "in progress" },
  { color: "#d85a30", label: "active" },
  { color: "#e24b4a", label: "blocked" },
  { color: "#378add", label: "in review" },
  { color: "#85b7eb", label: "to do" },
  { color: "#888780", label: "backlog" },
];

const STATUS_BAR_COLORS: Record<string, string> = {
  done: "#97c459",
  in_progress: "#ef9f27",
  active: "#d85a30",
  blocked: "#e24b4a",
  in_review: "#378add",
  todo: "#85b7eb",
  backlog: "#888780",
};

const AVATAR_PALETTE: Record<string, { bg: string; fg: string }> = {
  rohith: { bg: "#cecbf6", fg: "#26215c" },
  arjun: { bg: "#9fe1cb", fg: "#04342c" },
};

const DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_NAMES_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_NAMES_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/* ── Helpers ─────────────────────────────────────────── */

function getAvatarStyle(name: string): { bg: string; fg: string } {
  const key = name.toLowerCase().trim();
  if (AVATAR_PALETTE[key]) return AVATAR_PALETTE[key];
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  const bgs = ["#E0E7FF", "#CCFBF1", "#FCE7F3", "#EDE9FE", "#FEF3C7"];
  const fgs = ["#3730A3", "#115E59", "#9D174D", "#5B21B6", "#92400E"];
  const idx = h % 5;
  return { bg: bgs[idx], fg: fgs[idx] };
}

function parseDate(d?: string): Date | null {
  if (!d) return null;
  const t = new Date(d);
  return isNaN(t.getTime()) ? null : t;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatShortDate(d: Date): string {
  const mon = d.toLocaleString("en-US", { month: "short" }).toLowerCase();
  return `${mon} ${d.getDate()}`;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function getStatusColor(status: string) {
  return STATUS_COLORS[status] ?? STATUS_COLORS.todo;
}

function getTasksForDate(tasks: CalendarTask[], date: Date): CalendarTask[] {
  return tasks.filter((t) => {
    const start = parseDate(t.start);
    const due = parseDate(t.due);
    if (start && due) {
      return date >= start && date <= due;
    }
    if (start) {
      const dur = t.duration ?? 1;
      const end = new Date(start.getTime() + (dur - 1) * 86_400_000);
      return date >= start && date <= end;
    }
    if (due) {
      return isSameDay(date, due);
    }
    return false;
  });
}

function getWeekDueThisWeek(tasks: CalendarTask[], today: Date): CalendarTask[] {
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return tasks.filter((t) => {
    const due = parseDate(t.due);
    if (due) return due >= monday && due <= sunday;
    const start = parseDate(t.start);
    if (start) {
      const dur = t.duration ?? 1;
      const end = new Date(start.getTime() + (dur - 1) * 86_400_000);
      return end >= monday && end <= sunday;
    }
    return false;
  });
}

/* ── Shared Components ───────────────────────────────── */

function TabBar({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "2px",
        alignItems: "flex-start",
        padding: "2px",
        backgroundColor: "#f1efe8",
        borderRadius: "6px",
        overflow: "hidden",
      }}
    >
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            display: "flex",
            alignItems: "flex-start",
            padding: "3px 8px",
            borderRadius: "4px",
            overflow: "hidden",
            backgroundColor: active === tab.key ? "#ffffff" : "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: "'Geist', sans-serif",
            fontWeight: active === tab.key ? 500 : 400,
            fontSize: "11px",
            lineHeight: "normal",
            color: active === tab.key ? "#2c2c2a" : "#888780",
            whiteSpace: "nowrap" as const,
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function LegendRow() {
  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "center",
        overflow: "hidden",
        paddingBottom: "4px",
        width: "100%",
      }}
    >
      {LEGEND_ITEMS.map((item) => (
        <div
          key={item.label}
          style={{
            display: "flex",
            gap: "4px",
            alignItems: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "2px",
              backgroundColor: item.color,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "'Geist', sans-serif",
              fontWeight: 400,
              fontSize: "10px",
              lineHeight: "normal",
              color: "#5f5e5a",
              whiteSpace: "nowrap" as const,
            }}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function Footer({ tasks }: { tasks: CalendarTask[] }) {
  const today = new Date();
  const dueTasks = getWeekDueThisWeek(tasks, today);
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "4px 8px",
        alignItems: "center",
        alignContent: "center",
        padding: "8px 12px",
        backgroundColor: "#f1efe8",
        borderRadius: "6px",
        overflow: "hidden",
        width: "100%",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: "'Geist', sans-serif",
          fontWeight: 500,
          fontSize: "11px",
          lineHeight: "normal",
          color: "#5f5e5a",
          whiteSpace: "nowrap" as const,
          flexShrink: 0,
        }}
      >
        due this week:
      </span>
      {dueTasks.length === 0 && (
        <span
          style={{
            fontFamily: "'Geist', sans-serif",
            fontWeight: 400,
            fontSize: "10px",
            lineHeight: "normal",
            color: "#888780",
            whiteSpace: "nowrap" as const,
          }}
        >
          no upcoming tasks
        </span>
      )}
      {dueTasks.slice(0, 8).map((t) => (
        <div
          key={t.id}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "2px 8px",
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "'Geist', sans-serif",
              fontWeight: 400,
              fontSize: "10px",
              lineHeight: "normal",
              color: "#5f5e5a",
              whiteSpace: "nowrap" as const,
            }}
          >
            {t.title}
          </span>
        </div>
      ))}
      {dueTasks.length > 8 && (
        <span
          style={{
            fontFamily: "'Geist', sans-serif",
            fontWeight: 400,
            fontSize: "10px",
            color: "#888780",
          }}
        >
          +{dueTasks.length - 8} more
        </span>
      )}
    </div>
  );
}

/* ── Weekly View (7-column week strip) ──────────────── */

function WeeklyView({ tasks }: { tasks: CalendarTask[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekDays = useMemo(() => {
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const MAX_VISIBLE = 3;

  return (
    <div style={{ flex: 1, display: "flex", gap: "6px", padding: "12px", minHeight: 0, overflow: "auto" }}>
      {weekDays.map((date, colIdx) => {
        const isToday = isSameDay(date, today);
        const dayTasks = getTasksForDate(tasks, date);
        const visible = dayTasks.slice(0, MAX_VISIBLE);
        const overflow = dayTasks.length - MAX_VISIBLE;

        const statusCounts: Record<string, number> = {};
        for (const t of dayTasks) {
          statusCounts[t.status] = (statusCounts[t.status] ?? 0) + 1;
        }

        return (
          <div
            key={colIdx}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              borderRadius: "6px",
              minWidth: 0,
              backgroundColor: isToday ? "#faeeda" : "#f1efe8",
              border: isToday ? "0.5px solid #f0c97d" : "none",
              padding: "8px 6px",
              gap: "6px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span
                style={{
                  fontFamily: "'Geist', sans-serif",
                  fontWeight: 400,
                  fontSize: "9px",
                  lineHeight: "12px",
                  color: isToday ? "#412402" : "#888780",
                }}
              >
                {DAY_NAMES[colIdx]}
              </span>
              <span
                style={{
                  fontFamily: "'Geist', sans-serif",
                  fontWeight: 500,
                  fontSize: "18px",
                  lineHeight: "22px",
                  color: isToday ? "#412402" : "#2c2c2a",
                }}
              >
                {date.getDate()}
              </span>
              {isToday && (
                <span style={{ fontSize: "9px", lineHeight: "12px", color: "#412402" }}>
                  today
                </span>
              )}
            </div>

            <div style={{ height: "0.5px", backgroundColor: isToday ? "#f0c97d" : "#e5e3dd" }} />

            {dayTasks.length > 0 && (
              <div style={{ display: "flex", borderRadius: "2px", overflow: "hidden", height: "3px" }}>
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div
                    key={status}
                    style={{
                      flex: count,
                      backgroundColor: STATUS_BAR_COLORS[status] ?? "#888780",
                    }}
                  />
                ))}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {visible.map((task) => {
                const isBlocked = task.status === "blocked";
                const statusColor = STATUS_BAR_COLORS[task.status] ?? "#888780";
                const assigneeInitial = task.assignee ? task.assignee.charAt(0).toUpperCase() : "";
                const durationLabel = task.duration ? `${task.duration}d` : "";
                const subtitle = [assigneeInitial, durationLabel].filter(Boolean).join(" \u00B7 ");

                return (
                  <div
                    key={task.id}
                    style={{
                      display: "flex",
                      borderRadius: "3px",
                      overflow: "hidden",
                      backgroundColor: isBlocked ? "#fcebeb" : "#ffffff",
                      border: isBlocked ? "0.5px solid #f09595" : "0.5px solid #e5e3dd",
                    }}
                  >
                    <div
                      style={{
                        width: "3px",
                        alignSelf: "stretch",
                        flexShrink: 0,
                        backgroundColor: statusColor,
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0, padding: "5px 6px", gap: "2px" }}>
                      <span
                        style={{
                          fontFamily: "'Geist', sans-serif",
                          fontWeight: 500,
                          fontSize: "10px",
                          lineHeight: "13px",
                          color: isBlocked ? "#501313" : "#2c2c2a",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap" as const,
                        }}
                      >
                        {task.title}
                      </span>
                      {subtitle && (
                        <span
                          style={{
                            fontFamily: "'Geist', sans-serif",
                            fontWeight: 400,
                            fontSize: "9px",
                            lineHeight: "12px",
                            color: isBlocked ? "#791f1f" : "#888780",
                          }}
                        >
                          {subtitle}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {overflow > 0 && (
              <span
                style={{
                  fontFamily: "'Geist', sans-serif",
                  fontSize: "9px",
                  color: isToday ? "#412402" : "#888780",
                  textAlign: "center",
                }}
              >
                +{overflow} more
              </span>
            )}

            {dayTasks.length === 0 && (
              <span
                style={{
                  fontFamily: "'Geist', sans-serif",
                  fontSize: "9px",
                  color: "#888780",
                  textAlign: "center",
                  padding: "8px 0",
                }}
              >
                no tasks
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Monthly View ────────────────────────────────────── */

function getMonthGrid(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const cells: Date[] = [];
  for (let i = 0; i < startDow; i++) {
    cells.push(new Date(year, month, 1 - (startDow - i)));
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(new Date(year, month, d));
  }
  while (cells.length % 7 !== 0 || cells.length < 35) {
    const last = cells[cells.length - 1];
    cells.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
  }

  const rows: Date[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

function MonthlyView({ tasks }: { tasks: CalendarTask[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const grid = useMemo(() => getMonthGrid(today.getFullYear(), today.getMonth()), []);
  const currentMonth = today.getMonth();

  // Determine if a date is a weekend (Sat=6, Sun=0)
  const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

  return (
    <div style={{ flex: 1, overflow: "auto", minHeight: 0, display: "flex", flexDirection: "column", gap: "0px" }}>
      {/* Day-of-week header row */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          alignItems: "center",
          overflow: "hidden",
          padding: "0 4px 4px",
          width: "100%",
          flexShrink: 0,
        }}
      >
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            style={{
              flex: "1 0 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "1px",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                fontFamily: "'Geist', sans-serif",
                fontWeight: 400,
                fontSize: "9px",
                lineHeight: "normal",
                color: "#888780",
                textAlign: "center",
                whiteSpace: "nowrap" as const,
              }}
            >
              {d}
            </span>
          </div>
        ))}
      </div>

      {/* Week rows */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          alignItems: "flex-start",
          overflow: "hidden",
          width: "100%",
          flexShrink: 0,
        }}
      >
        {grid.map((week, weekIdx) => (
          <div
            key={weekIdx}
            style={{
              display: "flex",
              gap: "6px",
              alignItems: "flex-start",
              overflow: "hidden",
              width: "100%",
              flexShrink: 0,
            }}
          >
            {week.map((date, dayIdx) => {
              const isToday = isSameDay(date, today);
              const isCurrentMonth = date.getMonth() === currentMonth;
              const dayTasks = getTasksForDate(tasks, date);
              const hasBlocked = dayTasks.some((t) => t.status === "blocked");

              // Status counts for the strip
              const statusCounts: Record<string, number> = {};
              for (const t of dayTasks) {
                statusCounts[t.status] = (statusCounts[t.status] ?? 0) + 1;
              }
              const statusEntries = Object.entries(statusCounts);

              // First task to show as label
              const firstTask = dayTasks[0];
              const overflow = dayTasks.length > 1 ? dayTasks.length - 1 : 0;

              // Determine text to show for task
              let taskLabel = "";
              let taskLabelIsBlocked = false;
              if (firstTask) {
                // Show phase or title snippet
                const phase = firstTask.phase;
                if (firstTask.status === "blocked") {
                  taskLabel = firstTask.title.length > 16 ? firstTask.title.slice(0, 14) + " blocked" : firstTask.title + " blocked";
                  taskLabelIsBlocked = true;
                } else if (phase) {
                  taskLabel = phase;
                  if (dayTasks.length > 1) {
                    const second = dayTasks[1];
                    taskLabel = phase + " \u00B7 " + (second.title.length > 10 ? second.title.slice(0, 10) : second.title);
                  }
                } else {
                  taskLabel = firstTask.title;
                }
              }

              // Is a weekend day
              const isWknd = isWeekend(date);
              // Date number color
              const dateColor = isToday ? "#0c447c" : isCurrentMonth ? (isWknd ? "#888780" : "#2c2c2a") : "#888780";

              return (
                <div
                  key={weekIdx * 7 + dayIdx}
                  style={{
                    flex: "1 0 0",
                    display: "flex",
                    flexDirection: "column",
                    gap: dayTasks.length > 0 ? "4px" : undefined,
                    alignItems: "flex-start",
                    minHeight: "76px",
                    minWidth: "1px",
                    overflow: "hidden",
                    padding: "6px",
                    borderRadius: "4px",
                    backgroundColor: isCurrentMonth ? "#ffffff" : "#f8f6f0",
                    border: isToday ? "1.5px solid #378add" : "0.5px solid #e5e3dd",
                    opacity: isCurrentMonth ? 1 : 0.6,
                  }}
                >
                  {/* Date number row + optional "today" label + red dot */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      overflow: "hidden",
                      width: "100%",
                      flexShrink: 0,
                      whiteSpace: "nowrap" as const,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Geist', sans-serif",
                        fontWeight: isToday ? 500 : 400,
                        fontSize: "11px",
                        lineHeight: "normal",
                        color: dateColor,
                        flexShrink: 0,
                      }}
                    >
                      {date.getDate()}
                    </span>
                    {isToday && (
                      <span
                        style={{
                          fontFamily: "'Geist', sans-serif",
                          fontWeight: 500,
                          fontSize: "8px",
                          lineHeight: "normal",
                          color: "#0c447c",
                          flexShrink: 0,
                        }}
                      >
                        today
                      </span>
                    )}
                    {!isToday && hasBlocked && isCurrentMonth && (
                      <div
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: "#e24b4a",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>

                  {/* Status strip */}
                  {statusEntries.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        overflow: "hidden",
                        borderRadius: "1px",
                        width: "100%",
                        flexShrink: 0,
                      }}
                    >
                      {statusEntries.map(([status, count]) => (
                        <div
                          key={status}
                          style={{
                            flex: `${count} 0 0`,
                            height: isToday ? "3px" : "2px",
                            minWidth: "1px",
                            backgroundColor: STATUS_BAR_COLORS[status] ?? "#888780",
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Task label */}
                  {taskLabel && isCurrentMonth && (
                    <span
                      style={{
                        fontFamily: "'Geist', sans-serif",
                        fontWeight: taskLabelIsBlocked || isToday ? 500 : 400,
                        fontSize: "9px",
                        lineHeight: "12px",
                        color: taskLabelIsBlocked ? "#e24b4a" : "#5f5e5a",
                        width: "100%",
                        minWidth: "100%",
                        flexShrink: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as const,
                        wordBreak: "break-word" as const,
                      }}
                    >
                      {taskLabel}
                    </span>
                  )}

                  {/* Overflow count */}
                  {overflow > 0 && isCurrentMonth && (
                    <span
                      style={{
                        fontFamily: "'Geist', sans-serif",
                        fontWeight: 400,
                        fontSize: "9px",
                        lineHeight: "normal",
                        color: "#888780",
                        whiteSpace: "nowrap" as const,
                        flexShrink: 0,
                      }}
                    >
                      + {overflow} more
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Split View ──────────────────────────────────────── */
/* Rebuilt from scratch — direct 1:1 translation of Figma node 9:38 "split" */

function SplitView({ tasks }: { tasks: CalendarTask[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  /* Build 10-day window: Friday before current week → following Thursday */
  const allDays = useMemo(() => {
    const dow = today.getDay();                       // 0=Sun..6=Sat
    const mondayOff = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOff);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() - 3);             // prev Friday
    const out: Date[] = [];
    for (let i = 0; i < 10; i++) {
      const d = new Date(friday);
      d.setDate(friday.getDate() + i);
      out.push(d);
    }
    return out;
  }, []);

  const VISIBLE = 7;
  const visibleDays = allDays.slice(0, VISIBLE);
  const overflowCount = allDays.length - VISIBLE;

  const selectedTasks = useMemo(
    () => getTasksForDate(tasks, selectedDate),
    [tasks, selectedDate],
  );

  const dayNameLong  = DAY_NAMES_LONG[selectedDate.getDay()];
  const monthLong    = selectedDate.toLocaleString("en-US", { month: "long" });
  const totalHours   = selectedTasks.reduce((s, t) => s + (t.estimated_hours ?? 0), 0);
  const phaseTask    = selectedTasks.find((t) => t.phase);

  /* ---- font shorthand ---- */
  const F = "'Geist', sans-serif";

  return (
    /* Figma 9:38 — split wrapper */
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        overflow: "hidden",
        width: "100%",
        height: "100%",
        flexShrink: 0,
      }}
    >
      {/* ═══ Figma 9:39 — agenda sidebar ═══ */}
      <div
        style={{
          backgroundColor: "#f1efe8",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          alignItems: "flex-start",
          overflow: "hidden",
          padding: 10,
          borderRadius: 8,
          flexShrink: 0,
          width: 240,
        }}
      >
        {/* Figma 9:40 — alw (AGENDA label wrapper) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            overflow: "hidden",
            paddingBottom: 8,
            paddingLeft: 4,
            paddingRight: 4,
            flexShrink: 0,
            width: "100%",
          }}
        >
          {/* Figma 9:41 */}
          <p
            style={{
              fontFamily: F,
              fontWeight: 400,
              fontSize: 9,
              lineHeight: "normal",
              fontStyle: "normal",
              color: "#888780",
              whiteSpace: "nowrap" as const,
              flexShrink: 0,
            }}
          >
            AGENDA
          </p>
        </div>

        {/* Day rows — Figma 9:42…9:97 (ar) */}
        {visibleDays.map((date) => {
          const isToday = isSameDay(date, today);
          const dayTasks = getTasksForDate(tasks, date);
          const bars = dayTasks
            .slice(0, 5)
            .map((t) => STATUS_BAR_COLORS[t.status] ?? "#888780");

          return (
            <button
              key={date.toISOString()}
              onClick={() => setSelectedDate(date)}
              style={{
                /* Figma ar — normal: transparent, today: bg-white + border */
                display: "flex",
                gap: 8,
                alignItems: "center",
                overflow: "hidden",
                padding: 8,
                borderRadius: 6,
                flexShrink: 0,
                width: "100%",
                cursor: "pointer",
                textAlign: "left" as const,
                backgroundColor: isToday ? "#ffffff" : "transparent",
                border: isToday ? "1.5px solid #378add" : "1.5px solid transparent",
              }}
            >
              {/* Figma dc — day column */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: "normal",
                  fontStyle: "normal",
                  overflow: "hidden",
                  flexShrink: 0,
                  textAlign: "center" as const,
                  width: 32,
                  whiteSpace: "nowrap" as const,
                  fontFamily: F,
                  fontWeight: isToday ? 500 : undefined, // today: Medium on dc
                  color: isToday ? "#0c447c" : undefined,
                }}
              >
                {/* day abbreviation */}
                <p
                  style={{
                    flexShrink: 0,
                    fontSize: 9,
                    fontFamily: F,
                    fontWeight: isToday ? 500 : 400,
                    color: isToday ? "#0c447c" : "#888780",
                  }}
                >
                  {DAY_NAMES_SHORT[date.getDay()]}
                </p>
                {/* day number */}
                <p
                  style={{
                    flexShrink: 0,
                    fontSize: 15,
                    fontFamily: F,
                    fontWeight: 500,
                    color: isToday ? "#0c447c" : "#5f5e5a",
                  }}
                >
                  {date.getDate()}
                </p>
              </div>

              {/* Figma inf — info column */}
              <div
                style={{
                  flex: "1 0 0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  alignItems: "flex-start",
                  minWidth: 1,
                  overflow: "hidden",
                }}
              >
                {/* task count */}
                <p
                  style={{
                    fontFamily: F,
                    fontWeight: isToday ? 500 : 400,
                    fontSize: 11,
                    lineHeight: "normal",
                    fontStyle: "normal",
                    color: isToday ? "#2c2c2a" : "#5f5e5a",
                    whiteSpace: "nowrap" as const,
                    flexShrink: 0,
                  }}
                >
                  {dayTasks.length} task{dayTasks.length !== 1 ? "s" : ""}
                  {isToday ? " \u00B7 today" : ""}
                </p>

                {/* Figma p — status mini-bars */}
                {bars.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      gap: 2,
                      alignItems: "flex-start",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {bars.map((color, i) => (
                      <div
                        key={i}
                        style={{
                          backgroundColor: color,
                          height: 4,
                          borderRadius: 1,
                          flexShrink: 0,
                          width: 14,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {/* Figma 9:107 — mw (overflow label) */}
        {overflowCount > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              paddingTop: 6,
              paddingBottom: 6,
              flexShrink: 0,
              width: "100%",
            }}
          >
            <p
              style={{
                fontFamily: F,
                fontWeight: 400,
                fontSize: 9,
                lineHeight: "normal",
                fontStyle: "normal",
                color: "#888780",
                textAlign: "center" as const,
                whiteSpace: "nowrap" as const,
                flexShrink: 0,
              }}
            >
              + {overflowCount} more days this week
            </p>
          </div>
        )}
      </div>

      {/* ═══ Figma 9:109 — detail panel ═══ */}
      <div
        style={{
          flex: "1 0 0",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          alignItems: "flex-start",
          minWidth: 1,
          overflow: "auto",
          height: "100%",
        }}
      >
        {/* Figma 9:110 — dh (day header) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            alignItems: "flex-start",
            overflow: "hidden",
            flexShrink: 0,
            width: "100%",
          }}
        >
          {/* Figma 9:111 — dhr */}
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "baseline",
              overflow: "hidden",
              flexShrink: 0,
              width: "100%",
            }}
          >
            {/* Figma 9:112 */}
            <p
              style={{
                fontFamily: F,
                fontWeight: 500,
                fontSize: 16,
                lineHeight: "normal",
                fontStyle: "normal",
                color: "#2c2c2a",
                whiteSpace: "nowrap" as const,
                flexShrink: 0,
              }}
            >
              {dayNameLong}, {monthLong} {selectedDate.getDate()}
            </p>

            {/* Figma 9:113 — tdy badge */}
            {isSameDay(selectedDate, today) && (
              <div
                style={{
                  backgroundColor: "#e6f1fb",
                  display: "flex",
                  alignItems: "flex-start",
                  overflow: "hidden",
                  paddingTop: 2,
                  paddingBottom: 2,
                  paddingLeft: 8,
                  paddingRight: 8,
                  borderRadius: 10,
                  flexShrink: 0,
                }}
              >
                <p
                  style={{
                    fontFamily: F,
                    fontWeight: 500,
                    fontSize: 11,
                    lineHeight: "normal",
                    fontStyle: "normal",
                    color: "#0c447c",
                    whiteSpace: "nowrap" as const,
                    flexShrink: 0,
                  }}
                >
                  today
                </p>
              </div>
            )}
          </div>

          {/* Figma 9:115 — subtitle */}
          <p
            style={{
              fontFamily: F,
              fontWeight: 400,
              fontSize: 12,
              lineHeight: "normal",
              fontStyle: "normal",
              color: "#5f5e5a",
              whiteSpace: "nowrap" as const,
              flexShrink: 0,
            }}
          >
            {selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""}
            {totalHours > 0 ? ` \u00B7 ${totalHours}h estimated` : ""}
            {phaseTask?.phase ? ` \u00B7 ${phaseTask.phase} starts today` : ""}
          </p>
        </div>

        {/* Task cards */}
        {selectedTasks.length === 0 && (
          <p
            style={{
              fontFamily: F,
              fontSize: 13,
              fontStyle: "italic",
              color: "#888780",
              padding: "32px 0",
              textAlign: "center" as const,
              width: "100%",
            }}
          >
            No tasks for this day
          </p>
        )}
        {selectedTasks.map((task) => (
          <SplitTaskCard key={task.id} task={task} allTasks={tasks} today={today} />
        ))}
      </div>
    </div>
  );
}

/* ── Split Task Card ─────────────────────────────────── */
/* Direct translation of Figma nodes 9:116 (normal) / 9:148 (blocked) */

function SplitTaskCard({
  task,
  allTasks,
  today,
}: {
  task: CalendarTask;
  allTasks: CalendarTask[];
  today: Date;
}) {
  const F = "'Geist', sans-serif";
  const sc = getStatusColor(task.status);
  const blocked = task.status === "blocked";
  const start = parseDate(task.start);
  const due = parseDate(task.due);
  const assigned = !!task.assignee;
  const av = assigned ? getAvatarStyle(task.assignee!) : null;

  /* progress */
  let pctFill = 0;
  let captionLeft = "";
  let captionRight = "";
  if (start) {
    captionLeft = `started ${formatShortDate(start)}`;
    const end = due ?? (task.duration ? new Date(start.getTime() + task.duration * 86_400_000) : null);
    if (end) {
      const total = daysBetween(start, end);
      const elapsed = daysBetween(start, today);
      pctFill = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
      const rem = Math.max(0, daysBetween(today, end));
      captionRight = `${rem} day${rem !== 1 ? "s" : ""} remaining`;
    }
  }
  if (blocked && start) {
    const d = daysBetween(start, today);
    if (d > 0) captionLeft = `blocked since ${formatShortDate(start)}`;
    captionRight = "on critical path";
  }

  /* deps */
  const deps = (task.deps ?? []).map((id) => {
    const dep = allTasks.find((t) => t.id === id || t.title.toLowerCase() === id.toLowerCase());
    return { name: dep?.title ?? id, color: dep ? getStatusColor(dep.status).border : "#ef9f27" };
  });

  /* priority pill */
  const PRI: Record<string, { bg: string; fg: string }> = {
    high:   { bg: "#faece7", fg: "#4a1b0c" },
    medium: { bg: "#faeeda", fg: "#412402" },
    low:    { bg: "#e6f1fb", fg: "#0c447c" },
  };
  const pri = task.priority ? PRI[task.priority.toLowerCase()] ?? { bg: "#f1efe8", fg: "#5f5e5a" } : null;

  const trackBg = blocked ? "#f7c1c1" : "#f1efe8";
  const fillBg  = blocked ? "#a32d2d" : sc.border;
  const fillFlex = Math.round(pctFill);
  const emptyFlex = Math.round(100 - pctFill);

  return (
    /* Figma dc — card wrapper */
    <div
      style={{
        backgroundColor: blocked ? "#fcebeb" : "#ffffff",
        border: blocked ? "0.5px solid #f09595" : "0.5px solid #e5e3dd",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        alignItems: "flex-start",
        padding: 14,
        borderRadius: 8,
        flexShrink: 0,
        width: "100%",
      }}
    >
      {/* ── Figma tr — title row ── */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          overflow: "hidden",
          flexShrink: 0,
          width: "100%",
        }}
      >
        {/* Figma Rectangle — left color bar */}
        <div
          style={{
            backgroundColor: sc.border,
            borderRadius: 2,
            alignSelf: "stretch",
            flexShrink: 0,
            width: 3,
          }}
        />

        {/* Figma tc — title content */}
        <div
          style={{
            flex: "1 0 0",
            display: "flex",
            flexDirection: "column",
            gap: 3,
            alignItems: "flex-start",
            minWidth: 1,
            overflow: "hidden",
          }}
        >
          {/* Figma trw — title + priority row */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              overflow: "hidden",
              flexShrink: 0,
              width: "100%",
            }}
          >
            {/* Figma 9:121 / 9:153 — title */}
            <p
              style={{
                flex: "1 0 0",
                fontFamily: F,
                fontWeight: 500,
                fontSize: 13,
                lineHeight: "normal",
                fontStyle: "normal",
                color: blocked ? "#501313" : "#2c2c2a",
                minWidth: 1,
              }}
            >
              {task.title}
            </p>

            {/* Figma pri — priority pill */}
            {pri && (
              <div
                style={{
                  backgroundColor: pri.bg,
                  display: "flex",
                  alignItems: "flex-start",
                  overflow: "hidden",
                  paddingTop: 2,
                  paddingBottom: 2,
                  paddingLeft: 8,
                  paddingRight: 8,
                  borderRadius: 10,
                  flexShrink: 0,
                }}
              >
                <p
                  style={{
                    fontFamily: F,
                    fontWeight: 400,
                    fontSize: 10,
                    lineHeight: "normal",
                    fontStyle: "normal",
                    color: pri.fg,
                    whiteSpace: "nowrap" as const,
                    flexShrink: 0,
                  }}
                >
                  {task.priority}
                </p>
              </div>
            )}
          </div>

          {/* Figma 9:124 / 9:156 — description */}
          {task.description && (
            <p
              style={{
                fontFamily: F,
                fontWeight: 400,
                fontSize: 12,
                lineHeight: "normal",
                fontStyle: "normal",
                color: blocked ? "#791f1f" : "#5f5e5a",
                flexShrink: 0,
                width: "100%",
              }}
            >
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* ── Figma m — meta row ── */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          overflow: "hidden",
          flexShrink: 0,
          width: "100%",
        }}
      >
        {/* Figma aw — avatar wrapper */}
        <div
          style={{
            display: "flex",
            gap: 4,
            alignItems: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {/* Figma avatar */}
          {assigned ? (
            <div
              style={{
                backgroundColor: av!.bg,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                borderRadius: 7,
                flexShrink: 0,
                width: 14,
                height: 14,
              }}
            >
              <p
                style={{
                  fontFamily: F,
                  fontWeight: 500,
                  fontSize: 8,
                  lineHeight: "normal",
                  fontStyle: "normal",
                  color: av!.fg,
                  whiteSpace: "nowrap" as const,
                  flexShrink: 0,
                }}
              >
                {task.assignee!.charAt(0).toUpperCase()}
              </p>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "#fcebeb",
                border: "1px dashed #a32d2d",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                borderRadius: 7,
                flexShrink: 0,
                width: 14,
                height: 14,
              }}
            >
              <p
                style={{
                  fontFamily: F,
                  fontWeight: 500,
                  fontSize: 8,
                  lineHeight: "normal",
                  fontStyle: "normal",
                  color: "#501313",
                  whiteSpace: "nowrap" as const,
                  flexShrink: 0,
                }}
              >
                ?
              </p>
            </div>
          )}
          {/* assignee name */}
          <p
            style={{
              fontFamily: F,
              fontWeight: 400,
              fontSize: 10,
              lineHeight: "normal",
              fontStyle: "normal",
              color: blocked ? "#501313" : "#888780",
              whiteSpace: "nowrap" as const,
              flexShrink: 0,
            }}
          >
            {assigned ? task.assignee : "unassigned"}
          </p>
        </div>

        {/* dot · hours */}
        {task.estimated_hours != null && (
          <>
            <p style={{ fontFamily: F, fontWeight: 400, fontSize: 10, lineHeight: "normal", fontStyle: "normal", color: "#888780", whiteSpace: "nowrap" as const, flexShrink: 0 }}>
              {"\u00B7"}
            </p>
            <p style={{ fontFamily: F, fontWeight: 400, fontSize: 10, lineHeight: "normal", fontStyle: "normal", color: blocked ? "#501313" : "#888780", whiteSpace: "nowrap" as const, flexShrink: 0 }}>
              {task.estimated_hours}h est
            </p>
          </>
        )}

        {/* dot · date range */}
        {start && due && (
          <>
            <p style={{ fontFamily: F, fontWeight: 400, fontSize: 10, lineHeight: "normal", fontStyle: "normal", color: "#888780", whiteSpace: "nowrap" as const, flexShrink: 0 }}>
              {"\u00B7"}
            </p>
            <p style={{ fontFamily: F, fontWeight: 400, fontSize: 10, lineHeight: "normal", fontStyle: "normal", color: blocked ? "#501313" : "#888780", whiteSpace: "nowrap" as const, flexShrink: 0 }}>
              {formatShortDate(start)} {"\u2192"} {formatShortDate(due)}
            </p>
          </>
        )}
      </div>

      {/* ── Figma sw — progress bar section ── */}
      {start && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            alignItems: "flex-start",
            overflow: "hidden",
            flexShrink: 0,
            width: "100%",
          }}
        >
          {/* Figma sb — progress bar */}
          <div
            style={{
              backgroundColor: trackBg,
              display: "flex",
              alignItems: "flex-start",
              overflow: "hidden",
              borderRadius: 2,
              flexShrink: 0,
              width: "100%",
            }}
          >
            {/* left spacer — Figma 9:136/168 */}
            <div style={{ height: 4, flexShrink: 0, width: 10 }} />
            {/* fill — Figma 9:137/169 */}
            <div style={{ backgroundColor: fillBg, flex: `${fillFlex} 0 0`, height: 4, minWidth: 1 }} />
            {/* empty — Figma 9:138/170 */}
            <div style={{ flex: `${emptyFlex} 0 0`, height: 4, minWidth: 1 }} />
          </div>

          {/* Figma cap — captions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              lineHeight: "normal",
              fontStyle: "normal",
              overflow: "hidden",
              flexShrink: 0,
              color: blocked ? "#791f1f" : "#888780",
              fontSize: 9,
              width: "100%",
              whiteSpace: "nowrap" as const,
            }}
          >
            <p style={{ fontFamily: F, fontWeight: blocked ? 500 : 400, flexShrink: 0 }}>
              {captionLeft}
            </p>
            <p style={{ fontFamily: F, fontWeight: 400, flexShrink: 0 }}>
              {captionRight}
            </p>
          </div>
        </div>
      )}

      {/* ── Figma Rectangle — divider ── */}
      <div
        style={{
          backgroundColor: blocked ? "#f09595" : "#e5e3dd",
          height: 0.5,
          flexShrink: 0,
          width: "100%",
        }}
      />

      {/* ── Figma d — dependencies ── */}
      {deps.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            overflow: "hidden",
            flexShrink: 0,
            width: "100%",
          }}
        >
          {/* "needs" label */}
          <p
            style={{
              fontFamily: F,
              fontWeight: 400,
              fontSize: 10,
              lineHeight: "normal",
              fontStyle: "normal",
              color: blocked ? "#501313" : "#888780",
              whiteSpace: "nowrap" as const,
              flexShrink: 0,
            }}
          >
            needs
          </p>

          {/* Figma dt — dep tags */}
          {deps.map((dep, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 3,
                alignItems: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {/* Figma Ellipse — 5px dot */}
              <div
                style={{
                  backgroundColor: dep.color,
                  borderRadius: "50%",
                  flexShrink: 0,
                  width: 5,
                  height: 5,
                }}
              />
              <p
                style={{
                  fontFamily: F,
                  fontWeight: 400,
                  fontSize: 10,
                  lineHeight: "normal",
                  fontStyle: "normal",
                  color: blocked ? "#501313" : "#2c2c2a",
                  whiteSpace: "nowrap" as const,
                  flexShrink: 0,
                }}
              >
                {dep.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Timeline View ───────────────────────────────────── */
/* Rebuilt from scratch — direct translation of Figma node 19:2 */

const BAR_STYLES: Record<string, { bg: string; border: string; fg: string; borderStyle?: string; opacity?: number }> = {
  done:        { bg: "#c0dd97", border: "#639922", fg: "#173404", opacity: 0.78 },
  in_progress: { bg: "#faeeda", border: "#ba7517", fg: "#412402" },
  active:      { bg: "#faece7", border: "#d85a30", fg: "#4a1b0c" },
  blocked:     { bg: "#fcebeb", border: "#e24b4a", fg: "#501313" },
  in_review:   { bg: "#b5d4f4", border: "#185fa5", fg: "#042c53" },
  todo:        { bg: "#e6f1fb", border: "#378add", fg: "#0c447c", borderStyle: "dashed" },
  backlog:     { bg: "#e5e5e2", border: "#888780", fg: "#2c2c2a" },
};

function TimelineView({ tasks }: { tasks: CalendarTask[] }) {
  const F = "'Geist', sans-serif";
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  /* ── Compute 3-week window centred around today ── */
  const { windowStart, numDays, dayPx } = useMemo(() => {
    // Go back ~1 week from today (previous Sunday)
    const dow = today.getDay(); // 0=Sun
    const start = new Date(today);
    start.setDate(today.getDate() - dow - 7); // prev prev Sunday
    start.setHours(0, 0, 0, 0);
    const nDays = 21; // 3 weeks
    return { windowStart: start, numDays: nDays, dayPx: 37 };
  }, []);

  const canvasW = numDays * dayPx; // 777 at 37×21
  const RAIL_W = 130;

  /* helpers */
  const dayIndex = (d: Date) => daysBetween(windowStart, d);
  const todayIdx = dayIndex(today);
  const isWeekend = (idx: number) => {
    const d = new Date(windowStart.getTime() + idx * 86_400_000);
    return d.getDay() === 0 || d.getDay() === 6;
  };

  /* week labels: first day of each week within the window */
  const weekLabels = useMemo(() => {
    const labels: { idx: number; label: string; isToday: boolean }[] = [];
    for (let i = 0; i < numDays; i += 7) {
      const d = new Date(windowStart.getTime() + i * 86_400_000);
      const isT = isSameDay(d, today);
      const lbl = isT
        ? `${formatShortDate(d)} \u00B7 today`
        : formatShortDate(d);
      labels.push({ idx: i, label: lbl, isToday: isT });
    }
    return labels;
  }, [windowStart, numDays]);

  /* weekend column indices (pairs of Sat+Sun) */
  const weekendRanges = useMemo(() => {
    const ranges: { start: number; width: number }[] = [];
    for (let i = 0; i < numDays; i++) {
      const d = new Date(windowStart.getTime() + i * 86_400_000);
      if (d.getDay() === 6) { // Saturday
        ranges.push({ start: i, width: 2 });
      }
    }
    return ranges;
  }, [windowStart, numDays]);

  /* group tasks by assignee */
  const groups = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();
    for (const t of tasks) {
      const key = t.assignee ?? "__unassigned__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    const entries = Array.from(map.entries());
    entries.sort((a, b) => {
      if (a[0] === "__unassigned__") return 1;
      if (b[0] === "__unassigned__") return -1;
      return a[0].localeCompare(b[0]);
    });
    return entries;
  }, [tasks]);

  /* bar position in px */
  function barPos(task: CalendarTask): { left: number; width: number; clippedLeft: boolean; clippedRight: boolean } | null {
    const s = parseDate(task.start);
    if (!s) return null;
    const dur = task.duration ?? 7;
    const sIdx = dayIndex(s);
    const eIdx = sIdx + dur;
    const visLeft = Math.max(0, sIdx);
    const visRight = Math.min(numDays, eIdx);
    if (visRight <= visLeft) return null;
    return {
      left: visLeft * dayPx,
      width: (visRight - visLeft) * dayPx,
      clippedLeft: sIdx < 0,
      clippedRight: eIdx > numDays,
    };
  }

  /* how many tasks extend outside the window */
  function outsideCount(assigneeTasks: CalendarTask[]): number {
    let c = 0;
    for (const t of assigneeTasks) {
      const s = parseDate(t.start);
      if (!s) continue;
      const dur = t.duration ?? 7;
      const sIdx = dayIndex(s);
      const eIdx = sIdx + dur;
      if (eIdx > numDays || sIdx < 0) c++;
    }
    return c;
  }

  const MAX_ROWS = 3;
  const ROW_H = 22; // 14px bar + 8px gap
  const totalTaskCount = tasks.length;

  /* Figma 19:15 — "3 weeks" chip + "today · may 4" */
  const todayLabel = `today \u00B7 ${formatShortDate(today)}`;

  return (
    <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
      <div style={{ minWidth: RAIL_W + canvasW + 24 }}>

        {/* ═══ Figma 19:42 — axis row ═══ */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            overflow: "hidden",
            paddingBottom: 8,
            flexShrink: 0,
            width: "100%",
          }}
        >
          {/* Figma 19:43 — rs (task count) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              overflow: "hidden",
              paddingTop: 14,
              flexShrink: 0,
              width: RAIL_W,
            }}
          >
            <p
              style={{
                fontFamily: F,
                fontWeight: 400,
                fontSize: 10,
                lineHeight: "normal",
                color: "#888780",
                whiteSpace: "nowrap" as const,
                flexShrink: 0,
              }}
            >
              {totalTaskCount} TASKS
            </p>
          </div>

          {/* Figma 19:45 — axis */}
          <div
            style={{
              position: "relative",
              height: 30,
              flexShrink: 0,
              width: canvasW,
              lineHeight: "normal",
              fontStyle: "normal",
            }}
          >
            {/* Week labels (top row) */}
            {weekLabels.map((wl) => (
              <p
                key={`wl-${wl.idx}`}
                style={{
                  position: "absolute",
                  fontFamily: F,
                  fontWeight: 500,
                  fontSize: 10,
                  color: wl.isToday ? "#a32d2d" : "#888780",
                  whiteSpace: "nowrap" as const,
                  top: 0,
                  left: wl.idx * dayPx,
                }}
              >
                {wl.label}
              </p>
            ))}

            {/* Day numbers (bottom row) */}
            {Array.from({ length: numDays }, (_, i) => {
              const d = new Date(windowStart.getTime() + i * 86_400_000);
              const isT = i === todayIdx;
              const wknd = isWeekend(i);
              return (
                <p
                  key={`dn-${i}`}
                  style={{
                    position: "absolute",
                    fontFamily: F,
                    fontWeight: isT ? 500 : 400,
                    fontSize: 9,
                    color: isT ? "#a32d2d" : "#888780",
                    textAlign: "center" as const,
                    width: dayPx,
                    height: 12,
                    top: 16,
                    left: i * dayPx,
                    transform: "translateX(-50%)",
                    marginLeft: dayPx / 2,
                    opacity: wknd ? 0.6 : 1,
                  }}
                >
                  {d.getDate()}
                </p>
              );
            })}
          </div>
        </div>

        {/* ═══ Figma 19:71 — divider ═══ */}
        <div style={{ backgroundColor: "#e5e3dd", height: 0.5, flexShrink: 0, width: "100%" }} />

        {/* ═══ Assignee bands ═══ */}
        {groups.map(([assignee, assigneeTasks]) => {
          const isUn = assignee === "__unassigned__";
          const name = isUn ? "Unassigned" : assignee;
          const av = isUn ? null : getAvatarStyle(assignee);
          const blockedCount = assigneeTasks.filter((t) => t.status === "blocked").length;
          const subtitleParts = [`${assigneeTasks.length}${isUn ? "" : " tasks"}`];
          if (blockedCount > 0 && isUn) subtitleParts.push(`${blockedCount} blocked`);
          else if (!isUn) { /* just task count */ }
          // Check for notable statuses
          const reviewCount = assigneeTasks.filter((t) => t.status === "in_review").length;
          if (reviewCount > 0 && !isUn) subtitleParts.push("in review");

          const visibleTasks = assigneeTasks.slice(0, MAX_ROWS);
          const outside = outsideCount(assigneeTasks);
          const canvasH = 32 + visibleTasks.length * ROW_H;

          return (
            <div key={assignee}>
              {/* Figma band */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  overflow: "hidden",
                  paddingTop: 12,
                  paddingBottom: 6,
                  flexShrink: 0,
                  width: "100%",
                }}
              >
                {/* Figma rail — avatar + name */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    height: 22,
                    alignItems: "center",
                    overflow: "hidden",
                    flexShrink: 0,
                    width: RAIL_W,
                  }}
                >
                  {/* Figma avatar */}
                  {isUn ? (
                    <div
                      style={{
                        backgroundColor: "#fcebeb",
                        border: "1px dashed #a32d2d",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        borderRadius: 11,
                        flexShrink: 0,
                        width: 22,
                        height: 22,
                      }}
                    >
                      <p style={{ fontFamily: F, fontWeight: 500, fontSize: 11, lineHeight: "normal", color: "#501313", whiteSpace: "nowrap" as const, flexShrink: 0 }}>?</p>
                    </div>
                  ) : (
                    <div
                      style={{
                        backgroundColor: av!.bg,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        borderRadius: 11,
                        flexShrink: 0,
                        width: 22,
                        height: 22,
                      }}
                    >
                      <p style={{ fontFamily: F, fontWeight: 500, fontSize: 11, lineHeight: "normal", color: av!.fg, whiteSpace: "nowrap" as const, flexShrink: 0 }}>
                        {name.charAt(0).toUpperCase()}
                      </p>
                    </div>
                  )}

                  {/* Figma nc — name column */}
                  <div
                    style={{
                      flex: "1 0 0",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      alignItems: "flex-start",
                      lineHeight: "normal",
                      fontStyle: "normal",
                      minWidth: 1,
                      overflow: "hidden",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: F,
                        fontWeight: 500,
                        fontSize: 12,
                        color: isUn ? "#e24b4a" : "#2c2c2a",
                        flexShrink: 0,
                        width: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {name}
                    </p>
                    <p
                      style={{
                        fontFamily: F,
                        fontWeight: 400,
                        fontSize: 10,
                        color: "#5f5e5a",
                        flexShrink: 0,
                        width: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {isUn ? subtitleParts.join(" \u00B7 ") : `${assigneeTasks.length} tasks${reviewCount > 0 ? " \u00B7 in review" : ""}`}
                    </p>
                  </div>
                </div>

                {/* Figma canvas — Gantt bars */}
                <div
                  style={{
                    position: "relative",
                    height: canvasH,
                    overflow: "hidden",
                    flexShrink: 0,
                    width: canvasW,
                  }}
                >
                  {/* Weekend overlay bands — Figma rgba(0,0,0,0.03) */}
                  {weekendRanges.map((wr, i) => (
                    <div
                      key={`we-${i}`}
                      style={{
                        position: "absolute",
                        backgroundColor: "rgba(0,0,0,0.03)",
                        height: canvasH,
                        top: 0,
                        left: wr.start * dayPx,
                        width: wr.width * dayPx,
                      }}
                    />
                  ))}

                  {/* Today highlight column — Figma rgba(163,45,45,0.06) */}
                  {todayIdx >= 0 && todayIdx < numDays && (
                    <>
                      <div
                        style={{
                          position: "absolute",
                          backgroundColor: "rgba(163,45,45,0.06)",
                          height: canvasH,
                          top: 0,
                          left: todayIdx * dayPx,
                          width: dayPx,
                        }}
                      />
                      {/* Today line — Figma rgba(163,45,45,0.55) 1px */}
                      <div
                        style={{
                          position: "absolute",
                          backgroundColor: "rgba(163,45,45,0.55)",
                          height: canvasH,
                          top: 0,
                          left: todayIdx * dayPx + Math.floor(dayPx / 2),
                          width: 1,
                        }}
                      />
                    </>
                  )}

                  {/* Outside overflow label */}
                  {outside > 0 && (
                    <p
                      style={{
                        position: "absolute",
                        fontFamily: F,
                        fontWeight: 400,
                        fontSize: 9,
                        lineHeight: "normal",
                        color: "#888780",
                        whiteSpace: "nowrap" as const,
                        top: 14,
                        right: 0,
                      }}
                    >
                      + {outside} outside {"\u2192"}
                    </p>
                  )}

                  {/* Task bars */}
                  {visibleTasks.map((task, rowIdx) => {
                    const pos = barPos(task);
                    if (!pos) return null;
                    const bs = BAR_STYLES[task.status] ?? BAR_STYLES.backlog;
                    const isBlocked = task.status === "blocked";
                    const topY = 32 + rowIdx * ROW_H;

                    // Build title with clipping arrows
                    let label = task.title;
                    if (pos.clippedLeft) label = `\u2190 ${label}`;
                    if (pos.clippedRight) label = `${label} \u2192`;

                    return (
                      <div
                        key={task.id}
                        style={{
                          position: "absolute",
                          backgroundColor: bs.bg,
                          border: `0.5px ${bs.borderStyle ?? "solid"} ${bs.border}`,
                          height: 14,
                          left: pos.left,
                          width: pos.width,
                          top: topY,
                          borderRadius: 3,
                          overflow: "hidden",
                          opacity: bs.opacity ?? 1,
                        }}
                      >
                        <p
                          style={{
                            position: "absolute",
                            fontFamily: F,
                            fontWeight: isBlocked ? 500 : 400,
                            fontSize: 10,
                            lineHeight: "normal",
                            color: bs.fg,
                            left: 5.5,
                            top: 0.5,
                            width: pos.width - 12,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap" as const,
                          }}
                        >
                          {label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────── */

export default function CalendarView({ tasks }: CalendarViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("split");
  const today = new Date();
  const monthYear = `${today.toLocaleString("en-US", { month: "long" }).toLowerCase()} ${today.getFullYear()}`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        alignItems: "flex-start",
        padding: "32px",
        backgroundColor: "#faf9f5",
        width: "100%",
        height: "100%",
        fontFamily: "'Geist', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          overflow: "hidden",
          width: "100%",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "center", overflow: "hidden", flexShrink: 0 }}>
          <span
            style={{
              fontFamily: "'Geist', sans-serif",
              fontWeight: 500,
              fontSize: "15px",
              lineHeight: "normal",
              color: "#2c2c2a",
              whiteSpace: "nowrap" as const,
              flexShrink: 0,
            }}
          >
            Calendar
          </span>
          <TabBar active={activeTab} onChange={setActiveTab} />
        </div>
        {/* Figma 19:15 hr — timeline shows "3 weeks · today · may 4", others show month year */}
        {activeTab === "timeline" ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center", overflow: "hidden", flexShrink: 0 }}>
            <div
              style={{
                backgroundColor: "#f1efe8",
                display: "flex",
                alignItems: "flex-start",
                overflow: "hidden",
                padding: "2px 6px",
                borderRadius: 4,
                flexShrink: 0,
              }}
            >
              <span style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, fontSize: 11, lineHeight: "normal", color: "#888780", whiteSpace: "nowrap" as const, flexShrink: 0 }}>
                3 weeks
              </span>
            </div>
            <span style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, fontSize: 11, lineHeight: "normal", color: "#888780", whiteSpace: "nowrap" as const, flexShrink: 0 }}>
              {"\u00B7"}
            </span>
            <span style={{ fontFamily: "'Geist', sans-serif", fontWeight: 500, fontSize: 11, lineHeight: "normal", color: "#a32d2d", whiteSpace: "nowrap" as const, flexShrink: 0 }}>
              today {"\u00B7"} {formatShortDate(today)}
            </span>
          </div>
        ) : (
          <span
            style={{
              fontFamily: "'Geist', sans-serif",
              fontWeight: 400,
              fontSize: "11px",
              lineHeight: "normal",
              color: "#888780",
              whiteSpace: "nowrap" as const,
              flexShrink: 0,
            }}
          >
            {monthYear}
          </span>
        )}
      </div>

      {/* Legend */}
      <LegendRow />

      {/* View content */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden", width: "100%" }}>
        {activeTab === "weekly" && <WeeklyView tasks={tasks} />}
        {activeTab === "monthly" && <MonthlyView tasks={tasks} />}
        {activeTab === "split" && <SplitView tasks={tasks} />}
        {activeTab === "timeline" && <TimelineView tasks={tasks} />}
      </div>

      {/* Footer */}
      <Footer tasks={tasks} />
    </div>
  );
}
