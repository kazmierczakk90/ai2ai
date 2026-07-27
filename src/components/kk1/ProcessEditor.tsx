import { useMemo, useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Check, X, Pencil } from "lucide-react";

export type StepType = "SEQ" | "PAR" | "COND" | "LOOP" | "GATE";
const TYPES: StepType[] = ["SEQ", "PAR", "COND", "LOOP", "GATE"];

const STEP_RE =
  /^\s*(?:[①-⑳]|\(?\d+\)?[\.\)]?)\s*\[?(SEQ|PAR|COND|LOOP|GATE)\]?\s*(.*)$/i;

export type ParsedStep = {
  type: StepType;
  agent: string;
  skill: string;
  label: string;
  condition: string; // for COND/LOOP threshold or expr
};

export type ParsedProcess = {
  name: string;
  trigger: string;
  steps: ParsedStep[];
  raw: string;
};

const GLYPHS = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩","⑪","⑫","⑬","⑭","⑮"];

export function extractProcessBlock(text: string): { block: string; before: string; after: string } | null {
  const m = text.match(/```[a-z]*\n([\s\S]*?)```/i);
  if (!m) return null;
  const idx = m.index ?? 0;
  return {
    block: m[1].trim(),
    before: text.slice(0, idx),
    after: text.slice(idx + m[0].length),
  };
}

export function parseProcess(block: string): ParsedProcess {
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
  let name = "";
  let trigger = "";
  const steps: ParsedStep[] = [];
  for (const line of lines) {
    if (/^\$[-\w]/.test(line) && !name) { name = line.replace(/^\$-?/, ""); continue; }
    if (/^TRIGGER\s*:/i.test(line)) { trigger = line.split(":").slice(1).join(":").trim(); continue; }
    const m = line.match(STEP_RE);
    if (!m) continue;
    const type = m[1].toUpperCase() as StepType;
    const rest = m[2];
    // Parse: @agent → /skill  — label   OR   &-cond → TAK: ... | NIE: ...
    const agentM = rest.match(/@[-\w]+/);
    const skillM = rest.match(/\/[-\w]+/);
    const condM = rest.match(/&-?[^\s→]+|&\s*\S+/);
    const labelM = rest.split(/—|--|:\s/).slice(1).join(" — ").trim();
    steps.push({
      type,
      agent: agentM?.[0] ?? "",
      skill: skillM?.[0] ?? "",
      label: labelM || rest.replace(/@[-\w]+|\/[-\w]+|→|—.*/g, "").trim(),
      condition: condM?.[0] ?? (type === "COND" || type === "LOOP" ? rest : ""),
    });
  }
  return { name: name || "process", trigger, steps, raw: block };
}

export function serializeProcess(p: ParsedProcess): string {
  const out: string[] = [];
  out.push(`$-${p.name}`);
  if (p.trigger) out.push(`TRIGGER: ${p.trigger}`);
  p.steps.forEach((s, i) => {
    const g = GLYPHS[i] ?? `(${i + 1})`;
    if (s.type === "COND" || s.type === "LOOP") {
      const cond = s.condition || "&-warunek";
      out.push(`${g} [${s.type}] ${cond}${s.label ? " — " + s.label : ""}`);
    } else {
      const parts = [g, `[${s.type}]`];
      if (s.agent) parts.push(s.agent);
      if (s.skill) parts.push(`→ ${s.skill}`);
      if (s.label) parts.push(`— ${s.label}`);
      out.push(parts.join(" "));
    }
  });
  return out.join("\n");
}

const AGENT_SUGGESTIONS = [
  "@ceo","@product","@cto-agent","@analyzer","@critic","@evaluator",
  "@scribe","@narrator","@pitch-core","@todo","@router","@system-admin",
  "@guardian-core","@controlling","@passport","@mentor","@fighter","@karol-core",
  "@fuko-lang","@voice-core","@data-ops","@impact-tracker","@architect",
];
const SKILL_SUGGESTIONS = [
  "/kb-query","/kb-write","/agent-ask","/agent-broadcast","/opinion-engine",
  "/agent-consensus","/chain-of-thought-log","/task-delegation","/context-sync","/realtime-monitor",
];

