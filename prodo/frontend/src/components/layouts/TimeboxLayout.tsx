"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Timer, Play, Pause, SkipForward, RotateCcw, CheckCircle2, Flame,
  ListOrdered, BarChart3,
} from "lucide-react";

import { boardTasks } from "./fixtures";

const FOCUS_MINUTES = 25;
const BREAK_MINUTES = 5;

export default function TimeboxLayout() {
  const queue = boardTasks.filter((t) => t.status === "todo" || t.status === "in_progress").slice(0, 5);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(FOCUS_MINUTES * 60);
  const [sessions, setSessions] = useState([
    { task: "Design pipeline architecture", duration: 25, completed: true, time: "9:00 AM" },
    { task: "Phase A - Understand", duration: 25, completed: true, time: "9:30 AM" },
    { task: "Phase A - Understand", duration: 25, completed: true, time: "10:00 AM" },
  ]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentTask = queue[currentIdx];
  const totalMinutes = mode === "focus" ? FOCUS_MINUTES : BREAK_MINUTES;
  const progress = ((totalMinutes * 60 - seconds) / (totalMinutes * 60)) * 100;

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else if (seconds === 0 && running) {
      setRunning(false);
      if (mode === "focus") {
        setSessions((prev) => [...prev, { task: currentTask?.title || "Unknown", duration: FOCUS_MINUTES, completed: true, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
        setMode("break");
        setSeconds(BREAK_MINUTES * 60);
      } else {
        setMode("focus");
        setSeconds(FOCUS_MINUTES * 60);
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, seconds, mode, currentTask]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const reset = () => { setRunning(false); setSeconds(mode === "focus" ? FOCUS_MINUTES * 60 : BREAK_MINUTES * 60); };
  const skip = () => { if (currentIdx < queue.length - 1) { setCurrentIdx(currentIdx + 1); reset(); setMode("focus"); setSeconds(FOCUS_MINUTES * 60); } };

  const totalFocusMin = sessions.filter((s) => s.completed).length * FOCUS_MINUTES;

  // Mini burndown data
  const burndownPoints = [
    { label: "9AM", remaining: 5 }, { label: "10AM", remaining: 4 }, { label: "11AM", remaining: 3 },
    { label: "12PM", remaining: 3 }, { label: "1PM", remaining: 2 }, { label: "Now", remaining: queue.length },
  ];
  const maxRemaining = Math.max(...burndownPoints.map((p) => p.remaining));

  return (
    <div className="h-[700px] rounded-lg overflow-hidden border border-neutral-200 bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-3 border-b flex items-center gap-3 shrink-0">
        <Timer className="w-5 h-5 text-hot-solid" />
        <h3 className="text-sm font-serif font-bold text-neutral-950">Timebox</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${mode === "focus" ? "bg-hot-bg text-hot-fg" : "bg-ok-bg text-ok-fg"}`}>
          {mode === "focus" ? "Focus" : "Break"}
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-hot-solid" />
          <span className="text-xs text-neutral-500">{sessions.length} sessions &middot; {totalFocusMin} min focused</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: timer + current task */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 border-r border-neutral-100">
          {/* Timer ring */}
          <div className="relative w-48 h-48 mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border-subtle)" strokeWidth="6" />
              <circle cx="50" cy="50" r="45" fill="none"
                stroke={mode === "focus" ? "var(--hot-solid)" : "var(--ok-solid)"} strokeWidth="6"
                strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-neutral-950 tabular-nums">{formatTime(seconds)}</span>
              <span className="text-xs text-neutral-400 mt-1 uppercase tracking-wider">{mode === "focus" ? "Focus time" : "Take a break"}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={reset} className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors">
              <RotateCcw className="w-4 h-4 text-neutral-500" />
            </button>
            <button onClick={() => setRunning(!running)}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-colors ${mode === "focus" ? "bg-hot-solid hover:bg-hot-solid/90" : "bg-ok-solid hover:bg-ok-solid/90"}`}>
              {running ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>
            <button onClick={skip} className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors">
              <SkipForward className="w-4 h-4 text-neutral-500" />
            </button>
          </div>

          {/* Current task */}
          {currentTask && (
            <div className="w-full max-w-sm bg-neutral-50 rounded-lg border border-neutral-200 p-4 text-center">
              <div className="text-[9px] uppercase font-bold tracking-widest text-hot-solid mb-1">Current Task</div>
              <div className="text-sm font-serif font-bold text-neutral-950">{currentTask.title}</div>
              <div className="text-xs text-neutral-500 mt-1">
                {currentTask.priority} priority &middot; {currentTask.estimated_hours}h estimated
                {currentTask.assignee && ` \u00B7 ${currentTask.assignee}`}
              </div>
            </div>
          )}

          {/* Task queue */}
          <div className="w-full max-w-sm mt-4">
            <div className="flex items-center gap-1.5 mb-2">
              <ListOrdered className="w-3 h-3 text-neutral-400" />
              <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-400">Up Next</span>
            </div>
            <div className="space-y-1">
              {queue.slice(currentIdx + 1).map((task, i) => (
                <div key={task.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-100 hover:bg-neutral-100 transition-colors cursor-pointer">
                  <span className="text-[9px] text-neutral-400 font-bold w-4">{i + 1}</span>
                  <span className="text-xs text-neutral-700 flex-1 truncate">{task.title}</span>
                  <span className="text-[9px] text-neutral-400">{task.estimated_hours}h</span>
                </div>
              ))}
              {queue.slice(currentIdx + 1).length === 0 && (
                <div className="text-xs text-neutral-400 text-center py-2">No more tasks in queue</div>
              )}
            </div>
          </div>
        </div>

        {/* Right: session history + mini burndown */}
        <div className="w-72 flex flex-col p-4 overflow-y-auto bg-neutral-50/50">
          {/* Mini burndown */}
          <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-4">
            <div className="flex items-center gap-1.5 mb-3">
              <BarChart3 className="w-3 h-3 text-neutral-400" />
              <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-400">Daily Burndown</span>
            </div>
            <div className="h-20 flex items-end gap-1">
              {burndownPoints.map((p, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full rounded-t transition-all ${i === burndownPoints.length - 1 ? "bg-hot-solid" : "bg-neutral-300"}`}
                    style={{ height: `${(p.remaining / maxRemaining) * 100}%` }} />
                  <span className="text-[7px] text-neutral-400">{p.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Session history */}
          <div className="flex items-center gap-1.5 mb-3">
            <CheckCircle2 className="w-3 h-3 text-ok-solid" />
            <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-400">Completed Sessions</span>
          </div>
          <div className="space-y-1.5 flex-1">
            {[...sessions].reverse().map((s, i) => (
              <div key={i} className="bg-white rounded-lg border border-neutral-100 px-3 py-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-ok-solid shrink-0" />
                  <span className="text-xs text-neutral-700 flex-1 truncate">{s.task}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 ml-5">
                  <span className="text-[9px] text-neutral-400">{s.time}</span>
                  <span className="text-[9px] text-neutral-400">{s.duration} min</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
