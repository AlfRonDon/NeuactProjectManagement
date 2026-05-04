"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  PageShell, DEP_STATUS_PILL, DEP_STATUS_DOT, DEP_SEGMENT, DEP_SEVERITY, DEP_SIDE_BAR,
  CAL_UI, CAL_BAR_COLOR, avatarColors, FONT_SANS,
} from "@/design";
import { selectDependencyTasks, usePMStore } from "@/lib/store";

/* ── Types ──────────────────────────────────────────────── */

interface DepTask {
  id: string;
  title: string;
  status: string;
  assignee: string;
  estimatedHours: number;
  startDate: string;
  dueDate: string;
  depends: string[];
  phase: string;
  priority: string;
}

/* ── Constants ──────────────────────────────────────────── */

const F = FONT_SANS;

const STATUS_PILL = DEP_STATUS_PILL;
const STATUS_DOT_COLOR = DEP_STATUS_DOT;
const SEGMENT_COLORS = DEP_SEGMENT;
const SEVERITY_BADGE = DEP_SEVERITY;
const SIDE_BAR_COLOR = DEP_SIDE_BAR;

/* ── Helpers ────────────────────────────────────────────── */

function getInitial(name: string): string {
  return name ? name.charAt(0).toUpperCase() : "?";
}

function shortName(name: string): string {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

function computeCriticalPath(tasks: DepTask[]): string[] {
  // Find longest path through dependency chain
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const memo = new Map<string, string[]>();

  function longestPath(id: string): string[] {
    if (memo.has(id)) return memo.get(id)!;
    const task = taskMap.get(id);
    if (!task) { memo.set(id, [id]); return [id]; }

    // Find all tasks that depend on this one (downstream)
    const downstream = tasks.filter(t => t.depends.includes(id));
    if (downstream.length === 0) { memo.set(id, [id]); return [id]; }

    let best: string[] = [];
    for (const d of downstream) {
      const path = longestPath(d.id);
      if (path.length > best.length) best = path;
    }
    const result = [id, ...best];
    memo.set(id, result);
    return result;
  }

  // Start from root nodes (no dependencies)
  const roots = tasks.filter(t => t.depends.length === 0);
  let longest: string[] = [];
  for (const r of roots) {
    const path = longestPath(r.id);
    if (path.length > longest.length) longest = path;
  }
  return longest;
}

function totalHours(ids: string[], tasks: DepTask[]): number {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  return ids.reduce((s, id) => s + (taskMap.get(id)?.estimatedHours || 0), 0);
}

function workingDays(hours: number): number {
  return Math.ceil(hours / 8);
}

function addWorkingDays(from: Date, days: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d;
}

function fmtDate(d: Date): string {
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

/* ── Chip / Pill sub-components ─────────────────────────── */

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{
        fontFamily: F, fontSize: 11, fontWeight: active ? 500 : 400,
        color: active ? "#fff" : CAL_UI.textMid,
        background: active ? CAL_UI.textDark : "#fff",
        border: active ? "none" : "0.5px solid #e5e3dd",
        borderRadius: 14, padding: "5px 14px",
        cursor: "pointer", whiteSpace: "nowrap" as const,
      }}>
      {label}
    </button>
  );
}

function StatusDot({ status, size = 7 }: { status: string; size?: number }) {
  return <div style={{ width: size, height: size, borderRadius: "50%", background: STATUS_DOT_COLOR[status] || CAL_UI.textMuted, flexShrink: 0 }} />;
}

