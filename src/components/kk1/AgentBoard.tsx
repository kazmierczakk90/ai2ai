import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  LAYER_LABELS,
  pickLocalized,
  useKK1Store,
  type Agent,
  type AgentLayer,
  type AgentStatus,
} from "@/store/kk1-store";
import { useI18n } from "@/i18n/i18n";

const STATUS_STYLE: Record<AgentStatus, { dot: string; ring: string; label: Record<string, string> }> = {
  idle: {
    dot: "bg-muted-foreground",
    ring: "",
    label: { en: "idle", pl: "bezczynny", fr: "inactif", es: "inactivo" },
  },
  processing: {
    dot: "bg-fuko-func shadow-[0_0_8px_var(--fuko-func)] animate-pulse",
    ring: "ring-fuko-func/40",
    label: { en: "processing", pl: "przetwarza", fr: "traitement", es: "procesando" },
  },
  routing: {
    dot: "bg-fuko-cond shadow-[0_0_8px_var(--fuko-cond)] animate-pulse",
    ring: "ring-fuko-cond/40",
    label: { en: "routing", pl: "rutuje", fr: "routage", es: "enrutando" },
  },
};

const LAYERS: AgentLayer[] = ["cognitive", "system", "execution", "emotional", "strategic"];

function License({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-[2px] ${
            i <= level ? "bg-primary shadow-[0_0_4px_var(--color-primary)]" : "bg-border"
          }`}
        />
      ))}
    </div>
  );
}

function AgentRow({ a, selected, onClick }: { a: Agent; selected: boolean; onClick: () => void }) {
  const { lang } = useI18n();
  const style = STATUS_STYLE[a.status];
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-2 rounded border px-2 py-1.5 font-mono text-[11px] transition-colors ${
        selected
          ? "border-primary/60 bg-primary/10 text-foreground"
          : "border-transparent text-muted-foreground hover:border-border hover:bg-panel-2 hover:text-foreground"
      }`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
      <span className="truncate">{a.name}</span>
      <span className="ml-auto rounded border border-border px-1 py-0.5 text-[9px] uppercase tracking-widest text-muted-foreground">
        L{a.license}
      </span>
    </button>
  );
}

function AgentDetail({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const { lang, t } = useI18n();
  const style = STATUS_STYLE[agent.status];
  const trustPct = Math.round(agent.trust * 100);

  return (
    <div className="rounded border border-primary/40 bg-panel-2 p-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            <span className="font-mono text-sm text-foreground">{agent.name}</span>
          </div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {pickLocalized(LAYER_LABELS[agent.layer], lang)} · {style.label[lang] ?? style.label.en}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2 font-mono text-[11px] text-muted-foreground">
        {pickLocalized(agent.role, lang)}
      </div>

      <div className="mt-3 space-y-2">
        <div>
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>{t("agent.license")}</span>
            <span className="text-foreground">L{agent.license} / L5</span>
          </div>
          <div className="mt-1">
            <License level={agent.license} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>{t("agent.trust")}</span>
            <span className="tabular-nums text-foreground">{(agent.trust).toFixed(2)}</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-panel">
            <div
              className="h-full rounded-sm"
              style={{
                width: `${trustPct}%`,
                background: "linear-gradient(90deg, color-mix(in oklab, var(--color-primary) 40%, transparent), var(--color-primary))",
                boxShadow: "0 0 8px color-mix(in oklab, var(--color-primary) 60%, transparent)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AgentBoard() {
  const { agents, selectedAgentId, selectAgent, pulseAgents } = useKK1Store();
  const { t, lang } = useI18n();
  const [collapsed, setCollapsed] = useState(false);

  // Simulate real-time telemetry.
  useEffect(() => {
    const id = setInterval(() => pulseAgents(), 2400);
    return () => clearInterval(id);
  }, [pulseAgents]);

  const selected = agents.find((a) => a.id === selectedAgentId) ?? null;

  if (collapsed) {
    return (
      <aside className="hidden shrink-0 flex-col border-l border-border bg-panel md:flex md:w-10 md:items-center md:gap-2 md:py-2">
        <button
          onClick={() => setCollapsed(false)}
          className="rounded p-1 text-muted-foreground hover:text-foreground"
          aria-label="Expand agents"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="mt-2 flex flex-col items-center gap-1.5">
          {LAYERS.map((layer) => {
            const count = agents.filter((a) => a.layer === layer && a.status !== "idle").length;
            return (
              <div key={layer} className="flex flex-col items-center">
                <span className="font-mono text-[9px] uppercase text-muted-foreground">
                  {layer[0]}
                </span>
                <span className="mt-0.5 rounded border border-border px-1 font-mono text-[9px] tabular-nums text-foreground">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </aside>
    );
  }

  const active = agents.filter((a) => a.status !== "idle").length;

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-l border-border bg-panel md:flex">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {t("agents.title")}
        </span>
        <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          47
        </span>
        <span className="ml-auto flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fuko-func" />
          {active}/{agents.length}
        </span>
        <button
          onClick={() => setCollapsed(true)}
          className="rounded p-0.5 text-muted-foreground hover:text-foreground"
          aria-label="Collapse agents"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {LAYERS.map((layer) => {
          const list = agents.filter((a) => a.layer === layer);
          const proc = list.filter((a) => a.status !== "idle").length;
          return (
            <section key={layer} className="mb-3">
              <div className="mb-1 flex items-center gap-2 px-1">
                <span className="h-1 w-1 rounded-full bg-primary" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-foreground">
                  {pickLocalized(LAYER_LABELS[layer], lang)}
                </span>
                <span className="ml-auto font-mono text-[10px] tabular-nums text-muted-foreground">
                  {proc}/{list.length}
                </span>
              </div>
              <ul className="space-y-0.5">
                {list.map((a) => (
                  <li key={a.id}>
                    <AgentRow
                      a={a}
                      selected={selectedAgentId === a.id}
                      onClick={() => selectAgent(selectedAgentId === a.id ? null : a.id)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {selected && (
        <div className="border-t border-border p-2">
          <AgentDetail agent={selected} onClose={() => selectAgent(null)} />
        </div>
      )}
    </aside>
  );
}
