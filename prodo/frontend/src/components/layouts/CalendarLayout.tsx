"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, ArrowLeft,
} from "lucide-react";

import { boardTasks as fixtureTasks } from "./fixtures";

type ViewMode = "week" | "month" | "split" | "timeline" | "agenda";

const STATUS_META: Record<string, { label: string; bg: string; dot: string }> = {
  done:        { label: "Done",        bg: "bg-green-500",   dot: "bg-green-500"   },
  in_progress: { label: "In Progress", bg: "bg-amber-400",   dot: "bg-amber-400"   },
  active:      { label: "Active",      bg: "bg-amber-400",   dot: "bg-amber-400"   },
  blocked:     { label: "Blocked",     bg: "bg-red-400",     dot: "bg-red-400"     },
  in_review:   { label: "In Review",   bg: "bg-purple-400",  dot: "bg-purple-400"  },
  todo:        { label: "To Do",       bg: "bg-blue-400",    dot: "bg-blue-400"    },
  backlog:     { label: "Backlog",     bg: "bg-neutral-300", dot: "bg-neutral-300" },
};

const PRIORITY_BADGE: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-neutral-100 text-neutral-500",
};

let _boardTasks: any[] = fixtureTasks;
const SIMULATED_TODAY = new Date();

function getTasksForDay(d: Date) {
  const ds = d.toISOString().split("T")[0];
  return _boardTasks.filter((t) => {
    if (!t.start_date || !t.due_date) return false;
    return ds >= t.start_date && ds <= t.due_date;
  });
}

function isToday(d: Date) {
  return d.toDateString() === SIMULATED_TODAY.toDateString();
}

function isSameMonth(d: Date, ref: Date) {
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
}

