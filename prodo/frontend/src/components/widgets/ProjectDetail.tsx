"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle, CircleDot, Sparkles, Shield } from "lucide-react";
import { usePMStore, selectDashboardProjects } from "@/lib/store";

/* ── Stage data (fallback) ────────────────────────────── */

const STAGE_DATA: Record<string, { stage: string; done: number; total: number; status: string; blocked?: number; est?: string }[]> = {
  CCv5: [
    { stage: "Research", done: 2, total: 2, status: "done", est: "Done Apr 21" },
    { stage: "Design", done: 2, total: 2, status: "done", est: "Done Apr 28" },
    { stage: "Build", done: 1, total: 4, status: "active", blocked: 2, est: "est. May 18 (+3d)" },
    { stage: "Test", done: 0, total: 2, status: "todo", est: "est. May 28" },
    { stage: "Ship", done: 0, total: 2, status: "todo", est: "est. Jun 5" },
  ],
  NRv3: [
    { stage: "Research", done: 1, total: 1, status: "done", est: "Done" },
    { stage: "Design", done: 1, total: 1, status: "done", est: "Done" },
    { stage: "Build", done: 1, total: 3, status: "active", est: "est. May 20" },
    { stage: "Test", done: 0, total: 1, status: "todo", est: "est. May 28" },
    { stage: "Ship", done: 0, total: 1, status: "todo", est: "est. Jun 1" },
  ],
  Spot: [
    { stage: "Research", done: 1, total: 1, status: "done", est: "Done" },
    { stage: "Design", done: 2, total: 2, status: "done", est: "Done" },
    { stage: "Build", done: 2, total: 4, status: "blocked", blocked: 2, est: "blocked" },
    { stage: "Test", done: 0, total: 1, status: "todo", est: "est. Apr 28" },
    { stage: "Ship", done: 1, total: 1, status: "done", est: "Done" },
  ],
};

/* ── Health config ────────────────────────────────────── */

const HEALTH_CFG: Record<string, { bg: string; border: string; text: string; icon: React.ElementType; label: string }> = {
  "on-track": { bg: "bg-[#f0fdf4]", border: "border-[#86efac]", text: "text-[#15803d]", icon: CheckCircle2, label: "On Track" },
  "at-risk": { bg: "bg-[#fffbeb]", border: "border-[#fcd34d]", text: "text-[#b45309]", icon: AlertTriangle, label: "At Risk" },
  critical: { bg: "bg-[#fef2f2]", border: "border-[#fca5a5]", text: "text-[#b91c1c]", icon: AlertTriangle, label: "Critical" },
};

/* ── Stage card config ────────────────────────────────── */

const STAGE_CFG: Record<string, { cardBg: string; cardBorder: string; titleColor: string; barBg: string; barFill: string; metaColor: string; Icon: React.ElementType }> = {
  done: { cardBg: "bg-[#f8fafc]", cardBorder: "border-[#e2e8f0]", titleColor: "text-neutral-950", barBg: "bg-[#dcfce7]", barFill: "bg-[#22c55e]", metaColor: "text-neutral-500", Icon: CheckCircle2 },
  active: { cardBg: "bg-[#fffbeb]", cardBorder: "border-[#fcd34d]", titleColor: "text-[#b45309]", barBg: "bg-[#fef3c7]", barFill: "bg-[#f59e0b]", metaColor: "text-[#b45309]", Icon: AlertTriangle },
  blocked: { cardBg: "bg-[#fef2f2]", cardBorder: "border-[#fca5a5]", titleColor: "text-[#b91c1c]", barBg: "bg-[#fee2e2]", barFill: "bg-[#ef4444]", metaColor: "text-[#b91c1c]", Icon: AlertTriangle },
  todo: { cardBg: "bg-[#f8fafc]", cardBorder: "border-[#e2e8f0]", titleColor: "text-neutral-500", barBg: "bg-[#e2e8f0]", barFill: "bg-[#e2e8f0]", metaColor: "text-neutral-400", Icon: CircleDot },
};

/* ── Component ────────────────────────────────────────── */

interface ProjectDetailProps {
  projectShort: string;
}

