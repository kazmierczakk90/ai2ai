import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { LANGS, useI18n } from "@/i18n/i18n";

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onDoc = () => setOpen(false);
    if (open) document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [open]);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded border border-border bg-panel-2 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
        aria-label="Select language"
      >
        <Globe className="h-3 w-3 text-primary" />
        <span className="text-foreground">{lang}</span>
      </button>
      {open && (
        <ul className="absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded border border-border bg-popover shadow-lg">
          {LANGS.map((l) => {
            const active = l.code === lang;
            return (
              <li key={l.code}>
                <button
                  onClick={() => {
                    setLang(l.code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-2 py-1.5 font-mono text-xs ${
                    active
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-panel-2 hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="rounded border border-border px-1 py-0.5 text-[10px]">
                      {l.flag}
                    </span>
                    {l.label}
                  </span>
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--color-primary)]" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
