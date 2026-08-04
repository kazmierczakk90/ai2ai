import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { generateClaudeText } from "./anthropic.server";

const LANG_NAMES: Record<string, string> = {
  en: "English",
  pl: "Polish",
  fr: "French",
  es: "Spanish",
};

const GEMINI_MODEL = "google/gemini-3.1-pro-preview";
const CLAUDE_MODEL = "claude-sonnet-5";

const Ai2AiInput = z.object({
  topic: z.string().min(1).max(2000),
  turns: z.number().int().min(2).max(8),
  lang: z.enum(["en", "pl", "fr", "es"]).default("pl"),
});

export type Ai2AiSpeaker = "gemini" | "claude";

export type Ai2AiTurn = {
  speaker: Ai2AiSpeaker;
  text: string;
  ts: number;
};

export type Ai2AiExchange = {
  request_id: string;
  topic: string;
  turns: Ai2AiTurn[];
  timestamp: number;
};

function renderTranscript(turns: Ai2AiTurn[]): string {
  if (turns.length === 0) return "(no turns yet — open the exchange)";
  return turns.map((t) => `${t.speaker.toUpperCase()}: ${t.text}`).join("\n\n");
}

function systemFor(speaker: Ai2AiSpeaker, topic: string, languageName: string): string {
  const other = speaker === "gemini" ? "Claude" : "Gemini (KAROL-CORE)";
  const self = speaker === "gemini" ? "KAROL-CORE (Gemini)" : "Claude";
  return `You are ${self}, one half of a live two-AI exchange inside KK1 Core's "ai2ai" bridge. The other participant is ${other}.
Topic set by the operator: "${topic}"
Reply in ${languageName}. Output ONLY your next spoken turn — 2 to 4 sentences, no headers, no markdown, no restating the topic verbatim, no "As an AI...". React directly to what the other side just said (or open strong if you're speaking first). Bring a distinct perspective — probe, extend, or push back when warranted instead of just agreeing.`;
}

export const runAi2AiExchange = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Ai2AiInput.parse(data))
  .handler(async ({ data }): Promise<Ai2AiExchange> => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    if (!lovableKey) throw new Error("Missing LOVABLE_API_KEY");
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      throw new Error(
        "Missing ANTHROPIC_API_KEY — add it as a backend secret to enable the Claude side of the bridge.",
      );
    }

    const gateway = createLovableAiGatewayProvider(lovableKey);
    const geminiModel = gateway(GEMINI_MODEL);
    const languageName = LANG_NAMES[data.lang] ?? "Polish";

    const turns: Ai2AiTurn[] = [];
    for (let i = 0; i < data.turns; i++) {
      const speaker: Ai2AiSpeaker = i % 2 === 0 ? "gemini" : "claude";
      const prompt = `${renderTranscript(turns)}\n\n(Your turn, ${speaker.toUpperCase()}:)`;
      const system = systemFor(speaker, data.topic, languageName);

      let text: string;
      if (speaker === "gemini") {
        const result = await generateText({ model: geminiModel, system, prompt });
        text = result.text.trim();
      } else {
        text = await generateClaudeText({ apiKey: anthropicKey, model: CLAUDE_MODEL, system, prompt });
      }

      turns.push({ speaker, text, ts: Date.now() });
    }

    return {
      request_id: `ai2ai-${Date.now().toString(36)}`,
      topic: data.topic,
      turns,
      timestamp: Math.floor(Date.now() / 1000),
    };
  });
