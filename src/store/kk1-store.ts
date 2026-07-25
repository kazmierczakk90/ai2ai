import { create } from "zustand";

export type ScoringMatrix = {
  confidence: number;
  risk: number;
  empathy: number;
  focus: number;
  energy: number;
  curiosity: number;
};

export type StrategicAnalysis = {
  w0_ingestion: string;
  w1_identity: {
    identity: string;
    fuko_decision: string;
    triggered_symbols: string[];
  };
  scoring: ScoringMatrix;
  sda_routing: { agent: string; role: string; latency_ms: number }[];
};

export type Message = {
  id: string;
  role: "user" | "system";
  ts: string;
  dialogue: string;
  strategic_analysis?: StrategicAnalysis;
};

type State = {
  activeChannel: string;
  channels: { id: string; label: string; status: "live" | "idle" | "sealed" }[];
  messages: Message[];
  expanded: Record<string, boolean>;
  toggleExpanded: (id: string) => void;
  appendMessage: (m: Message) => void;
  setActiveChannel: (id: string) => void;
};

const now = () => new Date().toISOString();

export const useKK1Store = create<State>((set) => ({
  activeChannel: "core",
  channels: [
    { id: "core", label: "core.command", status: "live" },
    { id: "ops", label: "ops.executor", status: "live" },
    { id: "audit", label: "audit.trace", status: "idle" },
    { id: "vault", label: "vault.sealed", status: "sealed" },
  ],
  expanded: {},
  toggleExpanded: (id) =>
    set((s) => ({ expanded: { ...s.expanded, [id]: !s.expanded[id] } })),
  appendMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  setActiveChannel: (id) => set({ activeChannel: id }),

  messages: [
    {
      id: "m-001",
      role: "user",
      ts: now(),
      dialogue:
        "Escalate the Q3 launch. Pull @ceo, run #-market_scan- against $-launch_readiness, and enforce !-no_pii_leak-.",
    },
    {
      id: "m-002",
      role: "system",
      ts: now(),
      dialogue:
        "Confirmed. Routing to @ceo and @analyzer. Skill /-synteza_strategiczna engaged. Blocking on &-jeśli_ryzyko>0.7 until guardrails clear. Executing #-market_scan- inside $-launch_readiness.",
      strategic_analysis: {
        w0_ingestion:
          "User request classified as HIGH-STAKES / STRATEGIC. 42 tokens, 3 imperatives, 1 escalation verb.",
        w1_identity: {
          identity: "Operator :: Tier-2 Strategist",
          fuko_decision:
            "FUKO grammar valid. Guardrail !-no_pii_leak- promoted to hard constraint. Workflow $-launch_readiness locked to auditable path.",
          triggered_symbols: [
            "@ceo",
            "@analyzer",
            "#-market_scan-",
            "$-launch_readiness",
            "!-no_pii_leak-",
            "/-synteza_strategiczna",
            "&-jeśli_ryzyko>0.7",
          ],
        },
        scoring: {
          confidence: 0.82,
          risk: 0.64,
          empathy: 0.31,
          focus: 0.91,
          energy: 0.77,
          curiosity: 0.48,
        },
        sda_routing: [
          { agent: "@ingestor", role: "W0 parse + tokenize", latency_ms: 12 },
          { agent: "@identity_filter", role: "W1 FUKO validation", latency_ms: 24 },
          { agent: "@ceo", role: "Strategic framing", latency_ms: 180 },
          { agent: "@analyzer", role: "Market scan orchestration", latency_ms: 341 },
          { agent: "@guardrails", role: "PII/compliance sweep", latency_ms: 47 },
        ],
      },
    },
    {
      id: "m-003",
      role: "user",
      ts: now(),
      dialogue:
        "Draft the exec brief. Constrain to $-brief_short and forbid speculation via !-no_speculation-.",
    },
    {
      id: "m-004",
      role: "system",
      ts: now(),
      dialogue:
        "Brief drafted by @writer using /-precyzja_narracyjna. #-format_exec- applied. &-jeśli_odbiorca=board triggered concise mode.",
      strategic_analysis: {
        w0_ingestion:
          "Directive detected. 2 constraints, 1 workflow, 1 guardrail. Empathy channel weighted low.",
        w1_identity: {
          identity: "Operator :: Tier-2 Strategist",
          fuko_decision:
            "Guardrail !-no_speculation- promoted. Workflow $-brief_short caps output at 220 tokens.",
          triggered_symbols: [
            "$-brief_short",
            "!-no_speculation-",
            "@writer",
            "/-precyzja_narracyjna",
            "#-format_exec-",
            "&-jeśli_odbiorca=board",
          ],
        },
        scoring: {
          confidence: 0.88,
          risk: 0.22,
          empathy: 0.18,
          focus: 0.95,
          energy: 0.6,
          curiosity: 0.24,
        },
        sda_routing: [
          { agent: "@ingestor", role: "W0 parse", latency_ms: 9 },
          { agent: "@identity_filter", role: "W1 FUKO validation", latency_ms: 19 },
          { agent: "@writer", role: "Drafting", latency_ms: 512 },
          { agent: "@guardrails", role: "Speculation filter", latency_ms: 33 },
        ],
      },
    },
  ],
}));
