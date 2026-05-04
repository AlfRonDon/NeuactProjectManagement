"use client";

import React, { useState, useEffect } from "react";
import { fetchWorkload } from "@/lib/api";

/* ── Types ─────────────────────────────────────────────── */

interface TaskBar {
  id: string;
  title: string;
  color: string;
  startWeek: number; // 0-based
  endWeek: number;   // exclusive
}

interface PersonRow {
  name: string;
  avatar: string;
  subtitle: string;
  subtitleColor: string;
  capacity: number;
  weeks: { label: string; hours: number }[];
  tasks: TaskBar[];
  showPullWork: boolean;
}

/* ── Fallback data matching Figma exactly ─────────────── */

const FALLBACK: PersonRow[] = [
  {
    name: "Rohith", avatar: "R", subtitle: "+19h", subtitleColor: "#991B1B", capacity: 40,
    weeks: [{ label: "W1", hours: 45 }, { label: "W2", hours: 48 }, { label: "W3", hours: 42 }, { label: "W4", hours: 44 }],
    tasks: [
      { id: "r1", title: "Phase B — Fill/RAG", color: "#6366F1", startWeek: 0, endWeek: 4 },
      { id: "r2", title: "Fix bento grid bug", color: "#14B8A6", startWeek: 0, endWeek: 2 },
      { id: "r3", title: "Write RAG tests", color: "#EC4899", startWeek: 1, endWeek: 3 },
      { id: "r4", title: "Pipeline review", color: "#F59E0B", startWeek: 0, endWeek: 4 },
    ],
    showPullWork: false,
  },
  {
    name: "Priya", avatar: "P", subtitle: "85% full", subtitleColor: "#938A89", capacity: 40,
    weeks: [{ label: "W1", hours: 32 }, { label: "W2", hours: 35 }, { label: "W3", hours: 38 }, { label: "W4", hours: 30 }],
    tasks: [
      { id: "p1", title: "Deploy staging fix", color: "#14B8A6", startWeek: 0, endWeek: 1 },
      { id: "p2", title: "Gantt chart widget", color: "#F59E0B", startWeek: 1, endWeek: 3 },
    ],
    showPullWork: false,
  },
  {
    name: "Arjun", avatar: "A", subtitle: "42h spare", subtitleColor: "#166534", capacity: 40,
    weeks: [{ label: "W1", hours: 28 }, { label: "W2", hours: 30 }, { label: "W3", hours: 35 }, { label: "W4", hours: 25 }],
    tasks: [
      { id: "a1", title: "Widget Renderer PR", color: "#8B5CF6", startWeek: 1, endWeek: 3 },
    ],
    showPullWork: true,
  },
];

/* ── Avatar colors ────────────────────────────────────── */

const AV: Record<string, { bg: string; fg: string }> = {
  R: { bg: "#fcebeb", fg: "#991B1B" },
  P: { bg: "#DBEAFE", fg: "#1E40AF" },
  A: { bg: "#DCFCE7", fg: "#166534" },
};

/* ── Heat color by hours/capacity ─────────────────────── */

function heatBg(h: number, cap: number): string {
  const r = h / cap;
  if (r <= 0.7) return "#DCFCE7";   // Light green
  if (r <= 0.85) return "#d4edda";  // Medium green
  if (r <= 0.95) return "#FEF3C7";  // Amber/busy
  if (r <= 1.05) return "#FFEDD5";  // Orange/full
  if (r <= 1.15) return "#fde2cc";  // Light over
  return "#FEE2E2";                  // Red/over
}

/* ── Component ────────────────────────────────────────── */

