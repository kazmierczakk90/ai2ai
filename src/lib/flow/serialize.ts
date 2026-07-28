import type { FlowEdge, FlowNode } from "@/store/flow-store";

const SYM: Record<string, string> = {
  SEQ: "①",
  PAR: "①",
  COND: "◆",
  LOOP: "↻",
  GATE: "▣",
};

/**
 * Serialize a flow graph into a compact FUKO process block that the
 * ProcessEditor / Gemini Process-Designer can round-trip.
 *
 *   $-<name>
 *   TRIGGER: <trigger>
 *   ① [SEQ] @agent → /skill  — <label>
 *   ② [COND] &-<condition> → TAK: n | NIE: m
 *   …
 *
 * Nodes are visited in topological order (start → end); disconnected
 * nodes are appended at the end.
 */
export function serializeFlow(
  name: string,
  trigger: string,
  nodes: FlowNode[],
  edges: FlowEdge[],
): string {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const outgoing = new Map<string, FlowEdge[]>();
  for (const e of edges) {
    const arr = outgoing.get(e.from) ?? [];
    arr.push(e);
    outgoing.set(e.from, arr);
  }

  const start = nodes.find((n) => n.kind === "start") ?? nodes[0];
  const order: string[] = [];
  const seen = new Set<string>();
  const stack: string[] = start ? [start.id] : [];
  while (stack.length) {
    const id = stack.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    order.push(id);
    for (const e of outgoing.get(id) ?? []) stack.push(e.to);
  }
  for (const n of nodes) if (!seen.has(n.id)) order.push(n.id);

  const lines: string[] = [];
  lines.push(`$-${name || "unnamed-process"}`);
  lines.push(`TRIGGER: ${trigger || "operator request"}`);

  let idx = 0;
  const stepNo = (n: number) => String.fromCharCode(0x2460 + Math.min(n, 19));

  for (const id of order) {
    const node = byId.get(id);
    if (!node) continue;
    const outs = outgoing.get(id) ?? [];
    if (!outs.length) continue;
    for (const e of outs) {
      idx += 1;
      const target = byId.get(e.to);
      const targetAgent = target?.agent ?? "?";
      const sym = SYM[e.type] ?? "•";
      const skill = e.skill ? ` → /${e.skill}` : "";
      const cond = e.type === "COND" && e.condition ? ` &-${e.condition}` : "";
      const loop =
        e.type === "LOOP" && e.maxIterations ? ` (max ${e.maxIterations})` : "";
      const prio = e.priority ? ` [p${e.priority}]` : "";
      lines.push(
        `${stepNo(idx - 1)} [${e.type}] ${node.agent} → ${targetAgent}${skill}${cond}${loop}${prio}  — ${e.label || "task"} ${sym}`,
      );
    }
  }

  if (idx === 0) lines.push("(empty graph — add nodes and connect them)");
  return "```\n" + lines.join("\n") + "\n```";
}
