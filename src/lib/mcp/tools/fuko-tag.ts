import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { tagText } from "@/lib/telegram-store.server";

export default defineTool({
  name: "fuko_tag_text",
  title: "Tag text with FUKO-LANG symbols",
  description:
    "Run the KK1 Core FUKO-LANG tagger over an arbitrary text and return the detected tokens (agent, executable tool, workflow, guardrail, skill, condition) with their character offsets, suggested FUKO form, and confidence.",
  inputSchema: {
    text: z.string().min(1).describe("Raw text (any of EN/PL/FR/ES) to analyze."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ text }) => {
    const tokens = tagText(text);
    return {
      content: [
        {
          type: "text",
          text:
            tokens.length === 0
              ? "No FUKO symbols detected."
              : tokens
                  .map(
                    (t) =>
                      `${t.suggested}  (${t.tag}, conf=${t.confidence.toFixed(2)}, ${t.start}-${t.end})`,
                  )
                  .join("\n"),
        },
      ],
      structuredContent: { tokens, count: tokens.length },
    };
  },
});
