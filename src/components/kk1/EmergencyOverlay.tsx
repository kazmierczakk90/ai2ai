import { AlertOctagon } from "lucide-react";
import { useKK1Store } from "@/store/kk1-store";
import { useI18n } from "@/i18n/i18n";

const TXT = {
  title: {
    en: "SYSTEM HALT · EMERGENCY STOP",
    pl: "ZATRZYMANIE SYSTEMU · STOP AWARYJNY",
    fr: "ARRÊT SYSTÈME · STOP D'URGENCE",
    es: "PARADA DEL SISTEMA · PARO DE EMERGENCIA",
  },
  body: {
    en: "All SDA routing frozen. Ingestion sealed. Awaiting operator acknowledgment.",
    pl: "Routing SDA zamrożony. Ingestia zaplombowana. Oczekiwanie na potwierdzenie operatora.",
    fr: "Routage SDA gelé. Ingestion scellée. En attente de l'acquittement de l'opérateur.",
    es: "Enrutamiento SDA congelado. Ingesta sellada. Esperando confirmación del operador.",
  },
  release: {
    en: "RELEASE HALT",
    pl: "ZWOLNIJ BLOKADĘ",
    fr: "LEVER L'ARRÊT",
    es: "LIBERAR PARADA",
  },
  hint: {
    en: "F4 pressed · press again after release to re-arm.",
    pl: "Wciśnięto F4 · naciśnij ponownie po zwolnieniu, aby uzbroić.",
    fr: "F4 pressé · appuyez à nouveau après la levée pour réarmer.",
    es: "Se presionó F4 · presione de nuevo tras liberar para rearmar.",
  },
} as const;

export function EmergencyOverlay() {
  const active = useKK1Store((s) => s.emergencyStop);
  const clear = useKK1Store((s) => s.clearEmergency);
  const { lang } = useI18n();
  if (!active) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at center, oklch(0.35 0.18 25 / 0.92), oklch(0.14 0.08 25 / 0.98))",
      }}
    >
      {/* Scanning bands */}
      <div
        className="pointer-events-none absolute inset-0 animate-pulse"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent 0px, transparent 6px, oklch(0.6 0.2 25 / 0.12) 6px, oklch(0.6 0.2 25 / 0.12) 7px)",
        }}
      />
      {/* Vignette border */}
      <div
        className="pointer-events-none absolute inset-3 rounded-lg border-4"
        style={{
          borderColor: "oklch(0.75 0.22 25)",
          boxShadow:
            "0 0 40px oklch(0.75 0.22 25 / 0.7) inset, 0 0 60px oklch(0.75 0.22 25 / 0.5)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <AlertOctagon
          className="h-24 w-24 animate-pulse"
          style={{ color: "oklch(0.98 0.02 25)" }}
        />
        <div
          className="mt-4 font-mono text-[10px] uppercase tracking-[0.4em]"
          style={{ color: "oklch(0.98 0.05 25)" }}
        >
          KK1 · CORE
        </div>
        <h1
          className="mt-2 font-mono text-3xl font-bold uppercase tracking-widest md:text-5xl"
          style={{ color: "oklch(0.98 0.02 25)", textShadow: "0 0 24px oklch(0.75 0.22 25)" }}
        >
          {TXT.title[lang]}
        </h1>
        <p
          className="mt-4 max-w-xl font-mono text-sm"
          style={{ color: "oklch(0.92 0.05 25)" }}
        >
          {TXT.body[lang]}
        </p>

        <div className="mt-8 flex items-center gap-3">
          <button
            onClick={clear}
            className="rounded border-2 px-5 py-2 font-mono text-xs font-bold uppercase tracking-widest transition-transform hover:scale-[1.03]"
            style={{
              borderColor: "oklch(0.98 0.02 25)",
              color: "oklch(0.15 0.05 25)",
              background: "oklch(0.98 0.02 25)",
            }}
          >
            {TXT.release[lang]}
          </button>
        </div>

        <div
          className="mt-6 font-mono text-[10px] uppercase tracking-widest"
          style={{ color: "oklch(0.85 0.08 25)" }}
        >
          {TXT.hint[lang]}
        </div>
      </div>
    </div>
  );
}