function ChainPill({ title, assignee, status, extra }: { title: string; assignee?: string; status?: string; extra?: string }) {
  const s = status || "todo";
  return (
    <div style={{
      display: "flex", gap: 6, alignItems: "center",
      background: s === "blocked" ? CAL_UI.blockedBg : CAL_UI.panelBg,
      borderRadius: 6, padding: "5px 9px",
    }}>
      <StatusDot status={s} size={6} />
      <span style={{ fontFamily: F, fontWeight: 500, fontSize: 12, color: s === "blocked" ? CAL_UI.blockedText : CAL_UI.textDark, whiteSpace: "nowrap" as const }}>{title}</span>
      {(assignee || extra) && (
        <span style={{ fontFamily: F, fontWeight: 400, fontSize: 11, color: CAL_UI.textMuted, whiteSpace: "nowrap" as const }}>
          {assignee ? `${shortName(assignee)}` : ""}{extra ? ` · ${extra}` : ""}
        </span>
      )}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────── */

export default function DependenciesPage() {
  const tasks = usePMStore(selectDependencyTasks);
  const tasksStatus = usePMStore(s => s.tasksStatus);
  const fetchTasks = usePMStore(s => s.fetchTasks);
  const [graphFilter, setGraphFilter] = useState("all");
  const [listFilter, setListFilter] = useState("all");

  useEffect(() => {
    if (tasksStatus === "idle") fetchTasks().catch(() => {});
  }, [fetchTasks, tasksStatus]);

  const taskMap = useMemo(() => new Map(tasks.map(t => [t.id, t])), [tasks]);

  // Critical path
  const criticalPath = useMemo(() => computeCriticalPath(tasks), [tasks]);
  const criticalSet = useMemo(() => new Set(criticalPath), [criticalPath]);
  const criticalTasks = useMemo(() => criticalPath.map(id => taskMap.get(id)).filter(Boolean) as DepTask[], [criticalPath, taskMap]);
  const critTotalHours = totalHours(criticalPath, tasks);
  const critDoneHours = criticalTasks.filter(t => t.status === "done").reduce((s, t) => s + t.estimatedHours, 0);
  const critRemainingHours = critTotalHours - critDoneHours;
  const critWorkDays = workingDays(critTotalHours);
  const critRemaining = criticalTasks.filter(t => t.status !== "done").length;
  const critFinishDate = addWorkingDays(new Date(), workingDays(critRemainingHours));
  const todayPct = critTotalHours > 0 ? Math.round((critDoneHours / critTotalHours) * 100) : 0;

  // Insight cards
  const insights = useMemo(() => {
    // Biggest unblock: task with most downstream dependents
    let biggestUnblock = { title: "—", desc: "", sideColor: CAL_BAR_COLOR.in_progress };
    let maxDown = 0;
    tasks.forEach(t => {
      if (t.status === "done") return;
      const downstream = tasks.filter(d => d.depends.includes(t.id));
      if (downstream.length > maxDown) {
        maxDown = downstream.length;
        biggestUnblock = {
          title: t.title,
          desc: `Frees ${downstream.map(d => d.title.split(" ")[0]).slice(0, 1).join(", ")} + ${Math.max(0, downstream.length - 1)} downstream task${downstream.length > 1 ? "s" : ""}`,
          sideColor: CAL_BAR_COLOR.in_progress,
        };
      }
    });

    // Long pole: task with most hours on critical path
    let longPole = { title: "—", hours: 0, desc: "", sideColor: CAL_UI.criticalAccent };
    criticalTasks.forEach(t => {
      if (t.estimatedHours > longPole.hours) {
        longPole = {
          title: `${t.title} · ${t.estimatedHours}h`,
          hours: t.estimatedHours,
          desc: "Sets the deadline. Can't shrink it.",
          sideColor: CAL_UI.criticalAccent,
        };
      }
    });

    // Slack available: non-critical task with most slack
    let slackTask = { title: "—", desc: "", sideColor: "#97c459" };
    tasks.filter(t => !criticalSet.has(t.id) && t.status !== "done").forEach(t => {
      slackTask = {
        title: `${t.title} · ${t.estimatedHours}h`,
        desc: "Can slip 1 day without ripple.",
        sideColor: "#97c459",
      };
    });

    return { biggestUnblock, longPole, slackTask };
  }, [tasks, criticalTasks, criticalSet]);

  // Dependency rows: tasks that are blocked or waiting on upstream
  const depRows = useMemo(() => {
    const rows = tasks
      .filter(t => t.depends.length > 0 && t.status !== "done")
      .map(t => {
        const upstreamTasks = t.depends.map(id => taskMap.get(id)).filter(Boolean) as DepTask[];
        const blockedUpstream = upstreamTasks.filter(u => u.status !== "done");
        const downstream = tasks.filter(d => d.depends.includes(t.id));
        const isCritical = criticalSet.has(t.id);
        const isBlocked = blockedUpstream.length > 0;
        const daysOpen = t.startDate ? Math.max(0, Math.ceil((Date.now() - new Date(t.startDate).getTime()) / 86400000)) : 0;

        // Compute severity
        let severity = t.priority;
        if (isCritical && isBlocked) severity = "critical";
        else if (isBlocked && downstream.length >= 2) severity = "high";

        // Compute status text
        let statusText = "just freed";
        let statusBg = "#eaf3de";
        let statusTextColor = "#173404";
        if (isBlocked && daysOpen > 0) {
          statusText = `● ${daysOpen}d open`;
          statusBg = CAL_UI.blockedBg;
          statusTextColor = CAL_UI.criticalAccent;
        } else if (isBlocked) {
          statusText = "1d wait";
          statusBg = "transparent";
          statusTextColor = "#412402";
        }

        // Est unblock date
        const estUnblock = blockedUpstream.length > 0
          ? fmtDate(addWorkingDays(new Date(), Math.max(1, ...blockedUpstream.map(u => workingDays(u.estimatedHours)))))
          : "now";

        return {
          id: t.id, title: t.title, status: t.status, assignee: t.assignee,
          severity, isCritical, isBlocked,
          upstreamTasks, downstream,
          statusText, statusBg, statusTextColor,
          daysOpen, estUnblock,
          impact: downstream.length * 10 + (isCritical ? 100 : 0) + (isBlocked ? 50 : 0),
        };
      })
      .sort((a, b) => b.impact - a.impact);

    // Apply list filter
    if (listFilter === "critical") return rows.filter(r => r.isCritical);
    return rows;
  }, [tasks, taskMap, criticalSet, listFilter]);

  // Graph: build layered layout from tasks
  const graphNodes = useMemo(() => {
    let filtered = tasks;
    if (graphFilter === "critical") filtered = tasks.filter(t => criticalSet.has(t.id));
    else if (graphFilter === "blocked") filtered = tasks.filter(t => t.status === "blocked" || t.depends.some(d => taskMap.get(d)?.status !== "done"));

    // Topological sort into layers
    const ids = new Set(filtered.map(t => t.id));
    const inDeg = new Map<string, number>();
    filtered.forEach(t => inDeg.set(t.id, t.depends.filter(d => ids.has(d)).length));

    const layers: DepTask[][] = [];
    const visited = new Set<string>();
    let queue = filtered.filter(t => (inDeg.get(t.id) || 0) === 0);

    while (queue.length > 0) {
      layers.push([...queue]);
      queue.forEach(t => visited.add(t.id));
      const next: DepTask[] = [];
      queue.forEach(t => {
        filtered.filter(d => d.depends.includes(t.id) && !visited.has(d.id)).forEach(d => {
          const newDeg = (inDeg.get(d.id) || 1) - 1;
          inDeg.set(d.id, newDeg);
          if (newDeg === 0) next.push(d);
        });
      });
      queue = next;
    }
    // Add remaining (cycles)
    filtered.filter(t => !visited.has(t.id)).forEach(t => { layers.push([t]); visited.add(t.id); });

    return layers;
  }, [tasks, graphFilter, criticalSet, taskMap]);

  // Stats
  const tasksWaiting = tasks.filter(t => t.depends.length > 0 && t.status !== "done" && t.depends.some(d => taskMap.get(d)?.status !== "done")).length;
  const personDaysLost = Math.round(tasks.filter(t => t.status === "blocked").reduce((s, t) => s + t.estimatedHours, 0) / 8);
  const critBottleneck = tasks.filter(t => criticalSet.has(t.id) && t.status === "blocked");

  const [showAll, setShowAll] = useState(false);
  const visibleRows = showAll ? depRows : depRows.slice(0, 3);
  const hiddenCount = depRows.length - 3;

  return (
    <PageShell title="Dependencies" contentMode="scroll">
      {/* ── Critical Path Banner ── */}
      <div style={{
        background: CAL_UI.blockedBg, border: "0.5px solid #f09595", borderRadius: 12,
        padding: "22px 28px", display: "flex", flexDirection: "column", gap: 14,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontFamily: F, fontWeight: 500, fontSize: 11, color: CAL_UI.blockedDark }}>CRITICAL PATH</span>
          <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
            <span style={{ fontFamily: F, fontWeight: 500, fontSize: 18, color: CAL_UI.blockedText }}>
              {critTotalHours}h · {critWorkDays} working days
            </span>
            <span style={{ fontFamily: F, fontWeight: 400, fontSize: 13, color: CAL_UI.blockedDark }}>
              · finishes {fmtDate(critFinishDate)} · {critRemaining} of {criticalPath.length} tasks remaining
            </span>
          </div>
        </div>

        {/* Segmented bar */}
        <div style={{ display: "flex", height: 36, borderRadius: 6, overflow: "hidden", position: "relative" }}>
          {criticalTasks.map((t, i) => {
            const seg = SEGMENT_COLORS[t.status] || SEGMENT_COLORS.todo;
            return (
              <div key={t.id} style={{
                flex: Math.max(t.estimatedHours, 1), minWidth: 1,
                background: seg.bg, display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 4px",
              }}>
                <span style={{ fontFamily: F, fontWeight: 500, fontSize: 11, color: seg.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {t.title.split(" ").slice(0, 2).join(" ")} · {t.estimatedHours}h
                </span>
              </div>
            );
          })}
          {/* Today marker */}
          {critTotalHours > 0 && (
            <div style={{ position: "absolute", left: `${todayPct}%`, top: 0, width: 2, height: 36, background: CAL_UI.criticalAccent }} />
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F, fontWeight: 500, fontSize: 11 }}>
          <span style={{ color: CAL_UI.blockedDark }}>● {critDoneHours}h done</span>
          <span style={{ color: CAL_UI.criticalAccent }}>↑ today · {new Date().toLocaleDateString("en", { month: "short", day: "numeric" }).toLowerCase()}</span>
          <span style={{ color: CAL_UI.blockedDark }}>{critRemainingHours}h remaining ●</span>
        </div>
      </div>

      {/* ── Insight Cards ── */}
      <div style={{ display: "flex", gap: 14 }}>
        {[
          { label: "BIGGEST UNBLOCK", title: insights.biggestUnblock.title, desc: insights.biggestUnblock.desc, color: insights.biggestUnblock.sideColor },
          { label: "LONG POLE", title: insights.longPole.title, desc: insights.longPole.desc, color: insights.longPole.sideColor },
          { label: "SLACK AVAILABLE", title: insights.slackTask.title, desc: insights.slackTask.desc, color: insights.slackTask.sideColor },
        ].map((card, i) => (
          <div key={i} style={{ flex: 1, background: CAL_UI.panelBg, borderRadius: 8, display: "flex", overflow: "hidden" }}>
            <div style={{ width: 3, background: card.color, flexShrink: 0 }} />
            <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: F, fontWeight: 500, fontSize: 11, color: CAL_UI.textMuted }}>{card.label}</span>
              <span style={{ fontFamily: F, fontWeight: 500, fontSize: 14, color: CAL_UI.textDark }}>{card.title}</span>
              <span style={{ fontFamily: F, fontWeight: 400, fontSize: 12, color: CAL_UI.textMid }}>{card.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Dependency Graph ── */}
      <div style={{
        background: "#fff", border: "0.5px solid #e5e3dd", borderRadius: 12,
        padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14,
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: F, fontWeight: 500, fontSize: 11, color: CAL_UI.textMuted }}>DEPENDENCY GRAPH</span>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { key: "all", label: "All paths" },
              { key: "critical", label: "Critical only" },
              { key: "blocked", label: "Blocked" },
            ].map(f => (
              <FilterChip key={f.key} label={f.label} active={graphFilter === f.key} onClick={() => setGraphFilter(f.key)} />
            ))}
          </div>
        </div>

        {/* Graph area */}
        <div style={{ position: "relative", minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center", gap: 24, padding: "20px 0", overflowX: "auto" }}>
          {graphNodes.map((layer, li) => (
            <React.Fragment key={li}>
              {li > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
                  {layer.map((_, ni) => (
                    <svg key={ni} width="50" height="2" style={{ flexShrink: 0 }}>
                      <line x1="0" y1="1" x2="43" y2="1" stroke={criticalSet.has(layer[ni]?.id) && li > 0 && criticalSet.has(graphNodes[li - 1]?.[0]?.id) ? CAL_UI.criticalAccent : CAL_UI.textMuted} strokeWidth={criticalSet.has(layer[ni]?.id) ? 2 : 1} />
                      <polygon points="43,1 38,4 38,-2" fill={criticalSet.has(layer[ni]?.id) ? CAL_UI.criticalAccent : CAL_UI.textMuted} />
                    </svg>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {layer.map(t => {
                  const pill = STATUS_PILL[t.status] || STATUS_PILL.todo;
                  const isCrit = criticalSet.has(t.id);
                  return (
                    <div key={t.id} style={{ position: "relative" }}>
                      {isCrit && (
                        <div style={{
                          position: "absolute", inset: -3,
                          border: "1.5px solid #a32d2d", borderRadius: 11,
                        }} />
                      )}
                      <div style={{
                        width: 180, padding: "14px 16px",
                        background: pill.bg, border: `0.5px solid ${pill.border}`, borderRadius: 8,
                        display: "flex", flexDirection: "column", gap: 6, position: "relative",
                      }}>
                        <span style={{ fontFamily: F, fontWeight: 500, fontSize: 14, color: pill.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {t.title}
                        </span>
                        <span style={{ fontFamily: F, fontWeight: 400, fontSize: 12, color: pill.text }}>
                          {t.estimatedHours}h · {shortName(t.assignee)} · {pill.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </React.Fragment>
          ))}
          {graphNodes.length === 0 && (
            <span style={{ fontFamily: F, fontSize: 13, color: CAL_UI.textMuted }}>No dependency data</span>
          )}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 22, alignItems: "center", padding: "4px 0" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 20, height: 2, background: CAL_UI.criticalAccent }} />
            <span style={{ fontFamily: F, fontWeight: 400, fontSize: 11, color: CAL_UI.textMid }}>critical path · {critTotalHours}h</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 20, height: 0, borderTop: "1px dashed #888780" }} />
            <span style={{ fontFamily: F, fontWeight: 400, fontSize: 11, color: CAL_UI.textMid }}>parallel · has slack</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 12, height: 12, border: "1.5px solid #a32d2d", borderRadius: 3 }} />
            <span style={{ fontFamily: F, fontWeight: 400, fontSize: 11, color: CAL_UI.textMid }}>on critical chain</span>
          </div>
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: F, fontWeight: 400, fontSize: 11, color: CAL_UI.textMuted }}>node fill = status · pill = task</span>
        </div>

        {/* Critical chain summary */}
        {criticalPath.length > 0 && (
          <div style={{
            background: CAL_UI.panelBg, borderRadius: 8, padding: "12px 14px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontFamily: F, fontWeight: 500, fontSize: 12, color: CAL_UI.textDark }}>
              Critical chain · {criticalTasks.filter(t => t.status !== "done").length + criticalTasks.filter(t => t.status === "done").length} of {tasks.length} tasks · {critTotalHours}h end-to-end
            </span>
            <span style={{ fontFamily: F, fontWeight: 400, fontSize: 11, color: CAL_UI.textMid }}>
              {criticalTasks.map(t => t.title.split(" ").slice(0, 2).join(" ")).join(" → ")}
            </span>
          </div>
        )}
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ flex: 1, background: CAL_UI.panelBg, borderRadius: 8, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontFamily: F, fontWeight: 500, fontSize: 24, color: CAL_UI.textDark }}>{tasksWaiting}</span>
          <span style={{ fontFamily: F, fontWeight: 400, fontSize: 12, color: CAL_UI.textMid }}>tasks waiting</span>
        </div>
        <div style={{ flex: 1, background: CAL_UI.panelBg, borderRadius: 8, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontFamily: F, fontWeight: 500, fontSize: 24, color: CAL_UI.textDark }}>{personDaysLost}d</span>
          <span style={{ fontFamily: F, fontWeight: 400, fontSize: 12, color: CAL_UI.textMid }}>person-days lost</span>
        </div>
        <div style={{
          flex: 1, borderRadius: 8, padding: "14px 16px",
          display: "flex", flexDirection: "column", gap: 4,
          background: critBottleneck.length > 0 ? CAL_UI.blockedBg : CAL_UI.panelBg,
          border: critBottleneck.length > 0 ? "0.5px solid #f09595" : "none",
        }}>
          <span style={{ fontFamily: F, fontWeight: 500, fontSize: 24, color: critBottleneck.length > 0 ? CAL_UI.blockedText : CAL_UI.textDark }}>
            {critBottleneck.length}
          </span>
          <span style={{ fontFamily: F, fontWeight: 400, fontSize: 12, color: critBottleneck.length > 0 ? CAL_UI.blockedDark : CAL_UI.textMid }}>
            critical bottleneck{critBottleneck.length !== 1 ? "s" : ""}
          </span>
          {critBottleneck.length > 0 && (
            <span style={{ fontFamily: F, fontWeight: 400, fontSize: 11, color: CAL_UI.blockedDark }}>
              {critBottleneck[0].title}
            </span>
          )}
        </div>
      </div>

      {/* ── List Filter Chips ── */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {[
          { key: "all", label: "All" },
          { key: "critical", label: "Critical" },
        ].map(f => (
          <FilterChip key={f.key} label={f.label} active={listFilter === f.key} onClick={() => setListFilter(f.key)} />
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: F, fontWeight: 400, fontSize: 11, color: CAL_UI.textMuted }}>sorted by impact</span>
      </div>

      {/* ── Dependency Rows ── */}
      {visibleRows.map(row => {
        const sev = SEVERITY_BADGE[row.severity] || SEVERITY_BADGE.low;
        const sideColor = SIDE_BAR_COLOR[row.severity] || CAL_UI.textMuted;

        return (
          <div key={row.id} style={{
            background: row.severity === "critical" ? CAL_UI.blockedBg : "#fff",
            border: `0.5px solid ${row.severity === "critical" ? CAL_UI.blockedBorder : CAL_UI.border}`,
            borderRadius: 8, display: "flex", overflow: "hidden",
          }}>
            <div style={{ width: 4, background: sideColor, flexShrink: 0 }} />
            <div style={{ flex: 1, padding: "14px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Title row */}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
                  <StatusDot status={row.isBlocked ? "blocked" : row.status} />
                  <span style={{ fontFamily: F, fontWeight: 500, fontSize: 13, color: row.severity === "critical" ? CAL_UI.blockedText : CAL_UI.textDark }}>{row.title}</span>
                  <span style={{ fontFamily: F, fontWeight: 400, fontSize: 11, color: CAL_UI.textMuted }}>· {row.isBlocked ? "blocked" : row.status}</span>
                </div>
                <div style={{
                  background: sev.bg, color: sev.text,
                  fontFamily: F, fontWeight: 500, fontSize: 11,
                  padding: "2px 8px", borderRadius: 10,
                }}>
                  {row.severity}
                </div>
                <div style={{
                  background: row.statusBg,
                  border: row.severity === "critical" ? "0.5px solid #f09595" : "none",
                  color: row.statusTextColor,
                  fontFamily: F, fontWeight: 500, fontSize: 11,
                  padding: "2px 8px", borderRadius: 10,
                }}>
                  {row.statusText}
                </div>
              </div>

              {/* Chain visualization */}
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <ChainPill title={row.title} status={row.isBlocked ? "blocked" : row.status} />
                {row.upstreamTasks.map((u, i) => (
                  <React.Fragment key={u.id}>
                    <span style={{ fontFamily: F, fontWeight: 400, fontSize: 13, color: CAL_UI.textMuted }}>←</span>
                    <ChainPill
                      title={u.title}
                      assignee={u.assignee}
                      status={u.status}
                      extra={u.status === "done" ? undefined : `${Math.round((u.estimatedHours > 0 ? (u.estimatedHours - (u.status === "done" ? u.estimatedHours : 0)) / u.estimatedHours : 0) * 100)}%`}
                    />
                  </React.Fragment>
                ))}
              </div>

              {/* Footer */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 2 }}>
                <span style={{ fontFamily: F, fontWeight: 400, fontSize: 11, color: CAL_UI.textMid }}>
                  {row.downstream.length} downstream{row.downstream.length !== 1 ? "" : ""} · est unblock {row.estUnblock}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{
                    fontFamily: F, fontWeight: 400, fontSize: 11, color: CAL_UI.textMid,
                    background: "#fff", border: "0.5px solid #e5e3dd", borderRadius: 6,
                    padding: "5px 12px", cursor: "pointer",
                  }}>
                    {row.severity === "critical" ? "nudge owner" : row.isBlocked ? "nudge" : "watch"}
                  </button>
                  {row.severity === "critical" && (
                    <button style={{
                      fontFamily: F, fontWeight: 400, fontSize: 11, color: "#fff",
                      background: CAL_UI.criticalAccent, border: "none", borderRadius: 6,
                      padding: "5px 12px", cursor: "pointer",
                    }}>
                      escalate
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Show more */}
      {!showAll && hiddenCount > 0 && (
        <div style={{ textAlign: "center", padding: "6px 0" }}>
          <button onClick={() => setShowAll(true)} style={{
            fontFamily: F, fontWeight: 400, fontSize: 11, color: "#0c447c",
            background: "none", border: "none", cursor: "pointer",
          }}>
            + {hiddenCount} more · show all
          </button>
        </div>
      )}
    </PageShell>
  );
}
