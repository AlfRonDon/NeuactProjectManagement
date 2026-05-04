"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  Clock, Users, BarChart3, Layers, AlertTriangle,
} from "lucide-react";
import { boardTasks } from "./fixtures";

/* ── Shared ────────────────────────────────────────────── */

const STATUS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  done:        { label: "Done",        bg: "bg-ok-solid",   text: "text-ok-fg",  border: "border-ok-solid" },
  in_progress: { label: "In Progress", bg: "bg-warn-solid",   text: "text-warn-fg",  border: "border-warn-solid" },
  in_review:   { label: "In Review",   bg: "bg-info-solid",  text: "text-info-fg", border: "border-info-solid" },
  todo:        { label: "To Do",       bg: "bg-info-solid",    text: "text-info-fg",   border: "border-info-solid" },
  backlog:     { label: "Backlog",     bg: "bg-neutral-300", text: "text-neutral-500", border: "border-neutral-300" },
};

const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-bad-solid", high: "bg-hot-solid", medium: "bg-warn-solid", low: "bg-neutral-300",
};

const TODAY = new Date("2026-04-09");

function getTasksForDay(d: Date) {
  const ds = d.toISOString().split("T")[0];
  return boardTasks.filter((t) => t.start_date && t.due_date && ds >= t.start_date && ds <= t.due_date);
}

function isToday(d: Date) { return d.toDateString() === TODAY.toDateString(); }
function isSameMonth(d: Date, ref: Date) { return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear(); }

function Legend() {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {Object.entries(STATUS).map(([k, v]) => (
        <div key={k} className="flex items-center gap-1.5">
          <div className={`w-2.5 h-2.5 rounded-sm ${v.bg}`} />
          <span className="text-xs text-neutral-500">{v.label}</span>
        </div>
      ))}
    </div>
  );
}

