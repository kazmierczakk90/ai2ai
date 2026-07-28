/**
 * SDA Router — matches an operator input to the best rule in the matrix.
 *
 * Pipeline:
 *   1. EXACT   — input mentions an actor handle (e.g. "@ceo")
 *   2. KEYWORD — Jaccard-style scoring against rule keywords (threshold 0.30)
 *   3. FALLBACK — routes to @system-admin (FUKO-FLOW)
 */

import { emit } from "@/lib/event-bus";
import type { SdaRoutingDecision, SdaRule } from "./matrix";
import { generateMatrix, loadMatrix } from "./matrix";

const FALLBACK_AGENT = "@system-admin";
const KEYWORD_THRESHOLD = 0.3;

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}@#$!/&_-]+/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function exactMatch(input: string, rules: SdaRule[]): SdaRule | null {
  const lower = input.toLowerCase();
  for (const r of rules) {
    if (r.active && lower.includes(r.actor.toLowerCase())) return r;
  }
  return null;
}

function keywordScore(tokens: string[], rule: SdaRule): { score: number; matched: string[] } {
  if (rule.keywords.length === 0) return { score: 0, matched: [] };
  const kwSet = new Set(rule.keywords.map((k) => k.toLowerCase()));
  const matched = tokens.filter((t) => kwSet.has(t));
  // Jaccard-ish with a small priority bias.
  const union = new Set([...tokens, ...kwSet]).size;
  const raw = union === 0 ? 0 : matched.length / Math.min(kwSet.size, tokens.length || 1);
  const biased = Math.min(1, raw * (0.8 + rule.priority * 0.02));
  return { score: biased, matched };
}

export function routeSda(input: string): SdaRoutingDecision {
  const matrix = loadMatrix();
  const rules = matrix.rules.length ? matrix.rules : generateMatrix().rules;
  const tokens = tokenize(input);

  // 1) Exact
  const exact = exactMatch(input, rules);
  if (exact) {
    const decision: SdaRoutingDecision = {
      input,
      matched_rule: exact,
      target_agent: exact.actor,
      confidence: 0.95,
      routing_type: "sda_exact",
      reasoning: `Actor mention '${exact.actor}' detected in input.`,
      matched_keywords: [exact.actor.toLowerCase()],
      matrix_version: matrix.version,
    };
    emit("sda.decision", "sda.router", decision);
    return decision;
  }

  // 2) Keyword scoring
  let best: { rule: SdaRule; score: number; matched: string[] } | null = null;
  for (const r of rules) {
    if (!r.active) continue;
    const { score, matched } = keywordScore(tokens, r);
    if (!best || score > best.score) best = { rule: r, score, matched };
  }

  if (best && best.score >= KEYWORD_THRESHOLD) {
    const decision: SdaRoutingDecision = {
      input,
      matched_rule: best.rule,
      target_agent: best.rule.actor,
      confidence: Math.round(best.score * 100) / 100,
      routing_type: "sda_keyword",
      reasoning: `Keyword match against ${best.rule.domain}/${best.rule.actor} (${best.matched.length} tokens: ${best.matched.slice(0, 4).join(", ")}).`,
      matched_keywords: best.matched,
      matrix_version: matrix.version,
    };
    emit("sda.decision", "sda.router", decision);
    return decision;
  }

  // 3) Fallback
  const decision: SdaRoutingDecision = {
    input,
    matched_rule: null,
    target_agent: FALLBACK_AGENT,
    confidence: 0,
    routing_type: "fuko_fallback",
    reasoning: "No SDA rule matched — routing to FUKO-FLOW admin fallback.",
    matched_keywords: [],
    matrix_version: matrix.version,
  };
  emit("sda.decision", "sda.router", decision);
  return decision;
}

/** Server-safe variant (no event bus, no localStorage): used inside chat.functions. */
export function routeSdaServer(input: string): SdaRoutingDecision {
  const matrix = generateMatrix();
  const rules = matrix.rules;
  const tokens = tokenize(input);

  const exact = exactMatch(input, rules);
  if (exact) {
    return {
      input,
      matched_rule: exact,
      target_agent: exact.actor,
      confidence: 0.95,
      routing_type: "sda_exact",
      reasoning: `Actor mention '${exact.actor}' detected in input.`,
      matched_keywords: [exact.actor.toLowerCase()],
      matrix_version: matrix.version,
    };
  }

  let best: { rule: SdaRule; score: number; matched: string[] } | null = null;
  for (const r of rules) {
    const { score, matched } = keywordScore(tokens, r);
    if (!best || score > best.score) best = { rule: r, score, matched };
  }

  if (best && best.score >= KEYWORD_THRESHOLD) {
    return {
      input,
      matched_rule: best.rule,
      target_agent: best.rule.actor,
      confidence: Math.round(best.score * 100) / 100,
      routing_type: "sda_keyword",
      reasoning: `Keyword match against ${best.rule.domain}/${best.rule.actor} (${best.matched.length} tokens).`,
      matched_keywords: best.matched,
      matrix_version: matrix.version,
    };
  }

  return {
    input,
    matched_rule: null,
    target_agent: FALLBACK_AGENT,
    confidence: 0,
    routing_type: "fuko_fallback",
    reasoning: "No SDA rule matched — routing to FUKO-FLOW admin fallback.",
    matched_keywords: [],
    matrix_version: matrix.version,
  };
}
