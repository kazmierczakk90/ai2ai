import { useEffect } from "react";
import { pickLocalized, useKK1Store, type AgentLayer } from "@/store/kk1-store";
import { useI18n } from "@/i18n/i18n";
import { pzk } from "@/lib/pzk";
import { useEventBus } from "@/lib/event-bus";

/**
 * Global keyboard shortcut listener — AGI 10.0 spec.
 *
 * F1  Style shift (cycle accent)
 * F2  Voice command capture (delegated: dispatches DOM event 'kk1:voice-start')
 * F3  Toggle KPI overlay (route hint: navigate to /architecture)
 * F4  EMERGENCY STOP
 * F5  Reload runtime state (soft — pulses agents + emits snapshot marker)
 * F6  Voice mode toggle (TTS)
 * F7  Freeze evolution
 * F8  Toggle maintenance mode
 * F9  Clear event bus
 * F10 Snapshot event bus (download JSON)
 * F11 (browser default — do not intercept)
 * F12 (browser default — do not intercept)
 *
 * Ctrl+1..5    Focus a cognitive/system/execution/emotional/strategic layer
 * Alt+K        KPI recheck
 * Alt+P        Style profile → next (calm→focused→urgent→calm)
 * Ctrl+Shift+E Emergency stop
 * Ctrl+Shift+S Snapshot bus
 * Ctrl+Shift+R Resume from emergency
 */
const LAYER_ORDER: AgentLayer[] = ["cognitive", "system", "execution", "emotional", "strategic"];

