import { createFileRoute } from "@tanstack/react-router";

/**
 * Token-authenticated MCP endpoint (Streamable HTTP, JSON responses).
 *
 * For MCP clients that cannot do OAuth 2.1 / DCR (e.g. the Hermes agent).
 * Auth: `Authorization: Bearer <MCP_STATIC_TOKEN>` or `X-MCP-Token: <token>`.
 * The OAuth-protected `/mcp` endpoint stays the default for capable clients.
 */
export const Route = createFileRoute("/api/public/mcp-token")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "authorization, content-type, x-mcp-token, mcp-session-id, mcp-protocol-version",
          },
        }),
      GET: async () =>
        Response.json(
          { ok: true, transport: "streamable-http", auth: "static bearer token", hint: "POST JSON-RPC here" },
          { headers: { "Access-Control-Allow-Origin": "*" } },
        ),
      POST: async ({ request }) => {
        const { handleTokenMcpRequest } = await import("@/lib/mcp-token.server");
        return handleTokenMcpRequest(request);
      },
    },
  },
});
