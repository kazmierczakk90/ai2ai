import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const LANG_NAMES: Record<string, string> = {
  en: "English",
  pl: "Polish",
  fr: "French",
  es: "Spanish",
};

const HistoryTurn = z.object({
  role: z.enum(["user", "system"]),
  text: z.string(),
});

const ChatInput = z.object({
  text: z.string().min(1),
  lang: z.enum(["en", "pl", "fr", "es"]),
  history: z.array(HistoryTurn).max(20).default([]),
});

const AnalysisSchema = z.object({
  dialogue: z.string(),
  w0_summary: z.string(),
  w1_identity: z.string(),
  fuko_decision: z.string(),
  scoring: z.object({
    confidence: z.number(),
    risk: z.number(),
    empathy: z.number(),
    focus: z.number(),
    energy: z.number(),
    curiosity: z.number(),
  }),
  sda_routing: z.array(z.string()),
});

export type ChatResponse = {
  dialogue: string;
  strategic_analysis: {
    w0_summary: string;
    w1_identity: string;
    fuko_decision: string;
    "6d_scoring": {
      confidence: number;
      risk: number;
      empathy: number;
      focus: number;
      energy: number;
      curiosity: number;
    };
    sda_routing: string[];
  };
  request_id: string;
  timestamp: number;
};

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ChatInput.parse(data))
  .handler(async ({ data }): Promise<ChatResponse> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3.1-pro-preview");

    const languageName = LANG_NAMES[data.lang] ?? "English";
    const system = `You are KK1 Core — an AGI Strategic Engine command-center assistant.
Speak like an operator: dense, technical, decisive. Reply in ${languageName}.

FUKO-LANG symbols — use them naturally inline when relevant:
  @-agent (e.g. @-ceo, @-analyzer)   #-function   $-process   !-guardrail   /-skill   &-condition

Output MUST be valid JSON matching the given schema:
- dialogue: the user-facing answer (can include FUKO symbols and markdown)
- w0_summary: 1-line ingestion summary of the user turn
- w1_identity: perceived operator intent / identity label
- fuko_decision: which agent/process you dispatch to
- scoring: 6D scoring (each 0..1) — confidence, risk, empathy, focus, energy, curiosity
- sda_routing: array of agent handles (e.g. ["@ceo","@fuko_flow_agent"]) touched by this response`;

    const messages = [
      ...data.history.map((h) => ({
        role: h.role === "system" ? ("assistant" as const) : ("user" as const),
        content: h.text,
      })),
      { role: "user" as const, content: data.text },
    ];

    let analysis: z.infer<typeof AnalysisSchema>;
    try {
      const { output } = await generateText({
        model,
        system,
        messages,
        output: Output.object({ schema: AnalysisSchema }),
      });
      analysis = output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        analysis = {
          dialogue: error.text ?? "…",
          w0_summary: "",
          w1_identity: "unknown",
          fuko_decision: "",
          scoring: { confidence: 0, risk: 0, empathy: 0, focus: 0, energy: 0, curiosity: 0 },
          sda_routing: [],
        };
      } else {
        throw error;
      }
    }

    return {
      dialogue: analysis.dialogue,
      strategic_analysis: {
        w0_summary: analysis.w0_summary,
        w1_identity: analysis.w1_identity,
        fuko_decision: analysis.fuko_decision,
        "6d_scoring": analysis.scoring,
        sda_routing: analysis.sda_routing,
      },
      request_id: `req-${Date.now().toString(36)}`,
      timestamp: Math.floor(Date.now() / 1000),
    };
  });
