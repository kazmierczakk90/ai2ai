/**
 * Server function: analyse an uploaded document and propose a FUKO agent flow.
 * Runs on Lovable AI Gateway (Gemini) with structured output.
 */
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

const ProposeInput = z.object({
  filename: z.string().max(200).default("document.txt"),
  content: z.string().min(1).max(200_000),
  instructions: z.string().max(2000).default(""),
  lang: z.enum(["en", "pl", "fr", "es"]).default("pl"),
});

const NodeSchema = z.object({
  key: z.string(),
  kind: z.enum(["start", "agent", "gate", "end"]),
  agent: z.string(),
  note: z.string().nullable(),
});

const EdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: z.enum(["SEQ", "PAR", "COND", "LOOP", "GATE"]),
  label: z.string(),
  skill: z.string().nullable(),
  condition: z.string().nullable(),
  priority: z.number().nullable(),
});

const FlowSchema = z.object({
  name: z.string(),
  trigger: z.string(),
  summary: z.string(),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
});

export type ProposedFlow = z.infer<typeof FlowSchema>;

export const proposeFlowFromDocument = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ProposeInput.parse(data))
  .handler(async ({ data }): Promise<ProposedFlow> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3.1-pro-preview");
    const languageName = LANG_NAMES[data.lang] ?? "Polish";

    const text = data.content.slice(0, 200_000);

    const system = `Jesteś "KK1 Core Process-Designer". Na podstawie dokumentu projektujesz graf procesu agentowego FUKO.

ZASADY:
- Węzły: dokładnie jeden "start" (agent: "START"), co najmniej jeden "end" (agent: "END"), pozostałe "agent" (handle z prefiksem @, np. @analyzer, @ceo, @guardian_core, @architect, @void_pruner, @voice_core, @orchestrator_prime) lub "gate" dla bramek decyzyjnych.
- "key" to krótki unikalny slug (np. "n_ingest"). Krawędzie odwołują się do kluczy węzłów.
- Typ krawędzi: SEQ (sekwencja), PAR (równolegle), COND (warunek), LOOP (iteracja), GATE (zatwierdzenie).
- KLUCZOWE: instrukcja/zadanie zapisana jest NA strzałce w polu "label" — konkretne, wykonalne zadanie realizowane pomiędzy dwoma punktami (max 60 znaków).
- "skill": nazwa umiejętności kebab-case (np. kb-query, risk-scan, task-delegation) lub null.
- "condition": tylko dla COND/LOOP/GATE, w innym razie null. "priority": 1-9 lub null.
- Graf ma być spójny: od START do END, 5-14 węzłów.
- "summary": 1-2 zdania, dlaczego taki przepływ. Teksty w języku: ${languageName}.`;

    const prompt = `Plik: ${data.filename}
${data.instructions ? `Dodatkowe wytyczne operatora: ${data.instructions}\n` : ""}
Treść dokumentu:
"""
${text}
"""`;

    try {
      const { output } = await generateText({ model, system, prompt, output: Output.object({ schema: FlowSchema }) });
      return output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("Model nie zwrócił poprawnej struktury grafu. Spróbuj ponownie lub skróć plik.");
      }
      const message = error instanceof Error ? error.message : "unknown";
      if (message.includes("429")) throw new Error("Limit zapytań AI przekroczony — spróbuj za chwilę.");
      if (message.includes("402")) throw new Error("Brak kredytów AI — doładuj w Settings → Plans & credits.");
      throw error;
    }
  });
