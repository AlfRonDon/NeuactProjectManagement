"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, Settings, Target, Calendar, ChevronRight,
  TrendingUp, Activity, GitBranch, Flag, FileText,
  LayoutGrid, BarChart3, Plus,
} from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { usePMStore, selectDashboardProjects, selectDashboardStats } from "@/lib/store";
import { useAuth } from "@/lib/AuthProvider";
import ActivitiesFeed from "@/components/panels/ActivitiesFeed";
import CreateTaskModal from "@/components/modals/CreateTaskModal";
import CreateProjectModal from "@/components/modals/CreateProjectModal";

const CIRC = 2 * Math.PI * 42;

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/sprint", label: "Sprint", icon: TrendingUp },
  { href: "/risks", label: "Risks", icon: Flag },
  { href: "/people", label: "People", icon: Activity },
  { href: "/gantt", label: "Gantt", icon: BarChart3 },
  { href: "/dependencies", label: "Dependencies", icon: GitBranch },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/changelog", label: "Changelog", icon: FileText },
];

// Page title map
const PAGE_TITLES: Record<string, string> = {
  "/": "",
  "/calendar": "Calendar",
  "/sprint": "Sprint",
  "/risks": "Risks",
  "/people": "People",
  "/gantt": "Gantt",
  "/dependencies": "Dependencies",
  "/activity": "Activity",
  "/changelog": "Changelog",
};

function CreateDropdown({ onCreateTask, onCreateProject }: { onCreateTask: () => void; onCreateProject: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button onClick={() => setOpen(!open)}
        className="bg-neutral-900 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-neutral-800 transition-colors">
        <Plus className="w-3.5 h-3.5" /> Create
        <ChevronRight className={`w-3 h-3 opacity-40 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg border border-neutral-200 shadow-lg overflow-hidden min-w-[140px]">
            <button onClick={() => { setOpen(false); onCreateTask(); }}
              className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 transition-colors">
              <Plus className="w-3.5 h-3.5 text-neutral-400" /> Task
            </button>
            <div className="h-px bg-neutral-100" />
            <button onClick={() => { setOpen(false); onCreateProject(); }}
              className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 transition-colors">
              <Plus className="w-3.5 h-3.5 text-neutral-400" /> Project
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function GlobalHeader() {
  const { user } = useAuth();
  const pathname = usePathname();
  const projects = usePMStore(selectDashboardProjects);
  const { totalTasks, totalDone, totalBlocked, overallPct } = usePMStore(selectDashboardStats);
  const projectOptions = projects.map(p => ({ id: p.id, name: p.name, short: p.short }));

  const [showNotif, setShowNotif] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [showProject, setShowProject] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const deadlines = projects.map(p => {
    const target = (p as any).target || (p as any).target_date || "";
    return target ? Math.max(0, Math.ceil((new Date(target).getTime() - Date.now()) / 86400000)) : 999;
  }).filter(d => d > 0 && d < 999);
  const nearestDeadline = deadlines.length > 0 ? Math.min(...deadlines) : 0;

  // Page title from pathname
  const pageTitle = PAGE_TITLES[pathname] || "";
  const isProjectPage = pathname.startsWith("/project/");
  const isHome = pathname === "/";

  return (
    <>
      <div className="bg-white border-b border-neutral-100 px-4 py-1.5 flex items-center gap-3 shrink-0 z-30 relative">
        {/* Logo + title */}
        <Link href="/">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-md shrink-0 object-cover" />
        </Link>
        <Link href="/" className="text-lg font-serif font-semibold text-neutral-950 tracking-tight shrink-0 hover:opacity-80">
          Portfolio Overview
        </Link>

        {/* Progress ring */}
        <div className="w-px h-6 bg-neutral-200 shrink-0" />
        <div className="relative w-8 h-8 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border-subtle)" strokeWidth="7" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#3D3837" strokeWidth="7"
              strokeDasharray={`${(totalDone / (totalTasks || 1)) * CIRC} ${CIRC}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-mono font-bold text-neutral-950">{overallPct}%</span>
          </div>
        </div>

        {/* Greeting + stats */}
        <div className="flex-1 min-w-0">
          <div className="text-md font-semibold text-neutral-950">
            {greeting}, {user?.username || user?.firstName || "User"}
            {pageTitle && <span className="text-neutral-400 font-normal"> · {pageTitle}</span>}
          </div>
          <div className="text-md text-neutral-500">
            {"You've done "}<span className="font-semibold text-neutral-950">{totalDone}</span>{" of "}{totalTasks}{" tasks across "}<span className="font-semibold text-neutral-950">{projects.length}</span>{" projects."}
            {nearestDeadline > 0 && <>{" Next deadline in "}<span className="font-semibold text-neutral-950">{nearestDeadline} days</span>{"."}</>}
          </div>
        </div>

        {/* Create */}
        <CreateDropdown onCreateTask={() => setShowTask(true)} onCreateProject={() => setShowProject(true)} />

        <div className="w-px h-6 bg-neutral-200 shrink-0" />

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          {totalBlocked > 0 && (
            <button className="w-7 h-7 rounded-md bg-bad-bg flex items-center justify-center hover:bg-bad-bg/80 transition-colors" title="Blocked tasks">
              <Target className="w-3.5 h-3.5 text-bad-solid" />
            </button>
          )}
          <Link href="/calendar" className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-neutral-100 transition-colors" title="Calendar">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
          </Link>

          {/* Bell */}
          <div className="relative">
            <button onClick={() => { setShowNotif(!showNotif); setShowNav(false); }}
              className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${showNotif ? "bg-neutral-900" : "hover:bg-neutral-100"}`}>
              <Bell className={`w-3.5 h-3.5 ${showNotif ? "text-white" : "text-neutral-400"}`} />
            </button>
            {showNotif && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 w-[420px] h-[520px] rounded-lg border border-neutral-200 shadow-xl overflow-hidden">
                  <ActivitiesFeed />
                </div>
              </>
            )}
          </div>

          {/* Nav menu */}
          <div className="relative">
            <button onClick={() => { setShowNav(!showNav); setShowNotif(false); }}
              className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${showNav ? "bg-neutral-900" : "hover:bg-neutral-100"}`}>
              <Settings className={`w-3.5 h-3.5 ${showNav ? "text-white" : "text-neutral-400"}`} />
            </button>
            {showNav && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNav(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-lg border border-neutral-200 shadow-xl overflow-hidden min-w-[180px]">
                  <div className="px-3 py-2 border-b border-neutral-100">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Navigate</span>
                  </div>
                  {NAV_ITEMS.map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setShowNav(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                        pathname === item.href ? "text-neutral-950 bg-neutral-50 font-medium" : "text-neutral-700 hover:bg-neutral-50"
                      }`}>
                      <item.icon className="w-3.5 h-3.5 text-neutral-400" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <UserAvatar />
      </div>

      {/* Modals */}
      {showTask && <CreateTaskModal onClose={() => setShowTask(false)} projects={projectOptions} />}
      {showProject && <CreateProjectModal onClose={() => setShowProject(false)} />}
    </>
  );
}
