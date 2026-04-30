// Shared fixture data for all layout previews

export const boardTasks: any[] = [
  { id: "1", project: "ccv5", milestone: null, title: "Design pipeline architecture", description: "Define the A→B→C→D pipeline", status: "done", priority: "high", assignee: "Rohith", start_date: "2026-04-01", due_date: "2026-04-10", estimated_hours: 8, actual_hours: 10, depends_on: [], created_at: "", updated_at: "" },
  { id: "2", project: "ccv5", milestone: null, title: "Phase A - Understand", description: "", status: "done", priority: "high", assignee: "Rohith", start_date: "2026-04-05", due_date: "2026-04-15", estimated_hours: 12, actual_hours: null, depends_on: [], created_at: "", updated_at: "" },
  { id: "3", project: "ccv5", milestone: null, title: "Phase B - Fill/RAG", description: "RAG pipeline with vLLM", status: "in_progress", priority: "critical", assignee: "Rohith", start_date: "2026-04-10", due_date: "2026-04-25", estimated_hours: 16, actual_hours: null, depends_on: [], created_at: "", updated_at: "" },
  { id: "4", project: "ccv5", milestone: null, title: "Gantt chart widget", description: "", status: "in_progress", priority: "medium", assignee: "Priya", start_date: "2026-04-12", due_date: "2026-04-20", estimated_hours: 10, actual_hours: null, depends_on: [], created_at: "", updated_at: "" },
  { id: "5", project: "ccv5", milestone: null, title: "Phase C - Grid Pack", description: "", status: "todo", priority: "high", assignee: "", start_date: "2026-04-20", due_date: "2026-05-05", estimated_hours: 14, actual_hours: null, depends_on: ["3"], created_at: "", updated_at: "" },
  { id: "6", project: "ccv5", milestone: null, title: "Voice integration", description: "", status: "todo", priority: "medium", assignee: "", start_date: "2026-05-05", due_date: "2026-05-20", estimated_hours: 20, actual_hours: null, depends_on: [], created_at: "", updated_at: "" },
  { id: "7", project: "ccv5", milestone: null, title: "RL training pipeline", description: "", status: "backlog", priority: "medium", assignee: "", start_date: null, due_date: null, estimated_hours: 24, actual_hours: null, depends_on: [], created_at: "", updated_at: "" },
  { id: "8", project: "ccv5", milestone: null, title: "E2E testing", description: "", status: "backlog", priority: "high", assignee: "", start_date: null, due_date: null, estimated_hours: 16, actual_hours: null, depends_on: ["5"], created_at: "", updated_at: "" },
  { id: "9", project: "ccv5", milestone: null, title: "Widget Renderer refactor", description: "", status: "in_review", priority: "high", assignee: "Arjun", start_date: "2026-04-08", due_date: "2026-04-16", estimated_hours: 8, actual_hours: null, depends_on: [], created_at: "", updated_at: "" },
];

export const burndownData = {
  title: "Sprint 12", totalTasks: 9, velocity: 1.2, projectedEndDate: "Apr 20",
  points: [
    { date: "Apr 1", planned: 9, actual: 9 }, { date: "Apr 3", planned: 8, actual: 8 },
    { date: "Apr 5", planned: 7, actual: 7 }, { date: "Apr 7", planned: 5, actual: 7, annotation: "Blocked on API" },
    { date: "Apr 9", planned: 4, actual: 6 },
  ],
  annotations: [{ date: "Apr 7", label: "Blocked", type: "warning" as const }],
};

export const riskData = {
  projectName: "CC v5", overallRisk: "high" as const,
  axes: [
    { axis: "Scope", score: 72, description: "Features added mid-sprint" },
    { axis: "Deadline", score: 85, description: "4 tasks behind" },
    { axis: "Resource", score: 58, description: "Bus factor = 1" },
    { axis: "Deps", score: 45, description: "Manageable chain depth" },
    { axis: "Tech Debt", score: 30, description: "Clean, test gaps" },
    { axis: "External", score: 65, description: "API dependency" },
  ],
  aiSummary: "Deadline risk high due to scope creep + single contributor bottleneck. Freeze scope, parallelize widget work.",
};

