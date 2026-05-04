"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle, CircleDot, Sparkles, Shield } from "lucide-react";
import { usePMStore, selectDashboardProjects } from "@/lib/store";
import { fetchProjectDashboard } from "@/lib/api";
import { SERIES_COLORS } from "@/design";

/* ── Health config — warm taupe palette (NOT cool grey) ─ */

const HEALTH_CFG: Record<string, { bg: string; border: string; text: string; icon: React.ElementType; label: string }> = {
  "on-track": { bg: "bg-ok-bg", border: "border-[#86efac]", text: "text-ok-fg", icon: CheckCircle2, label: "On Track" },
  "at-risk": { bg: "bg-warn-bg", border: "border-[#fcd34d]", text: "text-warn-fg", icon: AlertTriangle, label: "At Risk" },
  critical: { bg: "bg-bad-bg", border: "border-[#fca5a5]", text: "text-bad-fg", icon: AlertTriangle, label: "Critical" },
};

const STAGE_CFG: Record<string, { cardBg: string; cardBorder: string; titleColor: string; barBg: string; barFill: string; metaColor: string; Icon: React.ElementType }> = {
  done: { cardBg: "bg-neutral-50", cardBorder: "border-neutral-100", titleColor: "text-neutral-950", barBg: "bg-ok-bg", barFill: "bg-ok-solid", metaColor: "text-neutral-500", Icon: CheckCircle2 },
  active: { cardBg: "bg-warn-bg", cardBorder: "border-[#fcd34d]", titleColor: "text-warn-fg", barBg: "bg-warn-bg", barFill: "bg-warn-solid", metaColor: "text-warn-fg", Icon: AlertTriangle },
  blocked: { cardBg: "bg-bad-bg", cardBorder: "border-[#fca5a5]", titleColor: "text-bad-fg", barBg: "bg-bad-bg", barFill: "bg-bad-solid", metaColor: "text-bad-fg", Icon: AlertTriangle },
  todo: { cardBg: "bg-neutral-50", cardBorder: "border-neutral-100", titleColor: "text-neutral-500", barBg: "bg-neutral-100", barFill: "bg-neutral-100", metaColor: "text-neutral-400", Icon: CircleDot },
  backlog: { cardBg: "bg-neutral-50", cardBorder: "border-neutral-100", titleColor: "text-neutral-400", barBg: "bg-neutral-100", barFill: "bg-neutral-100", metaColor: "text-neutral-400", Icon: CircleDot },
};

/* ── Component ────────────────────────────────────────── */

