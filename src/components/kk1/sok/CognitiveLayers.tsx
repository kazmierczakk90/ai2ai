import { Stairs } from "@/components/kk1/sok/icons";

const ROWS = [
  { id: "W0", title: "Ingestion Layer", desc: "Zbieranie i parsowanie surowych danych (Webhooks, CLI, Audio).", accent: "" },
  { id: "W1", title: "Identity Core", desc: "Filtr Strategicznego DNA. Decyduje co zasługuje na uwagę.", accent: "border-fuko-agent/40 bg-fuko-agent-bg" },
  { id: "W2", title: "SDA Routing", desc: "Macierz decyzyjna. Kieruje input do 47 wyspecjalizowanych agentów.", accent: "border-fuko-skill/40 bg-fuko-skill-bg" },
  { id: "W3/4", title: "Execution & Tool Mesh", desc: "Asynchroniczny FUKO-FLOW. Wykonywanie kodu i akcji.", accent: "" },
  { id: "W5", title: "FUKO_RAM (Memory)", desc: "6D Emotional Traces i Belief Memory. Ciągłość między sesjami.", accent: "border-fuko-func/50 bg-fuko-func-bg sok-pulse" },
  { id: "W6", title: "Meta-Evolution", desc: "Pętla samo-optymalizacji. Ocena własnych logów i wyników.", accent: "" },
];

export function CognitiveLayers() {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <Stairs className="h-3.5 w-3.5" /> Warstwy Kognitywne
      </h2>
      {ROWS.map((r) => (
        <div
          key={r.id}
          className={`flex items-center gap-3 rounded-xl border border-border bg-panel p-3 ${r.accent}`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-panel-2 font-mono text-xs font-bold text-foreground">
            {r.id}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">{r.title}</h3>
            <p className="truncate text-xs text-muted-foreground">{r.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
