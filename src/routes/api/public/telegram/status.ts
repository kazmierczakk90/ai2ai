import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/telegram/status")({
  server: {
    handlers: {
      GET: async () => {
        const { store } = await import("@/lib/telegram-store.server");
        const hasKey = Boolean(process.env.TELEGRAM_API_KEY);
        return Response.json({
          connector_linked: hasKey,
          webhook_active: hasKey && Boolean(store.webhookLastPing),
          last_ping: store.webhookLastPing,
          errors: store.webhookErrors,
          messages: store.messages.length,
        });
      },
    },
  },
});
