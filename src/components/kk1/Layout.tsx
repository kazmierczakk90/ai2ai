import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Toaster } from "sonner";
import {
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
import { useKK1Store, ACCENTS } from "@/store/kk1-store";
import { hydrateI18n, useI18n } from "@/i18n/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { AgentBoard } from "./AgentBoard";
import { ShortcutManager } from "./ShortcutManager";
import { EmergencyOverlay } from "./EmergencyOverlay";
import { EventLog } from "./EventLog";

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
  const { t } = useI18n();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-panel md:flex">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Hexagon className="h-5 w-5 text-primary" />
        <div className="leading-tight">
          <div className="font-mono text-sm font-semibold tracking-tight">
            KK1 <span className="text-primary">Core</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {t("app.tagline")}
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 text-sm">
        <SectionLabel>{t("nav.channels")}</SectionLabel>
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
                      {t("nav.active")}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <SectionLabel>{t("nav.modules")}</SectionLabel>
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
            {t("nav.operator")}
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

export function Topbar() {
  const { t } = useI18n();
  const accentIndex = useKK1Store((s) => s.accentIndex);
  const voiceMode = useKK1Store((s) => s.voiceMode);

  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b border-border bg-panel px-4">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-fuko-func shadow-[0_0_6px_var(--fuko-func)]" />
        {t("top.online")}
      </div>
      <span className="font-mono text-xs text-foreground">kk1.core</span>

      <nav className="ml-3 flex items-center gap-1">
        {[
          { to: "/", label: "command" },
          { to: "/architecture", label: "architecture" },
          { to: "/import", label: "chat import" },
        ].map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            activeOptions={{ exact: true }}
            className="rounded px-2 py-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:bg-panel-2 hover:text-foreground data-[status=active]:border data-[status=active]:border-primary/40 data-[status=active]:bg-primary/10 data-[status=active]:text-primary"
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="hidden md:flex items-center gap-1">
          <span className="opacity-60">accent</span>
          <span className="rounded border border-border px-1 py-0.5 text-foreground">
            {ACCENTS[accentIndex].name}
          </span>
        </span>
        <span
          className={`hidden md:inline rounded border px-1.5 py-0.5 ${
            voiceMode
              ? "border-fuko-func/40 bg-fuko-func-bg text-fuko-func"
              : "border-border text-muted-foreground"
          }`}
        >
          {voiceMode ? t("voice.mode.on") : t("voice.mode.off")}
        </span>
        <span className="hidden lg:inline">{t("shortcuts.hint")}</span>
        <span className="hidden xl:inline">{t("top.build")} 2026.07.25</span>
        <LanguageSwitcher />
      </div>
    </header>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    hydrateI18n();
  }, []);
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <ShortcutManager />
      <Topbar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 bg-grid">{children}</main>
        <AgentBoard />
      </div>
      <EventLog />
      <EmergencyOverlay />
      <Toaster
        position="bottom-right"
        toastOptions={{ unstyled: true, classNames: { toast: "!p-0 !bg-transparent !border-0 !shadow-none" } }}
      />
    </div>
  );
}
