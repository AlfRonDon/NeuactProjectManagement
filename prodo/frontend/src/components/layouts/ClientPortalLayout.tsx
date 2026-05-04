"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
} from "lucide-react";

function ClientPortalLayout() {
  const milestones = [
    { name: "Discovery & Planning", status: "complete", date: "Mar 15", progress: 100 },
    { name: "Core Development", status: "in-progress", date: "May 15", progress: 45 },
    { name: "Beta Release", status: "upcoming", date: "Jun 1", progress: 0 },
    { name: "Final Delivery", status: "upcoming", date: "Jul 31", progress: 0 },
  ];

  const updates = [
    { date: "Apr 9", text: "Core dashboard architecture complete. Widget system in active development. On track for Beta.", type: "progress" },
    { date: "Apr 5", text: "Identified dependency on data integration layer. Being resolved — no impact to timeline expected.", type: "info" },
    { date: "Apr 1", text: "Sprint 12 kicked off. Focus areas: dashboard widgets, voice pipeline, data connectivity.", type: "progress" },
  ];

  return (
    <div className="h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-white flex flex-col">
      {/* Clean header */}
      <div className="px-8 py-5 border-b flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-bold text-sm">N</div>
        <div>
          <h3 className="text-base font-serif font-bold text-neutral-950">Command Center v5</h3>
          <p className="text-xs text-neutral-400">Project Status Report — Updated Apr 9, 2026</p>
        </div>
        <div className="flex-1" />
        <div className="text-right">
          <div className="text-2xl font-bold text-neutral-950">20%</div>
          <div className="text-[9px] text-neutral-400 uppercase">Overall Progress</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {/* Overall progress bar */}
        <div>
          <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full bg-info-solid rounded-full transition-all" style={{ width: "20%" }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-neutral-400">Started Apr 1</span>
            <span className="text-[9px] text-neutral-400">Target Jul 31</span>
          </div>
        </div>

        {/* Milestones */}
        <div>
          <h4 className="text-xs font-bold text-neutral-950 uppercase tracking-widest mb-3">Milestones</h4>
          <div className="space-y-3">
            {milestones.map((m, i) => (
              <div key={m.name} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.status === "complete" ? "bg-ok-solid text-white" : m.status === "in-progress" ? "bg-info-solid text-white" : "bg-neutral-200 text-neutral-400"
                }`}>
                  {m.status === "complete" ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-800">{m.name}</span>
                    <span className="text-[9px] text-neutral-400">{m.date}</span>
                  </div>
                  {m.status === "in-progress" && (
                    <div className="w-full h-1.5 bg-neutral-100 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-info-solid rounded-full" style={{ width: `${m.progress}%` }} />
                    </div>
                  )}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                  m.status === "complete" ? "bg-ok-bg text-ok-fg" : m.status === "in-progress" ? "bg-info-bg text-info-fg" : "bg-neutral-100 text-neutral-400"
                }`}>{m.status.replace("-", " ")}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status updates */}
        <div>
          <h4 className="text-xs font-bold text-neutral-950 uppercase tracking-widest mb-3">Recent Updates</h4>
          <div className="space-y-3">
            {updates.map((u, i) => (
              <div key={i} className="flex gap-3 bg-neutral-50 rounded-lg p-4 border border-neutral-100">
                <div className="text-xs text-neutral-400 font-mono w-14 shrink-0 pt-0.5">{u.date}</div>
                <div className="text-xs text-neutral-600 leading-relaxed">{u.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Health summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Schedule", value: "On Track", color: "text-ok-fg", bg: "bg-ok-bg" },
            { label: "Budget", value: "Within Range", color: "text-ok-fg", bg: "bg-ok-bg" },
            { label: "Risk Level", value: "Medium", color: "text-warn-fg", bg: "bg-warn-bg" },
          ].map((h) => (
            <div key={h.label} className={`${h.bg} rounded-lg p-4 text-center`}>
              <div className="text-[9px] uppercase font-bold text-neutral-400 tracking-widest">{h.label}</div>
              <div className={`text-sm font-bold mt-1 ${h.color}`}>{h.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ClientPortalLayout;
