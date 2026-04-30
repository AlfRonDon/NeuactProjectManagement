"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VoiceControlBar from "@/components/layer1/VoiceControlBar";
import UserAvatar from "@/components/UserAvatar";
import AdminOverview from "@/components/AdminOverview";
import { EngineerOverviewA } from "@/components/layouts";
import { useAuth } from "@/lib/AuthProvider";
import { fetchProjects, fetchTasks, fetchNotifications, patchNotification } from "@/lib/api";
import {
  AlertOctagon, Clock, AtSign, Sparkles, Check, BellOff, UserPlus,
  ArrowUpRight, Zap, Flame, CheckCircle2, Bell, Target, Settings,
  ChevronRight, TrendingUp, Calendar, ExternalLink,
  Filter, CheckCheck, Inbox, Brain,
  FolderOpen, ListChecks, CircleDot, OctagonAlert, CalendarDays,
  SquareStack, Activity, CircleAlert, BadgeCheck, Layers,
} from "lucide-react";

// ── MUTABLE DATA (populated from API) ────────────────────────

let PROJECTS: any[] = [];
let NOTIFICATIONS: any[] = [];
let FOCUS_TASK = { title: "", due: "", est: "", project: "" };
const TODAY = new Date();
let ALL_TASKS: any[] = [];

let totalTasks = 0;
let totalDone = 0;
let totalActive = 0;
let totalBlocked = 0;
let totalTodo = 0;
let overallPct = 0;

function recomputeStats() {
  totalTasks = PROJECTS.reduce((s: number, p: any) => s + (p.total || 0), 0);
  totalDone = PROJECTS.reduce((s: number, p: any) => s + (p.done || 0), 0);
  totalActive = PROJECTS.reduce((s: number, p: any) => s + (p.active || 0), 0);
  totalBlocked = PROJECTS.reduce((s: number, p: any) => s + (p.blocked || 0), 0);
  totalTodo = Math.max(0, totalTasks - totalDone - totalActive - totalBlocked);
  overallPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
}

function daysLeft(d: string) {
  return Math.ceil((new Date(d).getTime() - TODAY.getTime()) / 86400000);
}

const CAT_META: Record<string, { label: string; icon: React.ElementType; dot: string; text: string; border: string; bg: string }> = {
  blocker: { label: "Blocker",  icon: AlertOctagon, dot: "bg-red-500",    text: "text-red-400",    border: "border-red-500/60",    bg: "bg-red-500/10" },
  overdue: { label: "Overdue",  icon: Clock,        dot: "bg-amber-500",  text: "text-amber-400",  border: "border-amber-500/60",  bg: "bg-amber-500/10" },
  mention: { label: "Mention",  icon: AtSign,       dot: "bg-blue-500",   text: "text-blue-400",   border: "border-blue-500/40",   bg: "bg-blue-500/8" },
  ai:      { label: "AI",       icon: Sparkles,     dot: "bg-purple-500", text: "text-purple-400", border: "border-purple-500/40", bg: "bg-purple-500/8" },
};

const PRIORITY_ORDER = ["blocker", "overdue", "mention", "ai"];

// ── SHARED COMPONENTS ────────────────────────────────────────

