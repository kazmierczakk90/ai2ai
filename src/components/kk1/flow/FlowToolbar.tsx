import { useState } from "react";
import { Download, Eraser, Image as ImageIcon, LayoutGrid, Link2, Save, Send, Share2, Sparkles, Undo2, Redo2 } from "lucide-react";
import { toast } from "sonner";
import { useFlowStore } from "@/store/flow-store";
import { serializeFlow } from "@/lib/flow/serialize";
import { computeLayout } from "@/lib/flow/layout";
import {
  buildShareUrl,
  downloadJson,
  downloadMermaid,
  downloadPng,
  downloadSvg,
} from "@/lib/flow/export";
import { sendMessageToCore } from "@/lib/api";
import { useKK1Store } from "@/store/kk1-store";
import { useI18n } from "@/i18n/i18n";
import { emit } from "@/lib/event-bus";
import { FlowImportDialog } from "./FlowImportDialog";

export function FlowToolbar() {
  const { lang } = useI18n();
  const name = useFlowStore((s) => s.name);
  const trigger = useFlowStore((s) => s.trigger);
  const setName = useFlowStore((s) => s.setName);
  const setTrigger = useFlowStore((s) => s.setTrigger);
  const save = useFlowStore((s) => s.save);
  const clear = useFlowStore((s) => s.clear);
  const undoAction = useFlowStore((s) => s.undoAction);
  const redoAction = useFlowStore((s) => s.redoAction);
  const applyLayout = useFlowStore((s) => s.applyLayout);
  const [sending, setSending] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  function autoLayout() {
    const s = useFlowStore.getState();
    if (!s.nodes.length) return;
    applyLayout(computeLayout(s.nodes, s.edges));
    toast.success("Auto-layout zastosowany");
  }


  function exportJson() {
    const s = useFlowStore.getState();
    downloadJson({ name: s.name, trigger: s.trigger, nodes: s.nodes, edges: s.edges });
  }

  async function exportSvg() {
    try {
      downloadSvg(useFlowStore.getState().name);
      toast.success("SVG exported");
    } catch (e) {
      toast.error("SVG export failed", { description: e instanceof Error ? e.message : "unknown" });
    }
  }

  async function exportPng() {
    try {
      await downloadPng(useFlowStore.getState().name);
      toast.success("PNG exported");
    } catch (e) {
      toast.error("PNG export failed", { description: e instanceof Error ? e.message : "unknown" });
    }
  }

  function exportMermaid() {
    const s = useFlowStore.getState();
    downloadMermaid({ name: s.name, trigger: s.trigger, nodes: s.nodes, edges: s.edges });
    toast.success("Mermaid diagram exported", { description: "paste into mermaid.live to preview" });
  }

  async function shareLink() {
    const s = useFlowStore.getState();
    try {
      const url = await buildShareUrl({ name: s.name, trigger: s.trigger, nodes: s.nodes, edges: s.edges });
      await navigator.clipboard.writeText(url);
      emit("flow.graph.saved", "flow.toolbar", { shared: true, size: url.length });
      toast.success("Share link copied", {
        description: url.length > 80 ? url.slice(0, 77) + "…" : url,
      });
    } catch (e) {
      toast.error("Share link failed", { description: e instanceof Error ? e.message : "unknown" });
    }
  }

  async function sendToTerminal() {
    const s = useFlowStore.getState();
    const block = serializeFlow(s.name, s.trigger, s.nodes, s.edges);
    setSending(true);
    try {
      const res = await sendMessageToCore({
        text: `${block}\n\n!-please review this process and confirm before running`,
        lang,
        channel: useKK1Store.getState().activeChannel,
      });
      useKK1Store.getState().appendMessage(res.user_message);
      useKK1Store.getState().appendMessage(res.system_message);
      emit("flow.dispatched", "flow.toolbar", { name: s.name, nodes: s.nodes.length, edges: s.edges.length });
      toast.success("Sent to Command · terminal", { description: `$-${s.name} dispatched to Gemini` });
    } catch (err) {
      toast.error("Dispatch failed", {
        description: err instanceof Error ? err.message : "unknown",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-panel px-3 py-2">
      <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        $-
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-40 rounded border border-border bg-background/60 px-2 py-1 font-mono text-[11px] text-primary outline-none focus:border-primary/60"
      />
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        trigger
      </span>
      <input
        value={trigger}
        onChange={(e) => setTrigger(e.target.value)}
        className="w-56 rounded border border-border bg-background/60 px-2 py-1 font-mono text-[11px] outline-none focus:border-primary/60"
      />

      <div className="mx-2 h-5 w-px bg-border" />

      <ToolButton onClick={undoAction} icon={<Undo2 className="h-3 w-3" />} label="undo" />
      <ToolButton onClick={redoAction} icon={<Redo2 className="h-3 w-3" />} label="redo" />
      <ToolButton onClick={save} icon={<Save className="h-3 w-3" />} label="save" />
      <ToolButton onClick={exportJson} icon={<Download className="h-3 w-3" />} label="json" />
      <ToolButton onClick={exportSvg} icon={<ImageIcon className="h-3 w-3" />} label="svg" />
      <ToolButton onClick={exportPng} icon={<ImageIcon className="h-3 w-3" />} label="png" />
      <ToolButton onClick={exportMermaid} icon={<Share2 className="h-3 w-3" />} label="mermaid" />
      <ToolButton onClick={shareLink} icon={<Link2 className="h-3 w-3" />} label="share link" />
      <ToolButton
        onClick={() => {
          if (confirm("Clear the entire graph?")) clear();
        }}
        icon={<Eraser className="h-3 w-3" />}
        label="clear"
        danger
      />

      <button
        onClick={sendToTerminal}
        disabled={sending}
        className="ml-auto flex items-center gap-1.5 rounded border border-primary/60 bg-primary/10 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-primary hover:bg-primary/20 disabled:opacity-50"
      >
        <Send className="h-3 w-3" />
        {sending ? "dispatching…" : "send to command"}
      </button>
    </div>
  );
}

function ToolButton({
  onClick,
  icon,
  label,
  danger,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 rounded border border-border bg-background/60 px-2 py-1 font-mono text-[10px] uppercase tracking-widest hover:border-primary/40 hover:text-foreground ${
        danger ? "text-fuko-guard hover:border-fuko-guard/60" : "text-muted-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
