import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/kk1/Layout";
import { Terminal } from "@/components/kk1/Terminal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KK1 Core — AGI Strategic Engine" },
      {
        name: "description",
        content:
          "KK1 Core command center: FUKO-LANG parsing, dual-output terminal, 6D scoring, SDA routing, and multi-agent orchestration for AGI strategy.",
      },
      { property: "og:title", content: "KK1 Core — AGI Strategic Engine" },
      {
        property: "og:description",
        content:
          "Command-center for AGI strategy: FUKO-LANG parsing, dual-output terminal, 6D scoring, SDA routing.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ai2ai.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ai2ai.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "KK1 Core",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description:
            "AGI strategic engine with FUKO-LANG parsing, multi-agent flow design, and deep reasoning telemetry.",
          url: "https://ai2ai.lovable.app/",
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <Shell>
      <h1 className="sr-only">KK1 Core — AGI Strategic Command Center</h1>
      <Terminal />
    </Shell>
  );
}
