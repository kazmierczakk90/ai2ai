import { createFileRoute } from "@tanstack/react-router";
import { Cpu } from "lucide-react";
import { Shell } from "@/components/kk1/Layout";
import { SokTerminal } from "@/components/kk1/sok/SokTerminal";
import { PriorityHierarchy } from "@/components/kk1/sok/PriorityHierarchy";
import { CognitiveLayers } from "@/components/kk1/sok/CognitiveLayers";
import { KnowledgeGraphModels } from "@/components/kk1/sok/KnowledgeGraphModels";

export const Route = createFileRoute("/sok")({
  head: () => ({
    meta: [
      { title: "SOK Canvas — Środowisko Operacyjne KK1" },
      { name: "description", content: "Środowisko Operacyjne KK1: terminal FUKO-FLOW z analizą intencji przez Gemini, hierarchia priorytetów P0–P3, warstwy kognitywne W0–W6 i modele wiedzy." },
      { property: "og:title", content: "SOK Canvas — Środowisko Operacyjne KK1" },
      { property: "og:description", content: "Meta-cognition command center for KK1: intent analysis, priority hierarchy, cognitive layers, knowledge graph." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ai2ai.lovable.app/sok" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ai2ai.lovable.app/sok" }],
  }),
  component: SokPage,
});

function SokPage() {
  return (
    <Shell>
      <h1 className="sr-only">SOK Canvas — Środowisko Operacyjne KK1</h1>
      <div className="h-full overflow-y-auto p-4 md:p-6">
        <header className="mb-6 flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-center">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-foreground">
              <Cpu className="h-6 w-6 text-primary" />
              SOK <span className="font-light text-primary">CANVAS</span>
            </h2>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              Środowisko Operacyjne KK1 · Integracja LLM Aktywna · Powered by Gemini
            </p>
          </div>
          <div className="flex gap-2">
            <span className="flex items-center gap-2 rounded border border-fuko-func/40 bg-fuko-func-bg px-3 py-1 font-mono text-xs text-fuko-func">
              ● ACTIVE
            </span>
            <span className="flex items-center gap-2 rounded border border-fuko-skill/40 bg-fuko-skill-bg px-3 py-1 font-mono text-xs text-fuko-skill">
              META-COGNITION
            </span>
          </div>
        </header>

        <div className="mb-8">
          <SokTerminal />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <PriorityHierarchy />
          <CognitiveLayers />
          <KnowledgeGraphModels />
        </div>
      </div>
    </Shell>
  );
}
