import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/telegram/tag")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { store, tagText } = await import(
          "@/lib/telegram-store.server"
        );
        const body = (await request.json().catch(() => ({}))) as {
          update_id?: number;
          text?: string;
        };
        if (typeof body.text === "string") {
          return Response.json({ tokens: tagText(body.text) });
        }
        if (typeof body.update_id === "number") {
          const msg = store.messages.find((m) => m.update_id === body.update_id);
          if (!msg) return new Response("Not found", { status: 404 });
          msg.tokens = tagText(msg.text);
          return Response.json({ update_id: msg.update_id, tokens: msg.tokens });
        }
        return new Response("Bad request", { status: 400 });
      },
    },
  },
});
