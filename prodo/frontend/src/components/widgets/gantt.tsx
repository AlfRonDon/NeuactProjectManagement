"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Flag,
} from "lucide-react";
import { TimelineSpec, TimelineEvent, TimelineStatus } from "@/types";

// --- Helpers ---

const getTimestamp = (timeStr: string): number => {
  if (timeStr.includes("T") || timeStr.includes("-")) {
    return new Date(timeStr).getTime();
  }
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
};

const getPosition = (time: string, start: number, end: number) => {
  const t = getTimestamp(time);
  const total = end - start;
  if (total === 0) return 0;
  return ((t - start) / total) * 100;
};

const getWidth = (
  startTime: string,
  endTime: string | undefined,
  rangeStart: number,
  rangeEnd: number
) => {
  if (!endTime) return 0;
  const start = getPosition(startTime, rangeStart, rangeEnd);
  const end = getPosition(endTime, rangeStart, rangeEnd);
  return end - start;
};

const StatusColorMap: Record<TimelineStatus, string> = {
  normal: "bg-ok-solid",
  success: "bg-ok-solid",
  warning: "bg-warn-solid",
  critical: "bg-bad-solid",
  idle: "bg-neutral-300",
  neutral: "bg-info-solid",
  maintenance: "bg-hot-solid",
  offline: "bg-neutral-500",
  unknown: "bg-neutral-400",
};

const StatusBlock: React.FC<{
  event: TimelineEvent;
  range: { start: number; end: number };
}> = ({ event, range }) => {
  const left = getPosition(event.startTime, range.start, range.end);
  const width = getWidth(event.startTime, event.endTime, range.start, range.end);

  if (left + width < 0 || left > 100) return null;

  return (
    <div
      className={`absolute h-full top-0 border-r border-white/20 hover:opacity-90 cursor-pointer flex items-center justify-center overflow-hidden group ${StatusColorMap[event.status]} transition-all duration-300 rounded`}
      style={{ left: `${left}%`, width: `${Math.max(width, 0.5)}%` }}
      title={`${event.label} (${event.startTime} - ${event.endTime || ""})`}
    >
      {width > 8 && (
        <span className="text-xs font-bold text-white/90 truncate px-1 uppercase tracking-wider">
          {event.label}
        </span>
      )}
    </div>
  );
};

const TimeAxis: React.FC<{ start: number; end: number }> = ({
  start,
  end,
}) => {
  const duration = end - start;
  const tickCount = 6;
  const interval = duration / (tickCount - 1);
  const ticks = [];

  for (let i = 0; i < tickCount; i++) {
    const timeVal = start + interval * i;
    const date = new Date(timeVal);
    const showDay = duration > 86400000;
    const label = showDay
      ? date.toLocaleDateString([], { month: "short", day: "numeric" })
      : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    ticks.push({ label, percent: (i / (tickCount - 1)) * 100 });
  }

  return (
    <div className="relative w-full h-6 mt-4 border-t border-neutral-200">
      {ticks.map((tick, i) => (
        <div
          key={i}
          className="absolute transform -translate-x-1/2 flex flex-col items-center"
          style={{ left: `${tick.percent}%` }}
        >
          <div className="w-px h-1 bg-neutral-300 mb-1" />
          <span className="text-xs text-neutral-400 font-mono whitespace-nowrap">
            {tick.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// --- Main Gantt Widget ---

export default function GanttChart({ spec }: { spec: TimelineSpec }) {
  const [viewRange, setViewRange] = useState({
    start: getTimestamp(spec.range.start),
    end: getTimestamp(spec.range.end),
  });

  useEffect(() => {
    setViewRange({
      start: getTimestamp(spec.range.start),
      end: getTimestamp(spec.range.end),
    });
  }, [spec.range.start, spec.range.end]);

  const handleZoom = (factor: number) => {
    const duration = viewRange.end - viewRange.start;
    const center = viewRange.start + duration / 2;
    const newDuration = duration * factor;
    if (newDuration < 86400000 || newDuration > 365 * 24 * 3600 * 1000) return;
    setViewRange({
      start: center - newDuration / 2,
      end: center + newDuration / 2,
    });
  };

  const handlePan = (direction: "left" | "right") => {
    const duration = viewRange.end - viewRange.start;
    const shift = duration * 0.2;
    const delta = direction === "left" ? -shift : shift;
    setViewRange((prev) => ({
      start: prev.start + delta,
      end: prev.end + delta,
    }));
  };

  const handleReset = () => {
    setViewRange({
      start: getTimestamp(spec.range.start),
      end: getTimestamp(spec.range.end),
    });
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-xsmall p-5">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400">
            {spec.title}
          </h3>
          <p className="text-xs text-neutral-500 mt-1">{spec.description}</p>
        </div>

        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200">
          <button onClick={() => handlePan("left")} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-neutral-500 hover:text-neutral-950" title="Pan Left">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3 bg-neutral-300 mx-0.5" />
          <button onClick={() => handleZoom(1.3)} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-neutral-500 hover:text-neutral-950" title="Zoom Out">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleReset} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-neutral-500 hover:text-neutral-950" title="Reset">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => handleZoom(0.7)} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-neutral-500 hover:text-neutral-950" title="Zoom In">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3 bg-neutral-300 mx-0.5" />
          <button onClick={() => handlePan("right")} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-neutral-500 hover:text-neutral-950" title="Pan Right">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Gantt Lanes */}
      {spec.lanes && spec.lanes.length > 0 ? (
        <div className="space-y-1.5">
          {spec.lanes.map((lane) => (
            <div key={lane.id} className="flex items-center gap-3">
              <div className="w-28 flex-shrink-0 text-right pr-2">
                <span className="text-sm font-medium text-neutral-600 truncate block">
                  {lane.label}
                </span>
              </div>
              <div className="flex-1 relative h-7 bg-neutral-50 rounded border border-neutral-100 overflow-hidden">
                {spec.events
                  .filter((e) => e.laneId === lane.id)
                  .map((ev) => (
                    <StatusBlock key={ev.id} event={ev} range={viewRange} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-neutral-400 text-center py-8">
          No tasks with dates to display
        </div>
      )}

      {/* Milestone annotations */}
      {spec.annotations && spec.annotations.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {spec.annotations.map((ann) => (
            <div
              key={ann.id}
              className="flex items-center gap-1 px-2 py-1 bg-ok-bg text-ok-fg rounded border border-ok-solid/20 text-xs font-medium"
            >
              <Flag className="w-3 h-3" />
              {ann.label} — {ann.time}
            </div>
          ))}
        </div>
      )}

      <TimeAxis start={viewRange.start} end={viewRange.end} />
    </div>
  );
}
