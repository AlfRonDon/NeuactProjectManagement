"use client";

import React, { useState } from "react";
import {
  AlertOctagon, Clock, AtSign, Sparkles, Check, BellOff, UserPlus,
  ArrowUpRight, CheckCheck, Inbox,
} from "lucide-react";

interface Notif {
  id: string;
  cat: string;
  title: string;
  desc: string;
  project: string;
  from: string;
  time: string;
  read: boolean;
  actions: string[];
}

const FALLBACK_NOTIFS: Notif[] = [
  { id: "n1", cat: "blocker", title: "Phase C — Grid Pack blocked by Phase B", desc: "Dependency unresolved for 3 days. Phase B still in progress.", project: "CC v5", from: "System", time: "12 min ago", read: false, actions: ["escalate", "reassign"] },
  { id: "n2", cat: "blocker", title: "Deploy pipeline failing on staging", desc: "CI job #482 failed: timeout on integration tests.", project: "CC v5", from: "CI Bot", time: "34 min ago", read: false, actions: ["escalate", "snooze"] },
  { id: "n3", cat: "overdue", title: "Widget Renderer refactor overdue by 2 days", desc: "Arjun's task was due Apr 16. No status update since Apr 14.", project: "CC v5", from: "System", time: "1h ago", read: false, actions: ["reassign", "snooze"] },
  { id: "n4", cat: "overdue", title: "E2E test plan not started", desc: "Scheduled start was Apr 15. Still in backlog.", project: "CC v5", from: "System", time: "2h ago", read: true, actions: ["reassign", "escalate"] },
  { id: "n5", cat: "mention", title: "@you in PR #87 review comment", desc: "Priya asked: 'Should we use grid-template-areas or manual placement?'", project: "CC v5", from: "Priya", time: "45 min ago", read: false, actions: ["approve", "snooze"] },
  { id: "n6", cat: "mention", title: "@you tagged in sprint retro notes", desc: "Action item: investigate vLLM memory spike during batch inference.", project: "CC v5", from: "Arjun", time: "3h ago", read: true, actions: ["snooze"] },
  { id: "n7", cat: "ai", title: "Suggested: parallelize Widget + Grid tasks", desc: "AI detected no hard dependency between tasks #4 and #5. Running in parallel saves ~5 days.", project: "CC v5", from: "AI", time: "5 min ago", read: false, actions: ["approve", "snooze"] },
  { id: "n8", cat: "ai", title: "Risk alert: single-contributor bottleneck", desc: "Rohith is assigned to 67% of in-progress tasks. Consider redistributing.", project: "CC v5", from: "AI", time: "1h ago", read: false, actions: ["approve", "snooze"] },
];

const CAT_META: Record<string, { label: string; icon: React.ElementType; dot: string; text: string; border: string; bg: string }> = {
  blocker: { label: "Blocker",  icon: AlertOctagon, dot: "bg-red-500",    text: "text-red-400",    border: "border-red-500/60",    bg: "bg-red-500/10" },
  overdue: { label: "Overdue",  icon: Clock,        dot: "bg-amber-500",  text: "text-amber-400",  border: "border-amber-500/60",  bg: "bg-amber-500/10" },
  mention: { label: "Mention",  icon: AtSign,       dot: "bg-blue-500",   text: "text-blue-400",   border: "border-blue-500/40",   bg: "bg-blue-500/8" },
  ai:      { label: "AI",       icon: Sparkles,     dot: "bg-purple-500", text: "text-purple-400", border: "border-purple-500/40", bg: "bg-purple-500/8" },
};

const ACTION_META: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  approve:  { label: "Approve",  icon: Check,        cls: "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100" },
  snooze:   { label: "Snooze",   icon: BellOff,      cls: "bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100" },
  reassign: { label: "Reassign", icon: UserPlus,     cls: "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100" },
  escalate: { label: "Escalate", icon: ArrowUpRight, cls: "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100" },
};

