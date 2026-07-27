/**
 * Style-memory bridge: tracks recent accent/style shifts and derives a
 * "profile" (calm | focused | urgent) from the frequency of changes.
 */
import { emit, useEventBus, type BusEvent } from "@/lib/event-bus";

const CYCLE_WINDOW_MS = 60_000;
const cycles: number[] = [];

export type StyleProfile = "calm" | "focused" | "urgent";

let currentProfile: StyleProfile = "calm";
let unsub: (() => void) | null = null;

export function getStyleProfile(): StyleProfile {
  return currentProfile;
}

function derive(count: number): StyleProfile {
  if (count >= 4) return "urgent";
  if (count >= 2) return "focused";
  return "calm";
}

export function startStyleMemoryBridge() {
  if (unsub) return;
  let lastLen = useEventBus.getState().events.length;
  unsub = useEventBus.subscribe((state) => {
    const next = state.events;
    if (next.length === lastLen) return;
    const added = next.slice(0, next.length - lastLen) as BusEvent[];
    lastLen = next.length;
    const now = Date.now();
    for (const e of added) {
      if (e.type !== "accent.cycled") continue;
      cycles.push(now);
    }
    while (cycles.length && now - cycles[0] > CYCLE_WINDOW_MS) cycles.shift();
    const next2 = derive(cycles.length);
    if (next2 !== currentProfile) {
      currentProfile = next2;
      emit("style.profile.changed", "bridge.style.memory", {
        profile: currentProfile,
        cycles_last_minute: cycles.length,
      });
    }
  });
}

export function stopStyleMemoryBridge() {
  if (unsub) unsub();
  unsub = null;
}