function ProgressRing({ pct, size = 56, stroke = 4, color = "#22c55e", dark = false }: {
  pct: number; size?: number; stroke?: number; color?: string; dark?: boolean;
}) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={dark ? "rgba(255,255,255,0.08)" : "#f5f5f5"} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xs font-bold ${dark ? "text-white" : "text-neutral-900"}`}>{pct}%</span>
      </div>
    </div>
  );
}

// ── LIGHT NOTIF PANEL (for V1-V3) ───────────────────────────

function NotifPanel() {
  const [cat, setCat] = useState("all");
  const [sel, setSel] = useState("n1");
  const [notifs, setNotifs] = useState(NOTIFICATIONS);

  const markRead = (id: string) => {
    setNotifs(prev => prev.map(x => x.id === id ? { ...x, read: true } : x));
    patchNotification(id, { read: true }).catch(() => {});
  };
  const markAllRead = () => {
    markAllRead();
    notifs.filter(x => !x.read).forEach(x => patchNotification(x.id, { read: true }).catch(() => {}));
  };

  const filtered = cat === "all" ? notifs : notifs.filter(n => n.cat === cat);
  const selected = notifs.find(n => n.id === sel);
  const unread = notifs.filter(n => !n.read).length;

  const ACTION_META: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
    approve:  { label: "Approve",  icon: Check,        cls: "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100" },
    snooze:   { label: "Snooze",   icon: BellOff,      cls: "bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100" },
    reassign: { label: "Reassign", icon: UserPlus,     cls: "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100" },
    escalate: { label: "Escalate", icon: ArrowUpRight, cls: "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100" },
  };

  const cats = ["all", "blocker", "overdue", "mention", "ai"];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-sm">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center gap-3 shrink-0">
        <span className="text-base font-bold text-neutral-900">Activity</span>
        {unread > 0 && (
          <span className="text-xs bg-red-500 text-white font-bold px-2 py-0.5 rounded-full">{unread}</span>
        )}
        <button onClick={() => markAllRead()}
          className="ml-auto text-xs text-neutral-400 hover:text-neutral-700 flex items-center gap-1.5 transition-colors">
          <CheckCheck className="w-3.5 h-3.5" /> All read
        </button>
      </div>

      {/* Category tabs */}
      <div className="px-4 py-2.5 border-b border-neutral-100 flex gap-1.5 shrink-0">
        {cats.map(c => {
          const meta = CAT_META[c];
          const count = c === "all" ? unread : notifs.filter(n => n.cat === c && !n.read).length;
          return (
            <button key={c} onClick={() => setCat(c)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${cat === c ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100"}`}>
              {meta ? <meta.icon className="w-3.5 h-3.5" /> : <Inbox className="w-3.5 h-3.5" />}
              {meta?.label ?? "All"}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cat === c ? "bg-white/25 text-white" : "bg-neutral-200 text-neutral-700"}`}>{count}</span>
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
              <div className="text-sm font-medium">All clear</div>
            </div>
          )}
          {filtered.map(n => {
            const meta = CAT_META[n.cat];
            const NIcon = meta.icon;
            const isActive = sel === n.id;
            const accentColor = meta.dot.includes("red") ? "#ef4444" : meta.dot.includes("amber") ? "#f59e0b" : meta.dot.includes("blue") ? "#3b82f6" : "#a855f7";
            return (
              <div key={n.id}
                onClick={() => { setSel(n.id); markRead(n.id); }}
                className={`group px-4 py-3.5 border-b border-neutral-100 cursor-pointer transition-colors relative ${isActive ? "bg-neutral-50" : "hover:bg-neutral-50"}`}>
                {/* Unread bar */}
                {!n.read && <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full" style={{ backgroundColor: accentColor }} />}
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${meta.bg} border ${meta.border}`}>
                    <NIcon className={`w-3.5 h-3.5 ${meta.text}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <span className={`text-sm font-semibold leading-snug ${!n.read ? "text-neutral-900" : "text-neutral-500"}`}>{n.title}</span>
                      <span className="text-xs text-neutral-400 shrink-0">{n.time}</span>
                    </div>
                    <div className="text-xs text-neutral-500 line-clamp-1 mb-1.5">{n.desc}</div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${meta.text}`}>{meta.label}</span>
                      <span className="text-xs text-neutral-400">{n.project}</span>
                      <div className="ml-auto flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {n.actions.slice(0, 2).map((a: any) => {
                          const am = ACTION_META[a];
                          return (
                            <button key={a} onClick={e => { e.stopPropagation(); markRead(n.id); }}
                              className={`text-xs font-semibold px-2 py-0.5 rounded-md transition-all ${am.cls}`}>
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
          const SelIcon = selMeta.icon;
          return (
            <div className="flex-[2] min-w-0 flex flex-col overflow-y-auto">
              <div className={`px-5 py-4 border-b border-neutral-100 ${selMeta.bg}`}>
                <div className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2 ${selMeta.text}`}>
                  <SelIcon className="w-3.5 h-3.5" /> {selMeta.label}
                </div>
                <div className="text-sm font-bold text-neutral-900 leading-snug">{selected.title}</div>
              </div>
              <div className="p-5 flex-1">
                <p className="text-sm text-neutral-600 leading-relaxed mb-4">{selected.desc}</p>
                <div className="text-xs text-neutral-400 mb-6">{selected.from} · {selected.project} · {selected.time}</div>
                <div className="space-y-2">
                  {selected.actions.map((a: any) => {
                    const am = ACTION_META[a];
                    const AmIcon = am.icon;
                    return (
                      <button key={a} className={`w-full flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all ${am.cls}`}>
                        <AmIcon className="w-4 h-4" /> {am.label}
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

// ── DARK NOTIF PANEL (improved, for V4-V7) ──────────────────

function DarkNotifPanel({ slim = false }: { slim?: boolean }) {
  const [tab, setTab] = useState<string>("inbox");
  const [cat, setCat] = useState("all");
  const [sel, setSel] = useState("n1");
  const [notifs, setNotifs] = useState(NOTIFICATIONS);
  const [triageMode, setTriageMode] = useState(false);

  const markRead = (id: string) => {
    setNotifs(prev => prev.map(x => x.id === id ? { ...x, read: true } : x));
    patchNotification(id, { read: true }).catch(() => {});
  };
  const markAllRead = () => {
    setNotifs(n => n.map(x => ({ ...x, read: true })));
    notifs.filter(x => !x.read).forEach(x => patchNotification(x.id, { read: true }).catch(() => {}));
  };

  const filtered = (() => {
    let list = triageMode ? notifs.filter(n => !n.read) : notifs;
    if (cat !== "all") list = list.filter(n => n.cat === cat);
    return [...list].sort((a, b) => PRIORITY_ORDER.indexOf(a.cat) - PRIORITY_ORDER.indexOf(b.cat));
  })();

  const selected = notifs.find(n => n.id === sel);
  const unread = notifs.filter(n => !n.read).length;
  const critical = notifs.filter(n => n.cat === "blocker" && !n.read).length;

  const ACTION_META: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
    approve:  { label: "Approve",  icon: Check,       cls: "bg-green-500/20 text-green-400 hover:bg-green-500/30" },
    snooze:   { label: "Snooze",   icon: BellOff,     cls: "bg-white/10 text-neutral-400 hover:bg-white/15" },
    reassign: { label: "Reassign", icon: UserPlus,    cls: "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30" },
    escalate: { label: "Escalate", icon: ArrowUpRight, cls: "bg-red-500/20 text-red-400 hover:bg-red-500/30" },
  };

  const aiInsights = [
    { icon: Brain, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", title: "Phase B is the critical path", body: "3 tasks in Phase B have no parallel alternatives. Delays here cascade to 5 downstream tasks." },
    { icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", title: "Velocity is ahead of estimate", body: "You're completing tasks 18% faster than sprint baseline. On-track for early delivery of NRv3." },
    { icon: AlertOctagon, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", title: "Spot Particle: deadline risk", body: "Current progress (50%) + active tasks (1) may not close 3 remaining tasks before Apr 30." },
  ];

  return (
    <div className="flex flex-col h-full bg-neutral-900 rounded-2xl overflow-hidden border border-white/10">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-bold text-white">Triage</span>
          {critical > 0 && (
            <span className="text-[9px] bg-red-500 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertOctagon className="w-2.5 h-2.5" /> {critical} critical
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setTriageMode(t => !t)}
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full transition-all ${triageMode ? "bg-amber-500/30 text-amber-300" : "bg-white/8 text-neutral-500 hover:bg-white/12"}`}>
              <Filter className="w-2.5 h-2.5 inline mr-1" />Unread only
            </button>
            <button onClick={() => markAllRead()}
              className="text-[9px] text-neutral-500 hover:text-white flex items-center gap-1 transition-colors">
              <CheckCheck className="w-3 h-3" />
            </button>
          </div>
        </div>
        {/* Tab row */}
        <div className="flex gap-1">
          {(["inbox", "ai"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 text-[10px] font-semibold py-1 rounded-lg transition-all ${tab === t ? "bg-white/12 text-white" : "text-neutral-600 hover:bg-white/5"}`}>
              {t === "inbox" ? `Inbox ${unread > 0 ? `(${unread})` : ""}` : "AI Insights"}
            </button>
          ))}
        </div>
      </div>

      {tab === "ai" ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {aiInsights.map((item, i) => {
            const ItemIcon = item.icon;
            return (
              <div key={i} className={`rounded-xl border p-4 ${item.bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <ItemIcon className={`w-3.5 h-3.5 ${item.color}`} />
                  <span className={`text-[10px] font-bold ${item.color}`}>{item.title}</span>
                </div>
                <p className="text-[10px] text-neutral-400 leading-relaxed">{item.body}</p>
                <button className={`mt-3 text-[9px] font-bold ${item.color} hover:opacity-70 transition-opacity`}>
                  Take action →
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {/* Category pills */}
          <div className="px-3 py-2 border-b border-white/8 flex gap-1 shrink-0 flex-wrap">
            {["all", "blocker", "overdue", "mention", "ai"].map(c => {
              const meta = CAT_META[c];
              const CatIcon = meta?.icon ?? Inbox;
              const cnt = c === "all" ? notifs.filter(n => !n.read).length : notifs.filter(n => n.cat === c && !n.read).length;
              return (
                <button key={c} onClick={() => setCat(c)}
                  className={`text-[9px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 transition-all ${cat === c ? "bg-white/15 text-white" : "text-neutral-600 hover:bg-white/8 hover:text-neutral-300"}`}>
                  <CatIcon className="w-2.5 h-2.5" />
                  {meta?.label ?? "All"}
                  {cnt > 0 && <span className={`text-[7px] font-bold px-1 rounded-full ${meta?.dot ?? "bg-neutral-600"} text-white`}>{cnt}</span>}
                </button>
              );
            })}
          </div>

          <div className={`flex flex-1 overflow-hidden ${slim ? "flex-col" : ""}`}>
            {/* List */}
            <div className={slim ? "overflow-y-auto" : "flex-[3] overflow-y-auto border-r border-white/8"}>
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-neutral-700">
                  <CheckCheck className="w-8 h-8 mb-2" />
                  <div className="text-xs font-medium">All clear</div>
                </div>
              )}
              {filtered.map(n => {
                const meta = CAT_META[n.cat];
                const NIcon = meta.icon;
                return (
                  <div key={n.id}
                    onClick={() => { setSel(n.id); markRead(n.id); }}
                    className={`px-4 py-3.5 border-b border-white/5 cursor-pointer transition-all group
                      ${sel === n.id ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"}
                      ${!n.read ? "border-l-[3px]" : "border-l-[3px] border-l-transparent"}`}
                    style={!n.read ? { borderLeftColor: meta.dot.replace("bg-", "").includes("red") ? "#ef4444" : meta.dot.includes("amber") ? "#f59e0b" : meta.dot.includes("blue") ? "#3b82f6" : "#a855f7" } : {}}>
                    <div className="flex items-start gap-2.5">
                      <div className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center ${meta.bg} border ${meta.border}`}>
                        <NIcon className={`w-3 h-3 ${meta.text}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-1">
                          <div className={`text-[11px] font-semibold leading-tight ${!n.read ? "text-white" : "text-neutral-400"} truncate`}>
                            {n.title}
                          </div>
                          <span className="text-[8px] text-neutral-700 shrink-0 mt-0.5">{n.time}</span>
                        </div>
                        <div className="text-[9px] text-neutral-600 line-clamp-1 mt-0.5">{n.desc}</div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[8px] font-bold ${meta.text}`}>{meta.label}</span>
                          <span className="text-[8px] text-neutral-700">{n.project}</span>
                          {/* Quick actions on hover */}
                          <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {n.actions.slice(0, 2).map((a: any) => {
                              const am = ACTION_META[a];
                              return (
                                <button key={a} onClick={e => { e.stopPropagation(); markRead(n.id); }}
                                  className={`text-[7px] font-bold px-1.5 py-0.5 rounded-md ${am.cls} transition-all`}>
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

            {/* Detail pane (hidden in slim mode) */}
            {!slim && selected && (() => {
              const selMeta = CAT_META[selected.cat];
              const SelIcon = selMeta.icon;
              return (
                <div className="flex-[2] min-w-0 flex flex-col overflow-y-auto bg-neutral-950/50">
                  <div className={`p-4 border-b border-white/8 ${selMeta.bg}`}>
                    <div className={`text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 mb-2 ${selMeta.text}`}>
                      <SelIcon className="w-2.5 h-2.5" />
                      {selMeta.label}
                    </div>
                    <div className="text-[11px] font-bold text-white leading-snug">{selected.title}</div>
                  </div>
                  <div className="p-4 flex-1">
                    <p className="text-[9px] text-neutral-400 leading-relaxed mb-3">{selected.desc}</p>
                    <div className="text-[8px] text-neutral-700 mb-5">
                      {selected.from} · {selected.project} · {selected.time}
                    </div>
                    <div className="space-y-1.5">
                      {selected.actions.map((a: any) => {
                        const am = ACTION_META[a];
                        const AmIcon = am.icon;
                        return (
                          <button key={a} className={`w-full flex items-center gap-1.5 text-[9px] font-medium px-3 py-1.5 rounded-lg transition-all ${am.cls}`}>
                            <AmIcon className="w-3 h-3" />{am.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}

// ── SECTION: ALL TASKS TABLE ─────────────────────────────────

const STATUS_META: Record<string, { label: string; dot: string; text: string; bg: string; icon: React.ElementType; border: string }> = {
  active:  { label: "Active",  dot: "bg-amber-400",   text: "text-amber-700",   bg: "bg-amber-50",    icon: Activity,     border: "border-amber-200"   },
  blocked: { label: "Blocked", dot: "bg-red-500",     text: "text-red-700",     bg: "bg-red-50",      icon: OctagonAlert, border: "border-red-200"     },
  todo:    { label: "To Do",   dot: "bg-neutral-300", text: "text-neutral-500", bg: "bg-neutral-100", icon: CircleDot,    border: "border-neutral-200" },
  done:    { label: "Done",    dot: "bg-green-400",   text: "text-green-700",   bg: "bg-green-50",    icon: CheckCircle2, border: "border-green-200"   },
};

const PRIORITY_META: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  urgent: { label: "Urgent", color: "text-red-600",     dot: "bg-red-500",     bg: "bg-red-50"      },
  high:   { label: "High",   color: "text-orange-600",  dot: "bg-orange-400",  bg: "bg-orange-50"   },
  medium: { label: "Medium", color: "text-neutral-500", dot: "bg-neutral-300", bg: "bg-neutral-100" },
  low:    { label: "Low",    color: "text-neutral-400", dot: "bg-neutral-200", bg: "bg-neutral-50"  },
};

const PROJ_STYLE: Record<string, { text: string; bg: string; dot: string }> = {
  CCv5: { text: "text-blue-700",   bg: "bg-blue-50",   dot: "bg-blue-400"   },
  NRv3: { text: "text-violet-700", bg: "bg-violet-50", dot: "bg-violet-400" },
  Spot: { text: "text-amber-700",  bg: "bg-amber-50",  dot: "bg-amber-400"  },
};

function dueBadge(due: string, status: string) {
  if (status === "done") return <span className="text-xs text-neutral-300 line-through">{due}</span>;
  const d = Math.ceil((new Date(due).getTime() - TODAY.getTime()) / 86400000);
  if (d < 0)   return <span className="text-xs font-semibold text-red-500">{Math.abs(d)}d overdue</span>;
  if (d === 0) return <span className="text-xs font-semibold text-red-500">Today</span>;
  if (d === 1) return <span className="text-xs font-semibold text-amber-500">Tomorrow</span>;
  if (d <= 7)  return <span className="text-xs font-semibold text-neutral-600">in {d}d</span>;
  return <span className="text-xs text-neutral-400">{due}</span>;
}

function ProjChip({ p }: { p: string }) {
  const s = PROJ_STYLE[p] ?? { text: "text-neutral-600", bg: "bg-neutral-100", dot: "bg-neutral-400" };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{p}
    </span>
  );
}

function StatusChip({ status }: { status: string }) {
  const s = STATUS_META[status];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md border ${s.bg} ${s.text} ${s.border}`}>
      <Icon className="w-3 h-3" />{s.label}
    </span>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const p = PRIORITY_META[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${p.color}`}>
      <span className={`w-2 h-2 rounded-full ${p.dot}`} />{p.label}
    </span>
  );
}

const TASK_STATUS_ORDER   = ["blocked","active","todo","done"];
const TASK_PRIORITY_ORDER = ["urgent","high","medium","low"];

function sortTasks(tasks: typeof ALL_TASKS) {
  return [...tasks].sort((a, b) => {
    const sd = TASK_STATUS_ORDER.indexOf(a.status) - TASK_STATUS_ORDER.indexOf(b.status);
    if (sd !== 0) return sd;
    const pd = TASK_PRIORITY_ORDER.indexOf(a.priority) - TASK_PRIORITY_ORDER.indexOf(b.priority);
    if (pd !== 0) return pd;
    return new Date(a.due).getTime() - new Date(b.due).getTime();
  });
}

// ── TASK TABLE VARIANTS ──────────────────────────────────────

// Shared filter pills used across all variants
function StatusFilterPills({ value, onChange, counts }: {
  value: string;
  onChange: (s: string) => void;
  counts: Record<string, number>;
}) {
  const statuses = ["all","active","blocked","todo","done"];
  return (
    <div className="flex gap-1">
      {statuses.map(s => {
        const cnt = s === "all" ? Object.values(counts).reduce((a, b) => a + b, 0) : (counts[s] ?? 0);
        const sm = STATUS_META[s];
        return (
          <button key={s} onClick={() => onChange(s)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all border ${
              value === s
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300 hover:text-neutral-700"
            }`}>
            {s !== "all" && <span className={`w-1.5 h-1.5 rounded-full ${sm.dot} ${value === s ? "opacity-100" : ""}`} />}
            {s === "all" ? "All" : sm.label}
            <span className={`text-xs font-bold px-1 rounded ${value === s ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-500"}`}>{cnt}</span>
          </button>
        );
      })}
    </div>
  );
}

