"use client";

import React, { useState } from "react";
import {
  Home,
  Briefcase,
  CalendarDays,
  ArrowLeft,
  Sparkles,
  Eye,
  Pencil,
  Map as MapIcon,
  BarChart3,
  Shield,
  GitBranch,
  Users,
  TrendingDown,
  LayoutGrid,
  Layers,
  Clock,
  AlertTriangle,
  Zap,
  ChevronRight,
} from "lucide-react";

import TimelineSwimLanes from "@/components/widgets/timeline-swimlanes";
import StoryMap from "@/components/widgets/story-map";
import DependencyGraph from "@/components/widgets/dependency-graph";
import Burndown from "@/components/widgets/burndown";
import RiskRadar from "@/components/widgets/risk-radar";
import PeopleHeatmap from "@/components/widgets/people-heatmap";
import TaskBoard from "@/components/widgets/task-board";
import {
  boardTasks,
  swimData,
  storyMapData,
  depGraphData,
  burndownData,
  riskData,
  peopleData,
} from "@/components/layouts/fixtures";

/* ─── Shared helpers ─── */
const TabBar: React.FC<{
  tabs: { id: string; label: string; icon?: React.ReactNode; badge?: string }[];
  active: string;
  onSelect: (id: string) => void;
  className?: string;
}> = ({ tabs, active, onSelect, className = "" }) => (
  <div className={`flex gap-1 ${className}`}>
    {tabs.map((t) => (
      <button
        key={t.id}
        onClick={() => onSelect(t.id)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          active === t.id
            ? "bg-neutral-900 text-white shadow-sm"
            : "text-neutral-500 hover:bg-neutral-100"
        }`}
      >
        {t.icon}
        {t.label}
        {t.badge && (
          <span className={`text-[10px] px-1 py-0.5 rounded ${active === t.id ? "bg-white/20" : "bg-neutral-200"}`}>
            {t.badge}
          </span>
        )}
      </button>
    ))}
  </div>
);

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800 transition-colors mb-3"
  >
    <ArrowLeft className="w-3.5 h-3.5" /> Back
  </button>
);

const Greeting: React.FC = () => (
  <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
    <h3 className="font-semibold text-neutral-800 mb-1">Good morning, Rohith</h3>
    <p className="text-xs text-neutral-500">3 tasks in progress, 1 blocker, Sprint 12 at 62%</p>
    <div className="flex gap-4 mt-3">
      {[
        { label: "In Progress", value: "3", color: "text-amber-600" },
        { label: "Blocked", value: "1", color: "text-red-600" },
        { label: "Done Today", value: "2", color: "text-green-600" },
      ].map((s) => (
        <div key={s.label} className="text-center">
          <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
          <div className="text-[10px] text-neutral-400">{s.label}</div>
        </div>
      ))}
    </div>
  </div>
);

const WidgetMap: Record<string, React.ReactNode> = {
  board: <TaskBoard tasks={boardTasks} />,
  timeline: <TimelineSwimLanes data={swimData} />,
  storymap: <StoryMap data={storyMapData} />,
  deps: <DependencyGraph data={depGraphData} />,
  burndown: <Burndown data={burndownData} />,
  risk: <RiskRadar data={riskData} />,
  team: <PeopleHeatmap data={peopleData} />,
};

const ProtoFrame: React.FC<{ title: string; tag: string; color: string; children: React.ReactNode }> = ({
  title,
  tag,
  color,
  children,
}) => (
  <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
    <div className={`px-4 py-2 border-b border-neutral-200 flex items-center gap-2 ${color}`}>
      <span className="text-xs font-bold uppercase tracking-wider opacity-60">{tag}</span>
      <span className="text-sm font-semibold">{title}</span>
    </div>
    <div className="h-[650px] overflow-auto p-4">{children}</div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   A) 3 Tabs
   ═══════════════════════════════════════════════════════════════ */
function Proto3Tabs() {
  const [tab, setTab] = useState("home");
  const [workSub, setWorkSub] = useState("board");
  const [planSub, setPlanSub] = useState("timeline");

  return (
    <ProtoFrame title="3 Tabs" tag="A" color="bg-blue-50 text-blue-800">
      <TabBar
        tabs={[
          { id: "home", label: "Home", icon: <Home className="w-3.5 h-3.5" /> },
          { id: "work", label: "Work", icon: <Briefcase className="w-3.5 h-3.5" /> },
          { id: "plan", label: "Plan", icon: <CalendarDays className="w-3.5 h-3.5" /> },
        ]}
        active={tab}
        onSelect={setTab}
        className="mb-4"
      />

      {tab === "home" && <Greeting />}

      {tab === "work" && (
        <>
          <TabBar
            tabs={[
              { id: "board", label: "Board" },
              { id: "storymap", label: "Story Map" },
            ]}
            active={workSub}
            onSelect={setWorkSub}
            className="mb-3"
          />
          {WidgetMap[workSub]}
        </>
      )}

      {tab === "plan" && (
        <>
          <TabBar
            tabs={[
              { id: "timeline", label: "Timeline" },
              { id: "deps", label: "Deps" },
              { id: "burndown", label: "Burndown" },
              { id: "risk", label: "Risk" },
            ]}
            active={planSub}
            onSelect={setPlanSub}
            className="mb-3"
          />
          {WidgetMap[planSub]}
        </>
      )}
    </ProtoFrame>
  );
}

/* ═══════════════════════════════════════════════════════════════
   B) 2+AI
   ═══════════════════════════════════════════════════════════════ */
function Proto2AI() {
  const [tab, setTab] = useState("home");
  const [taskSub, setTaskSub] = useState("board");
  const [insightSub, setInsightSub] = useState("burndown");

  return (
    <ProtoFrame title="2+AI" tag="B" color="bg-emerald-50 text-emerald-800">
      <TabBar
        tabs={[
          { id: "home", label: "Home", icon: <Home className="w-3.5 h-3.5" /> },
          { id: "tasks", label: "Tasks", icon: <Briefcase className="w-3.5 h-3.5" /> },
          { id: "insights", label: "Insights", icon: <Sparkles className="w-3.5 h-3.5" /> },
        ]}
        active={tab}
        onSelect={setTab}
        className="mb-4"
      />

      {tab === "home" && <Greeting />}

      {tab === "tasks" && (
        <>
          <TabBar
            tabs={[
              { id: "board", label: "Board" },
              { id: "timeline", label: "Timeline" },
              { id: "storymap", label: "Story Map" },
            ]}
            active={taskSub}
            onSelect={setTaskSub}
            className="mb-3"
          />
          {WidgetMap[taskSub]}
        </>
      )}

      {tab === "insights" && (
        <>
          <TabBar
            tabs={[
              { id: "burndown", label: "Sprint", badge: "AI" },
              { id: "risk", label: "Risk", badge: "AI" },
              { id: "deps", label: "Deps", badge: "AI" },
              { id: "team", label: "Team", badge: "AI" },
            ]}
            active={insightSub}
            onSelect={setInsightSub}
            className="mb-3"
          />
          <div className="mb-3 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 text-xs text-purple-700">
            <Sparkles className="w-3 h-3 inline mr-1" />
            AI-curated view with smart highlights and recommendations
          </div>
          {WidgetMap[insightSub]}
        </>
      )}
    </ProtoFrame>
  );
}

/* ═══════════════════════════════════════════════════════════════
   C) Zero Tabs
   ═══════════════════════════════════════════════════════════════ */
function ProtoZeroTabs() {
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const cards = [
    { id: "board", label: "Tasks", icon: <LayoutGrid className="w-6 h-6" />, color: "bg-blue-50 border-blue-200 text-blue-700" },
    { id: "deps", label: "Blockers", icon: <AlertTriangle className="w-6 h-6" />, color: "bg-red-50 border-red-200 text-red-700" },
    { id: "burndown", label: "Sprint", icon: <TrendingDown className="w-6 h-6" />, color: "bg-amber-50 border-amber-200 text-amber-700" },
    { id: "risk", label: "Risk", icon: <Shield className="w-6 h-6" />, color: "bg-purple-50 border-purple-200 text-purple-700" },
    { id: "timeline", label: "Timeline", icon: <Clock className="w-6 h-6" />, color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    { id: "team", label: "Team", icon: <Users className="w-6 h-6" />, color: "bg-teal-50 border-teal-200 text-teal-700" },
  ];

  const detailBar = ["board", "burndown", "risk", "deps", "timeline", "team"];

  return (
    <ProtoFrame title="Zero Tabs" tag="C" color="bg-amber-50 text-amber-800">
      {activeCard === null ? (
        <>
          <Greeting />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {cards.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCard(c.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:scale-105 hover:shadow-md ${c.color}`}
              >
                {c.icon}
                <span className="text-sm font-semibold">{c.label}</span>
                <ChevronRight className="w-4 h-4 opacity-40" />
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <BackButton onClick={() => setActiveCard(null)} />
          <div className="flex gap-1 mb-3 overflow-x-auto">
            {detailBar.map((id) => (
              <button
                key={id}
                onClick={() => setActiveCard(id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  activeCard === id ? "bg-neutral-900 text-white" : "text-neutral-400 hover:bg-neutral-100"
                }`}
              >
                {cards.find((c) => c.id === id)?.label}
              </button>
            ))}
          </div>
          {WidgetMap[activeCard]}
        </>
      )}
    </ProtoFrame>
  );
}

/* ═══════════════════════════════════════════════════════════════
   D) Mode Switcher
   ═══════════════════════════════════════════════════════════════ */
function ProtoModeSwitcher() {
  const [mode, setMode] = useState<string | null>(null);
  const [doSub, setDoSub] = useState("board");
  const [seeSub, setSeeSub] = useState("burndown");
  const [planSub, setPlanSub] = useState("timeline");

  const modes = [
    {
      id: "do",
      label: "DO",
      desc: "Get things done",
      color: "bg-blue-600",
      hoverColor: "hover:bg-blue-700",
      borderColor: "border-blue-400",
    },
    {
      id: "see",
      label: "SEE",
      desc: "Understand the state",
      color: "bg-amber-500",
      hoverColor: "hover:bg-amber-600",
      borderColor: "border-amber-400",
    },
    {
      id: "plan",
      label: "PLAN",
      desc: "Shape the future",
      color: "bg-purple-600",
      hoverColor: "hover:bg-purple-700",
      borderColor: "border-purple-400",
    },
  ];

  return (
    <ProtoFrame title="Mode Switcher" tag="D" color="bg-purple-50 text-purple-800">
      {mode === null ? (
        <>
          <Greeting />
          <div className="grid grid-cols-3 gap-4 mt-4">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl text-white transition-all hover:scale-105 hover:shadow-xl ${m.color} ${m.hoverColor}`}
              >
                <span className="text-2xl font-black tracking-wider">{m.label}</span>
                <span className="text-xs opacity-80">{m.desc}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <BackButton onClick={() => setMode(null)} />

          {mode === "do" && (
            <>
              <TabBar
                tabs={[
                  { id: "board", label: "Board" },
                  { id: "storymap", label: "Queue" },
                ]}
                active={doSub}
                onSelect={setDoSub}
                className="mb-3"
              />
              {WidgetMap[doSub]}
            </>
          )}

          {mode === "see" && (
            <>
              <TabBar
                tabs={[
                  { id: "burndown", label: "Sprint" },
                  { id: "risk", label: "Risk" },
                  { id: "deps", label: "Deps" },
                  { id: "team", label: "Team" },
                ]}
                active={seeSub}
                onSelect={setSeeSub}
                className="mb-3"
              />
              {WidgetMap[seeSub]}
            </>
          )}

          {mode === "plan" && (
            <>
              <TabBar
                tabs={[
                  { id: "timeline", label: "Timeline" },
                  { id: "storymap", label: "Story Map" },
                ]}
                active={planSub}
                onSelect={setPlanSub}
                className="mb-3"
              />
              {WidgetMap[planSub]}
            </>
          )}
        </>
      )}
    </ProtoFrame>
  );
}

/* ═══════════════════════════════════════════════════════════════
   E) Hub & Spoke
   ═══════════════════════════════════════════════════════════════ */
function ProtoHubSpoke() {
  const [spoke, setSpoke] = useState<string | null>(null);

  const spokes = [
    { id: "board", label: "Tasks", icon: <LayoutGrid className="w-8 h-8" />, color: "bg-blue-500", lightBg: "bg-blue-50" },
    { id: "deps", label: "Dependencies", icon: <GitBranch className="w-8 h-8" />, color: "bg-red-500", lightBg: "bg-red-50" },
    { id: "burndown", label: "Sprint", icon: <TrendingDown className="w-8 h-8" />, color: "bg-amber-500", lightBg: "bg-amber-50" },
    { id: "risk", label: "Risk", icon: <Shield className="w-8 h-8" />, color: "bg-purple-500", lightBg: "bg-purple-50" },
    { id: "timeline", label: "Timeline", icon: <Clock className="w-8 h-8" />, color: "bg-emerald-500", lightBg: "bg-emerald-50" },
    { id: "team", label: "Team", icon: <Users className="w-8 h-8" />, color: "bg-teal-500", lightBg: "bg-teal-50" },
  ];

  return (
    <ProtoFrame title="Hub & Spoke" tag="E" color="bg-teal-50 text-teal-800">
      {spoke === null ? (
        <>
          <Greeting />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
            {spokes.map((s) => (
              <button
                key={s.id}
                onClick={() => setSpoke(s.id)}
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl border border-neutral-200 transition-all hover:scale-105 hover:shadow-lg ${s.lightBg}`}
              >
                <div className={`w-14 h-14 rounded-xl ${s.color} text-white flex items-center justify-center shadow-sm`}>
                  {s.icon}
                </div>
                <span className="text-sm font-semibold text-neutral-700">{s.label}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <BackButton onClick={() => setSpoke(null)} />
          {WidgetMap[spoke]}
        </>
      )}
    </ProtoFrame>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════ */
export default function NavTreePage() {
  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-neutral-900">Navigation Feel</h1>
          <p className="text-neutral-500 text-lg">
            5 interactive navigation prototypes -- click through and feel the flow
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Proto3Tabs />
          <Proto2AI />
          <ProtoZeroTabs />
          <ProtoModeSwitcher />
          <ProtoHubSpoke />
        </div>
      </div>
    </div>
  );
}
