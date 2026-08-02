import { useRef, useState } from "react";
import { FileUp, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { proposeFlowFromDocument, type ProposedFlow } from "@/lib/flow.functions";
import { computeLayout } from "@/lib/flow/layout";
import { useFlowStore, type FlowEdge, type FlowNode } from "@/store/flow-store";
import { useI18n } from "@/i18n/i18n";
import { emit } from "@/lib/event-bus";

const ACCEPT = ".txt,.md,.markdown,.json,.csv,.log,.yaml,.yml,.tsv,.xml";
const MAX_CHARS = 200_000;

function buildGraph(proposal: ProposedFlow): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const idByKey = new Map<string, string>();
  const stamp = Date.now().toString(36);
  proposal.nodes.forEach((n, i) => idByKey.set(n.key, `n-${stamp}-${i}`));

  const nodes: FlowNode[] = proposal.nodes.map((n) => ({
    id: idByKey.get(n.key)!,
    kind: n.kind,
    agent: n.agent,
    x: 0,
    y: 0,
    note: n.note ?? undefined,
  }));

  const edges: FlowEdge[] = proposal.edges
    .filter((e) => idByKey.has(e.from) && idByKey.has(e.to))
    .map((e, i) => ({
      id: `e-${stamp}-${i}`,
      from: idByKey.get(e.from)!,
      to: idByKey.get(e.to)!,
      type: e.type,
      label: e.label,
      skill: e.skill ?? undefined,
      condition: e.condition ?? undefined,
      priority: e.priority ?? undefined,
    }));

  const positions = computeLayout(nodes, edges);
  for (const n of nodes) {
    const p = positions[n.id];
    if (p) {
      n.x = p.x;
      n.y = p.y;
    }
  }
  return { nodes, edges };
}

export function FlowImportDialog({ onClose }: { onClose: () => void }) {
  const { lang } = useI18n();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<{ name: string; text: string } | null>(null);
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState<ProposedFlow | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function readFile(f: File) {
    const text = await f.text();
    if (!text.trim()) {
      toast.error("Plik jest pusty");
      return;
    }
    setProposal(null);
    setFile({ name: f.name, text: text.slice(0, MAX_CHARS) });
    if (text.length > MAX_CHARS) {
      toast.warning("Plik przycięty", { description: `Analizuję pierwsze ${MAX_CHARS / 1000}k znaków.` });
    }
  }

  async function analyze() {
    if (!file) return;
    setLoading(true);
    try {
      const result = await proposeFlowFromDocument({
        data: { filename: file.name, content: file.text, instructions, lang },
      });
      setProposal(result);
      toast.success("AI zaproponowało flow", {
        description: `${result.nodes.length} węzłów · ${result.edges.length} strzałek`,
      });
    } catch (e) {
      toast.error("Analiza nieudana", { description: e instanceof Error ? e.message : "unknown" });
    } finally {
      setLoading(false);
    }
  }

  function apply(mode: "replace" | "merge") {
    if (!proposal) return;
    const { nodes, edges } = buildGraph(proposal);
    const store = useFlowStore.getState();
    if (mode === "replace") {
      store.importGraph({ name: proposal.name, trigger: proposal.trigger, nodes, edges });
    } else {
      const shifted = nodes.map((n) => ({ ...n, y: n.y + 480 }));
      store.importGraph({
        name: store.name,
        trigger: store.trigger,
        nodes: [...store.nodes, ...shifted],
        edges: [...store.edges, ...edges],
      });
    }
    emit("flow.graph.ai_imported", "flow.import", {
      file: file?.name,
      nodes: nodes.length,
      edges: edges.length,
      mode,
    });
    toast.success(mode === "replace" ? "Graf zastąpiony" : "Graf dołączony");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded border border-border bg-panel"
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-primary">
            AI · flow z pliku
          </span>
          <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void readFile(f);
            }}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed px-4 py-6 text-center ${
              dragOver ? "border-primary bg-primary/10" : "border-border bg-background/40"
            }`}
          >
            <FileUp className="h-5 w-5 text-muted-foreground" />
            <span className="font-mono text-[11px] text-foreground">
              {file ? file.name : "Upuść plik lub kliknij, aby wybrać"}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {file ? `${file.text.length.toLocaleString()} znaków` : ACCEPT}
            </span>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void readFile(f);
            }}
          />

          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={2}
            placeholder="Dodatkowe wytyczne (np. skup się na warstwie Execution, dodaj bramkę zatwierdzenia @ceo)"
            className="w-full rounded border border-border bg-background/60 px-2 py-1.5 font-mono text-[11px] outline-none focus:border-primary/60"
          />

          <button
            onClick={analyze}
            disabled={!file || loading}
            className="flex w-full items-center justify-center gap-2 rounded border border-primary/60 bg-primary/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-primary hover:bg-primary/20 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {loading ? "analiza dokumentu…" : "zaproponuj flow"}
          </button>

          {proposal && (
            <div className="space-y-2 rounded border border-border bg-background/40 p-3">
              <div className="font-mono text-[11px] text-fuko-cond">$-{proposal.name}</div>
              <div className="font-mono text-[10px] text-muted-foreground">
                trigger: {proposal.trigger}
              </div>
              <p className="text-xs leading-relaxed text-foreground">{proposal.summary}</p>
              <div className="max-h-48 space-y-0.5 overflow-auto rounded border border-border/60 bg-panel/60 p-2 font-mono text-[10px]">
                {proposal.edges.map((e, i) => (
                  <div key={i} className="flex gap-1.5">
                    <span className="text-primary">{e.from}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-primary">{e.to}</span>
                    <span className="text-fuko-skill">[{e.type}]</span>
                    <span className="truncate text-foreground">{e.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {proposal && (
          <div className="flex gap-2 border-t border-border px-4 py-2">
            <button
              onClick={() => apply("merge")}
              className="flex-1 rounded border border-border bg-background/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:border-primary/40 hover:text-foreground"
            >
              dołącz do grafu
            </button>
            <button
              onClick={() => apply("replace")}
              className="flex-1 rounded border border-primary/60 bg-primary/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-primary hover:bg-primary/20"
            >
              zastąp graf
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
