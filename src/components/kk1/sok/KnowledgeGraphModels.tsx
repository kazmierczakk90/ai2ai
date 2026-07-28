import { useState } from "react";
import { Brain, GitMerge, LineChart, Lightbulb, ShieldAlert, Share2 } from "lucide-react";
import { SokInfoDialog, type SokDialogPayload } from "./SokInfoDialog";

const MODELS = [
  {
    key: "psych",
    title: "Model Psychologiczny",
    sub: "Operating Identity Map",
    Icon: Brain,
    color: "text-pink-400",
    dialog: {
      title: "Model Psychologiczny",
      body: (
        <>
          <h4 className="font-bold text-foreground">Operating Identity Map</h4>
          <p>W oparciu o KK1_META_CONTEXT system modeluje psychikę operatora:</p>
          <ul className="mt-3 space-y-1 font-mono text-xs">
            <li className="flex justify-between border-b border-border pb-1"><span>Analytical Score</span><span className="text-pink-400">75%</span></li>
            <li className="flex justify-between border-b border-border pb-1"><span>Risk Tolerance</span><span className="text-pink-400">65%</span></li>
            <li className="flex justify-between border-b border-border pb-1"><span>Chaos Tolerance</span><span className="text-pink-400">80%</span></li>
            <li className="flex justify-between"><span>Decision Speed</span><span className="text-pink-400">FAST</span></li>
          </ul>
        </>
      ),
    },
  },
  {
    key: "dec",
    title: "Model Decyzyjny",
    sub: "Strategic Execution Engine",
    Icon: GitMerge,
    color: "text-fuko-proc",
    dialog: {
      title: "Model Decyzyjny",
      body: (
        <p>
          Graf rozwiązywania problemów. Asynchroniczny potok{" "}
          <strong className="text-foreground">FUKO-FLOW v2.0</strong> z 6D Reasoning
          (Confidence, Stress, Focus, Risk, Chaos, Time).
        </p>
      ),
    },
  },
  {
    key: "biz",
    title: "Model Biznesowy",
    sub: "System Graph + Opportunity Matrix",
    Icon: LineChart,
    color: "text-fuko-agent",
    dialog: {
      title: "Model Biznesowy",
      body: (
        <p>
          Wiedza o 13+ projektach. Filar B (Commerce) jako "revenue bridge" dla
          Filaru A (AI-assisted coding). Węzły podejmują decyzje zgodne z
          nadrzędną strategią.
        </p>
      ),
    },
  },
  {
    key: "crea",
    title: "Model Twórczy",
    sub: "Ecosystem Synthesis",
    Icon: Lightbulb,
    color: "text-yellow-400",
    dialog: {
      title: "Model Twórczy",
      body: (
        <p>
          "Synthetic Ideation" — generowanie niemożliwych dla człowieka
          kombinacji z wiedzy zdezintegrowanej między domenami.
        </p>
      ),
    },
  },
  {
    key: "risk",
    title: "Model Ryzyka",
    sub: "Future Model",
    Icon: ShieldAlert,
    color: "text-fuko-guard",
    dialog: {
      title: "Model Ryzyka",
      body: (
        <p>
          Część W6 (Meta-Evolution). Analiza "Blast Radius" przed wykonaniem
          kodu / usunięciem funkcji (YAGNI egzekwowane przez @void_pruner).
        </p>
      ),
    },
  },
] as const;

export function KnowledgeGraphModels() {
  const [dialog, setDialog] = useState<SokDialogPayload>(null);
  return (
    <div className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <Share2 className="h-3.5 w-3.5" /> Modele Wiedzy (Knowledge Graph)
      </h2>
      {MODELS.map((m) => (
        <button
          key={m.key}
          onClick={() => setDialog(m.dialog)}
          className="text-left rounded-lg border border-border bg-panel p-3 transition hover:border-primary/40"
        >
          <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
            <m.Icon className={`h-4 w-4 ${m.color}`} /> {m.title}
          </h4>
          <p className="font-mono text-[10px] uppercase text-muted-foreground">{m.sub}</p>
        </button>
      ))}

      <div className="mt-2 rounded-xl border border-border bg-panel-2/60 p-4 font-mono text-[10px]">
        <div className="mb-2 flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground">DRIFT_TOLERANCE:</span>
          <span className="text-fuko-func">0.78 (Threshold)</span>
        </div>
        <div className="mb-2 flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground">STATE_PERSISTENCE:</span>
          <span className="text-fuko-agent">W5_FUKO_RAM (SQLite)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">EMOTION_TRACES:</span>
          <span className="text-fuko-skill">6D ACTIVE</span>
        </div>
      </div>

      <SokInfoDialog payload={dialog} onClose={() => setDialog(null)} />
    </div>
  );
}