export function ProcessEditor({
  initial,
  onApprove,
  onCancel,
}: {
  initial: ParsedProcess;
  onApprove: (edited: ParsedProcess, serialized: string) => void;
  onCancel: () => void;
}) {
  const [proc, setProc] = useState<ParsedProcess>(initial);
  const serialized = useMemo(() => serializeProcess(proc), [proc]);

  const update = (i: number, patch: Partial<ParsedStep>) =>
    setProc((p) => ({ ...p, steps: p.steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }));
  const remove = (i: number) => setProc((p) => ({ ...p, steps: p.steps.filter((_, idx) => idx !== i) }));
  const move = (i: number, dir: -1 | 1) =>
    setProc((p) => {
      const j = i + dir;
      if (j < 0 || j >= p.steps.length) return p;
      const arr = [...p.steps];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...p, steps: arr };
    });
  const add = () =>
    setProc((p) => ({
      ...p,
      steps: [...p.steps, { type: "SEQ", agent: "@analyzer", skill: "/kb-query", label: "new step", condition: "" }],
    }));

  return (
    <div className="mt-2 rounded border border-primary/40 bg-panel/60 p-3 font-mono text-xs">
      <div className="mb-2 flex items-center gap-2">
        <Pencil className="h-3.5 w-3.5 text-primary" />
        <span className="uppercase tracking-widest text-primary">edit process</span>
        <span className="ml-auto flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>name</span>
          <input
            value={proc.name}
            onChange={(e) => setProc((p) => ({ ...p, name: e.target.value.replace(/\s+/g, "-") }))}
            className="w-40 rounded border border-border bg-background px-1.5 py-0.5 text-foreground focus:border-primary/60 focus:outline-none"
          />
        </span>
      </div>
      <div className="mb-2 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>trigger</span>
        <input
          value={proc.trigger}
          onChange={(e) => setProc((p) => ({ ...p, trigger: e.target.value }))}
          placeholder="what starts it"
          className="flex-1 rounded border border-border bg-background px-1.5 py-0.5 text-foreground focus:border-primary/60 focus:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        {proc.steps.map((s, i) => (
          <div key={i} className="flex flex-wrap items-center gap-1.5 rounded border border-border bg-background/60 p-1.5">
            <span className="w-6 text-center text-primary">{GLYPHS[i] ?? i + 1}</span>
            <select
              value={s.type}
              onChange={(e) => update(i, { type: e.target.value as StepType })}
              className="rounded border border-border bg-panel px-1 py-0.5 text-foreground focus:border-primary/60 focus:outline-none"
            >
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>

            {s.type === "COND" || s.type === "LOOP" ? (
              <input
                value={s.condition}
                onChange={(e) => update(i, { condition: e.target.value })}
                placeholder="&-if_risk>0.7"
                className="min-w-[10rem] flex-1 rounded border border-border bg-panel px-1.5 py-0.5 text-fuko-cond focus:border-primary/60 focus:outline-none"
              />
            ) : (
              <>
                <input
                  list="agent-list"
                  value={s.agent}
                  onChange={(e) => update(i, { agent: e.target.value })}
                  placeholder="@agent"
                  className="w-32 rounded border border-border bg-panel px-1.5 py-0.5 text-fuko-agent focus:border-primary/60 focus:outline-none"
                />
                <span className="text-muted-foreground">→</span>
                <input
                  list="skill-list"
                  value={s.skill}
                  onChange={(e) => update(i, { skill: e.target.value })}
                  placeholder="/skill"
                  className="w-36 rounded border border-border bg-panel px-1.5 py-0.5 text-fuko-skill focus:border-primary/60 focus:outline-none"
                />
              </>
            )}

            <input
              value={s.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="label"
              className="min-w-[8rem] flex-1 rounded border border-border bg-panel px-1.5 py-0.5 text-foreground focus:border-primary/60 focus:outline-none"
            />

            <div className="ml-auto flex items-center gap-0.5">
              <button onClick={() => move(i, -1)} className="rounded border border-border p-1 text-muted-foreground hover:text-foreground" aria-label="up">
                <ArrowUp className="h-3 w-3" />
              </button>
              <button onClick={() => move(i, 1)} className="rounded border border-border p-1 text-muted-foreground hover:text-foreground" aria-label="down">
                <ArrowDown className="h-3 w-3" />
              </button>
              <button onClick={() => remove(i)} className="rounded border border-fuko-guard/40 p-1 text-fuko-guard hover:bg-fuko-guard-bg" aria-label="delete">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <datalist id="agent-list">
        {AGENT_SUGGESTIONS.map((a) => <option key={a} value={a} />)}
      </datalist>
      <datalist id="skill-list">
        {SKILL_SUGGESTIONS.map((sk) => <option key={sk} value={sk} />)}
      </datalist>

      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={add}
          className="flex items-center gap-1 rounded border border-border bg-panel-2 px-2 py-1 text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3 w-3" /> add step
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onCancel}
            className="flex items-center gap-1 rounded border border-border bg-panel-2 px-2 py-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" /> cancel
          </button>
          <button
            onClick={() => onApprove(proc, serialized)}
            className="flex items-center gap-1 rounded border border-primary/60 bg-primary/15 px-2 py-1 text-primary hover:bg-primary/25"
          >
            <Check className="h-3 w-3" /> approve &amp; run
          </button>
        </div>
      </div>

      <details className="mt-2 rounded border border-border bg-background/40 p-2">
        <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-muted-foreground">preview</summary>
        <pre className="mt-1 whitespace-pre-wrap text-[11px] text-foreground">{serialized}</pre>
      </details>
    </div>
  );
}
