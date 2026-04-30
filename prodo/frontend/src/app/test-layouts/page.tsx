"use client";

import React, { useState } from "react";
import {
  Monitor,
  ListTodo,
  SplitSquareHorizontal,
  Layout,
  Target,
  Briefcase,
  Calendar,
  Clock,
  Users,
  BarChart3,
  AlertTriangle,
  Layers,
  Siren,
  PanelLeftClose,
  LayoutPanelLeft,
  PanelTop,
  Rows3,
  User,
  UserCog,
  Flag,
  Edit3,
  GitBranch,
  Activity,
  Shield,
  Flame,
  Layers as LayersIcon,
  Globe,
  Mic,
  RefreshCcw,
  Inbox,
  Columns3,
  Crosshair,
  Timer,
  FileText,
  GitCompareArrows,
} from "lucide-react";

import {
  CommandCenterLayout,
  ActivityFeedLayout,
  SplitPaneLayout,
  MissionControlLayout,
  FocusModeLayout,
  ExecutiveLayout,
  CalendarLayout,
  CalendarAgendaLayout,
  CalendarTimelineLayout,
  CalendarHeatmapLayout,
  CalendarDeadlineLayout,
  CalendarSplitLayout,
  WarRoomLayout,
  ClientPortalLayout,
  VoiceFirstLayout,
  RetroLayout,
  NotificationHubLayout,
  KanbanSwimlaneLayout,
  OKRTrackerLayout,
  TimeboxLayout,
  ChangelogLayout,
  ComparisonLayout,
  ProjectPageVariantA,
  ProjectPageVariantB,
  ProjectPageVariantC,
  ProjectPageVariantD,
  EngineerOverviewA,
  EngineerOverviewB,
  AdminOverviewA,
  AdminOverviewB,
  TaskDetailVariantA,
  TaskDetailVariantB,
  TaskDetailVariantC,
  AdminOverviewVariantA,
  AdminOverviewVariantB,
  AdminOverviewVariantC,
  AdminOverviewVariantD,
  AdminOverviewVariantE,
  ProjectSummaryVariantA,
  ProjectSummaryVariantB,
  ProjectSummaryVariantC,
  ProjectSummaryVariantD,
  StageMapVariantA,
  StageMapVariantB,
  StageMapVariantC,
  StageMapVariantD,
  BottomWidgetVariantA,
  BottomWidgetVariantB,
  BottomWidgetVariantC,
  BottomWidgetVariantD,
  BottomWidgetVariantE,
  BottomWidgetVariantF,
  BottomWidgetVariantG,
  BottomWidgetVariantH,
} from "@/components/layouts";

interface LayoutEntry {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  who: string;
  philosophy: string;
  set: number;
  component: React.ReactNode;
}

