"use client";

import React, { useState, useEffect } from "react";
import { TrendingDown, Shield } from "lucide-react";
import Burndown from "@/components/widgets/burndown";
import RiskRadar from "@/components/widgets/risk-radar";
import { burndownData as fallbackBurndown, riskData as fallbackRisk } from "@/components/layouts/fixtures";
import { PageShell, CARD, SECTION_TITLE, CARD_TITLE_WITH_ICON } from "@/design";
import { fetchSprintTimeline, fetchDiagnostic } from "@/lib/api";
import { usePMStore } from "@/lib/store";

export default function BurndownPage() {
  const sprints = usePMStore(s => s.sprints);
  const sprintsStatus = usePMStore(s => s.sprintsStatus);
  const fetchSprints = usePMStore(s => s.fetchSprints);
  const projects = usePMStore(s => s.projects);
  const projectsStatus = usePMStore(s => s.projectsStatus);
  const fetchProjects = usePMStore(s => s.fetchProjects);
  const [activeSprint, setActiveSprint] = useState<any>(null);
  const [burndownData, setBurndownData] = useState<any>(fallbackBurndown);
  const [riskData, setRiskData] = useState<any>(fallbackRisk);

  useEffect(() => {
    if (projectsStatus === "idle") fetchProjects().catch(() => {});
    if (sprintsStatus === "idle") fetchSprints().catch(() => {});
  }, [fetchProjects, fetchSprints, projectsStatus, sprintsStatus]);

  useEffect(() => {
    if (!activeSprint && sprints.length > 0) {
      setActiveSprint(sprints.find((s: any) => s.status === "active") || sprints[0]);
    }
  }, [activeSprint, sprints]);

  // When active sprint changes, fetch its burndown + diagnostic data
  useEffect(() => {
    if (!activeSprint || !projects.length) return;
    const projectId = activeSprint.project || projects[0]?.id;
    if (!projectId) return;

    fetchSprintTimeline(projectId, activeSprint.id)
      .then((data: any) => {
        if (data?.points || data?.title) {
          setBurndownData({
            title: data.title || activeSprint.name,
            totalTasks: data.total_tasks || data.totalTasks || activeSprint.task_count || 20,
            points: (data.points || []).map((p: any) => ({
              date: p.date,
              remaining: p.remaining,
              ideal: p.ideal,
              actual: p.actual ?? p.remaining,
            })),
            velocity: data.velocity || 0,
            projectedEndDate: data.projected_end_date || data.projectedEndDate,
            annotations: data.annotations || [],
          });
        }
      })
      .catch(() => {});

    fetchDiagnostic(projectId, activeSprint.id)
      .then((data: any) => {
        if (data?.axes || data?.radar) {
          setRiskData({
            overallRisk: data.overall_risk || data.overallRisk || "medium",
            axes: (data.axes || data.radar || []).map((a: any) => ({
              axis: a.axis || a.label,
              score: a.score || a.value,
              description: a.description || "",
            })),
            aiSummary: data.ai_summary || data.aiSummary || "",
          });
        }
      })
      .catch(() => {});
  }, [activeSprint, projects]);

  return (
    <PageShell title="Burndown & Risk" contentMode="scroll"
      headerRight={
        sprints.length > 1 ? (
          <select value={activeSprint?.id || ""} onChange={e => setActiveSprint(sprints.find((s: any) => s.id === e.target.value))}
            className="text-xs border border-neutral-200 rounded-lg px-2 py-1 bg-white text-neutral-700">
            {sprints.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        ) : undefined
      }>
      <div className="grid grid-cols-2 gap-4">
        <div className={CARD} style={{ height: "400px", minWidth: 0 }}>
          <Burndown data={burndownData} />
        </div>
        <div className={CARD} style={{ height: "400px", minWidth: 0 }}>
          <RiskRadar data={riskData} />
        </div>
      </div>

      {/* Sprint list */}
      {sprints.length > 0 && (
        <div className={`${CARD} p-5`}>
          <div className={CARD_TITLE_WITH_ICON}>
            <TrendingDown className="w-5 h-5 text-warn-fg" />
            <span className={SECTION_TITLE}>Sprints</span>
            <span className="text-xs text-neutral-400 ml-2">{sprints.length}</span>
          </div>
          <div className="mt-4 space-y-2">
            {sprints.map((s: any) => (
              <div key={s.id} onClick={() => setActiveSprint(s)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  activeSprint?.id === s.id ? "bg-info-bg border border-info-solid/20" : "bg-neutral-50 hover:bg-neutral-100"
                }`}>
                <span className="text-xs font-semibold text-neutral-700">{s.name}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${
                  s.status === "active" ? "bg-warn-bg text-warn-fg" :
                  s.status === "completed" ? "bg-ok-bg text-ok-fg" :
                  "bg-neutral-100 text-neutral-500"
                }`}>{s.status}</span>
                {s.task_count && <span className="text-xs text-neutral-400">{s.task_count} tasks</span>}
                {s.days_left != null && <span className="text-xs text-neutral-400">{s.days_left}d left</span>}
                <span className="ml-auto text-xs text-neutral-400">{s.start_date} — {s.end_date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}
