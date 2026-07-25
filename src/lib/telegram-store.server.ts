/**
 * In-memory Telegram store + FUKO tagger (server-side, per-worker).
 * Shared across TanStack server routes via a module-level singleton.
 */

import type {
  FukoSymbol,
  TaggedToken,
  TelegramMessage,
} from "@/store/telegram-types";

export type { FukoSymbol, TaggedToken, TelegramMessage };

// ---- storage ----

type Store = {
  messages: TelegramMessage[];
  byUpdateId: Set<number>;
  webhookLastPing: string | null;
  webhookErrors: number;
};

const g = globalThis as unknown as { __KK1_TG__?: Store };
if (!g.__KK1_TG__) {
  g.__KK1_TG__ = {
    messages: [],
    byUpdateId: new Set(),
    webhookLastPing: null,
    webhookErrors: 0,
  };
}
export const store: Store = g.__KK1_TG__;

// ---- FUKO tagger ----

type Rule = {
  words: string[];
  tag: string;
  symbol: FukoSymbol;
  prefix: string;
  confidence: number;
};

// Multi-lingual keyword → FUKO symbol map.
const RULES: Rule[] = [
  {
    words: [
      "analyzer", "analityk", "analyst", "strategist", "strateg",
      "ceo", "operator", "dispatcher", "risk", "narrative",
      "agent", "bot", "asystent", "assistant",
    ],
    tag: "Agent",
    symbol: "agent",
    prefix: "@-",
    confidence: 0.86,
  },
  {
    words: [
      "wykonaj", "execute", "run", "call", "invoke", "trigger",
      "generuj", "generate", "send", "wyślij", "envoyer", "enviar",
      "fetch", "pobierz", "search", "szukaj",
    ],
    tag: "Executable tool",
    symbol: "func",
    prefix: "#-",
    confidence: 0.78,
  },
  {
    words: [
      "proces", "process", "workflow", "pipeline", "flow", "flujo",
      "onboarding", "audit", "audyt", "review", "przegląd",
      "deploy", "wdrożenie",
    ],
    tag: "Workflow",
    symbol: "proc",
    prefix: "$-",
    confidence: 0.8,
  },
  {
    words: [
      "nigdy", "never", "jamais", "nunca", "zakaz", "forbidden",
      "musisz", "must", "critical", "krytyczne", "warning",
      "ostrzeżenie", "danger", "niebezpieczne",
    ],
    tag: "Guardrail",
    symbol: "guard",
    prefix: "!-",
    confidence: 0.9,
  },
  {
    words: [
      "umiejętność", "skill", "compétence", "habilidad",
      "reasoning", "planning", "coding", "translation", "tłumaczenie",
      "voice", "vision", "ocr",
    ],
    tag: "Skill",
    symbol: "skill",
    prefix: "/-",
    confidence: 0.75,
  },
  {
    words: [
      "jeśli", "if", "si", "when", "gdy", "unless", "chyba",
      "warunek", "condition", "condición", "condition",
      "otherwise", "inaczej",
    ],
    tag: "Condition",
    symbol: "cond",
    prefix: "&-",
    confidence: 0.72,
  },
];

const WORD_TO_RULE = (() => {
  const m = new Map<string, Rule>();
  for (const r of RULES) for (const w of r.words) m.set(w.toLowerCase(), r);
  return m;
})();

export function tagText(text: string): TaggedToken[] {
  const tokens: TaggedToken[] = [];
  // Unicode word regex.
  const re = /[\p{L}\p{N}_]+/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const w = m[0];
    const rule = WORD_TO_RULE.get(w.toLowerCase());
    if (!rule) continue;
    const slug = w
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    tokens.push({
      start: m.index,
      end: m.index + w.length,
      word: w,
      tag: rule.tag,
      symbol: rule.symbol,
      confidence: rule.confidence,
      suggested:
        rule.symbol === "func" || rule.symbol === "guard"
          ? `${rule.prefix}${slug}-`
          : rule.symbol === "agent"
            ? `@-${slug}`
            : `${rule.prefix}${slug}`,
    });
  }
  return tokens;
}

// ---- ingest ----

export type IngestResult =
  | { ok: true; stored: boolean; message?: TelegramMessage }
  | { ok: false; reason: string };

export function ingestUpdate(update: unknown): IngestResult {
  if (!update || typeof update !== "object") return { ok: false, reason: "empty" };
  const u = update as Record<string, unknown>;
  const msg = (u.message ?? u.edited_message) as Record<string, unknown> | undefined;
  if (typeof u.update_id !== "number" || !msg) return { ok: true, stored: false };
  if (store.byUpdateId.has(u.update_id)) return { ok: true, stored: false };

  const chat = (msg.chat ?? {}) as Record<string, unknown>;
  const from = (msg.from ?? {}) as Record<string, unknown>;
  const text = typeof msg.text === "string" ? msg.text : "";

  const stored: TelegramMessage = {
    update_id: u.update_id,
    message_id: Number(msg.message_id ?? 0),
    chat_id: Number(chat.id ?? 0),
    chat_title:
      (chat.title as string) ||
      ((chat.first_name as string) ?? "") +
        ((chat.last_name ? ` ${chat.last_name as string}` : "") as string) ||
      String(chat.id ?? "chat"),
    user_id: from.id ? Number(from.id) : null,
    user_name:
      ((from.username as string) ||
        (from.first_name as string) ||
        "user") as string,
    text,
    ts: new Date().toISOString(),
    tokens: text ? tagText(text) : [],
  };

  store.byUpdateId.add(u.update_id);
  store.messages.push(stored);
  if (store.messages.length > 500) store.messages.splice(0, store.messages.length - 500);
  store.webhookLastPing = stored.ts;
  return { ok: true, stored: true, message: stored };
}

// ---- webhook secret ----

import { createHash, timingSafeEqual } from "crypto";

export function deriveWebhookSecret(apiKey: string): string {
  return createHash("sha256")
    .update(`telegram-webhook:${apiKey}`)
    .digest("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
}

// ---- demo seed (used when no real Telegram traffic yet) ----

export function seedDemoIfEmpty() {
  if (store.messages.length > 0) return;
  const demos: Array<[string, string]> = [
    ["ops.leader", "Wyślij raport do analityka, jeśli warunek spełniony — musisz to zrobić przed 18:00."],
    ["client.a", "Please run the onboarding workflow and generate a summary."],
    ["ops.leader", "Nigdy nie deployuj bez audytu — to critical guardrail."],
    ["client.b", "Skill: translation needed for the French dispatcher agent."],
  ];
  demos.forEach(([user, text], i) => {
    ingestUpdate({
      update_id: 900000 + i,
      message: {
        message_id: 1000 + i,
        chat: { id: 42, title: "Operations HQ" },
        from: { id: 100 + i, username: user },
        text,
      },
    });
  });
}
