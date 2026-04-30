import { RAGPipeline } from "../types";
import { RAGQuery, RAGResult } from "@/types";
import { API_BASE_URL, API_PREFIX } from "@/lib/config";

/**
 * Tasks RAG Pipeline — Layer 2B
 *
 * Queries the project management backend for:
 * - Task status, overdue tasks, progress
 * - Project summaries, Gantt data
 * - Milestone tracking
 *
 * Data source: Django → SQLite (projects app)
 */
export class TasksRAGPipeline implements RAGPipeline {
  domain = "tasks" as const;
  enabled = true;

  private apiBaseUrl: string;

  constructor(apiBaseUrl?: string) {
    this.apiBaseUrl = apiBaseUrl || API_BASE_URL;
  }

  async execute(query: RAGQuery): Promise<RAGResult> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}${API_PREFIX}/projects/orchestrate/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: query.query,
            context: query.context || {},
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Tasks RAG returned ${response.status}`);
      }

      const data = await response.json();

      return {
        domain: "tasks",
        rawData: data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        domain: "tasks",
        rawData: {},
        timestamp: Date.now(),
        error:
          error instanceof Error ? error.message : "Tasks RAG query failed",
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}${API_PREFIX}/projects/projects/`
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
