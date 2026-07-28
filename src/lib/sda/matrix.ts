/**
 * SDA (Strategic Decision Architecture) — decision matrix.
 * Port of the Python w2_routing.py generator: 5 domains × N actors,
 * each rule maps to an impact area (W0-W6), priority (1-10), and
 * strategy (leverage | monopol | compound | ecosystem | data | asset).
 *
 * Persistence: localStorage (namespace "kk1.sda.matrix"), replaces the
 * Python SQLite backing.
 */

export type SdaStrategy =
  | "leverage"
  | "monopol"
  | "compound"
  | "ecosystem"
  | "data"
  | "asset";

export type SdaImpactArea = "W0" | "W1" | "W2" | "W3" | "W4" | "W5" | "W6";

export type SdaRule = {
  rule_id: string;
  domain: string;
  actor: string; // agent handle, e.g. "@ceo"
  impact_area: SdaImpactArea;
  priority: number; // 1..10
  strategy: SdaStrategy;
  description: string;
  keywords: string[];
  active: boolean;
  created_at: string;
};

export type SdaRoutingType = "sda_exact" | "sda_keyword" | "fuko_fallback";

export type SdaRoutingDecision = {
  input: string;
  matched_rule: SdaRule | null;
  target_agent: string;
  confidence: number; // 0..1
  routing_type: SdaRoutingType;
  reasoning: string;
  matched_keywords: string[];
  matrix_version: string;
};

// ---------------------------------------------------------------------------
// KEYWORDS — per-domain, EN + PL merged (i18n-safe)
// ---------------------------------------------------------------------------

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  Ingestion: [
    "ingest", "webhook", "data", "csv", "audio", "voice", "transcript", "file",
    "import", "upload", "dane", "glos", "głos", "transkrypcja", "plik", "wgraj", "przeslij", "prześlij",
  ],
  Decisions: [
    "decision", "decide", "strategy", "analyze", "analysis", "score", "choose",
    "priority", "why", "what should", "routing",
    "decyzja", "strategia", "analiza", "ocena", "wybierz", "decyduj", "priorytet", "co robic", "co robić", "jak",
  ],
  Execution: [
    "execute", "do", "run", "create", "build", "deploy", "launch", "send",
    "ship", "action", "start",
    "wykonaj", "zrob", "zrób", "stworz", "stwórz", "uruchom", "wyślij", "wyslij", "egzekucja", "akcja", "start",
  ],
  Memory: [
    "memory", "history", "belief", "emotion", "checkpoint", "backup", "save",
    "remember", "recall", "context",
    "pamiec", "pamięć", "historia", "emocja", "zapisz", "przypomnij", "kontekst",
  ],
  Optimization: [
    "optimize", "improve", "tune", "tuning", "parameter", "calibrate", "better",
    "performance",
    "optymalizuj", "ulepsz", "parametr", "kalibracja", "dostroj", "dostrój", "lepszy", "wydajnosc", "wydajność",
  ],
};

// ---------------------------------------------------------------------------
// DEFAULT STRUCTURE — mapped to existing 47-agent seed
// (actor handles match src/store/kk1-store.ts AGENT_SEED)
// ---------------------------------------------------------------------------

type ActorMeta = {
  layer: SdaImpactArea;
  priority: number;
  strategy: SdaStrategy;
  goal: string;
};

