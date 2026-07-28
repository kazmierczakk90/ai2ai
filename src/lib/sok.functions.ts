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

const SokInput = z.object({
  text: z.string().min(1).max(4000),
  lang: z.enum(["en", "pl", "fr", "es"]).default("pl"),
});

const SokSchema = z.object({
  priority: z.string(),
  assignedAgent: z.string(),
  category: z.string(),
  verdict: z.string(),
});

export type SokAnalysis = z.infer<typeof SokSchema> & {
  request_id: string;
  timestamp: number;
};

export const analyzeSokIntent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => SokInput.parse(data))
  .handler(async ({ data }): Promise<SokAnalysis> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3.1-pro-preview");
    const languageName = LANG_NAMES[data.lang] ?? "Polish";

    const system = `Jesteś centralnym orkiestratorem systemu AI "KK1 Core v2.0".
Twoim zadaniem jest analityczna dekonstrukcja intencji operatora według zasad FUKO-FLOW.
Bądź rygorystyczny, strategiczny, bez zbędnych słów. Odpowiadaj w języku: ${languageName}.

Zwróć JSON zgodny ze schematem:
1. "priority": Klasyfikuj priorytet — "P0: RDZEŃ" (Core krytyczny), "P1: WARUNEK" (Logika/Routing), "P2: NARZĘDZIE" (Wykonanie), "P3: KONTEKST" (Styl/Persona).
2. "assignedAgent": Węzeł z 47-agentowej architektury (np. @void_pruner, @gas, @orchestrator_prime, @guardian_core, @voice_core, @analyzer, @ceo, @architect). Zawsze z prefiksem @.
3. "category": Kategoria (np. Optymalizacja, Ingestion, Bezpieczeństwo, Strategia, Refactoring, Meta-Cognition).
4. "verdict": Maksymalnie 2 zdania bezkompromisowej oceny zgodnej z zasadą "No Phantom Value" — co tracimy, co zyskujemy, co wykonać natychmiast. Używaj symboli FUKO-LANG (@-agent, #-funkcja-, $-proces, !-wytyczne-) gdy adekwatne.`;

    try {
      const { output } = await generateText({
        model,
        system,
        prompt: `Intencja do analizy: "${data.text}"`,
        output: Output.object({ schema: SokSchema }),
      });
      return {
        ...output,
        request_id: `sok-${Date.now().toString(36)}`,
        timestamp: Math.floor(Date.now() / 1000),
      };
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        return {
          priority: "P3: KONTEKST",
          assignedAgent: "@orchestrator_prime",
          category: "Meta-Cognition",
          verdict: error.text ?? "Model nie zwrócił ustrukturyzowanej analizy.",
          request_id: `sok-${Date.now().toString(36)}`,
          timestamp: Math.floor(Date.now() / 1000),
        };
      }
      throw error;
    }
  });
