import { create } from "zustand";

/**
 * Mock in-frontend Event Bus. Every meaningful action in the app should
 * `emit()` a strongly-typed event; the debug terminal subscribes to the store
 * and renders raw JSON in real time. This mirrors the shape we will publish to
 * the FastAPI backend later.
 */

export type BusEventType =
  | "message.sent"
  | "message.received"
  | "action.queued"
  | "action.completed"
  | "trust.score.updated"
  | "agent.status.changed"
  | "agent.selected"
  | "expert.assigned"
  | "voice.mode.toggled"
  | "accent.cycled"
  | "emergency.triggered"
  | "emergency.cleared"
  | "api.request"
  | "api.response"
  | "api.error";

export type BusEvent<P = unknown> = {
  id: string;
  ts: string; // ISO-8601
  type: BusEventType;
  source: string; // e.g. "@dispatcher", "api.sendMessageToCore"
  payload: P;
};

type BusState = {
  events: BusEvent[];
  paused: boolean;
  cap: number;
  emit: <P>(type: BusEventType, source: string, payload?: P) => BusEvent<P>;
  clear: () => void;
  setPaused: (p: boolean) => void;
};

let seq = 0;
const newId = () => `evt-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export const useEventBus = create<BusState>((set, get) => ({
  events: [],
  paused: false,
  cap: 250,
  emit: <P,>(type: BusEventType, source: string, payload?: P) => {
    const evt: BusEvent<P> = {
      id: newId(),
      ts: new Date().toISOString(),
      type,
      source,
      payload: (payload ?? {}) as P,
    };
    if (!get().paused) {
      set((s) => {
        const next = [evt, ...s.events];
        if (next.length > s.cap) next.length = s.cap;
        return { events: next };
      });
    }
    return evt;
  },
  clear: () => set({ events: [] }),
  setPaused: (p) => set({ paused: p }),
}));

// Non-hook accessor for use inside other stores / async services.
export const emit = <P,>(type: BusEventType, source: string, payload?: P) =>
  useEventBus.getState().emit<P>(type, source, payload);
