"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePMStore } from "@/lib/store";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Blocker {
  id: string;
  task_title?: string;
  reason: string;
  severity: "critical" | "high" | "medium";
  status: string;
  assigned_to?: string;
  assigned_to_detail?: { keycloak_id?: string; username?: string; display_name?: string };
  reported_by_detail?: { username?: string; display_name?: string };
  age_display?: string;
  escalated?: boolean;
  snooze_until?: string;
  snooze_count?: number;
  resolved_at?: string;
  created_at?: string;
  task?: string;
  project?: string;
  // Fallback compat fields
  title?: string;
  assigned_name?: string;
  days_open?: number;
  stale?: boolean;
  resolved_by?: string;
  resolved_ago?: string;
}

// Normalized accessor helpers
function blockerTitle(b: Blocker): string {
  return b.task_title || b.title || "Untitled";
}
function blockerAssignee(b: Blocker): string | undefined {
  return b.assigned_to_detail?.display_name || b.assigned_to_detail?.username || b.assigned_name;
}
function blockerAge(b: Blocker): string {
  if (b.age_display) return b.age_display;
  if (b.days_open != null) return `${b.days_open}d open`;
  return "";
}
function blockerIsStale(b: Blocker): boolean {
  if (b.stale != null) return b.stale;
  // Stale if open > 3 days and not snoozed
  if (b.created_at) {
    const age = (Date.now() - new Date(b.created_at).getTime()) / 86400000;
    return age > 3 && !b.snooze_until;
  }
  return false;
}
function blockerResolvedAgo(b: Blocker): string {
  if (b.resolved_ago) return b.resolved_ago;
  if (b.resolved_at) {
    const d = Math.round((Date.now() - new Date(b.resolved_at).getTime()) / 86400000);
    return `${d}d ago`;
  }
  return "";
}

interface Person {
  id: string;
  name: string;
  username?: string;
  display_name?: string;
  keycloak_id?: string;
}

interface Task {
  id: string;
  title: string;
}

