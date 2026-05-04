"use client";

import React, { useEffect } from "react";
import { LayoutGrid } from "lucide-react";
import TaskBoard from "@/components/widgets/task-board";
import { boardTasks } from "@/components/layouts/fixtures";
import { PageShell } from "@/design";
import { selectBoardTasks, usePMStore } from "@/lib/store";

export default function BoardPage() {
  const tasks = usePMStore(selectBoardTasks);
  const tasksStatus = usePMStore(s => s.tasksStatus);
  const fetchTasks = usePMStore(s => s.fetchTasks);

  useEffect(() => {
    if (tasksStatus === "idle") fetchTasks().catch(() => {});
  }, [fetchTasks, tasksStatus]);

  const isInitialLoading = (tasksStatus === "idle" || tasksStatus === "loading") && tasks.length === 0;
  const tasksToUse = tasks.length > 0 || tasksStatus !== "error" ? tasks : boardTasks;

  return (
    <PageShell title="Task Board" contentMode="flush">
      <div className="h-full overflow-auto p-3">
        {isInitialLoading ? (
          <div className="h-full flex items-center justify-center text-sm text-neutral-500">Loading...</div>
        ) : (
          <TaskBoard tasks={tasksToUse} />
        )}
      </div>
    </PageShell>
  );
}
