import { Trash2 } from "lucide-react";
import { useFlowStore, type FlowEdgeType } from "@/store/flow-store";
import { routeSda } from "@/lib/sda/router";
import { useMemo } from "react";

const EDGE_TYPES: FlowEdgeType[] = ["SEQ", "PAR", "COND", "LOOP", "GATE"];
const SKILLS = [
  "kb-query",
  "kb-write",
  "agent-ask",
  "agent-broadcast",
  "opinion-engine",
  "agent-consensus",
  "chain-of-thought-log",
  "task-delegation",
  "context-sync",
  "realtime-monitor",
];

export function Inspector() {
  const selection = useFlowStore((s) => s.selection);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const updateNode = useFlowStore((s) => s.updateNode);
  const updateEdge = useFlowStore((s) => s.updateEdge);
  const removeNode = useFlowStore((s) => s.removeNode);
  const removeEdge = useFlowStore((s) => s.removeEdge);

  if (!selection) {
    return (
      <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-panel">
        <div className="border-b border-border px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          inspector
        </div>
        <div className="p-3 font-mono text-[11px] text-muted-foreground">
          Select a node or edge to edit. Click a node then click another to draw an edge.
        </div>
      </aside>
    );
  }

  if (selection.kind === "node") {
    const node = nodes.find((n) => n.id === selection.id);
    if (!node) return null;
    return (
      <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-panel">
        <div className="flex items-center justify-between border-b border-border px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>node · {node.kind}</span>
          <button
            onClick={() => removeNode(node.id)}
            className="rounded p-1 text-fuko-guard hover:bg-fuko-guard/10"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
        <div className="space-y-3 p-3">
          <Field label="agent">
            <input
              value={node.agent}
              onChange={(e) => updateNode(node.id, { agent: e.target.value })}
              className="w-full rounded border border-border bg-background/60 px-2 py-1 font-mono text-[11px] text-primary outline-none focus:border-primary/60"
            />
          </Field>
          <Field label="note">
            <textarea
              value={node.note ?? ""}
              onChange={(e) => updateNode(node.id, { note: e.target.value })}
              rows={3}
              placeholder="agent role / context"
              className="w-full rounded border border-border bg-background/60 px-2 py-1 font-mono text-[11px] outline-none focus:border-primary/60"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="x">
              <input
                type="number"
                value={Math.round(node.x)}
                onChange={(e) => updateNode(node.id, { x: Number(e.target.value) })}
                className="w-full rounded border border-border bg-background/60 px-2 py-1 font-mono text-[11px] outline-none focus:border-primary/60"
              />
            </Field>
            <Field label="y">
              <input
                type="number"
                value={Math.round(node.y)}
                onChange={(e) => updateNode(node.id, { y: Number(e.target.value) })}
                className="w-full rounded border border-border bg-background/60 px-2 py-1 font-mono text-[11px] outline-none focus:border-primary/60"
              />
            </Field>
          </div>
        </div>
      </aside>
    );
  }

  const edge = edges.find((e) => e.id === selection.id);
  if (!edge) return null;
  const from = nodes.find((n) => n.id === edge.from);
  const to = nodes.find((n) => n.id === edge.to);

  return <EdgeInspector
    key={edge.id}
    edge={edge}
    fromLabel={from?.agent ?? "?"}
    toLabel={to?.agent ?? "?"}
    onUpdate={(patch) => updateEdge(edge.id, patch)}
    onDelete={() => removeEdge(edge.id)}
  />;
}

function EdgeInspector({
  edge,
  fromLabel,
  toLabel,
  onUpdate,
  onDelete,
}: {
  edge: ReturnType<typeof useFlowStore.getState>["edges"][number];
  fromLabel: string;
  toLabel: string;
  onUpdate: (patch: Partial<typeof edge>) => void;
  onDelete: () => void;
}) {
  const sdaSuggest = useMemo(() => {
    if (!edge.label || edge.label.length < 3) return null;
    try {
      return routeSda(edge.label);
    } catch {
      return null;
    }
  }, [edge.label]);

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-panel">
      <div className="flex items-center justify-between border-b border-border px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>edge · {edge.type.toLowerCase()}</span>
        <button
          onClick={onDelete}
          className="rounded p-1 text-fuko-guard hover:bg-fuko-guard/10"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <div className="space-y-3 p-3">
        <div className="rounded border border-border bg-background/40 px-2 py-1 font-mono text-[11px]">
          <span className="text-primary">{fromLabel}</span>
          <span className="mx-1 text-muted-foreground">→</span>
          <span className="text-primary">{toLabel}</span>
        </div>

        <Field label="type">
          <div className="grid grid-cols-5 gap-1">
            {EDGE_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => onUpdate({ type: t })}
                className={`rounded border px-1 py-1 font-mono text-[10px] ${
                  edge.type === t
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>

        <Field label="task / instruction">
          <textarea
            value={edge.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            rows={2}
            placeholder="what happens between these two agents"
            className="w-full rounded border border-border bg-background/60 px-2 py-1 font-mono text-[11px] outline-none focus:border-primary/60"
          />
        </Field>

        {sdaSuggest && (
          <div className="rounded border border-primary/30 bg-primary/5 px-2 py-1 font-mono text-[10px]">
            <span className="text-muted-foreground">SDA suggests</span>{" "}
            <span className="text-primary">{sdaSuggest.target_agent}</span>{" "}
            <span className="text-muted-foreground">
              ({sdaSuggest.routing_type} · {sdaSuggest.confidence.toFixed(2)})
            </span>
          </div>
        )}

        <Field label="skill">
          <select
            value={edge.skill ?? ""}
            onChange={(e) => onUpdate({ skill: e.target.value || undefined })}
            className="w-full rounded border border-border bg-background/60 px-2 py-1 font-mono text-[11px] outline-none focus:border-primary/60"
          >
            <option value="">— none —</option>
            {SKILLS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>

        {edge.type === "COND" && (
          <Field label="condition">
            <input
              value={edge.condition ?? ""}
              onChange={(e) => onUpdate({ condition: e.target.value })}
              placeholder="&-if_roi > 15%"
              className="w-full rounded border border-border bg-background/60 px-2 py-1 font-mono text-[11px] outline-none focus:border-primary/60"
            />
          </Field>
        )}

        {edge.type === "LOOP" && (
          <Field label="max iterations">
            <input
              type="number"
              min={1}
              max={20}
              value={edge.maxIterations ?? 3}
              onChange={(e) => onUpdate({ maxIterations: Number(e.target.value) })}
              className="w-full rounded border border-border bg-background/60 px-2 py-1 font-mono text-[11px] outline-none focus:border-primary/60"
            />
          </Field>
        )}

        <Field label="priority">
          <input
            type="range"
            min={1}
            max={10}
            value={edge.priority ?? 5}
            onChange={(e) => onUpdate({ priority: Number(e.target.value) })}
            className="w-full"
          />
          <div className="mt-1 text-right font-mono text-[10px] text-muted-foreground">
            p{edge.priority ?? 5}
          </div>
        </Field>
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      {children}
    </label>
  );
}
