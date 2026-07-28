import { useState } from "react";
import { Shield, GitBranch, Wrench, MessageSquare, Layers } from "lucide-react";
import { SokInfoDialog, type SokDialogPayload } from "./SokInfoDialog";

const CARDS = [
  {
    key: "p0",
    label: "P0: RDZEŃ",
    accent: "border-l-fuko-guard text-fuko-guard",
    Icon: Shield,
    desc: "Czasownik + Rzeczownik. ZAWSZE aktywne, nigdy ignorowane.",
    tags: ["#FUKO_AUDITOR", "Guardian"],
    dialog: {
      title: "P0 · RDZEŃ (Core)",
      body: (
        <>
          <p className="border-l-2 border-fuko-guard pl-3 italic">
            "Czasownik + Rzeczownik. ZAWSZE aktywne, nigdy ignorowane."
          </p>
          <p>Warstwa krytyczna FUKO. Nienegocjowalne procesy:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong className="text-foreground">FUKO_AUDITOR</strong> — ciągła spójność, dryf &gt; 0.78.</li>
            <li><strong className="text-foreground">Guardian Core</strong> — Emergency Stop, failsafe.</li>
            <li><strong className="text-foreground">Intent Extraction</strong> — faktyczna intencja za promptem.</li>
          </ul>
        </>
      ),
    },
  },
  {
    key: "p1",
    label: "P1: WARUNEK",
    accent: "border-l-fuko-proc text-fuko-proc",
    Icon: GitBranch,
    desc: "Logic String (IF/THEN), wyzwalacze. Zawieszane tylko w FUKO-EMERGENCY.",
    tags: ["IF/THEN"],
    dialog: {
      title: "P1 · WARUNEK (Condition)",
      body: (
        <>
          <p className="border-l-2 border-fuko-proc pl-3 italic">
            "Logic String (IF/THEN). Zawieszane tylko w trybie awaryjnym."
          </p>
          <p>Sieć logiczna decydująca o routing'u:</p>
          <pre className="rounded bg-panel-2 p-3 font-mono text-xs text-fuko-proc">
{`IF intent == 'refactoring' AND risk > 0.5
THEN route_to('@void_pruner')
ELSE route_to('@gas')`}
          </pre>
        </>
      ),
    },
  },
  {
    key: "p2",
    label: "P2: NARZĘDZIE",
    accent: "border-l-fuko-agent text-fuko-agent",
    Icon: Wrench,
    desc: "Wymagane API, integracje, skrypty. Aktywne jeśli P1 spełnione.",
    tags: ["Tool Use"],
    dialog: {
      title: "P2 · NARZĘDZIE (Tool)",
      body: (
        <>
          <p className="border-l-2 border-fuko-agent pl-3 italic">
            "Wykonawcy. Aktywowani tylko przez P1."
          </p>
          <p>
            Zbiór 138 skilli i narzędzi uderzających do zewnętrznych API,
            przeszukujących dysk, generujących kod i zapisujących stany w Event
            Store.
          </p>
        </>
      ),
    },
  },
  {
    key: "p3",
    label: "P3: KONTEKST",
    accent: "border-l-muted text-muted-foreground",
    Icon: MessageSquare,
    desc: "Instrukcje miękkie, styl, ton. Warstwa wyjściowa (Dialogue).",
    tags: ["Dual-Output"],
    dialog: {
      title: "P3 · KONTEKST (Context)",
      body: (
        <>
          <p className="border-l-2 border-muted pl-3 italic">
            "Kosmetyka i ton. Najniższy priorytet."
          </p>
          <p>
            Kształtowanie outputu (Dual-Output Terminal: <em>dialogue</em> vs{" "}
            <em>strategic_analysis</em>). Persona i "brzmienie" agenta.
          </p>
        </>
      ),
    },
  },
] as const;

export function PriorityHierarchy() {
  const [dialog, setDialog] = useState<SokDialogPayload>(null);
  return (
    <div className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <Layers className="h-3.5 w-3.5" /> Hierarchia Priorytetów
      </h2>
      {CARDS.map((c) => (
        <button
          key={c.key}
          onClick={() => setDialog(c.dialog)}
          className={`text-left rounded-xl border border-border bg-panel p-4 border-l-4 transition hover:border-primary/40 ${c.accent}`}
        >
          <div className="mb-2 flex items-start justify-between">
            <span className="font-mono text-base font-bold">{c.label}</span>
            <c.Icon className="h-4 w-4 opacity-60" />
          </div>
          <p className="mb-3 text-xs text-muted-foreground">{c.desc}</p>
          <div className="flex flex-wrap gap-1.5">
            {c.tags.map((t) => (
              <span
                key={t}
                className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-[10px] text-foreground/80"
              >
                {t}
              </span>
            ))}
          </div>
        </button>
      ))}
      <SokInfoDialog payload={dialog} onClose={() => setDialog(null)} />
    </div>
  );
}
