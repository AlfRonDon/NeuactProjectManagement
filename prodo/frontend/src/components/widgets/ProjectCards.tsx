"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import { usePMStore, selectDashboardProjects } from "@/lib/store";

/* ── Health config ────────────────────────────────────── */

const HEALTH: Record<string, {
  gradient: string; border: string; pillBg: string; pillBorder: string;
  pillText: string; label: string; trendColor: string; sparkColor: string;
  warningIcon: string;
}> = {
  critical: {
    gradient: "from-[#fef2f2] to-white", border: "border-[#fca5a5] border-2",
    pillBg: "bg-[#fee2e2]", pillBorder: "border-[#fca5a5]", pillText: "text-[#b91c1c]",
    label: "Critical", trendColor: "#ef4444", sparkColor: "#ef4444",
    warningIcon: "▲",
  },
  "at-risk": {
    gradient: "from-[#fffbeb] to-white", border: "border-[#fde68a]",
    pillBg: "bg-[#fef3c7]", pillBorder: "border-[#fcd34d]", pillText: "text-[#b45309]",
    label: "At Risk", trendColor: "#f59e0b", sparkColor: "#f59e0b",
    warningIcon: "▲",
  },
  "on-track": {
    gradient: "from-[#f0fdf4] to-white", border: "border-[#86efac]",
    pillBg: "bg-[#dcfce7]", pillBorder: "border-[#86efac]", pillText: "text-[#15803d]",
    label: "On Track", trendColor: "#22c55e", sparkColor: "#22c55e",
    warningIcon: "○",
  },
};

/* ── Sparkline SVG ────────────────────────────────────── */

function Sparkline({ progress, health, color }: { progress: number; health: string; color: string }) {
  const base = progress;
  const points = [base - 15, base - 10, base - 12, base - 6, base - 3, base - 1, base].map(v => Math.max(0, v));
  const w = 60, h = 24;
  const max = Math.max(...points), min = Math.min(...points);
  const range = max - min || 1;
  const d = points.map((v, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 6) - 3;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  const strokeColor = HEALTH[health]?.sparkColor || color;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={d} fill="none" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Status text ──────────────────────────────────────── */

function statusText(p: any): string {
  if (p.health === "critical") {
    return p.blocked > 0 ? `Build blocked (${p.blocked} tasks)` : "Critical";
  }
  if (p.health === "at-risk") {
    return p.active > 0 ? `Scope risk (${p.active} active)` : "At risk";
  }
  return "On track";
}

/* ── Component ────────────────────────────────────────── */

function computeHealth(p: any): { health: string; deadline: number } {
  const today = Date.now();
  const target = p.target || p.target_date || "";
  const deadline = target ? Math.max(0, Math.ceil((new Date(target).getTime() - today) / 86400000)) : (p.daysLeft ?? 999);
  const progress = p.progress ?? 0;
  const health = deadline <= 7 && progress < 80 ? "critical" : deadline <= 30 && progress < 60 ? "at-risk" : "on-track";
  return { health, deadline };
}

export default function ProjectCards() {
  const router = useRouter();
  const rawProjects = usePMStore(selectDashboardProjects);
  const [scrollIdx, setScrollIdx] = useState(0);

  // Enrich projects with computed health/deadline
  const projects = rawProjects.map(p => {
    const { health, deadline } = computeHealth(p);
    return { ...p, health, deadline };
  });

  const canLeft = scrollIdx > 0;
  const canRight = scrollIdx + 3 < projects.length;

  const toSlug = (name: string) => `/project/${name.toLowerCase().replace(/\s+/g, "-")}`;

  // Sort: critical first, then at-risk, then on-track
  const sorted = [...projects].sort((a, b) => {
    const order: Record<string, number> = { critical: 0, "at-risk": 1, "on-track": 2 };
    return (order[a.health] ?? 2) - (order[b.health] ?? 2);
  });

  const display = sorted.slice(scrollIdx, scrollIdx + 3);

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* Cards */}
      <div className="flex-1 flex gap-2 min-w-0">
        {display.map(p => {
          const h = HEALTH[p.health] || HEALTH["on-track"];
          const delta = p.health === "critical" ? -6 : p.health === "at-risk" ? -3 : 4;
          const trendUp = delta > 0;

          return (
            <button
              key={p.id || p.short}
              onClick={() => router.push(toSlug(p.name))}
              className={`flex-1 min-w-0 bg-gradient-to-r ${h.gradient} ${h.border} border rounded-lg px-3 py-2 text-left transition-all hover:shadow-sm cursor-pointer`}
            >
              <div className="flex items-center gap-2">
                {/* Left content */}
                <div className="flex-1 min-w-0">
                  {/* Name row */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-xs font-bold text-neutral-950 truncate">{p.short}</span>
                  </div>
                  {/* Progress + pill + days */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm font-bold text-neutral-950 font-mono tabular-nums">{p.progress}%</span>
                    <span className={`text-2xs font-semibold px-1.5 py-[1px] rounded-full border ${h.pillBg} ${h.pillBorder} ${h.pillText}`}>
                      {h.label}
                    </span>
                    <span className="text-2xs text-neutral-500">{p.deadline}d left</span>
                  </div>
                  {/* Status line */}
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-2xs" style={{ color: h.trendColor }}>{h.warningIcon}</span>
                    <span className="text-2xs text-neutral-500 truncate">{statusText(p)}</span>
                  </div>
                </div>

                {/* Right: sparkline + trend */}
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <Sparkline progress={p.progress} health={p.health} color={p.color} />
                  <span className="text-2xs font-semibold" style={{ color: h.trendColor }}>
                    {trendUp ? "↑" : "↓"} {Math.abs(delta)}%
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Nav controls */}
      {sorted.length > 3 && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setScrollIdx(Math.max(0, scrollIdx - 1))}
            disabled={!canLeft}
            className="w-7 h-14 rounded-md border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-neutral-500" />
          </button>
          <button
            onClick={() => setScrollIdx(Math.min(sorted.length - 3, scrollIdx + 1))}
            disabled={!canRight}
            className="w-7 h-14 rounded-md border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
      )}
    </div>
  );
}
