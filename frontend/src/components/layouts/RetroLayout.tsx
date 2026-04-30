"use client";

import React, { useState } from "react";
import {
  RefreshCcw, ThumbsUp, ThumbsDown, ArrowRight, Sparkles,
} from "lucide-react";

import Burndown from "@/components/widgets/burndown";

import { burndownData } from "./fixtures";

function RetroLayout() {
  const [tab, setTab] = useState<"analysis" | "actions" | "vote">("analysis");

  const insights = [
    { type: "good", icon: ThumbsUp, text: "Backend tasks completed on time — Auth API and Login UI both done before deadline" },
    { type: "good", icon: ThumbsUp, text: "Velocity was 1.8/day for first 4 days — strong start" },
    { type: "bad", icon: ThumbsDown, text: "API dependency caused 3-day block (Apr 5-8). No fallback plan was in place." },
    { type: "bad", icon: ThumbsDown, text: "ML task estimates were 2.1x too optimistic. Voice Pipeline still in progress." },
    { type: "bad", icon: ThumbsDown, text: "Single-contributor bottleneck — Rohith on 80% of critical path tasks" },
    { type: "neutral", icon: ArrowRight, text: "Scope expanded mid-sprint: Voice integration added without re-estimation" },
  ];

  const actions = [
    { text: "Add 1.5x buffer to all ML/AI task estimates", votes: 4, author: "AI" },
    { text: "Create dependency-tracking Slack bot to flag cross-team blocks early", votes: 3, author: "AI" },
    { text: "Distribute critical path tasks across at least 2 people", votes: 5, author: "AI" },
    { text: "Freeze scope after day 2 of sprint — any additions go to next sprint", votes: 2, author: "AI" },
    { text: "Add mid-sprint health check meeting on Wednesday", votes: 1, author: "Rohith" },
  ];

  return (
    <div className="h-[700px] rounded-xl overflow-hidden border border-neutral-200 bg-white flex flex-col">
      <div className="px-6 py-4 border-b flex items-center gap-3">
        <RefreshCcw className="w-5 h-5 text-purple-500" />
        <h3 className="text-sm font-bold text-neutral-900">Sprint 12 Retrospective</h3>
        <span className="text-[10px] text-neutral-400">Apr 1 — Apr 9</span>
        <div className="flex-1" />
        <div className="flex gap-1">
          {(["analysis", "actions", "vote"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-[10px] font-medium px-3 py-1.5 rounded-lg capitalize transition-all ${tab === t ? "bg-neutral-900 text-white" : "text-neutral-400 hover:bg-neutral-100"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {tab === "analysis" && (
          <>
            {/* Score cards */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Estimation Accuracy", value: "68%", sub: "Target: 85%", color: "text-amber-600" },
                { label: "Completion Rate", value: "33%", sub: "3/9 tasks done", color: "text-red-600" },
                { label: "Avg Velocity", value: "1.2/day", sub: "Target: 1.8", color: "text-amber-600" },
                { label: "Blocker Days", value: "3", sub: "Apr 5-8", color: "text-red-600" },
              ].map((s) => (
                <div key={s.label} className="bg-neutral-50 rounded-xl border p-4">
                  <div className="text-[9px] uppercase font-bold text-neutral-400 tracking-widest">{s.label}</div>
                  <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
                  <div className="text-[9px] text-neutral-400 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>

            <Burndown data={burndownData} />

            {/* Insights */}
            <div>
              <h4 className="text-[9px] uppercase font-bold text-neutral-400 tracking-widest mb-3">AI-Generated Insights</h4>
              <div className="space-y-2">
                {insights.map((ins, i) => {
                  const Icon = ins.icon;
                  return (
                    <div key={i} className={`flex items-start gap-3 rounded-lg p-3 border ${
                      ins.type === "good" ? "bg-green-50 border-green-100" : ins.type === "bad" ? "bg-red-50 border-red-100" : "bg-neutral-50 border-neutral-100"
                    }`}>
                      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${ins.type === "good" ? "text-green-500" : ins.type === "bad" ? "text-red-500" : "text-neutral-400"}`} />
                      <span className="text-xs text-neutral-700">{ins.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {tab === "actions" && (
          <div className="space-y-3">
            <div className="text-xs text-neutral-500 mb-2">AI-generated action items for next sprint. Edit or add your own.</div>
            {actions.sort((a, b) => b.votes - a.votes).map((a, i) => (
              <div key={i} className="flex items-center gap-3 bg-neutral-50 rounded-xl border p-4 hover:border-blue-300 transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-neutral-800">{a.text}</div>
                  <div className="text-[9px] text-neutral-400 mt-0.5">Suggested by {a.author}</div>
                </div>
                <div className="flex items-center gap-1 bg-white border rounded-full px-2 py-1">
                  <ThumbsUp className="w-3 h-3 text-neutral-400" />
                  <span className="text-[10px] font-bold text-neutral-600">{a.votes}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "vote" && (
          <div className="space-y-4">
            <div className="text-xs text-neutral-500">Vote on which action items to commit to for Sprint 13.</div>
            {actions.sort((a, b) => b.votes - a.votes).map((a, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 bg-neutral-50 rounded-lg border p-3">
                  <div className="text-xs text-neutral-800">{a.text}</div>
                </div>
                <div className="w-full max-w-[200px]">
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${(a.votes / 5) * 100}%` }} />
                  </div>
                  <div className="text-[9px] text-neutral-400 text-right mt-0.5">{a.votes}/5 votes</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RetroLayout;
