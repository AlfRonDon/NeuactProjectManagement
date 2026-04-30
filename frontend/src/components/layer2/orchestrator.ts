import { RAGQuery, RAGResult, OrchestratorOutput } from "@/types";
import { RAGPipeline, PipelineRegistryEntry } from "./types";
import { TasksRAGPipeline } from "./pipelines/tasks";
import { pmBus } from "@/lib/events";

/**
 * Orchestrator — Layer 2A
 *
 * Receives natural language transcripts, identifies task-management intents,
 * and spawns the tasks RAG pipeline.
 *
 * This is the project-management-only version of the CommandCenter orchestrator.
 */
class Orchestrator {
  private registry: Map<string, PipelineRegistryEntry> = new Map();

  constructor() {
    this.registerPipeline(new TasksRAGPipeline(), 1);

    pmBus.on("TRANSCRIPT_UPDATE", (event) => {
      if (
        event.type === "TRANSCRIPT_UPDATE" &&
        event.transcript.role === "user" &&
        event.transcript.isFinal
      ) {
        this.processTranscript(event.transcript.text);
      }
    });
  }

  registerPipeline(pipeline: RAGPipeline, priority: number): void {
    this.registry.set(pipeline.domain, { pipeline, priority });
  }

  parseIntent(transcript: string): OrchestratorOutput {
    const lower = transcript.toLowerCase();
    const intents: string[] = [];

    if (
      ["task", "project", "milestone", "deadline", "assignment", "progress",
       "timeline", "gantt", "overdue", "schedule", "sprint", "backlog",
       "board", "kanban", "priority", "blocked", "dependency"].some((kw) =>
        lower.includes(kw)
      )
    ) {
      intents.push("query_tasks");
    }

    if (intents.length === 0) {
      intents.push("general_query");
    }

    return {
      intent: intents,
      domains: ["tasks"],
      spawnRag: [{ domain: "tasks", query: transcript }],
    };
  }

  async executeParallel(queries: RAGQuery[]): Promise<RAGResult[]> {
    const promises = queries
      .filter((q) => {
        const entry = this.registry.get(q.domain);
        return entry && entry.pipeline.enabled;
      })
      .map((q) => {
        const entry = this.registry.get(q.domain)!;
        return entry.pipeline.execute(q);
      });

    const results = await Promise.allSettled(promises);

    return results.map((r, i) => {
      if (r.status === "fulfilled") return r.value;
      return {
        domain: queries[i].domain,
        rawData: {},
        timestamp: Date.now(),
        error: r.reason?.message || "Pipeline execution failed",
      };
    });
  }

  async processTranscript(transcript: string): Promise<RAGResult[]> {
    const intent = this.parseIntent(transcript);
    const results = await this.executeParallel(intent.spawnRag);

    results.forEach((result) => {
      pmBus.emit({ type: "RAG_RESULT", result });
    });

    return results;
  }
}

export const orchestrator = new Orchestrator();