// TaskTable — standard + sortable columns + checkable rows + hover actions
type SortKey = "title" | "project" | "status" | "priority" | "due";

function TaskTable({ tasks }: { tasks: typeof ALL_TASKS }) {
  const [sortKey, setSortKey]   = useState<SortKey>("status");
  const [sortDir, setSortDir]   = useState<1 | -1>(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [checked, setChecked]   = useState<Set<string>>(new Set(tasks.filter(t => t.status === "done").map(t => t.id)));
  const [hoverId, setHoverId]   = useState<string | null>(null);

  function toggleSort(k: SortKey) {
    if (k === sortKey) setSortDir(d => (d === 1 ? -1 : 1));
    else { setSortKey(k); setSortDir(1); }
  }
  function toggleCheck(id: string) {
    setChecked(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  const resolved = tasks.map(t => ({ ...t, status: checked.has(t.id) ? "done" : t.status }));
  const filtered = statusFilter === "all" ? resolved : resolved.filter(t => t.status === statusFilter);
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "title")    cmp = a.title.localeCompare(b.title);
    if (sortKey === "project")  cmp = a.project.localeCompare(b.project);
    if (sortKey === "status")   cmp = TASK_STATUS_ORDER.indexOf(a.status) - TASK_STATUS_ORDER.indexOf(b.status);
    if (sortKey === "priority") cmp = TASK_PRIORITY_ORDER.indexOf(a.priority) - TASK_PRIORITY_ORDER.indexOf(b.priority);
    if (sortKey === "due")      cmp = new Date(a.due).getTime() - new Date(b.due).getTime();
    return cmp * sortDir;
  });
  const counts = Object.fromEntries(["active","blocked","todo","done"].map(s => [s, resolved.filter(t => t.status === s).length]));

  const cols: { key: SortKey; label: string }[] = [
    { key: "title",    label: "Task"     },
    { key: "project",  label: "Project"  },
    { key: "status",   label: "Status"   },
    { key: "priority", label: "Priority" },
    { key: "due",      label: "Due"      },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
        {/* Sortable header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] bg-neutral-50 border-b border-neutral-200 pl-4 pr-5 py-0">
          <div className="w-8" />
          {cols.map(c => (
            <button key={c.key} onClick={() => toggleSort(c.key)}
              className={`flex items-center gap-1 py-3 text-xs font-bold uppercase tracking-widest transition-all select-none pr-5 last:pr-0 ${sortKey === c.key ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-700"}`}>
              {c.label}
              <span className={`transition-opacity ${sortKey === c.key ? "opacity-100" : "opacity-25"}`}>
                {sortKey === c.key ? (sortDir === 1 ? "↑" : "↓") : "↕"}
              </span>
            </button>
          ))}
        </div>
        {/* Rows */}
        <div className="divide-y divide-neutral-100">
          {sorted.map(t => {
            const isDone    = checked.has(t.id);
            const isHovered = hoverId === t.id;
            return (
              <div key={t.id}
                onMouseEnter={() => setHoverId(t.id)}
                onMouseLeave={() => setHoverId(null)}
                className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center pl-4 pr-5 py-3 transition-colors cursor-pointer ${isHovered ? "bg-neutral-50" : ""} ${isDone ? "opacity-40" : ""}`}>
                {/* Checkbox */}
                <button onClick={() => toggleCheck(t.id)}
                  className={`w-5 h-5 rounded-md border-2 mr-3 flex items-center justify-center shrink-0 transition-all ${isDone ? "bg-neutral-900 border-neutral-900" : "border-neutral-300 hover:border-neutral-600 bg-white"}`}>
                  {isDone && <Check className="w-3 h-3 text-white" />}
                </button>
                {/* Title + hover actions */}
                <div className="flex items-center gap-2 min-w-0 pr-5">
                  <span className={`text-sm font-medium truncate ${isDone ? "line-through text-neutral-400" : "text-neutral-800"}`}>{t.title}</span>
                  {isHovered && !isDone && (
                    <div className="flex gap-1.5 shrink-0">
                      {t.status !== "blocked" && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-colors">Block</span>
                      )}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-500 border border-neutral-200 hover:bg-neutral-200 transition-colors">Snooze</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-500 border border-blue-200 hover:bg-blue-100 transition-colors">Assign</span>
                    </div>
                  )}
                </div>
                <div className="pr-5"><ProjChip p={t.project} /></div>
                <div className="w-24 pr-5"><StatusChip status={t.status} /></div>
                <div className="w-20 pr-5"><PriorityDot priority={t.priority} /></div>
                <div className="w-24 text-right">{dueBadge(t.due, t.status)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type TaskView = "today" | "urgent" | "week" | "upcoming" | "all";

const TASK_VIEWS: { value: TaskView; label: string }[] = [
  { value: "today",    label: "Today"     },
  { value: "urgent",   label: "Urgent"    },
  { value: "week",     label: "This Week" },
  { value: "upcoming", label: "Upcoming"  },
  { value: "all",      label: "All"       },
];

function TasksWidget({ selId }: { selId: string }) {
  const [view, setView] = useState<TaskView>("today");
  const projShort = PROJECTS.find(p => p.id === selId)?.short ?? null;
  const isAll = selId === "all";

  const base = (!isAll && projShort)
    ? ALL_TASKS.filter(t => t.project === projShort)
    : ALL_TASKS;

  function daysFromToday(due: string) {
    return Math.ceil((new Date(due).getTime() - TODAY.getTime()) / 86400000);
  }

  const tasks = base.filter(t => {
    const d = daysFromToday(t.due);
    if (view === "today")    return t.status !== "done" && d <= 0;
    if (view === "urgent")   return t.status !== "done" && (t.status === "blocked" || t.priority === "high" || d <= 3);
    if (view === "week")     return t.status !== "done" && d <= 7;
    if (view === "upcoming") return t.status !== "done" && d > 7;
    return true; // all
  });

  const viewLabel = TASK_VIEWS.find(v => v.value === view)!.label;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-neutral-900">{viewLabel}</span>
          <span className="text-xs text-neutral-400 font-medium">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex gap-1">
          {TASK_VIEWS.map(v => (
            <button key={v.value} onClick={() => setView(v.value)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${view === v.value ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100"}`}>
              {v.label}
            </button>
          ))}
        </div>
      </div>
      {tasks.length === 0
        ? <div className="text-center py-8 text-sm text-neutral-400">No tasks in this view</div>
        : <TaskTable tasks={tasks} />
      }
    </div>
  );
}

