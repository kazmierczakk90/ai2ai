/**
 * P3 → Core bridge: rebalances per-agent influence weights based on recent
 * SDA routing activity. The most-used agents get their weight slightly
 * lowered (fatigue) while quiet ones recover (rest).
 */
import { emit, useEventBus, type BusEvent } from "@/lib/event-bus";

const weights = new Map<string, number>();
const usage = new Map<string, number>();

export function getInfluenceWeights(): Record<string, number> {
  return Object.fromEntries(weights.entries());
}

let unsub: (() => void) | null = null;
let ticker: ReturnType<typeof setInterval> | null = null;

export function startInfluenceBridge() {
  if (unsub) return;
  let lastLen = useEventBus.getState().events.length;
  unsub = useEventBus.subscribe((state) => {
    const next = state.events;
    if (next.length === lastLen) return;
    const added = next.slice(0, next.length - lastLen) as BusEvent[];
    lastLen = next.length;
    for (const e of added) {
      if (e.type !== "sda.route" && e.type !== "agent.selected") continue;
      const p = e.payload as { agent?: string; name?: string };
      const key = p.agent ?? p.name;
      if (!key) continue;
      usage.set(key, (usage.get(key) ?? 0) + 1);
    }
  });
  ticker = setInterval(() => {
    if (usage.size === 0) return;
    const rebalanced: Record<string, number> = {};
    for (const [agent, count] of usage) {
      const prev = weights.get(agent) ?? 1;
      const fatigue = Math.min(0.15, count * 0.02);
      const w = Math.max(0.3, Math.min(1.5, prev * (1 - fatigue) + 0.05));
      weights.set(agent, Math.round(w * 100) / 100);
      rebalanced[agent] = weights.get(agent)!;
    }
    // Rest for idle agents
    for (const [agent, w] of weights) {
      if (!usage.has(agent)) {
        const rested = Math.min(1.5, w + 0.03);
        weights.set(agent, Math.round(rested * 100) / 100);
      }
    }
    usage.clear();
    emit("influence.rebalanced", "bridge.influence→core", { weights: rebalanced });
  }, 15_000);
}

export function stopInfluenceBridge() {
  if (unsub) unsub();
  if (ticker) clearInterval(ticker);
  unsub = null;
  ticker = null;
}
