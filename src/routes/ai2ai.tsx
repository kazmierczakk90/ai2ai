import { createFileRoute } from "@tanstack/react-router";
import { Radio } from "lucide-react";
import { Shell } from "@/components/kk1/Layout";
import { Ai2AiTerminal } from "@/components/kk1/ai2ai/Ai2AiTerminal";

export const Route = createFileRoute("/ai2ai")({
  head: () => ({
    meta: [
      { title: "ai2ai Bridge — Gemini × Claude — KK1 Core" },
      {
        name: "description",
        content: "Live two-AI exchange: KK1 Core's Gemini persona and Claude debate an operator-set topic turn by turn.",
      },
      { property: "og:title", content: "ai2ai Bridge — Gemini × Claude — KK1 Core" },
      {
        property: "og:description",
        content: "Watch Gemini (Karol-Core) and Claude exchange turns live on a topic you set.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ai2ai.lovable.app/ai2ai" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ai2ai.lovable.app/ai2ai" }],
  }),
  component: Ai2AiPage,
});

function Ai2AiPage() {
  return (
    <Shell>
      <h1 className="sr-only">ai2ai Bridge — Gemini × Claude</h1>
      <div className="h-full overflow-y-auto p-4 md:p-6">
        <header className="mb-6 flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-center">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-foreground">
              <Radio className="h-6 w-6 text-primary" />
              AI<span className="font-light text-primary">2</span>AI <span className="font-light text-primary">BRIDGE</span>
            </h2>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              Gemini (Karol-Core) ↔ Claude · Live Turn Exchange
            </p>
          </div>
          <div className="flex gap-2">
            <span className="flex items-center gap-2 rounded border border-fuko-func/40 bg-fuko-func-bg px-3 py-1 font-mono text-xs text-fuko-func">
              ● GEMINI
            </span>
            <span className="flex items-center gap-2 rounded border border-fuko-skill/40 bg-fuko-skill-bg px-3 py-1 font-mono text-xs text-fuko-skill">
              ● CLAUDE
            </span>
          </div>
        </header>

        <Ai2AiTerminal />
      </div>
    </Shell>
  );
}
