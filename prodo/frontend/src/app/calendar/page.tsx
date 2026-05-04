"use client";

import React, { useEffect } from "react";
import { CalendarView } from "@/components/layouts";
import { PageShell } from "@/design";
import { selectCalendarTasks, usePMStore } from "@/lib/store";

export default function CalendarPage() {
  const tasks = usePMStore(selectCalendarTasks);
  const tasksStatus = usePMStore(s => s.tasksStatus);
  const calendarStatus = usePMStore(s => s.calendarStatus);
  const fetchTasks = usePMStore(s => s.fetchTasks);
  const fetchCalendar = usePMStore(s => s.fetchCalendar);

  useEffect(() => {
    if (calendarStatus === "idle") fetchCalendar().catch(() => {});
    if (tasksStatus === "idle") fetchTasks().catch(() => {});
  }, [calendarStatus, fetchCalendar, fetchTasks, tasksStatus]);

  return (
    <PageShell title="Plan View" contentMode="padded">
      <CalendarView tasks={tasks} />
    </PageShell>
  );
}
