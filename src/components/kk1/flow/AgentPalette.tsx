import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useKK1Store, LAYER_LABELS, pickLocalized, type AgentLayer } from "@/store/kk1-store";
import { useI18n } from "@/i18n/i18n";
import { useFlowStore } from "@/store/flow-store";

const SPECIALS: { kind: "start" | "gate" | "end"; label: string; color: string }[] = [
  { kind: "start", label: "START", color: "text-fuko-func" },
  { kind: "gate", label: "GATE", color: "text-fuko-cond" },
  { kind: "end", label: "END", color: "text-fuko-guard" },
];

export function AgentPalette() {
  const agents = useKK1Store((s) => s.agents);
  const { lang } = useI18n();
  const [q, setQ] = useState("");
  const addNode = useFlowStore((s) => s.addNode);

  const grouped = useMemo(() => {
    const map = new Map<AgentLayer, typeof agents>();
    for (const a of agents) {
      if (q && !a.name.toLowerCase().includes(q.toLowerCase())) continue;
      const arr = map.get(a.layer) ?? [];
      arr.push(a);
      map.set(a.layer, arr);
    }
    return map;
  }, [agents, q]);

  function drop(agent: string, kind: "agent" | "start" | "gate" | "end" = "agent") {
    // drop at a slightly randomized center; canvas already has scroll
    const x = 300 + Math.round(Math.random() * 200);
    const y = 200 + Math.round(Math.random() * 200);
    addNode({ agent, kind, x, y });
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-panel">
      <div className="border-b border-border px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        palette
      </div>
      <div className="relative border-b border-border px-2 py-2">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="filter @agents"
          className="w-full rounded border border-border bg-background/60 px-6 py-1 font-mono text-[11px] outline-none focus:border-primary/60"
        />
      </div>

      <div className="border-b border-border p-2">
        <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          special
        </div>
        <div className="grid grid-cols-3 gap-1">
          {SPECIALS.map((s) => (
            <button
              key={s.kind}
              onClick={() => drop(s.label, s.kind)}
              className={`rounded border border-border bg-background/60 px-1 py-1 font-mono text-[10px] hover:border-primary/60 ${s.color}`}
              title={`add ${s.label}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {(Object.keys(LAYER_LABELS) as AgentLayer[]).map((layer) => {
          const list = grouped.get(layer);
          if (!list || !list.length) return null;
          return (
            <div key={layer} className="mb-3">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {pickLocalized(LAYER_LABELS[layer], lang)}
              </div>
              <div className="space-y-0.5">
                {list.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => drop(a.name)}
                    className="flex w-full items-center justify-between rounded border border-transparent px-2 py-1 text-left font-mono text-[11px] text-foreground hover:border-primary/40 hover:bg-panel-2"
                  >
                    <span className="text-primary">{a.name}</span>
                    <span className="text-[9px] uppercase text-muted-foreground">L{a.license}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
