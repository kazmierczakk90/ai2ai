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
  | "agent.focus.set"
  | "agent.recalibrate"
  | "expert.assigned"
  | "voice.mode.toggled"
  | "voice.command.matched"
  | "accent.cycled"
  | "style.profile.changed"
  | "emergency.triggered"
  | "emergency.cleared"
  | "evolution.frozen"
  | "evolution.resumed"
  | "maintenance.toggled"
  | "sda.route"
  | "kpi.threshold.breached"
  | "influence.rebalanced"
  | "api.request"
  | "api.response"
  | "api.error"
  | "process.approved"
  | "sda.decision"
  | "agent.state.transitioned"
  | "agent.heartbeat.missed"
  | "agent.retry"
  | "code.session.step"
  | "bus.replay"
  | "bus.snapshot";

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
  replay: (id: string) => void;
  snapshot: () => string;
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
  replay: (id) => {
    const src = get().events.find((e) => e.id === id);
    if (!src) return;
    get().emit("bus.replay", "eventlog.replay", {
      original_id: src.id,
      type: src.type,
      source: src.source,
      payload: src.payload,
    });
  },
  snapshot: () => {
    const events = get().events;
    const json = JSON.stringify(
      { taken_at: new Date().toISOString(), count: events.length, events },
      null,
      2,
    );
    get().emit("bus.snapshot", "eventlog.snapshot", { count: events.length });
    if (typeof window !== "undefined") {
      try {
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `kk1-event-snapshot-${Date.now()}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch {
        /* ignore */
      }
    }
    return json;
  },
}));

// Non-hook accessor for use inside other stores / async services.
export const emit = <P,>(type: BusEventType, source: string, payload?: P) =>
  useEventBus.getState().emit<P>(type, source, payload);
