// ============================================================
// Neuact PM — Event Bus
// Inter-layer communication: Layer 1 -> Layer 2 -> Widgets
// ============================================================

import { PMEvent } from "@/types";

type EventHandler = (event: PMEvent) => void;

class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private allHandlers: Set<EventHandler> = new Set();

  on(eventType: PMEvent["type"], handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  onAny(handler: EventHandler): () => void {
    this.allHandlers.add(handler);
    return () => {
      this.allHandlers.delete(handler);
    };
  }

  emit(event: PMEvent): void {
    const typeHandlers = this.handlers.get(event.type);
    if (typeHandlers) {
      typeHandlers.forEach((handler) => {
        try { handler(event); } catch (e) { console.error("[EventBus]", e); }
      });
    }
    this.allHandlers.forEach((handler) => {
      try { handler(event); } catch (e) { console.error("[EventBus]", e); }
    });
  }
}

const GLOBAL_KEY = "__neuactPMBus__";
export const pmBus: EventBus =
  (globalThis as Record<string, unknown>)[GLOBAL_KEY] as EventBus ??
  ((globalThis as Record<string, unknown>)[GLOBAL_KEY] = new EventBus());