const layouts: LayoutEntry[] = [
  // Set 1 - Nav Patterns
  {
    id: "command-center",
    name: "Command Center",
    description: "Dense, multi-panel overview with all critical data at a glance",
    icon: <Monitor className="w-5 h-5" />,
    who: "Engineering leads who want everything visible simultaneously",
    philosophy: "Information density over simplicity. Every pixel earns its place.",
    set: 1,
    component: <CommandCenterLayout />,
  },
  {
    id: "activity-feed",
    name: "Activity Feed",
    description: "Chronological stream of project events and updates",
    icon: <ListTodo className="w-5 h-5" />,
    who: "Team members who want a timeline of what happened",
    philosophy: "Recency matters. The stream is the source of truth.",
    set: 1,
    component: <ActivityFeedLayout />,
  },
  {
    id: "split-pane",
    name: "Split Pane",
    description: "Side-by-side panels for context + detail",
    icon: <SplitSquareHorizontal className="w-5 h-5" />,
    who: "Power users who work with two views simultaneously",
    philosophy: "Context switching is expensive. Show both sides at once.",
    set: 1,
    component: <SplitPaneLayout />,
  },
  {
    id: "mission-control",
    name: "Mission Control",
    description: "NASA-style status board with health indicators",
    icon: <Layout className="w-5 h-5" />,
    who: "Ops teams monitoring multiple workstreams",
    philosophy: "Status at a glance. Green means go, red means stop.",
    set: 1,
    component: <MissionControlLayout />,
  },
  {
    id: "focus-mode",
    name: "Focus Mode",
    description: "Distraction-free single-task view",
    icon: <Target className="w-5 h-5" />,
    who: "ICs in deep work who need minimal UI",
    philosophy: "Less is more. One task, full attention.",
    set: 1,
    component: <FocusModeLayout />,
  },
  // Set 2 - Personas
  {
    id: "executive",
    name: "Executive",
    description: "High-level portfolio view with KPI summaries",
    icon: <Briefcase className="w-5 h-5" />,
    who: "CTOs and stakeholders who need the 30,000ft view",
    philosophy: "Aggregate, summarize, highlight exceptions.",
    set: 2,
    component: <ExecutiveLayout />,
  },
  {
    id: "cal-week-month",
    name: "Calendar (Week/Month)",
    description: "Toggle between weekly and monthly grid views with status-colored task chips",
    icon: <Calendar className="w-5 h-5" />,
    who: "PMs who need a classic calendar overview of sprint work",
    philosophy: "Time is the primary axis. Toggle granularity to see the forest or the trees.",
    set: 2,
    component: <CalendarLayout />,
  },
  {
    id: "cal-agenda",
    name: "Calendar (Agenda)",
    description: "Day-by-day vertical timeline with hourly time slots",
    icon: <Clock className="w-5 h-5" />,
    who: "ICs planning their workday hour by hour",
    philosophy: "One day, full focus. Map tasks to time blocks to commit to a schedule.",
    set: 2,
    component: <CalendarAgendaLayout />,
  },
  {
    id: "cal-timeline",
    name: "Calendar (Timeline)",
    description: "Gantt-style horizontal swimlanes grouped by assignee across 4 weeks",
    icon: <Users className="w-5 h-5" />,
    who: "Leads tracking who is working on what and when it overlaps",
    philosophy: "People × time. See capacity conflicts and handoff gaps at a glance.",
    set: 2,
    component: <CalendarTimelineLayout />,
  },
  {
    id: "cal-heatmap",
    name: "Calendar (Heatmap)",
    description: "Month grid where each cell is colored by workload intensity",
    icon: <BarChart3 className="w-5 h-5" />,
    who: "Managers spotting overloaded days before they become crunch",
    philosophy: "Density reveals risk. Red days need redistribution, not heroics.",
    set: 2,
    component: <CalendarHeatmapLayout />,
  },
  {
    id: "cal-deadline",
    name: "Calendar (Deadlines)",
    description: "Tasks grouped into urgency bands — overdue, today, this week, later",
    icon: <AlertTriangle className="w-5 h-5" />,
    who: "Anyone triaging what needs attention right now vs. what can wait",
    philosophy: "Urgency first. Group by countdown, not by project or assignee.",
    set: 2,
    component: <CalendarDeadlineLayout />,
  },
  {
    id: "cal-split",
    name: "Calendar (Split)",
    description: "Week list on the left, click a day to see full task detail on the right",
    icon: <Layers className="w-5 h-5" />,
    who: "PMs who want overview + detail without switching pages",
    philosophy: "Master-detail pattern. Browse the week, drill into the day.",
    set: 2,
    component: <CalendarSplitLayout />,
  },
  {
    id: "war-room",
    name: "War Room",
    description: "Crisis mode with escalation paths and live status",
    icon: <Siren className="w-5 h-5" />,
    who: "Teams in crunch mode or incident response",
    philosophy: "Urgency drives layout. Blockers front and center.",
    set: 2,
    component: <WarRoomLayout />,
  },
  {
    id: "client-portal",
    name: "Client Portal",
    description: "External-facing progress view for stakeholders",
    icon: <Globe className="w-5 h-5" />,
    who: "Clients and external stakeholders",
    philosophy: "Transparency without overwhelm. Curated, polished.",
    set: 2,
    component: <ClientPortalLayout />,
  },
  {
    id: "voice-first",
    name: "Voice First",
    description: "Voice-optimized with large touch targets and audio feedback",
    icon: <Mic className="w-5 h-5" />,
    who: "Users who prefer voice interaction over clicking",
    philosophy: "Hands-free is the future. Voice as primary input.",
    set: 2,
    component: <VoiceFirstLayout />,
  },
  {
    id: "retro",
    name: "Retrospective",
    description: "Sprint review with burndown analysis and action items",
    icon: <RefreshCcw className="w-5 h-5" />,
    who: "Scrum masters running retrospectives",
    philosophy: "Reflect, learn, improve. Data-driven retrospectives.",
    set: 2,
    component: <RetroLayout />,
  },
  // Set 3 - Specialized
  {
    id: "notification-hub",
    name: "Notification Hub",
    description: "Centralized notification center with filtering",
    icon: <Inbox className="w-5 h-5" />,
    who: "Anyone drowning in notifications who needs triage",
    philosophy: "Not all signals are equal. Filter ruthlessly.",
    set: 3,
    component: <NotificationHubLayout />,
  },
  {
    id: "kanban-swimlane",
    name: "Kanban Swimlane",
    description: "Board view with swimlane grouping by team/epic",
    icon: <Columns3 className="w-5 h-5" />,
    who: "Teams using kanban who need cross-cutting views",
    philosophy: "Flow over phases. Visualize work in progress.",
    set: 3,
    component: <KanbanSwimlaneLayout />,
  },
  {
    id: "okr-tracker",
    name: "OKR Tracker",
    description: "Objective and key result tracking with progress bars",
    icon: <Crosshair className="w-5 h-5" />,
    who: "Leaders tracking strategic objectives",
    philosophy: "Outcomes over outputs. Measure what matters.",
    set: 3,
    component: <OKRTrackerLayout />,
  },
  {
    id: "timebox",
    name: "Timebox",
    description: "Pomodoro-style time-blocked work sessions",
    icon: <Timer className="w-5 h-5" />,
    who: "ICs who use time-boxing to stay productive",
    philosophy: "Constraint breeds focus. Time-box everything.",
    set: 3,
    component: <TimeboxLayout />,
  },
  {
    id: "changelog",
    name: "Changelog",
    description: "Release-oriented view of completed work",
    icon: <FileText className="w-5 h-5" />,
    who: "DevRel and PMs preparing release notes",
    philosophy: "Ship, then tell. Celebrate completed work.",
    set: 3,
    component: <ChangelogLayout />,
  },
  {
    id: "comparison",
    name: "Comparison",
    description: "Side-by-side sprint or project comparison",
    icon: <GitCompareArrows className="w-5 h-5" />,
    who: "Leads comparing sprint-over-sprint performance",
    philosophy: "Context requires comparison. Show the delta.",
    set: 3,
    component: <ComparisonLayout />,
  },

  // Set 4 — Project Page
  {
    id: "proj-split-flat",
    name: "Project: Flat + Stacked",
    description: "Filter pills + flat task list left, stacked overview (KPI → Timeline → Changelog) or tabbed task detail right",
    icon: <PanelLeftClose className="w-5 h-5" />,
    who: "PMs who want quick filtering and a scrollable overview with drill-down into any task",
    philosophy: "Filter first, overview by default, detail on demand. Flat list keeps it simple.",
    set: 4,
    component: <ProjectPageVariantA />,
  },
  {
    id: "proj-grouped-tabbed",
    name: "Project: Grouped + Tabbed",
    description: "Tasks grouped by status left, top-level Overview/Changelog tabs right with task detail override",
    icon: <LayoutPanelLeft className="w-5 h-5" />,
    who: "Leads who think in status categories and want clear section separation",
    philosophy: "Status is the primary axis. Group left, tab right. Selection overrides tabs.",
    set: 4,
    component: <ProjectPageVariantB />,
  },
  {
    id: "proj-narrow-stacked",
    name: "Project: Narrow + Top/Bottom",
    description: "Narrow task sidebar, overview always visible on top, task detail slides up from bottom",
    icon: <PanelTop className="w-5 h-5" />,
    who: "People who never want to lose the overview context even when viewing a task",
    philosophy: "Context persists. Overview shrinks but never disappears. Task detail is additive.",
    set: 4,
    component: <ProjectPageVariantC />,
  },
  {
    id: "proj-three-col",
    name: "Project: Three Columns",
    description: "Task list | Task detail | Project context — maximum information density, everything visible",
    icon: <Rows3 className="w-5 h-5" />,
    who: "Power users on wide screens who want task detail + project context simultaneously",
    philosophy: "No modes, no tabs, no hiding. Everything visible at once. Density over simplicity.",
    set: 4,
    component: <ProjectPageVariantD />,
  },
  {
    id: "proj-engineer-mywork",
    name: "Engineer: My Work",
    description: "Personal task view — urgent items on top, my active work, blocked downstream, up next, completed",
    icon: <User className="w-5 h-5" />,
    who: "Engineers who receive tasks and need to see their own workload, blockers, and queue",
    philosophy: "What do I need to do right now? Show urgency, then flow, then backlog.",
    set: 4,
    component: <EngineerOverviewA />,
  },
  {
    id: "proj-engineer-focus",
    name: "Engineer: Focus Mode",
    description: "One task at a time — current focus card, today's ordered plan, momentum streak",
    icon: <Target className="w-5 h-5" />,
    who: "ICs who want minimal distraction and a clear next action",
    philosophy: "Reduce to essentials. One focus, one plan, one streak. Everything else fades.",
    set: 4,
    component: <EngineerOverviewB />,
  },
  {
    id: "proj-admin-dashboard",
    name: "Admin: Dashboard",
    description: "KPIs, risk flags, team workload bars, timeline, and changelog — full project health",
    icon: <BarChart3 className="w-5 h-5" />,
    who: "Managers and leads who need the full picture — progress, people, risks, releases",
    philosophy: "See everything. KPIs up top, risks flagged, team load visible, history tracked.",
    set: 4,
    component: <AdminOverviewA />,
  },
  {
    id: "proj-admin-triage",
    name: "Admin: Triage",
    description: "Blockers first, overdue, unassigned tasks, per-person status, sprint velocity",
    icon: <Flag className="w-5 h-5" />,
    who: "Leads running standups who need to know what's stuck, who's overloaded, and what needs an owner",
    philosophy: "Action-oriented. Problems first, people second, velocity for context. Fix it now.",
    set: 4,
    component: <AdminOverviewB />,
  },
  {
    id: "task-detail",
    name: "Task: Detail",
    description: "Rich task view — description, subtasks with checkboxes, field grid with reassign, comments with @mentions, add subtask",
    icon: <Edit3 className="w-5 h-5" />,
    who: "Anyone viewing or working on a task — engineers update progress, admins reassign and comment",
    philosophy: "Everything about one task. Description, subtasks, fields, discussion — all in one scrollable pane.",
    set: 4,
    component: <TaskDetailVariantA />,
  },
  {
    id: "task-deps",
    name: "Task: Dependencies",
    description: "Visual dependency chain — upstream (depends on), current task, downstream (blocks), impact analysis if delayed",
    icon: <GitBranch className="w-5 h-5" />,
    who: "Leads and engineers assessing what's blocking what and the ripple effect of delays",
    philosophy: "Show the chain. Upstream resolved? Downstream waiting? What breaks if this slips?",
    set: 4,
    component: <TaskDetailVariantB />,
  },
  {
    id: "task-timeline",
    name: "Task: Timeline",
    description: "Gantt chart with all project tasks, current task highlighted, plus activity log with status/comment/edit history",
    icon: <Activity className="w-5 h-5" />,
    who: "Anyone needing temporal context — where this task sits relative to others and what happened recently",
    philosophy: "Time context + activity history. See the task in the project timeline and trace every change.",
    set: 4,
    component: <TaskDetailVariantC />,
  },

  // Set 5 — Admin Overview
  {
    id: "admin-ov-executive",
    name: "Executive Summary",
    description: "Big KPI cards, project health traffic lights, velocity chart, team utilization bars, milestone countdown",
    icon: <BarChart3 className="w-5 h-5" />,
    who: "C-level or stakeholders who want the 30-second read on everything",
    philosophy: "Numbers tell the story. Health at a glance, trends for context, deadlines for urgency.",
    set: 5,
    component: <AdminOverviewVariantA />,
  },
  {
    id: "admin-ov-health",
    name: "Health Monitor",
    description: "Dark theme. Progress rings per project, risk assessment bars, blocker cards, velocity bars, deadline proximity",
    icon: <Shield className="w-5 h-5" />,
    who: "Ops-minded leads who think in terms of system health and alerts",
    philosophy: "War-room aesthetic. Green/amber/red everywhere. Problems glow, healthy fades.",
    set: 5,
    component: <AdminOverviewVariantB />,
  },
  {
    id: "admin-ov-team",
    name: "Team & Workload",
    description: "Per-person cards with capacity gauge, task breakdown, project contribution bars",
    icon: <Users className="w-5 h-5" />,
    who: "Managers focused on people — who's overloaded, who has capacity, who's delivering",
    philosophy: "People first. Projects are the context, people are the constraint.",
    set: 5,
    component: <AdminOverviewVariantC />,
  },
  {
    id: "admin-ov-triage",
    name: "Action Triage",
    description: "What needs attention NOW — blocker cards, overdue items, unassigned tasks, at-risk projects, deadline warnings",
    icon: <Flame className="w-5 h-5" />,
    who: "Leads running standups or doing daily triage — action-oriented, not analytical",
    philosophy: "Don't show me what's fine. Show me what's broken, stuck, or about to slip.",
    set: 5,
    component: <AdminOverviewVariantD />,
  },
  {
    id: "admin-ov-compact",
    name: "Compact Dashboard",
    description: "Everything on one screen — inline KPIs, project bars with health dots, risk+team split, blockers+milestones split",
    icon: <LayersIcon className="w-5 h-5" />,
    who: "Power users who want maximum density — every metric visible without scrolling",
    philosophy: "No cards, no padding, no wasted space. Data wall. Scan, don't click.",
    set: 5,
    component: <AdminOverviewVariantE />,
  },

  // Set 6 — Project Summary Widget
  {
    id: "psw-cards",
    name: "Summary: Card Stack",
    description: "Dark overall KPI card, per-project cards with progress bars and stats, distribution bar, AI brief",
    icon: <BarChart3 className="w-5 h-5" />,
    who: "Admins who want rich detail per project with clear visual hierarchy",
    philosophy: "Each project gets its own card. Big numbers on top, AI at the bottom.",
    set: 6,
    component: <ProjectSummaryVariantA />,
  },
  {
    id: "psw-ring",
    name: "Summary: Ring + Rows",
    description: "Big donut ring showing done/total, stat list, compact project rows with inline bars, deadline countdown, AI summary",
    icon: <Target className="w-5 h-5" />,
    who: "Admins who want a visual center (the ring) with data radiating outward",
    philosophy: "The ring is the anchor. Everything else supports it.",
    set: 6,
    component: <ProjectSummaryVariantB />,
  },
  {
    id: "psw-dark",
    name: "Summary: Dark Health",
    description: "Dark theme. Progress arc, health traffic lights per project, blocker callout, AI brief",
    icon: <Shield className="w-5 h-5" />,
    who: "Ops-minded admins who want a monitoring-style view",
    philosophy: "Status lights and arcs. Problems glow red, healthy fades into the dark.",
    set: 6,
    component: <ProjectSummaryVariantC />,
  },
  {
    id: "psw-minimal",
    name: "Summary: Minimal Wall",
    description: "No cards, no decoration. Inline progress, segmented project bars, pure data density, AI one-liner",
    icon: <LayersIcon className="w-5 h-5" />,
    who: "Power users who want to scan fast — zero visual noise",
    philosophy: "Data, not decoration. Every pixel is a number or a bar.",
    set: 6,
    component: <ProjectSummaryVariantD />,
  },

  // Set 7 — Stage Map
  {
    id: "stage-pipeline",
    name: "Progress Pipeline",
    description: "Horizontal pipeline per project — each stage is a segment with progress bar and task chips showing status",
    icon: <Activity className="w-5 h-5" />,
    who: "Admins who think in sequential phases — see exactly where each project is in the pipeline",
    philosophy: "Left to right = progress. Fill = completion. Color = status.",
    set: 7,
    component: <StageMapVariantA />,
  },
  {
    id: "stage-board",
    name: "Stage Board",
    description: "Table grid — projects as rows, stages as columns. Each cell shows done/total count with status icon and color badge",
    icon: <LayoutPanelLeft className="w-5 h-5" />,
    who: "Admins who want a quick matrix scan — which project is stuck at which stage",
    philosophy: "Cross-reference instantly. Row = project, column = stage, color = health.",
    set: 7,
    component: <StageMapVariantB />,
  },
  {
    id: "stage-cards",
    name: "Phase Cards",
    description: "Per-project card rows with mini completion rings, task lists per phase, arrows between stages",
    icon: <Target className="w-5 h-5" />,
    who: "Admins who want detail per phase — see individual tasks and their status within each stage",
    philosophy: "Rings show %, task lists show what. Cards give context at every level.",
    set: 7,
    component: <StageMapVariantC />,
  },
  {
    id: "stage-heat",
    name: "Heat Grid",
    description: "Dark theme matrix — cell color intensity shows stage health. Task names visible, done/total counts, completion checks",
    icon: <Shield className="w-5 h-5" />,
    who: "Ops-minded admins who want a monitoring-style heatmap of project stages",
    philosophy: "Color is the signal. Green = clear, red = problem, amber = in flight.",
    set: 7,
    component: <StageMapVariantD />,
  },

  // Set 8 — Combined Bottom Widget
  {
    id: "bottom-3col",
    name: "Bottom: Three Columns",
    description: "People heatmap (35%) | Risk bars + AI (30%) | Stage board (35%) — all visible at once",
    icon: <LayoutPanelLeft className="w-5 h-5" />,
    who: "Admins who want team, risk, and stage progress in one glance without clicking",
    philosophy: "Three data streams, one row. No tabs, no hiding.",
    set: 8,
    component: <BottomWidgetVariantA />,
  },
  {
    id: "bottom-tabbed",
    name: "Bottom: Tabbed Panel",
    description: "Single full-width panel with tabs: Team Load (cards) | Risk Radar (grid) | Stage Board (table)",
    icon: <PanelTop className="w-5 h-5" />,
    who: "Admins who prefer one thing at a time with room to breathe",
    philosophy: "Full width per view. Tabs trade density for clarity.",
    set: 8,
    component: <BottomWidgetVariantB />,
  },
  {
    id: "bottom-stacked",
    name: "Bottom: Two Rows",
    description: "Top: People heatmap (60%) + Risk bars (40%). Bottom: Stage board full width",
    icon: <Rows3 className="w-5 h-5" />,
    who: "Admins who want people+risk paired, stages separate",
    philosophy: "Group by relevance. People and risk are about capacity, stages are about progress.",
    set: 8,
    component: <BottomWidgetVariantC />,
  },
  {
    id: "bottom-dark",
    name: "Bottom: Dark Dashboard",
    description: "Dark theme, three equal columns. Compact heatmap cells, risk bars, stage grids — maximum density",
    icon: <Shield className="w-5 h-5" />,
    who: "Power users who want a war-room monitoring strip",
    philosophy: "Dark, dense, data-first. Everything glows against the background.",
    set: 8,
    component: <BottomWidgetVariantD />,
  },
  {
    id: "bottom-risk-stage-ai",
    name: "Bottom: Risk + Stage + AI",
    description: "Risk bars (40%) | AI Brief (20%) | Stage board (40%) — no people, full focus on delivery",
    icon: <Shield className="w-5 h-5" />,
    who: "Leads who want risk, progress, and AI insights without team load",
    philosophy: "Risk and outcome. What could go wrong, and where are we? Let AI guide decisions.",
    set: 8,
    component: <BottomWidgetVariantE />,
  },
  {
    id: "bottom-risk-stage-summary",
    name: "Bottom: Risk + Stage + AI Summary",
    description: "Top: Risk bars + Stage grid. Bottom: AI brief with Risk Radar & Sprint callouts",
    icon: <AlertTriangle className="w-5 h-5" />,
    who: "Leads in standups who need risk + status + AI insights in sequence",
    philosophy: "Top tells the story (risk + progress), bottom tells the lesson (AI + context).",
    set: 8,
    component: <BottomWidgetVariantF />,
  },
  {
    id: "bottom-risk-cards",
    name: "Bottom: Cards + AI",
    description: "Risk cards (left) | Stage progress columns (center) | AI insights (right)",
    icon: <Briefcase className="w-5 h-5" />,
    who: "Admins who want compact card-based risk + stage view with AI guidance",
    philosophy: "Cards are scannable. Grid columns show progress. AI on the right guides next steps.",
    set: 8,
    component: <BottomWidgetVariantG />,
  },
  {
    id: "kpi-dashboard-50vw",
    name: "KPI Dashboard (50VW)",
    description: "Project selector | Story phases (Research/Design/Build/Test/Ship) | Risk radar | Sprint chart",
    icon: <BarChart3 className="w-5 h-5" />,
    who: "Leads & Engineers tracking project progress with risk and sprint visibility",
    philosophy: "Vertical stack in 50% screen width: phases show development pipeline, risk radar shows assessment, burndown shows sprint health. Project-switchable.",
    set: 8,
    component: <BottomWidgetVariantH />,
  },
];

