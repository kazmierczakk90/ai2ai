import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/kk1/Layout";
import { Terminal } from "@/components/kk1/Terminal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KK1 Core · AGI Strategic Engine" },
      {
        name: "description",
        content:
          "KK1 Core — a command-center SaaS for orchestrating AGI strategy with FUKO-LANG symbols, dual-output terminal, and deep reasoning telemetry.",
      },
      { property: "og:title", content: "KK1 Core · AGI Strategic Engine" },
      {
        property: "og:description",
        content:
          "Command-center for AGI strategy: FUKO-LANG parsing, dual-output terminal, 6D scoring, SDA routing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <Shell>
      <Terminal />
    </Shell>
  );
}