export default function ProjectDetail({ projectShort }: { projectShort: string }) {
  const router = useRouter();
  const projects = usePMStore(selectDashboardProjects);
  const proj = projects.find(p => p.short === projectShort) || projects[0];
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    if (!proj?.id) return;
    let cancelled = false;
    fetchProjectDashboard(proj.id)
      .then(data => { if (!cancelled) setDashboard(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [proj?.id]);

  if (!proj) return null;

  const today = Date.now();
  const target = (proj as any).target || (proj as any).target_date || "";
  const deadline = target ? Math.max(0, Math.ceil((new Date(target).getTime() - today) / 86400000)) : (proj as any).daysLeft ?? 0;
  const rawRisk = typeof dashboard?.risk === "object" ? dashboard.risk?.label : dashboard?.risk;
  const health: string = rawRisk === "high" || rawRisk === "critical" ? "critical" : rawRisk === "medium" || rawRisk === "at_risk" ? "at-risk" : (deadline <= 7 && proj.progress < 80 ? "critical" : deadline <= 30 && proj.progress < 60 ? "at-risk" : "on-track");
  const hCfg = HEALTH_CFG[health] || HEALTH_CFG["on-track"];
  const HIcon = hCfg.icon;

  // Pipeline stages from API
  const stages: any[] = dashboard?.pipeline || [];

  // Trend from API — trend can be object {delta, direction, data} or string
  const trendObj = dashboard?.trend;
  const trendDirection = typeof trendObj === "object" ? trendObj?.direction : "";
  const trendPct = typeof trendObj === "object" ? trendObj?.delta : (dashboard?.trend_pct ?? 0);
  const trend = trendDirection === "up" ? "↑" : trendDirection === "down" ? "↓ slipping" : "";

  // Pace from API — pace can be object {required, actual} or number
  const paceObj = dashboard?.pace;
  const pace = typeof paceObj === "object" ? paceObj?.required : (typeof paceObj === "number" ? paceObj : 0);

  // Risk from API — risk can be object {label, reason} or string
  const riskObj = dashboard?.risk;
  const riskLabel = typeof riskObj === "object" ? riskObj?.label : riskObj;

  const rawEst = dashboard?.est_completion || dashboard?.ship_date || "";
  const estCompletion = rawEst && rawEst.includes("-") ? new Date(rawEst).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : rawEst;

  // AI insights from API — all can be objects with .message or strings
  const rawNext = dashboard?.next_action;
  const nextAction = typeof rawNext === "string" ? rawNext : rawNext?.message || rawNext?.title || "";
  const rawTopRisk = dashboard?.top_risk;
  const topRiskText = typeof rawTopRisk === "string" ? rawTopRisk : rawTopRisk?.message || rawTopRisk?.reason || (typeof riskObj === "object" ? riskObj?.reason : "");
  const rawSugg = dashboard?.ai_suggestion;
  const aiSuggestion = typeof rawSugg === "string" ? rawSugg : rawSugg?.message || rawSugg?.text || rawSugg?.suggestion || "";

  // Today summary from API — today can be object or separate fields
  const todayObj = dashboard?.today;
  const todayDone = todayObj?.done ?? dashboard?.today_done ?? 0;
  const todayBlockers = todayObj?.blockers ?? dashboard?.today_blockers ?? 0;
  const todayBlockerStage = dashboard?.today_blocker_stage ?? "";
  const lastUpdated = dashboard?.last_updated ?? "";

  const toSlug = (name: string) => `/project/${name.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div
      className="bg-white rounded-xl border border-neutral-100 overflow-hidden cursor-pointer hover:shadow-sm transition-shadow"
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

      <div className="h-px bg-neutral-100" />

      {/* Row 2: Progress stats + days left */}
      <div className="px-5 py-2.5">
        <div className="flex items-start justify-between">
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="text-2xl font-bold text-neutral-950 font-mono tabular-nums">{proj.progress}%</span>
            {trendPct !== 0 && (
              <span className={`text-xs font-bold ${trendPct > 0 ? "text-ok-fg" : "text-bad-fg"}`}>
                {trendPct > 0 ? "↑" : "↓"} {Math.abs(trendPct)}% wk
              </span>
            )}
            <span className="text-sm text-neutral-500">
              complete · <span className="font-bold text-ok-fg">{proj.done}</span> done · <span className="font-bold text-warn-fg">{proj.active}</span> active · <span className="font-bold text-bad-fg">{proj.blocked}</span> blocked
            </span>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-neutral-950">{deadline}d</span>
              <span className="text-sm text-neutral-500">left</span>
              {trend && <span className={`text-xs font-bold ${trendDirection === "down" ? "text-bad-fg" : "text-ok-fg"}`}>{trend}</span>}
            </div>
            {estCompletion && <div className="text-xs text-neutral-500">est. completion <span className="font-semibold text-neutral-700">{estCompletion}</span></div>}
          </div>
        </div>
        {/* Segmented progress bar */}
        <div className="flex gap-[2px] h-2 rounded mt-2 overflow-hidden">
          {proj.done > 0 && <div className="bg-ok-solid" style={{ flex: proj.done }} />}
          {proj.active > 0 && <div className="bg-warn-solid" style={{ flex: proj.active }} />}
          {proj.blocked > 0 && <div className="bg-bad-solid" style={{ flex: proj.blocked }} />}
        </div>
      </div>

      <div className="h-px bg-neutral-100" />

      {/* Row 3: Today summary */}
      <div className="px-5 py-1.5 bg-neutral-50 flex items-center gap-2 text-xs flex-wrap">
        <span className="font-bold text-neutral-700">Today</span>
        {todayDone > 0 && <><span className="text-neutral-300">·</span><span className="text-neutral-500"><span className="font-bold text-ok-fg">+{todayDone}</span> task done</span></>}
        {todayBlockers > 0 && <><span className="text-neutral-300">·</span><span className="text-neutral-500"><span className="font-bold text-warn-fg">{todayBlockers} new blockers</span>{todayBlockerStage ? ` on ${todayBlockerStage}` : ""}</span></>}
        {lastUpdated && <><span className="text-neutral-300">·</span><span className="text-neutral-400">Last updated {lastUpdated}</span></>}
        {!todayDone && !todayBlockers && !lastUpdated && <span className="text-neutral-400">No updates yet</span>}
      </div>

      <div className="h-px bg-neutral-100" />

      {/* Row 4: Stage pipeline (from API) */}
      {stages.length > 0 && (
        <div className="px-5 py-2.5 flex items-center gap-1.5">
          {stages.map((s: any, i: number) => {
            const status = s.status || (s.done >= s.total ? "done" : s.blocked > 0 ? "blocked" : s.done > 0 ? "active" : "todo");
            const cfg = STAGE_CFG[status] || STAGE_CFG.todo;
            const SIcon = cfg.Icon;
            const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
            return (
              <React.Fragment key={s.stage || s.name || i}>
                {i > 0 && <span className="text-lg text-neutral-300 shrink-0">›</span>}
                <div className={`flex-1 ${cfg.cardBg} border ${cfg.cardBorder} rounded-lg p-2.5 min-w-0`}>
                  <div className="flex items-center gap-1.5">
                    <SIcon className={`w-3.5 h-3.5 ${cfg.titleColor}`} />
                    <span className={`text-sm font-bold ${cfg.titleColor}`}>{s.stage || s.name}</span>
                  </div>
                  <div className={`text-xs font-medium mt-0.5 ${cfg.metaColor}`}>
                    {s.done} / {s.total}{s.blocked ? ` · ${s.blocked} blocked` : ""}
                  </div>
                  <div className={`h-1 ${cfg.barBg} rounded-full mt-1.5 overflow-hidden`}>
                    <div className={`h-full ${cfg.barFill} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  {s.est && <div className={`text-2xs mt-1 ${cfg.metaColor}`}>{s.est}</div>}
                </div>
              </React.Fragment>
            );
          })}
          {pace > 0 && (
            <>
              <div className="w-px h-14 bg-neutral-100 mx-1 shrink-0" />
              <div className="shrink-0 pl-2">
                <div className="text-xs font-medium text-neutral-500">Required pace</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-neutral-950">{pace}</span>
                  <span className="text-xs text-neutral-500">tasks/day</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Row 5: AI insights footer (only if API returned data) */}
      {(nextAction || topRiskText || aiSuggestion) && (
        <>
          <div className="h-px bg-neutral-100" />
          <div className="px-5 py-2.5 flex items-stretch divide-x divide-[#e2e8f0]">
            {nextAction && (
              <div className="flex-1 pr-3">
                <div className="flex items-center gap-1.5">
                  <div className="bg-[#6366F1] rounded text-white text-[7px] font-bold w-3.5 h-3.5 flex items-center justify-center">AI</div>
                  <span className="text-xs font-bold text-[#4F46E5]">Next action</span>
                </div>
                <div className="text-xs text-neutral-700 mt-0.5">{nextAction}</div>
              </div>
            )}
            {topRiskText && (
              <div className="flex-1 px-3">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="text-xs font-bold text-neutral-500">Top risk</span>
                </div>
                <div className="text-xs text-neutral-700 mt-0.5">{topRiskText}</div>
              </div>
            )}
            {aiSuggestion && (
              <div className="flex-1 pl-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
                  <span className="text-xs font-bold text-[#4F46E5]">AI suggestion</span>
                </div>
                <div className="text-xs text-neutral-700 mt-0.5">{aiSuggestion}</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
