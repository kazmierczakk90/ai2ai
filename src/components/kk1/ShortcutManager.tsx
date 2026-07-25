import { useEffect } from "react";
import { pickLocalized, useKK1Store } from "@/store/kk1-store";
import { useI18n } from "@/i18n/i18n";
import { pzk } from "@/lib/pzk";

/**
 * Global keyboard shortcut listener.
 * F1 - Toggle Style Shift (cycles accent)
 * F4 - EMERGENCY STOP (full-screen red overlay)
 * F6 - Toggle Voice Mode
 */
export function ShortcutManager() {
  const cycleAccent = useKK1Store((s) => s.cycleAccent);
  const applyAccent = useKK1Store((s) => s.applyAccent);
  const triggerEmergency = useKK1Store((s) => s.triggerEmergency);
  const toggleVoiceMode = useKK1Store((s) => s.toggleVoiceMode);
  const messages = useKK1Store((s) => s.messages);
  const { lang } = useI18n();

  // Ensure any persisted accent is applied on mount.
  useEffect(() => {
    applyAccent();
  }, [applyAccent]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        cycleAccent();
        const accent = useKK1Store.getState().accentIndex;
        pzk(
          {
            intent: "F1 · Style Shift",
            process: "$-ui_accent_cycle",
            task: "rotate --primary token",
            verification: `accent index = ${accent}`,
            reaction: "theme_recomputed",
            agent: "@renderer",
            severity: "info",
          },
          lang,
        );
      } else if (e.key === "F4") {
        e.preventDefault();
        triggerEmergency();
        pzk(
          {
            intent: "F4 · EMERGENCY STOP",
            process: "$-halt_all",
            task: "block ingress, freeze SDA router",
            verification: "!-emergency_ack- pending",
            reaction: "screen_lock_engaged",
            agent: "@sentinel",
            severity: "error",
          },
          lang,
        );
      } else if (e.key === "F6") {
        e.preventDefault();
        toggleVoiceMode();
        const on = useKK1Store.getState().voiceMode;
        pzk(
          {
            intent: "F6 · Voice Mode",
            process: on ? "$-voice_core_up" : "$-voice_core_down",
            task: on ? "attach speech synthesizer" : "detach speech synthesizer",
            verification: `voice_mode = ${on ? "ON" : "OFF"}`,
            reaction: on ? "tts_ready" : "tts_muted",
            agent: "@narrator",
            severity: on ? "success" : "warn",
          },
          lang,
        );
        // Speak the latest dialogue when voice mode was just turned ON.
        if (on) {
          const last = [...messages].reverse().find((m) => m.role === "system");
          if (last && typeof window !== "undefined" && "speechSynthesis" in window) {
            const u = new SpeechSynthesisUtterance(
              stripFuko(pickLocalized(last.dialogue, lang)),
            );
            u.lang = ({ en: "en-US", pl: "pl-PL", fr: "fr-FR", es: "es-ES" } as const)[lang];
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(u);
          }
        } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycleAccent, triggerEmergency, toggleVoiceMode, messages, lang]);

  return null;
}

function stripFuko(text: string) {
  return text
    .replace(/@-\[([^\]]+)\]/g, "$1")
    .replace(/[@#$!/&]-?([\p{L}0-9_=<>!.]+)-?/gu, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export { stripFuko };
