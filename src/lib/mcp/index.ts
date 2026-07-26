import { auth, defineMcp } from "@lovable.dev/mcp-js";
import fukoTagTool from "./tools/fuko-tag";
import listTelegramMessagesTool from "./tools/list-telegram-messages";
import systemStatusTool from "./tools/system-status";

// The OAuth issuer MUST be the direct Supabase host. VITE_SUPABASE_PROJECT_ID is
// inlined at build time; the fallback keeps the issuer well-formed during the
// throwaway manifest-extract eval where the literal is unset.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "kk1-core-mcp",
  title: "KK1 Core MCP",
  version: "0.1.0",
  instructions:
    "Authenticated MCP server for the KK1 Core Strategic Engine. Sign in with your KK1 account to use `fuko_tag_text` (detect FUKO-LANG symbols in EN/PL/FR/ES text), `list_telegram_messages` (browse ingested Telegram messages with tag tokens), and `system_status` (Telegram webhook health).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [fukoTagTool, listTelegramMessagesTool, systemStatusTool],
});
