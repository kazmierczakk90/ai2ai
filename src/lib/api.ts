/**
 * API proxy layer.
 *
 * Every backend call the frontend needs goes through this module. Today the
 * functions resolve mock data with a simulated ~500ms network delay so the UI
 * behaves like it does against a live server. Swap the bodies for `fetch()`
 * calls to the Python FastAPI backend without touching component code.
 *
 * Payload types are declared explicitly (not inferred from the mock store) so
 * the wire contract stays stable when the endpoints move to HTTP.
 */

import type { Agent, Message, StrategicAnalysis } from "@/store/kk1-store";
import { useKK1Store, pickLocalized } from "@/store/kk1-store";
import type { Lang } from "@/i18n/i18n";
import { emit } from "./event-bus";

// -------- wire contracts (mirror FastAPI schema) --------

export type SendMessagePayload = {
  text: string;
  lang: Lang;
  channel: string;
};

export type SendMessageResponse = {
  request_id: string;
  user_message: Message;
  system_message: Message;
  latency_ms: number;
};

export type AgentStatusesResponse = {
  fetched_at: string;
  count: number;
  agents: Agent[];
};

export type EconomicLedgerEntry = {
  id: string;
  task: string;
  agent: string;
  cost_credits: number;
  revenue_credits: number;
  roi: number; // (rev - cost) / cost
  ts: string;
};

export type EconomicLedgerResponse = {
  fetched_at: string;
  currency: "CREDIT";
  totals: { cost: number; revenue: number; roi: number };
  entries: EconomicLedgerEntry[];
};

// -------- helpers --------

