import { useMemo, useRef, useState } from "react";
import { ArrowUp, Terminal as TerminalIcon } from "lucide-react";
import { pickLocalized, useKK1Store, type Message } from "@/store/kk1-store";
import { useI18n } from "@/i18n/i18n";
import { FukoText } from "./FukoText";
import { DeepReasoning } from "./DeepReasoning";

function ts(iso: string) {
  const d = new Date(iso);
  return d.toISOString().slice(11, 19);
}

function MessageRow({ m }: { m: Message }) {
  const expanded = useKK1Store((s) => !!s.expanded[m.id]);
  const toggle = useKK1Store((s) => s.toggleExpanded);
  const { t, lang } = useI18n();
  const isUser = m.role === "user";
  return (
    <div className="border-b border-border/60 px-4 py-3 hover:bg-panel/30">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="tabular-nums">{ts(m.ts)}</span>
        <span className="opacity-40">│</span>
        <span className={isUser ? "text-fuko-cond" : "text-primary"}>
          {isUser ? t("term.role.operator") : t("term.role.system")}
        </span>
        <span className="opacity-40">│</span>
        <span>{isUser ? t("term.tag.ingress") : t("term.tag.dialogue")}</span>
        <span className="ml-auto opacity-40">msg::{m.id}</span>
      </div>
      <div className="mt-1.5 text-sm leading-relaxed text-foreground">
        <FukoText text={pickLocalized(m.dialogue, lang)} />
      </div>
      {m.strategic_analysis && (
        <DeepReasoning
          analysis={m.strategic_analysis}
          open={expanded}
          onToggle={() => toggle(m.id)}
        />
      )}
    </div>
  );
}

export function Terminal() {
  const messages = useKK1Store((s) => s.messages);
  const append = useKK1Store((s) => s.appendMessage);
  const { t } = useI18n();
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    const sys = messages.filter((m) => m.role === "system").length;
    return { total: messages.length, sys };
  }, [messages]);

  const submit = () => {
    const txt = draft.trim();
    if (!txt) return;
    append({
      id: `m-${Date.now()}`,
      role: "user",
      ts: new Date().toISOString(),
      dialogue: txt,
    });
    setDraft("");
    requestAnimationFrame(() => {
      scroller.current?.scrollTo({
        top: scroller.current.scrollHeight,
        behavior: "smooth",
      });
    });
  };

  return (
    <section className="flex h-full min-h-0 flex-col border-x border-border bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-panel px-4 py-2">
        <TerminalIcon className="h-4 w-4 text-primary" />
        <span className="font-mono text-xs uppercase tracking-widest text-foreground">
          {t("term.title")}
        </span>
        <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {t("term.channel")}: core.command
        </span>
        <div className="ml-auto flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>
            {t("term.frames")} {stats.total.toString().padStart(3, "0")}
          </span>
          <span>
            {t("term.sys")} {stats.sys.toString().padStart(2, "0")}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fuko-func" />
            {t("term.uplink")}
          </span>
        </div>
      </header>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
        {messages.map((m) => (
          <MessageRow key={m.id} m={m} />
        ))}
      </div>

      <footer className="border-t border-border bg-panel px-3 py-2">
        <div className="flex items-end gap-2 rounded border border-border bg-background px-3 py-2 focus-within:border-primary/60">
          <span className="pt-1 font-mono text-xs text-primary">›</span>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder={t("composer.placeholder")}
            className="min-h-[38px] flex-1 resize-none bg-transparent font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          <button
            onClick={submit}
            className="flex h-8 w-8 items-center justify-center rounded border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
            aria-label="Send"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-1.5 flex items-center gap-3 px-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>{t("composer.enter")}</span>
          <span>{t("composer.newline")}</span>
          <span className="ml-auto">{t("composer.fuko")}</span>
        </div>
      </footer>
    </section>
  );
}
