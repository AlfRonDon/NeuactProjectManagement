"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, TrendingDown, Zap, Target, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import Burndown from "@/components/widgets/burndown";
import { burndownData } from "@/components/layouts/fixtures";
import UserAvatar from "@/components/UserAvatar";

const VELOCITY = [
  { week: "W10", done: 3 }, { week: "W11", done: 2 }, { week: "W12", done: 4 },
  { week: "W13", done: 2 }, { week: "W14", done: 3 }, { week: "W15", done: 5 },
];

const COMPLETED_THIS_SPRINT = [
  { title: "Design pipeline architecture", project: "CCv5", date: "Apr 10" },
  { title: "Phase A — Understand", project: "CCv5", date: "Apr 15" },
  { title: "Widget Renderer refactor", project: "CCv5", date: "Apr 16" },
  { title: "Setup vLLM config", project: "NRv3", date: "Apr 8" },
  { title: "PDF export module", project: "NRv3", date: "Apr 5" },
  { title: "Audio reactive particles", project: "Spot", date: "Apr 1" },
  { title: "WebGL renderer optimization", project: "Spot", date: "Mar 25" },
  { title: "Color palette system", project: "Spot", date: "Mar 20" },
];

export default function SprintPage() {
  const avgVelocity = (VELOCITY.reduce((s, v) => s + v.done, 0) / VELOCITY.length).toFixed(1);

  return (
    <div className="h-screen bg-neutral-100 overflow-hidden flex flex-col">
      <div className="bg-white border-b border-neutral-200 px-5 py-2 flex items-center gap-3 shrink-0">
        <Link href="/" className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-neutral-500" />
        </Link>
        <div className="w-6 h-6 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-xs font-bold shrink-0">N</div>
        <span className="text-sm font-semibold text-neutral-700">Sprint Overview</span>
        <div className="flex-1" />
        <UserAvatar />
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="text-xs text-neutral-400 uppercase font-semibold">Sprint</div>
            <div className="text-2xl font-black text-neutral-900 mt-1">{burndownData.title}</div>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="text-xs text-neutral-400 uppercase font-semibold">Velocity</div>
            <div className="text-2xl font-black text-blue-600 mt-1">{burndownData.velocity}/day</div>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="text-xs text-neutral-400 uppercase font-semibold">Projected End</div>
            <div className="text-2xl font-black text-neutral-900 mt-1">{burndownData.projectedEndDate}</div>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="text-xs text-neutral-400 uppercase font-semibold">Avg Velocity</div>
            <div className="text-2xl font-black text-green-600 mt-1">{avgVelocity}/wk</div>
          </div>
        </div>

        {/* Burndown chart full width */}
        <div className="bg-white rounded-xl border border-neutral-200" style={{ height: "400px" }}>
          <Burndown data={burndownData} />
        </div>

        {/* Velocity trend + Completed side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-neutral-900">Weekly Velocity</span>
            </div>
            <div className="flex items-end gap-3 h-32">
              {VELOCITY.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-neutral-700">{v.done}</span>
                  <div className={`w-full rounded-t-lg ${i === VELOCITY.length - 1 ? "bg-blue-500" : "bg-neutral-200"}`} style={{ height: `${(v.done / 6) * 100}%` }} />
                  <span className="text-xs text-neutral-400">{v.week}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm font-bold text-neutral-900">Completed This Sprint</span>
              <span className="text-xs text-neutral-400 ml-auto">{COMPLETED_THIS_SPRINT.length} tasks</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {COMPLETED_THIS_SPRINT.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                  <span className="text-xs text-neutral-700 flex-1 truncate">{t.title}</span>
                  <span className="text-xs text-neutral-400">{t.project}</span>
                  <span className="text-xs text-neutral-300">{t.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
