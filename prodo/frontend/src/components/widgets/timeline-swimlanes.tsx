"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Flag,
  Diamond,
  Link2,
} from "lucide-react";

interface SwimTask {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  status: "backlog" | "todo" | "in_progress" | "in_review" | "done";
  lane: string;
  dependsOn?: string[];
}

interface SwimMilestone {
  id: string;
  label: string;
  date: string;
}

interface SwimLaneData {
  title: string;
  lanes: { id: string; label: string }[];
  tasks: SwimTask[];
  milestones: SwimMilestone[];
  range: { start: string; end: string };
}

const STATUS_COLORS: Record<string, string> = {
  backlog: "bg-neutral-300",
  todo: "bg-blue-400",
  in_progress: "bg-amber-400",
  in_review: "bg-purple-400",
  done: "bg-green-500",
};

const STATUS_HOVER: Record<string, string> = {
  backlog: "hover:bg-neutral-400",
  todo: "hover:bg-blue-500",
  in_progress: "hover:bg-amber-500",
  in_review: "hover:bg-purple-500",
  done: "hover:bg-green-600",
};

const ts = (d: string) => new Date(d).getTime();
const pct = (d: string, start: number, end: number) => {
  const total = end - start;
  return total === 0 ? 0 : ((ts(d) - start) / total) * 100;
};

export default function TimelineSwimLanes({ data }: { data: SwimLaneData }) {
  const [viewRange, setViewRange] = useState({
    start: ts(data.range.start),
    end: ts(data.range.end),
  });

  useEffect(() => {
    setViewRange({ start: ts(data.range.start), end: ts(data.range.end) });
  }, [data.range.start, data.range.end]);

  const zoom = (factor: number) => {
    const dur = viewRange.end - viewRange.start;
    const center = viewRange.start + dur / 2;
    const nd = dur * factor;
    if (nd < 86400000 * 3 || nd > 86400000 * 365) return;
    setViewRange({ start: center - nd / 2, end: center + nd / 2 });
  };

  const pan = (dir: "left" | "right") => {
    const dur = viewRange.end - viewRange.start;
    const shift = dur * 0.2;
    const d = dir === "left" ? -shift : shift;
    setViewRange((p) => ({ start: p.start + d, end: p.end + d }));
  };

  const reset = () =>
    setViewRange({ start: ts(data.range.start), end: ts(data.range.end) });

  // Today line
  const today = new Date().toISOString().split("T")[0];
  const todayPct = pct(today, viewRange.start, viewRange.end);

  // Time axis ticks
  const tickCount = 8;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const t = viewRange.start + ((viewRange.end - viewRange.start) * i) / (tickCount - 1);
    const d = new Date(t);
    return {
      label: d.toLocaleDateString([], { month: "short", day: "numeric" }),
      pct: (i / (tickCount - 1)) * 100,
    };
  });

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-neutral-400" />
          <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400">
            {data.title}
          </h3>
          <span className="text-xs text-neutral-300">
            {data.tasks.length} tasks &middot; {data.milestones.length} milestones
          </span>
        </div>

        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200">
          <button onClick={() => pan("left")} className="p-1 hover:bg-white hover:shadow-sm rounded text-neutral-500 hover:text-neutral-900"><ChevronLeft className="w-3.5 h-3.5" /></button>
          <button onClick={() => zoom(1.3)} className="p-1 hover:bg-white hover:shadow-sm rounded text-neutral-500 hover:text-neutral-900"><ZoomOut className="w-3.5 h-3.5" /></button>
          <button onClick={reset} className="p-1 hover:bg-white hover:shadow-sm rounded text-neutral-500 hover:text-neutral-900"><RotateCcw className="w-3.5 h-3.5" /></button>
          <button onClick={() => zoom(0.7)} className="p-1 hover:bg-white hover:shadow-sm rounded text-neutral-500 hover:text-neutral-900"><ZoomIn className="w-3.5 h-3.5" /></button>
          <button onClick={() => pan("right")} className="p-1 hover:bg-white hover:shadow-sm rounded text-neutral-500 hover:text-neutral-900"><ChevronRight className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Swim lanes */}
      <div className="space-y-1">
        {data.lanes.map((lane) => {
          const laneTasks = data.tasks.filter((t) => t.lane === lane.id);
          return (
            <div key={lane.id} className="flex items-center gap-3">
              <div className="w-28 flex-shrink-0 text-right pr-2">
                <span className="text-[11px] font-medium text-neutral-600 truncate block">
                  {lane.label}
                </span>
              </div>
              <div className="flex-1 relative h-8 bg-neutral-50 rounded border border-neutral-100 overflow-visible">
                {/* Today line */}
                {todayPct >= 0 && todayPct <= 100 && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-red-400 z-20"
                    style={{ left: `${todayPct}%` }}
                  />
                )}

                {/* Tasks */}
                {laneTasks.map((task) => {
                  const left = pct(task.startDate, viewRange.start, viewRange.end);
                  const right = pct(task.endDate, viewRange.start, viewRange.end);
                  const width = right - left;
                  if (left + width < -5 || left > 105) return null;

                  return (
                    <div
                      key={task.id}
                      className={`absolute top-1 bottom-1 rounded group cursor-pointer transition-all ${STATUS_COLORS[task.status]} ${STATUS_HOVER[task.status]}`}
                      style={{
                        left: `${Math.max(left, 0)}%`,
                        width: `${Math.max(width, 0.5)}%`,
                      }}
                      title={`${task.label} (${task.startDate} → ${task.endDate})`}
                    >
                      {width > 6 && (
                        <span className="text-xs font-bold text-white/90 truncate px-1.5 leading-[22px] block">
                          {task.label}
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Milestones */}
                {data.milestones.map((ms) => {
                  const pos = pct(ms.date, viewRange.start, viewRange.end);
                  if (pos < -2 || pos > 102) return null;
                  return (
                    <div
                      key={ms.id}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 group"
                      style={{ left: `${pos}%` }}
                    >
                      <Diamond className="w-4 h-4 text-emerald-500 fill-emerald-500 drop-shadow" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-neutral-900 text-white text-xs rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {ms.label} — {ms.date}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time axis */}
      <div className="relative ml-[124px] h-6 mt-2 border-t border-neutral-200">
        {/* Today marker */}
        {todayPct >= 0 && todayPct <= 100 && (
          <div
            className="absolute -top-0.5"
            style={{ left: `${todayPct}%`, transform: "translateX(-50%)" }}
          >
            <div className="text-xs font-bold text-red-500 bg-red-50 px-1 rounded border border-red-200">
              Today
            </div>
          </div>
        )}
        {ticks.map((tick, i) => (
          <div
            key={i}
            className="absolute -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${tick.pct}%` }}
          >
            <div className="w-px h-1 bg-neutral-300 mb-0.5" />
            <span className="text-xs text-neutral-400 font-mono whitespace-nowrap">
              {tick.label}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-100">
        {Object.entries(STATUS_COLORS).map(([s, c]) => (
          <div key={s} className="flex items-center gap-1">
            <div className={`w-3 h-1.5 rounded ${c}`} />
            <span className="text-xs text-neutral-400 capitalize">{s.replace("_", " ")}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 ml-2">
          <Diamond className="w-3 h-3 text-emerald-500 fill-emerald-500" />
          <span className="text-xs text-neutral-400">Milestone</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-px h-3 bg-red-400" />
          <span className="text-xs text-neutral-400">Today</span>
        </div>
      </div>
    </div>
  );
}
