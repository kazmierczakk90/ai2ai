import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Pause, Play, Trash2, Radio } from "lucide-react";
import { useEventBus, type BusEventType } from "@/lib/event-bus";

const TYPE_COLOR: Partial<Record<BusEventType, string>> = {
  "message.sent":         "text-fuko-cond",
  "message.received":     "text-primary",
  "action.queued":        "text-fuko-work",
  "action.completed":     "text-fuko-func",
  "trust.score.updated":  "text-fuko-skill",
  "agent.status.changed": "text-muted-foreground",
  "agent.selected":       "text-primary",
  "agent.focus.set":      "text-primary",
  "agent.recalibrate":    "text-fuko-cond",
  "expert.assigned":      "text-fuko-skill",
  "voice.mode.toggled":   "text-fuko-func",
  "voice.command.matched":"text-fuko-func",
  "accent.cycled":        "text-fuko-work",
  "style.profile.changed":"text-fuko-skill",
  "emergency.triggered":  "text-fuko-guard",
  "emergency.cleared":    "text-fuko-func",
  "evolution.frozen":     "text-fuko-cond",
  "evolution.resumed":    "text-fuko-func",
  "maintenance.toggled":  "text-fuko-work",
  "sda.route":            "text-primary",
  "kpi.threshold.breached": "text-fuko-guard",
  "influence.rebalanced": "text-fuko-skill",
  "api.request":          "text-muted-foreground",
  "api.response":         "text-fuko-func",
  "api.error":            "text-fuko-guard",
  "process.approved":     "text-primary",
  "bus.replay":           "text-fuko-work",
  "bus.snapshot":         "text-fuko-skill",
};

export function EventLog() {
  const events = useEventBus((s) => s.events);
  const paused = useEventBus((s) => s.paused);
  const setPaused = useEventBus((s) => s.setPaused);
  const clear = useEventBus((s) => s.clear);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && scroller.current) scroller.current.scrollTop = 0;
  }, [events, open]);

  const visible = filter
    ? events.filter(
        (e) => e.type.includes(filter) || e.source.includes(filter),
      )
    : events;

  return (
    <div className="shrink-0 border-t border-border bg-panel">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-panel-2 hover:text-foreground"
      >
        <Radio className="h-3 w-3 text-primary" />
        event.bus
        <span className="rounded border border-border px-1 tabular-nums text-foreground">
          {events.length}
        </span>
        {paused && (
          <span className="rounded border border-fuko-cond/40 bg-fuko-cond-bg px-1 text-fuko-cond">
            paused
          </span>
        )}
        <span className="ml-auto flex items-center gap-1">
          {open ? "collapse" : "expand"}
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </span>
      </button>

      {open && (
        <div className="flex h-56 flex-col border-t border-border">
          <div className="flex items-center gap-2 border-b border-border bg-background/60 px-3 py-1.5">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="filter by type or source…"
              className="h-6 flex-1 rounded border border-border bg-panel px-2 font-mono text-[11px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none"
            />
            <button
              onClick={() => setPaused(!paused)}
              className="flex h-6 items-center gap-1 rounded border border-border bg-panel-2 px-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              {paused ? "resume" : "pause"}
            </button>
            <button
              onClick={clear}
              className="flex h-6 items-center gap-1 rounded border border-border bg-panel-2 px-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="h-3 w-3" /> clear
            </button>
          </div>

          <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto font-mono text-[11px]">
            {visible.length === 0 && (
              <div className="p-3 text-muted-foreground">no events</div>
            )}
            {visible.map((e) => (
              <div
                key={e.id}
                className="flex items-start gap-2 border-b border-border/40 px-3 py-1 hover:bg-panel-2/40"
              >
                <span className="w-16 shrink-0 tabular-nums text-muted-foreground">
                  {e.ts.slice(11, 19)}
                </span>
                <span className={`w-44 shrink-0 truncate ${TYPE_COLOR[e.type] ?? "text-foreground"}`}>
                  {e.type}
                </span>
                <span className="w-36 shrink-0 truncate text-muted-foreground">
                  {e.source}
                </span>
                <span className="min-w-0 flex-1 truncate text-foreground/80">
                  {JSON.stringify(e.payload)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
