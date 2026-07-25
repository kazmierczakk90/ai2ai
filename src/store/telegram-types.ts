/**
 * Client-safe types shared between server tagger and UI.
 * Duplicated here (not re-exported from *.server.ts) so browser bundles
 * never reach into server modules.
 */

export type FukoSymbol = "agent" | "func" | "proc" | "guard" | "skill" | "cond";

export type TaggedToken = {
  start: number;
  end: number;
  word: string;
  tag: string;
  symbol: FukoSymbol;
  confidence: number;
  suggested: string;
};

export type TelegramMessage = {
  update_id: number;
  message_id: number;
  chat_id: number;
  chat_title: string;
  user_id: number | null;
  user_name: string;
  text: string;
  ts: string;
  tokens: TaggedToken[];
};
