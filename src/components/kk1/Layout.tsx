import {
  Activity,
  Boxes,
  Cpu,
  Database,
  GitBranch,
  Hexagon,
  Radio,
  Shield,
  Sparkles,
  Workflow,
} from "lucide-react";
import { useKK1Store } from "@/store/kk1-store";
import { FukoText } from "./FukoText";

function StatusDot({ status }: { status: "live" | "idle" | "sealed" }) {
  const map = {
    live: "bg-fuko-func shadow-[0_0_6px_var(--fuko-func)]",
    idle: "bg-fuko-cond",
    sealed: "bg-fuko-guard",
  };
  return <span className={`h-1.5 w-1.5 rounded-full ${map[status]}`} />;
}

export function Sidebar() {
  const { channels, activeChannel, setActiveChannel } = useKK1Store();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-panel md:flex">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Hexagon className="h-5 w-5 text-primary" />
        <div className="leading-tight">
          <div className="font-mono text-sm font-semibold tracking-tight">
            KK1 <span className="text-primary">Core</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            AGI Strategic Engine
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 text-sm">
        <SectionLabel>Channels</SectionLabel>
        <ul className="mb-4 space-y-0.5">
          {channels.map((c) => {
            const active = activeChannel === c.id;
            return (
              <li key={c.id}>
                <button
                  onClick={() => setActiveChannel(c.id)}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1.5 font-mono text-xs ${
                    active
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-panel-2 hover:text-foreground"
                  }`}
                >
                  <StatusDot status={c.status} />
                  <span className="truncate">{c.label}</span>
                  {active && (
                    <span className="ml-auto text-[10px] uppercase tracking-widest text-primary">
                      active
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <SectionLabel>Modules</SectionLabel>
        <ul className="space-y-0.5">
          {[
            { icon: Radio, label: "ingest.w0" },
            { icon: Shield, label: "identity.w1" },
            { icon: Cpu, label: "scoring.6d" },
            { icon: GitBranch, label: "sda.router" },
            { icon: Workflow, label: "workflows" },
            { icon: Boxes, label: "agents" },
            { icon: Database, label: "memory.vault" },
            { icon: Sparkles, label: "skills" },
          ].map(({ icon: Icon, label }) => (
            <li key={label}>
              <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 font-mono text-xs text-muted-foreground hover:bg-panel-2 hover:text-foreground">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-border p-3">
        <div className="rounded border border-border bg-background/60 p-2">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            operator
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary/20 text-center font-mono text-xs leading-6 text-primary">
              KX
            </div>
            <div className="font-mono text-xs">tier2.strategist</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 pb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
      {children}
    </div>
  );
}

export function RightRail() {
  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-3 border-l border-border bg-panel/60 p-3 xl:flex">
      <div className="rounded border border-border bg-panel p-3">
        <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <Activity className="h-3 w-3 text-primary" /> System pulse
        </div>
        <div className="space-y-1.5 font-mono text-xs">
          {[
            ["load", "0.42"],
            ["queue", "003"],
            ["agents", "07/12"],
            ["p95 lat", "412ms"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-muted-foreground">{k}</span>
              <span className="tabular-nums">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded border border-border bg-panel p-3">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          FUKO-LANG legend
        </div>
        <ul className="space-y-1.5 text-xs">
          {[
            "@-[analyzer]",
            "#-market_scan-",
            "$-launch_readiness",
            "!-no_pii_leak-",
            "/-synteza_strategiczna",
            "&-jeśli_ryzyko>0.7",
          ].map((s) => (
            <li key={s} className="flex items-center gap-2">
              <FukoText text={s} />
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded border border-border bg-panel p-3">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Guardrail stack
        </div>
        <ul className="space-y-1 font-mono text-xs">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-fuko-guard" /> no_pii_leak
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-fuko-guard" /> no_speculation
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-fuko-guard" /> audit_trail
          </li>
        </ul>
      </div>
    </aside>
  );
}

export function Topbar() {
  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b border-border bg-panel px-4">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-fuko-func shadow-[0_0_6px_var(--fuko-func)]" />
        engine online
      </div>
      <span className="opacity-30">│</span>
      <span className="font-mono text-xs text-foreground">kk1.core / command</span>
      <span className="ml-auto flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>build 2026.07.25</span>
        <span>region eu-frankfurt</span>
        <span>rev a3f9c1</span>
      </span>
    </header>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <Topbar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 bg-grid">{children}</main>
        <RightRail />
      </div>
    </div>
  );
}
