import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Activity,
  ShieldCheck,
  Coins,
  Workflow,
  UserCog,
  ArrowUpRight,
  ArrowDownRight,
  CircleDot,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Loader2,
  Clock,
} from "lucide-react";
import { useKK1Store, pickLocalized } from "@/store/kk1-store";
import { useI18n } from "@/i18n/i18n";

// ---------------- Panel shell ----------------

function Panel({
  icon: Icon,
  title,
  subtitle,
  children,
  className = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex min-h-0 flex-col rounded border border-border bg-panel ${className}`}
    >
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <div className="font-mono text-[11px] font-semibold uppercase tracking-widest text-foreground">
          {title}
        </div>
        <div className="ml-auto font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {subtitle}
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </section>
  );
}

// ---------------- 1. Trust Score Engine ----------------

const TRUST_SERIES = [
  { t: "T-6", ceo: 0.86, analyzer: 0.78, writer: 0.71, guardrails: 0.94 },
  { t: "T-5", ceo: 0.87, analyzer: 0.74, writer: 0.72, guardrails: 0.94 },
  { t: "T-4", ceo: 0.88, analyzer: 0.62, writer: 0.74, guardrails: 0.95 },
  { t: "T-3", ceo: 0.9,  analyzer: 0.66, writer: 0.7,  guardrails: 0.95 },
  { t: "T-2", ceo: 0.91, analyzer: 0.71, writer: 0.76, guardrails: 0.96 },
  { t: "T-1", ceo: 0.92, analyzer: 0.79, writer: 0.79, guardrails: 0.97 },
  { t: "T-0", ceo: 0.93, analyzer: 0.82, writer: 0.81, guardrails: 0.97 },
];

type TrustEvent = {
  ts: string;
  agent: string;
  delta: number;
  reason: string;
};

const TRUST_EVENTS: TrustEvent[] = [
  { ts: "12:04:11", agent: "@analyzer", delta: -0.16, reason: "Hallucination detected in market_scan output" },
  { ts: "12:07:42", agent: "@analyzer", delta: +0.04, reason: "Self-critique recovered, re-issued grounded claim" },
  { ts: "12:11:03", agent: "@ceo",      delta: +0.02, reason: "Task success · exec_brief approved" },
  { ts: "12:13:29", agent: "@writer",   delta: +0.03, reason: "Zero-drift narrative pass" },
  { ts: "12:15:57", agent: "@guardrails", delta: +0.01, reason: "PII sweep clean · 4/4 sections" },
  { ts: "12:18:12", agent: "@analyzer", delta: +0.06, reason: "Cited 3 primary sources · confidence lifted" },
];

function TrustPanel() {
  return (
    <Panel icon={Activity} title="Trust Score Engine" subtitle="dynamic · rolling 6t">
      <div className="grid h-full grid-rows-[220px_minmax(0,1fr)]">
        <div className="border-b border-border p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={TRUST_SERIES} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="t" stroke="var(--muted-foreground)" tick={{ fontSize: 10, fontFamily: "ui-monospace" }} />
              <YAxis domain={[0.5, 1]} stroke="var(--muted-foreground)" tick={{ fontSize: 10, fontFamily: "ui-monospace" }} />
              <Tooltip
                contentStyle={{
                  background: "var(--panel-2)",
                  border: "1px solid var(--border)",
                  fontFamily: "ui-monospace",
                  fontSize: 11,
                  color: "var(--foreground)",
                }}
              />
              <Legend wrapperStyle={{ fontFamily: "ui-monospace", fontSize: 10 }} />
              <Line type="monotone" dataKey="ceo"        stroke="var(--primary)"     strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="analyzer"   stroke="var(--fuko-guard)"  strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="writer"     stroke="var(--fuko-skill)"  strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="guardrails" stroke="var(--fuko-func)"   strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <ul className="divide-y divide-border font-mono text-[11px]">
          {TRUST_EVENTS.map((e, i) => {
            const pos = e.delta >= 0;
            return (
              <li key={i} className="flex items-start gap-2 px-3 py-1.5">
                <span className="text-muted-foreground">{e.ts}</span>
                <span className="rounded bg-fuko-agent-bg px-1 text-fuko-agent">{e.agent}</span>
                <span
                  className={`inline-flex items-center gap-0.5 rounded px-1 ${
                    pos ? "bg-fuko-func-bg text-fuko-func" : "bg-fuko-guard-bg text-fuko-guard"
                  }`}
                >
                  {pos ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {(pos ? "+" : "") + e.delta.toFixed(2)}
                </span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{e.reason}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </Panel>
  );
}

// ---------------- 2. AI License Engine ----------------

const LICENSE_LEVELS = [
  { lvl: 0, key: "L0_OBSERVER",           caps: ["read.telemetry", "observe.channels"] },
  { lvl: 1, key: "L1_READER",             caps: ["read.vault.public", "cite.sources"] },
  { lvl: 2, key: "L2_ANALYST",            caps: ["run.analysis", "invoke.tools.readonly"] },
  { lvl: 3, key: "L3_OPERATOR",           caps: ["invoke.tools.write", "route.tasks"] },
  { lvl: 4, key: "L4_EXECUTOR",           caps: ["execute.workflows", "commit.artifacts"] },
  { lvl: 5, key: "L5_CERTIFIED_ECONOMIC", caps: ["allocate.budget", "sign.contracts", "release.payouts"] },
] as const;

function LicensePanel() {
  const agents = useKK1Store((s) => s.agents);
  const { lang } = useI18n();

  const buckets = useMemo(() => {
    const by: Record<number, typeof agents> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [] };
    for (const a of agents) by[a.license].push(a);
    return by;
  }, [agents]);

  return (
    <Panel icon={ShieldCheck} title="AI License Engine" subtitle="L0 → L5 · capability grants">
      <div className="grid gap-0 divide-y divide-border">
        {LICENSE_LEVELS.map((lv) => {
          const list = buckets[lv.lvl] ?? [];
          return (
            <div key={lv.lvl} className="grid grid-cols-[64px_1fr] gap-3 p-2">
              <div className="flex flex-col items-start gap-1">
                <span
                  className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary"
                >
                  L{lv.lvl}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  {lv.key.split("_").slice(1).join(" ")}
                </span>
              </div>
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap gap-1">
                  {lv.caps.map((c) => (
                    <span
                      key={c}
                      className="rounded bg-fuko-func-bg px-1 py-0.5 font-mono text-[10px] text-fuko-func"
                    >
                      {c}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {list.length === 0 ? (
                    <span className="font-mono text-[10px] text-muted-foreground">— no agents at this tier —</span>
                  ) : (
                    list.map((a) => (
                      <span
                        key={a.id}
                        title={pickLocalized(a.role, lang)}
                        className="rounded bg-fuko-agent-bg px-1 py-0.5 font-mono text-[10px] text-fuko-agent"
                      >
                        {a.name}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// ---------------- 3. Economic Value Engine ----------------

type LedgerRow = {
  id: string;
  task: string;
  value: number;
  cost: number;
};

const LEDGER: LedgerRow[] = [
  { id: "TSK-8821", task: "auto.market_scan → EU/DACH",       value: 1420, cost: 84.12 },
  { id: "TSK-8822", task: "brief.exec → board.pack",           value:  680, cost: 12.44 },
  { id: "TSK-8823", task: "outreach.cold → 240 leads",         value: 3120, cost: 208.9 },
  { id: "TSK-8824", task: "contract.redline → v3",             value:  940, cost: 41.02 },
  { id: "TSK-8825", task: "pricing.model → Q3 rev-lift",       value: 5200, cost: 176.5 },
  { id: "TSK-8826", task: "hallu.retry → analyzer patch",      value:  -80, cost: 22.10 },
  { id: "TSK-8827", task: "vault.seal → compliance batch",     value:  410, cost:  8.30 },
];

function LedgerPanel() {
  const totals = useMemo(() => {
    const v = LEDGER.reduce((s, r) => s + r.value, 0);
    const c = LEDGER.reduce((s, r) => s + r.cost, 0);
    return { v, c, net: v - c, roi: ((v - c) / c) * 100 };
  }, []);

  return (
    <Panel icon={Coins} title="Economic Value Engine · Ledger" subtitle="autonomous task ROI">
      <table className="w-full font-mono text-[11px]">
        <thead className="sticky top-0 z-10 bg-panel">
          <tr className="text-left uppercase tracking-widest text-muted-foreground [&>th]:border-b [&>th]:border-border [&>th]:px-2 [&>th]:py-1.5 text-[9px]">
            <th>Task ID</th>
            <th>Task</th>
            <th className="text-right">Value (USD)</th>
            <th className="text-right">Cost</th>
            <th className="text-right">Net</th>
            <th className="text-right">ROI %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {LEDGER.map((r) => {
            const net = r.value - r.cost;
            const roi = (net / r.cost) * 100;
            const pos = net >= 0;
            return (
              <tr key={r.id} className="[&>td]:px-2 [&>td]:py-1.5">
                <td className="text-fuko-cond">{r.id}</td>
                <td className="max-w-[220px] truncate text-muted-foreground">{r.task}</td>
                <td className="text-right text-foreground">${r.value.toLocaleString()}</td>
                <td className="text-right text-muted-foreground">${r.cost.toFixed(2)}</td>
                <td className={`text-right ${pos ? "text-fuko-func" : "text-fuko-guard"}`}>
                  {pos ? "+" : ""}${net.toFixed(2)}
                </td>
                <td className={`text-right ${pos ? "text-fuko-func" : "text-fuko-guard"}`}>
                  {pos ? "+" : ""}{roi.toFixed(0)}%
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-border bg-panel-2 [&>td]:px-2 [&>td]:py-1.5">
            <td colSpan={2} className="text-[9px] uppercase tracking-widest text-muted-foreground">
              totals · net position
            </td>
            <td className="text-right">${totals.v.toLocaleString()}</td>
            <td className="text-right">${totals.c.toFixed(2)}</td>
            <td className={`text-right ${totals.net >= 0 ? "text-fuko-func" : "text-fuko-guard"}`}>
              {totals.net >= 0 ? "+" : ""}${totals.net.toFixed(2)}
            </td>
            <td className={`text-right ${totals.roi >= 0 ? "text-fuko-func" : "text-fuko-guard"}`}>
              {totals.roi >= 0 ? "+" : ""}{totals.roi.toFixed(0)}%
            </td>
          </tr>
        </tfoot>
      </table>
    </Panel>
  );
}

// ---------------- 4. Action Execution Mesh ----------------

type ActionKind =
  | "DOCUMENT_GENERATION"
  | "WEBHOOK_CALL"
  | "BROWSER_AUTOMATION"
  | "DB_MUTATION"
  | "EMAIL_DISPATCH"
  | "PAYMENT_SETTLEMENT";

type ActionStatus = "pending" | "executing" | "completed" | "reversed";

type Action = { id: string; kind: ActionKind; agent: string; label: string; status: ActionStatus };

const ACTIONS: Action[] = [
  { id: "A-001", kind: "DOCUMENT_GENERATION", agent: "@writer",     label: "board_pack.pdf · v3",        status: "executing" },
  { id: "A-002", kind: "WEBHOOK_CALL",        agent: "@dispatcher", label: "crm.deal.stage → won",       status: "pending" },
  { id: "A-003", kind: "BROWSER_AUTOMATION",  agent: "@executor",   label: "portal.gov.pl · file form",  status: "executing" },
  { id: "A-004", kind: "EMAIL_DISPATCH",      agent: "@publisher",  label: "240 investor updates",       status: "completed" },
  { id: "A-005", kind: "DB_MUTATION",         agent: "@vault",      label: "seal batch · 47 rows",       status: "completed" },
  { id: "A-006", kind: "PAYMENT_SETTLEMENT",  agent: "@cfo",        label: "payout · expert_net_7712",   status: "pending" },
  { id: "A-007", kind: "WEBHOOK_CALL",        agent: "@dispatcher", label: "billing.retry · 502",        status: "reversed" },
  { id: "A-008", kind: "DOCUMENT_GENERATION", agent: "@writer",     label: "term_sheet.md · draft",      status: "completed" },
];

const STATUS_META: Record<ActionStatus, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  pending:   { label: "Pending",   icon: Clock,        cls: "text-fuko-cond border-fuko-cond/30 bg-fuko-cond-bg" },
  executing: { label: "Executing", icon: Loader2,      cls: "text-fuko-agent border-fuko-agent/30 bg-fuko-agent-bg" },
  completed: { label: "Completed", icon: CheckCircle2, cls: "text-fuko-func border-fuko-func/30 bg-fuko-func-bg" },
  reversed:  { label: "Reversed",  icon: RotateCcw,    cls: "text-fuko-guard border-fuko-guard/30 bg-fuko-guard-bg" },
};

function ActionMeshPanel() {
  const columns: ActionStatus[] = ["pending", "executing", "completed", "reversed"];
  return (
    <Panel icon={Workflow} title="Action Execution Mesh" subtitle="physical action kanban">
      <div className="grid h-full grid-cols-4 gap-0 divide-x divide-border">
        {columns.map((col) => {
          const meta = STATUS_META[col];
          const Icon = meta.icon;
          const items = ACTIONS.filter((a) => a.status === col);
          return (
            <div key={col} className="flex min-w-0 flex-col">
              <div className={`flex items-center gap-1.5 border-b border-border px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest ${meta.cls.split(" ")[0]}`}>
                <Icon className={`h-3 w-3 ${col === "executing" ? "animate-spin" : ""}`} />
                {meta.label}
                <span className="ml-auto text-muted-foreground">{items.length}</span>
              </div>
              <ul className="flex-1 space-y-1.5 overflow-auto p-1.5">
                {items.map((a) => (
                  <li
                    key={a.id}
                    className={`rounded border ${meta.cls} p-1.5 font-mono text-[10px]`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="opacity-70">{a.id}</span>
                      <span className="ml-auto rounded bg-fuko-agent-bg px-1 text-fuko-agent">{a.agent}</span>
                    </div>
                    <div className="mt-1 truncate text-foreground">{a.label}</div>
                    <div className="mt-0.5 text-[9px] uppercase tracking-widest opacity-70">{a.kind}</div>
                  </li>
                ))}
                {items.length === 0 && (
                  <li className="rounded border border-dashed border-border p-2 text-center font-mono text-[10px] text-muted-foreground">
                    — empty —
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// ---------------- 5. Human Expert Network ----------------

type Expert = {
  id: string;
  name: string;
  handle: string;
  region: string;
  skills: string[];
  trust: number;
  payout: number;
  latency: string;
};

const EXPERTS: Expert[] = [
  { id: "EX-7712", name: "Dr. Ines Rocha",  handle: "@ines.rocha",  region: "EU/PT", skills: ["m&a", "eu_regulation", "pl↔pt"],       trust: 0.94, payout: 480, latency: "≤ 45m" },
  { id: "EX-4419", name: "K. Osei",         handle: "@k.osei",      region: "US/NY", skills: ["term_sheet", "vc_negotiation"],        trust: 0.91, payout: 620, latency: "≤ 90m" },
  { id: "EX-9902", name: "Y. Tanaka",       handle: "@y.tanaka",    region: "JP",    skills: ["semiconductor_supply", "risk_ops"],    trust: 0.88, payout: 540, latency: "≤ 2h" },
];

function ExpertPanel() {
  const [selected, setSelected] = useState(EXPERTS[0].id);
  const active = EXPERTS.find((e) => e.id === selected)!;

  return (
    <Panel icon={UserCog} title="Human Expert Network" subtitle="hybrid escalation router">
      <div className="grid h-full grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 border-r border-border p-3">
          <div className="mb-2 flex items-start gap-2 rounded border border-fuko-guard/30 bg-fuko-guard-bg p-2 font-mono text-[11px] text-foreground">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fuko-guard" />
            <div className="min-w-0">
              <div className="text-fuko-guard">ESCALATION · complexity 0.87 · risk 0.71</div>
              <div className="mt-1 text-muted-foreground">
                <span className="rounded bg-fuko-agent-bg px-1 text-fuko-agent">@analyzer</span>{" "}
                requested human review on{" "}
                <span className="text-foreground">TSK-8825 · pricing.model → Q3 rev-lift</span>{" "}
                — 3 conflicting primary sources, blocking on{" "}
                <span className="rounded bg-fuko-guard-bg px-1 text-fuko-guard">!-no_speculation-</span>.
              </div>
            </div>
          </div>

          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            candidates · ranked by fit
          </div>
          <ul className="mt-1 space-y-1">
            {EXPERTS.map((e) => {
              const isSel = e.id === selected;
              return (
                <li key={e.id}>
                  <button
                    onClick={() => setSelected(e.id)}
                    className={`flex w-full items-center gap-2 rounded border px-2 py-1.5 text-left font-mono text-[11px] transition-colors ${
                      isSel
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border bg-panel hover:bg-panel-2 text-muted-foreground"
                    }`}
                  >
                    <CircleDot className={`h-3 w-3 ${isSel ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-foreground">{e.name}</span>
                    <span className="text-muted-foreground">{e.handle}</span>
                    <span className="ml-auto rounded border border-border px-1 text-[10px] text-muted-foreground">{e.region}</span>
                    <span className="rounded bg-fuko-func-bg px-1 text-[10px] text-fuko-func">
                      trust {e.trust.toFixed(2)}
                    </span>
                    <span className="rounded bg-fuko-proc-bg px-1 text-[10px] text-fuko-proc">
                      ${e.payout}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col p-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">selected expert</div>
          <div className="mt-1 font-mono text-sm text-foreground">{active.name}</div>
          <div className="font-mono text-[11px] text-muted-foreground">
            {active.handle} · {active.region}
          </div>

          <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            skill tags
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {active.skills.map((s) => (
              <span key={s} className="rounded bg-fuko-skill-bg px-1.5 py-0.5 font-mono text-[10px] text-fuko-skill">
                /{s}
              </span>
            ))}
          </div>

          <div className="mt-3 space-y-1.5">
            <MetricRow label="trust score" value={active.trust.toFixed(2)} tone="func" bar={active.trust} />
            <MetricRow label="response SLA" value={active.latency} tone="cond" />
            <MetricRow label="expected payout" value={`$${active.payout.toFixed(2)}`} tone="proc" />
          </div>

          <button className="mt-auto rounded border border-primary/40 bg-primary/10 px-2 py-1.5 font-mono text-[11px] uppercase tracking-widest text-primary hover:bg-primary/20">
            dispatch · sign & escrow
          </button>
        </div>
      </div>
    </Panel>
  );
}

function MetricRow({
  label,
  value,
  tone,
  bar,
}: {
  label: string;
  value: string;
  tone: "func" | "cond" | "proc";
  bar?: number;
}) {
  const toneCls =
    tone === "func" ? "text-fuko-func bg-fuko-func" : tone === "cond" ? "text-fuko-cond bg-fuko-cond" : "text-fuko-proc bg-fuko-proc";
  const [textCls, barCls] = toneCls.split(" ");
  return (
    <div>
      <div className="flex items-center justify-between font-mono text-[10px]">
        <span className="uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className={textCls}>{value}</span>
      </div>
      {typeof bar === "number" && (
        <div className="mt-0.5 h-1 w-full overflow-hidden rounded bg-panel-2">
          <div className={`h-full ${barCls}`} style={{ width: `${Math.round(bar * 100)}%` }} />
        </div>
      )}
    </div>
  );
}

// ---------------- Grid ----------------

export function Architecture() {
  return (
    <div className="h-full min-h-0 overflow-auto p-3">
      <div className="mb-3">
        <h1 className="font-mono text-sm font-semibold uppercase tracking-widest text-foreground">
          System Architecture & Pillars
        </h1>
        <p className="font-mono text-[11px] text-muted-foreground">
          Five economic-operational engines. Live telemetry across trust, licensing, ROI, execution mesh, and human escalation.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-6">
        <div className="xl:col-span-3 min-h-[420px]"><TrustPanel /></div>
        <div className="xl:col-span-3 min-h-[420px]"><LicensePanel /></div>
        <div className="xl:col-span-4 min-h-[360px]"><LedgerPanel /></div>
        <div className="xl:col-span-2 min-h-[360px]"><ExpertPanel /></div>
        <div className="xl:col-span-6 min-h-[300px]"><ActionMeshPanel /></div>
      </div>
    </div>
  );
}