export function ShortcutManager() {
  const cycleAccent = useKK1Store((s) => s.cycleAccent);
  const applyAccent = useKK1Store((s) => s.applyAccent);
  const triggerEmergency = useKK1Store((s) => s.triggerEmergency);
  const clearEmergency = useKK1Store((s) => s.clearEmergency);
  const toggleVoiceMode = useKK1Store((s) => s.toggleVoiceMode);
  const toggleFrozenEvolution = useKK1Store((s) => s.toggleFrozenEvolution);
  const toggleMaintenance = useKK1Store((s) => s.toggleMaintenance);
  const setFocusLayer = useKK1Store((s) => s.setFocusLayer);
  const setStyleProfile = useKK1Store((s) => s.setStyleProfile);
  const checkKpi = useKK1Store((s) => s.checkKpi);
  const pulseAgents = useKK1Store((s) => s.pulseAgents);
  const messages = useKK1Store((s) => s.messages);
  const { lang } = useI18n();

  useEffect(() => { applyAccent(); }, [applyAccent]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ctrl+Shift combos
      if (e.ctrlKey && e.shiftKey) {
        const k = e.key.toUpperCase();
        if (k === "E") {
          e.preventDefault(); triggerEmergency();
          pzkNote("Ctrl+Shift+E · EMERGENCY", "$-halt_all", "@sentinel", "error", lang);
          return;
        }
        if (k === "R") {
          e.preventDefault(); clearEmergency();
          pzkNote("Ctrl+Shift+R · RESUME", "$-emergency_release", "@sentinel", "success", lang);
          return;
        }
        if (k === "S") {
          e.preventDefault(); useEventBus.getState().snapshot();
          pzkNote("Ctrl+Shift+S · SNAPSHOT", "$-bus_snapshot", "@telemetry", "info", lang);
          return;
        }
      }
      // Alt combos
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        const k = e.key.toLowerCase();
        if (k === "k") {
          e.preventDefault(); checkKpi();
          pzkNote("Alt+K · KPI recheck", "$-kpi_scan", "@controlling", "info", lang);
          return;
        }
        if (k === "p") {
          e.preventDefault();
          const cur = useKK1Store.getState().styleProfile;
          const next = cur === "calm" ? "focused" : cur === "focused" ? "urgent" : "calm";
          setStyleProfile(next);
          pzkNote(`Alt+P · style → ${next}`, "$-style_profile_cycle", "@renderer", "info", lang);
          return;
        }
      }
      // Ctrl+1..5 focus layer
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        const idx = Number(e.key);
        if (idx >= 1 && idx <= 5) {
          e.preventDefault();
          const layer = LAYER_ORDER[idx - 1];
          setFocusLayer(layer);
          pzkNote(`Ctrl+${idx} · focus ${layer}`, `$-focus_${layer}`, "@router", "info", lang);
          return;
        }
      }
      // F-keys
      if (e.key === "F1") {
        e.preventDefault(); cycleAccent();
        pzkNote(`F1 · Style Shift → ${useKK1Store.getState().accentIndex}`, "$-ui_accent_cycle", "@renderer", "info", lang);
      } else if (e.key === "F2") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("kk1:voice-start"));
        pzkNote("F2 · Voice capture", "$-voice_capture", "@voice-core", "info", lang);
      } else if (e.key === "F3") {
        e.preventDefault();
        if (typeof window !== "undefined") window.location.hash = "#kpi";
        pzkNote("F3 · KPI panel", "$-kpi_view", "@controlling", "info", lang);
      } else if (e.key === "F4") {
        e.preventDefault(); triggerEmergency();
        void import("@/lib/api").then(({ fireEmergencyStop }) => fireEmergencyStop().catch(() => void 0));
        pzkNote("F4 · EMERGENCY STOP", "$-halt_all", "@sentinel", "error", lang);
      } else if (e.key === "F5" && e.shiftKey) {
        // let browser handle full reload; do nothing
      } else if (e.key === "F5") {
        e.preventDefault(); pulseAgents();
        pzkNote("F5 · Soft reload", "$-state_pulse", "@telemetry", "info", lang);
      } else if (e.key === "F6") {
        e.preventDefault(); toggleVoiceMode();
        const on = useKK1Store.getState().voiceMode;
        pzkNote(`F6 · Voice mode ${on ? "ON" : "OFF"}`, on ? "$-voice_core_up" : "$-voice_core_down", "@narrator", on ? "success" : "warn", lang);
        if (on) {
          const last = [...messages].reverse().find((m) => m.role === "system");
          if (last && typeof window !== "undefined" && "speechSynthesis" in window) {
            const u = new SpeechSynthesisUtterance(stripFuko(pickLocalized(last.dialogue, lang)));
            u.lang = ({ en: "en-US", pl: "pl-PL", fr: "fr-FR", es: "es-ES" } as const)[lang];
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(u);
          }
        } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
      } else if (e.key === "F7") {
        e.preventDefault(); toggleFrozenEvolution();
        const on = useKK1Store.getState().frozenEvolution;
        pzkNote(`F7 · Evolution ${on ? "FROZEN" : "RESUMED"}`, on ? "$-evolution_freeze" : "$-evolution_resume", "@guardian-core", on ? "warn" : "success", lang);
      } else if (e.key === "F8") {
        e.preventDefault(); toggleMaintenance();
        const on = useKK1Store.getState().maintenanceMode;
        pzkNote(`F8 · Maintenance ${on ? "ON" : "OFF"}`, "$-maintenance_toggle", "@system-admin", on ? "warn" : "info", lang);
      } else if (e.key === "F9") {
        e.preventDefault(); useEventBus.getState().clear();
        pzkNote("F9 · Bus cleared", "$-bus_clear", "@telemetry", "info", lang);
      } else if (e.key === "F10") {
        e.preventDefault(); useEventBus.getState().snapshot();
        pzkNote("F10 · Snapshot", "$-bus_snapshot", "@telemetry", "success", lang);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    cycleAccent, triggerEmergency, clearEmergency, toggleVoiceMode, toggleFrozenEvolution,
    toggleMaintenance, setFocusLayer, setStyleProfile, checkKpi, pulseAgents, messages, lang,
  ]);

  return null;
}

function pzkNote(
  intent: string,
  process: string,
  agent: string,
  severity: "info" | "success" | "warn" | "error",
  lang: "en" | "pl" | "fr" | "es",
) {
  pzk(
    {
      intent,
      process,
      task: "keyboard.shortcut.dispatch",
      verification: `key=${intent}`,
      reaction: "state_mutated",
      agent,
      severity,
    },
    lang,
  );
}

function stripFuko(text: string) {
  return text
    .replace(/@-\[([^\]]+)\]/g, "$1")
    .replace(/[@#$!/&]-?([\p{L}0-9_=<>!.]+)-?/gu, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export { stripFuko };
