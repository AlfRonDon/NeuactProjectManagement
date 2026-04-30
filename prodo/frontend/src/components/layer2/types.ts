import { PMDomain, RAGQuery, RAGResult } from "@/types";

/**
 * RAGPipeline — Interface for all domain pipelines.
 */
export interface RAGPipeline {
  domain: PMDomain;
  enabled: boolean;
  execute(query: RAGQuery): Promise<RAGResult>;
  healthCheck(): Promise<boolean>;
}

export interface PipelineRegistryEntry {
  pipeline: RAGPipeline;
  priority: number;
}
