"use client";

import React, { useState } from "react";
import { Users, AlertTriangle } from "lucide-react";

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
  capacity: number; // hours per week
}

interface PeopleHeatmapData {
  people: PersonData[];
  weeks: string[];
}

const getHeatColor = (hours: number, capacity: number): string => {
  const ratio = hours / capacity;
  if (ratio === 0) return "bg-neutral-50";
  if (ratio < 0.5) return "bg-green-100";
  if (ratio < 0.75) return "bg-green-300";
  if (ratio < 0.9) return "bg-yellow-300";
  if (ratio <= 1) return "bg-orange-400";
  return "bg-red-500";
};

const getTextColor = (hours: number, capacity: number): string => {
  const ratio = hours / capacity;
  if (ratio > 0.9) return "text-white";
  return "text-neutral-600";
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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-neutral-400" />
          <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400">
            People Heatmap
          </h3>
        </div>
        {overloaded.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100 font-medium">
            <AlertTriangle className="w-3 h-3" />
            {overloaded.length} overloaded
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-xs font-bold text-neutral-400 uppercase tracking-wider pb-2 pr-4 w-36">
                Team Member
              </th>
              {data.weeks.map((week) => (
                <th
                  key={week}
                  className="text-center text-xs font-bold text-neutral-400 uppercase tracking-wider pb-2 px-1"
                >
                  {week}
                </th>
              ))}
              <th className="text-center text-xs font-bold text-neutral-400 uppercase tracking-wider pb-2 pl-3 w-16">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {data.people.map((person) => (
              <tr key={person.name} className="group">
                <td className="pr-4 py-1">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-neutral-700">
                      {person.name}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {person.role} &middot; {person.capacity}h/wk
                    </span>
                  </div>
                </td>
                {person.weeks.map((week) => (
                  <td
                    key={`${person.name}-${week.week}`}
                    className="px-0.5 py-1"
                    onMouseEnter={() =>
                      setHoveredCell({
                        person: person.name,
                        week: week.week,
                        hours: week.hours,
                        tasks: week.tasks,
                      })
                    }
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <div
                      className={`relative w-full h-9 rounded flex items-center justify-center cursor-default transition-all hover:scale-105 ${getHeatColor(
                        week.hours,
                        person.capacity
                      )}`}
                    >
                      <span
                        className={`text-xs font-bold tabular-nums ${getTextColor(
                          week.hours,
                          person.capacity
                        )}`}
                      >
                        {week.hours > 0 ? week.hours : ""}
                      </span>

                      {/* Tooltip */}
                      {hoveredCell?.person === person.name &&
                        hoveredCell?.week === week.week && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-neutral-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 shadow-lg">
                            {week.hours}h / {person.capacity}h capacity
                            <br />
                            {week.tasks} tasks
                          </div>
                        )}
                    </div>
                  </td>
                ))}
                <td className="pl-3 py-1 text-center">
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      person.totalHours > person.capacity * data.weeks.length * 0.9
                        ? "text-red-500"
                        : "text-neutral-600"
                    }`}
                  >
                    {person.totalHours}h
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-neutral-100">
        <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
          Load:
        </span>
        {[
          { label: "Light", cls: "bg-green-100" },
          { label: "Normal", cls: "bg-green-300" },
          { label: "Heavy", cls: "bg-yellow-300" },
          { label: "Near Cap", cls: "bg-orange-400" },
          { label: "Over", cls: "bg-red-500" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${l.cls}`} />
            <span className="text-xs text-neutral-400">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
