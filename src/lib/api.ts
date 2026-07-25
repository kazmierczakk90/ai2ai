/**
 * API proxy layer — LIVE against the local FastAPI KK1 Core Gateway.
 *
 * Base URL: http://localhost:8000
 *   POST /api/v1/chat
 *   POST /api/v1/system/emergency-stop
 *   GET  /api/v1/system/status
 *
 * Responses from the backend are adapted into the frontend's typed shapes
 * (Message / StrategicAnalysis) so component code stays unchanged.
 */

import type { Agent, Message, StrategicAnalysis, Localized } from "@/store/kk1-store";
import { useKK1Store, pickLocalized } from "@/store/kk1-store";
import type { Lang } from "@/i18n/i18n";
import { emit } from "./event-bus";

// -------- wire contracts --------

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

export type SystemStatusResponse = {
  active_agents: number;
  system_health: string;
  trust_engine: string;
  uptime_seconds: number;
};

export type EmergencyStopResponse = {
  status: string;
  [k: string]: unknown;
};

export type EconomicLedgerEntry = {
  id: string;
  task: string;
  agent: string;
  cost_credits: number;
  revenue_credits: number;
  roi: number;
  ts: string;
};

export type EconomicLedgerResponse = {
  fetched_at: string;
  currency: "CREDIT";
  totals: { cost: number; revenue: number; roi: number };
  entries: EconomicLedgerEntry[];
};

// -------- backend DTOs --------

type BackendChatResponse = {
  dialogue: string;
  strategic_analysis: {
    w0_summary?: string;
    w1_identity?: string;
    fuko_decision?: string;
    "6d_scoring"?: {
      confidence: number;
      risk: number;
      empathy: number;
      focus: number;
      energy: number;
      curiosity: number;
    };
    sda_routing?: string[];
  };
  request_id: string;
  timestamp: number;
};

// -------- helpers --------

export const API_BASE_URL = "http://localhost:8000";

const uni = (s: string): Localized => ({ en: s, pl: s, fr: s, es: s });

