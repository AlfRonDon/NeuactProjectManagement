"use client";

import React from "react";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  ArrowRight,
  Search,
} from "lucide-react";
import { Task } from "@/types";

const COLUMNS = [
  { key: "backlog", label: "Backlog", color: "bg-neutral-100 text-neutral-600" },
  { key: "todo", label: "To Do", color: "bg-blue-50 text-blue-700" },
  { key: "in_progress", label: "In Progress", color: "bg-amber-50 text-amber-700" },
  { key: "in_review", label: "In Review", color: "bg-purple-50 text-purple-700" },
  { key: "done", label: "Done", color: "bg-green-50 text-green-700" },
];

const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const styles: Record<string, string> = {
    critical: "bg-red-100 text-red-700 border-red-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    low: "bg-neutral-100 text-neutral-500 border-neutral-200",
  };
  return (
    <span
      className={`text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${styles[priority] || styles.medium}`}
    >
      {priority}
    </span>
  );
};

const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    !["done", "cancelled"].includes(task.status);

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-xs font-semibold text-neutral-800 leading-snug line-clamp-2">
          {task.title}
        </h4>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.assignee && (
        <div className="text-xs text-neutral-400 mb-1.5">
          {task.assignee}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs">
        {task.due_date && (
          <span
            className={`flex items-center gap-0.5 font-mono ${
              isOverdue ? "text-red-500 font-bold" : "text-neutral-400"
            }`}
          >
            {isOverdue ? (
              <AlertTriangle className="w-3 h-3" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            {task.due_date}
          </span>
        )}
        {task.depends_on.length > 0 && (
          <span className="text-neutral-300 flex items-center gap-0.5">
            <ArrowRight className="w-3 h-3" />
            {task.depends_on.length} dep
          </span>
        )}
      </div>
    </div>
  );
};

export default function TaskBoard({ tasks }: { tasks: Task[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400">
          Task Board
        </h3>
        <span className="text-xs font-mono text-neutral-400 bg-neutral-100 px-2 py-1 rounded border border-neutral-200">
          {tasks.length} tasks
        </span>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="min-h-[200px]">
              <div
                className={`text-xs font-bold uppercase tracking-widest px-2 py-1.5 rounded mb-2 flex items-center justify-between ${col.color}`}
              >
                {col.label}
                <span className="opacity-60">{columnTasks.length}</span>
              </div>
              <div className="space-y-2">
                {columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {columnTasks.length === 0 && (
                  <div className="text-xs text-neutral-300 text-center py-6">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