export default function NotifPanel({ notifications }: { notifications?: Notif[] }) {
  const [cat, setCat] = useState("all");
  const [sel, setSel] = useState("n1");
  const [notifs, setNotifs] = useState(notifications ?? FALLBACK_NOTIFS);

  const markRead = (id: string) => {
    setNotifs(prev => prev.map(x => x.id === id ? { ...x, read: true } : x));
  };
  const markAllRead = () => {
    setNotifs(n => n.map(x => ({ ...x, read: true })));
  };

  const filtered = cat === "all" ? notifs : notifs.filter(n => n.cat === cat);
  const selected = notifs.find(n => n.id === sel);
  const unread = notifs.filter(n => !n.read).length;

  const cats = ["all", "blocker", "overdue", "mention", "ai"];

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-neutral-100 flex items-center gap-3 shrink-0">
        <span className="text-sm font-bold text-neutral-900">Activity</span>
        {unread > 0 && (
          <span className="text-[11px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full">{unread}</span>
        )}
        <button onClick={markAllRead}
          className="ml-auto text-[11px] text-neutral-400 hover:text-neutral-700 flex items-center gap-1 transition-colors">
          <CheckCheck className="w-3 h-3" /> All read
        </button>
      </div>

      {/* Category tabs */}
      <div className="px-3 py-1.5 border-b border-neutral-100 flex gap-1.5 shrink-0">
        {cats.map(c => {
          const meta = CAT_META[c];
          const count = c === "all" ? unread : notifs.filter(n => n.cat === c && !n.read).length;
          return (
            <button key={c} onClick={() => setCat(c)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${cat === c ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100"}`}>
              {meta ? <meta.icon className="w-3 h-3" /> : <Inbox className="w-3 h-3" />}
              {meta?.label ?? "All"}
              {count > 0 && (
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${cat === c ? "bg-white/25 text-white" : "bg-neutral-200 text-neutral-700"}`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Body: list + detail */}
      <div className="flex flex-1 overflow-hidden">
        {/* List */}
        <div className="flex-[3] overflow-y-auto border-r border-neutral-100">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <CheckCheck className="w-8 h-8 mb-2" />
              <div className="text-xs font-medium">All clear</div>
            </div>
          )}
          {filtered.map(n => {
            const meta = CAT_META[n.cat];
            if (!meta) return null;
            const NIcon = meta.icon;
            const isActive = sel === n.id;
            const accentColor = meta.dot.includes("red") ? "#ef4444" : meta.dot.includes("amber") ? "#f59e0b" : meta.dot.includes("blue") ? "#3b82f6" : "#a855f7";
            return (
              <div key={n.id}
                onClick={() => { setSel(n.id); markRead(n.id); }}
                className={`group px-3 py-2.5 border-b border-neutral-100 cursor-pointer transition-colors relative ${isActive ? "bg-neutral-50" : "hover:bg-neutral-50"}`}>
                {!n.read && <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full" style={{ backgroundColor: accentColor }} />}
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center ${meta.bg} border ${meta.border}`}>
                    <NIcon className={`w-3 h-3 ${meta.text}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <span className={`text-xs font-semibold leading-snug ${!n.read ? "text-neutral-900" : "text-neutral-500"}`}>{n.title}</span>
                      <span className="text-[11px] text-neutral-400 shrink-0">{n.time}</span>
                    </div>
                    <div className="text-[11px] text-neutral-500 line-clamp-1 mb-1">{n.desc}</div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-semibold ${meta.text}`}>{meta.label}</span>
                      <span className="text-[11px] text-neutral-400">{n.project}</span>
                      <div className="ml-auto flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {n.actions.slice(0, 2).map((a: string) => {
                          const am = ACTION_META[a];
                          if (!am) return null;
                          return (
                            <button key={a} onClick={e => { e.stopPropagation(); markRead(n.id); }}
                              className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md transition-all ${am.cls}`}>
                              {am.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail pane */}
        {selected && (() => {
          const selMeta = CAT_META[selected.cat];
          if (!selMeta) return null;
          const SelIcon = selMeta.icon;
          return (
            <div className="flex-[2] min-w-0 flex flex-col overflow-y-auto">
              <div className={`px-3 py-2.5 border-b border-neutral-100 ${selMeta.bg}`}>
                <div className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2 ${selMeta.text}`}>
                  <SelIcon className="w-3.5 h-3.5" /> {selMeta.label}
                </div>
                <div className="text-xs font-bold text-neutral-900 leading-snug">{selected.title}</div>
              </div>
              <div className="p-3 flex-1">
                <p className="text-xs text-neutral-600 leading-relaxed mb-3">{selected.desc}</p>
                <div className="text-[11px] text-neutral-400 mb-4">{selected.from} · {selected.project} · {selected.time}</div>
                <div className="space-y-2">
                  {selected.actions.map((a: string) => {
                    const am = ACTION_META[a];
                    if (!am) return null;
                    const AmIcon = am.icon;
                    return (
                      <button key={a} className={`w-full flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition-all ${am.cls}`}>
                        <AmIcon className="w-3.5 h-3.5" /> {am.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
