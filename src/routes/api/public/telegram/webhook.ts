import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const {
          deriveWebhookSecret,
          safeEqual,
          ingestUpdate,
          store,
        } = await import("@/lib/telegram-store.server");

        const apiKey = process.env.TELEGRAM_API_KEY;
        if (!apiKey) {
          return new Response("TELEGRAM_API_KEY not configured", { status: 500 });
        }
        const expected = deriveWebhookSecret(apiKey);
        const got = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        if (!safeEqual(got, expected)) {
          store.webhookErrors += 1;
          return new Response("Unauthorized", { status: 401 });
        }
        const update = await request.json().catch(() => null);
        const res = ingestUpdate(update);
        return Response.json(res);
      },
      GET: async () => Response.json({ ok: true, hint: "POST Telegram updates here" }),
    },
  },
});
