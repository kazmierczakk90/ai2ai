import { defineMcp } from "@lovable.dev/mcp-js";
import fukoTagTool from "./tools/fuko-tag";
import listTelegramMessagesTool from "./tools/list-telegram-messages";
import systemStatusTool from "./tools/system-status";

export default defineMcp({
  name: "kk1-core-mcp",
  title: "KK1 Core MCP",
  version: "0.1.0",
  instructions:
    "Public MCP server for the KK1 Core Strategic Engine. Use `fuko_tag_text` to detect FUKO-LANG symbols (@-agent, #-func, $-proces, !-wytyczne, /-umiejętność, &-warunek) in arbitrary text (EN/PL/FR/ES). Use `list_telegram_messages` to browse messages ingested from the connected Telegram bot with their tag tokens. Use `system_status` for ingestion health.",
  tools: [fukoTagTool, listTelegramMessagesTool, systemStatusTool],
});