/* ── AGENDA VIEW ──────────────────────────────────────── */
function AgendaView({ day, onBack }: { day: Date; onBack: () => void }) {
  const tasks = getTasksForDay(day);
  const hours = Array.from({ length: 12 }, (_, i) => i + 7);
  const today = isToday(day);

  return (
    <>
      <div className="px-5 py-2.5 border-b flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-neutral-500" />
        </button>
        <span className="text-xs font-semibold text-neutral-700">
          {day.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </span>
        {today && <span className="text-xs text-blue-500 font-medium">Today</span>}
        <div className="flex-1" />
        <span className="text-xs text-neutral-400">{tasks.length} tasks · {tasks.reduce((a, t) => a + (t.estimated_hours || 0), 0)}h estimated</span>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {hours.map((h) => {
          const hourTasks = tasks.filter((_, i) => (i % hours.length) === (h - 7));
          return (
            <div key={h} className="flex border-b border-neutral-100 min-h-[56px]">
              <div className="w-16 shrink-0 py-2 pr-3 text-right text-xs font-medium text-neutral-400 border-r border-neutral-100">
                {h.toString().padStart(2, "0")}:00
              </div>
              <div className="flex-1 py-1.5 px-3 space-y-1.5">
                {hourTasks.map((t) => (
                  <div key={t.id} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${STATUS_META[t.status]?.bg ?? "bg-neutral-200"} text-white`}>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">{t.title}</div>
                      <div className="text-xs opacity-75 mt-0.5">{t.assignee || "Unassigned"} · {t.estimated_hours}h · {t.start_date} → {t.due_date}</div>
                      {t.description && <div className="text-xs opacity-60 mt-0.5 truncate">{t.description}</div>}
                    </div>
                    {t.priority && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[t.priority] ?? ""}`}>
                        {t.priority}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ── WEEK VIEW ─────────────────────────────────────────── */
function WeekView({ weekOffset, setWeekOffset, onDayClick }: {
  weekOffset: number; setWeekOffset: (fn: (n: number) => number) => void; onDayClick: (d: Date) => void;
}) {
  const baseDate = new Date("2026-04-06");
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(baseDate); d.setDate(d.getDate() + i); return d; });

  return (
    <>
      <div className="px-5 py-2.5 border-b flex items-center gap-3 shrink-0">
        <span className="text-xs font-semibold text-neutral-700">
          {days[0].toLocaleDateString([], { month: "long", year: "numeric" })}
        </span>
        <span className="text-xs text-neutral-400">{days[0].getDate()}–{days[6].getDate()}</span>
        <div className="flex-1" />
        <div className="flex gap-1">
          <button onClick={() => setWeekOffset((w) => w - 1)} className="p-1.5 rounded-lg hover:bg-neutral-100"><ChevronLeft className="w-4 h-4 text-neutral-500" /></button>
          <button onClick={() => setWeekOffset(() => 0)} className="text-xs px-2.5 py-1 rounded-lg hover:bg-neutral-100 text-neutral-500 font-medium">Today</button>
          <button onClick={() => setWeekOffset((w) => w + 1)} className="p-1.5 rounded-lg hover:bg-neutral-100"><ChevronRight className="w-4 h-4 text-neutral-500" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b shrink-0">
        {days.map((d) => (
          <div key={d.toISOString()} onClick={() => onDayClick(d)} className={`text-center py-2.5 cursor-pointer hover:bg-blue-50 transition-colors ${isToday(d) ? "bg-blue-50" : ""}`}>
            <div className="text-xs uppercase text-neutral-400 font-semibold">{d.toLocaleDateString([], { weekday: "short" })}</div>
            <div className={`text-lg font-bold mt-0.5 ${isToday(d) ? "text-blue-600" : "text-neutral-900"}`}>
              {d.getDate()}
              {isToday(d) && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mx-auto mt-0.5" />}
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 divide-x overflow-y-auto min-h-0">
        {days.map((d) => {
          const dayTasks = getTasksForDay(d);
          return (
            <div key={d.toISOString()} onClick={() => onDayClick(d)} className={`p-2 min-h-0 space-y-1.5 cursor-pointer hover:bg-blue-50/20 transition-colors ${isToday(d) ? "bg-blue-50/30" : ""}`}>
              {dayTasks.map((t) => (
                <div key={t.id} className={`${STATUS_META[t.status]?.bg ?? "bg-neutral-300"} rounded-md px-2 py-1.5 text-white`}>
                  <div className="text-xs font-semibold truncate leading-tight">{t.title}</div>
                  {t.assignee && <div className="text-xs opacity-75 truncate mt-0.5">{t.assignee}</div>}
                </div>
              ))}
              {dayTasks.length === 0 && <div className="text-xs text-neutral-300 text-center pt-6">—</div>}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ── MONTH VIEW ────────────────────────────────────────── */
function MonthView({ monthOffset, setMonthOffset, onDayClick }: {
  monthOffset: number; setMonthOffset: (fn: (n: number) => number) => void; onDayClick: (d: Date) => void;
}) {
  const refDate = new Date(SIMULATED_TODAY);
  refDate.setMonth(refDate.getMonth() + monthOffset);
  refDate.setDate(1);
  const year = refDate.getFullYear(), month = refDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDow = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setDate(gridStart.getDate() - startDow);
  const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setDate(d.getDate() + i); return d; });
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <>
      <div className="px-5 py-2.5 border-b flex items-center gap-3 shrink-0">
        <span className="text-xs font-semibold text-neutral-700">{refDate.toLocaleDateString([], { month: "long", year: "numeric" })}</span>
        <div className="flex-1" />
        <div className="flex gap-1">
          <button onClick={() => setMonthOffset((m) => m - 1)} className="p-1.5 rounded-lg hover:bg-neutral-100"><ChevronLeft className="w-4 h-4 text-neutral-500" /></button>
          <button onClick={() => setMonthOffset(() => 0)} className="text-xs px-2.5 py-1 rounded-lg hover:bg-neutral-100 text-neutral-500 font-medium">Today</button>
          <button onClick={() => setMonthOffset((m) => m + 1)} className="p-1.5 rounded-lg hover:bg-neutral-100"><ChevronRight className="w-4 h-4 text-neutral-500" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b shrink-0">
        {weekdays.map((wd) => (
          <div key={wd} className="text-center py-2 text-xs font-semibold uppercase text-neutral-400">{wd}</div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 grid-rows-6 divide-x overflow-hidden min-h-0">
        {cells.map((d, i) => {
          const dayTasks = getTasksForDay(d);
          const inMonth = isSameMonth(d, refDate);
          const today = isToday(d);
          const rowBorder = i >= 7 ? "border-t border-neutral-100" : "";
          return (
            <div key={d.toISOString()} onClick={() => onDayClick(d)} className={`p-1.5 min-h-0 overflow-hidden flex flex-col cursor-pointer hover:bg-blue-50/30 transition-colors ${rowBorder} ${today ? "bg-blue-50/40" : !inMonth ? "bg-neutral-50/50" : ""}`}>
              <div className={`text-xs font-semibold mb-1 ${today ? "text-blue-600" : inMonth ? "text-neutral-700" : "text-neutral-300"}`}>
                {d.getDate()}
                {today && <span className="ml-1 text-xs font-normal text-blue-400">today</span>}
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto space-y-0.5">
                {dayTasks.slice(0, 3).map((t) => (
                  <div key={t.id} className={`${STATUS_META[t.status]?.bg ?? "bg-neutral-300"} rounded px-1.5 py-0.5 text-white`}>
                    <div className="text-xs font-medium truncate leading-tight">{t.title}</div>
                  </div>
                ))}
                {dayTasks.length > 3 && <div className="text-xs text-neutral-400 font-medium pl-1">+{dayTasks.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ── SPLIT VIEW — scrollable day list left + day detail right ── */
function SplitView() {
  // 60 days centered on today (30 before, 30 after)
  const days = Array.from({ length: 60 }, (_, i) => {
    const d = new Date(SIMULATED_TODAY);
    d.setDate(d.getDate() + i - 30);
    return d;
  });
  const [selectedDay, setSelectedDay] = useState<Date>(SIMULATED_TODAY);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Scroll to today on mount
  React.useEffect(() => {
    if (listRef.current) {
      const todayEl = listRef.current.querySelector("[data-today]");
      if (todayEl) todayEl.scrollIntoView({ block: "center" });
    }
  }, []);

  const selTasks = getTasksForDay(selectedDay);

  // Group by month for headers
  let lastMonth = "";

  return (
    <>
      <div className="flex-1 flex min-h-0">
        {/* Left: all dates, scrollable */}
        <div className="w-[45%] border-r overflow-y-auto" ref={listRef}>
          {days.map((d) => {
            const tasks = getTasksForDay(d);
            const isSel = d.toDateString() === selectedDay.toDateString();
            const today = isToday(d);
            const monthKey = d.toLocaleDateString([], { month: "long", year: "numeric" });
            const showMonthHeader = monthKey !== lastMonth;
            if (showMonthHeader) lastMonth = monthKey;

            return (
              <React.Fragment key={d.toISOString()}>
                {showMonthHeader && (
                  <div className="px-4 py-1.5 bg-neutral-50 border-b border-neutral-100 sticky top-0 z-10">
                    <span className="text-xs font-bold text-neutral-500">{monthKey}</span>
                  </div>
                )}
                <div
                  {...(today ? { "data-today": true } : {})}
                  onClick={() => setSelectedDay(new Date(d))}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-neutral-100 cursor-pointer transition-colors ${isSel ? "bg-blue-50" : "hover:bg-neutral-50"}`}
                >
                  <div className="w-10 text-center shrink-0">
                    <div className="text-xs uppercase text-neutral-400 font-semibold">{d.toLocaleDateString([], { weekday: "short" })}</div>
                    <div className={`text-lg font-bold ${today ? "text-blue-600" : "text-neutral-900"}`}>{d.getDate()}</div>
                    {today && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mx-auto mt-0.5" />}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    {tasks.length === 0 && <span className="text-xs text-neutral-300">No tasks</span>}
                    {tasks.slice(0, 3).map(t => (
                      <div key={t.id} className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_META[t.status]?.bg}`} />
                        <span className="text-xs text-neutral-700 truncate">{t.title}</span>
                      </div>
                    ))}
                    {tasks.length > 3 && <span className="text-xs text-neutral-400">+{tasks.length - 3} more</span>}
                  </div>
                  <span className="text-xs text-neutral-400 shrink-0">{tasks.length || ""}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Right: day detail */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-3 border-b bg-neutral-50 sticky top-0 z-10">
            <div className="text-sm font-bold text-neutral-900">
              {selectedDay.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
              {isToday(selectedDay) && <span className="ml-2 text-xs text-blue-500 font-medium">Today</span>}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">{selTasks.length} tasks · {selTasks.reduce((a, t) => a + (t.estimated_hours || 0), 0)}h estimated</div>
          </div>
          <div className="p-4 space-y-2">
            {selTasks.length === 0 && <div className="text-sm text-neutral-300 text-center pt-12">No tasks for this day</div>}
            {selTasks.map(t => (
              <div key={t.id} className="rounded-xl border border-neutral-200 p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <div className={`w-2 min-h-[32px] rounded-full shrink-0 ${STATUS_META[t.status]?.bg}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-neutral-800">{t.title}</div>
                    {t.description && <div className="text-xs text-neutral-500 mt-0.5">{t.description}</div>}
                  </div>
                  {t.priority && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[t.priority] ?? ""}`}>{t.priority}</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500 pl-4">
                  <span>{t.assignee || "Unassigned"}</span>
                  <span>·</span>
                  <span>{t.estimated_hours}h est</span>
                  <span>·</span>
                  <span className="text-neutral-400">{t.start_date} → {t.due_date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── TIMELINE VIEW — Gantt bars by assignee ────────────── */
function TimelineView() {
  const TOTAL_DAYS = 30;
  const rangeStart = new Date(SIMULATED_TODAY);
  rangeStart.setDate(rangeStart.getDate() - 5);

  const days = Array.from({ length: TOTAL_DAYS }, (_, i) => {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const people = Array.from(new Set(_boardTasks.filter(t => t.assignee).map(t => t.assignee)));
  if (_boardTasks.some(t => !t.assignee)) people.push("Unassigned");

  const tasksByPerson = (name: string) =>
    _boardTasks.filter(t => t.start_date && t.due_date && (name === "Unassigned" ? !t.assignee : t.assignee === name));

  const dayToPos = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = Math.round((d.getTime() - rangeStart.getTime()) / 86400000);
    return Math.max(0, Math.min(diff, TOTAL_DAYS - 1));
  };

  return (
    <>
      {/* Day header */}
      <div className="flex border-b shrink-0">
        <div className="w-24 shrink-0 border-r bg-neutral-50 px-3 py-2">
          <span className="text-xs font-semibold text-neutral-400">Assignee</span>
        </div>
        <div className="flex-1 flex">
          {days.map((d, i) => (
            <div key={i} className={`text-center py-1.5 border-r border-neutral-100 ${isToday(d) ? "bg-blue-50" : ""}`} style={{ width: `${100 / TOTAL_DAYS}%` }}>
              {i % 5 === 0 ? (
                <div className="text-xs font-semibold text-neutral-500 truncate px-0.5">{d.toLocaleDateString([], { month: "short", day: "numeric" })}</div>
              ) : (
                <div className="text-xs text-neutral-300">{d.getDate()}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Swimlanes */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {people.map(person => {
          const tasks = tasksByPerson(person);
          const laneHeight = Math.max(48, tasks.length * 28 + 12);
          return (
            <div key={person} className="flex border-b border-neutral-100" style={{ minHeight: `${laneHeight}px` }}>
              <div className="w-24 shrink-0 border-r bg-neutral-50/50 px-3 py-2">
                <div className="text-xs font-semibold text-neutral-700">{person}</div>
                <div className="text-xs text-neutral-400">{tasks.length}</div>
              </div>
              <div className="flex-1 relative min-w-0">
                {/* Grid lines */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {days.map((d, i) => (
                    <div key={i} className={`border-r border-neutral-50 ${isToday(d) ? "bg-blue-50/30" : ""}`} style={{ width: `${100 / TOTAL_DAYS}%` }} />
                  ))}
                </div>
                {tasks.map((t, ti) => {
                  const startCol = dayToPos(t.start_date!);
                  const endCol = dayToPos(t.due_date!);
                  const span = Math.max(1, endCol - startCol + 1);
                  return (
                    <div key={t.id}
                      className={`absolute ${STATUS_META[t.status]?.bg ?? "bg-neutral-300"} rounded-md text-white px-2 flex items-center cursor-pointer hover:brightness-110 transition-all shadow-sm`}
                      style={{ left: `${(startCol / TOTAL_DAYS) * 100}%`, width: `${(span / TOTAL_DAYS) * 100}%`, top: `${ti * 28 + 4}px`, height: "22px" }}>
                      <div className="text-xs font-medium truncate leading-none">{t.title}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ── MAIN CALENDAR ─────────────────────────────────────── */
function CalendarLayout({ className, tasks }: { className?: string; tasks?: any[] }) {
  // Use API tasks if provided, otherwise fixture data
  if (tasks) _boardTasks = tasks;
  const [view, setView] = useState<ViewMode>("week");
  const [prevView, setPrevView] = useState<"week" | "month" | "split" | "timeline">("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [agendaDay, setAgendaDay] = useState<Date>(SIMULATED_TODAY);

  const openAgenda = (d: Date) => {
    setPrevView(view as "week" | "month" | "split" | "timeline");
    setAgendaDay(new Date(d));
    setView("agenda");
  };

  const closeAgenda = () => {
    setView(prevView);
  };

  const VIEW_LABELS: { key: "week" | "month" | "split" | "timeline"; label: string }[] = [
    { key: "week", label: "Weekly" },
    { key: "month", label: "Monthly" },
    { key: "split", label: "Split" },
    { key: "timeline", label: "Timeline" },
  ];

  return (
    <div className={`${className ?? "h-[700px]"} rounded-xl overflow-hidden border border-neutral-200 bg-white flex flex-col`}>
      {/* Top bar */}
      <div className="px-5 py-2.5 border-b flex items-center gap-3 shrink-0">
        <CalendarIcon className="w-5 h-5 text-neutral-400" />
        <h3 className="text-sm font-bold text-neutral-900">Calendar</h3>

        {/* View toggle */}
        <div className="flex bg-neutral-100 rounded-lg p-0.5 ml-2">
          {VIEW_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`text-xs font-medium px-3 py-1 rounded-md transition-all ${
                (view === key || (view === "agenda" && prevView === key))
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {view === "agenda" && (
          <span className="text-xs text-blue-500 font-medium ml-1">
            → Agenda: {agendaDay.toLocaleDateString([], { month: "short", day: "numeric" })}
          </span>
        )}

        <div className="flex-1" />

        {/* Legend */}
        <div className="flex items-center gap-3">
          {Object.entries(STATUS_META).map(([key, { label, dot }]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm ${dot}`} />
              <span className="text-xs text-neutral-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* View content */}
      {view === "agenda" ? (
        <AgendaView day={agendaDay} onBack={closeAgenda} />
      ) : view === "timeline" ? (
        <TimelineView />
      ) : view === "split" ? (
        <SplitView />
      ) : view === "week" ? (
        <WeekView weekOffset={weekOffset} setWeekOffset={setWeekOffset} onDayClick={openAgenda} />
      ) : (
        <MonthView monthOffset={monthOffset} setMonthOffset={setMonthOffset} onDayClick={openAgenda} />
      )}

      {/* Bottom bar */}
      <div className="border-t px-4 py-2 flex items-center gap-4 bg-neutral-50 shrink-0">
        <span className="text-xs uppercase font-semibold text-neutral-400">Due this week:</span>
        {_boardTasks.filter((t) => t.due_date && t.due_date <= "2026-04-13" && t.status !== "done").map((t) => (
          <span key={t.id} className="text-xs text-amber-600 font-medium">{t.title}</span>
        ))}
        {_boardTasks.filter((t) => t.due_date && t.due_date <= "2026-04-13" && t.status !== "done").length === 0 && (
          <span className="text-xs text-green-600">Nothing overdue</span>
        )}
      </div>
    </div>
  );
}

export default CalendarLayout;
