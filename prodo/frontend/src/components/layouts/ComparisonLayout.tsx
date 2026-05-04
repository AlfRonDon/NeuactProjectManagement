"use client";

import React, { useState } from "react";
import {
  GitCompareArrows, TrendingUp, TrendingDown, Users, AlertTriangle, Calendar,
  CheckCircle2, Clock, Minus, ArrowRight,
} from "lucide-react";

interface ProjectMetrics {
  name: string;
  lead: string;
  teamSize: number;
  startDate: string;
  targetDate: string;
  progress: number;
  velocity: number; // tasks per week
  risk: "low" | "medium" | "high";
  riskScore: number;
  totalTasks: number;
  completedTasks: number;
  blockers: number;
  burndownActual: number[];
  burndownPlanned: number[];
  weekLabels: string[];
  categories: { name: string; done: number; total: number }[];
}

const projects: [ProjectMetrics, ProjectMetrics] = [
  {
    name: "Command Center v5",
    lead: "Rohith",
    teamSize: 3,
    startDate: "Apr 1",
    targetDate: "Jun 30",
    progress: 28,
    velocity: 3.2,
    risk: "high",
    riskScore: 78,
    totalTasks: 32,
    completedTasks: 9,
    blockers: 3,
    burndownActual: [32, 30, 28, 26, 23],
    burndownPlanned: [32, 28, 24, 20, 16],
    weekLabels: ["W14", "W15", "W16", "W17", "W18"],
    categories: [
      { name: "Backend", done: 4, total: 10 },
      { name: "Frontend", done: 3, total: 12 },
      { name: "ML", done: 1, total: 6 },
      { name: "QA", done: 1, total: 4 },
    ],
  },
  {
    name: "NeuactReport v3",
    lead: "Priya",
    teamSize: 2,
    startDate: "Mar 15",
    targetDate: "May 30",
    progress: 62,
    velocity: 4.8,
    risk: "low",
    riskScore: 25,
    totalTasks: 18,
    completedTasks: 11,
    blockers: 0,
    burndownActual: [18, 15, 12, 9, 7],
    burndownPlanned: [18, 15, 12, 9, 6],
    weekLabels: ["W14", "W15", "W16", "W17", "W18"],
    categories: [
      { name: "Backend", done: 4, total: 5 },
      { name: "Frontend", done: 5, total: 8 },
      { name: "Reports", done: 2, total: 5 },
    ],
  },
];

const riskColor = { low: "text-ok-fg", medium: "text-warn-fg", high: "text-bad-fg" };
const riskBg = { low: "bg-ok-bg border-ok-solid/20", medium: "bg-warn-bg border-warn-solid/20", high: "bg-bad-bg border-bad-solid/20" };

function MetricCompare({ label, left, right, icon: Icon, better }: { label: string; left: string; right: string; icon: React.ElementType; better?: "left" | "right" | "equal" }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2.5 border-b border-neutral-100 last:border-b-0">
      <div className={`text-sm font-bold text-right tabular-nums ${better === "left" ? "text-ok-fg" : "text-neutral-800"}`}>{left}</div>
      <div className="flex flex-col items-center gap-0.5">
        <Icon className="w-3.5 h-3.5 text-neutral-400" />
        <span className="text-[8px] text-neutral-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-sm font-bold tabular-nums ${better === "right" ? "text-ok-fg" : "text-neutral-800"}`}>{right}</div>
    </div>
  );
}

