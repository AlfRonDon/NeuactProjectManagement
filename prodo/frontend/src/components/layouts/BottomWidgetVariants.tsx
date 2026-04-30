"use client";

import React, { useState } from "react";
import {
  Users, Shield, Layers, AlertTriangle, CheckCircle2, OctagonAlert,
  Activity, CircleDot, Clock, ChevronRight, TrendingDown,
} from "lucide-react";
import RiskRadar from "@/components/widgets/risk-radar";
import Burndown from "@/components/widgets/burndown";
import { riskData, burndownData } from "@/components/layouts/fixtures";

/* ── DATA ─────────────────────────────────────────────── */

const PROJECTS = [
  { name: "Command Center v5", short: "CCv5", color: "#3b82f6" },
  { name: "NeuactReport v3", short: "NRv3", color: "#8b5cf6" },
  { name: "Spot Particle", short: "Spot", color: "#f59e0b" },
];

const TEAM = [
  { name: "Rohith", role: "Lead", avatar: "R", capacity: 40, weeks: [{ w: "W14", h: 45 }, { w: "W15", h: 48 }, { w: "W16", h: 42 }, { w: "W17", h: 44 }] },
  { name: "Priya", role: "Frontend", avatar: "P", capacity: 40, weeks: [{ w: "W14", h: 32 }, { w: "W15", h: 35 }, { w: "W16", h: 38 }, { w: "W17", h: 30 }] },
  { name: "Arjun", role: "Backend", avatar: "A", capacity: 40, weeks: [{ w: "W14", h: 28 }, { w: "W15", h: 30 }, { w: "W16", h: 35 }, { w: "W17", h: 25 }] },
];

const RISKS = [
  { axis: "Scope", score: 72 }, { axis: "Deadline", score: 85 }, { axis: "Resource", score: 58 },
  { axis: "Deps", score: 45 }, { axis: "Tech Debt", score: 30 }, { axis: "External", score: 65 },
];

const STAGES = ["Research", "Design", "Build", "Test", "Ship"];
const STAGE_DATA: Record<string, { stage: string; done: number; total: number; status: string }[]> = {
  CCv5: [{ stage: "Research", done: 2, total: 2, status: "done" }, { stage: "Design", done: 2, total: 2, status: "done" }, { stage: "Build", done: 1, total: 4, status: "active" }, { stage: "Test", done: 0, total: 2, status: "todo" }, { stage: "Ship", done: 0, total: 2, status: "blocked" }],
  NRv3: [{ stage: "Research", done: 1, total: 1, status: "done" }, { stage: "Design", done: 1, total: 1, status: "done" }, { stage: "Build", done: 1, total: 3, status: "active" }, { stage: "Test", done: 0, total: 1, status: "todo" }, { stage: "Ship", done: 0, total: 1, status: "backlog" }],
  Spot: [{ stage: "Research", done: 1, total: 1, status: "done" }, { stage: "Design", done: 2, total: 2, status: "done" }, { stage: "Build", done: 2, total: 4, status: "blocked" }, { stage: "Test", done: 0, total: 1, status: "todo" }, { stage: "Ship", done: 1, total: 1, status: "done" }],
};

const S_TEXT: Record<string, string> = { done: "text-green-700", active: "text-amber-700", blocked: "text-red-700", todo: "text-blue-700", backlog: "text-neutral-500" };
const S_BG: Record<string, string> = { done: "bg-green-50", active: "bg-amber-50", blocked: "bg-red-50", todo: "bg-blue-50", backlog: "bg-neutral-50" };
const S_LABEL: Record<string, string> = { done: "Done", active: "Active", blocked: "Blocked", todo: "To Do", backlog: "—" };

const heatColor = (h: number, cap: number) => {
  const r = h / cap;
  if (r < 0.5) return "bg-green-200";
  if (r < 0.75) return "bg-green-400";
  if (r < 0.9) return "bg-yellow-300";
  if (r <= 1) return "bg-orange-400";
  return "bg-red-500";
};

