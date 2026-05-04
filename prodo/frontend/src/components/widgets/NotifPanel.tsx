"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchMorningBrief } from "@/lib/api";
import { selectDashboardNotifications, usePMStore } from "@/lib/store";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Notif {
  id: string;
  cat: "blocker" | "overdue" | "mention" | "ai";
  title: string;
  desc: string;
  project: string;
  from: string;
  time: string;
  read: boolean;
  actions: string[];
  relatedId?: string | null;
}

type CatKey = Notif["cat"];

/* ------------------------------------------------------------------ */
/*  Fallback data (used when backend is unreachable)                   */
/* ------------------------------------------------------------------ */

const FALLBACK: Notif[] = [
  { id: "n1", cat: "blocker", title: "Phase C — Grid Pack blocked by Phase B", desc: "Dependency unresolved for 3 days. Phase B still in progress.", project: "CC v5", from: "System", time: "12 min ago", read: false, actions: ["Escalate", "Reassign"] },
  { id: "n2", cat: "blocker", title: "Deploy pipeline failing on staging", desc: "CI job #482 failed: timeout on integration tests.", project: "CC v5", from: "CI Bot", time: "34 min ago", read: false, actions: ["Escalate", "Snooze"] },
  { id: "n3", cat: "overdue", title: "Widget Renderer refactor overdue by 2 days", desc: "Arjun's task was due Apr 16. No status update since Apr 14.", project: "CC v5", from: "System", time: "1h ago", read: false, actions: ["Reassign", "Snooze"] },
  { id: "n4", cat: "overdue", title: "E2E test plan not started", desc: "Scheduled start was Apr 15. Still in backlog.", project: "CC v5", from: "System", time: "2h ago", read: true, actions: ["Reassign", "Escalate"] },
  { id: "n5", cat: "mention", title: "@you in PR #87 review comment", desc: "Priya asked: 'Should we use grid-template-areas or manual placement?'", project: "CC v5", from: "Priya", time: "45 min ago", read: false, actions: ["View", "Snooze"] },
  { id: "n6", cat: "mention", title: "@you tagged in sprint retro notes", desc: "Action item: investigate vLLM memory spike during batch inference.", project: "CC v5", from: "Arjun", time: "3h ago", read: true, actions: ["Snooze"] },
  { id: "n7", cat: "ai", title: "Suggested: parallelize Widget + Grid tasks", desc: "AI detected no hard dependency between tasks #4 and #5. Running in parallel saves ~5 days.", project: "CC v5", from: "AI", time: "5 min ago", read: false, actions: ["Apply", "Dismiss"] },
  { id: "n8", cat: "ai", title: "Risk alert: single-contributor bottleneck", desc: "Rohith is assigned to 67% of in-progress tasks. Consider redistributing.", project: "CC v5", from: "AI", time: "1h ago", read: false, actions: ["Apply", "Dismiss"] },
];

/* ------------------------------------------------------------------ */
/*  Category meta                                                      */
/* ------------------------------------------------------------------ */

const CAT_ORDER: CatKey[] = ["blocker", "overdue", "mention", "ai"];

const CAT_META: Record<CatKey, { label: string; plural: string; icon: string; color: string }> = {
  blocker: { label: "BLOCKERS",       plural: "blockers",   icon: "\u25CF", color: "text-bad-fg" },
  overdue: { label: "OVERDUE",        plural: "overdue",    icon: "\u25B2", color: "text-warn-fg" },
  mention: { label: "MENTIONS",       plural: "mentions",   icon: "@",      color: "text-info-fg" },
  ai:      { label: "AI SUGGESTIONS", plural: "AI suggestions", icon: "AI", color: "text-info-fg" },
};

/* ------------------------------------------------------------------ */
/*  Client-side briefing fallback                                      */
/* ------------------------------------------------------------------ */

