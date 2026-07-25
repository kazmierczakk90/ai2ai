import { toast } from "sonner";
import type { Lang } from "@/i18n/i18n";

/**
 * FUKO-PZK 7-element structured message.
 * Rendered as a sonner toast with a dense grid of the seven fields.
 */
export type PZK = {
  intent: string;
  process: string;
  task: string;
  verification: string;
  reaction: string;
  agent: string; // e.g. "@dispatcher"
  ts?: string;
  severity?: "info" | "success" | "warn" | "error";
};

const HEADS: Record<Lang, Record<keyof Omit<PZK, "severity" | "ts">, string>> = {
  en: { intent: "intent", process: "process", task: "task", verification: "verify", reaction: "react", agent: "agent" },
  pl: { intent: "intencja", process: "proces", task: "zadanie", verification: "weryfikacja", reaction: "reakcja", agent: "agent" },
  fr: { intent: "intention", process: "processus", task: "tâche", verification: "vérif.", reaction: "réaction", agent: "agent" },
  es: { intent: "intención", process: "proceso", task: "tarea", verification: "verif.", reaction: "reacción", agent: "agente" },
};

const SEV_COLOR: Record<NonNullable<PZK["severity"]>, string> = {
  info: "var(--color-primary)",
  success: "var(--fuko-func)",
  warn: "var(--fuko-cond)",
  error: "var(--fuko-guard)",
};

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[70px_1fr] items-baseline gap-2">
      <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {k}
      </span>
      <span className="font-mono text-[11px] text-foreground">{v}</span>
    </div>
  );
}

export function pzk(msg: PZK, lang: Lang = "en") {
  const h = HEADS[lang];
  const ts = msg.ts ?? new Date().toISOString().slice(11, 19);
  const sev = msg.severity ?? "info";

  toast.custom((id) => (
    <div
      className="w-[360px] overflow-hidden rounded border bg-panel shadow-2xl"
      style={{ borderColor: SEV_COLOR[sev] }}
    >
      <div
        className="flex items-center justify-between px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest"
        style={{
          backgroundColor: `color-mix(in oklab, ${SEV_COLOR[sev]} 20%, transparent)`,
          color: SEV_COLOR[sev],
        }}
      >
        <span className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: SEV_COLOR[sev],
              boxShadow: `0 0 6px ${SEV_COLOR[sev]}`,
            }}
          />
          FUKO-PZK
        </span>
        <span className="tabular-nums text-muted-foreground">{ts}</span>
      </div>
      <div className="space-y-1 p-3">
        <Row k={h.intent} v={msg.intent} />
        <Row k={h.process} v={msg.process} />
        <Row k={h.task} v={msg.task} />
        <Row k={h.verification} v={msg.verification} />
        <Row k={h.reaction} v={msg.reaction} />
        <Row k={h.agent} v={msg.agent} />
      </div>
      <button
        onClick={() => toast.dismiss(id)}
        className="w-full border-t border-border px-3 py-1 text-right font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        ack
      </button>
    </div>
  ));
}