function StageCell({ done, total, status }: { done: number; total: number; status: string }) {
  const Icon = status === "done" ? CheckCircle2 : status === "blocked" ? OctagonAlert : status === "active" ? Activity : CircleDot;
  return (
    <div className={`inline-flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 ${S_BG[status]} min-w-[48px]`}>
      <Icon className={`w-3.5 h-3.5 ${S_TEXT[status]}`} />
      <span className={`text-xs font-bold ${S_TEXT[status]}`}>{done}/{total}</span>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   VARIANT A — Three Columns
   People (left) | Risk (center) | Stage Board (right)
   ═══════════════════════════════════════════════════════════ */
export function BottomWidgetVariantA() {
  return (
    <div className="h-[400px] rounded-xl overflow-hidden border border-neutral-200 bg-white flex">
      {/* People — 35% */}
      <div className="border-r border-neutral-200 flex flex-col overflow-hidden" style={{ flex: "35 1 0" }}>
        <div className="px-4 py-2.5 border-b flex items-center gap-2 shrink-0">
          <Users className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-bold text-neutral-900">Team Load</span>
          <span className="text-xs text-red-500 font-semibold ml-auto">1 overloaded</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {TEAM.map(t => {
            const total = t.weeks.reduce((s, w) => s + w.h, 0);
            const avg = Math.round(total / t.weeks.length);
            const pct = Math.round((avg / t.capacity) * 100);
            return (
              <div key={t.name} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-neutral-900 flex items-center justify-center text-xs font-bold text-white">{t.avatar}</div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-neutral-800">{t.name}</div>
                    <div className="text-xs text-neutral-400">{t.role}</div>
                  </div>
                  <span className={`text-xs font-bold ${pct > 90 ? "text-red-500" : pct > 70 ? "text-amber-500" : "text-green-500"}`}>{pct}%</span>
                </div>
                <div className="flex gap-1">
                  {t.weeks.map(w => (
                    <div key={w.w} className={`flex-1 h-6 rounded flex items-center justify-center text-xs font-bold ${heatColor(w.h, t.capacity)} ${w.h > t.capacity ? "text-white" : "text-neutral-700"}`}>
                      {w.h}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk — 30% */}
      <div className="border-r border-neutral-200 flex flex-col overflow-hidden" style={{ flex: "30 1 0" }}>
        <div className="px-4 py-2.5 border-b flex items-center gap-2 shrink-0">
          <Shield className="w-4 h-4 text-red-500" />
          <span className="text-sm font-bold text-neutral-900">Risk</span>
          <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold border border-red-200 ml-auto">HIGH</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {RISKS.map(r => (
            <div key={r.axis} className="flex items-center gap-2">
              <span className="text-xs text-neutral-600 w-16 shrink-0">{r.axis}</span>
              <div className="flex-1 h-2 bg-neutral-100 rounded-full">
                <div className={`h-full rounded-full ${r.score > 70 ? "bg-red-500" : r.score > 50 ? "bg-amber-400" : "bg-green-400"}`} style={{ width: `${r.score}%` }} />
              </div>
              <span className={`text-xs font-bold w-6 text-right ${r.score > 70 ? "text-red-500" : r.score > 50 ? "text-amber-500" : "text-green-500"}`}>{r.score}</span>
            </div>
          ))}
          <div className="bg-purple-50 rounded-lg border border-purple-200 p-2.5 mt-2">
            <div className="text-xs font-bold text-purple-700 mb-1">AI Assessment</div>
            <p className="text-xs text-purple-600 leading-relaxed">Deadline risk high — scope creep + single contributor bottleneck. Freeze scope, parallelize widget work.</p>
          </div>
        </div>
      </div>

      {/* Stage Board — 35% */}
      <div className="flex flex-col overflow-hidden" style={{ flex: "35 1 0" }}>
        <div className="px-4 py-2.5 border-b flex items-center gap-2 shrink-0">
          <Layers className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-bold text-neutral-900">Stages</span>
        </div>
        <div className="flex-1 overflow-auto p-2">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold text-neutral-400 uppercase px-2 py-1 w-16"></th>
                {STAGES.map(s => <th key={s} className="text-center text-xs font-semibold text-neutral-400 uppercase px-1 py-1">{s.slice(0, 3)}</th>)}
              </tr>
            </thead>
            <tbody>
              {PROJECTS.map(p => (
                <tr key={p.short} className="border-t border-neutral-100">
                  <td className="px-2 py-1.5"><div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} /><span className="text-xs font-medium text-neutral-700">{p.short}</span></div></td>
                  {STAGES.map(s => {
                    const sd = STAGE_DATA[p.short]?.find(x => x.stage === s);
                    return <td key={s} className="text-center px-1 py-1.5">{sd ? <StageCell {...sd} /> : <span className="text-xs text-neutral-300">—</span>}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   VARIANT B — Tabbed Single Panel
   One full-width panel, tabs to switch: People | Risk | Stages
   ═══════════════════════════════════════════════════════════ */
export function BottomWidgetVariantB() {
  const [tab, setTab] = useState<"people" | "risk" | "stages">("people");
  return (
    <div className="h-[400px] rounded-xl overflow-hidden border border-neutral-200 bg-white flex flex-col">
      <div className="px-4 py-2 border-b flex items-center gap-1 shrink-0">
        {[
          { id: "people" as const, icon: Users, label: "Team Load" },
          { id: "risk" as const, icon: Shield, label: "Risk Radar" },
          { id: "stages" as const, icon: Layers, label: "Stage Board" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ${tab === t.id ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100"}`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "people" && (
          <div className="grid grid-cols-3 gap-4">
            {TEAM.map(t => {
              const avg = Math.round(t.weeks.reduce((s, w) => s + w.h, 0) / t.weeks.length);
              const pct = Math.round((avg / t.capacity) * 100);
              return (
                <div key={t.name} className="rounded-xl border border-neutral-200 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-sm font-bold text-white">{t.avatar}</div>
                    <div><div className="text-sm font-bold text-neutral-900">{t.name}</div><div className="text-xs text-neutral-400">{t.role}</div></div>
                    <span className={`text-sm font-bold ml-auto ${pct > 90 ? "text-red-500" : pct > 70 ? "text-amber-500" : "text-green-500"}`}>{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 rounded-full"><div className={`h-full rounded-full ${pct > 90 ? "bg-red-400" : pct > 70 ? "bg-amber-400" : "bg-green-400"}`} style={{ width: `${Math.min(100, pct)}%` }} /></div>
                  <div className="flex gap-1">
                    {t.weeks.map(w => (
                      <div key={w.w} className={`flex-1 h-8 rounded flex items-center justify-center text-xs font-bold ${heatColor(w.h, t.capacity)} ${w.h > t.capacity ? "text-white" : "text-neutral-700"}`}>{w.h}</div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-neutral-400">{t.weeks.map(w => <span key={w.w}>{w.w}</span>)}</div>
                </div>
              );
            })}
          </div>
        )}
        {tab === "risk" && (
          <div className="grid grid-cols-3 gap-3">
            {RISKS.map(r => (
              <div key={r.axis} className={`rounded-xl border p-4 ${r.score > 70 ? "border-red-200 bg-red-50/50" : r.score > 50 ? "border-amber-200 bg-amber-50/50" : "border-green-200 bg-green-50/50"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-neutral-900">{r.axis}</span>
                  <span className={`text-lg font-black ${r.score > 70 ? "text-red-600" : r.score > 50 ? "text-amber-600" : "text-green-600"}`}>{r.score}</span>
                </div>
                <div className="w-full h-2.5 bg-white rounded-full"><div className={`h-full rounded-full ${r.score > 70 ? "bg-red-500" : r.score > 50 ? "bg-amber-400" : "bg-green-400"}`} style={{ width: `${r.score}%` }} /></div>
              </div>
            ))}
          </div>
        )}
        {tab === "stages" && (
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-neutral-200"><th className="text-left text-xs font-semibold text-neutral-500 uppercase px-3 py-2 w-32">Project</th>{STAGES.map(s => <th key={s} className="text-center text-xs font-semibold text-neutral-500 uppercase px-2 py-2">{s}</th>)}</tr></thead>
            <tbody>{PROJECTS.map(p => (<tr key={p.short} className="border-b border-neutral-100"><td className="px-3 py-2"><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} /><span className="text-sm font-medium">{p.short}</span></div></td>{STAGES.map(s => { const sd = STAGE_DATA[p.short]?.find(x => x.stage === s); return <td key={s} className="text-center px-2 py-2">{sd ? <StageCell {...sd} /> : "—"}</td>; })}</tr>))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   VARIANT C — Two Rows
   Top row: People (60%) + Risk bars (40%)
   Bottom row: Stage Board full width
   ═══════════════════════════════════════════════════════════ */
export function BottomWidgetVariantC() {
  return (
    <div className="h-[400px] rounded-xl overflow-hidden border border-neutral-200 bg-white flex flex-col">
      {/* Top: People + Risk */}
      <div className="flex border-b border-neutral-200" style={{ flex: "1 1 55%" }}>
        {/* People */}
        <div className="border-r border-neutral-200 flex flex-col" style={{ flex: "6 1 0" }}>
          <div className="px-4 py-2 border-b flex items-center gap-2 shrink-0">
            <Users className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-xs font-bold text-neutral-900">Team</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {TEAM.map(t => {
              const pct = Math.round((t.weeks.reduce((s, w) => s + w.h, 0) / t.weeks.length / t.capacity) * 100);
              return (
                <div key={t.name} className="flex items-center gap-2 py-1.5">
                  <div className="w-6 h-6 rounded-full bg-neutral-900 flex items-center justify-center text-xs font-bold text-white">{t.avatar}</div>
                  <span className="text-xs font-medium text-neutral-800 w-14">{t.name}</span>
                  <div className="flex gap-0.5 flex-1">
                    {t.weeks.map(w => (
                      <div key={w.w} className={`flex-1 h-5 rounded flex items-center justify-center text-xs font-bold ${heatColor(w.h, t.capacity)} ${w.h > t.capacity ? "text-white" : "text-neutral-700"}`}>{w.h}</div>
                    ))}
                  </div>
                  <span className={`text-xs font-bold w-8 text-right ${pct > 90 ? "text-red-500" : "text-neutral-500"}`}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
        {/* Risk */}
        <div className="flex flex-col" style={{ flex: "4 1 0" }}>
          <div className="px-4 py-2 border-b flex items-center gap-2 shrink-0">
            <Shield className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-bold text-neutral-900">Risk</span>
            <span className="text-xs text-red-600 font-bold ml-auto">HIGH</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {RISKS.map(r => (
              <div key={r.axis} className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 w-14 shrink-0">{r.axis}</span>
                <div className="flex-1 h-1.5 bg-neutral-100 rounded-full"><div className={`h-full rounded-full ${r.score > 70 ? "bg-red-500" : r.score > 50 ? "bg-amber-400" : "bg-green-400"}`} style={{ width: `${r.score}%` }} /></div>
                <span className={`text-xs font-bold w-5 text-right ${r.score > 70 ? "text-red-500" : "text-neutral-500"}`}>{r.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Bottom: Stage Board */}
      <div className="flex-1 overflow-auto p-2">
        <table className="w-full border-collapse">
          <thead><tr><th className="text-left text-xs font-semibold text-neutral-400 uppercase px-3 py-1 w-28"></th>{STAGES.map(s => <th key={s} className="text-center text-xs font-semibold text-neutral-400 uppercase px-1 py-1">{s}</th>)}</tr></thead>
          <tbody>{PROJECTS.map(p => (<tr key={p.short} className="border-t border-neutral-100"><td className="px-3 py-1.5"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} /><span className="text-xs font-medium">{p.short}</span></div></td>{STAGES.map(s => { const sd = STAGE_DATA[p.short]?.find(x => x.stage === s); return <td key={s} className="text-center px-1 py-1.5">{sd ? <StageCell {...sd} /> : "—"}</td>; })}</tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   VARIANT D — Dense Dashboard Strip
   All three inline in one compact row, no headers,
   maximum density
   ═══════════════════════════════════════════════════════════ */
export function BottomWidgetVariantD() {
  return (
    <div className="h-[400px] rounded-xl overflow-hidden border border-neutral-200 bg-neutral-900 text-white flex flex-col">
      <div className="px-4 py-2 border-b border-white/10 flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-purple-400" /><span className="text-xs font-bold">Team</span></div>
        <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-red-400" /><span className="text-xs font-bold">Risk</span></div>
        <div className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-indigo-400" /><span className="text-xs font-bold">Stages</span></div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        {/* People */}
        <div className="border-r border-white/10 p-3 overflow-y-auto" style={{ flex: "1 1 0" }}>
          {TEAM.map(t => {
            const pct = Math.round((t.weeks.reduce((s, w) => s + w.h, 0) / t.weeks.length / t.capacity) * 100);
            return (
              <div key={t.name} className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">{t.avatar}</div>
                  <span className="text-xs font-medium flex-1">{t.name}</span>
                  <span className={`text-xs font-bold ${pct > 90 ? "text-red-400" : "text-neutral-400"}`}>{pct}%</span>
                </div>
                <div className="flex gap-0.5">
                  {t.weeks.map(w => {
                    const r = w.h / t.capacity;
                    const bg = r > 1 ? "bg-red-500" : r > 0.9 ? "bg-orange-400" : r > 0.75 ? "bg-yellow-400" : "bg-green-400";
                    return <div key={w.w} className={`flex-1 h-5 rounded flex items-center justify-center text-xs font-bold ${bg} text-neutral-900`}>{w.h}</div>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
        {/* Risk */}
        <div className="border-r border-white/10 p-3 overflow-y-auto" style={{ flex: "1 1 0" }}>
          {RISKS.map(r => (
            <div key={r.axis} className="flex items-center gap-2 mb-2">
              <span className="text-xs text-neutral-400 w-14 shrink-0">{r.axis}</span>
              <div className="flex-1 h-2 bg-white/10 rounded-full"><div className={`h-full rounded-full ${r.score > 70 ? "bg-red-500" : r.score > 50 ? "bg-amber-400" : "bg-green-400"}`} style={{ width: `${r.score}%` }} /></div>
              <span className={`text-xs font-bold w-5 ${r.score > 70 ? "text-red-400" : "text-neutral-500"}`}>{r.score}</span>
            </div>
          ))}
          <div className="bg-purple-500/10 rounded-lg border border-purple-500/20 p-2 mt-2">
            <p className="text-xs text-purple-300 leading-relaxed">Deadline risk high. Freeze scope, parallelize.</p>
          </div>
        </div>
        {/* Stages */}
        <div className="p-3 overflow-auto" style={{ flex: "1 1 0" }}>
          {PROJECTS.map(p => (
            <div key={p.short} className="mb-2">
              <div className="flex items-center gap-1.5 mb-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} /><span className="text-xs font-medium">{p.short}</span></div>
              <div className="flex gap-1">
                {STAGES.map(s => {
                  const sd = STAGE_DATA[p.short]?.find(x => x.stage === s);
                  if (!sd) return <div key={s} className="flex-1 h-6 rounded bg-white/5" />;
                  const bg = sd.status === "done" ? "bg-green-500/20" : sd.status === "blocked" ? "bg-red-500/20" : sd.status === "active" ? "bg-amber-400/20" : "bg-white/5";
                  const tc = sd.status === "done" ? "text-green-400" : sd.status === "blocked" ? "text-red-400" : sd.status === "active" ? "text-amber-400" : "text-neutral-500";
                  return <div key={s} className={`flex-1 h-6 rounded ${bg} flex items-center justify-center text-xs font-bold ${tc}`}>{sd.done}/{sd.total}</div>;
                })}
              </div>
            </div>
          ))}
          <div className="flex justify-between text-xs text-neutral-500 mt-1">{STAGES.map(s => <span key={s}>{s.slice(0, 3)}</span>)}</div>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   VARIANT E — Risk + AI + Stage (Three Columns, No People)
   Risk bars (40%) | AI Brief (20%) | Stage board (40%)
   ═══════════════════════════════════════════════════════════ */
export function BottomWidgetVariantE() {
  const [selectedProject, setSelectedProject] = useState("CCv5");
  const [riskSort, setRiskSort] = useState<"score" | "alpha">("score");

  const risksDisplayed = riskSort === "alpha" ? [...RISKS].sort((a, b) => a.axis.localeCompare(b.axis)) : RISKS;
  const selectedData = STAGE_DATA[selectedProject] || [];
  const highestRisks = RISKS.filter(r => r.score > 70);

  return (
    <div className="h-[400px] rounded-xl overflow-hidden border border-neutral-200 bg-white flex flex-col">
      {/* Mini Header with Project Selection */}
      <div className="px-4 py-2 border-b bg-neutral-50 flex items-center gap-2 text-xs shrink-0">
        <span className="font-semibold text-neutral-700">Project:</span>
        {PROJECTS.map(p => (
          <button key={p.short} onClick={() => setSelectedProject(p.short)}
            className={`px-2 py-1 rounded text-xs font-medium transition-all ${selectedProject === p.short ? "bg-neutral-900 text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300"}`}>
            {p.short}
          </button>
        ))}
        <button onClick={() => setRiskSort(riskSort === "score" ? "alpha" : "score")}
          className="ml-auto px-2 py-1 rounded text-xs bg-neutral-100 text-neutral-600 hover:bg-neutral-200">
          Sort: {riskSort === "score" ? "Score" : "Axis"}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Risk — 40% */}
        <div className="border-r border-neutral-200 flex flex-col overflow-hidden" style={{ flex: "40 1 0" }}>
          <div className="px-4 py-2.5 border-b flex items-center gap-2 shrink-0">
            <Shield className="w-4 h-4 text-red-500" />
            <span className="text-sm font-bold text-neutral-900">Risk Radar</span>
            <span className={`text-xs font-bold ml-auto px-2 py-0.5 rounded-full border ${highestRisks.length > 2 ? "bg-red-50 text-red-600 border-red-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
              {highestRisks.length > 2 ? "⚠️ CRITICAL" : "⚠️ WARNING"}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {risksDisplayed.map(r => (
              <div key={r.axis} className="space-y-1 cursor-pointer hover:bg-neutral-50 p-1 rounded transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-700">{r.axis}</span>
                  <span className={`text-xs font-bold ${r.score > 70 ? "text-red-600" : r.score > 50 ? "text-amber-600" : "text-green-600"}`}>{r.score}%</span>
                </div>
                <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div className={`h-full ${r.score > 70 ? "bg-red-500" : r.score > 50 ? "bg-amber-400" : "bg-green-400"}`} style={{ width: `${r.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Brief — 20% */}
        <div className="border-r border-neutral-200 flex flex-col overflow-hidden px-3 py-3" style={{ flex: "20 1 0" }}>
          <div className="text-xs font-bold text-purple-700 mb-2 flex items-center gap-1">
            <span>💡</span> AI
          </div>
          <div className="text-xs leading-relaxed text-purple-600 space-y-1.5 flex-1 overflow-y-auto">
            {highestRisks.length > 0 && (
              <>
                <p><strong>Top Risk:</strong> {highestRisks[0]?.axis} ({highestRisks[0]?.score}%)</p>
                <p className="text-purple-500 font-semibold">Action: Mitigate {highestRisks[0]?.axis.toLowerCase()}</p>
              </>
            )}
            <p className="text-xs italic text-purple-500">Sprint velocity down 15%. {selectedProject} at risk.</p>
          </div>
        </div>

        {/* Stage Board — 40% */}
        <div className="flex flex-col overflow-hidden" style={{ flex: "40 1 0" }}>
          <div className="px-4 py-2.5 border-b flex items-center gap-2 shrink-0">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-bold text-neutral-900">{selectedProject} Progress</span>
          </div>
          <div className="flex-1 overflow-auto p-2">
            <div className="space-y-2">
              {selectedData.length > 0 ? selectedData.map(sd => {
                const pct = Math.round((sd.done / sd.total) * 100);
                return (
                  <div key={sd.stage} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-neutral-700">{sd.stage}</span>
                      <span className="text-xs font-bold text-neutral-500">{sd.done}/{sd.total}</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className={`h-full ${sd.status === "done" ? "bg-green-400" : sd.status === "blocked" ? "bg-red-500" : sd.status === "active" ? "bg-amber-400" : "bg-blue-300"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              }) : <div className="text-xs text-neutral-400">No data</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   VARIANT F — Risk + Stage (Top/Bottom) with AI Summary
   Top: Risk bars + Stage cards
   Bottom: AI brief with radar + sprint callouts
   Interactive: Click risk to filter, shows connected insights
   ═══════════════════════════════════════════════════════════ */
export function BottomWidgetVariantF() {
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [sprintWeek, setSprintWeek] = useState("W17");

  const topRisk = selectedRisk ? RISKS.find(r => r.axis === selectedRisk) : RISKS.reduce((max, r) => r.score > max.score ? r : max);
  const blockedProjects = PROJECTS.filter(p =>
    STAGE_DATA[p.short]?.some(sd => sd.status === "blocked")
  ).map(p => p.short);

  return (
    <div className="h-[400px] rounded-xl overflow-hidden border border-neutral-200 bg-white flex flex-col">
      {/* Top: Risk + Stage */}
      <div className="flex border-b border-neutral-200" style={{ flex: "1 1 55%" }}>
        {/* Risk — Clickable */}
        <div className="border-r border-neutral-200 flex flex-col p-3 overflow-auto bg-neutral-50" style={{ flex: "1 1 0" }}>
          <div className="text-xs font-bold text-neutral-900 mb-2 flex items-center gap-1">
            <Shield className="w-3 h-3" /> Risk (click to filter)
          </div>
          {RISKS.map(r => (
            <button key={r.axis} onClick={() => setSelectedRisk(selectedRisk === r.axis ? null : r.axis)}
              className={`flex items-center gap-2 mb-1.5 p-1 rounded transition-all text-left ${selectedRisk === r.axis ? "bg-white border-l-2" : "hover:bg-white/50"}`}
              style={selectedRisk === r.axis ? { borderLeftColor: r.score > 70 ? "#ef4444" : "#f59e0b" } : {}}>
              <span className="text-xs text-neutral-600 w-12 shrink-0">{r.axis}</span>
              <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${r.score > 70 ? "bg-red-500" : r.score > 50 ? "bg-amber-400" : "bg-green-400"}`} style={{ width: `${r.score}%` }} />
              </div>
              <span className="text-xs font-bold">{r.score}</span>
            </button>
          ))}
        </div>

        {/* Stage Grid */}
        <div className="flex flex-col p-3 overflow-auto" style={{ flex: "1 1 0" }}>
          <div className="text-xs font-bold text-neutral-900 mb-2">All Projects</div>
          <div className="flex gap-1">
            {PROJECTS.map(p => (
              <div key={p.short} className="flex flex-col gap-1 flex-1">
                <div className={`text-xs font-medium text-center px-1 py-0.5 rounded ${blockedProjects.includes(p.short) ? "bg-red-100 text-red-700" : "text-neutral-600"}`} style={{ color: blockedProjects.includes(p.short) ? undefined : p.color }}>
                  {p.short}
                </div>
                {STAGES.map(s => {
                  const sd = STAGE_DATA[p.short]?.find(x => x.stage === s);
                  if (!sd) return <div key={s} className="h-4 rounded bg-neutral-100" />;
                  const bg = sd.status === "done" ? "bg-green-400" : sd.status === "blocked" ? "bg-red-500" : sd.status === "active" ? "bg-amber-400" : "bg-blue-200";
                  return <div key={s} title={`${s}: ${sd.done}/${sd.total}`} className={`h-4 rounded ${bg}`} />;
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: AI + Connectors */}
      <div className="flex border-t border-neutral-200 flex-1 p-3 space-x-4 text-xs overflow-auto">
        {/* AI Insights */}
        <div className="flex-1 bg-purple-50 rounded-lg p-2.5 border border-purple-200">
          <div className="text-xs font-bold text-purple-700 mb-2">💡 AI Brief</div>
          <p className="text-purple-600 leading-snug font-medium">{topRisk?.axis} is {topRisk?.score}% at risk.</p>
          <p className="text-purple-600 leading-snug mt-1">
            {blockedProjects.length > 0 && `${blockedProjects.join(", ")} blocked. `}
            {topRisk?.score! > 70 && "Immediate action needed."}
          </p>
        </div>

        {/* Risk Radar Connection */}
        <div className="flex-1 bg-red-50 rounded-lg p-2.5 border border-red-200 space-y-1">
          <div className="text-xs font-bold text-red-700">📊 Risk Radar</div>
          <div className="text-xs text-red-600">
            {selectedRisk ? (
              <div>Focused on <strong>{selectedRisk}</strong></div>
            ) : (
              <div>
                <div>Scope ▼ stable</div>
                <div>Deadline ▲▲ critical</div>
              </div>
            )}
          </div>
        </div>

        {/* Sprint Connection */}
        <div className="flex-1 bg-amber-50 rounded-lg p-2.5 border border-amber-200 space-y-1">
          <div className="text-xs font-bold text-amber-700">🏃 Sprint</div>
          <div className="text-xs text-amber-600">
            <div>{sprintWeek}: {blockedProjects.length} blocker{blockedProjects.length !== 1 ? "s" : ""}</div>
            <div>Velocity: -15%</div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   VARIANT G — Compact Card Layout
   Risk card (high-level) | Stage card grid | AI callout
   Interactive: Click KPI card, Risk radar, Sprint all connected
   ═══════════════════════════════════════════════════════════ */
export function BottomWidgetVariantG() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [filterByRisk, setFilterByRisk] = useState<"high" | "all">("high");

  const topThreeRisks = filterByRisk === "high" ? RISKS.filter(r => r.score > 70) : RISKS.slice(0, 3);
  const selectedProjData = selectedProject ? STAGE_DATA[selectedProject] : null;
  const blocker = STAGE_DATA["CCv5"]?.find(sd => sd.status === "blocked");

  return (
    <div className="h-[400px] rounded-xl overflow-hidden border border-neutral-200 bg-gradient-to-br from-neutral-50 to-neutral-100 p-3 flex flex-col gap-3">
      {/* Header with KPI-like filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-500" />
          <Layers className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-bold text-neutral-900">Risk + Progress Board</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setFilterByRisk(filterByRisk === "high" ? "all" : "high")}
            className={`px-2 py-1 rounded text-xs font-medium transition-all ${filterByRisk === "high" ? "bg-red-500 text-white" : "bg-white text-neutral-600 border border-neutral-200"}`}>
            {filterByRisk === "high" ? "🔴 High Risk" : "All Risks"}
          </button>
        </div>
      </div>

      {/* Body Grid */}
      <div className="flex-1 flex gap-2 overflow-hidden">
        {/* Risk Cards — Interactive on click */}
        <div className="flex flex-col gap-1.5 overflow-y-auto" style={{ flex: "1 1 0" }}>
          {topThreeRisks.map(r => (
            <button key={r.axis} onClick={() => setSelectedProject(null)}
              className={`rounded-lg border p-2.5 transition-all cursor-pointer hover:shadow-md ${r.score > 70 ? "bg-red-50 border-red-200 hover:border-red-400" : r.score > 50 ? "bg-amber-50 border-amber-200 hover:border-amber-400" : "bg-green-50 border-green-200"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-neutral-700">{r.axis}</span>
                <span className={`text-sm font-black ${r.score > 70 ? "text-red-600" : r.score > 50 ? "text-amber-600" : "text-green-600"}`}>{r.score}</span>
              </div>
              <div className="h-1.5 bg-white rounded-full overflow-hidden">
                <div className={`h-full ${r.score > 70 ? "bg-red-500" : r.score > 50 ? "bg-amber-400" : "bg-green-400"}`} style={{ width: `${r.score}%` }} />
              </div>
            </button>
          ))}
        </div>

        {/* Stage Progress Columns — Clickable per project */}
        <div className="flex flex-col gap-1.5 overflow-y-auto" style={{ flex: "1 1 0" }}>
          {PROJECTS.map(p => (
            <button key={p.short} onClick={() => setSelectedProject(selectedProject === p.short ? null : p.short)}
              className={`rounded-lg border p-2.5 space-y-1.5 transition-all cursor-pointer ${selectedProject === p.short ? "border-indigo-500 bg-indigo-50" : "bg-white border-neutral-200 hover:border-neutral-300"}`}>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-xs font-bold text-neutral-700">{p.short}</span>
                {STAGE_DATA[p.short]?.some(sd => sd.status === "blocked") && <span className="text-xs text-red-600 font-bold ml-auto">⚠️</span>}
              </div>
              <div className="flex gap-1">
                {STAGES.map(s => {
                  const sd = STAGE_DATA[p.short]?.find(x => x.stage === s);
                  if (!sd) return <div key={s} className="flex-1 h-3 rounded bg-neutral-100" />;
                  const bg = sd.status === "done" ? "bg-green-500" : sd.status === "blocked" ? "bg-red-600" : sd.status === "active" ? "bg-amber-500" : "bg-blue-300";
                  return <div key={s} title={`${s}: ${sd.done}/${sd.total}`} className={`flex-1 h-3 rounded ${bg}`} />;
                })}
              </div>
            </button>
          ))}
        </div>

        {/* AI + Context Panel */}
        <div className="bg-white rounded-lg border border-purple-200 p-3 overflow-y-auto flex flex-col justify-between" style={{ flex: "0.8 1 0" }}>
          <div>
            <div className="text-xs font-bold text-purple-700 mb-2">💡 AI Guidance</div>
            <div className="space-y-1.5 text-xs text-purple-600">
              {selectedProject ? (
                <>
                  <div><strong>{selectedProject}:</strong></div>
                  <div className="text-purple-500">
                    {selectedProjData?.find(s => s.status === "blocked") && "Blocked stage detected. Unblock to ship."}
                    {!selectedProjData?.find(s => s.status === "blocked") && "On track. Keep momentum."}
                  </div>
                </>
              ) : (
                <>
                  <div><strong>Focus:</strong> Deadline (85%)</div>
                  <div className="text-purple-500">Parallelize work. Reduce bottleneck.</div>
                  <div className="mt-1 pt-1 border-t border-purple-200 text-purple-500">Sprint: -15% velocity</div>
                </>
              )}
            </div>
          </div>

          {/* Sprint/Risk Radar Quick Stats */}
          <div className="text-xs space-y-1 pt-2 border-t border-purple-200">
            <div className="flex justify-between">
              <span className="text-purple-600">Risk Level:</span>
              <span className="font-bold text-red-600">High</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-600">Blockers:</span>
              <span className="font-bold text-amber-600">{PROJECTS.filter(p => STAGE_DATA[p.short]?.some(s => s.status === "blocked")).length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VARIANT H — KPI Dashboard (50VW, 100VH)
   Project Selector | Story Phases | Risk Radar | Sprint Chart
   ═══════════════════════════════════════════════════════════ */
export function BottomWidgetVariantH() {
  const [selProject, setSelProject] = useState("CCv5");
  const projData = PROJECTS.find(p => p.short === selProject);
  const stages = STAGE_DATA[selProject] || [];

  return (
    <div className="w-screen h-screen bg-white overflow-hidden flex flex-col gap-0">
      {/* Project Selector */}
      <div className="bg-white border-b border-neutral-200 px-5 py-3 flex items-center gap-3 shrink-0">
        <span className="text-sm font-semibold text-neutral-600">Project:</span>
        <div className="flex gap-2">
          {PROJECTS.map(p => (
            <button
              key={p.short}
              onClick={() => setSelProject(p.short)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selProject === p.short
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              {p.short}
            </button>
          ))}
        </div>
      </div>

      {/* Main Container - 50VW */}
      <div className="flex-1 overflow-y-auto" style={{ width: "50vw" }}>
        <div className="p-5 space-y-5 h-full">

          {/* Story Phase Card */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-bold text-neutral-900">Development Pipeline</span>
              <span className="text-xs text-neutral-400 ml-auto">{projData?.name}</span>
            </div>

            <div className="space-y-3">
              {stages.map((stage, i) => {
                const pct = stage.total > 0 ? Math.round((stage.done / stage.total) * 100) : 0;
                const statusColor = {
                  done: "bg-green-500",
                  active: "bg-amber-500",
                  blocked: "bg-red-500",
                  todo: "bg-blue-500",
                  backlog: "bg-neutral-400",
                }[stage.status] || "bg-neutral-300";

                return (
                  <div key={stage.stage} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-neutral-700">{stage.stage}</span>
                      <span className="text-xs text-neutral-400">
                        {stage.done}/{stage.total}
                      </span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${statusColor} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-neutral-600 w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stage Summary */}
            <div className="mt-4 pt-4 border-t border-neutral-200 grid grid-cols-5 gap-2">
              {stages.map(s => (
                <div key={s.stage} className="text-center">
                  <div className="text-xs text-neutral-400 mb-1">{s.stage.slice(0, 3)}</div>
                  <div className={`text-sm font-bold ${s.status === "done" ? "text-green-600" : s.status === "active" ? "text-amber-600" : s.status === "blocked" ? "text-red-600" : "text-neutral-500"}`}>
                    {s.done}/{s.total}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Radar Chart */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4" style={{ height: "280px" }}>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-red-500" />
              <span className="text-sm font-bold text-neutral-900">Risk Assessment</span>
            </div>
            <RiskRadar data={riskData} />
          </div>

          {/* Burndown/Sprint Chart */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4" style={{ height: "280px" }}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-bold text-neutral-900">Sprint Progress</span>
              <span className="text-xs text-neutral-400 ml-auto">{burndownData.title}</span>
            </div>
            <Burndown data={burndownData} />
          </div>

        </div>
      </div>
    </div>
  );
}