export default function WorkloadCard({ project }: { project?: string }) {
  const [people, setPeople] = useState<PersonRow[]>(FALLBACK);

  useEffect(() => {
    fetchWorkload(undefined, 4).then((data: any) => {
      if (data?.people?.length > 0) {
        // TODO: map API data to PersonRow shape
      }
    }).catch(() => {});
  }, [project]);

  // Max total hours across all people (for proportional row width)
  const maxTotal = Math.max(...people.map(p => p.weeks.reduce((s, w) => s + w.hours, 0)), 1);

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-xsmall flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-2 shrink-0">
        <div className="text-base font-bold text-neutral-950">Workload calendar · next 4 weeks</div>
        <div className="text-xs text-neutral-400 mt-0.5">
          Row length = total workload · cell width = hours that week · row height = task count
        </div>
      </div>

      {/* Person rows */}
      <div className="flex-1 overflow-y-auto px-5 pb-2">
        {people.map((person) => {
          const totalH = person.weeks.reduce((s, w) => s + w.hours, 0);
          const rowWidthPct = Math.max(60, Math.round((totalH / maxTotal) * 100));
          const av = AV[person.avatar] || { bg: "#E9E5E4", fg: "#3D3837" };
          const numWeeks = person.weeks.length;

          // Compute cumulative week boundaries as percentages of total hours
          const weekPcts: number[] = []; // [start0, start1, start2, start3, end3]
          let cum = 0;
          for (const w of person.weeks) {
            weekPcts.push((cum / totalH) * 100);
            cum += w.hours;
          }
          weekPcts.push(100); // end of last week

          return (
            <div key={person.name} className="flex gap-3 mb-3">
              {/* Identity */}
              <div className="w-[90px] shrink-0 flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: av.bg, color: av.fg }}
                  >
                    {person.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-neutral-950">{person.name}</div>
                    <div className="text-xs font-medium" style={{ color: person.subtitleColor }}>{person.subtitle}</div>
                  </div>
                </div>
              </div>

              {/* Grid area */}
              <div className="flex-1 min-w-0">
                <div className="relative" style={{ width: `${rowWidthPct}%` }}>
                  {/* Background heat cells */}
                  <div className="flex" style={{ height: (person.tasks.length + (person.showPullWork ? 1 : 0)) * 26 + 6 + 20 }}>
                    {person.weeks.map((w, wi) => (
                      <div
                        key={wi}
                        className="relative"
                        style={{
                          flex: w.hours,
                          background: heatBg(w.hours, person.capacity),
                          borderRadius: wi === 0 ? "6px 0 0 6px" : wi === numWeeks - 1 ? "0 6px 6px 0" : 0,
                          borderRight: wi < numWeeks - 1 ? "1px solid rgba(255,255,255,0.6)" : "none",
                        }}
                      >
                        {/* Week label at bottom of cell */}
                        <div className="absolute bottom-1 inset-x-0 text-center">
                          <span className="text-xs text-neutral-500">
                            {w.label} · {w.hours}h{w.hours > person.capacity ? " ↑" : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Task bars — absolutely positioned over the heat cells */}
                  {person.tasks.map((task, ti) => {
                    const left = weekPcts[task.startWeek];
                    const width = weekPcts[task.endWeek] - left;
                    return (
                      <div
                        key={task.id}
                        className="absolute rounded text-xs font-medium text-white px-2.5 flex items-center truncate"
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          top: ti * 26 + 4,
                          height: 22,
                          backgroundColor: task.color,
                        }}
                      >
                        {task.title}
                      </div>
                    );
                  })}

                  {/* Pull work dashed box (for people with spare capacity) */}
                  {person.showPullWork && person.tasks.map((_, ti) => ti).length < 3 && (
                    <div
                      className="absolute rounded border-2 border-dashed flex items-center px-2.5 pointer-events-none"
                      style={{
                        borderColor: "#c4c3ba",
                        left: "1%",
                        width: "98%",
                        top: person.tasks.length * 26 + 4,
                        height: 22,
                        background: "rgba(220,252,231,0.3)",
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-5 py-2 flex items-center justify-center gap-5 shrink-0 border-t border-neutral-100">
        {[
          { label: "Light", color: "#DCFCE7" },
          { label: "Busy", color: "#FEF3C7" },
          { label: "Full", color: "#FFEDD5" },
          { label: "Over", color: "#FEE2E2" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
            <span className="text-xs text-neutral-500">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
