import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/kk1/Layout";
import { Architecture } from "@/components/kk1/Architecture";

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title: "System Architecture & Pillars · KK1 Core" },
      {
        name: "description",
        content:
          "Visualize the 5 economic-operational engines of KK1 Core: Trust Score, AI License, Economic Ledger, Action Execution Mesh, and Human Expert Network.",
      },
      { property: "og:title", content: "System Architecture & Pillars · KK1 Core" },
      {
        property: "og:description",
        content:
          "Command-center telemetry across the five KK1 pillars: trust, licensing, economic ROI, execution mesh, and human expert routing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ArchitecturePage,
});

function ArchitecturePage() {
  return (
    <Shell>
      <Architecture />
    </Shell>
  );
}
