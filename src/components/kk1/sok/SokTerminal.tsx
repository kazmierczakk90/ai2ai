import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, Terminal } from "lucide-react";
import { analyzeSokIntent, type SokAnalysis } from "@/lib/sok.functions";
import { FukoText } from "@/components/kk1/FukoText";
import { emit } from "@/lib/event-bus";

function priorityColor(p: string): string {
  if (p.startsWith("P0")) return "text-fuko-guard";
  if (p.startsWith("P1")) return "text-fuko-proc";
  if (p.startsWith("P2")) return "text-fuko-agent";
  return "text-muted-foreground";
}

export function SokTerminal() {
  const [text, setText] = useState("");
  const analyze = useServerFn(analyzeSokIntent);

  const mutation = useMutation<SokAnalysis, Error, string>({
    mutationFn: async (intent: string) => {
      emit("api.request", "sok.analyze", { text: intent });
      const res = await analyze({ data: { text: intent, lang: "pl" } });
      emit("api.response", "sok.analyze", { request_id: res.request_id, priority: res.priority, agent: res.assignedAgent });
      return res;
    },
  });

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || mutation.isPending) return;
    mutation.mutate(trimmed);
  };

  return (
    <section className="rounded-xl border border-primary/30 bg-panel p-5">
      <div className="mb-3 flex items-center gap-2">
        <Terminal className="h-4 w-4 text-primary" />
        <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-foreground">
          Terminal FUKO-FLOW · AI Intent Analysis
        </h2>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Wprowadź dowolną myśl, problem lub zadanie. Gemini przetworzy szum na
        rygorystyczny format decyzyjny KK1, przypisze priorytet i wskaże agenta.
      </p>

      <div className="flex flex-col gap-3 md:flex-row">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          rows={3}
          placeholder="Np. 'Synchronizacja arkuszy z GitHubem tworzy duplikaty. Musimy odciąć stare skrypty.'"
          className="flex-1 resize-none rounded-lg border border-border bg-background/60 p-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex flex-col gap-2 md:w-44">
          <button
            onClick={submit}
            disabled={mutation.isPending || !text.trim()}
            className="flex items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/20 py-3 px-4 font-mono text-xs font-bold text-primary shadow-[0_0_15px_rgba(59,130,246,0.25)] transition hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Przetwarzaj
          </button>
          <button
            onClick={() => setText("")}
            className="rounded-lg border border-border py-2 px-4 font-mono text-xs text-muted-foreground transition hover:bg-panel-2 hover:text-foreground"
          >
            Wyczyść
          </button>
        </div>
      </div>

      {(mutation.isPending || mutation.data || mutation.error) && (
        <div className="mt-4 rounded-lg border border-primary/30 bg-background/60 p-4 shadow-inner">
          {mutation.isPending && (
            <div className="flex items-center gap-3 font-mono text-xs text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analiza kognitywna w toku (Gemini)…</span>
            </div>
          )}
          {mutation.error && (
            <div className="rounded border border-fuko-guard/40 bg-fuko-guard-bg p-3 font-mono text-xs text-fuko-guard">
              Błąd bramki AI: {mutation.error.message}
            </div>
          )}
          {mutation.data && (
            <div>
              <div className="mb-4 grid grid-cols-1 gap-4 border-b border-border pb-4 md:grid-cols-3">
                <div>
                  <span className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">
                    Priorytet
                  </span>
                  <span className={`font-mono text-lg font-bold ${priorityColor(mutation.data.priority)}`}>
                    {mutation.data.priority}
                  </span>
                </div>
                <div>
                  <span className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">
                    Przypisany Węzeł
                  </span>
                  <span className="inline-block rounded border border-border bg-panel-2 px-2 py-1 font-mono text-xs font-bold text-foreground">
                    {mutation.data.assignedAgent}
                  </span>
                </div>
                <div>
                  <span className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">
                    Kategoria
                  </span>
                  <span className="font-mono text-sm font-bold text-fuko-skill">
                    {mutation.data.category}
                  </span>
                </div>
              </div>
              <div>
                <span className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">
                  Werdykt Strategiczny · No Phantom Value
                </span>
                <FukoText
                  text={mutation.data.verdict}
                  className="block border-l-2 border-primary pl-3 text-sm italic text-foreground/90"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
