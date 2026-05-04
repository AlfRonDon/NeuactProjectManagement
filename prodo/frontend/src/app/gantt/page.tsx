"use client";

import React, { useEffect } from "react";
import { GanttChart } from "@/components/layouts";
import { PageShell } from "@/design";
import { selectGanttTasks, usePMStore } from "@/lib/store";

export default function GanttPage() {
  const tasks = usePMStore(selectGanttTasks);
  const tasksStatus = usePMStore(s => s.tasksStatus);
  const fetchTasks = usePMStore(s => s.fetchTasks);

  useEffect(() => {
    if (tasksStatus === "idle") fetchTasks().catch(() => {});
  }, [fetchTasks, tasksStatus]);

  return (
    <PageShell title="Gantt Chart" contentMode="flush">
      <div className="h-full overflow-auto">
        <GanttChart tasks={tasks} />
      </div>
    </PageShell>
  );
}