export default function ComparisonLayout() {
  const [left, right] = projects;
  const [overlayBurndown, setOverlayBurndown] = useState(true);

  const maxBurndown = Math.max(...left.burndownActual, ...left.burndownPlanned, ...right.burndownActual, ...right.burndownPlanned);

  return (
    <div className="h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center gap-3 shrink-0">
        <GitCompareArrows className="w-5 h-5 text-indigo-500" />
        <h3 className="text-sm font-serif font-bold text-neutral-950">Project Comparison</h3>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-xs text-neutral-600 font-medium">{left.name}</span>
          </div>
          <span className="text-xs text-neutral-300">vs</span>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-xs text-neutral-600 font-medium">{right.name}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Project headers side by side */}
        <div className="grid grid-cols-2 gap-4">
          {[left, right].map((p, i) => (
            <div key={p.name} className={`rounded-lg border p-4 ${i === 0 ? "border-indigo-200 bg-indigo-50/50" : "border-rose-200 bg-rose-50/50"}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${i === 0 ? "bg-indigo-500" : "bg-rose-500"}`} />
                <span className="text-sm font-serif font-bold text-neutral-950">{p.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-500">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {p.teamSize} people</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {p.startDate} <ArrowRight className="w-2.5 h-2.5" /> {p.targetDate}</span>
                <span>Lead: {p.lead}</span>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-neutral-500 uppercase font-bold">Progress</span>
                  <span className="text-xs font-bold text-neutral-800">{p.progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-neutral-200">
                  <div className={`h-full rounded-full ${i === 0 ? "bg-indigo-500" : "bg-rose-500"}`} style={{ width: `${p.progress}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Key metrics comparison */}
        <div className="bg-neutral-50 rounded-lg border border-neutral-200 px-6 py-4">
          <div className="text-[9px] uppercase font-bold tracking-widest text-neutral-400 mb-3 text-center">Key Metrics</div>
          <MetricCompare label="Progress" left={`${left.progress}%`} right={`${right.progress}%`} icon={TrendingUp} better={left.progress > right.progress ? "left" : "right"} />
          <MetricCompare label="Velocity" left={`${left.velocity}/wk`} right={`${right.velocity}/wk`} icon={TrendingUp} better={left.velocity > right.velocity ? "left" : "right"} />
          <MetricCompare label="Risk" left={`${left.riskScore}`} right={`${right.riskScore}`} icon={AlertTriangle} better={left.riskScore < right.riskScore ? "left" : "right"} />
          <MetricCompare label="Tasks" left={`${left.completedTasks}/${left.totalTasks}`} right={`${right.completedTasks}/${right.totalTasks}`} icon={CheckCircle2} better={left.completedTasks / left.totalTasks > right.completedTasks / right.totalTasks ? "left" : "right"} />
          <MetricCompare label="Blockers" left={`${left.blockers}`} right={`${right.blockers}`} icon={AlertTriangle} better={left.blockers < right.blockers ? "left" : "right"} />
          <MetricCompare label="Team" left={`${left.teamSize}`} right={`${right.teamSize}`} icon={Users} better="equal" />
        </div>

        {/* Overlaid burndown */}
        <div className="bg-white rounded-lg border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[9px] uppercase font-bold tracking-widest text-neutral-400">Burndown Overlay</div>
            <button onClick={() => setOverlayBurndown(!overlayBurndown)}
              className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors">
              {overlayBurndown ? "Split view" : "Overlay"}
            </button>
          </div>
          <div className="h-32 flex items-end gap-0.5">
            {left.weekLabels.map((week, i) => {
              const lActual = left.burndownActual[i];
              const rActual = right.burndownActual[i];
              const lPlanned = left.burndownPlanned[i];
              return (
                <div key={week} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center gap-1 h-24">
                    <div className="w-3 bg-indigo-400 rounded-t transition-all" style={{ height: `${(lActual / maxBurndown) * 100}%` }} title={`${left.name}: ${lActual}`} />
                    <div className="w-3 bg-rose-400 rounded-t transition-all" style={{ height: `${(rActual / maxBurndown) * 100}%` }} title={`${right.name}: ${rActual}`} />
                    <div className="w-1 bg-neutral-200 rounded-t transition-all" style={{ height: `${(lPlanned / maxBurndown) * 100}%` }} title={`Planned: ${lPlanned}`} />
                  </div>
                  <span className="text-[8px] text-neutral-400">{week}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-indigo-400" /><span className="text-[9px] text-neutral-500">{left.name}</span></div>
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-rose-400" /><span className="text-[9px] text-neutral-500">{right.name}</span></div>
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-neutral-200" /><span className="text-[9px] text-neutral-500">Planned</span></div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="grid grid-cols-2 gap-4">
          {[left, right].map((p, pi) => (
            <div key={p.name} className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-[9px] uppercase font-bold tracking-widest text-neutral-400 mb-3">{p.name} Breakdown</div>
              <div className="space-y-2">
                {p.categories.map((cat) => {
                  const pct = Math.round((cat.done / cat.total) * 100);
                  return (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-neutral-600">{cat.name}</span>
                        <span className="text-xs font-medium text-neutral-800">{cat.done}/{cat.total}</span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pi === 0 ? "bg-indigo-400" : "bg-rose-400"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Risk comparison */}
        <div className="grid grid-cols-2 gap-4">
          {[left, right].map((p) => (
            <div key={p.name} className={`rounded-lg border p-4 ${riskBg[p.risk]}`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className={`w-4 h-4 ${riskColor[p.risk]}`} />
                <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-500">Risk Level</span>
              </div>
              <div className={`text-2xl font-bold ${riskColor[p.risk]}`}>{p.riskScore}</div>
              <div className={`text-xs capitalize font-medium mt-0.5 ${riskColor[p.risk]}`}>{p.risk} risk</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
