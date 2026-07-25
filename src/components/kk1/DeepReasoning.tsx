import { ChevronDown, Cpu, GitBranch, Radar, ShieldCheck } from "lucide-react";
import type { StrategicAnalysis } from "@/store/kk1-store";
import { FukoText } from "./FukoText";

const SCORE_META: {
  key: keyof StrategicAnalysis["scoring"];
  label: string;
  hue: string;
}[] = [
  { key: "confidence", label: "Confidence", hue: "var(--fuko-agent)" },
  { key: "risk", label: "Risk", hue: "var(--fuko-guard)" },
  { key: "empathy", label: "Empathy", hue: "var(--fuko-skill)" },
  { key: "focus", label: "Focus", hue: "var(--fuko-func)" },
  { key: "energy", label: "Energy", hue: "var(--fuko-proc)" },
  { key: "curiosity", label: "Curiosity", hue: "var(--fuko-cond)" },
];

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded border border-border bg-panel-2/60">
      <div className="flex items-center gap-2 border-b border-border px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      <div className="p-3 text-xs">{children}</div>
    </div>
  );
}

function Bar({ label, value, hue }: { label: string; value: number; hue: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="grid grid-cols-[110px_1fr_44px] items-center gap-2">
      <span className="font-mono text-[11px] text-muted-foreground">{label}</span>
      <div className="h-1.5 w-full overflow-hidden rounded-sm bg-panel">
        <div
          className="h-full rounded-sm"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, color-mix(in oklab, ${hue} 40%, transparent), ${hue})`,
            boxShadow: `0 0 8px color-mix(in oklab, ${hue} 60%, transparent)`,
          }}
        />
      </div>
      <span className="text-right font-mono text-[11px] tabular-nums text-foreground">
        {pct.toString().padStart(2, "0")}%
      </span>
    </div>
  );
}

export function DeepReasoning({
  analysis,
  open,
  onToggle,
}: {
  analysis: StrategicAnalysis;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mt-3 rounded-md border border-border bg-panel/60">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Deep Reasoning UI
          </span>
          <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            W0 · W1 · 6D · SDA
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="grid gap-3 border-t border-border p-3 md:grid-cols-2">
          <Panel title="W0 · Ingestion Summary" icon={<Radar className="h-3 w-3" />}>
            <p className="text-muted-foreground">{analysis.w0_ingestion}</p>
          </Panel>

          <Panel
            title="W1 · Identity Filter & FUKO Decision"
            icon={<ShieldCheck className="h-3 w-3" />}
          >
            <div className="space-y-2">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-muted-foreground">identity</span>
                <span>{analysis.w1_identity.identity}</span>
              </div>
              <p className="text-muted-foreground">
                {analysis.w1_identity.fuko_decision}
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                {analysis.w1_identity.triggered_symbols.map((s) => (
                  <FukoText key={s} text={s} />
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="6D Scoring Matrix" icon={<Cpu className="h-3 w-3" />}>
            <div className="space-y-2">
              {SCORE_META.map((s) => (
                <Bar
                  key={s.key}
                  label={s.label}
                  value={analysis.scoring[s.key]}
                  hue={s.hue}
                />
              ))}
            </div>
          </Panel>

          <Panel title="SDA · Routing Path" icon={<GitBranch className="h-3 w-3" />}>
            <ol className="space-y-1.5">
              {analysis.sda_routing.map((hop, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded border border-border/60 bg-panel px-2 py-1.5 font-mono text-[11px]"
                >
                  <span className="w-4 text-right text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <FukoText text={hop.agent} />
                  <span className="flex-1 truncate text-muted-foreground">
                    {hop.role}
                  </span>
                  <span className="tabular-nums text-fuko-func">
                    {hop.latency_ms}ms
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      )}
    </div>
  );
}
