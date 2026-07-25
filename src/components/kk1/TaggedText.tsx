import React from "react";
import type { TaggedToken, FukoSymbol } from "@/lib/telegram-store.server";

const STYLES: Record<FukoSymbol, { cls: string; sigil: string; title: string }> = {
  agent: {
    cls: "bg-fuko-agent-bg text-fuko-agent border-fuko-agent/40",
    sigil: "@",
    title: "Agent",
  },
  func: {
    cls: "bg-fuko-func-bg text-fuko-func border-fuko-func/40",
    sigil: "#",
    title: "Executable tool",
  },
  proc: {
    cls: "bg-fuko-proc-bg text-fuko-proc border-fuko-proc/40",
    sigil: "$",
    title: "Workflow",
  },
  guard: {
    cls: "bg-fuko-guard-bg text-fuko-guard border-fuko-guard/50 font-bold uppercase tracking-wide",
    sigil: "!",
    title: "Guardrail",
  },
  skill: {
    cls: "bg-fuko-skill-bg text-fuko-skill border-fuko-skill/40",
    sigil: "/",
    title: "Skill",
  },
  cond: {
    cls: "bg-fuko-cond-bg text-fuko-cond border-fuko-cond/40",
    sigil: "&",
    title: "Condition",
  },
};

function Chip({ tok }: { tok: TaggedToken }) {
  const s = STYLES[tok.symbol];
  const conf = Math.round(tok.confidence * 100);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-mono leading-none align-baseline border ${s.cls}`}
      title={`${s.title} · ${tok.suggested} · ${conf}% confidence`}
      data-fuko={tok.symbol}
    >
      <span className="opacity-60">{s.sigil}</span>
      <span>{tok.word}</span>
    </span>
  );
}

export function TaggedText({
  text,
  tokens,
  filter,
  className = "",
}: {
  text: string;
  tokens: TaggedToken[];
  filter?: FukoSymbol | "all";
  className?: string;
}) {
  const active = tokens
    .filter((t) => !filter || filter === "all" || t.symbol === filter)
    .sort((a, b) => a.start - b.start);

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  active.forEach((tok, i) => {
    if (tok.start < cursor) return;
    if (tok.start > cursor) parts.push(text.slice(cursor, tok.start));
    parts.push(<Chip key={`${i}-${tok.start}`} tok={tok} />);
    cursor = tok.end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));

  return (
    <span className={className}>
      {parts.map((p, i) => (
        <React.Fragment key={i}>{p}</React.Fragment>
      ))}
    </span>
  );
}
