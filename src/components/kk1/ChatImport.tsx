import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Radio, MessageSquare, Filter } from "lucide-react";
import { useTelegramStore } from "@/store/telegram-store";
import type { FukoSymbol } from "@/store/telegram-types";
import { TaggedText } from "./TaggedText";
import { useI18n } from "@/i18n/i18n";

const FILTERS: Array<{ key: FukoSymbol | "all"; label: string; cls: string }> = [
  { key: "all", label: "all", cls: "text-muted-foreground" },
  { key: "agent", label: "@ agent", cls: "text-fuko-agent" },
  { key: "func", label: "# func", cls: "text-fuko-func" },
  { key: "proc", label: "$ proc", cls: "text-fuko-proc" },
  { key: "guard", label: "! guard", cls: "text-fuko-guard" },
  { key: "skill", label: "/ skill", cls: "text-fuko-skill" },
  { key: "cond", label: "& cond", cls: "text-fuko-cond" },
];

export function ChatImport() {
  const { t } = useI18n();
  const {
    messages,
    selectedChatId,
    status,
    select,
    startPolling,
    stopPolling,
    retag,
  } = useTelegramStore();
  const [filter, setFilter] = useState<FukoSymbol | "all">("all");

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  const chats = useMemo(() => {
    const map = new Map<number, { id: number; title: string; count: number; last: string; lastTs: string }>();
    for (const m of messages) {
      const prev = map.get(m.chat_id);
      if (!prev) {
        map.set(m.chat_id, { id: m.chat_id, title: m.chat_title, count: 1, last: m.text, lastTs: m.ts });
      } else {
        prev.count += 1;
        prev.last = m.text;
        prev.lastTs = m.ts;
      }
    }
    return [...map.values()].sort((a, b) => b.lastTs.localeCompare(a.lastTs));
  }, [messages]);

  const active = messages.filter((m) => m.chat_id === selectedChatId);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-10 shrink-0 items-center gap-3 border-b border-border bg-panel px-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        <MessageSquare className="h-3.5 w-3.5 text-primary" />
        <span className="text-foreground">{t("import.title")}</span>
        <span className="opacity-60">·</span>
        <span className="flex items-center gap-1">
          <Radio
            className={`h-3 w-3 ${
              status?.webhook_active ? "text-fuko-func" : "text-fuko-guard"
            }`}
          />
          {status?.webhook_active ? t("import.webhook.on") : t("import.webhook.off")}
        </span>
        {status && (
          <span className="opacity-60">
            · {status.messages} msg · err {status.errors}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Filter className="h-3 w-3" />
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded border px-1.5 py-0.5 text-[10px] ${
                filter === f.key
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : `border-border ${f.cls} hover:bg-panel-2`
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* conversations */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-panel md:flex">
          <div className="px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {t("import.conversations")} · {chats.length}
          </div>
          <ul className="flex-1 overflow-y-auto">
            {chats.map((c) => {
              const active = selectedChatId === c.id;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => select(c.id)}
                    className={`flex w-full flex-col items-start gap-0.5 border-l-2 px-3 py-2 text-left font-mono text-xs ${
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-transparent text-muted-foreground hover:bg-panel-2 hover:text-foreground"
                    }`}
                  >
                    <span className="flex w-full items-center gap-2">
                      <span className="truncate">{c.title}</span>
                      <span className="ml-auto rounded bg-panel-2 px-1 text-[10px]">
                        {c.count}
                      </span>
                    </span>
                    <span className="truncate text-[10px] text-muted-foreground/80">
                      {c.last}
                    </span>
                  </button>
                </li>
              );
            })}
            {chats.length === 0 && (
              <li className="px-3 py-4 font-mono text-[11px] text-muted-foreground">
                {t("import.empty")}
              </li>
            )}
          </ul>
        </aside>

        {/* messages */}
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            {active.length === 0 ? (
              <div className="flex h-full items-center justify-center font-mono text-xs text-muted-foreground">
                {t("import.empty")}
              </div>
            ) : (
              <ul className="space-y-3">
                {active.map((m) => (
                  <li
                    key={m.update_id}
                    className="rounded border border-border bg-panel/60 p-3"
                  >
                    <div className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      <span className="text-fuko-agent">@{m.user_name}</span>
                      <span className="opacity-60">·</span>
                      <span>{new Date(m.ts).toLocaleTimeString()}</span>
                      <span className="opacity-60">·</span>
                      <span>upd {m.update_id}</span>
                      <button
                        onClick={() => retag(m.update_id)}
                        className="ml-auto flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[10px] normal-case tracking-normal hover:bg-panel-2 hover:text-foreground"
                        title={t("import.retag")}
                      >
                        <RefreshCw className="h-3 w-3" />
                        {t("import.retag")}
                      </button>
                    </div>
                    <div className="font-mono text-sm leading-relaxed text-foreground">
                      <TaggedText text={m.text} tokens={m.tokens} filter={filter} />
                    </div>
                    {m.tokens.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1 font-mono text-[10px] text-muted-foreground">
                        {m.tokens.map((tok, i) => (
                          <span
                            key={i}
                            className="rounded border border-border px-1.5 py-0.5"
                            title={`${tok.tag} · ${Math.round(tok.confidence * 100)}%`}
                          >
                            {tok.word}
                            <span className="opacity-50"> → </span>
                            <span className="text-foreground">{tok.suggested}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
