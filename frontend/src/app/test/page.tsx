"use client";

import React from "react";
import TimelineSwimLanes from "@/components/widgets/timeline-swimlanes";
import StoryMap from "@/components/widgets/story-map";
import DependencyGraph from "@/components/widgets/dependency-graph";
import Burndown from "@/components/widgets/burndown";
import RiskRadar from "@/components/widgets/risk-radar";
import PeopleHeatmap from "@/components/widgets/people-heatmap";
import {
  swimData,
  depGraphData,
  burndownData,
  riskData,
  peopleData,
} from "@/components/layouts/fixtures";

const storyMapData = [
  {
    epic: "Voice Pipeline",
    description: "End-to-end voice interaction system",
    phases: [
      {
        name: "Research",
        tasks: [
          { id: "v1", title: "STT engine evaluation", status: "done" as const, priority: "high" as const },
          { id: "v2", title: "Latency benchmarks", status: "done" as const, priority: "medium" as const },
        ],
      },
      {
        name: "Design",
        tasks: [
          { id: "v3", title: "Streaming architecture", status: "done" as const, priority: "high" as const },
          { id: "v4", title: "Wake word protocol", status: "in_progress" as const, priority: "medium" as const },
        ],
      },
      {
        name: "Build",
        tasks: [
          { id: "v5", title: "Web Speech API integration", status: "in_progress" as const, priority: "critical" as const, assignee: "Rohith" },
          { id: "v6", title: "Intent parser", status: "todo" as const, priority: "high" as const },
        ],
      },
      {
        name: "Ship",
        tasks: [
          { id: "v7", title: "QA pass", status: "backlog" as const, priority: "medium" as const },
          { id: "v8", title: "Dogfood rollout", status: "backlog" as const, priority: "low" as const },
        ],
      },
    ],
  },
  {
    epic: "Dashboard Widgets",
    description: "Core PM visualization widgets",
    phases: [
      {
        name: "Research",
        tasks: [
          { id: "w1", title: "Widget audit", status: "done" as const, priority: "medium" as const },
          { id: "w2", title: "Recharts vs D3 eval", status: "done" as const, priority: "high" as const },
        ],
      },
      {
        name: "Design",
        tasks: [
          { id: "w3", title: "Widget spec doc", status: "done" as const, priority: "high" as const },
          { id: "w4", title: "Responsive breakpoints", status: "done" as const, priority: "medium" as const },
        ],
      },
      {
        name: "Build",
        tasks: [
          { id: "w5", title: "6 core widgets", status: "in_progress" as const, priority: "critical" as const, assignee: "Priya" },
          { id: "w6", title: "Fixture data system", status: "in_progress" as const, priority: "high" as const },
        ],
      },
      {
        name: "Ship",
        tasks: [
          { id: "w7", title: "E2E widget tests", status: "backlog" as const, priority: "high" as const },
          { id: "w8", title: "Performance audit", status: "backlog" as const, priority: "medium" as const },
        ],
      },
    ],
  },
  {
    epic: "RL Training",
    description: "Reinforcement learning for dashboard generation",
    phases: [
      {
        name: "Research",
        tasks: [
          { id: "r1", title: "GRPO paper review", status: "done" as const, priority: "high" as const },
          { id: "r2", title: "Reward function design", status: "done" as const, priority: "critical" as const },
        ],
      },
      {
        name: "Design",
        tasks: [
          { id: "r3", title: "LoRA adapter plan", status: "in_progress" as const, priority: "high" as const },
          { id: "r4", title: "Gold data schema", status: "done" as const, priority: "high" as const },
        ],
      },
      {
        name: "Build",
        tasks: [
          { id: "r5", title: "SFT extraction", status: "todo" as const, priority: "critical" as const },
          { id: "r6", title: "DPO pipeline", status: "backlog" as const, priority: "high" as const },
        ],
      },
      {
        name: "Ship",
        tasks: [
          { id: "r7", title: "A/B eval harness", status: "backlog" as const, priority: "medium" as const },
          { id: "r8", title: "Deploy adapters", status: "backlog" as const, priority: "high" as const },
        ],
      },
    ],
  },
];

const widgets = [
  { name: "Timeline Swim Lanes", component: <TimelineSwimLanes data={swimData} /> },
  { name: "Story Map", component: <StoryMap data={storyMapData} /> },
  { name: "Dependency Graph", component: <DependencyGraph data={depGraphData} /> },
  { name: "Burndown", component: <Burndown data={burndownData} /> },
  { name: "Risk Radar", component: <RiskRadar data={riskData} /> },
  { name: "People Heatmap", component: <PeopleHeatmap data={peopleData} /> },
];

export default function WidgetShowcasePage() {
  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-neutral-900">Widget Showcase</h1>
          <p className="text-neutral-500 text-lg">All 6 PM widgets with fixture data</p>
        </div>

        {widgets.map((w, i) => (
          <section key={i} className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="px-6 py-3 bg-neutral-50 border-b border-neutral-200">
              <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
                {i + 1}. {w.name}
              </h2>
            </div>
            <div className="p-4">{w.component}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
