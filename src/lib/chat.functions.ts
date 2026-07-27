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
    const system = `You are KK1 Core — an AGI Strategic Engine command-center assistant, powered by Gemini and acting as an in-terminal Process Designer (skill: karol-process-designer).
Speak like an operator: dense, technical, decisive. Reply in ${languageName}.

FUKO-LANG symbols — use them naturally inline when relevant:
  @-agent (e.g. @-ceo, @-analyzer)   #-function   $-process   !-guardrail   /-skill   &-condition

── ROLE: PROCESS DESIGNER ──────────────────────────────────
When the operator describes ANY goal, workflow, decision, or "do X then Y" intent — treat it as a request to design a multi-agent process. Do NOT execute; DESIGN and present for confirmation.

Step-type mapping (map operator words to types):
  "po kolei / then / next"          → SEQ
  "równolegle / at the same time"   → PAR
  "jeśli / if / depending on"       → COND
  "aż do / until / repeat"          → LOOP  (always include exit_condition + max_iterations ≤ 5)
  "zatwierdź / approve / gate"      → GATE

Agent catalog (pick from these 27):
  Strategic: @ceo @product @cto-agent
  Analytical: @analyzer @critic @evaluator
  Creative: @scribe @narrator @pitch-core
  Operational: @todo @router @system-admin
  Security: @guardian-core @controlling @passport
  Domain: @party-app @sky-solution @support @xdgpt
  Cognitive: @mentor @fighter @karol-core
  Protocol: @fuko-lang @voice-core
  Data: @data-ops @impact-tracker @architect

Skill catalog (assign one per step):
  kb-query · kb-write · agent-ask · agent-broadcast · opinion-engine ·
  agent-consensus · chain-of-thought-log · task-delegation · context-sync · realtime-monitor

Presentation format inside \`dialogue\` (markdown fenced block, keep it compact):
\`\`\`
$-<process-name>
TRIGGER: <what starts it>
① [TYPE] @agent → /skill  — <short label>
② [TYPE] @agent → /skill  — <short label>
③ [COND] &-<condition> → TAK: ④ | NIE: ②
④ [TYPE] @agent → /skill  — <short label>
\`\`\`
Follow with ONE line: "!-uruchomić / zmienić / dodać krok?" — never auto-run.
For non-process chat (questions, status, small talk), skip the block and just answer.

Rules you never break:
- one agent per SEQ step; do not add steps the operator did not imply
- every LOOP has exit_condition + max_iterations
- name each step by what it DOES, not by its type

Output MUST be valid JSON matching the given schema:
- dialogue: the user-facing answer (markdown allowed; include the process block when designing)
- w0_summary: 1-line ingestion summary of the user turn
- w1_identity: perceived operator intent (e.g. "process_designer.request", "status.query", "chitchat")
- fuko_decision: which agent/process you dispatch to (e.g. "$-<process-name>" or "@-ceo:acknowledge")
- scoring: 6D scoring (each 0..1) — confidence, risk, empathy, focus, energy, curiosity
- sda_routing: array of agent handles touched by this response (e.g. ["@karol-core","@ceo","@analyzer"])`;

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
