"use client";

import React, { useState } from "react";
import {
  Inbox, AlertOctagon, Clock, AtSign, Sparkles, Check, BellOff, ArrowUpRight, UserPlus,
  Filter, CheckCheck,
} from "lucide-react";

type Category = "all" | "blockers" | "overdue" | "mentions" | "ai";
type NotifAction = "approve" | "snooze" | "reassign" | "escalate";

interface Notification {
  id: string;
  category: Category;
  title: string;
  description: string;
  project: string;
  from: string;
  time: string;
  read: boolean;
  actions: NotifAction[];
}

const initialNotifications: Notification[] = [
  { id: "n1", category: "blockers", title: "Phase C - Grid Pack blocked by Phase B", description: "Dependency unresolved for 3 days. Phase B still in progress.", project: "CC v5", from: "System", time: "12 min ago", read: false, actions: ["escalate", "reassign"] },
  { id: "n2", category: "blockers", title: "Deploy pipeline failing on staging", description: "CI job #482 failed: timeout on integration tests.", project: "Data Pipeline", from: "CI Bot", time: "34 min ago", read: false, actions: ["escalate", "snooze"] },
  { id: "n3", category: "overdue", title: "Widget Renderer refactor overdue by 2 days", description: "Arjun's task was due Apr 16. No status update since Apr 14.", project: "CC v5", from: "System", time: "1h ago", read: false, actions: ["reassign", "snooze"] },
  { id: "n4", category: "overdue", title: "E2E test plan not started", description: "Scheduled start was Apr 15. Still in backlog.", project: "CC v5", from: "System", time: "2h ago", read: true, actions: ["reassign", "escalate"] },
  { id: "n5", category: "mentions", title: "@you in PR #87 review comment", description: "Priya asked: 'Should we use grid-template-areas or manual placement?'", project: "CC v5", from: "Priya", time: "45 min ago", read: false, actions: ["approve", "snooze"] },
  { id: "n6", category: "mentions", title: "@you tagged in sprint retro notes", description: "Action item: investigate vLLM memory spike during batch inference.", project: "CC v5", from: "Arjun", time: "3h ago", read: true, actions: ["snooze"] },
  { id: "n7", category: "ai", title: "Suggested: parallelize Widget + Grid tasks", description: "AI detected no hard dependency between tasks #4 and #5. Running in parallel saves ~5 days.", project: "CC v5", from: "AI", time: "5 min ago", read: false, actions: ["approve", "snooze"] },
  { id: "n8", category: "ai", title: "Risk alert: single-contributor bottleneck", description: "Rohith is assigned to 67% of in-progress tasks. Consider redistributing.", project: "CC v5", from: "AI", time: "1h ago", read: false, actions: ["approve", "snooze"] },
  { id: "n9", category: "blockers", title: "API rate limit hit on external service", description: "Voice pipeline STT calls throttled. 429 errors for 20 min.", project: "CC v5", from: "Monitor", time: "8 min ago", read: false, actions: ["escalate", "snooze"] },
  { id: "n10", category: "overdue", title: "Login UI accessibility audit overdue", description: "Was due Apr 12. Priya marked as deprioritized but no new date set.", project: "NeuactReport", from: "System", time: "4h ago", read: true, actions: ["reassign", "snooze"] },
];

const categoryMeta: Record<Category, { label: string; icon: React.ElementType; color: string; dotColor: string }> = {
  all: { label: "All", icon: Inbox, color: "text-neutral-400", dotColor: "bg-neutral-400" },
  blockers: { label: "Blockers", icon: AlertOctagon, color: "text-red-400", dotColor: "bg-red-500" },
  overdue: { label: "Overdue", icon: Clock, color: "text-amber-400", dotColor: "bg-amber-500" },
  mentions: { label: "Mentions", icon: AtSign, color: "text-blue-400", dotColor: "bg-blue-500" },
  ai: { label: "AI Suggestions", icon: Sparkles, color: "text-purple-400", dotColor: "bg-purple-500" },
};

const actionMeta: Record<NotifAction, { label: string; icon: React.ElementType; color: string }> = {
  approve: { label: "Approve", icon: Check, color: "bg-green-500/20 text-green-400 hover:bg-green-500/30" },
  snooze: { label: "Snooze", icon: BellOff, color: "bg-neutral-500/20 text-neutral-400 hover:bg-neutral-500/30" },
  reassign: { label: "Reassign", icon: UserPlus, color: "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30" },
  escalate: { label: "Escalate", icon: ArrowUpRight, color: "bg-red-500/20 text-red-400 hover:bg-red-500/30" },
};