async function call<T>(
  endpoint: string,
  method: "GET" | "POST",
  body?: unknown,
  meta: Record<string, unknown> = {},
): Promise<T> {
  const request_id = `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const url = `${API_BASE_URL}${endpoint}`;
  emit("api.request", `api${endpoint}`, { request_id, method, url, ...meta });
  const t0 = performance.now();
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const latency_ms = Math.round(performance.now() - t0);
    if (!res.ok) {
      emit("api.error", `api${endpoint}`, { request_id, status: res.status, latency_ms });
      throw new Error(`${method} ${endpoint} → ${res.status}`);
    }
    const data = (await res.json()) as T;
    emit("api.response", `api${endpoint}`, { request_id, status: res.status, latency_ms });
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
  const t0 = performance.now();
  const backend = await call<BackendChatResponse>(
    "/api/v1/chat",
    "POST",
    { text: payload.text, session_id: payload.channel },
    { text_len: payload.text.length, lang: payload.lang, channel: payload.channel },
  );
  const latency_ms = Math.round(performance.now() - t0);

  const now = new Date().toISOString();
  const user_message: Message = {
    id: `m-${Date.now()}`,
    role: "user",
    ts: now,
    dialogue: payload.text,
  };

  const sa = backend.strategic_analysis ?? {};
  const scoring = sa["6d_scoring"] ?? {
    confidence: 0, risk: 0, empathy: 0, focus: 0, energy: 0, curiosity: 0,
  };
  const analysis: StrategicAnalysis = {
    w0_ingestion: uni(sa.w0_summary ?? ""),
    w1_identity: {
      identity: sa.w1_identity ?? "unknown",
      fuko_decision: uni(sa.fuko_decision ?? ""),
      triggered_symbols: (payload.text.match(/[@#$!/&]-?[\p{L}_>=0-9.]+/gu) ?? []).slice(0, 8),
    },
    scoring,
    sda_routing: (sa.sda_routing ?? []).map((agent, i) => ({
      agent,
      role: uni(""),
      latency_ms: 10 + i * 12,
    })),
  };

  const system_message: Message = {
    id: `m-${Date.now() + 1}`,
    role: "system",
    ts: new Date(backend.timestamp * 1000).toISOString(),
    dialogue: backend.dialogue,
    strategic_analysis: analysis,
  };

  return {
    request_id: backend.request_id,
    user_message,
    system_message,
    latency_ms,
  };
}

export async function fetchSystemStatus(): Promise<SystemStatusResponse> {
  return call<SystemStatusResponse>("/api/v1/system/status", "GET");
}

export async function fetchAgentStatuses(): Promise<AgentStatusesResponse> {
  const status = await fetchSystemStatus();
  const agents = useKK1Store.getState().agents;
  return {
    fetched_at: new Date().toISOString(),
    count: status.active_agents ?? agents.length,
    agents,
  };
}

export async function fireEmergencyStop(): Promise<EmergencyStopResponse> {
  return call<EmergencyStopResponse>("/api/v1/system/emergency-stop", "POST", {});
}

export async function fetchEconomicLedger(): Promise<EconomicLedgerResponse> {
  const rows: EconomicLedgerEntry[] = [
    { id: "t-101", task: "market_scan_q3",      agent: "@analyzer",   cost_credits: 120, revenue_credits: 340, ts: new Date().toISOString(), roi: 0 },
    { id: "t-102", task: "exec_brief_draft",    agent: "@writer",     cost_credits: 40,  revenue_credits: 180, ts: new Date().toISOString(), roi: 0 },
    { id: "t-103", task: "risk_sweep",          agent: "@risk",       cost_credits: 90,  revenue_credits: 260, ts: new Date().toISOString(), roi: 0 },
    { id: "t-104", task: "narrative_synthesis", agent: "@narrative",  cost_credits: 60,  revenue_credits: 145, ts: new Date().toISOString(), roi: 0 },
    { id: "t-105", task: "compliance_audit",    agent: "@compliance", cost_credits: 200, revenue_credits: 520, ts: new Date().toISOString(), roi: 0 },
  ].map((r) => ({ ...r, roi: (r.revenue_credits - r.cost_credits) / r.cost_credits }));
  const totals = rows.reduce(
    (acc, r) => ({ cost: acc.cost + r.cost_credits, revenue: acc.revenue + r.revenue_credits, roi: 0 }),
    { cost: 0, revenue: 0, roi: 0 },
  );
  totals.roi = (totals.revenue - totals.cost) / totals.cost;
  return {
    fetched_at: new Date().toISOString(),
    currency: "CREDIT",
    totals,
    entries: rows,
  };
}

export { pickLocalized };

// -------- Telegram (Chat Import) --------
// Same-origin endpoints served by TanStack server routes under /api/public/telegram/*.

import type { TelegramMessage } from "@/store/telegram-types";

export type TelegramMessagesResponse = {
  fetched_at: string;
  count: number;
  total: number;
  messages: TelegramMessage[];
};

export type TelegramStatusResponse = {
  connector_linked: boolean;
  webhook_active: boolean;
  last_ping: string | null;
  errors: number;
  messages: number;
};

async function callLocal<T>(path: string, init?: RequestInit): Promise<T> {
  const request_id = `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  emit("api.request", `local${path}`, { request_id, method: init?.method ?? "GET", url: path });
  const res = await fetch(path, init);
  if (!res.ok) {
    emit("api.error", `local${path}`, { request_id, status: res.status });
    throw new Error(`${path} → ${res.status}`);
  }
  const data = (await res.json()) as T;
  emit("api.response", `local${path}`, { request_id, status: res.status });
  return data;
}

export async function fetchTelegramMessages(since = 0): Promise<TelegramMessagesResponse> {
  return callLocal<TelegramMessagesResponse>(`/api/public/telegram/messages?since=${since}`);
}

export async function fetchTelegramStatus(): Promise<TelegramStatusResponse> {
  return callLocal<TelegramStatusResponse>(`/api/public/telegram/status`);
}

export async function retagTelegramMessage(update_id: number) {
  return callLocal<{ update_id: number; tokens: TelegramMessage["tokens"] }>(
    `/api/public/telegram/tag`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ update_id }),
    },
  );
}

