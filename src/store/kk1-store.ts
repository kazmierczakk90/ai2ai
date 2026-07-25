import { create } from "zustand";
import type { Lang } from "@/i18n/i18n";
import { emit } from "@/lib/event-bus";

export type ScoringMatrix = {
  confidence: number;
  risk: number;
  empathy: number;
  focus: number;
  energy: number;
  curiosity: number;
};

export type Localized = string | Partial<Record<Lang, string>>;

export type StrategicAnalysis = {
  w0_ingestion: Localized;
  w1_identity: {
    identity: string;
    fuko_decision: Localized;
    triggered_symbols: string[];
  };
  scoring: ScoringMatrix;
  sda_routing: { agent: string; role: Localized; latency_ms: number }[];
};

export type Message = {
  id: string;
  role: "user" | "system";
  ts: string;
  dialogue: Localized;
  strategic_analysis?: StrategicAnalysis;
};

export function pickLocalized(v: Localized, lang: Lang): string {
  if (typeof v === "string") return v;
  return v[lang] ?? v.en ?? Object.values(v)[0] ?? "";
}

// -------------------- Agents --------------------

export type AgentLayer =
  | "cognitive"
  | "system"
  | "execution"
  | "emotional"
  | "strategic";

export type AgentStatus = "idle" | "processing" | "routing";

export type Agent = {
  id: string;
  name: string;
  layer: AgentLayer;
  status: AgentStatus;
  license: 0 | 1 | 2 | 3 | 4 | 5;
  trust: number; // 0..1
  role: Localized;
};

