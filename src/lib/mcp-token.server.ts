import { ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import fukoTagTool from "@/lib/mcp/tools/fuko-tag";
import listTelegramMessagesTool from "@/lib/mcp/tools/list-telegram-messages";
import systemStatusTool from "@/lib/mcp/tools/system-status";

const PROTOCOL_VERSION = "2025-06-18";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, content-type, x-mcp-token, mcp-session-id, mcp-protocol-version",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TOOLS: any[] = [fukoTagTool, listTelegramMessagesTool, systemStatusTool];

function jsonSchemaFor(shape: Record<string, unknown> | undefined) {
  if (!shape || Object.keys(shape).length === 0) {
    return { type: "object", properties: {} };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return z.toJSONSchema(z.object(shape as any), { io: "input" }) as unknown;
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function readToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  return bearer || request.headers.get("x-mcp-token")?.trim() || "";
}

function rpcError(id: unknown, code: number, message: string, status = 200) {
  return Response.json(
    { jsonrpc: "2.0", id: id ?? null, error: { code, message } },
    { status, headers: CORS },
  );
}

/** A verified static token means "this caller is a trusted service account". */
function serviceContext(): ToolContext {
  return new ToolContext({
    type: "oauth",
    principal: {
      claims: { sub: "static-token", client_id: "static-token" },
      issuer: "kk1-core:static-token",
      resource: "/api/public/mcp-token",
      acceptedAudiences: [],
      scopes: [],
      sub: "static-token",
      clientId: "static-token",
    },
    bearer: { token: "" },
  });
}

export async function handleTokenMcpRequest(request: Request): Promise<Response> {
  const expected = process.env.MCP_STATIC_TOKEN?.trim();
  if (!expected) {
    return rpcError(null, -32000, "MCP_STATIC_TOKEN is not configured on the server", 500);
  }
  const provided = readToken(request);
  if (!provided || !timingSafeEqual(provided, expected)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...CORS, "content-type": "application/json", "WWW-Authenticate": "Bearer" },
    });
  }

  const body = (await request.json().catch(() => null)) as
    | { jsonrpc?: string; id?: unknown; method?: string; params?: Record<string, unknown> }
    | null;
  if (!body || typeof body.method !== "string") {
    return rpcError(body?.id ?? null, -32700, "Parse error");
  }

  const { id, method, params } = body;
  const ok = (result: unknown) =>
    Response.json({ jsonrpc: "2.0", id: id ?? null, result }, { headers: CORS });

  switch (method) {
    case "initialize":
      return ok({
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "kk1-core-mcp", title: "KK1 Core MCP", version: "0.1.0" },
        instructions:
          "Token-authenticated MCP endpoint for the KK1 Core Strategic Engine. Tools: fuko_tag_text, list_telegram_messages, system_status.",
      });

    case "notifications/initialized":
    case "notifications/cancelled":
      return new Response(null, { status: 202, headers: CORS });

    case "ping":
      return ok({});

    case "tools/list":
      return ok({
        tools: TOOLS.map((t) => ({
          name: t.name,
          title: t.title,
          description: t.description,
          annotations: t.annotations,
          inputSchema: jsonSchemaFor(t.inputSchema),
        })),
      });

    case "tools/call": {
      const name = (params?.["name"] as string) ?? "";
      const tool = TOOLS.find((t) => t.name === name);
      if (!tool) return rpcError(id, -32602, `Unknown tool: ${name}`);
      const rawArgs = (params?.["arguments"] as Record<string, unknown>) ?? {};
      let args: unknown = rawArgs;
      if (tool.inputSchema && Object.keys(tool.inputSchema).length > 0) {
        const parsed = z.object(tool.inputSchema).safeParse(rawArgs);
        if (!parsed.success) {
          return ok({
            content: [{ type: "text", text: `Invalid arguments: ${parsed.error.message}` }],
            isError: true,
          });
        }
        args = parsed.data;
      }
      try {
        const result = await tool.handler(args, serviceContext());
        return ok(result);
      } catch (err) {
        return ok({
          content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }],
          isError: true,
        });
      }
    }

    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}