function generateBriefingFallback(notifs: Notif[]): string {
  const counts: Record<CatKey, number> = { blocker: 0, overdue: 0, mention: 0, ai: 0 };
  notifs.filter(n => !n.read).forEach(n => { counts[n.cat]++; });

  const parts: string[] = [];
  if (counts.blocker > 0) parts.push(`${counts.blocker} blocker${counts.blocker > 1 ? "s" : ""}`);
  if (counts.overdue > 0) parts.push(`${counts.overdue} overdue`);
  if (counts.mention > 0) parts.push(`${counts.mention} mention${counts.mention > 1 ? "s" : ""}`);
  if (counts.ai > 0)      parts.push(`${counts.ai} AI suggestion${counts.ai > 1 ? "s" : ""}`);

  if (parts.length === 0) return "All clear -- no unread notifications. Great work!";

  const summary = parts.join(", ") + " waiting.";
  const blockers = notifs.filter(n => n.cat === "blocker" && !n.read);
  let tip = "";
  if (blockers.length > 0) {
    const oldest = blockers[blockers.length - 1];
    tip = ` The oldest blocker -- ${oldest.title.split(",")[0]} -- needs attention. Worth tackling first.`;
  } else {
    const overdue = notifs.filter(n => n.cat === "overdue" && !n.read);
    if (overdue.length > 0) tip = ` Start with the overdue items to unblock downstream work.`;
  }
  return summary + tip;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ConvItem({ n, onAction }: { n: Notif; onAction: (notif: Notif, action: string) => void }) {
  const meta = CAT_META[n.cat];
  const [busy, setBusy] = useState<string | null>(null);

  const handleClick = async (action: string) => {
    setBusy(action);
    await onAction(n, action);
    setBusy(null);
  };

  return (
    <div className={`px-2 py-1 ${n.read ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className={`text-xs font-bold ${meta.color}`}>{meta.icon}</span>
        <span className="text-xs text-neutral-500">
          {n.from} &middot; {n.time}
        </span>
      </div>
      <p className="text-md text-neutral-800 leading-snug mb-1">{n.desc}</p>
      {n.actions.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {n.actions.map(a => (
            <button
              key={a}
              onClick={() => handleClick(a)}
              disabled={busy !== null}
              className="text-xs font-medium text-neutral-600 border border-neutral-300 rounded-full px-2 py-0 hover:bg-neutral-100 transition-colors disabled:opacity-50"
            >
              {busy === a ? "..." : a}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function NotifPanel() {
  const router = useRouter();
  const storeNotifs = usePMStore(selectDashboardNotifications);
  const notificationsStatus = usePMStore(s => s.notificationsStatus);
  const fetchNotifications = usePMStore(s => s.fetchNotifications);
  const markNotificationRead = usePMStore(s => s.markNotificationRead);
  const markAllNotificationsRead = usePMStore(s => s.markAllNotificationsRead);
  const escalateBlocker = usePMStore(s => s.escalateBlocker);
  const snoozeBlocker = usePMStore(s => s.snoozeBlocker);
  const [markingAll, setMarkingAll] = useState(false);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [briefingSeverity, setBriefingSeverity] = useState<string>("clear");
  const [error, setError] = useState("");

  const notifs = (storeNotifs.length > 0 || notificationsStatus !== "error" ? storeNotifs : FALLBACK) as Notif[];
  const loading = notificationsStatus === "idle" || notificationsStatus === "loading";

  // Fetch morning brief from API
  useEffect(() => {
    fetchMorningBrief()
      .then(data => {
        if (data?.message) {
          setBriefing(data.message);
          setBriefingSeverity(data.severity || "clear");
        }
      })
      .catch(() => { /* use client-side fallback */ });
  }, []);

  // Fetch notifications from backend
  useEffect(() => {
    if (notificationsStatus === "idle") fetchNotifications().catch((e: any) => setError(e.message));
  }, [fetchNotifications, notificationsStatus]);

  // Handle notification action buttons
  const handleAction = useCallback(async (notif: Notif, action: string) => {
    try {
      switch (action.toLowerCase()) {
        case "escalate":
          if (notif.relatedId) {
            await escalateBlocker(notif.relatedId);
          }
          await markNotificationRead(notif.id);
          break;
        case "snooze":
          if (notif.relatedId) {
            await snoozeBlocker(notif.relatedId, 24);
          }
          await markNotificationRead(notif.id);
          break;
        case "reassign":
          // Mark as read; full reassign would need a user picker
          await markNotificationRead(notif.id);
          break;
        case "view":
          // Navigate to the related task/project
          if (notif.project) {
            const slug = notif.project.toLowerCase().replace(/\s+/g, "-");
            router.push(`/project/${slug}`);
          }
          return; // Don't refresh — we're navigating away
        case "apply":
          await markNotificationRead(notif.id);
          break;
        case "dismiss":
          await markNotificationRead(notif.id);
          break;
        case "approve":
          await markNotificationRead(notif.id);
          break;
        default:
          await markNotificationRead(notif.id);
      }
      setError("");
    } catch (e: any) {
      setError(e.message || `Action ${action} failed`);
    }
  }, [escalateBlocker, markNotificationRead, router, snoozeBlocker]);

  // Group by category
  const grouped = CAT_ORDER.map(cat => ({
    cat,
    meta: CAT_META[cat],
    items: notifs.filter(n => n.cat === cat),
  })).filter(g => g.items.length > 0);

  const unreadCount = notifs.filter(n => !n.read).length;

  // Mark all read
  const handleMarkAllRead = useCallback(async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setError("");
    } catch (e: any) {
      setError(e.message || "Unable to mark notifications read");
    }
    setMarkingAll(false);
  }, [markAllNotificationsRead]);

  // Briefing text: prefer API, fall back to client-side generation
  const briefingText = briefing || generateBriefingFallback(notifs);
  const briefingColorCls = briefingSeverity === "critical" ? "text-bad-fg" : briefingSeverity === "warning" ? "text-warn-fg" : "text-neutral-600";

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
      {/* ---- Header ---- */}
      <div className="px-2 py-1 flex items-center justify-between shrink-0">
        <span className="text-sm font-serif font-semibold text-neutral-950">Activity [v2]</span>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors disabled:opacity-50"
          >
            {markingAll ? "Marking..." : "\u2713 Mark all read"}
          </button>
        )}
      </div>

      <div className="border-t border-neutral-100" />

      {/* ---- Scrollable body ---- */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="mx-2 mt-2 rounded-md px-2 py-1 text-xs bg-bad-bg text-bad-fg">
            {error}
          </div>
        )}
        {/* AI Briefing */}
        <div className="px-2 py-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-2xs font-bold text-white bg-purple-600 rounded px-1 py-0.5 leading-none">AI</span>
            <span className="text-2xs font-bold tracking-widest text-neutral-400 uppercase">Your morning brief</span>
          </div>
          <p className={`text-sm leading-snug ${briefingColorCls}`}>
            {briefingText}
          </p>
        </div>

        <div className="border-t border-neutral-100" />

        {loading && (
          <div className="px-2 py-3 text-xs text-neutral-400 text-center">Loading...</div>
        )}

        {grouped.map(({ cat, meta, items }) => (
          <div key={cat}>
            <div className="px-2 pt-1 pb-0.5">
              <span className={`text-xs font-bold tracking-wider ${meta.color}`}>
                {meta.label} &middot; {items.length}
              </span>
            </div>
            <div className="flex px-1 pb-1">
              {items.map((n, i) => (
                <React.Fragment key={n.id}>
                  {i > 0 && <div className="w-px bg-neutral-100 mx-1 self-stretch shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <ConvItem n={n} onAction={handleAction} />
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div className="border-t border-neutral-100" />
          </div>
        ))}

        {!loading && grouped.length === 0 && (
          <div className="px-2 py-6 text-center text-sm text-neutral-400">
            No notifications
          </div>
        )}
      </div>
    </div>
  );
}