export const peopleData = {
  weeks: ["W14", "W15", "W16", "W17"],
  people: [
    { name: "Rohith", role: "Lead", capacity: 40, totalHours: 179, weeks: [{ week: "W14", hours: 45, tasks: 8 }, { week: "W15", hours: 48, tasks: 9 }, { week: "W16", hours: 42, tasks: 7 }, { week: "W17", hours: 44, tasks: 8 }] },
    { name: "Priya", role: "Frontend", capacity: 40, totalHours: 135, weeks: [{ week: "W14", hours: 32, tasks: 5 }, { week: "W15", hours: 35, tasks: 6 }, { week: "W16", hours: 38, tasks: 6 }, { week: "W17", hours: 30, tasks: 4 }] },
    { name: "Arjun", role: "Backend", capacity: 40, totalHours: 118, weeks: [{ week: "W14", hours: 28, tasks: 4 }, { week: "W15", hours: 30, tasks: 5 }, { week: "W16", hours: 35, tasks: 5 }, { week: "W17", hours: 25, tasks: 3 }] },
  ],
};

export const depGraphData = {
  nodes: [
    { id: "d1", label: "Auth API", status: "done" as const, priority: "high" as const, estimatedHours: 8 },
    { id: "d2", label: "User Model", status: "in_progress" as const, priority: "critical" as const, estimatedHours: 6 },
    { id: "d3", label: "Dashboard API", status: "todo" as const, priority: "critical" as const, estimatedHours: 12 },
    { id: "d4", label: "Widget Renderer", status: "backlog" as const, priority: "high" as const, estimatedHours: 16 },
    { id: "d5", label: "Grid Packer", status: "backlog" as const, priority: "high" as const, estimatedHours: 14 },
    { id: "d6", label: "Deploy", status: "backlog" as const, priority: "critical" as const, estimatedHours: 4 },
  ],
  edges: [{ from: "d1", to: "d2" }, { from: "d2", to: "d3" }, { from: "d3", to: "d4" }, { from: "d4", to: "d5" }, { from: "d5", to: "d6" }],
  criticalPath: ["d1", "d2", "d3", "d4", "d5", "d6"],
};

export const swimData = {
  title: "Timeline", range: { start: "2026-04-01", end: "2026-06-30" },
  lanes: [{ id: "be", label: "Backend" }, { id: "fe", label: "Frontend" }, { id: "ml", label: "ML" }, { id: "qa", label: "QA" }],
  tasks: [
    { id: "sw1", label: "Auth API", startDate: "2026-04-01", endDate: "2026-04-12", status: "done" as const, lane: "be" },
    { id: "sw2", label: "Dashboard API", startDate: "2026-04-08", endDate: "2026-04-25", status: "in_progress" as const, lane: "be" },
    { id: "sw3", label: "Login UI", startDate: "2026-04-05", endDate: "2026-04-18", status: "done" as const, lane: "fe" },
    { id: "sw4", label: "Widget Renderer", startDate: "2026-04-15", endDate: "2026-05-10", status: "in_progress" as const, lane: "fe" },
    { id: "sw5", label: "Voice Pipeline", startDate: "2026-04-20", endDate: "2026-05-15", status: "in_progress" as const, lane: "ml" },
    { id: "sw6", label: "E2E Tests", startDate: "2026-05-15", endDate: "2026-06-10", status: "todo" as const, lane: "qa" },
  ],
  milestones: [{ id: "ms1", label: "Alpha", date: "2026-05-01" }, { id: "ms2", label: "Beta", date: "2026-06-01" }],
};

export const storyMapData = [
  { epic: "Voice Pipeline", description: "Voice interactions", phases: [
    { name: "Research", tasks: [{ id: "sm1", title: "STT eval", status: "done" as const, priority: "high" as const }] },
    { name: "Design", tasks: [{ id: "sm2", title: "Architecture", status: "done" as const, priority: "high" as const }] },
    { name: "Build", tasks: [{ id: "sm3", title: "Web Speech", status: "in_progress" as const, priority: "critical" as const, assignee: "Rohith" }] },
    { name: "Ship", tasks: [{ id: "sm4", title: "QA", status: "backlog" as const, priority: "medium" as const }] },
  ]},
  { epic: "Widgets", description: "Dashboard widgets", phases: [
    { name: "Research", tasks: [{ id: "sm5", title: "Audit", status: "done" as const, priority: "medium" as const }] },
    { name: "Design", tasks: [{ id: "sm6", title: "Spec", status: "done" as const, priority: "high" as const }] },
    { name: "Build", tasks: [{ id: "sm7", title: "6 widgets", status: "in_progress" as const, priority: "critical" as const, assignee: "Priya" }] },
    { name: "Ship", tasks: [{ id: "sm8", title: "E2E", status: "backlog" as const, priority: "high" as const }] },
  ]},
];