export interface BlockersPanelProps {
  projectId: string;
  onClose?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */

const AVATAR_COLORS: Record<string, { bg: string; fg: string }> = {
  rohith: { bg: "#cecbf6", fg: "#26215c" },
  priya: { bg: "#f5c4b3", fg: "#4a1b0c" },
  arjun: { bg: "#9fe1cb", fg: "#04342c" },
};

const SEVERITY_BAR: Record<string, string> = {
  critical: "#a32d2d",
  high: "#e24b4a",
  medium: "#ef9f27",
};

const SEVERITY_CARD_BG: Record<string, string> = {
  critical: "#fcebeb",
  high: "#ffffff",
  medium: "#ffffff",
};

const SEVERITY_CARD_BORDER: Record<string, string> = {
  critical: "#f09595",
  high: "#f09595",
  medium: "#E9E5E4",
};

const SEVERITY_PILL: Record<string, { bg: string; fg: string }> = {
  critical: { bg: "#a32d2d", fg: "#ffffff" },
  high: { bg: "#fcebeb", fg: "#991B1B" },
  medium: { bg: "#f5f5f4", fg: "#525252" },
};

/* ------------------------------------------------------------------ */
/*  Fallback data                                                      */
/* ------------------------------------------------------------------ */

const FALLBACK_BLOCKERS: Blocker[] = [
  {
    id: "b1",
    title: "Phase C blocked by Phase B dependency",
    reason: "Phase B delivery slipped 4 days. Grid pack assembly cannot start until Phase B validation completes.",
    severity: "critical",
    status: "active",
    assigned_name: "rohith",
    days_open: 5,
    stale: true,
  },
  {
    id: "b2",
    title: "Deploy pipeline failing on staging",
    reason: "CI job #482 timed out on integration tests. Flaky network mock.",
    severity: "high",
    status: "active",
    assigned_name: "arjun",
    days_open: 3,
    stale: false,
  },
  {
    id: "b3",
    title: "Vendor approval pending for Phase D",
    reason: "Procurement waiting on vendor sign-off. ETA unknown.",
    severity: "medium",
    status: "active",
    assigned_name: "priya",
    days_open: 2,
    stale: false,
  },
  {
    id: "r1",
    title: "API rate limit hitting 429s",
    reason: "Resolved by adding retry backoff.",
    severity: "high",
    status: "resolved",
    assigned_name: "priya",
    resolved_by: "priya",
    resolved_ago: "2d ago",
  },
  {
    id: "r2",
    title: "SSL cert expired on staging",
    reason: "Auto-renewed via certbot.",
    severity: "medium",
    status: "resolved",
    assigned_name: "arjun",
    resolved_by: "arjun",
    resolved_ago: "3d ago",
  },
  {
    id: "r3",
    title: "Redis connection pool exhausted",
    reason: "Increased max connections to 200.",
    severity: "critical",
    status: "resolved",
    assigned_name: "rohith",
    resolved_by: "rohith",
    resolved_ago: "1d ago",
  },
  {
    id: "r4",
    title: "Figma export missing icons",
    reason: "Re-exported with correct slice settings.",
    severity: "medium",
    status: "resolved",
    assigned_name: "priya",
    resolved_by: "priya",
    resolved_ago: "4d ago",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function avatarColor(name?: string) {
  const key = (name ?? "").toLowerCase();
  return AVATAR_COLORS[key] ?? { bg: "#e5e5e5", fg: "#525252" };
}

function initial(name?: string) {
  return (name ?? "?")[0].toUpperCase();
}

/* ------------------------------------------------------------------ */
/*  BlockersPanel                                                      */
/* ------------------------------------------------------------------ */

export default function BlockersPanel({ projectId, onClose }: BlockersPanelProps) {
  const fetchBlockers = usePMStore(s => s.fetchBlockers);
  const createBlocker = usePMStore(s => s.createBlocker);
  const escalateBlocker = usePMStore(s => s.escalateBlocker);
  const snoozeBlocker = usePMStore(s => s.snoozeBlocker);
  const reassignBlocker = usePMStore(s => s.reassignBlocker);
  const resolveBlocker = usePMStore(s => s.resolveBlocker);
  const fetchTasks = usePMStore(s => s.fetchTasks);
  const fetchUsers = usePMStore(s => s.fetchUsers);
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [expandResolved, setExpandResolved] = useState(false);
  const [snoozeMenuId, setSnoozeMenuId] = useState<string | null>(null);
  const [reassignMenuId, setReassignMenuId] = useState<string | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  /* Report form state */
  const [formTask, setFormTask] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formSeverity, setFormSeverity] = useState<"critical" | "high" | "medium">("high");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data: any = await fetchBlockers(projectId);
      const list = Array.isArray(data) ? data : data?.results ?? [];
      setBlockers(list);
      setError("");
    } catch (e: any) {
      setBlockers(FALLBACK_BLOCKERS);
      setError(e.message || "Unable to load blockers");
    }
  }, [fetchBlockers, projectId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      try {
        const p: any = await fetchUsers();
        const pList = Array.isArray(p) ? p : p?.results ?? [];
        setPeople(pList.map((u: any) => ({ id: u.keycloak_id || u.id || u.username, name: u.display_name || u.username || u.name || "Unknown", username: u.username })));
      } catch (e: any) {
        setError(e.message || "Unable to load users");
      }
      try {
        const t: any = await fetchTasks(projectId);
        setTasks(Array.isArray(t) ? t : t?.results ?? []);
      } catch (e: any) {
        setError(e.message || "Unable to load tasks");
      }
    })();
  }, [fetchTasks, fetchUsers, projectId]);

  const active = blockers.filter((b) => b.status !== "resolved");
  const resolved = blockers.filter((b) => b.status === "resolved");

  /* Actions */
  const handleEscalate = async (id: string) => {
    try {
      await escalateBlocker(id);
    } catch (e: any) {
      setError(e.message || "Unable to escalate blocker");
    }
    load();
  };

  const handleSnooze = async (id: string, hours: number) => {
    setSnoozeMenuId(null);
    try {
      await snoozeBlocker(id, hours);
    } catch (e: any) {
      setError(e.message || "Unable to snooze blocker");
    }
    load();
  };

  const handleReassign = async (blockerId: string, assigneeId: string) => {
    setReassignMenuId(null);
    try {
      await reassignBlocker(blockerId, assigneeId);
    } catch (e: any) {
      setError(e.message || "Unable to reassign blocker");
    }
    load();
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveBlocker(id);
    } catch (e: any) {
      setError(e.message || "Unable to resolve blocker");
    }
    load();
  };

  const handleReport = async () => {
    if (!formReason.trim()) return;
    try {
      await createBlocker({
        project: projectId,
        task: formTask || undefined,
        reason: formReason,
        severity: formSeverity,
      });
    } catch (e: any) {
      setError(e.message || "Unable to report blocker");
    }
    setFormReason("");
    setFormTask("");
    setFormSeverity("high");
    setShowReportForm(false);
    load();
  };

  /* Close snooze/reassign on outside click */
  useEffect(() => {
    const handler = () => {
      setSnoozeMenuId(null);
      setReassignMenuId(null);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div
      className="flex flex-col bg-white rounded-xl h-full overflow-hidden"
      style={{
        width: 380,
        border: "0.5px solid #E9E5E4",
        fontFamily: "'Geist', sans-serif",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-[18px] pt-[18px] pb-[10px]">
        <div className="flex items-center gap-[8px]">
          <span className="text-[14px] font-medium text-neutral-900">
            Active blockers
          </span>
          <span
            className="text-[11px] font-medium rounded-full px-[7px] py-[1px]"
            style={{ background: "#fcebeb", color: "#501313" }}
          >
            {active.length}
          </span>
        </div>
        <div className="flex items-center gap-[8px]">
          <button
            onClick={() => setShowReportForm((v) => !v)}
            className="text-[11px] font-medium rounded-md px-[8px] py-[3px] bg-white hover:bg-neutral-50 transition-colors"
            style={{ border: "1px solid #b4b2a9", color: "#3d3d3d" }}
          >
            + report blocker
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 text-[16px] leading-none"
            >
              x
            </button>
          )}
        </div>
      </div>
      {error && (
        <div className="mx-[18px] mb-[10px] rounded-md px-3 py-2 text-[11px]" style={{ background: "#fcebeb", color: "#991B1B" }}>
          {error}
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-[18px] pb-[18px]">
        {/* Report form */}
        {showReportForm && (
          <div
            className="rounded-lg mb-[10px] p-[12px] flex flex-col gap-[8px]"
            style={{ border: "1px solid #E9E5E4", background: "#fafaf9" }}
          >
            <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
              New blocker
            </span>
            {tasks.length > 0 && (
              <select
                value={formTask}
                onChange={(e) => setFormTask(e.target.value)}
                className="text-[11px] rounded-md px-[8px] py-[5px] bg-white"
                style={{ border: "1px solid #E9E5E4" }}
              >
                <option value="">Select task (optional)</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            )}
            <textarea
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              placeholder="Describe the blocker..."
              rows={2}
              className="text-[11px] rounded-md px-[8px] py-[5px] bg-white resize-none"
              style={{ border: "1px solid #E9E5E4" }}
            />
            <div className="flex items-center gap-[10px]">
              {(["critical", "high", "medium"] as const).map((s) => (
                <label key={s} className="flex items-center gap-[4px] text-[10px] cursor-pointer">
                  <input
                    type="radio"
                    name="severity"
                    checked={formSeverity === s}
                    onChange={() => setFormSeverity(s)}
                    className="accent-neutral-700"
                  />
                  <span
                    className="rounded-full px-[6px] py-[1px] text-[10px] font-medium"
                    style={{
                      background: SEVERITY_PILL[s].bg,
                      color: SEVERITY_PILL[s].fg,
                    }}
                  >
                    {s}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex items-center gap-[6px] justify-end">
              <button
                onClick={() => setShowReportForm(false)}
                className="text-[10px] text-neutral-500 hover:text-neutral-700 px-[8px] py-[3px]"
              >
                cancel
              </button>
              <button
                onClick={handleReport}
                className="text-[10px] font-medium rounded-md px-[10px] py-[3px]"
                style={{
                  background: "#c0dd97",
                  border: "1px solid #639922",
                  color: "#173404",
                }}
              >
                submit
              </button>
            </div>
          </div>
        )}

        {/* Active blockers */}
        <div className="flex flex-col gap-[10px]">
          {active.map((b) => (
            <BlockerCard
              key={b.id}
              blocker={b}
              people={people}
              onEscalate={() => handleEscalate(b.id)}
              onSnooze={(h) => handleSnooze(b.id, h)}
              onReassign={(aid) => handleReassign(b.id, aid)}
              onResolve={() => handleResolve(b.id)}
              snoozeOpen={snoozeMenuId === b.id}
              onToggleSnooze={(e) => {
                e.stopPropagation();
                setSnoozeMenuId(snoozeMenuId === b.id ? null : b.id);
                setReassignMenuId(null);
              }}
              reassignOpen={reassignMenuId === b.id}
              onToggleReassign={(e) => {
                e.stopPropagation();
                setReassignMenuId(reassignMenuId === b.id ? null : b.id);
                setSnoozeMenuId(null);
              }}
            />
          ))}
        </div>

        {/* Resolved section */}
        {resolved.length > 0 && (
          <div className="mt-[16px]">
            <button
              onClick={() => setExpandResolved((v) => !v)}
              className="flex items-center gap-[6px] text-[12px] font-medium text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              <span
                className="text-[9px] inline-block transition-transform"
                style={{
                  transform: expandResolved ? "rotate(90deg)" : "rotate(0deg)",
                }}
              >
                {"\u25B6"}
              </span>
              Resolved this week ({resolved.length})
            </button>

            {expandResolved && (
              <div className="mt-[8px] flex flex-col gap-[4px]" style={{ opacity: 0.6 }}>
                {resolved.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-[8px] py-[5px] px-[4px]"
                  >
                    <span className="text-[12px]" style={{ color: "#639922" }}>
                      {"\u2713"}
                    </span>
                    <span className="text-[11px] text-neutral-700 flex-1 truncate">
                      {blockerTitle(b)}
                    </span>
                    <span className="text-[10px] text-neutral-400 whitespace-nowrap">
                      {blockerAssignee(b) ?? "unknown"} {"\u00B7"} {blockerResolvedAgo(b) || "recently"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  BlockerCard                                                        */
/* ------------------------------------------------------------------ */

interface BlockerCardProps {
  blocker: Blocker;
  people: Person[];
  onEscalate: () => void;
  onSnooze: (hours: number) => void;
  onReassign: (assigneeId: string) => void;
  onResolve: () => void;
  snoozeOpen: boolean;
  onToggleSnooze: (e: React.MouseEvent) => void;
  reassignOpen: boolean;
  onToggleReassign: (e: React.MouseEvent) => void;
}

function BlockerCard({
  blocker: b,
  people,
  onEscalate,
  onSnooze,
  onReassign,
  onResolve,
  snoozeOpen,
  onToggleSnooze,
  reassignOpen,
  onToggleReassign,
}: BlockerCardProps) {
  const sev = b.severity;
  const isCritical = sev === "critical";
  const isHigh = sev === "high";
  const assigneeName = blockerAssignee(b);
  const ac = avatarColor(assigneeName);

  const actionBorder = isCritical || isHigh ? "#f09595" : "#E9E5E4";

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: SEVERITY_CARD_BG[sev],
        border: `1px solid ${SEVERITY_CARD_BORDER[sev]}`,
      }}
    >
      {/* Colored top bar */}
      <div style={{ height: 3, background: SEVERITY_BAR[sev] }} />

      {/* Content */}
      <div className="px-[14px] py-[12px]">
        {/* Title row */}
        <div className="flex items-start gap-[6px]">
          <span
            className="mt-[5px] shrink-0 rounded-full"
            style={{
              width: 6,
              height: 6,
              background: SEVERITY_BAR[sev],
            }}
          />
          <span className="text-[13px] font-medium text-neutral-900 flex-1 leading-[1.35]">
            {blockerTitle(b)}
          </span>
          <span
            className="text-[10px] font-medium rounded-full px-[7px] py-[1px] shrink-0 mt-[2px]"
            style={{
              background: SEVERITY_PILL[sev].bg,
              color: SEVERITY_PILL[sev].fg,
            }}
          >
            {sev}
          </span>
        </div>

        {/* Reason */}
        <p className="text-[11px] mt-[6px] leading-[1.45]" style={{ color: "#78716c" }}>
          {b.reason}
        </p>

        {/* Divider */}
        <div className="my-[10px]" style={{ height: 0.5, background: "#E9E5E4" }} />

        {/* Meta row */}
        <div className="flex items-center gap-[6px] text-[10px]">
          <span
            className="rounded-full flex items-center justify-center shrink-0 font-medium"
            style={{
              width: 14,
              height: 14,
              fontSize: 8,
              background: ac.bg,
              color: ac.fg,
            }}
          >
            {initial(assigneeName)}
          </span>
          <span className="text-neutral-600">{assigneeName ?? "unassigned"}</span>
          {blockerAge(b) && (
            <span style={{ color: isCritical ? "#a32d2d" : "#78716c" }}>
              {"\u25CF"} {blockerAge(b)}
            </span>
          )}
          {blockerIsStale(b) && (
            <span
              className="rounded-full px-[5px] py-[0.5px] text-[9px] font-medium"
              style={{ background: "#fcebeb", color: "#a32d2d" }}
            >
              stale
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-[6px] mt-[10px]">
          {/* Escalate */}
          <button
            onClick={onEscalate}
            className="text-[10px] font-medium rounded-md px-[7px] py-[2.5px] transition-colors hover:opacity-80"
            style={{
              background: isCritical ? "#fcebeb" : "#ffffff",
              border: `1px solid ${actionBorder}`,
              color: isCritical ? "#a32d2d" : "#78716c",
            }}
          >
            {"\u2191"} escalate
          </button>

          {/* Snooze */}
          <div className="relative">
            <button
              onClick={onToggleSnooze}
              className="text-[10px] font-medium rounded-md px-[7px] py-[2.5px] transition-colors hover:opacity-80"
              style={{
                background: "#ffffff",
                border: `1px solid ${actionBorder}`,
                color: "#78716c",
              }}
            >
              snooze {"\u25BE"}
            </button>
            {snoozeOpen && (
              <div
                className="absolute top-full left-0 mt-[2px] bg-white rounded-md shadow-lg z-50 py-[2px]"
                style={{ border: "1px solid #E9E5E4", minWidth: 80 }}
                onClick={(e) => e.stopPropagation()}
              >
                {[4, 8, 24].map((h) => (
                  <button
                    key={h}
                    onClick={() => onSnooze(h)}
                    className="block w-full text-left text-[10px] px-[10px] py-[4px] hover:bg-neutral-50 text-neutral-600"
                  >
                    {h}h
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reassign */}
          <div className="relative">
            <button
              onClick={onToggleReassign}
              className="text-[10px] font-medium rounded-md px-[7px] py-[2.5px] transition-colors hover:opacity-80"
              style={{
                background: "#ffffff",
                border: `1px solid ${actionBorder}`,
                color: "#78716c",
              }}
            >
              reassign
            </button>
            {reassignOpen && (
              <div
                className="absolute top-full left-0 mt-[2px] bg-white rounded-md shadow-lg z-50 py-[2px]"
                style={{ border: "1px solid #E9E5E4", minWidth: 100 }}
                onClick={(e) => e.stopPropagation()}
              >
                {people.length > 0
                  ? people.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => onReassign(p.id)}
                        className="flex items-center gap-[5px] w-full text-left text-[10px] px-[10px] py-[4px] hover:bg-neutral-50 text-neutral-600"
                      >
                        <span
                          className="rounded-full inline-flex items-center justify-center"
                          style={{
                            width: 12,
                            height: 12,
                            fontSize: 7,
                            background: avatarColor(p.name).bg,
                            color: avatarColor(p.name).fg,
                          }}
                        >
                          {initial(p.name)}
                        </span>
                        {p.name}
                      </button>
                    ))
                  : ["rohith", "priya", "arjun"].map((name) => (
                      <button
                        key={name}
                        onClick={() => onReassign(name)}
                        className="flex items-center gap-[5px] w-full text-left text-[10px] px-[10px] py-[4px] hover:bg-neutral-50 text-neutral-600"
                      >
                        <span
                          className="rounded-full inline-flex items-center justify-center"
                          style={{
                            width: 12,
                            height: 12,
                            fontSize: 7,
                            background: avatarColor(name).bg,
                            color: avatarColor(name).fg,
                          }}
                        >
                          {initial(name)}
                        </span>
                        {name}
                      </button>
                    ))}
              </div>
            )}
          </div>

          {/* Resolve */}
          <button
            onClick={onResolve}
            className="text-[10px] font-medium rounded-md px-[7px] py-[2.5px] ml-auto transition-colors hover:opacity-80"
            style={{
              background: "#c0dd97",
              border: "1px solid #639922",
              color: "#173404",
            }}
          >
            {"\u2713"} resolve
          </button>
        </div>
      </div>
    </div>
  );
}
