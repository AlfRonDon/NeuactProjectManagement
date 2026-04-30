"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CalendarLayout from "@/components/layouts/CalendarLayout";
import { fetchTasks } from "@/lib/api";

export default function CalendarPage() {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchTasks().then((data: any[]) => {
      const mapped = data.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description || "",
        status: t.status,
        priority: t.priority,
        assignee: t.assignee || "",
        start_date: t.start_date,
        due_date: t.due_date,
        estimated_hours: t.estimated_hours,
        project: t.project,
      }));
      setTasks(mapped);
    }).catch(() => {});
  }, []);

  return (
    <div className="h-screen bg-neutral-100 flex flex-col overflow-hidden">
      <div className="bg-white border-b border-neutral-200 px-5 py-2 flex items-center gap-3 shrink-0">
        <Link href="/" className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-neutral-500" />
        </Link>
        <div className="w-6 h-6 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-xs font-bold shrink-0">N</div>
        <span className="text-sm font-semibold text-neutral-700">Calendar</span>
      </div>
      <div className="flex-1 p-4 overflow-hidden min-h-0">
        <CalendarLayout className="h-full" tasks={tasks.length > 0 ? tasks : undefined} />
      </div>
    </div>
  );
}