// ── SHARED LEFT CARD PIECES ──────────────────────────────────

const nearestDeadline = PROJECTS.length > 0 ? [...PROJECTS].sort((a, b) => daysLeft(a.target) - daysLeft(b.target))[0] : null;
const overdueCount    = ALL_TASKS.filter(t => t.status !== "done" && daysLeft(t.due) < 0).length;
const dueTodayCount   = ALL_TASKS.filter(t => t.status !== "done" && daysLeft(t.due) === 0).length;

// Pace calc for nearest-deadline project
const soonestProj     = nearestDeadline;
const soonestTotalDays = soonestProj ? Math.ceil((new Date(soonestProj.target).getTime() - new Date(soonestProj.start).getTime()) / 86400000) : 1;
const soonestElapsed   = soonestProj ? Math.ceil((TODAY.getTime() - new Date(soonestProj.start).getTime()) / 86400000) : 0;
const soonestTimePct   = Math.round(Math.min(100, (soonestElapsed / soonestTotalDays) * 100));
const paceDelta        = soonestProj ? soonestProj.progress - soonestTimePct : 0; // positive = ahead
const paceLabel        = paceDelta >= 5 ? "Ahead of pace" : paceDelta >= -10 ? "On track" : "Behind pace";
const paceColor        = paceDelta >= 5 ? "text-green-600" : paceDelta >= -10 ? "text-amber-600" : "text-red-500";
const paceBg           = paceDelta >= 5 ? "bg-green-50 border-green-200" : paceDelta >= -10 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

// ── OVERVIEW WIDGET VARIANTS ─────────────────────────────────

function OverallWidget() {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-xs uppercase font-bold text-neutral-500 tracking-widest mb-0.5">Your Overview</div>
        <div className="text-base font-bold text-neutral-900">Good morning, Rohith</div>
        <div className="text-xs text-neutral-500 mt-0.5">{totalDone} of {totalTasks} tasks · {PROJECTS.length} projects</div>
      </div>
      <div className="flex items-end gap-1 leading-none">
        <span className="text-5xl font-black text-neutral-900">{overallPct}</span>
        <span className="text-xl font-bold text-neutral-400 mb-1">%</span>
      </div>
    </div>
  );
}


// ── KPI PER-PROJECT HEALTH WIDGETS ──────────────────────────

// ── KPI WIDGET VARIANTS ──────────────────────────────────────
// All variants: big selected-project card on left + project list on right

type KpiProps = { selId: string; setSel: (id: string) => void };

function getPace(p: typeof PROJECTS[0]) {
  const totalDays = Math.ceil((new Date(p.target).getTime() - new Date(p.start).getTime()) / 86400000);
  const elapsed   = Math.ceil((TODAY.getTime() - new Date(p.start).getTime()) / 86400000);
  const timePct   = Math.round(Math.min(100, (elapsed / totalDays) * 100));
  const delta     = p.progress - timePct;
  return delta >= 5   ? { label: "Ahead",    color: "text-green-600",  bg: "bg-green-50",   dot: "bg-green-400"  }
       : delta >= -10  ? { label: "On track", color: "text-amber-600",  bg: "bg-amber-50",   dot: "bg-amber-400"  }
       :                 { label: "Behind",   color: "text-red-600",    bg: "bg-red-50",     dot: "bg-red-400"    };
}

