import { create } from "zustand";
import type { Lang } from "@/i18n/i18n";

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
          {
            agent: "@ingestor",
            role: {
              en: "W0 parse + tokenize",
              pl: "W0 parsowanie + tokenizacja",
              fr: "W0 parsing + tokenisation",
              es: "W0 análisis + tokenización",
            },
            latency_ms: 12,
          },
          {
            agent: "@identity_filter",
            role: {
              en: "W1 FUKO validation",
              pl: "W1 walidacja FUKO",
              fr: "W1 validation FUKO",
              es: "W1 validación FUKO",
            },
            latency_ms: 24,
          },
          {
            agent: "@ceo",
            role: {
              en: "Strategic framing",
              pl: "Ramowanie strategiczne",
              fr: "Cadrage stratégique",
              es: "Encuadre estratégico",
            },
            latency_ms: 180,
          },
          {
            agent: "@analyzer",
            role: {
              en: "Market scan orchestration",
              pl: "Orkiestracja skanu rynku",
              fr: "Orchestration scan de marché",
              es: "Orquestación de escaneo de mercado",
            },
            latency_ms: 341,
          },
          {
            agent: "@guardrails",
            role: {
              en: "PII/compliance sweep",
              pl: "Skan PII/zgodności",
              fr: "Balayage PII/conformité",
              es: "Barrido PII/cumplimiento",
            },
            latency_ms: 47,
          },
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
          {
            agent: "@ingestor",
            role: {
              en: "W0 parse",
              pl: "W0 parsowanie",
              fr: "W0 parsing",
              es: "W0 análisis",
            },
            latency_ms: 9,
          },
          {
            agent: "@identity_filter",
            role: {
              en: "W1 FUKO validation",
              pl: "W1 walidacja FUKO",
              fr: "W1 validation FUKO",
              es: "W1 validación FUKO",
            },
            latency_ms: 19,
          },
          {
            agent: "@writer",
            role: {
              en: "Drafting",
              pl: "Redakcja",
              fr: "Rédaction",
              es: "Redacción",
            },
            latency_ms: 512,
          },
          {
            agent: "@guardrails",
            role: {
              en: "Speculation filter",
              pl: "Filtr spekulacji",
              fr: "Filtre de spéculation",
              es: "Filtro de especulación",
            },
            latency_ms: 33,
          },
        ],
      },
    },
  ],
}));
