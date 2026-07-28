import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/kk1/Layout";
import { ChatImport } from "@/components/kk1/ChatImport";

export const Route = createFileRoute("/import")({
  head: () => ({
    meta: [
      { title: "Chat Import — KK1 Core" },
      {
        name: "description",
        content:
          "Live Telegram ingestion with FUKO-LANG word-level auto-tagging: verify signals, assign symbols, and inspect operator conversations in real time.",
      },
      { property: "og:title", content: "Chat Import — KK1 Core" },
      {
        property: "og:description",
        content:
          "Telegram → FUKO tagger. Every incoming word is scored and mapped to an agent, tool, workflow, guardrail, skill, or condition symbol.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ai2ai.lovable.app/import" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ai2ai.lovable.app/import" }],
  }),
  component: ImportPage,
});

function ImportPage() {
  return (
    <Shell>
      <h1 className="sr-only">Chat Import — Telegram ingestion with FUKO-LANG tagging</h1>
      <ChatImport />
    </Shell>
  );
}