const AGENT_SEED: Omit<Agent, "status" | "trust">[] = [
  // Cognitive (10)
  { id: "cog-01", name: "@ingestor",     layer: "cognitive", license: 2, role: { en: "W0 tokenizer",         pl: "Tokenizator W0" } },
  { id: "cog-02", name: "@parser",       layer: "cognitive", license: 2, role: { en: "Grammar parser",       pl: "Parser gramatyki" } },
  { id: "cog-03", name: "@identity",     layer: "cognitive", license: 3, role: { en: "W1 identity filter",   pl: "Filtr tożsamości W1" } },
  { id: "cog-04", name: "@intent",       layer: "cognitive", license: 3, role: { en: "Intent classifier",    pl: "Klasyfikator intencji" } },
  { id: "cog-05", name: "@semantic",     layer: "cognitive", license: 3, role: { en: "Semantic resolver",    pl: "Rezolwer semantyczny" } },
  { id: "cog-06", name: "@analyzer",     layer: "cognitive", license: 4, role: { en: "Deep analysis",        pl: "Głęboka analiza" } },
  { id: "cog-07", name: "@synth",        layer: "cognitive", license: 4, role: { en: "Synthesis engine",     pl: "Silnik syntezy" } },
  { id: "cog-08", name: "@critic",       layer: "cognitive", license: 4, role: { en: "Self-critique",        pl: "Autokrytyka" } },
  { id: "cog-09", name: "@memory",       layer: "cognitive", license: 3, role: { en: "Working memory",       pl: "Pamięć robocza" } },
  { id: "cog-10", name: "@recall",       layer: "cognitive", license: 3, role: { en: "Vault recall",         pl: "Przywoływanie z sejfu" } },
  // System (10)
  { id: "sys-01", name: "@router",       layer: "system",    license: 3, role: { en: "SDA router",           pl: "Router SDA" } },
  { id: "sys-02", name: "@scheduler",    layer: "system",    license: 3, role: { en: "Task scheduler",       pl: "Harmonogram zadań" } },
  { id: "sys-03", name: "@registry",     layer: "system",    license: 2, role: { en: "Agent registry",       pl: "Rejestr agentów" } },
  { id: "sys-04", name: "@telemetry",    layer: "system",    license: 2, role: { en: "Telemetry bus",        pl: "Magistrala telemetrii" } },
  { id: "sys-05", name: "@audit",        layer: "system",    license: 4, role: { en: "Audit trace",          pl: "Ścieżka audytu" } },
  { id: "sys-06", name: "@vault",        layer: "system",    license: 5, role: { en: "Sealed vault",         pl: "Zaplombowany sejf" } },
  { id: "sys-07", name: "@guardrails",   layer: "system",    license: 5, role: { en: "Policy guardrails",    pl: "Wytyczne polityk" } },
  { id: "sys-08", name: "@sentinel",     layer: "system",    license: 5, role: { en: "Anomaly sentinel",     pl: "Strażnik anomalii" } },
  { id: "sys-09", name: "@limiter",      layer: "system",    license: 3, role: { en: "Rate limiter",         pl: "Ogranicznik" } },
  { id: "sys-10", name: "@heartbeat",    layer: "system",    license: 1, role: { en: "Liveness pulse",       pl: "Puls żywotności" } },
  // Execution (10)
  { id: "exe-01", name: "@executor",     layer: "execution", license: 4, role: { en: "Tool runner",          pl: "Uruchamianie narzędzi" } },
  { id: "exe-02", name: "@builder",      layer: "execution", license: 3, role: { en: "Artifact builder",     pl: "Twórca artefaktów" } },
  { id: "exe-03", name: "@writer",       layer: "execution", license: 3, role: { en: "Content writer",       pl: "Redaktor treści" } },
  { id: "exe-04", name: "@coder",        layer: "execution", license: 4, role: { en: "Code synthesizer",     pl: "Syntezator kodu" } },
  { id: "exe-05", name: "@scanner",      layer: "execution", license: 3, role: { en: "Market scanner",       pl: "Skaner rynku" } },
  { id: "exe-06", name: "@fetcher",      layer: "execution", license: 2, role: { en: "Data fetcher",         pl: "Pobieranie danych" } },
  { id: "exe-07", name: "@publisher",    layer: "execution", license: 3, role: { en: "Publisher",            pl: "Publikator" } },
  { id: "exe-08", name: "@translator",   layer: "execution", license: 2, role: { en: "Translator",           pl: "Tłumacz" } },
  { id: "exe-09", name: "@renderer",     layer: "execution", license: 2, role: { en: "Renderer",             pl: "Renderer" } },
  { id: "exe-10", name: "@dispatcher",   layer: "execution", license: 3, role: { en: "Dispatcher",           pl: "Dyspozytor" } },
  // Emotional (7)
  { id: "emo-01", name: "@empath",       layer: "emotional", license: 3, role: { en: "Empathy channel",      pl: "Kanał empatii" } },
  { id: "emo-02", name: "@tone",         layer: "emotional", license: 2, role: { en: "Tone regulator",       pl: "Regulator tonu" } },
  { id: "emo-03", name: "@calibrator",   layer: "emotional", license: 3, role: { en: "Affect calibrator",    pl: "Kalibrator afektu" } },
  { id: "emo-04", name: "@nurture",      layer: "emotional", license: 2, role: { en: "Nurture voice",        pl: "Głos wsparcia" } },
  { id: "emo-05", name: "@resonance",    layer: "emotional", license: 3, role: { en: "Resonance sensor",     pl: "Sensor rezonansu" } },
  { id: "emo-06", name: "@steady",       layer: "emotional", license: 2, role: { en: "De-escalation",        pl: "Deeskalacja" } },
  { id: "emo-07", name: "@spark",        layer: "emotional", license: 2, role: { en: "Curiosity spark",      pl: "Iskra ciekawości" } },
  // Strategic (10)
  { id: "str-01", name: "@ceo",          layer: "strategic", license: 5, role: { en: "Strategic framing",    pl: "Ramowanie strategiczne" } },
  { id: "str-02", name: "@cfo",          layer: "strategic", license: 5, role: { en: "Financial framing",    pl: "Ramowanie finansowe" } },
  { id: "str-03", name: "@cto",          layer: "strategic", license: 5, role: { en: "Tech framing",         pl: "Ramowanie technologiczne" } },
  { id: "str-04", name: "@planner",      layer: "strategic", license: 4, role: { en: "Long-range planner",   pl: "Planer długoterminowy" } },
  { id: "str-05", name: "@negotiator",   layer: "strategic", license: 4, role: { en: "Negotiator",           pl: "Negocjator" } },
  { id: "str-06", name: "@risk",         layer: "strategic", license: 4, role: { en: "Risk officer",         pl: "Oficer ryzyka" } },
  { id: "str-07", name: "@compliance",   layer: "strategic", license: 5, role: { en: "Compliance officer",   pl: "Oficer zgodności" } },
  { id: "str-08", name: "@narrative",    layer: "strategic", license: 3, role: { en: "Narrative architect",  pl: "Architekt narracji" } },
  { id: "str-09", name: "@futures",      layer: "strategic", license: 4, role: { en: "Futures scanner",      pl: "Skaner przyszłości" } },
  { id: "str-10", name: "@arbiter",      layer: "strategic", license: 5, role: { en: "Arbiter of last resort", pl: "Arbiter ostatniej instancji" } },
];

