import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { store } from "@/lib/telegram-store.server";

export default defineTool({
  name: "list_telegram_messages",
  title: "List imported Telegram messages",
  description:
    "Return the most recent Telegram messages ingested by KK1 Core, including their FUKO tag tokens. Public data — anyone with access to this MCP server can read every imported message.",
  inputSchema: {
    limit: z
      .number()
      .int()
      .min(1)
      .max(200)
      .describe("How many of the most recent messages to return (1-200)."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: ({ limit }) => {
    const msgs = store.messages.slice(-limit).reverse();
    return {
      content: [
        {
          type: "text",
          text:
            msgs.length === 0
              ? "No Telegram messages ingested yet."
              : msgs
                  .map(
                    (m) =>
                      `[${m.received_at}] ${m.from ?? "?"}: ${m.text ?? ""} — ${m.tokens.length} tag(s)`,
                  )
                  .join("\n"),
        },
      ],
      structuredContent: { total: store.messages.length, returned: msgs.length, messages: msgs },
    };
  },
});