export default function ProjectDetail({ projectShort }: ProjectDetailProps) {
  const router = useRouter();
  const projects = usePMStore(selectDashboardProjects);
  const proj = projects.find(p => p.short === projectShort) || projects[0];
  if (!proj) return null;

  const today = Date.now();
  const target = (proj as any).target || (proj as any).target_date || "";
  const deadline = target ? Math.max(0, Math.ceil((new Date(target).getTime() - today) / 86400000)) : (proj as any).daysLeft ?? 999;
  const health: string = deadline <= 7 && proj.progress < 80 ? "critical" : deadline <= 30 && proj.progress < 60 ? "at-risk" : "on-track";
  const hCfg = HEALTH_CFG[health] || HEALTH_CFG["on-track"];
  const HIcon = hCfg.icon;
  const stages = STAGE_DATA[proj.short] || [];

  const toSlug = (name: string) => `/project/${name.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div
      className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden cursor-pointer hover:shadow-sm transition-shadow"
      onClick={() => router.push(toSlug(proj.name))}
    >
      {/* Row 1: Name + health pill */}
      <div className="flex items-center justify-between px-5 py-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: proj.color }} />
          <span className="text-base font-bold text-neutral-950">{proj.short}</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${hCfg.bg} ${hCfg.border}`}>
          <HIcon className={`w-3 h-3 ${hCfg.text}`} />
          <span className={`text-xs font-bold ${hCfg.text}`}>{hCfg.label}</span>
        </div>
      </div>

      <div className="h-px bg-[#e2e8f0]" />

      {/* Row 2: Progress stats + days left */}
      <div className="px-5 py-2.5">
        <div className="flex items-start justify-between">
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl font-bold text-neutral-950 font-mono tabular-nums">{proj.progress}%</span>
            <span className="text-xs font-bold text-[#15803d]">↑ 8% wk</span>
            <span className="text-sm text-neutral-500">
              complete · <span className="font-bold text-[#15803d]">{proj.done}</span> done · <span className="font-bold text-[#b45309]">{proj.active}</span> active · <span className="font-bold text-[#b91c1c]">{proj.blocked}</span> blocked
            </span>
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-neutral-950">{deadline}d</span>
              <span className="text-sm text-neutral-500">left</span>
              <span className="text-xs font-bold text-[#b91c1c]">↓ 2d</span>
            </div>
            <div className="text-xs text-neutral-500">est. completion <span className="font-semibold text-neutral-700">Aug 12</span></div>
          </div>
        </div>
        {/* Segmented progress bar */}
        <div className="flex gap-[2px] h-2 rounded mt-2 overflow-hidden">
          <div className="bg-[#22c55e]" style={{ flex: proj.done }} />
          <div className="bg-[#f59e0b]" style={{ flex: proj.active }} />
          {proj.blocked > 0 && <div className="bg-[#ef4444]" style={{ flex: proj.blocked }} />}
        </div>
      </div>

      <div className="h-px bg-[#e2e8f0]" />

      {/* Row 3: Today summary */}
      <div className="px-5 py-1.5 bg-[#f8fafc] flex items-center gap-2 text-xs">
        <span className="font-bold text-neutral-700">Today</span>
        <span className="text-neutral-300">·</span>
        <span className="text-neutral-500"><span className="font-bold text-[#15803d]">+1</span> task done</span>
        <span className="text-neutral-300">·</span>
        <span className="text-neutral-500"><span className="font-bold text-[#b45309]">2 new blockers</span> on Build</span>
        <span className="text-neutral-300">·</span>
        <span className="text-neutral-400">Last updated 2h ago</span>
      </div>

      <div className="h-px bg-[#e2e8f0]" />

      {/* Row 4: Stage pipeline */}
      {stages.length > 0 && (
        <div className="px-5 py-2.5 flex items-center gap-1.5">
          {stages.map((s, i) => {
            const cfg = STAGE_CFG[s.status] || STAGE_CFG.todo;
            const SIcon = cfg.Icon;
            const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
            return (
              <React.Fragment key={s.stage}>
                {i > 0 && <span className="text-lg text-[#cbd5e1] shrink-0">›</span>}
                <div className={`flex-1 ${cfg.cardBg} border ${cfg.cardBorder} rounded-lg p-2.5 min-w-0`}>
                  <div className="flex items-center gap-1.5">
                    <SIcon className={`w-3.5 h-3.5 ${cfg.titleColor}`} />
                    <span className={`text-sm font-bold ${cfg.titleColor}`}>{s.stage}</span>
                  </div>
                  <div className={`text-xs font-medium mt-0.5 ${cfg.metaColor}`}>
                    {s.done} / {s.total}{s.blocked ? ` · ${s.blocked} blocked` : ""}
                  </div>
                  <div className={`h-1 ${cfg.barBg} rounded-full mt-1.5 overflow-hidden`}>
                    <div className={`h-full ${cfg.barFill} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className={`text-2xs mt-1 ${cfg.metaColor}`}>{s.est}</div>
                </div>
              </React.Fragment>
            );
          })}
          <div className="w-px h-14 bg-[#e2e8f0] mx-1 shrink-0" />
          <div className="shrink-0 pl-2">
            <div className="text-xs font-medium text-neutral-500">Required pace</div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-neutral-950">0.3</span>
              <span className="text-xs text-neutral-500">tasks/day</span>
            </div>
            <div className="text-2xs text-neutral-500">→ unchanged</div>
          </div>
        </div>
      )}

      <div className="h-px bg-[#e2e8f0]" />

      {/* Row 5: AI insights footer */}
      <div className="px-5 py-2.5 flex items-stretch divide-x divide-[#e2e8f0]">
        {/* Next action */}
        <div className="flex-1 pr-3">
          <div className="flex items-center gap-1.5">
            <div className="bg-[#7c3aed] rounded text-white text-[7px] font-bold w-3.5 h-3.5 flex items-center justify-center">AI</div>
            <span className="text-xs font-bold text-[#6d28d9]">Next action</span>
          </div>
          <div className="text-xs text-neutral-700 mt-0.5">
            Unblock Build — Phase B <span className="text-neutral-500">(blocking 2 tasks)</span>
          </div>
        </div>
        {/* Top risk */}
        <div className="flex-1 px-3">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-xs font-bold text-neutral-500">Top risk</span>
            <span className="text-2xs font-bold text-[#b91c1c]">↑ worse</span>
          </div>
          <div className="text-xs text-neutral-700 mt-0.5">
            Build bottleneck · 2/4 blocked, <span className="font-semibold text-[#b91c1c]">+1 since yesterday</span>
          </div>
        </div>
        {/* AI suggestion */}
        <div className="flex-1 pl-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#6d28d9]" />
            <span className="text-xs font-bold text-[#6d28d9]">AI suggestion</span>
          </div>
          <div className="text-xs text-neutral-700 mt-0.5">
            Reassign 1 task to Build · recover <span className="font-bold text-[#15803d]">3 days</span>
          </div>
        </div>
      </div>
    </div>
  );
}
