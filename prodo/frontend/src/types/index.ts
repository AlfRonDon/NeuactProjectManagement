// ============================================================
// Neuact Project Management — Type Definitions
// ============================================================

export type PMDomain = "tasks";

export interface RAGQuery {
  domain: PMDomain;
  query: string;
  context?: Record<string, unknown>;
}

export interface RAGResult {
  domain: PMDomain;
  rawData: Record<string, unknown>;
  timestamp: number;
  error?: string;
}

export interface OrchestratorOutput {
  intent: string[];
  domains: PMDomain[];
  spawnRag: RAGQuery[];
}

// Event bus types
export type PMEvent =
  | { type: "TRANSCRIPT_UPDATE"; transcript: { role: string; text: string; isFinal: boolean } }
  | { type: "RAG_RESULT"; result: RAGResult }
  | { type: "TASK_UPDATED"; taskId: string }
  | { type: "TASK_CREATED"; taskId?: string }
  | { type: "PROJECT_UPDATED"; projectId: string }
  | { type: "PROJECT_CREATED"; projectId?: string }
  | { type: "BLOCKER_UPDATED"; blockerId?: string }
  | { type: "DATA_CHANGED" };

// Timeline / Gantt types (matching CommandCenter widget spec)
export type TimelineStatus =
  | "normal" | "success" | "warning" | "critical"
  | "idle" | "neutral" | "maintenance" | "offline" | "unknown";

export interface TimelineEvent {
  id: string;
  label: string;
  startTime: string;
  endTime?: string;
  status: TimelineStatus;
  laneId?: string;
  icon?: string;
  clusterCount?: number;
  severityBreakdown?: { critical: number; warning: number; info: number };
  burstDetails?: { correlationId?: string; span?: string; dominantType?: string };
}

export interface TimelineLane {
  id: string;
  label: string;
}

export interface TimelineAnnotation {
  id: string;
  time: string;
  label: string;
  type: "operator_note" | "rca_finding" | "action";
  author?: string;
}

export interface TimelineSpec {
  title: string;
  description: string;
  variant: "linear" | "status" | "multilane" | "forensic" | "dense";
  range: { start: string; end: string };
  events: TimelineEvent[];
  lanes?: TimelineLane[];
  annotations?: TimelineAnnotation[];
  incidentWindow?: { start: string; end: string; label: string };
  stateSegments?: { id: string; start: string; end: string; status: TimelineStatus }[];
}

// API data types
export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  start_date: string | null;
  target_date: string | null;
  task_count: number;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project: string;
  milestone: string | null;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  start_date: string | null;
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  depends_on: string[];
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  project: string;
  name: string;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  task_count: number;
  completed_task_count: number;
}
