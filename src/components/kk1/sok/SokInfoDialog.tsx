import { X } from "lucide-react";
import type { ReactNode } from "react";

export type SokDialogPayload = { title: ReactNode; body: ReactNode } | null;

export function SokInfoDialog({
  payload,
  onClose,
}: {
  payload: SokDialogPayload;
  onClose: () => void;
}) {
  if (!payload) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-border bg-panel p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="font-mono text-lg font-bold text-foreground">
            {payload.title}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          {payload.body}
        </div>
        <div className="mt-6 border-t border-border pt-3 text-right">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            KK1 Meta-Cognition Protocol
          </span>
        </div>
      </div>
    </div>
  );
}
