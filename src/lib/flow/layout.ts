/**
 * Deterministic layered auto-layout for the Flow Canvas.
 * Ranks nodes left→right by longest-path from entry nodes, then spreads
 * each rank vertically. Pure function — used by the toolbar button and by
 * the AI document import.
 */
import type { FlowEdge, FlowNode } from "@/store/flow-store";

export const LAYOUT_X_GAP = 230;
export const LAYOUT_Y_GAP = 104;
export const LAYOUT_ORIGIN = { x: 130, y: 110 };

export function computeLayout(
  nodes: Pick<FlowNode, "id" | "kind">[],
  edges: Pick<FlowEdge, "from" | "to">[],
): Record<string, { x: number; y: number }> {
  const ids = nodes.map((n) => n.id);
  const idSet = new Set(ids);
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  for (const id of ids) {
    incoming.set(id, []);
    outgoing.set(id, []);
  }
  for (const e of edges) {
    if (!idSet.has(e.from) || !idSet.has(e.to) || e.from === e.to) continue;
    outgoing.get(e.from)!.push(e.to);
    incoming.get(e.to)!.push(e.from);
  }

  const rank = new Map<string, number>();
  const roots = ids.filter(
    (id) => incoming.get(id)!.length === 0 || nodes.find((n) => n.id === id)?.kind === "start",
  );
  const queue = (roots.length ? roots : ids.slice(0, 1)).slice();
  for (const r of queue) rank.set(r, 0);

  let guard = 0;
  while (queue.length && guard++ < ids.length * ids.length + 50) {
    const cur = queue.shift()!;
    const base = rank.get(cur) ?? 0;
    for (const next of outgoing.get(cur) ?? []) {
      const proposed = base + 1;
      if ((rank.get(next) ?? -1) < proposed) {
        rank.set(next, proposed);
        queue.push(next);
      }
    }
  }
  // Disconnected leftovers
  let fallback = 0;
  for (const id of ids) {
    if (!rank.has(id)) rank.set(id, fallback++ % 3);
  }
  // END nodes always sit last
  const maxRank = Math.max(0, ...Array.from(rank.values()));
  for (const n of nodes) {
    if (n.kind === "end") rank.set(n.id, maxRank);
  }

  const byRank = new Map<number, string[]>();
  for (const id of ids) {
    const r = rank.get(id) ?? 0;
    if (!byRank.has(r)) byRank.set(r, []);
    byRank.get(r)!.push(id);
  }

  const tallest = Math.max(1, ...Array.from(byRank.values(), (c) => c.length));
  const positions: Record<string, { x: number; y: number }> = {};
  for (const [r, column] of Array.from(byRank.entries()).sort((a, b) => a[0] - b[0])) {
    const offset = ((tallest - column.length) * LAYOUT_Y_GAP) / 2;
    column.forEach((id, i) => {
      positions[id] = {
        x: LAYOUT_ORIGIN.x + r * LAYOUT_X_GAP,
        y: LAYOUT_ORIGIN.y + offset + i * LAYOUT_Y_GAP,
      };
    });
  }
  return positions;
}

export type GraphIssue = { level: "warn" | "error"; message: string; nodeId?: string };

export function validateGraph(nodes: FlowNode[], edges: FlowEdge[]): GraphIssue[] {
  const issues: GraphIssue[] = [];
  if (!nodes.length) return issues;
  if (!nodes.some((n) => n.kind === "start")) {
    issues.push({ level: "error", message: "brak węzła START" });
  }
  if (!nodes.some((n) => n.kind === "end")) {
    issues.push({ level: "warn", message: "brak węzła END" });
  }
  const touched = new Set<string>();
  for (const e of edges) {
    touched.add(e.from);
    touched.add(e.to);
  }
  for (const n of nodes) {
    if (!touched.has(n.id) && nodes.length > 1) {
      issues.push({ level: "warn", message: `${n.agent} nie ma połączeń`, nodeId: n.id });
    }
  }
  for (const e of edges) {
    if (!e.label?.trim()) {
      issues.push({ level: "warn", message: "strzałka bez opisu zadania" });
      break;
    }
  }
  return issues;
}