const DEFAULT_STRUCTURE: Record<string, Record<string, ActorMeta>> = {
  Ingestion: {
    "@ingestor":  { layer: "W0", priority: 9, strategy: "data",     goal: "Zero-latency ingest" },
    "@parser":    { layer: "W1", priority: 8, strategy: "leverage", goal: "Grammar parsing" },
    "@semantic":  { layer: "W1", priority: 7, strategy: "leverage", goal: "Semantic normalization" },
    "@fetcher":   { layer: "W0", priority: 6, strategy: "data",     goal: "Voice / file ingest" },
  },
  Decisions: {
    "@ceo":       { layer: "W4", priority: 10, strategy: "monopol",  goal: "Strategic dominance" },
    "@analyzer":  { layer: "W4", priority: 9,  strategy: "compound", goal: "Deep analysis" },
    "@identity":  { layer: "W1", priority: 9,  strategy: "leverage", goal: "Identity filter (W1)" },
    "@critic":    { layer: "W6", priority: 8,  strategy: "asset",    goal: "Adversarial audit" },
    "@intent":    { layer: "W2", priority: 8,  strategy: "leverage", goal: "Intent classification" },
    "@risk":      { layer: "W4", priority: 8,  strategy: "compound", goal: "Risk scoring" },
  },
  Execution: {
    "@router":     { layer: "W2", priority: 10, strategy: "ecosystem", goal: "SDA dispatch" },
    "@dispatcher": { layer: "W2", priority: 9,  strategy: "ecosystem", goal: "47-agent coordination" },
    "@executor":   { layer: "W3", priority: 9,  strategy: "ecosystem", goal: "Tool runner" },
    "@builder":    { layer: "W3", priority: 7,  strategy: "asset",     goal: "Artifact build" },
    "@sentinel":   { layer: "W6", priority: 10, strategy: "asset",     goal: "Emergency stop" },
    "@publisher":  { layer: "W3", priority: 6,  strategy: "ecosystem", goal: "Publish" },
  },
  Memory: {
    "@memory":     { layer: "W5", priority: 7, strategy: "data",     goal: "Working memory" },
    "@recall":     { layer: "W5", priority: 8, strategy: "compound", goal: "Vault recall" },
    "@vault":      { layer: "W6", priority: 7, strategy: "asset",    goal: "Snapshot / restore" },
    "@audit":      { layer: "W6", priority: 6, strategy: "asset",    goal: "Audit trail" },
  },
  Optimization: {
    "@calibrator": { layer: "W6", priority: 6, strategy: "compound", goal: "Auto-calibration" },
    "@arbiter":    { layer: "W6", priority: 8, strategy: "monopol",  goal: "Meta decisions" },
    "@futures":    { layer: "W6", priority: 7, strategy: "compound", goal: "Trajectory scan" },
  },
};

// ---------------------------------------------------------------------------
// GENERATOR
// ---------------------------------------------------------------------------

function hashId(seed: string): string {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h + seed.charCodeAt(i)) | 0;
  return `sda_${(h >>> 0).toString(16).padStart(8, "0")}`;
}

export function generateMatrix(
  structure: Record<string, Record<string, ActorMeta>> = DEFAULT_STRUCTURE,
  version = `KK1_Core_v${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`,
): { rules: SdaRule[]; version: string } {
  const rules: SdaRule[] = [];
  const created = new Date().toISOString();
  for (const [domain, actors] of Object.entries(structure)) {
    const domainKw = DOMAIN_KEYWORDS[domain] ?? [];
    for (const [actor, meta] of Object.entries(actors)) {
      const actorKw = actor.replace(/^@/, "").split(/[-_]/).filter(Boolean);
      const kw = Array.from(new Set([...domainKw, ...actorKw, meta.strategy, ...meta.goal.toLowerCase().split(/\s+/)]));
      rules.push({
        rule_id: hashId(`${domain}:${actor}:${meta.layer}:${meta.priority}:${meta.strategy}`),
        domain,
        actor,
        impact_area: meta.layer,
        priority: meta.priority,
        strategy: meta.strategy,
        description: `${actor} in ${domain} — goal: ${meta.goal}`,
        keywords: kw,
        active: true,
        created_at: created,
      });
    }
  }
  rules.sort((a, b) => b.priority - a.priority);
  return { rules, version };
}

// ---------------------------------------------------------------------------
// PERSISTENCE
// ---------------------------------------------------------------------------

const LS_KEY = "kk1.sda.matrix";

export function loadMatrix(): { rules: SdaRule[]; version: string } {
  if (typeof localStorage === "undefined") return generateMatrix();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return generateMatrix();
    const parsed = JSON.parse(raw) as { rules: SdaRule[]; version: string };
    if (!Array.isArray(parsed.rules) || parsed.rules.length === 0) return generateMatrix();
    return parsed;
  } catch {
    return generateMatrix();
  }
}

export function saveMatrix(m: { rules: SdaRule[]; version: string }): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(m));
  } catch {
    /* ignore quota */
  }
}

export function exportMatrixJson(): string {
  return JSON.stringify(loadMatrix(), null, 2);
}
