/**
 * P0 → P2 bridge: when the Guardian layer detects trust drift beyond the
 * `driftThreshold`, it triggers a recalibration signal for the affected agent
 * on the Self-Calibration layer. Wired to the event bus.
 */
import { emit, useEventBus, type BusEvent } from "@/lib/event-bus";

export type GuardianConfig = {
  driftThreshold: number; // e.g. 0.10 = 10% trust drop
};

const DEFAULTS: GuardianConfig = { driftThreshold: 0.1 };

let unsub: (() => void) | null = null;

export function startGuardianBridge(cfg: Partial<GuardianConfig> = {}) {
  if (unsub) return unsub;
  const config = { ...DEFAULTS, ...cfg };
  let lastLen = useEventBus.getState().events.length;
  unsub = useEventBus.subscribe((state) => {
    const next = state.events;
    if (next.length === lastLen) return;
    const added = next.slice(0, next.length - lastLen) as BusEvent[];
    lastLen = next.length;
    for (const e of added) {
      if (e.type !== "trust.score.updated") continue;
      const p = e.payload as { agent?: string; delta?: number; trust?: number };
      if (typeof p.delta !== "number") continue;
      if (Math.abs(p.delta) >= config.driftThreshold) {
        emit("agent.recalibrate", "bridge.guardian→p2", {
          agent: p.agent,
          reason: "trust.drift",
          delta: p.delta,
          trust: p.trust,
          threshold: config.driftThreshold,
        });
      }
    }
  });
  return unsub;
}

export function stopGuardianBridge() {
  if (unsub) {
    unsub();
    unsub = null;
  }
}
