"use client";

import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { fetchActivities } from "@/lib/api";
const NotifPanel = lazy(() => import("@/components/widgets/NotifPanel"));

/* ── Types ────────────────────────────────────────────── */

interface ActivitiesFeedProps {
  projectId?: string;
  activeTab?: "notifications" | "activity";
  onTabChange?: (tab: "notifications" | "activity") => void;
}

type Filter = "all" | "tasks" | "status" | "comments" | "assignees";

/* ── Avatar helper ────────────────────────────────────── */

function getAvatarStyle(name: string) {
  const colors: Record<string, { bg: string; fg: string }> = {
    rohith: { bg: "#cecbf6", fg: "#26215c" },
    priya: { bg: "#f5c4b3", fg: "#4a1b0c" },
    arjun: { bg: "#9fe1cb", fg: "#04342c" },
  };
  const key = name?.toLowerCase().trim() || "";
  return colors[key] || { bg: "#E9E5E4", fg: "#3D3837" };
}

/* ── Status dot colors ────────────────────────────────── */

const STATUS_COLORS: Record<string, string> = {
  "to do": "#85b7eb",
  "to_do": "#85b7eb",
  "in progress": "#ef9f27",
  "in_progress": "#ef9f27",
  done: "#97c459",
  blocked: "#e24b4a",
};

function statusDotColor(status: string): string {
  return STATUS_COLORS[status?.toLowerCase().trim()] || "#888780";
}

/* ── Date grouping ────────────────────────────────────── */

function groupByDate(activities: any[]): { label: string; items: any[] }[] {
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const groups: Record<string, any[]> = {};
  const order: string[] = [];

  for (const a of activities) {
    const d = new Date(a.created_at);
    const ds = d.toDateString();
    let label: string;
    if (ds === todayStr) {
      const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
      label = `TODAY · ${month} ${d.getDate()}`;
    } else if (ds === yesterdayStr) {
      const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
      label = `YESTERDAY · ${month} ${d.getDate()}`;
    } else {
      const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
      label = `${month} ${d.getDate()}`;
    }
    if (!groups[label]) {
      groups[label] = [];
      order.push(label);
    }
    groups[label].push(a);
  }

  return order.map((label) => ({ label, items: groups[label] }));
}