function seedAgents(): Agent[] {
  const statuses: AgentStatus[] = ["idle", "processing", "routing"];
  return AGENT_SEED.map((a, i) => ({
    ...a,
    status: statuses[(i * 7) % 3] as AgentStatus,
    trust: Math.round((0.55 + ((i * 17) % 45) / 100) * 100) / 100,
  })) as Agent[];
}

export const LAYER_LABELS: Record<AgentLayer, Localized> = {
  cognitive: { en: "Cognitive", pl: "Poznawcza", fr: "Cognitive", es: "Cognitiva" },
  system:    { en: "System",    pl: "Systemowa", fr: "Système",   es: "Sistema" },
  execution: { en: "Execution", pl: "Wykonawcza", fr: "Exécution", es: "Ejecución" },
  emotional: { en: "Emotional", pl: "Emocjonalna", fr: "Émotionnelle", es: "Emocional" },
  strategic: { en: "Strategic", pl: "Strategiczna", fr: "Stratégique", es: "Estratégica" },
};

// -------------------- Global control state --------------------

const ACCENTS: { name: string; primary: string }[] = [
  { name: "cyan",   primary: "oklch(0.72 0.16 235)" },
  { name: "amber",  primary: "oklch(0.78 0.16 70)"  },
  { name: "lime",   primary: "oklch(0.78 0.18 145)" },
  { name: "violet", primary: "oklch(0.72 0.18 300)" },
  { name: "rose",   primary: "oklch(0.72 0.2 15)"   },
];

// -------------------- Store --------------------

type State = {
  activeChannel: string;
  channels: { id: string; label: string; status: "live" | "idle" | "sealed" }[];
  messages: Message[];
  expanded: Record<string, boolean>;
  toggleExpanded: (id: string) => void;
  appendMessage: (m: Message) => void;
  setActiveChannel: (id: string) => void;

  agents: Agent[];
  selectedAgentId: string | null;
  selectAgent: (id: string | null) => void;
  pulseAgents: () => void;

  voiceMode: boolean;
  toggleVoiceMode: () => void;

  emergencyStop: boolean;
  triggerEmergency: () => void;
  clearEmergency: () => void;

  accentIndex: number;
  cycleAccent: () => void;
  applyAccent: () => void;
};

const now = () => new Date().toISOString();

