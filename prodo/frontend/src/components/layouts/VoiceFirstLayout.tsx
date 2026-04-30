"use client";

import React, { useState } from "react";
import {
  Mic, Send, X,
} from "lucide-react";

import Burndown from "@/components/widgets/burndown";
import RiskRadar from "@/components/widgets/risk-radar";
import DependencyGraph from "@/components/widgets/dependency-graph";
import PeopleHeatmap from "@/components/widgets/people-heatmap";
import TimelineSwimLanes from "@/components/widgets/timeline-swimlanes";

import { burndownData, riskData, depGraphData, peopleData, swimData } from "./fixtures";

function VoiceFirstLayout() {
  const [conversation, setConversation] = useState([
    { role: "ai", text: "Good morning, Rohith. You have 3 tasks in progress and 2 blockers. Want the standup?" },
  ]);
  const [activeWidget, setActiveWidget] = useState<string | null>(null);

  const presets = [
    { query: "Give me the standup", widget: "burndown" },
    { query: "Who's overloaded?", widget: "people" },
    { query: "What's blocking the release?", widget: "deps" },
    { query: "Show project risk", widget: "risk" },
    { query: "What should I work on?", widget: null },
    { query: "Show the timeline", widget: "timeline" },
  ];

  const handlePreset = (p: typeof presets[0]) => {
    setConversation((prev) => [
      ...prev,
      { role: "user", text: p.query },
      { role: "ai", text: p.widget ? `Here's the ${p.widget} view for CC v5.` : "Based on priority and dependencies, I recommend: \"Phase C - Grid Pack\" — it blocks 2 downstream tasks and is due May 5." },
    ]);
    setActiveWidget(p.widget);
  };

  return (
    <div className="h-[700px] rounded-xl overflow-hidden border border-neutral-200 bg-neutral-950 flex flex-col text-white">
      {/* Minimal top */}
      <div className="px-5 py-3 border-b border-white/10 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[10px] text-neutral-500">Neuact PM — Voice Mode</span>
        <div className="flex-1" />
        <span className="text-[10px] text-neutral-500">CC v5</span>
      </div>

      <div className="flex-1 flex">
        {/* Conversation */}
        <div className={`${activeWidget ? "w-1/2 border-r border-white/10" : "w-full"} flex flex-col transition-all`}>
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {conversation.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.role === "user" ? "bg-blue-600 text-white" : "bg-white/10 text-neutral-200"
                }`}>
                  <p className="text-xs leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick prompts */}
          <div className="px-4 py-3 border-t border-white/10">
            <div className="text-[8px] uppercase tracking-widest text-neutral-600 mb-2">Quick prompts</div>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button key={p.query} onClick={() => handlePreset(p)}
                  className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1.5 text-neutral-300 transition-colors">
                  {p.query}
                </button>
              ))}
            </div>
          </div>

          {/* Voice input */}
          <div className="px-4 py-3 border-t border-white/10 flex items-center gap-3">
            <button className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-400 flex items-center justify-center transition-colors">
              <Mic className="w-5 h-5 text-white" />
            </button>
            <input placeholder="Type or speak..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none placeholder-neutral-500" />
            <button className="p-2 text-neutral-500 hover:text-white transition-colors"><Send className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Widget panel */}
        {activeWidget && (
          <div className="w-1/2 overflow-y-auto p-4 bg-neutral-900">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] uppercase tracking-widest text-neutral-500">AI-generated view</span>
              <button onClick={() => setActiveWidget(null)} className="text-neutral-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            {activeWidget === "burndown" && <Burndown data={burndownData} />}
            {activeWidget === "risk" && <RiskRadar data={riskData} />}
            {activeWidget === "deps" && <DependencyGraph data={depGraphData} />}
            {activeWidget === "people" && <PeopleHeatmap data={peopleData} />}
            {activeWidget === "timeline" && <TimelineSwimLanes data={swimData} />}
          </div>
        )}
      </div>
    </div>
  );
}

export default VoiceFirstLayout;