/* ── Relative timestamp ───────────────────────────────── */

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.round((now - then) / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHrs = Math.round(diffMin / 60);
  if (diffHrs < 12) return `${diffHrs}h`;
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/* ── Filter mapping ───────────────────────────────────── */

const FILTER_TYPE_MAP: Record<Filter, string | null> = {
  all: null,
  tasks: "creation",
  status: "status_change",
  comments: "comment",
  assignees: "assignment",
};

/* ── Sub-components ───────────────────────────────────── */

function Avatar({
  name,
  size = 18,
  blocker = false,
}: {
  name: string;
  size?: number;
  blocker?: boolean;
}) {
  if (blocker) {
    return (
      <div
        className="shrink-0 flex items-center justify-center rounded-full"
        style={{
          width: size,
          height: size,
          background: "#fcebeb",
          border: "1.5px dashed #e24b4a",
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: "#e24b4a", lineHeight: 1 }}>!</span>
      </div>
    );
  }

  const style = getAvatarStyle(name);
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <div
      className="shrink-0 flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: style.bg,
        color: style.fg,
        fontSize: 9,
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      {initial}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  return (
    <span
      className="inline-block rounded-full shrink-0"
      style={{ width: 6, height: 6, background: statusDotColor(status) }}
    />
  );
}

function StatusDiff({ from, to }: { from?: string; to?: string }) {
  if (!from && !to) return null;
  return (
    <div
      className="inline-flex items-center gap-1 rounded-md mt-1"
      style={{ background: "#f1efe8", padding: "3px 8px", fontSize: 10 }}
    >
      {from && (
        <>
          <StatusDot status={from} />
          <span style={{ color: "#5f5e5a" }}>{from}</span>
        </>
      )}
      {from && to && <span style={{ color: "#888780", margin: "0 2px" }}>→</span>}
      {to && (
        <>
          <StatusDot status={to} />
          <span style={{ color: "#5f5e5a" }}>{to}</span>
        </>
      )}
    </div>
  );
}

function Blockquote({ text }: { text: string }) {
  return (
    <div className="flex mt-1" style={{ gap: 6 }}>
      <div className="shrink-0" style={{ width: 2, background: "#c8c5c1", borderRadius: 1 }} />
      <p style={{ fontSize: 11, color: "#5f5e5a", fontStyle: "italic", margin: 0 }}>{text}</p>
    </div>
  );
}

function AvatarDiff({ from, to }: { from?: string; to?: string }) {
  return (
    <div className="flex items-center gap-1 mt-1">
      {from ? <Avatar name={from} size={16} /> : (
        <div
          className="shrink-0 flex items-center justify-center rounded-full"
          style={{ width: 16, height: 16, background: "#E9E5E4", color: "#888780", fontSize: 9, fontWeight: 600 }}
        >
          ?
        </div>
      )}
      <span style={{ color: "#888780", fontSize: 10 }}>→</span>
      {to ? <Avatar name={to} size={16} /> : (
        <div
          className="shrink-0 flex items-center justify-center rounded-full"
          style={{ width: 16, height: 16, background: "#E9E5E4", color: "#888780", fontSize: 9, fontWeight: 600 }}
        >
          ?
        </div>
      )}
    </div>
  );
}

/* ── Entry renderer ───────────────────────────────────── */

function EntryRow({ a }: { a: any }) {
  const type = a.activity_type;
  const isBlocker = type === "blocker";
  const personName = a.triggered_by_detail?.display_name || a.triggered_by_detail?.username || "Someone";
  const taskName = a.task_title || a.title || "";

  /* Build the rich-text description line */
  function Description() {
    const desc = a.description || "";
    return (
      <p style={{ fontSize: 11, color: "#3D3837", margin: 0, lineHeight: 1.45 }}>
        <span style={{ fontWeight: 600 }}>{personName}</span>{" "}
        {desc ? (
          <span dangerouslySetInnerHTML={{
            __html: desc
              .replace(
                new RegExp(`(${taskName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
                '<span style="color:#0c447c;font-weight:500">$1</span>'
              ),
          }} />
        ) : (
          taskName && (
            <>
              <span style={{ color: "#5f5e5a" }}>updated </span>
              <span style={{ color: "#0c447c", fontWeight: 500 }}>{taskName}</span>
            </>
          )
        )}
      </p>
    );
  }

  /* Metadata from API */
  const meta = a.metadata || {};

  return (
    <div
      className="flex items-start"
      style={{
        padding: "8px 6px",
        gap: 10,
        background: isBlocker ? "#f1efe8" : "transparent",
        borderRadius: isBlocker ? 6 : 0,
      }}
    >
      <Avatar name={personName} blocker={isBlocker} />

      <div className="flex-1 min-w-0">
        <Description />

        {/* Status change diff */}
        {type === "status_change" && (meta.from_status || meta.to_status) && (
          <StatusDiff from={meta.from_status} to={meta.to_status} />
        )}

        {/* Blocker quote */}
        {isBlocker && meta.reason && <Blockquote text={meta.reason} />}

        {/* Comment quote */}
        {type === "comment" && meta.comment && <Blockquote text={meta.comment} />}

        {/* Assignment avatar diff */}
        {type === "assignment" && (meta.from_user || meta.to_user) && (
          <AvatarDiff from={meta.from_user} to={meta.to_user} />
        )}

        {/* Milestone due date */}
        {type === "creation" && meta.due_date && (
          <p style={{ fontSize: 10, color: "#888780", margin: "2px 0 0" }}>
            due {meta.due_date}
          </p>
        )}
      </div>

      <span className="shrink-0" style={{ fontSize: 10, color: "#888780", marginTop: 1 }}>
        {relativeTime(a.created_at)}
      </span>
    </div>
  );
}

/* ── Main component ───────────────────────────────────── */

export default function ActivitiesFeed({
  projectId,
  activeTab: activeTabProp,
  onTabChange,
}: ActivitiesFeedProps) {
  const [tab, setTab] = useState<"notifications" | "activity">(activeTabProp ?? "notifications");
  const [filter, setFilter] = useState<Filter>("all");
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* Sync controlled tab prop */
  useEffect(() => {
    if (activeTabProp !== undefined) setTab(activeTabProp);
  }, [activeTabProp]);

  /* Fetch activities on mount / when projectId changes */
  useEffect(() => {
    setLoading(true);
    fetchActivities(projectId)
      .then((data: any) => {
        setActivities(Array.isArray(data) ? data : data?.results ?? []);
        setLoading(false);
      })
      .catch(() => {
        setActivities([]);
        setLoading(false);
      });
  }, [projectId]);

  /* Filter */
  const filtered = useMemo(() => {
    const typeKey = FILTER_TYPE_MAP[filter];
    if (!typeKey) return activities;
    return activities.filter((a: any) => a.activity_type === typeKey);
  }, [activities, filter]);

  /* Group */
  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  /* Tab switch handler */
  function handleTabChange(t: "notifications" | "activity") {
    setTab(t);
    onTabChange?.(t);
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "all" },
    { key: "tasks", label: "tasks" },
    { key: "status", label: "status" },
    { key: "comments", label: "comments" },
    { key: "assignees", label: "assignees" },
  ];

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: "#ffffff",
        borderRadius: 12,
        border: "0.5px solid #E9E5E4",
        padding: 14,
        fontFamily: "'Geist', sans-serif",
      }}
    >
      {/* ── Tabs ──────────────────────────────────────── */}
      <div className="flex items-center" style={{ gap: 16, marginBottom: 10 }}>
        <button
          onClick={() => handleTabChange("notifications")}
          className="flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
          style={{
            fontSize: 12,
            fontWeight: tab === "notifications" ? 500 : 400,
            color: tab === "notifications" ? "#2c2c2a" : "#888780",
            textDecoration: "none",
            fontFamily: "inherit",
          }}
        >
          notifications
          <span
            className="inline-flex items-center justify-center rounded-full"
            style={{
              fontSize: 9,
              fontWeight: 600,
              lineHeight: 1,
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              background: "#e24b4a",
              color: "#fff",
            }}
          >
            3
          </span>
        </button>
        <button
          onClick={() => handleTabChange("activity")}
          className="bg-transparent border-0 cursor-pointer p-0"
          style={{
            fontSize: 12,
            fontWeight: tab === "activity" ? 500 : 400,
            color: tab === "activity" ? "#2c2c2a" : "#888780",
            textDecoration: "none",
            fontFamily: "inherit",
          }}
        >
          activity
        </button>
      </div>

      {/* ── Divider ───────────────────────────────────── */}
      <div style={{ height: 0.5, background: "#E9E5E4", marginBottom: 10 }} />

      {tab === "notifications" ? (
        <div className="flex-1 overflow-hidden min-h-0">
          <Suspense fallback={<div className="p-4 text-xs text-neutral-400">Loading...</div>}>
            <NotifPanel />
          </Suspense>
        </div>
      ) : (
        <>
          {/* ── Filter pills ──────────────────────────── */}
          <div className="flex flex-wrap" style={{ gap: 4, marginBottom: 12 }}>
            {filters.map((f) => {
              const isActive = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className="border-0 cursor-pointer"
                  style={{
                    padding: "3px 9px",
                    borderRadius: 9999,
                    fontSize: 10,
                    fontWeight: 500,
                    fontFamily: "inherit",
                    background: isActive ? "#2c2c2a" : "#f1efe8",
                    color: isActive ? "#ffffff" : "#5f5e5a",
                    lineHeight: 1.4,
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* ── Activity entries ──────────────────────── */}
          <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: "center", fontSize: 11, color: "#888780" }}>
                Loading...
              </div>
            ) : groups.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", fontSize: 11, color: "#888780" }}>
                No activity found
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.label} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: "#888780",
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                      marginBottom: 4,
                      padding: "0 6px",
                    }}
                  >
                    {group.label}
                  </div>
                  {group.items.map((a: any) => (
                    <EntryRow key={a.id} a={a} />
                  ))}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
