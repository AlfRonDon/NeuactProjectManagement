"use client";

import React, { useState } from "react";
import {
  Mic,
  BarChart3,
  Users,
  Target,
  Zap,
  Bot,
  Bell,
  Eye,
  Map,
  Shield,
  GitBranch,
  CheckCircle2,
  TrendingDown,
  Clock,
  UserPlus,
  RotateCcw,
} from "lucide-react";

type StepType = "action" | "decision" | "voice" | "widget" | "ai" | "notification";

interface FlowStep {
  label: string;
  type: StepType;
  detail: string;
}

interface UserFlow {
  id: string;
  persona: string;
  scenario: string;
  icon: React.ReactNode;
  color: string;
  steps: FlowStep[];
  narrative: string;
}

const TYPE_STYLES: Record<StepType, { bg: string; border: string; text: string; label: string }> = {
  action: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", label: "Action" },
  decision: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", label: "Decision" },
  voice: { bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-700", label: "Voice" },
  widget: { bg: "bg-green-50", border: "border-green-300", text: "text-green-700", label: "Widget" },
  ai: { bg: "bg-pink-50", border: "border-pink-300", text: "text-pink-700", label: "AI" },
  notification: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", label: "Notify" },
};

const flows: UserFlow[] = [
  {
    id: "eng-lead",
    persona: "Engineering Lead",
    scenario: "Morning Standup",
    icon: <Mic className="w-5 h-5" />,
    color: "bg-blue-600",
    steps: [
      { label: "Voice command", type: "voice", detail: "Hey Neuact, morning standup" },
      { label: "AI digest", type: "ai", detail: "AI summarizes overnight changes, blockers, PRs" },
      { label: "Burndown check", type: "widget", detail: "Sprint burndown shows 3 tasks behind ideal" },
      { label: "People heatmap", type: "widget", detail: "Rohith at 112% load, Priya at 75%" },
      { label: "Rebalance", type: "action", detail: "Drag 2 tasks from Rohith to Priya" },
      { label: "Deps check", type: "widget", detail: "Dependency graph shows no new blockers" },
    ],
    narrative: "The engineering lead starts their day with a voice command. AI surfaces the overnight digest, then they visually check sprint health via burndown. The people heatmap reveals load imbalance, so they rebalance work. A quick deps check confirms no new blockers before standup.",
  },
  {
    id: "pm",
    persona: "Product Manager",
    scenario: "Sprint Planning",
    icon: <Map className="w-5 h-5" />,
    color: "bg-emerald-600",
    steps: [
      { label: "Story map review", type: "widget", detail: "Open story map, review epic progress across phases" },
      { label: "Scope decision", type: "decision", detail: "Which stories make the cut for next sprint?" },
      { label: "Risk radar", type: "widget", detail: "Check risk radar - deadline risk at 85%" },
      { label: "Impact analysis", type: "ai", detail: "AI predicts: adding Feature X delays Beta by 5 days" },
      { label: "Milestone update", type: "action", detail: "Adjust milestone dates based on AI projection" },
    ],
    narrative: "The PM opens the story map to see where each epic stands. They must decide on sprint scope, so they check the risk radar first. AI-powered impact analysis shows the cost of adding more scope. They adjust milestones accordingly.",
  },
  {
    id: "ic",
    persona: "Individual Contributor",
    scenario: "Daily Work",
    icon: <Zap className="w-5 h-5" />,
    color: "bg-amber-600",
    steps: [
      { label: "AI priority queue", type: "ai", detail: "AI sorts your tasks by urgency, deps, and deadlines" },
      { label: "Auto-decompose", type: "ai", detail: "Complex task broken into 3 subtasks automatically" },
      { label: "Blocker report", type: "notification", detail: "Notification: your task is blocked by Auth API" },
      { label: "Task completion", type: "action", detail: "Mark subtask done, progress auto-propagates" },
    ],
    narrative: "The IC opens their dashboard to find tasks already prioritized by AI. A complex task is auto-decomposed into subtasks. They get notified about a blocker, work around it, and mark tasks done as they go. Progress flows upstream automatically.",
  },
  {
    id: "cto",
    persona: "CTO / Stakeholder",
    scenario: "Weekly Overview",
    icon: <Eye className="w-5 h-5" />,
    color: "bg-purple-600",
    steps: [
      { label: "Portfolio radars", type: "widget", detail: "Risk radars for all 4 active projects at once" },
      { label: "Drill into at-risk", type: "decision", detail: "CC v5 shows high deadline risk - drill in" },
      { label: "Critical path", type: "widget", detail: "Dependency graph highlights the bottleneck chain" },
      { label: "Resource decision", type: "action", detail: "Approve contractor for 2 weeks on bottleneck" },
    ],
    narrative: "The CTO views portfolio-level risk radars to spot trouble. CC v5 is flagged high-risk, so they drill into its critical path. The dependency graph reveals the bottleneck. They make a resourcing decision to unblock the chain.",
  },
  {
    id: "new-member",
    persona: "New Team Member",
    scenario: "Onboarding",
    icon: <UserPlus className="w-5 h-5" />,
    color: "bg-teal-600",
    steps: [
      { label: "Orientation view", type: "ai", detail: "AI generates a project overview and team intro" },
      { label: "Story map explore", type: "widget", detail: "Browse story map to understand project scope" },
      { label: "People heatmap", type: "widget", detail: "See who does what and current availability" },
      { label: "Find starter tasks", type: "ai", detail: "AI suggests 3 good-first-issue tasks" },
      { label: "Dependency context", type: "widget", detail: "Understand how your task connects to the project" },
    ],
    narrative: "A new team member gets an AI-generated orientation. They explore the story map to understand scope, check the people heatmap to learn the team, and get AI-suggested starter tasks. The dependency graph provides context on how their work fits in.",
  },
  {
    id: "retro",
    persona: "Sprint Retrospective",
    scenario: "Team Reflection",
    icon: <RotateCcw className="w-5 h-5" />,
    color: "bg-rose-600",
    steps: [
      { label: "Burndown analysis", type: "widget", detail: "Review burndown curve - stall from Apr 7-9" },
      { label: "Stall investigation", type: "ai", detail: "AI traces stall to API blocker + scope creep" },
      { label: "Estimation accuracy", type: "ai", detail: "AI compares estimated vs actual hours across tasks" },
      { label: "AI action items", type: "ai", detail: "Generated: freeze scope earlier, add API fallback, buffer estimates 20%" },
    ],
    narrative: "The team reviews the burndown curve and spots a stall. AI traces it to root causes. Estimation accuracy analysis reveals systematic underestimation. AI generates concrete action items for the next sprint.",
  },
];

export default function TestFlowPage() {
  const [activeFlow, setActiveFlow] = useState(flows[0].id);
  const flow = flows.find((f) => f.id === activeFlow)!;

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-neutral-900">UX Flow Visualizer</h1>
          <p className="text-neutral-500 text-lg">6 user persona flows through the PM system</p>
        </div>

        {/* Type Legend */}
        <div className="flex flex-wrap justify-center gap-3">
          {Object.entries(TYPE_STYLES).map(([type, style]) => (
            <span
              key={type}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${style.bg} ${style.border} ${style.text}`}
            >
              {style.label}
            </span>
          ))}
        </div>

        {/* Persona Selector */}
        <div className="flex flex-wrap justify-center gap-3">
          {flows.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFlow(f.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeFlow === f.id
                  ? `${f.color} text-white shadow-lg scale-105`
                  : "bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300 hover:shadow-sm"
              }`}
            >
              {f.icon}
              <div className="text-left">
                <div className="font-semibold">{f.persona}</div>
                <div className={`text-xs ${activeFlow === f.id ? "text-white/80" : "text-neutral-400"}`}>
                  {f.scenario}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Flow Diagram */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-neutral-800 mb-6">
            {flow.persona}: {flow.scenario}
          </h2>

          {/* Steps as columns */}
          <div className="flex gap-3 overflow-x-auto pb-4">
            {flow.steps.map((step, i) => {
              const style = TYPE_STYLES[step.type];
              return (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-52 rounded-lg border-2 p-4 ${style.bg} ${style.border}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${style.text} bg-white border ${style.border}`}
                      >
                        {i + 1}
                      </span>
                      <span className={`text-xs font-semibold uppercase tracking-wide ${style.text}`}>
                        {style.label}
                      </span>
                    </div>
                    <div className={`font-semibold text-sm ${style.text} mb-1`}>{step.label}</div>
                    <div className="text-xs text-neutral-600 leading-relaxed">{step.detail}</div>
                  </div>
                  {i < flow.steps.length - 1 && (
                    <div className="flex-shrink-0 flex items-center pt-8 text-neutral-300">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Narrative */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
            Step-by-Step Narrative
          </h3>
          <p className="text-neutral-700 leading-relaxed text-base">{flow.narrative}</p>
        </div>
      </div>
    </div>
  );
}
