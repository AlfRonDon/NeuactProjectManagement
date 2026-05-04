"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home, LayoutGrid, GitBranch, TrendingDown, Users, ExternalLink, Layers, Brain,
  CheckCircle2, OctagonAlert, Activity, CircleDot,
} from "lucide-react";
import CreateTaskModal from "@/components/modals/CreateTaskModal";
import CreateProjectModal from "@/components/modals/CreateProjectModal";
import { selectBoardTasks, selectProjectOptions, usePMStore } from "@/lib/store";

import Burndown from "@/components/widgets/burndown";
import RiskRadar from "@/components/widgets/risk-radar";
import PeopleHeatmap from "@/components/widgets/people-heatmap";
import DependencyGraph from "@/components/widgets/dependency-graph";
import StoryMap from "@/components/widgets/story-map";
import TaskBoard from "@/components/widgets/task-board";

import { boardTasks, burndownData, riskData, peopleData, depGraphData, storyMapData } from "@/components/layouts/fixtures";
import { BottomWidgetVariantA as KPIDashboard, PeopleVariantA as TeamWidget } from "@/components/layouts";

type View = "overview" | "board" | "people" | "deps" | "burndown-risk" | "storymap";

const TABS: { id: View; icon: React.ElementType; label: string }[] = [
  { id: "overview", icon: Home, label: "Overview" },
  { id: "board", icon: LayoutGrid, label: "Board" },
  { id: "people", icon: Users, label: "People" },
  { id: "deps", icon: GitBranch, label: "Dependencies" },
  { id: "burndown-risk", icon: TrendingDown, label: "Burndown & Risk" },
  { id: "storymap", icon: Layers, label: "Story Map" },
];



/* ── Modals are now in @/components/modals/ ────────────── */

/* ── Right column: pure CSS, no JS measurement ── */
function RightColumn({ selectedProject, setSelectedProject, sprintId, topBlockerId }: {
  selectedProject: string; setSelectedProject: (s: string) => void;
  sprintId?: string | null; topBlockerId?: string | null;
}) {
  return (
    <div className="w-1/2 overflow-hidden"
      style={{ height: "calc(100dvh - 56px)", display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ overflow: "hidden", minHeight: 0, flex: "1 1 0%" }}
        className="bg-white rounded-lg border border-neutral-200">
        <TeamWidget />
      </div>
      <div style={{ overflow: "hidden", minHeight: 0, height: 280, flexShrink: 0 }}>
        <KPIDashboard renderLayout="diagnostic-only" sel={selectedProject} onSelChange={setSelectedProject} sprintId={sprintId} topBlockerId={topBlockerId} />
      </div>
    </div>
  );
}

export default function AdminOverview({ externalShowTask, externalShowProject, onCloseTask, onCloseProject }: {
  externalShowTask?: boolean; externalShowProject?: boolean; onCloseTask?: () => void; onCloseProject?: () => void;
} = {}) {
  const router = useRouter();
  const projects = usePMStore(selectProjectOptions);
  const projectsStatus = usePMStore(s => s.projectsStatus);
  const fetchProjects = usePMStore(s => s.fetchProjects);
  const tasks = usePMStore(selectBoardTasks);
  const tasksStatus = usePMStore(s => s.tasksStatus);
  const fetchTasks = usePMStore(s => s.fetchTasks);
  const [view, setView] = useState<View>("overview");
  const [selectedProject, setSelectedProject] = useState<string>("CCv5");
  const [internalShowTask, setInternalShowTask] = useState(false);
  const [internalShowProject, setInternalShowProject] = useState(false);
  const [sprintId, setSprintId] = useState<string | null>(null);
  const [topBlockerId, setTopBlockerId] = useState<string | null>(null);

  const showCreateTask = externalShowTask ?? internalShowTask;
  const showCreateProject = externalShowProject ?? internalShowProject;
  const setShowCreateTask = onCloseTask ? (v: boolean) => { if (!v) onCloseTask(); else setInternalShowTask(true); } : setInternalShowTask;
  const setShowCreateProject = onCloseProject ? (v: boolean) => { if (!v) onCloseProject(); else setInternalShowProject(true); } : setInternalShowProject;

  useEffect(() => {
    if (showCreateTask && projectsStatus === "idle") fetchProjects().catch(() => {});
    if (tasksStatus === "idle") fetchTasks().catch(() => {});
  }, [fetchProjects, fetchTasks, projectsStatus, showCreateTask, tasksStatus]);

  const openCreateTask = () => {
    if (projectsStatus === "idle") fetchProjects().catch(() => {});
    if (onCloseTask) setInternalShowTask(true);
    setShowCreateTask(true);
  };

  return (
    <div className="h-full flex flex-col bg-neutral-50">
      {showCreateTask && <CreateTaskModal onClose={() => setShowCreateTask(false)} projects={projects} />}
      {showCreateProject && <CreateProjectModal onClose={() => setShowCreateProject(false)} />}
      {/* Content — no tab bar, fits screen */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {view === "overview" && (
          <div className="flex-1 flex gap-1 overflow-hidden p-1">
            {/* Left — Project cards + Detail + Sprint 12 */}
            <div className="w-1/2 flex flex-col overflow-hidden gap-1">
              <div className="shrink-0">
                <KPIDashboard renderLayout="left-only" sel={selectedProject} onSelChange={setSelectedProject} />
              </div>
              <div className="flex-1 min-h-0">
                <KPIDashboard renderLayout="sprint-only" sel={selectedProject} onSelChange={setSelectedProject} onSprintId={setSprintId} />
              </div>
            </div>
            {/* Right — Activity + Sprint Diagnostic + Workload Calendar
                 Diagnostic is the height anchor; Activity & Workload match it and scroll internally. */}
            <RightColumn
              selectedProject={selectedProject}
              setSelectedProject={setSelectedProject}
              sprintId={sprintId}
              topBlockerId={topBlockerId}
            />
          </div>
        )}

        {view === "board" && <TaskBoard tasks={tasks.length > 0 || tasksStatus !== "error" ? tasks : boardTasks} />}
        {view === "people" && <PeopleHeatmap data={peopleData} />}
        {view === "deps" && <DependencyGraph data={depGraphData} />}
        {view === "storymap" && <StoryMap data={storyMapData} />}
        {view === "burndown-risk" && (
          <div className="space-y-4">
            <Burndown data={burndownData} />
            <RiskRadar data={riskData} />
          </div>
        )}
      </div>
    </div>
  );
}