export default function NotificationHubLayout() {
  const [category, setCategory] = useState<Category>("all");
  const [notifications, setNotifications] = useState(initialNotifications);
  const [selected, setSelected] = useState<string | null>(notifications[0].id);

  const filtered = category === "all" ? notifications : notifications.filter((n) => n.category === category);
  const unreadCounts = (cat: Category) => {
    const list = cat === "all" ? notifications : notifications.filter((n) => n.category === cat);
    return list.filter((n) => !n.read).length;
  };
  const selectedNotif = notifications.find((n) => n.id === selected);

  const handleAction = (id: string, action: NotifAction) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    const ids = new Set(filtered.map((n) => n.id));
    setNotifications((prev) => prev.map((n) => ids.has(n.id) ? { ...n, read: true } : n));
  };

  return (
    <div className="h-[700px] rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 flex flex-col text-white">
      {/* Header */}
      <div className="px-5 py-3 border-b border-white/10 flex items-center gap-3">
        <Inbox className="w-5 h-5 text-indigo-400" />
        <h3 className="text-sm font-bold">Notification Hub</h3>
        <span className="text-[10px] text-neutral-500">{notifications.filter((n) => !n.read).length} unread</span>
        <div className="flex-1" />
        <button onClick={markAllRead} className="text-[10px] text-neutral-500 hover:text-white flex items-center gap-1 transition-colors">
          <CheckCheck className="w-3 h-3" /> Mark all read
        </button>
      </div>

      {/* Category tabs */}
      <div className="px-4 py-2 border-b border-white/10 flex items-center gap-1">
        <Filter className="w-3 h-3 text-neutral-600 mr-1" />
        {(Object.keys(categoryMeta) as Category[]).map((cat) => {
          const meta = categoryMeta[cat];
          const count = unreadCounts(cat);
          return (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`text-[10px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${category === cat ? "bg-white/10 text-white" : "text-neutral-500 hover:bg-white/5"}`}>
              <meta.icon className="w-3 h-3" />
              {meta.label}
              {count > 0 && <span className={`w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center ${meta.dotColor} text-white`}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Body: list + action panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Notification list */}
        <div className="w-[55%] border-r border-white/10 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-600">
              <Inbox className="w-8 h-8 mb-2" />
              <span className="text-xs">Inbox zero! Nothing here.</span>
            </div>
          ) : filtered.map((n) => {
            const meta = categoryMeta[n.category];
            return (
              <div key={n.id} onClick={() => { setSelected(n.id); setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x)); }}
                className={`px-4 py-3 border-b border-white/5 cursor-pointer transition-colors ${selected === n.id ? "bg-white/[0.07]" : "hover:bg-white/[0.03]"} ${!n.read ? "border-l-2 border-l-indigo-500" : ""}`}>
                <div className="flex items-start gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!n.read ? meta.dotColor : "bg-transparent"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">{n.title}</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5 truncate">{n.description}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[8px] font-bold uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                      <span className="text-[9px] text-neutral-600">{n.project}</span>
                      <span className="text-[9px] text-neutral-600">{n.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action panel */}
        <div className="w-[45%] overflow-y-auto p-5">
          {selectedNotif ? (
            <div>
              <div className={`inline-block text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-3 ${categoryMeta[selectedNotif.category].color} bg-white/5`}>
                {categoryMeta[selectedNotif.category].label}
              </div>
              <h4 className="text-sm font-bold text-white mb-2">{selectedNotif.title}</h4>
              <p className="text-xs text-neutral-400 mb-4 leading-relaxed">{selectedNotif.description}</p>
              <div className="text-[10px] text-neutral-500 mb-1">From: {selectedNotif.from} &middot; {selectedNotif.project} &middot; {selectedNotif.time}</div>

              <div className="mt-6 mb-4">
                <div className="text-[9px] uppercase font-bold tracking-widest text-neutral-500 mb-3">Quick Actions</div>
                <div className="flex flex-wrap gap-2">
                  {selectedNotif.actions.map((a) => {
                    const am = actionMeta[a];
                    return (
                      <button key={a} onClick={() => handleAction(selectedNotif.id, a)}
                        className={`flex items-center gap-1.5 text-[10px] font-medium px-3 py-2 rounded-lg transition-colors ${am.color}`}>
                        <am.icon className="w-3 h-3" /> {am.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 bg-white/5 rounded-xl border border-white/10 p-4">
                <div className="text-[9px] uppercase font-bold tracking-widest text-neutral-500 mb-2">Context</div>
                <div className="text-[10px] text-neutral-400 space-y-1.5">
                  <div>Project: <span className="text-white">{selectedNotif.project}</span></div>
                  <div>Category: <span className="text-white capitalize">{selectedNotif.category}</span></div>
                  <div>Status: <span className={selectedNotif.read ? "text-neutral-500" : "text-indigo-400"}>{selectedNotif.read ? "Read" : "Unread"}</span></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-neutral-600">
              <span className="text-xs">Select a notification to see details</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
