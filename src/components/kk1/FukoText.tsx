import React from "react";

/**
 * FUKO-LANG symbol parser.
 * Recognizes:
 *   @-[name] / @name       -> Agent (blue pill)
 *   #-funkcja-             -> Executable tool (green mono tag)
 *   $-proces               -> Workflow (amber tag)
 *   !-wytyczne-            -> Guardrail (red bold warning)
 *   /-umiejętność          -> Skill (purple badge)
 *   &-warunek              -> Logic condition (orange)
 */

type Kind = "agent" | "func" | "proc" | "guard" | "skill" | "cond";

// Order matters: longer / more specific first.
const TOKEN_RE =
  /(@-\[[^\]]+\]|@[\p{L}0-9_]+|#-[\p{L}0-9_]+-|\$-[\p{L}0-9_]+|!-[\p{L}0-9_]+-?|\/-[\p{L}0-9_]+|&-[\p{L}0-9_=<>!.]+)/gu;

function classify(tok: string): { kind: Kind; label: string } | null {
  if (tok.startsWith("@-[") && tok.endsWith("]"))
    return { kind: "agent", label: tok.slice(3, -1) };
  if (tok.startsWith("@")) return { kind: "agent", label: tok.slice(1) };
  if (tok.startsWith("#-"))
    return { kind: "func", label: tok.slice(2).replace(/-$/, "") };
  if (tok.startsWith("$-")) return { kind: "proc", label: tok.slice(2) };
  if (tok.startsWith("!-"))
    return { kind: "guard", label: tok.slice(2).replace(/-$/, "") };
  if (tok.startsWith("/-")) return { kind: "skill", label: tok.slice(2) };
  if (tok.startsWith("&-")) return { kind: "cond", label: tok.slice(2) };
  return null;
}

function Chip({ kind, label, raw }: { kind: Kind; label: string; raw: string }) {
  const base =
    "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-mono leading-none align-baseline border";
  const map: Record<Kind, { cls: string; sigil: string; title: string }> = {
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
  const spec = map[kind];
  return (
    <span
      className={`${base} ${spec.cls}`}
      title={`${spec.title} · ${raw}`}
      data-fuko={kind}
    >
      <span className="opacity-60">{spec.sigil}</span>
      <span>{label}</span>
    </span>
  );
}

export function FukoText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((match = TOKEN_RE.exec(text)) !== null) {
    const raw = match[0];
    if (match.index > last) parts.push(text.slice(last, match.index));
    const c = classify(raw);
    if (c) {
      parts.push(
        <Chip key={`${match.index}-${raw}`} kind={c.kind} label={c.label} raw={raw} />,
      );
    } else {
      parts.push(raw);
    }
    last = match.index + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return (
    <span className={className}>
      {parts.map((p, i) => (
        <React.Fragment key={i}>{p}</React.Fragment>
      ))}
    </span>
  );
}