function NavBar({ label, onPrev, onNext, onToday, children }: {
  label: string; onPrev: () => void; onNext: () => void; onToday: () => void; children?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-2.5 border-b flex items-center gap-3 shrink-0">
      <span className="text-xs font-semibold text-neutral-700">{label}</span>
      <div className="flex-1" />
      {children}
      <div className="flex gap-1">
        <button onClick={onPrev} className="p-1.5 rounded-lg hover:bg-neutral-100"><ChevronLeft className="w-4 h-4 text-neutral-500" /></button>
        <button onClick={onToday} className="text-xs px-2.5 py-1 rounded-lg hover:bg-neutral-100 text-neutral-500 font-medium">Today</button>
        <button onClick={onNext} className="p-1.5 rounded-lg hover:bg-neutral-100"><ChevronRight className="w-4 h-4 text-neutral-500" /></button>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   1. AGENDA — vertical day timeline with time blocks
   ═══════════════════════════════════════════════════════════ */
export function CalendarAgendaLayout() {
  const [dayOffset, setDayOffset] = useState(0);
  const day = new Date(TODAY);
  day.setDate(day.getDate() + dayOffset);
  const tasks = getTasksForDay(day);

  const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7am–6pm

  return (
    <div className="h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-white flex flex-col">
      <div className="px-5 py-3 border-b flex items-center gap-3 shrink-0">
        <Clock className="w-5 h-5 text-neutral-400" />
        <h3 className="text-sm font-serif font-bold text-neutral-950">Agenda</h3>
        <span className="text-xs text-neutral-400">
          {day.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
          {isToday(day) && <span className="ml-1.5 text-info-solid font-medium">Today</span>}
        </span>
        <div className="flex-1" />
        <Legend />
      </div>

      <NavBar
        label={day.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
        onPrev={() => setDayOffset(d => d - 1)}
        onNext={() => setDayOffset(d => d + 1)}
        onToday={() => setDayOffset(0)}
      />

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {hours.map((h) => {
          // distribute tasks across hours (simulated — spread evenly)
          const hourTasks = tasks.filter((_, i) => (i % hours.length) === (h - 7));
          return (
            <div key={h} className="flex border-b border-neutral-100 min-h-[56px]">
              <div className="w-16 shrink-0 py-2 pr-3 text-right text-xs font-medium text-neutral-400 border-r border-neutral-100">
                {h.toString().padStart(2, "0")}:00
              </div>
              <div className="flex-1 py-1.5 px-3 space-y-1">
                {hourTasks.map((t) => (
                  <div key={t.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 ${STATUS[t.status]?.bg ?? "bg-neutral-200"} text-white`}>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">{t.title}</div>
                      <div className="text-xs opacity-75">{t.assignee || "Unassigned"} · {t.estimated_hours}h</div>
                    </div>
                    {t.priority && <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[t.priority] ?? ""}`} />}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="border-t px-5 py-2.5 bg-neutral-50 shrink-0 flex items-center gap-4">
        <span className="text-xs font-semibold text-neutral-500">{tasks.length} tasks</span>
        <span className="text-xs text-neutral-400">·</span>
        <span className="text-xs text-neutral-500">{tasks.reduce((a, t) => a + (t.estimated_hours || 0), 0)}h estimated</span>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   2. TIMELINE — horizontal Gantt-style swimlanes by person
   ═══════════════════════════════════════════════════════════ */
export function CalendarTimelineLayout() {
  const [weekOffset, setWeekOffset] = useState(0);
  const baseDate = new Date("2026-04-01");
  baseDate.setDate(baseDate.getDate() + weekOffset * 14);
  const TOTAL_DAYS = 28;

  const days = Array.from({ length: TOTAL_DAYS }, (_, i) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  const people = ["Rohith", "Priya", "Arjun", "Unassigned"];
  const tasksByPerson = (name: string) =>
    boardTasks.filter(t => t.start_date && t.due_date && (name === "Unassigned" ? !t.assignee : t.assignee === name));

  const dayToCol = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = Math.round((d.getTime() - baseDate.getTime()) / 86400000);
    return Math.max(0, Math.min(diff, TOTAL_DAYS - 1));
  };

  return (
    <div className="h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-white flex flex-col">
      <div className="px-5 py-3 border-b flex items-center gap-3 shrink-0">
        <Users className="w-5 h-5 text-neutral-400" />
        <h3 className="text-sm font-serif font-bold text-neutral-950">Timeline</h3>
        <span className="text-xs text-neutral-400">4-week view by assignee</span>
        <div className="flex-1" />
        <Legend />
      </div>

      <NavBar
        label={`${days[0].toLocaleDateString([], { month: "short", day: "numeric" })} — ${days[TOTAL_DAYS - 1].toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`}
        onPrev={() => setWeekOffset(w => w - 1)}
        onNext={() => setWeekOffset(w => w + 1)}
        onToday={() => setWeekOffset(0)}
      />

      {/* Day header strip */}
      <div className="flex border-b shrink-0 overflow-hidden">
        <div className="w-28 shrink-0 border-r bg-neutral-50" />
        <div className="flex-1 flex min-w-0">
          {days.map((d, i) => (
            <div
              key={i}
              className={`text-center py-1.5 border-r border-neutral-100 ${isToday(d) ? "bg-info-bg" : ""}`}
              style={{ width: `${100 / TOTAL_DAYS}%` }}
            >
              {i % 7 === 0 ? (
                <div className="text-xs font-semibold text-neutral-500 truncate px-0.5">
                  {d.toLocaleDateString([], { month: "short", day: "numeric" })}
                </div>
              ) : (
                <div className="text-xs text-neutral-300">{d.getDate()}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Swimlanes */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {people.map((person) => {
          const tasks = tasksByPerson(person);
          const laneHeight = Math.max(64, tasks.length * 30 + 12);
          return (
            <div key={person} className="flex border-b border-neutral-100" style={{ minHeight: `${laneHeight}px` }}>
              <div className="w-28 shrink-0 border-r bg-neutral-50/50 px-3 py-2">
                <div className="text-xs font-semibold text-neutral-700">{person}</div>
                <div className="text-xs text-neutral-400">{tasks.length} tasks</div>
              </div>
              <div className="flex-1 relative min-w-0">
                {/* Grid lines */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {days.map((d, i) => (
                    <div
                      key={i}
                      className={`border-r border-neutral-50 ${isToday(d) ? "bg-info-bg/30" : ""}`}
                      style={{ width: `${100 / TOTAL_DAYS}%` }}
                    />
                  ))}
                </div>
                {/* Task bars */}
                {tasks.map((t, ti) => {
                  const startCol = dayToCol(t.start_date);
                  const endCol = dayToCol(t.due_date);
                  const span = Math.max(1, endCol - startCol + 1);
                  const leftPct = (startCol / TOTAL_DAYS) * 100;
                  const widthPct = (span / TOTAL_DAYS) * 100;
                  return (
                    <div
                      key={t.id}
                      className={`absolute ${STATUS[t.status]?.bg ?? "bg-neutral-300"} rounded-md text-white px-2 flex items-center cursor-pointer hover:brightness-110 transition-all shadow-sm`}
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        top: `${ti * 28 + 6}px`,
                        height: "24px",
                      }}
                    >
                      <div className="text-xs font-medium truncate leading-none">{t.title}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t px-5 py-2.5 bg-neutral-50 shrink-0 flex items-center gap-4">
        <span className="text-xs font-semibold text-neutral-500">{boardTasks.filter(t => t.start_date).length} scheduled</span>
        <span className="text-xs text-neutral-400">·</span>
        <span className="text-xs text-neutral-500">{boardTasks.filter(t => !t.start_date).length} unscheduled</span>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   3. HEATMAP — workload density grid (month view, colored by load)
   ═══════════════════════════════════════════════════════════ */
export function CalendarHeatmapLayout() {
  const [monthOffset, setMonthOffset] = useState(0);
  const refDate = new Date(TODAY);
  refDate.setMonth(refDate.getMonth() + monthOffset);
  refDate.setDate(1);
  const year = refDate.getFullYear(), month = refDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDow = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setDate(gridStart.getDate() - startDow);
  const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setDate(d.getDate() + i); return d; });

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const heatColor = (count: number) => {
    if (count === 0) return "bg-neutral-50";
    if (count === 1) return "bg-ok-bg";
    if (count === 2) return "bg-warn-bg";
    if (count === 3) return "bg-hot-bg";
    return "bg-bad-bg";
  };

  const heatLevels = [
    { label: "0", color: "bg-neutral-100" },
    { label: "1", color: "bg-ok-bg" },
    { label: "2", color: "bg-warn-bg" },
    { label: "3", color: "bg-hot-bg" },
    { label: "4+", color: "bg-bad-bg" },
  ];

  return (
    <div className="h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-white flex flex-col">
      <div className="px-5 py-3 border-b flex items-center gap-3 shrink-0">
        <BarChart3 className="w-5 h-5 text-neutral-400" />
        <h3 className="text-sm font-serif font-bold text-neutral-950">Workload Heatmap</h3>
        <span className="text-xs text-neutral-400">Task density per day</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-neutral-400 mr-1">Load:</span>
          {heatLevels.map((h) => (
            <div key={h.label} className="flex items-center gap-1">
              <div className={`w-4 h-4 rounded-sm ${h.color} border border-neutral-200`} />
              <span className="text-xs text-neutral-400">{h.label}</span>
            </div>
          ))}
        </div>
      </div>

      <NavBar
        label={refDate.toLocaleDateString([], { month: "long", year: "numeric" })}
        onPrev={() => setMonthOffset(m => m - 1)}
        onNext={() => setMonthOffset(m => m + 1)}
        onToday={() => setMonthOffset(0)}
      />

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b shrink-0">
        {weekdays.map((wd) => (
          <div key={wd} className="text-center py-2 text-xs font-semibold uppercase text-neutral-400">{wd}</div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6 overflow-hidden min-h-0">
        {cells.map((d, i) => {
          const tasks = getTasksForDay(d);
          const inMonth = isSameMonth(d, refDate);
          const today = isToday(d);
          const rowBorder = i >= 7 ? "border-t border-neutral-100" : "";
          return (
            <div key={d.toISOString()} className={`${rowBorder} border-r border-neutral-100 p-2 flex flex-col ${heatColor(tasks.length)} ${!inMonth ? "opacity-40" : ""}`}>
              <div className={`text-xs font-semibold mb-1 ${today ? "text-info-fg" : "text-neutral-700"}`}>
                {d.getDate()}
                {today && <span className="ml-1 text-xs text-info-solid font-normal">today</span>}
              </div>
              <div className="flex-1 min-h-0 space-y-0.5 overflow-hidden">
                {tasks.slice(0, 2).map(t => (
                  <div key={t.id} className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS[t.status]?.bg}`} />
                    <span className="text-xs text-neutral-600 truncate">{t.title}</span>
                  </div>
                ))}
                {tasks.length > 2 && <span className="text-xs text-neutral-400">+{tasks.length - 2}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t px-5 py-2.5 bg-neutral-50 shrink-0 flex items-center gap-4">
        <span className="text-xs font-semibold text-neutral-500">Busiest day:</span>
        <span className="text-xs text-warn-fg font-medium">Apr 12 (4 tasks)</span>
        <span className="text-xs text-neutral-400">·</span>
        <span className="text-xs text-neutral-500">Avg: 1.6 tasks/day</span>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   4. DEADLINE — countdown-focused, groups by urgency band
   ═══════════════════════════════════════════════════════════ */
export function CalendarDeadlineLayout() {
  const bands = [
    { label: "Overdue", color: "bg-bad-bg border-bad-solid/20", textColor: "text-bad-fg", filter: (t: any) => t.due_date && t.due_date < "2026-04-09" && t.status !== "done" },
    { label: "Due Today", color: "bg-warn-bg border-warn-solid/20", textColor: "text-warn-fg", filter: (t: any) => t.due_date === "2026-04-09" && t.status !== "done" },
    { label: "This Week (Apr 10–13)", color: "bg-info-bg border-info-solid/20", textColor: "text-info-fg", filter: (t: any) => t.due_date && t.due_date > "2026-04-09" && t.due_date <= "2026-04-13" && t.status !== "done" },
    { label: "Next Week (Apr 14–20)", color: "bg-neutral-50 border-neutral-200", textColor: "text-neutral-700", filter: (t: any) => t.due_date && t.due_date > "2026-04-13" && t.due_date <= "2026-04-20" && t.status !== "done" },
    { label: "Later", color: "bg-neutral-50 border-neutral-200", textColor: "text-neutral-500", filter: (t: any) => t.due_date && t.due_date > "2026-04-20" && t.status !== "done" },
    { label: "Done", color: "bg-ok-bg border-ok-solid/20", textColor: "text-ok-fg", filter: (t: any) => t.status === "done" },
  ];

  const daysUntil = (d: string) => {
    const diff = Math.round((new Date(d).getTime() - TODAY.getTime()) / 86400000);
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return "today";
    return `${diff}d left`;
  };

  return (
    <div className="h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-white flex flex-col">
      <div className="px-5 py-3 border-b flex items-center gap-3 shrink-0">
        <AlertTriangle className="w-5 h-5 text-neutral-400" />
        <h3 className="text-sm font-serif font-bold text-neutral-950">Deadline View</h3>
        <span className="text-xs text-neutral-400">Tasks grouped by urgency</span>
        <div className="flex-1" />
        <Legend />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
        {bands.map((band) => {
          const tasks = boardTasks.filter(band.filter);
          if (tasks.length === 0) return null;
          return (
            <div key={band.label} className={`rounded-lg border ${band.color} p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <h4 className={`text-sm font-bold ${band.textColor}`}>{band.label}</h4>
                <span className="text-xs text-neutral-400">{tasks.length} {tasks.length === 1 ? "task" : "tasks"}</span>
              </div>
              <div className="space-y-2">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2.5 border border-neutral-100">
                    <div className={`w-2 h-8 rounded-full ${STATUS[t.status]?.bg}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-neutral-800 truncate">{t.title}</div>
                      <div className="text-xs text-neutral-500">{t.assignee || "Unassigned"} · {t.estimated_hours}h</div>
                    </div>
                    {t.priority && <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[t.priority]}`} title={t.priority} />}
                    {t.due_date && <span className={`text-xs font-medium ${
                      t.due_date < "2026-04-09" ? "text-bad-fg" : t.due_date <= "2026-04-13" ? "text-warn-fg" : "text-neutral-400"
                    }`}>{daysUntil(t.due_date)}</span>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t px-5 py-2.5 bg-neutral-50 shrink-0 flex items-center gap-4">
        <span className="text-xs font-semibold text-bad-fg">{boardTasks.filter(t => t.due_date && t.due_date < "2026-04-09" && t.status !== "done").length} overdue</span>
        <span className="text-xs text-neutral-400">·</span>
        <span className="text-xs font-semibold text-warn-fg">{boardTasks.filter(t => t.due_date && t.due_date <= "2026-04-13" && t.status !== "done").length} due this week</span>
        <span className="text-xs text-neutral-400">·</span>
        <span className="text-xs font-semibold text-ok-fg">{boardTasks.filter(t => t.status === "done").length} done</span>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   5. SPLIT — week calendar left + selected day detail right
   ═══════════════════════════════════════════════════════════ */
export function CalendarSplitLayout() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<Date>(TODAY);

  const baseDate = new Date("2026-04-06");
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(baseDate); d.setDate(d.getDate() + i); return d; });

  const selTasks = getTasksForDay(selectedDay);

  return (
    <div className="h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-white flex flex-col">
      <div className="px-5 py-3 border-b flex items-center gap-3 shrink-0">
        <Layers className="w-5 h-5 text-neutral-400" />
        <h3 className="text-sm font-serif font-bold text-neutral-950">Split View</h3>
        <span className="text-xs text-neutral-400">Week overview + day detail</span>
        <div className="flex-1" />
        <Legend />
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: compact week */}
        <div className="w-[55%] border-r flex flex-col">
          <NavBar
            label={days[0].toLocaleDateString([], { month: "long", year: "numeric" })}
            onPrev={() => setWeekOffset(w => w - 1)}
            onNext={() => setWeekOffset(w => w + 1)}
            onToday={() => setWeekOffset(0)}
          />
          <div className="flex-1 overflow-y-auto min-h-0">
            {days.map((d) => {
              const tasks = getTasksForDay(d);
              const isSel = d.toDateString() === selectedDay.toDateString();
              const today = isToday(d);
              return (
                <div
                  key={d.toISOString()}
                  onClick={() => setSelectedDay(new Date(d))}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-neutral-100 cursor-pointer transition-colors ${
                    isSel ? "bg-info-bg" : "hover:bg-neutral-50"
                  }`}
                >
                  <div className="w-10 text-center shrink-0">
                    <div className="text-xs uppercase text-neutral-400 font-semibold">
                      {d.toLocaleDateString([], { weekday: "short" })}
                    </div>
                    <div className={`text-lg font-bold ${today ? "text-info-fg" : "text-neutral-950"}`}>
                      {d.getDate()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    {tasks.length === 0 && <span className="text-xs text-neutral-300">No tasks</span>}
                    {tasks.slice(0, 3).map(t => (
                      <div key={t.id} className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS[t.status]?.bg}`} />
                        <span className="text-xs text-neutral-700 truncate">{t.title}</span>
                      </div>
                    ))}
                    {tasks.length > 3 && <span className="text-xs text-neutral-400">+{tasks.length - 3} more</span>}
                  </div>
                  <span className="text-xs text-neutral-400 shrink-0">{tasks.length}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: day detail */}
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-3 border-b bg-neutral-50 shrink-0">
            <div className="text-sm font-serif font-bold text-neutral-950">
              {selectedDay.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
              {isToday(selectedDay) && <span className="ml-2 text-xs text-info-solid font-medium">Today</span>}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">{selTasks.length} tasks · {selTasks.reduce((a, t) => a + (t.estimated_hours || 0), 0)}h estimated</div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-2">
            {selTasks.length === 0 && (
              <div className="text-sm text-neutral-300 text-center pt-12">No tasks for this day</div>
            )}
            {selTasks.map(t => (
              <div key={t.id} className="rounded-lg border border-neutral-200 p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <div className={`w-2 h-full min-h-[32px] rounded-full shrink-0 ${STATUS[t.status]?.bg}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-neutral-800">{t.title}</div>
                    {t.description && <div className="text-xs text-neutral-500 mt-0.5">{t.description}</div>}
                  </div>
                  {t.priority && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    t.priority === "critical" ? "bg-bad-bg text-bad-fg" :
                    t.priority === "high" ? "bg-hot-bg text-hot-fg" :
                    t.priority === "medium" ? "bg-warn-bg text-warn-fg" :
                    "bg-neutral-100 text-neutral-500"
                  }`}>{t.priority}</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500 pl-4">
                  <span>{t.assignee || "Unassigned"}</span>
                  <span>·</span>
                  <span>{t.estimated_hours}h est</span>
                  <span>·</span>
                  <span>{t.start_date} → {t.due_date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
