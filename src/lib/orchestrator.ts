/**
 * Agent state-machine orchestrator. Ports the heartbeat + retry monitor logic
 * from `agent_orchestrator.py` into the frontend store: on a cadence it scans
 * agent heartbeats and forces stalled agents into the ERROR state (with a
 * bounded retry count). Emits telemetry through the event bus.
 */
import { useKK1Store } from "@/store/kk1-store";

let interval: ReturnType<typeof setInterval> | null = null;
let heartbeatTicker: ReturnType<typeof setInterval> | null = null;

const HEARTBEAT_TIMEOUT_MS = 60_000;
const SCAN_INTERVAL_MS = 10_000;
const HEARTBEAT_INTERVAL_MS = 5_000;

export function startOrchestrator() {
  if (interval) return;

  // Scan for stalled agents.
  interval = setInterval(() => {
    useKK1Store.getState().scanHeartbeats(HEARTBEAT_TIMEOUT_MS);
  }, SCAN_INTERVAL_MS);

  // Simulate periodic heartbeats from healthy agents.
  heartbeatTicker = setInterval(() => {
    const agents = useKK1Store.getState().agents;
    // Randomly heartbeat ~40% of non-archived agents each tick.
    for (const a of agents) {
      if (a.state === "ARCHIVED") continue;
      if (Math.random() < 0.4) useKK1Store.getState().heartbeat(a.id);
    }
  }, HEARTBEAT_INTERVAL_MS);
}

export function stopOrchestrator() {
  if (interval) clearInterval(interval);
  if (heartbeatTicker) clearInterval(heartbeatTicker);
  interval = null;
  heartbeatTicker = null;
}
