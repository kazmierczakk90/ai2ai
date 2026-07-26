import { defineTool } from "@lovable.dev/mcp-js";
import { store } from "@/lib/telegram-store.server";

export default defineTool({
  name: "system_status",
  title: "KK1 Core system status",
  description:
    "Report the KK1 Core Telegram ingestion health: webhook activity, error counter, and number of stored messages.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const status = {
      webhook_last_ping: store.webhookLastPing,
      webhook_errors: store.webhookErrors,
      messages_stored: store.messages.length,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(status, null, 2) }],
      structuredContent: status,
    };
  },
});
