export type AgentEvent =
  | { type: "APPROVAL_REQUIRED"; callId: string; toolName: string; description: string; args: any; timestamp: number }
  | { type: "APPROVAL_RESOLVED"; callId: string; approved: boolean; timestamp: number };

type Listener = (event: AgentEvent) => void;

class EventBus {
  private listeners = new Set<Listener>();
  emit(event: AgentEvent) {
    this.listeners.forEach((l) => { try { l(event); } catch {} });
  }
  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const eventBus = new EventBus();
export type { EventBus };
