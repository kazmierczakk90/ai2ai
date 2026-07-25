import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/telegram/messages")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { store, seedDemoIfEmpty } = await import(
          "@/lib/telegram-store.server"
        );
        seedDemoIfEmpty();
        const url = new URL(request.url);
        const since = Number(url.searchParams.get("since") ?? 0);
        const messages = store.messages.filter((m) => m.update_id > since);
        return Response.json({
          fetched_at: new Date().toISOString(),
          count: messages.length,
          total: store.messages.length,
          messages,
        });
      },
    },
  },
});
