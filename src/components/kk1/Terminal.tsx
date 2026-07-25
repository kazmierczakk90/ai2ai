import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Mic, MicOff, Terminal as TerminalIcon, Volume2 } from "lucide-react";
import { pickLocalized, useKK1Store, type Message } from "@/store/kk1-store";
import { useI18n } from "@/i18n/i18n";
import { FukoText } from "./FukoText";
import { DeepReasoning } from "./DeepReasoning";
import { stripFuko } from "./ShortcutManager";
import { pzk } from "@/lib/pzk";
import { sendMessageToCore } from "@/lib/api";

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

// Types for the Web Speech API (not in default TS lib for all envs).
interface SR extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
}

function getRecognitionCtor(): { new (): SR } | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

const LANG_TAG: Record<string, string> = {
  en: "en-US", pl: "pl-PL", fr: "fr-FR", es: "es-ES",
};

export function Terminal() {
  const messages = useKK1Store((s) => s.messages);
  const append = useKK1Store((s) => s.appendMessage);
  const voiceMode = useKK1Store((s) => s.voiceMode);
  const { t, lang } = useI18n();
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const recRef = useRef<SR | null>(null);
  const lastSpokenRef = useRef<string | null>(null);

  const stats = useMemo(() => {
    const sys = messages.filter((m) => m.role === "system").length;
    return { total: messages.length, sys };
  }, [messages]);

  // Speak new system dialogue when Voice Mode is ON.
  useEffect(() => {
    if (!voiceMode) return;
    const last = [...messages].reverse().find((m) => m.role === "system");
    if (!last || lastSpokenRef.current === last.id) return;
    lastSpokenRef.current = last.id;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(stripFuko(pickLocalized(last.dialogue, lang)));
    u.lang = LANG_TAG[lang] ?? "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }, [messages, voiceMode, lang]);

  const submit = async (text?: string) => {
    const txt = (text ?? draft).trim();
    if (!txt) return;
    setDraft("");
    const activeChannel = useKK1Store.getState().activeChannel;
    // Optimistically append the user message immediately; the API proxy also
    // returns it (with a server-assigned id) plus a system response.
    try {
      const res = await sendMessageToCore({ text: txt, lang, channel: activeChannel });
      append(res.user_message);
      append(res.system_message);
    } catch {
      append({
        id: `m-${Date.now()}`,
        role: "user",
        ts: new Date().toISOString(),
        dialogue: txt,
      });
    }
    requestAnimationFrame(() => {
      scroller.current?.scrollTo({
        top: scroller.current.scrollHeight,
        behavior: "smooth",
      });
    });
  };

  const toggleMic = () => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      pzk(
        {
          intent: "voice.input",
          process: "$-voice_capture",
          task: "instantiate SpeechRecognition",
          verification: "!-api_missing-",
          reaction: "fallback_text_only",
          agent: "@narrator",
          severity: "warn",
        },
        lang,
      );
      return;
    }
    if (listening && recRef.current) {
      recRef.current.stop();
      return;
    }
    const rec = new Ctor();
    rec.lang = LANG_TAG[lang] ?? "en-US";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      let finalTxt = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalTxt += r[0].transcript;
        else interim += r[0].transcript;
      }
      setDraft((prev) => (finalTxt ? (prev ? prev + " " : "") + finalTxt : prev + interim));
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
    pzk(
      {
        intent: "voice.input",
        process: "$-voice_capture",
        task: "capture microphone",
        verification: `lang = ${rec.lang}`,
        reaction: "stream_open",
        agent: "@narrator",
        severity: "info",
      },
      lang,
    );
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
        {voiceMode && (
          <span className="flex items-center gap-1 rounded border border-fuko-func/40 bg-fuko-func-bg px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-fuko-func">
            <Volume2 className="h-3 w-3" /> {t("voice.mode.on")}
          </span>
        )}
        <div className="ml-auto flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>{t("term.frames")} {stats.total.toString().padStart(3, "0")}</span>
          <span>{t("term.sys")} {stats.sys.toString().padStart(2, "0")}</span>
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
        <div
          className={`flex items-end gap-2 rounded border bg-background px-3 py-2 transition-colors ${
            listening ? "border-fuko-cond/60 shadow-[0_0_0_1px_var(--fuko-cond)]" : "border-border focus-within:border-primary/60"
          }`}
        >
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
            placeholder={listening ? t("voice.listening") : t("composer.placeholder")}
            className="min-h-[38px] flex-1 resize-none bg-transparent font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={toggleMic}
            aria-label={t("voice.mic")}
            className={`flex h-8 w-8 items-center justify-center rounded border transition-colors ${
              listening
                ? "border-fuko-cond/60 bg-fuko-cond-bg text-fuko-cond"
                : "border-border bg-panel-2 text-muted-foreground hover:text-foreground"
            }`}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          <button
            onClick={() => submit()}
            className="flex h-8 w-8 items-center justify-center rounded border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
            aria-label="Send"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-1.5 flex items-center gap-3 px-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>{t("composer.enter")}</span>
          <span>{t("composer.newline")}</span>
          <span className="hidden sm:inline">{t("shortcuts.hint")}</span>
          <span className="ml-auto">{t("composer.fuko")}</span>
        </div>
      </footer>
    </section>
  );
}