const BASE_URL = "/api"; // point at FastAPI when ready, e.g. "https://api.kk1.io"
const NET_DELAY_MS = 500;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function proxy<T>(
  endpoint: string,
  method: "GET" | "POST",
  build: () => T,
  meta: Record<string, unknown> = {},
): Promise<T> {
  const request_id = `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  emit("api.request", `api${endpoint}`, { request_id, method, url: `${BASE_URL}${endpoint}`, ...meta });
  const t0 = performance.now();
  try {
    await wait(NET_DELAY_MS);
    const data = build();
    emit("api.response", `api${endpoint}`, {
      request_id,
      status: 200,
      latency_ms: Math.round(performance.now() - t0),
    });
    return data;
  } catch (err) {
    emit("api.error", `api${endpoint}`, {
      request_id,
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

// -------- endpoints --------

export async function sendMessageToCore(
  payload: SendMessagePayload,
): Promise<SendMessageResponse> {
  return proxy(
    "/core/message",
    "POST",
    () => {
      const now = new Date().toISOString();
      const user_message: Message = {
        id: `m-${Date.now()}`,
        role: "user",
        ts: now,
        dialogue: payload.text,
      };
      const mockAnalysis: StrategicAnalysis = {
        w0_ingestion: {
          en: `Ingested ${payload.text.length} chars. Symbols parsed. Intent classifier confident.`,
          pl: `Wchłonięto ${payload.text.length} znaków. Symbole sparsowane. Klasyfikator intencji pewny.`,
          fr: `Ingestion ${payload.text.length} car. Symboles analysés. Classifieur confiant.`,
          es: `Ingesta ${payload.text.length} car. Símbolos analizados. Clasificador seguro.`,
        },
        w1_identity: {
          identity: "Operator :: Tier-2 Strategist",
          fuko_decision: {
            en: "FUKO grammar valid. Routing through @dispatcher.",
            pl: "Gramatyka FUKO poprawna. Kierowanie przez @dispatcher.",
            fr: "Grammaire FUKO valide. Routage via @dispatcher.",
            es: "Gramática FUKO válida. Enrutando por @dispatcher.",
          },
          triggered_symbols: (payload.text.match(/[@#$!/&]-?[\p{L}_>=0-9.]+/gu) ?? []).slice(0, 8),
        },
        scoring: {
          confidence: 0.7 + Math.random() * 0.25,
          risk: Math.random() * 0.5,
          empathy: Math.random() * 0.4,
          focus: 0.75 + Math.random() * 0.2,
          energy: 0.5 + Math.random() * 0.4,
          curiosity: Math.random() * 0.6,
        },
        sda_routing: [
          { agent: "@ingestor", role: { en: "W0 parse", pl: "W0 parsowanie", fr: "W0 parsing", es: "W0 análisis" }, latency_ms: 8 + Math.floor(Math.random() * 12) },
          { agent: "@identity", role: { en: "W1 FUKO validation", pl: "W1 walidacja FUKO", fr: "W1 validation FUKO", es: "W1 validación FUKO" }, latency_ms: 18 + Math.floor(Math.random() * 20) },
          { agent: "@dispatcher", role: { en: "Route to layer", pl: "Kierowanie do warstwy", fr: "Route vers couche", es: "Ruta a capa" }, latency_ms: 30 + Math.floor(Math.random() * 40) },
        ],
      };
      const system_message: Message = {
        id: `m-${Date.now() + 1}`,
        role: "system",
        ts: new Date().toISOString(),
        dialogue: {
          en: `Acknowledged. @dispatcher routed request through $-core_reply. Guardrails clear.`,
          pl: `Potwierdzono. @dispatcher przekierował żądanie przez $-core_reply. Wytyczne czyste.`,
          fr: `Confirmé. @dispatcher a routé la requête via $-core_reply. Garde-fous OK.`,
          es: `Confirmado. @dispatcher enrutó la solicitud vía $-core_reply. Salvaguardas OK.`,
        },
        strategic_analysis: mockAnalysis,
      };
      return {
        request_id: `resp-${Date.now().toString(36)}`,
        user_message,
        system_message,
        latency_ms: NET_DELAY_MS,
      };
    },
    { text_len: payload.text.length, lang: payload.lang, channel: payload.channel },
  );
}

export async function fetchAgentStatuses(): Promise<AgentStatusesResponse> {
  return proxy("/agents/status", "GET", () => {
    const agents = useKK1Store.getState().agents;
    return {
      fetched_at: new Date().toISOString(),
      count: agents.length,
      agents,
    };
  });
}

export async function fetchEconomicLedger(): Promise<EconomicLedgerResponse> {
  return proxy("/economy/ledger", "GET", () => {
    const lang: Lang = "en";
    const rows: EconomicLedgerEntry[] = [
      { id: "t-101", task: "market_scan_q3",        agent: "@analyzer",  cost_credits: 120, revenue_credits: 340, ts: new Date().toISOString(), roi: 0 },
      { id: "t-102", task: "exec_brief_draft",      agent: "@writer",    cost_credits: 40,  revenue_credits: 180, ts: new Date().toISOString(), roi: 0 },
      { id: "t-103", task: "risk_sweep",            agent: "@risk",      cost_credits: 90,  revenue_credits: 260, ts: new Date().toISOString(), roi: 0 },
      { id: "t-104", task: "narrative_synthesis",   agent: "@narrative", cost_credits: 60,  revenue_credits: 145, ts: new Date().toISOString(), roi: 0 },
      { id: "t-105", task: "compliance_audit",      agent: "@compliance",cost_credits: 200, revenue_credits: 520, ts: new Date().toISOString(), roi: 0 },
    ].map((r) => ({ ...r, roi: (r.revenue_credits - r.cost_credits) / r.cost_credits }));
    const totals = rows.reduce(
      (acc, r) => ({ cost: acc.cost + r.cost_credits, revenue: acc.revenue + r.revenue_credits, roi: 0 }),
      { cost: 0, revenue: 0, roi: 0 },
    );
    totals.roi = (totals.revenue - totals.cost) / totals.cost;
    // reference `lang` so eslint stays quiet in future when we localize labels
    void lang;
    return {
      fetched_at: new Date().toISOString(),
      currency: "CREDIT",
      totals,
      entries: rows,
    };
  });
}

// convenience re-export for consumers that only want the pickLocalized util
export { pickLocalized };
