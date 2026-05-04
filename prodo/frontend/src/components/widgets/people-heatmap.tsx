"use client";

import React, { useState } from "react";
import { Users, AlertTriangle } from "lucide-react";
import { CHART_TOOLTIP_STYLE, NEUTRAL, FONT_MONO } from "@/design";

interface PersonWeek {
  week: string;
  hours: number;
  tasks: number;
}

interface PersonData {
  name: string;
  role: string;
  weeks: PersonWeek[];
  totalHours: number;
  capacity: number;
}

interface PeopleHeatmapData {
  people: PersonData[];
  weeks: string[];
}

const getHeatColor = (hours: number, capacity: number): string => {
  const ratio = hours / capacity;
  if (ratio === 0) return "bg-neutral-50";
  if (ratio < 0.5) return "bg-ok-bg";
  if (ratio < 0.75) return "bg-ok-solid/60";
  if (ratio < 0.9) return "bg-warn-solid";
  if (ratio <= 1) return "bg-hot-solid";
  return "bg-bad-solid";
};

const getTextColor = (hours: number, capacity: number): string => {
  const ratio = hours / capacity;
  if (ratio > 0.9) return "text-white";
  return "text-neutral-700";
};

export default function PeopleHeatmap({ data }: { data: PeopleHeatmapData }) {
  const [hoveredCell, setHoveredCell] = useState<{
    person: string;
    week: string;
    hours: number;
    tasks: number;
  } | null>(null);

  const overloaded = data.people.filter((p) =>
    p.weeks.some((w) => w.hours > p.capacity)
  );

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-xsmall p-4 h-full">
      {/* Header — CMD style: serif title, warm neutral */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-base font-serif font-semibold text-neutral-950">People Heatmap</span>
        </div>
        {overloaded.length > 0 && (
          <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-bad-bg text-bad-fg">
            <AlertTriangle className="w-3 h-3" />
            {overloaded.length} overloaded
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-xs font-bold text-neutral-500 uppercase tracking-wider pb-2 pr-4 w-36">
                Team Member
              </th>
              {data.weeks.map((week) => (
                <th key={week} className="text-center text-xs font-bold text-neutral-500 uppercase tracking-wider pb-2 px-1">
                  {week}
                </th>
              ))}
              <th className="text-center text-xs font-bold text-neutral-500 uppercase tracking-wider pb-2 pl-3 w-16">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {data.people.map((person) => (
              <tr key={person.name} className="group">
                <td className="pr-4 py-1">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-neutral-950">
                      {person.name}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {person.role} &middot; {person.capacity}h/wk
                    </span>
                  </div>
                </td>
                {person.weeks.map((week) => (
                  <td
                    key={`${person.name}-${week.week}`}
                    className="px-0.5 py-1"
                    onMouseEnter={() =>
                      setHoveredCell({ person: person.name, week: week.week, hours: week.hours, tasks: week.tasks })
                    }
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <div
                      className={`relative w-full h-9 rounded-md flex items-center justify-center cursor-default transition-all hover:scale-105 ${getHeatColor(week.hours, person.capacity)}`}
                    >
                      <span className={`text-sm font-mono font-bold tabular-nums ${getTextColor(week.hours, person.capacity)}`}>
                        {week.hours > 0 ? week.hours : ""}
                      </span>

                      {/* CMD-style tooltip — white, subtle border */}
                      {hoveredCell?.person === person.name && hoveredCell?.week === week.week && (
                        <div
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10"
                          style={{ ...CHART_TOOLTIP_STYLE, padding: "6px 10px", whiteSpace: "nowrap" }}
                        >
                          <span style={{ fontFamily: FONT_MONO, fontWeight: 700, color: NEUTRAL[950] }}>{week.hours}h</span>
                          <span style={{ color: NEUTRAL[500] }}> / {person.capacity}h capacity</span>
                          <br />
                          <span style={{ color: NEUTRAL[500] }}>{week.tasks} tasks</span>
                        </div>
                      )}
                    </div>
                  </td>
                ))}
                <td className="pl-3 py-1 text-center">
                  <span className={`text-sm font-mono font-bold tabular-nums ${
                    person.totalHours > person.capacity * data.weeks.length * 0.9
                      ? "text-bad-fg" : "text-neutral-700"
                  }`}>
                    {person.totalHours}h
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend — CMD style: 8px swatches, neutral-700 text */}
      <div className="flex items-center gap-4 mt-3 pt-2 border-t border-neutral-100">
        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Load:</span>
        {[
          { label: "Light", cls: "bg-ok-bg" },
          { label: "Normal", cls: "bg-ok-solid/60" },
          { label: "Heavy", cls: "bg-warn-solid" },
          { label: "Near Cap", cls: "bg-hot-solid" },
          { label: "Over", cls: "bg-bad-solid" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-sm ${l.cls}`} />
            <span className="text-sm text-neutral-700">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
