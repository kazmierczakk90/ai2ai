import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Shell } from "@/components/kk1/Layout";
import { AgentPalette } from "@/components/kk1/flow/AgentPalette";
import { FlowCanvas } from "@/components/kk1/flow/FlowCanvas";
import { FlowToolbar } from "@/components/kk1/flow/FlowToolbar";
import { Inspector } from "@/components/kk1/flow/Inspector";
import { decodeShareHash } from "@/lib/flow/export";
import { useFlowStore } from "@/store/flow-store";

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
  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash.includes("flow=")) return;
    let cancelled = false;
    decodeShareHash(hash).then((payload) => {
      if (cancelled || !payload) return;
      if (
        !confirm(
          `Load shared graph "${payload.name}" (${payload.nodes.length} nodes, ${payload.edges.length} edges)? This replaces the current canvas.`,
        )
      ) {
        return;
      }
      useFlowStore.getState().importGraph(payload);
      toast.success("Shared graph loaded", { description: `$-${payload.name}` });
      history.replaceState(null, "", window.location.pathname);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
