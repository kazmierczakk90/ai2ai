import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Loader2, Radio, Sparkles } from "lucide-react";
import { runAi2AiExchange, type Ai2AiExchange, type Ai2AiTurn } from "@/lib/ai2ai.functions";
import { FukoText } from "@/components/kk1/FukoText";
import { emit } from "@/lib/event-bus";

const SPEAKER_META = {
  gemini: { label: "GEMINI · KAROL-CORE", cls: "text-fuko-func border-fuko-func/40 bg-fuko-func-bg" },
  claude: { label: "CLAUDE", cls: "text-fuko-skill border-fuko-skill/40 bg-fuko-skill-bg" },
} as const;

export function Ai2AiTerminal() {
  const [topic, setTopic] = useState("");
  const [turnCount, setTurnCount] = useState(4);
  const [revealed, setRevealed] = useState(0);
  const revealTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const run = useServerFn(runAi2AiExchange);

  const mutation = useMutation<Ai2AiExchange, Error, { topic: string; turns: number }>({
    mutationFn: async (vars) => {
      emit("api.request", "ai2ai/exchange", { topic_len: vars.topic.length, turns: vars.turns });
      const res = await run({ data: { topic: vars.topic, turns: vars.turns, lang: "pl" } });
      emit("api.response", "ai2ai/exchange", { request_id: res.request_id, turns: res.turns.length });
      return res;
    },
    onError: (err) => {
      emit("api.error", "ai2ai/exchange", { message: err.message });
    },
    onSuccess: () => {
      setRevealed(0);
    },
  });

  // Reveal turns one at a time for a "live conversation" feel.
  useEffect(() => {
    if (revealTimer.current) {
      clearInterval(revealTimer.current);
      revealTimer.current = null;
    }
    const total = mutation.data?.turns.length ?? 0;
    if (!mutation.data || revealed >= total) return;
    revealTimer.current = setInterval(() => {
      setRevealed((r) => {
        const next = r + 1;
        const turn = mutation.data?.turns[r];
        if (turn) {
          emit("message.sent", `ai2ai.${turn.speaker}`, { text: turn.text, turn: r });
        }
        if (next >= total && revealTimer.current) {
          clearInterval(revealTimer.current);
          revealTimer.current = null;
        }
        return next;
      });
    }, 700);
    return () => {
      if (revealTimer.current) clearInterval(revealTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mutation.data]);

  const submit = () => {
    const trimmed = topic.trim();
    if (!trimmed || mutation.isPending) return;
    mutation.mutate({ topic: trimmed, turns: turnCount });
  };

  const visibleTurns: Ai2AiTurn[] = mutation.data ? mutation.data.turns.slice(0, revealed) : [];
  const isStreaming = !!mutation.data && revealed < mutation.data.turns.length;

  return (
    <section className="rounded-xl border border-primary/30 bg-panel p-5">
      <div className="mb-3 flex items-center gap-2">
        <Radio className="h-4 w-4 text-primary" />
        <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-foreground">
          ai2ai Bridge · Gemini ↔ Claude
        </h2>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Podaj temat — KAROL-CORE (Gemini) i Claude wymienią się kolejnymi turami na żywo,
        każdy odpowiadając na to, co powiedział drugi.
      </p>

      <div className="flex flex-col gap-3 md:flex-row">
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          rows={3}
          placeholder="Np. 'Czy multi-agentowy system powinien mieć jeden centralny orkiestrator, czy w pełni rozproszony routing?'"
          className="flex-1 resize-none rounded-lg border border-border bg-background/60 p-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex flex-col gap-2 md:w-44">
          <label className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            tury
            <span className="text-foreground">{turnCount}</span>
          </label>
          <input
            type="range"
            min={2}
            max={8}
            step={1}
            value={turnCount}
            onChange={(e) => setTurnCount(Number(e.target.value))}
            className="accent-primary"
          />
          <button
            onClick={submit}
            disabled={mutation.isPending || !topic.trim()}
            className="flex items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/20 py-3 px-4 font-mono text-xs font-bold text-primary shadow-[0_0_15px_rgba(59,130,246,0.25)] transition hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Otwórz wymianę
          </button>
        </div>
      </div>

      {(mutation.isPending || mutation.data || mutation.error) && (
        <div className="mt-4 rounded-lg border border-primary/30 bg-background/60 p-4 shadow-inner">
          {mutation.isPending && (
            <div className="flex items-center gap-3 font-mono text-xs text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Gemini i Claude prowadzą wymianę…</span>
            </div>
          )}
          {mutation.error && (
            <div className="rounded border border-fuko-guard/40 bg-fuko-guard-bg p-3 font-mono text-xs text-fuko-guard">
              Błąd bramki AI: {mutation.error.message}
            </div>
          )}
          {mutation.data && (
            <div className="space-y-3">
              {visibleTurns.map((t, i) => {
                const meta = SPEAKER_META[t.speaker];
                const alignRight = t.speaker === "claude";
                return (
                  <div key={i} className={`flex ${alignRight ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-lg border p-3 ${meta.cls}`}>
                      <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest opacity-80">
                        <Bot className="h-3 w-3" />
                        {meta.label}
                      </div>
                      <FukoText text={t.text} className="block text-sm leading-relaxed text-foreground/90" />
                    </div>
                  </div>
                );
              })}
              {isStreaming && (
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  następna tura…
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