export const useKK1Store = create<State>((set, get) => ({
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

  agents: seedAgents(),
  selectedAgentId: null,
  selectAgent: (id) => set({ selectedAgentId: id }),
  pulseAgents: () =>
    set((s) => ({
      agents: s.agents.map((a, i) => {
        // Only occasionally flip status to simulate real-time telemetry.
        if (Math.random() > 0.22) return a;
        const opts: AgentStatus[] = ["idle", "processing", "routing"];
        const next = opts[(i + Math.floor(Date.now() / 1000)) % 3] as AgentStatus;
        return { ...a, status: next };
      }),
    })),

  voiceMode: false,
  toggleVoiceMode: () => set((s) => ({ voiceMode: !s.voiceMode })),

  emergencyStop: false,
  triggerEmergency: () => set({ emergencyStop: true }),
  clearEmergency: () => set({ emergencyStop: false }),

  accentIndex: 0,
  cycleAccent: () => {
    const next = (get().accentIndex + 1) % ACCENTS.length;
    set({ accentIndex: next });
    get().applyAccent();
  },
  applyAccent: () => {
    if (typeof document === "undefined") return;
    const a = ACCENTS[get().accentIndex];
    document.documentElement.style.setProperty("--primary", a.primary);
    document.documentElement.style.setProperty("--ring", a.primary);
  },

  messages: [
    {
      id: "m-001",
      role: "user",
      ts: now(),
      dialogue: {
        en: "Escalate the Q3 launch. Pull @ceo, run #-market_scan- against $-launch_readiness, and enforce !-no_pii_leak-.",
        pl: "Eskaluj launch Q3. Ściągnij @ceo, uruchom #-market_scan- w ramach $-launch_readiness i wymuś !-no_pii_leak-.",
        fr: "Escalade le lancement Q3. Convoque @ceo, exécute #-market_scan- dans $-launch_readiness et applique !-no_pii_leak-.",
        es: "Escala el lanzamiento Q3. Convoca a @ceo, ejecuta #-market_scan- en $-launch_readiness y aplica !-no_pii_leak-.",
      },
    },
    {
      id: "m-002",
      role: "system",
      ts: now(),
      dialogue: {
        en: "Confirmed. Routing to @ceo and @analyzer. Skill /-synteza_strategiczna engaged. Blocking on &-jeśli_ryzyko>0.7 until guardrails clear. Executing #-market_scan- inside $-launch_readiness.",
        pl: "Potwierdzono. Kieruję do @ceo i @analyzer. Umiejętność /-synteza_strategiczna aktywna. Blokada na &-jeśli_ryzyko>0.7 do czasu spełnienia wytycznych. Uruchamiam #-market_scan- w $-launch_readiness.",
        fr: "Confirmé. Routage vers @ceo et @analyzer. Compétence /-synteza_strategiczna activée. Blocage sur &-jeśli_ryzyko>0.7 jusqu'à validation des garde-fous. Exécution de #-market_scan- dans $-launch_readiness.",
        es: "Confirmado. Enrutando a @ceo y @analyzer. Habilidad /-synteza_strategiczna activada. Bloqueo en &-jeśli_ryzyko>0.7 hasta validar las salvaguardas. Ejecutando #-market_scan- en $-launch_readiness.",
      },
      strategic_analysis: {
        w0_ingestion: {
          en: "User request classified as HIGH-STAKES / STRATEGIC. 42 tokens, 3 imperatives, 1 escalation verb.",
          pl: "Żądanie sklasyfikowane jako WYSOKIE-RYZYKO / STRATEGICZNE. 42 tokeny, 3 imperatywy, 1 czasownik eskalacji.",
          fr: "Requête classée HAUTS-ENJEUX / STRATÉGIQUE. 42 tokens, 3 impératifs, 1 verbe d'escalade.",
          es: "Solicitud clasificada como ALTO-RIESGO / ESTRATÉGICA. 42 tokens, 3 imperativos, 1 verbo de escalada.",
        },
        w1_identity: {
          identity: "Operator :: Tier-2 Strategist",
          fuko_decision: {
            en: "FUKO grammar valid. Guardrail !-no_pii_leak- promoted to hard constraint. Workflow $-launch_readiness locked to auditable path.",
            pl: "Gramatyka FUKO poprawna. Wytyczna !-no_pii_leak- podniesiona do twardego ograniczenia. Proces $-launch_readiness zablokowany na ścieżce audytowalnej.",
            fr: "Grammaire FUKO valide. Garde-fou !-no_pii_leak- promu en contrainte stricte. Workflow $-launch_readiness verrouillé sur un chemin auditable.",
            es: "Gramática FUKO válida. Salvaguarda !-no_pii_leak- elevada a restricción estricta. Flujo $-launch_readiness bloqueado en ruta auditable.",
          },
          triggered_symbols: [
            "@ceo", "@analyzer", "#-market_scan-", "$-launch_readiness",
            "!-no_pii_leak-", "/-synteza_strategiczna", "&-jeśli_ryzyko>0.7",
          ],
        },
        scoring: { confidence: 0.82, risk: 0.64, empathy: 0.31, focus: 0.91, energy: 0.77, curiosity: 0.48 },
        sda_routing: [
          { agent: "@ingestor", role: { en: "W0 parse + tokenize", pl: "W0 parsowanie + tokenizacja", fr: "W0 parsing + tokenisation", es: "W0 análisis + tokenización" }, latency_ms: 12 },
          { agent: "@identity_filter", role: { en: "W1 FUKO validation", pl: "W1 walidacja FUKO", fr: "W1 validation FUKO", es: "W1 validación FUKO" }, latency_ms: 24 },
          { agent: "@ceo", role: { en: "Strategic framing", pl: "Ramowanie strategiczne", fr: "Cadrage stratégique", es: "Encuadre estratégico" }, latency_ms: 180 },
          { agent: "@analyzer", role: { en: "Market scan orchestration", pl: "Orkiestracja skanu rynku", fr: "Orchestration scan de marché", es: "Orquestación de escaneo de mercado" }, latency_ms: 341 },
          { agent: "@guardrails", role: { en: "PII/compliance sweep", pl: "Skan PII/zgodności", fr: "Balayage PII/conformité", es: "Barrido PII/cumplimiento" }, latency_ms: 47 },
        ],
      },
    },
    {
      id: "m-003",
      role: "user",
      ts: now(),
      dialogue: {
        en: "Draft the exec brief. Constrain to $-brief_short and forbid speculation via !-no_speculation-.",
        pl: "Przygotuj brief dla zarządu. Ogranicz do $-brief_short i zakaż spekulacji przez !-no_speculation-.",
        fr: "Rédige le brief exécutif. Contraindre à $-brief_short et interdire la spéculation via !-no_speculation-.",
        es: "Redacta el brief ejecutivo. Limita a $-brief_short y prohíbe especulación mediante !-no_speculation-.",
      },
    },
    {
      id: "m-004",
      role: "system",
      ts: now(),
      dialogue: {
        en: "Brief drafted by @writer using /-precyzja_narracyjna. #-format_exec- applied. &-jeśli_odbiorca=board triggered concise mode.",
        pl: "Brief przygotowany przez @writer z /-precyzja_narracyjna. #-format_exec- zastosowany. &-jeśli_odbiorca=board uruchomił tryb zwięzły.",
        fr: "Brief rédigé par @writer avec /-precyzja_narracyjna. #-format_exec- appliqué. &-jeśli_odbiorca=board a déclenché le mode concis.",
        es: "Brief redactado por @writer con /-precyzja_narracyjna. #-format_exec- aplicado. &-jeśli_odbiorca=board activó el modo conciso.",
      },
      strategic_analysis: {
        w0_ingestion: {
          en: "Directive detected. 2 constraints, 1 workflow, 1 guardrail. Empathy channel weighted low.",
          pl: "Wykryto dyrektywę. 2 ograniczenia, 1 proces, 1 wytyczna. Kanał empatii oceniony nisko.",
          fr: "Directive détectée. 2 contraintes, 1 workflow, 1 garde-fou. Canal empathie pondéré bas.",
          es: "Directiva detectada. 2 restricciones, 1 flujo, 1 salvaguarda. Canal de empatía ponderado bajo.",
        },
        w1_identity: {
          identity: "Operator :: Tier-2 Strategist",
          fuko_decision: {
            en: "Guardrail !-no_speculation- promoted. Workflow $-brief_short caps output at 220 tokens.",
            pl: "Wytyczna !-no_speculation- podniesiona. Proces $-brief_short ogranicza wyjście do 220 tokenów.",
            fr: "Garde-fou !-no_speculation- promu. Workflow $-brief_short plafonne la sortie à 220 tokens.",
            es: "Salvaguarda !-no_speculation- elevada. Flujo $-brief_short limita la salida a 220 tokens.",
          },
          triggered_symbols: [
            "$-brief_short", "!-no_speculation-", "@writer", "/-precyzja_narracyjna",
            "#-format_exec-", "&-jeśli_odbiorca=board",
          ],
        },
        scoring: { confidence: 0.88, risk: 0.22, empathy: 0.18, focus: 0.95, energy: 0.6, curiosity: 0.24 },
        sda_routing: [
          { agent: "@ingestor", role: { en: "W0 parse", pl: "W0 parsowanie", fr: "W0 parsing", es: "W0 análisis" }, latency_ms: 9 },
          { agent: "@identity_filter", role: { en: "W1 FUKO validation", pl: "W1 walidacja FUKO", fr: "W1 validation FUKO", es: "W1 validación FUKO" }, latency_ms: 19 },
          { agent: "@writer", role: { en: "Drafting", pl: "Redakcja", fr: "Rédaction", es: "Redacción" }, latency_ms: 512 },
          { agent: "@guardrails", role: { en: "Speculation filter", pl: "Filtr spekulacji", fr: "Filtre de spéculation", es: "Filtro de especulación" }, latency_ms: 33 },
        ],
      },
    },
  ],
}));

export { ACCENTS };