const SET_LABELS: Record<number, string> = {
  1: "Nav Patterns",
  2: "Personas",
  3: "Specialized",
  4: "Project Page",
  5: "Admin Overview",
  6: "Project Summary Widget",
  7: "Stage Map",
  8: "Combined Bottom Widget",
};

type FilterTab = "all" | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export default function TestLayoutsPage() {
  const [activeLayout, setActiveLayout] = useState(layouts[0].id);
  const [filter, setFilter] = useState<FilterTab>("all");

  const filtered = filter === "all" ? layouts : layouts.filter((l) => l.set === filter);
  const current = layouts.find((l) => l.id === activeLayout)!;

  const tabs: { label: string; value: FilterTab }[] = [
    { label: "All", value: "all" },
    { label: "Nav Patterns (Set 1)", value: 1 },
    { label: "Personas (Set 2)", value: 2 },
    { label: "Specialized (Set 3)", value: 3 },
    { label: "Project Page (Set 4)", value: 4 },
    { label: "Admin Overview (Set 5)", value: 5 },
    { label: "Summary Widget (Set 6)", value: 6 },
    { label: "Stage Map (Set 7)", value: 7 },
    { label: "Bottom Widget (Set 8)", value: 8 },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-neutral-900">Layout Explorer</h1>
          <p className="text-neutral-500 text-lg">50 layout components across 8 sets</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center gap-2">
          {tabs.map((tab) => (
            <button
              key={String(tab.value)}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === tab.value
                  ? "bg-neutral-900 text-white shadow-md"
                  : "bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Layout Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map((layout) => (
            <button
              key={layout.id}
              onClick={() => setActiveLayout(layout.id)}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg text-center transition-all ${
                activeLayout === layout.id
                  ? "bg-neutral-900 text-white shadow-lg scale-105"
                  : "bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-400 hover:shadow-sm"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  activeLayout === layout.id ? "bg-white/20" : "bg-neutral-100"
                }`}
              >
                {layout.icon}
              </div>
              <span className="text-xs font-medium leading-tight">{layout.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  activeLayout === layout.id ? "bg-white/20" : "bg-neutral-100 text-neutral-400"
                }`}
              >
                Set {layout.set}
              </span>
            </button>
          ))}
        </div>

        {/* Info Bar */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-neutral-900">{current.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-neutral-100 text-neutral-500">
                  {SET_LABELS[current.set]}
                </span>
              </div>
              <p className="text-sm text-neutral-600 mb-2">{current.description}</p>
              <div className="flex flex-col sm:flex-row gap-4 text-xs text-neutral-500">
                <div>
                  <span className="font-semibold text-neutral-700">For: </span>
                  {current.who}
                </div>
                <div>
                  <span className="font-semibold text-neutral-700">Philosophy: </span>
                  {current.philosophy}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Layout Render */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-200 text-xs text-neutral-400 font-mono">
            {"<"}{current.name.replace(/\s/g, "")}Layout {"/>"}
          </div>
          <div className="p-4">{current.component}</div>
        </div>
      </div>
    </div>
  );
}