// KpiPerProject — simple flat table, one row per project
function KpiDetailCard({ selId }: { selId: string }) {
  const isAll = selId === "all";
  const proj  = PROJECTS.find(p => p.id === selId);
  const dl    = proj ? daysLeft(proj.target) : null;
  const todo  = proj ? proj.total - proj.done - proj.active - proj.blocked : totalTodo;
  const pace  = proj ? getPace(proj) : null;

  const stats = [
    { icon: BadgeCheck,   label: "Done",    value: isAll ? totalDone    : proj!.done,    color: "text-green-600", bg: "bg-green-50"  },
    { icon: Activity,     label: "Active",  value: isAll ? totalActive  : proj!.active,  color: "text-amber-600", bg: "bg-amber-50"  },
    { icon: OctagonAlert, label: "Blocked", value: isAll ? totalBlocked : proj!.blocked, color: (isAll ? totalBlocked : proj!.blocked) > 0 ? "text-red-500" : "text-neutral-300", bg: (isAll ? totalBlocked : proj!.blocked) > 0 ? "bg-red-50" : "bg-neutral-50" },
    { icon: CircleDot,    label: "To Do",   value: todo,                                 color: "text-blue-500",  bg: "bg-blue-50"   },
  ];

  return (
    <div className="flex-[3] rounded-2xl border-2 p-5 space-y-4"
      style={!isAll ? { borderColor: proj!.color + "40", background: proj!.color + "06" } : { borderColor: "#e5e7eb", background: "#fafafa" }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {isAll
            ? <div className="flex gap-1">{PROJECTS.map(p => <div key={p.id} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />)}</div>
            : <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: proj!.color }} />}
          <span className="text-base font-bold text-neutral-900">{isAll ? "All Projects" : proj!.name}</span>
          {!isAll && (
            <a href={`/project/${proj!.name.toLowerCase().replace(/\s+/g, "-")}`} onClick={(e) => e.stopPropagation()} className="p-1 rounded-lg hover:bg-neutral-200/60 transition-colors">
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-700 transition-colors" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isAll && pace && <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${pace.bg} ${pace.color}`}>{pace.label}</span>}
          {!isAll && dl !== null && <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${dl < 30 ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-neutral-100 text-neutral-500"}`}>{dl}d left</span>}
          {isAll && <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-500">{PROJECTS.length} projects</span>}
        </div>
      </div>
      {/* Progress */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-xs text-neutral-500">Progress</span>
          <span className="text-sm font-bold text-neutral-900">{isAll ? overallPct : proj!.progress}%</span>
        </div>
        {isAll ? (
          <div className="w-full h-2.5 rounded-full overflow-hidden flex gap-px bg-neutral-100">
            {PROJECTS.map(p => (
              <div key={p.id} className="h-full" style={{ width: `${(p.total / totalTasks) * 100}%`, backgroundColor: p.color + "33" }}>
                <div className="h-full" style={{ width: `${p.progress}%`, backgroundColor: p.color }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${proj!.progress}%`, backgroundColor: proj!.color }} />
          </div>
        )}
      </div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {stats.map((s, i) => {
          const SIcon = s.icon;
          return (
            <div key={i} className={`${s.bg} rounded-xl p-3 flex flex-col items-center gap-1`}>
              <SIcon className={`w-4 h-4 ${s.color}`} />
              <span className={`text-lg font-black ${s.color}`}>{s.value}</span>
              <span className={`text-xs font-semibold ${s.color} opacity-80`}>{s.label}</span>
            </div>
          );
        })}
      </div>
      {/* Footer */}
      <div className="flex items-center gap-3 pt-1 border-t border-neutral-100">
        <ListChecks className="w-3.5 h-3.5 text-neutral-400" />
        {isAll
          ? <span className="text-xs text-neutral-500"><span className="font-semibold text-neutral-700">{totalDone}/{totalTasks}</span> tasks done across {PROJECTS.length} projects</span>
          : <><span className="text-xs text-neutral-500">Target <span className="font-semibold text-neutral-700">{proj!.target}</span></span>
              <span className="text-neutral-200 mx-1">·</span>
              <span className="text-xs text-neutral-500"><span className="font-semibold text-neutral-700">{proj!.done}/{proj!.total}</span> done</span></>
        }
      </div>
    </div>
  );
}

function KpiPerProject({ selId, setSel }: KpiProps) {
  const allPace = (() => {
    const scores = PROJECTS.map(p => {
      const td = Math.ceil((new Date(p.target).getTime() - new Date(p.start).getTime()) / 86400000);
      const el = Math.ceil((TODAY.getTime() - new Date(p.start).getTime()) / 86400000);
      return p.progress - Math.round(Math.min(100, (el / td) * 100));
    });
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return avg >= 5  ? { label: "Ahead",    color: "text-green-600", bg: "bg-green-50",  dot: "bg-green-400"  }
         : avg >= -10 ? { label: "On track", color: "text-amber-600", bg: "bg-amber-50",  dot: "bg-amber-400"  }
         :              { label: "Behind",   color: "text-red-600",   bg: "bg-red-50",    dot: "bg-red-400"    };
  })();

  const rows = [
    {
      id: "all",
      color: null as string | null,
      name: "All Projects",
      progress: overallPct,
      done: totalDone,
      active: totalActive,
      blocked: totalBlocked,
      total: totalTasks,
      dl: null as number | null,
      pace: allPace,
    },
    ...PROJECTS.map(p => ({
      id: p.id,
      color: p.color,
      name: p.name,
      progress: p.progress,
      done: p.done,
      active: p.active,
      blocked: p.blocked,
      total: p.total,
      dl: daysLeft(p.target),
      pace: getPace(p),
    })),
  ];

  return (
    <div className="flex gap-3 items-stretch">
      {/* Left: big detail card */}
      <div className="flex-[2] min-w-0">
        <KpiDetailCard selId={selId} />
      </div>
      {/* Right: compact project rows */}
      <div className="flex-[3] min-w-0 rounded-2xl border border-neutral-200 overflow-hidden">
        {rows.map((row) => {
          const isActive = row.id === selId;
          const isAllRow = row.id === "all";
          return (
            <button key={row.id} onClick={() => setSel(row.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors border-b border-neutral-100 last:border-b-0 ${isActive ? "bg-neutral-50" : "hover:bg-neutral-50/50"} ${isAllRow ? "border-b border-b-neutral-200" : ""}`}>
              {/* Color dot */}
              <div className="shrink-0">
                {isAllRow
                  ? <div className="flex gap-0.5">{PROJECTS.map(p => <div key={p.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />)}</div>
                  : <div className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color! }} />
                }
              </div>
              {/* Name */}
              <span className={`flex-1 text-sm truncate ${isActive ? "font-semibold text-neutral-900" : "font-normal text-neutral-500"}`}>{row.name}</span>
              {/* % */}
              <span className={`text-sm font-bold tabular-nums ${isActive ? "text-neutral-800" : "text-neutral-400"}`}>{row.progress}%</span>
              {/* Pace badge */}
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full w-18 text-center shrink-0 ${row.pace.bg} ${row.pace.color}`}>{row.pace.label}</span>
              {/* Deadline */}
              <span className={`text-xs tabular-nums w-10 text-right shrink-0 ${row.dl !== null && row.dl < 30 ? "text-amber-500 font-semibold" : "text-neutral-400"}`}>
                {row.dl !== null ? `${row.dl}d` : "—"}
              </span>
              {/* Drill-down */}
              {isActive && !isAllRow && (
                <a href={`/project/${row.name.toLowerCase().replace(/\s+/g, "-")}`} onClick={(e) => e.stopPropagation()} className="p-1 rounded-lg hover:bg-neutral-200/60 transition-colors shrink-0">
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-500 hover:text-neutral-800 transition-colors" />
                </a>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}


// ── PROJECTS WIDGET VARIANTS ─────────────────────────────────

// V1 — Segmented bar (current, cleaned up)
function Pw1({ selId, setSel }: { selId: string; setSel: (id: string) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Projects</span>
          <span className="text-[9px] font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded-md">{PROJECTS.length}</span>
        </div>
        <span className="text-[8px] text-neutral-400">{totalTasks} tasks total</span>
      </div>
      <div className="w-full h-5 rounded-xl overflow-hidden flex gap-px">
        {PROJECTS.map(p => {
          const pct = (p.total / totalTasks) * 100;
          return (
            <button key={p.id} onClick={() => setSel(p.id)} style={{ width: `${pct}%` }}
              className={`h-full ${p.colorCls} ${selId === "all" || p.id === selId ? "opacity-100 ring-2 ring-inset ring-white/50" : "opacity-50 hover:opacity-80"} transition-all relative`}>
              {pct > 12 && <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">{p.total}</span>}
            </button>
          );
        })}
      </div>
      <div className="flex gap-4 mt-2">
        {PROJECTS.map(p => (
          <button key={p.id} onClick={() => setSel(p.id)}
            className={`flex items-center gap-1.5 transition-all ${selId === "all" || p.id === selId ? "opacity-100" : "opacity-40 hover:opacity-70"}`}>
            <div className={`w-2 h-2 rounded-sm ${p.colorCls}`} />
            <span className="text-[9px] font-semibold text-neutral-700">{p.name}</span>
            <span className="text-[9px] text-neutral-400">{p.total} · {Math.round((p.total/totalTasks)*100)}%</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Pw2 — Proportional pill row (refined segmented bar with gaps + floating labels)
function Pw2({ selId, setSel }: { selId: string; setSel: (id: string) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Projects</span>
          <span className="text-[9px] font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded-md">{PROJECTS.length}</span>
        </div>
        <span className="text-[8px] text-neutral-400">{totalTasks} tasks total</span>
      </div>
      {/* Labels above */}
      <div className="flex gap-1 mb-1">
        {PROJECTS.map(p => {
          const pct = (p.total / totalTasks) * 100;
          const isActive = selId === "all" || p.id === selId;
          return (
            <div key={p.id} style={{ width: `${pct}%` }} className="flex justify-center">
              <span className={`text-[8px] font-semibold transition-all truncate ${isActive ? "opacity-100" : "opacity-30"}`}
                style={{ color: p.color }}>{p.short} {p.total}</span>
            </div>
          );
        })}
      </div>
      {/* Pill bar with gaps */}
      <div className="flex gap-1 h-6">
        {PROJECTS.map(p => {
          const pct = (p.total / totalTasks) * 100;
          const isActive = selId === "all" || p.id === selId;
          const donePct = (p.done / p.total) * 100;
          return (
            <button key={p.id} onClick={() => setSel(p.id)}
              style={{ width: `${pct}%`, backgroundColor: p.color + "22", borderColor: p.color + "44" }}
              className={`relative h-full rounded-full border overflow-hidden transition-all ${isActive ? "opacity-100 shadow-sm" : "opacity-30 hover:opacity-60"}`}>
              {/* Done fill */}
              <div className="absolute inset-y-0 left-0 rounded-full transition-all"
                style={{ width: `${donePct}%`, backgroundColor: p.color }} />
            </button>
          );
        })}
      </div>
      {/* Legend below */}
      <div className="flex gap-4 mt-2">
        {PROJECTS.map(p => (
          <button key={p.id} onClick={() => setSel(p.id)}
            className={`flex items-center gap-1.5 transition-all ${selId === "all" || p.id === selId ? "opacity-100" : "opacity-40 hover:opacity-70"}`}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-[9px] text-neutral-500">{p.done}/{p.total} done</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Pw3 — Parliament / dot matrix (dots in a grid, grouped by project)
function Pw3({ selId, setSel }: { selId: string; setSel: (id: string) => void }) {
  const dots: { pid: string; isDone: boolean }[] = [];
  PROJECTS.forEach(p => {
    for (let i = 0; i < p.done; i++) dots.push({ pid: p.id, isDone: true });
    for (let i = 0; i < (p.total - p.done); i++) dots.push({ pid: p.id, isDone: false });
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Projects</span>
          <span className="text-[9px] font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded-md">{PROJECTS.length}</span>
        </div>
        <span className="text-[8px] text-neutral-400">{totalDone}/{totalTasks} done · 1 dot = 1 task</span>
      </div>
      <div className="flex flex-wrap gap-1.5 py-1">
        {dots.map((d, i) => {
          const p = PROJECTS.find(x => x.id === d.pid)!;
          const isActive = selId === "all" || selId === d.pid;
          return (
            <button key={i} onClick={() => setSel(d.pid)}
              title={`${p.name} · ${d.isDone ? "done" : "open"}`}
              className={`w-3.5 h-3.5 rounded-full transition-all ${isActive ? "opacity-100" : "opacity-20 hover:opacity-50"}`}
              style={{
                backgroundColor: d.isDone ? p.color : "transparent",
                border: `2px solid ${p.color}`,
              }}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-5 mt-2">
        {PROJECTS.map(p => (
          <button key={p.id} onClick={() => setSel(p.id)}
            className={`flex items-center gap-1.5 transition-all ${selId === "all" || p.id === selId ? "opacity-100" : "opacity-40 hover:opacity-70"}`}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-[9px] font-semibold text-neutral-700">{p.short}</span>
            <span className="text-[9px] text-neutral-400">{p.done}/{p.total}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3 text-[8px] text-neutral-400">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-neutral-400" /> filled = done
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-neutral-400" /> outline = open
          </span>
        </div>
      </div>
    </div>
  );
}

// Pw4 — Half-donut (SVG semicircle)
function Pw4({ selId, setSel }: { selId: string; setSel: (id: string) => void }) {
  const cx = 160, cy = 130, R = 110, r = 68;

  let offset = 0;
  const arcs = PROJECTS.map(p => {
    const frac = p.total / totalTasks;
    const arc = { pid: p.id, frac, offset, color: p.color, p };
    offset += frac;
    return arc;
  });

  function polarToXY(angleDeg: number, radius: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
  }

  function arcPath(startFrac: number, endFrac: number) {
    const startDeg = 180 - startFrac * 180;
    const endDeg   = 180 - endFrac   * 180;
    const oStart = polarToXY(startDeg, R);
    const oEnd   = polarToXY(endDeg,   R);
    const iStart = polarToXY(endDeg,   r);
    const iEnd   = polarToXY(startDeg, r);
    const large  = (endFrac - startFrac) > 0.5 ? 1 : 0;
    return `M ${oStart.x} ${oStart.y} A ${R} ${R} 0 ${large} 1 ${oEnd.x} ${oEnd.y} L ${iStart.x} ${iStart.y} A ${r} ${r} 0 ${large} 0 ${iEnd.x} ${iEnd.y} Z`;
  }

  const selProj = PROJECTS.find(p => p.id === selId);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Task Distribution</span>
          <span className="text-xs font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded-md">{PROJECTS.length} projects</span>
        </div>
        <span className="text-xs text-neutral-500">{totalTasks} tasks total</span>
      </div>
      <div className="flex flex-col items-center">
        {/* viewBox crops to just the arc — cy=130, top of arc at cy-R=20, so height=130 */}
        <svg width="100%" viewBox={`0 16 320 119`} className="overflow-visible">
          {arcs.map((arc) => {
            const isActive = selId === "all" || selId === arc.pid;
            const gap = 0.014;
            return (
              <path key={arc.pid}
                d={arcPath(arc.offset + gap / 2, arc.offset + arc.frac - gap / 2)}
                fill={arc.color}
                opacity={isActive ? 1 : 0.15}
                className="cursor-pointer transition-all hover:opacity-90"
                onClick={() => setSel(arc.pid)}
              />
            );
          })}
          <text x={cx} y={cy - 22} textAnchor="middle" fill="#171717" fontSize={28} fontWeight="800">
            {selProj ? selProj.total : totalTasks}
          </text>
          <text x={cx} y={cy - 5} textAnchor="middle" fill="#a3a3a3" fontSize={11}>
            {selProj ? `${selProj.short} tasks` : "total tasks"}
          </text>
        </svg>
        {/* Legend below — 2×2 grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 w-full px-2">
          <button onClick={() => setSel("all")}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all ${selId === "all" ? "bg-neutral-100" : "hover:bg-neutral-50 opacity-50 hover:opacity-80"}`}>
            <div className="flex gap-0.5 shrink-0">{PROJECTS.map(p => <div key={p.id} className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />)}</div>
            <span className="text-xs font-semibold text-neutral-700">All projects</span>
          </button>
          {PROJECTS.map(p => (
            <button key={p.id} onClick={() => setSel(p.id)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all ${selId === p.id ? "bg-neutral-100" : "hover:bg-neutral-50 opacity-50 hover:opacity-80"}`}>
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              <div className="text-left min-w-0">
                <div className="text-xs font-semibold text-neutral-700 truncate">{p.name}</div>
                <div className="text-[9px] text-neutral-400">{p.total} tasks · {Math.round((p.total / totalTasks) * 100)}%</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Pw5 — Full donut (SVG circle)
function Pw5({ selId, setSel }: { selId: string; setSel: (id: string) => void }) {
  const cx = 60, cy = 60, R = 54, r = 34;
  let offset = 0;

  function polarToXY(angleDeg: number, radius: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function arcPath(startFrac: number, endFrac: number) {
    const startDeg = startFrac * 360;
    const endDeg   = endFrac   * 360;
    const oStart = polarToXY(startDeg, R);
    const oEnd   = polarToXY(endDeg,   R);
    const iEnd   = polarToXY(endDeg,   r);
    const iStart = polarToXY(startDeg, r);
    const large  = (endFrac - startFrac) > 0.5 ? 1 : 0;
    return `M ${oStart.x} ${oStart.y} A ${R} ${R} 0 ${large} 1 ${oEnd.x} ${oEnd.y} L ${iEnd.x} ${iEnd.y} A ${r} ${r} 0 ${large} 0 ${iStart.x} ${iStart.y} Z`;
  }

  const arcs = PROJECTS.map(p => {
    const frac = p.total / totalTasks;
    const arc = { pid: p.id, frac, offset, color: p.color, p };
    offset += frac;
    return arc;
  });

  const selProj = PROJECTS.find(p => p.id === selId);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Projects</span>
          <span className="text-[9px] font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded-md">{PROJECTS.length}</span>
        </div>
        <span className="text-[8px] text-neutral-400">{totalTasks} tasks total</span>
      </div>
      <div className="flex items-center gap-5">
        <svg width={120} height={120} viewBox="0 0 120 120" className="shrink-0">
          {arcs.map((arc) => {
            const isActive = selId === "all" || selId === arc.pid;
            const gap = 0.015;
            return (
              <path key={arc.pid}
                d={arcPath(arc.offset + gap / 2, arc.offset + arc.frac - gap / 2)}
                fill={arc.color}
                opacity={isActive ? 1 : 0.15}
                className="cursor-pointer transition-all"
                transform={isActive && selId !== "all" ? `translate(${(polarToXY((arc.offset + arc.frac / 2) * 360, 5).x - cx)}, ${(polarToXY((arc.offset + arc.frac / 2) * 360, 5).y - cy)})` : ""}
                onClick={() => setSel(arc.pid)}
              />
            );
          })}
          {/* Center */}
          <text x={cx} y={cy - 6} textAnchor="middle" className="fill-neutral-800 font-bold" fontSize={14}>
            {selProj ? selProj.total : totalTasks}
          </text>
          <text x={cx} y={cy + 7} textAnchor="middle" className="fill-neutral-400" fontSize={7.5}>
            {selProj ? selProj.short : "all tasks"}
          </text>
          <text x={cx} y={cy + 17} textAnchor="middle" className="fill-neutral-400" fontSize={7}>
            {selProj ? `${Math.round((selProj.total/totalTasks)*100)}%` : ""}
          </text>
        </svg>
        {/* Legend + stats */}
        <div className="flex flex-col gap-2.5 flex-1">
          {PROJECTS.map(p => {
            const isActive = selId === "all" || p.id === selId;
            const pct = Math.round((p.total / totalTasks) * 100);
            return (
              <button key={p.id} onClick={() => setSel(p.id)}
                className={`flex items-center gap-2 transition-all ${isActive ? "opacity-100" : "opacity-25 hover:opacity-60"}`}>
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-[9px] font-semibold text-neutral-700 w-10 text-left">{p.short}</span>
                <div className="flex-1 h-1 rounded-full bg-neutral-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                </div>
                <span className="text-[9px] text-neutral-400 w-6 text-right">{pct}%</span>
              </button>
            );
          })}
          <button onClick={() => setSel("all")}
            className={`flex items-center gap-2 transition-all ${selId === "all" ? "opacity-100" : "opacity-40 hover:opacity-70"}`}>
            <div className="flex gap-0.5 shrink-0">{PROJECTS.map(p => <div key={p.id} className="w-1 h-2.5 rounded-sm" style={{ backgroundColor: p.color }} />)}</div>
            <span className="text-[9px] font-semibold text-neutral-500 w-10 text-left">All</span>
            <div className="flex-1 h-1 rounded-full bg-neutral-200" />
            <span className="text-[9px] text-neutral-400 w-6 text-right">100%</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectsWidget({ selId, setSel }: { selId: string; setSel: (id: string) => void }) {
  return (
    <div className="flex gap-3 items-stretch">
      <div className="min-w-0 flex flex-col justify-center" style={{ flexBasis: "30%", flexShrink: 0 }}>
        <Pw4 selId={selId} setSel={setSel} />
      </div>
      <div className="flex-1 min-w-0 rounded-2xl border border-neutral-200 overflow-hidden flex flex-col">
        <StoryCard selId={selId} />
      </div>
    </div>
  );
}

// ── STORY CARD ───────────────────────────────────────────────

const STORIES: Record<string, { headline: string; body: string; callouts: { label: string; value: string; sub: string }[] }> = {
  all: {
    headline: "Portfolio is moving, but pressure points are real.",
    body: "Across all three projects you're tracking 22 tasks with 7 done and 6 actively in progress. The Spot Particle project is the closest to the wire — deadline in 19 days with 3 tasks still open. Command Center v5 is early-stage with the most work ahead: 8 tasks untouched and a July deadline that may feel comfortable now but will compress fast once scope is clearer. NeuractReport v3 sits in the middle — steady progress, no blockers currently, but 4 tasks haven't been started. This week the priority should be clearing Spot's open items before the April 30 deadline.",
    callouts: [
      { label: "Closest deadline", value: "Apr 30", sub: "Spot Particle" },
      { label: "Most open tasks",  value: "8",       sub: "Command Center v5" },
      { label: "No blockers",      value: "NRv3",    sub: "only project" },
    ],
  },
  "1": {
    headline: "Command Center v5 is in early innings — foundation work now.",
    body: "You're 41 days into a 121-day project with only 20% completion and 10 weeks still on the clock. Right now there are 3 tasks actively being worked on and 1 task blocked. The blocked item is the most urgent thing to resolve — blockers at this stage tend to cascade. 8 tasks haven't started yet, which is normal for where you are, but the active-to-todo ratio suggests the team isn't fully ramped. The July 31 deadline is not at risk today, but the pace needs to pick up after the current sprint closes.",
    callouts: [
      { label: "Days remaining", value: "111d",  sub: "due Jul 31" },
      { label: "Blocked",        value: "1",     sub: "needs resolution" },
      { label: "Not started",    value: "8",     sub: "of 10 tasks" },
    ],
  },
  "2": {
    headline: "NeuractReport v3 is on track — no blockers, steady pace.",
    body: "27 days in with 33% done and no active blockers — this is your healthiest project right now. Two tasks are complete, two are in progress, and four haven't been picked up yet. The June 1 deadline gives you 51 days for 4 remaining open tasks, which is reasonable. The risk here is complacency: with no visible blockers the project can drift into low urgency. Consider pulling the next 2 todo tasks into active status this week to maintain momentum and avoid a crunch in May.",
    callouts: [
      { label: "Days remaining", value: "51d", sub: "due Jun 1" },
      { label: "Blockers",       value: "0",   sub: "clean slate" },
      { label: "To pick up",     value: "4",   sub: "todo tasks" },
    ],
  },
  "3": {
    headline: "Spot Particle is the most urgent — deadline in 19 days.",
    body: "April 30 is 19 days away and you have 3 tasks still open (1 active, 1 blocked, 1 todo). At 50% progress you're technically ahead of the midpoint, but the blocked task is the biggest risk — if it doesn't resolve this week it will eat directly into the final sprint. The todo task needs to be pulled in immediately. Spot is the only project currently behind on pace relative to time elapsed. Focus here should override any other project work until the April 30 ship date is secured.",
    callouts: [
      { label: "Days remaining", value: "19d",  sub: "due Apr 30" },
      { label: "Blocked",        value: "1",    sub: "urgent — resolve now" },
      { label: "Progress",       value: "50%",  sub: "ahead of pace" },
    ],
  },
};

function StoryCard({ selId }: { selId: string }) {
  const story = STORIES[selId] ?? STORIES["all"];
  const proj  = PROJECTS.find(p => p.id === selId);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-neutral-100">
        <div className="flex items-center gap-2 mb-2">
          {proj
            ? <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: proj.color }} />
            : <div className="flex gap-0.5">{PROJECTS.map(p => <div key={p.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />)}</div>
          }
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
            {proj ? proj.name : "All Projects"} · Project Brief
          </span>
        </div>
        <p className="text-sm font-semibold text-neutral-800 leading-snug">{story.headline}</p>
      </div>

      {/* Callouts */}
      <div className="grid grid-cols-3 divide-x divide-neutral-100 border-b border-neutral-100">
        {story.callouts.map((c, i) => (
          <div key={i} className="px-4 py-3">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-0.5">{c.label}</div>
            <div className="text-base font-bold text-neutral-900 leading-none mb-0.5">{c.value}</div>
            <div className="text-xs text-neutral-500">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 px-5 py-4 overflow-y-auto">
        <p className="text-xs text-neutral-600 leading-relaxed">{story.body}</p>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-neutral-100 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-neutral-500">Generated from live task data · {new Date("2026-04-11").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
      </div>
    </div>
  );
}

// ── V1A ──────────────────────────────────────────────────────

function V1A({ selId, setSel }: { selId: string; setSel: (id: string) => void }) {
  return (
    <div className="flex gap-4 h-full">
      {/* Left column — fixed height, no outer scroll */}
      <div className="min-w-0 h-full flex flex-col" style={{ flexBasis: "50%", flexShrink: 0 }}>
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm h-full flex flex-col overflow-hidden">
          {/* Fixed sections */}
          <div className="shrink-0 p-6 space-y-5">
            <OverallWidget />
            <KpiPerProject selId={selId} setSel={setSel} />
            <div className="border-t border-neutral-100 pt-5">
              <ProjectsWidget selId={selId} setSel={setSel} />
            </div>
          </div>
          {/* Task section scrolls independently */}
          <div className="flex-1 overflow-y-auto min-h-0 border-t border-neutral-100 px-6 py-5">
            <TasksWidget selId={selId} />
          </div>
        </div>
      </div>
      {/* Right column */}
      <div className="min-w-0 h-full" style={{ flexBasis: "50%" }}>
        <NotifPanel />
      </div>
    </div>
  );
}




// ── PAGE ─────────────────────────────────────────────────────

export default function TestLandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin";
  const [selProject, setSelProject] = useState("all");
  const [loaded, setLoaded] = useState(false);
  const [, forceUpdate] = useState(0);

  // Engineer flag
  const isEngineer = !loading && user && user.role === "engineer";

  useEffect(() => {
    Promise.all([fetchProjects(), fetchTasks(), fetchNotifications()])
      .then(([projects, tasks, notifs]) => {
        PROJECTS = projects.map((p: any) => ({
          id: p.id, name: p.name, short: p.short || p.name.slice(0, 4),
          progress: p.progress, done: p.done_count, total: p.task_count,
          active: p.active_count, blocked: p.blocked_count,
          target: p.target_date, start: p.start_date, color: p.color || "#3b82f6",
          description: p.description,
        }));
        ALL_TASKS = tasks.map((t: any) => ({
          id: t.id, title: t.title, project: PROJECTS.find((p: any) => p.id === t.project)?.short || "",
          status: t.status === "in_progress" ? "active" : t.status,
          due: t.due_date, est: t.estimated_hours ? `${t.estimated_hours}h` : "", priority: t.priority,
        }));
        NOTIFICATIONS = notifs.map((n: any) => ({
          id: n.id, cat: n.category, title: n.title, desc: n.description,
          project: n.project_short, from: n.from_user, time: n.time_ago,
          read: n.read, actions: n.actions || [],
        }));
        const activeTask = ALL_TASKS.find((t: any) => t.status === "active" && t.priority === "high");
        if (activeTask) FOCUS_TASK = { title: activeTask.title, due: activeTask.due, est: activeTask.est, project: activeTask.project };
        recomputeStats();
        setLoaded(true);
        forceUpdate(n => n + 1);
      })
      .catch(err => { console.error("API fetch failed:", err); setLoaded(true); });
  }, []);

  const selProj = PROJECTS.find(p => p.id === selProject);

  if (!loaded) {
    return (
      <div className="h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-sm font-bold mx-auto animate-pulse">N</div>
          <div className="text-sm text-neutral-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (PROJECTS.length === 0) {
    return (
      <div className="h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-sm font-bold mx-auto">N</div>
          <div className="text-sm text-neutral-500">No projects found</div>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="h-screen bg-neutral-100 overflow-hidden flex flex-col">
        {/* ── TOP BAR ── */}
        <div className="bg-white border-b border-neutral-200 px-5 py-2 flex items-center gap-3 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-xs font-bold shrink-0">N</div>
          <span className="text-sm font-semibold text-neutral-700">Portfolio Overview</span>
          <div className="flex-1" />
          <button className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${
            totalBlocked > 0 ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200" : "text-neutral-300 cursor-default"
          }`}>
            <Target className="w-3.5 h-3.5" /> Focus
          </button>
          <Link href="/calendar" className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <Calendar className="w-4 h-4 text-neutral-400" />
          </Link>
          <button className="relative p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <Bell className="w-4 h-4 text-neutral-400" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <Settings className="w-4 h-4 text-neutral-400" />
          </button>
          <UserAvatar />
        </div>
        <div className="flex-1 min-h-0">
          <AdminOverview />
        </div>
        <VoiceControlBar />
      </div>
    );
  }

  if (isEngineer) {
    return (
      <div className="h-screen bg-neutral-100 overflow-hidden flex flex-col">
        <div className="bg-white border-b border-neutral-200 px-5 py-2 flex items-center gap-3 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-xs font-bold shrink-0">N</div>
          <span className="text-sm font-semibold text-neutral-700">My Work</span>
          <div className="flex-1" />
          <Link href="/calendar" className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <Calendar className="w-4 h-4 text-neutral-400" />
          </Link>
          <button className="relative p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <Bell className="w-4 h-4 text-neutral-400" />
          </button>
          <UserAvatar />
        </div>
        <div className="flex-1 min-h-0 p-3">
          <V1A selId={selProject} setSel={setSelProject} />
        </div>
        <VoiceControlBar />
      </div>
    );
  }

  return (
    <div className="h-screen bg-neutral-100 overflow-hidden flex flex-col">
      {/* ── TOP BAR ── */}
      <div className="bg-white border-b border-neutral-200 px-5 py-2 flex items-center gap-3 shrink-0">
        <div className="w-6 h-6 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-xs font-bold shrink-0">N</div>
        <span className="text-sm font-semibold text-neutral-700">
          {selProj ? selProj.name : "All Projects"}
        </span>
        <div className="flex-1" />
        <button className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${
          totalBlocked > 0 ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200" : "text-neutral-300 cursor-default"
        }`}>
          <Target className="w-3.5 h-3.5" /> Focus
        </button>
        <Link href="/calendar" className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
          <Calendar className="w-4 h-4 text-neutral-400" />
        </Link>
        <button className="relative p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
          <Bell className="w-4 h-4 text-neutral-400" />
          <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
        <button className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
          <Settings className="w-4 h-4 text-neutral-400" />
        </button>
        <UserAvatar />
      </div>
      {/* ── DASHBOARD ── */}
      <div className="flex-1 p-3 overflow-hidden min-h-0">
        <V1A selId={selProject} setSel={setSelProject} />
      </div>
      <VoiceControlBar />
    </div>
  );
}
