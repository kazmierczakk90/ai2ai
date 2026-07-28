import { useCallback, useEffect, useRef, useState } from "react";
import { useFlowStore, type FlowEdge, type FlowNode } from "@/store/flow-store";

const NODE_W = 130;
const NODE_H = 48;
const GRID = 16;

const EDGE_COLOR: Record<string, string> = {
  SEQ: "var(--primary)",
  PAR: "var(--fuko-func)",
  COND: "var(--fuko-cond)",
  LOOP: "var(--fuko-skill)",
  GATE: "var(--fuko-guard)",
};

function kindStyle(kind: FlowNode["kind"]) {
  switch (kind) {
    case "start":
      return { fill: "color-mix(in oklab, var(--fuko-func) 15%, transparent)", stroke: "var(--fuko-func)" };
    case "end":
      return { fill: "color-mix(in oklab, var(--fuko-guard) 15%, transparent)", stroke: "var(--fuko-guard)" };
    case "gate":
      return { fill: "color-mix(in oklab, var(--fuko-cond) 15%, transparent)", stroke: "var(--fuko-cond)" };
    default:
      return { fill: "color-mix(in oklab, var(--primary) 10%, transparent)", stroke: "var(--primary)" };
  }
}

export function FlowCanvas() {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const selection = useFlowStore((s) => s.selection);
  const connecting = useFlowStore((s) => s.connecting);
  const select = useFlowStore((s) => s.select);
  const updateNode = useFlowStore((s) => s.updateNode);
  const startConnect = useFlowStore((s) => s.startConnect);
  const cancelConnect = useFlowStore((s) => s.cancelConnect);
  const finishConnect = useFlowStore((s) => s.finishConnect);
  const removeNode = useFlowStore((s) => s.removeNode);
  const removeEdge = useFlowStore((s) => s.removeEdge);
  const undoAction = useFlowStore((s) => s.undoAction);
  const redoAction = useFlowStore((s) => s.redoAction);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);

  const toLocal = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (e.key === "Escape") {
        cancelConnect();
        select(null);
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selection) {
        if (selection.kind === "node") removeNode(selection.id);
        else removeEdge(selection.id);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redoAction();
        else undoAction();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selection, cancelConnect, select, removeNode, removeEdge, undoAction, redoAction]);

  function onNodePointerDown(e: React.PointerEvent, node: FlowNode) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    select({ kind: "node", id: node.id });
    if (connecting) {
      finishConnect(node.id);
      return;
    }
    const { x, y } = toLocal(e.clientX, e.clientY);
    setDrag({ id: node.id, dx: x - node.x, dy: y - node.y });
  }

  function onPointerMove(e: React.PointerEvent) {
    const p = toLocal(e.clientX, e.clientY);
    setMouse(p);
    if (drag) {
      const nx = Math.round((p.x - drag.dx) / GRID) * GRID;
      const ny = Math.round((p.y - drag.dy) / GRID) * GRID;
      updateNode(drag.id, { x: nx, y: ny });
    }
  }

  function onPointerUp() {
    setDrag(null);
  }

  function onBgClick() {
    if (connecting) cancelConnect();
    select(null);
  }

  return (
    <div className="relative min-h-0 flex-1 overflow-auto bg-background">
      <svg
        ref={svgRef}
        id="kk1-flow-svg"
        data-flow-svg
        width={1600}
        height={900}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={onBgClick}
        className="block cursor-default"
      >
        <defs>
          <pattern id="flow-grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
            <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" stroke="var(--border)" strokeWidth={0.5} opacity={0.4} />
          </pattern>
          {Object.entries(EDGE_COLOR).map(([type, color]) => (
            <marker
              key={type}
              id={`arrow-${type}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
            </marker>
          ))}
        </defs>

        <rect width="100%" height="100%" fill="url(#flow-grid)" />

        {edges.map((edge) => (
          <EdgeShape
            key={edge.id}
            edge={edge}
            nodes={nodes}
            selected={selection?.kind === "edge" && selection.id === edge.id}
            onSelect={() => select({ kind: "edge", id: edge.id })}
          />
        ))}

        {connecting && mouse && (
          <ConnectingLine nodes={nodes} fromId={connecting} to={mouse} />
        )}

        {nodes.map((node) => (
          <NodeShape
            key={node.id}
            node={node}
            selected={selection?.kind === "node" && selection.id === node.id}
            connecting={connecting === node.id}
            onPointerDown={(e) => onNodePointerDown(e, node)}
            onStartConnect={() => startConnect(node.id)}
          />
        ))}
      </svg>

      <div className="pointer-events-none absolute bottom-2 right-2 rounded border border-border bg-panel/80 px-2 py-1 font-mono text-[10px] text-muted-foreground">
        drag = move · click handle → click node = connect · del = remove · ctrl+z = undo
      </div>
    </div>
  );
}

function NodeShape({
  node,
  selected,
  connecting,
  onPointerDown,
  onStartConnect,
}: {
  node: FlowNode;
  selected: boolean;
  connecting: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onStartConnect: () => void;
}) {
  const style = kindStyle(node.kind);
  return (
    <g transform={`translate(${node.x - NODE_W / 2} ${node.y - NODE_H / 2})`}>
      <rect
        width={NODE_W}
        height={NODE_H}
        rx={6}
        fill={style.fill}
        stroke={selected || connecting ? "var(--primary)" : style.stroke}
        strokeWidth={selected || connecting ? 2 : 1}
        onPointerDown={onPointerDown}
        style={{ cursor: "grab" }}
      />
      <text
        x={NODE_W / 2}
        y={NODE_H / 2 - 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="var(--font-mono, monospace)"
        fontSize={12}
        fill="var(--foreground)"
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {node.agent}
      </text>
      <text
        x={NODE_W / 2}
        y={NODE_H - 10}
        textAnchor="middle"
        fontFamily="var(--font-mono, monospace)"
        fontSize={8}
        fill="var(--muted-foreground)"
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {node.kind}
      </text>
      <g
        transform={`translate(${NODE_W - 8} ${NODE_H / 2})`}
        onPointerDown={(e) => {
          e.stopPropagation();
          onStartConnect();
        }}
        style={{ cursor: "crosshair" }}
      >
        <circle r={6} fill="var(--panel)" stroke="var(--primary)" strokeWidth={1.5} />
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={10}
          fill="var(--primary)"
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          +
        </text>
      </g>
    </g>
  );
}

function edgePath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = Math.max(40, Math.abs(to.x - from.x) * 0.5);
  return `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`;
}

function EdgeShape({
  edge,
  nodes,
  selected,
  onSelect,
}: {
  edge: FlowEdge;
  nodes: FlowNode[];
  selected: boolean;
  onSelect: () => void;
}) {
  const from = nodes.find((n) => n.id === edge.from);
  const to = nodes.find((n) => n.id === edge.to);
  if (!from || !to) return null;
  const p1 = { x: from.x + NODE_W / 2, y: from.y };
  const p2 = { x: to.x - NODE_W / 2, y: to.y };
  const d = edgePath(p1, p2);
  const color = EDGE_COLOR[edge.type] ?? "var(--primary)";
  const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 - 8 };
  const label = `${edge.type} · ${edge.label || "task"}`;
  const w = Math.min(240, label.length * 6 + 12);

  return (
    <g onClick={(e) => { e.stopPropagation(); onSelect(); }} style={{ cursor: "pointer" }}>
      <path d={d} stroke="transparent" strokeWidth={16} fill="none" />
      <path
        d={d}
        stroke={color}
        strokeWidth={selected ? 2.5 : 1.5}
        fill="none"
        markerEnd={`url(#arrow-${edge.type})`}
        opacity={selected ? 1 : 0.85}
      />
      <g transform={`translate(${mid.x - w / 2} ${mid.y - 10})`}>
        <rect
          width={w}
          height={16}
          rx={3}
          fill="var(--panel)"
          stroke={selected ? "var(--primary)" : "var(--border)"}
        />
        <text
          x={w / 2}
          y={11}
          textAnchor="middle"
          fontFamily="var(--font-mono, monospace)"
          fontSize={9}
          fill={color}
          style={{ userSelect: "none" }}
        >
          {label.length > 38 ? label.slice(0, 37) + "…" : label}
        </text>
      </g>
    </g>
  );
}

function ConnectingLine({
  nodes,
  fromId,
  to,
}: {
  nodes: FlowNode[];
  fromId: string;
  to: { x: number; y: number };
}) {
  const from = nodes.find((n) => n.id === fromId);
  if (!from) return null;
  const p1 = { x: from.x + NODE_W / 2, y: from.y };
  return (
    <path
      d={edgePath(p1, to)}
      stroke="var(--primary)"
      strokeWidth={1.2}
      strokeDasharray="4 3"
      fill="none"
      opacity={0.7}
    />
  );
}
