"use client";

import React, { useState, useEffect } from "react";
import { Zap, CheckCircle2, Camera } from "lucide-react";
import Burndown from "@/components/widgets/burndown";
import { burndownData } from "@/components/layouts/fixtures";
import { PageShell, CARD, KPI_CARD, KPI_CARD_LABEL, KPI_CARD_VALUE, SECTION_TITLE, CARD_TITLE_WITH_ICON } from "@/design";
import { usePMStore } from "@/lib/store";

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
  const sprints = usePMStore(s => s.sprints);
  const sprintsStatus = usePMStore(s => s.sprintsStatus);
  const fetchSprints = usePMStore(s => s.fetchSprints);
  const takeSprintSnapshot = usePMStore(s => s.takeSprintSnapshot);
  const [activeSprint, setActiveSprint] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (sprintsStatus === "idle") fetchSprints().catch((e: any) => setError(e.message));
  }, [fetchSprints, sprintsStatus]);

  useEffect(() => {
    if (!activeSprint && sprints.length > 0) {
      setActiveSprint(sprints.find((s: any) => s.status === "active") || sprints[0] || null);
    }
  }, [activeSprint, sprints]);

  const handleSnapshot = () => {
    if (!activeSprint) return;
    takeSprintSnapshot(activeSprint.id)
      .then(() => setError(""))
      .catch((e: any) => setError(e.message || "Unable to take sprint snapshot"));
  };

  const avgVelocity = (VELOCITY.reduce((s, v) => s + v.done, 0) / VELOCITY.length).toFixed(1);

  return (
    <PageShell title="Sprint Overview" contentMode="scroll"
      headerRight={
        <div className="flex items-center gap-2">
          {sprints.length > 1 && (
            <select value={activeSprint?.id || ""} onChange={e => setActiveSprint(sprints.find((s: any) => s.id === e.target.value))}
              className="text-xs border border-neutral-200 rounded-lg px-2 py-1 bg-white text-neutral-700">
              {sprints.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          {activeSprint && (
            <button onClick={handleSnapshot} className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 flex items-center gap-1.5">
              <Camera className="w-3 h-3" /> Snapshot
            </button>
          )}
        </div>
      }>
      {error && <div className="text-xs text-bad-fg bg-bad-bg px-3 py-2 rounded-lg">{error}</div>}
      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        <div className={KPI_CARD}>
          <div className={KPI_CARD_LABEL}>Sprint</div>
          <div className={KPI_CARD_VALUE}>{burndownData.title}</div>
        </div>
        <div className={KPI_CARD}>
          <div className={KPI_CARD_LABEL}>Velocity</div>
          <div className="text-2xl font-mono font-black text-info-fg mt-1">{burndownData.velocity}/day</div>
        </div>
        <div className={KPI_CARD}>
          <div className={KPI_CARD_LABEL}>Projected End</div>
          <div className={KPI_CARD_VALUE}>{burndownData.projectedEndDate}</div>
        </div>
        <div className={KPI_CARD}>
          <div className={KPI_CARD_LABEL}>Avg Velocity</div>
          <div className="text-2xl font-mono font-black text-ok-fg mt-1">{avgVelocity}/wk</div>
        </div>
      </div>

      {/* Burndown chart full width */}
      <div className={CARD} style={{ height: "400px" }}>
        <Burndown data={burndownData} />
      </div>

      {/* Velocity trend + Completed side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`${CARD} p-5`}>
          <div className={`${CARD_TITLE_WITH_ICON} mb-4`}>
            <Zap className="w-4 h-4 text-warn-solid" />
            <span className={SECTION_TITLE}>Weekly Velocity</span>
          </div>
          <div className="flex items-end gap-3 h-32">
            {VELOCITY.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-neutral-700">{v.done}</span>
                <div className={`w-full rounded-t-lg ${i === VELOCITY.length - 1 ? "bg-info-solid" : "bg-neutral-200"}`} style={{ height: `${(v.done / 6) * 100}%` }} />
                <span className="text-xs text-neutral-400">{v.week}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${CARD} p-5`}>
          <div className={`${CARD_TITLE_WITH_ICON} mb-4`}>
            <CheckCircle2 className="w-4 h-4 text-ok-solid" />
            <span className={SECTION_TITLE}>Completed This Sprint</span>
            <span className="text-xs text-neutral-400 ml-auto">{COMPLETED_THIS_SPRINT.length} tasks</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {COMPLETED_THIS_SPRINT.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-ok-solid shrink-0" />
                <span className="text-xs text-neutral-700 flex-1 truncate">{t.title}</span>
                <span className="text-xs text-neutral-400">{t.project}</span>
                <span className="text-xs text-neutral-300">{t.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
