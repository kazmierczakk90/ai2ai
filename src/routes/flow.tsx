import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/kk1/Layout";
import { AgentPalette } from "@/components/kk1/flow/AgentPalette";
import { FlowCanvas } from "@/components/kk1/flow/FlowCanvas";
import { FlowToolbar } from "@/components/kk1/flow/FlowToolbar";
import { Inspector } from "@/components/kk1/flow/Inspector";

export const Route = createFileRoute("/flow")({
  head: () => ({
    meta: [
      { title: "Flow Canvas — KK1 Core" },
      { name: "description", content: "Graphical agent-route designer with per-arrow tasks and SDA hints." },
      { property: "og:title", content: "Flow Canvas — KK1 Core" },
      { property: "og:description", content: "Design multi-agent processes visually and dispatch them to the Gemini Process-Designer." },
    ],
  }),
  component: FlowPage,
});

function FlowPage() {
  return (
    <Shell>
      <div className="flex h-full min-h-0 flex-col">
        <FlowToolbar />
        <div className="flex min-h-0 flex-1">
          <AgentPalette />
          <FlowCanvas />
          <Inspector />
        </div>
      </div>
    </Shell>
  );
}
