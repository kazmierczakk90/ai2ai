import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFlowStore, type FlowEdge, type FlowNode } from "@/store/flow-store";
import { computeLayout, validateGraph } from "@/lib/flow/layout";

const NODE_W = 150;
const NODE_H = 52;
const GRID = 16;
const MIN_K = 0.3;
const MAX_K = 2.5;

const EDGE_COLOR: Record<string, string> = {
  SEQ: "var(--primary)",
  PAR: "var(--fuko-func)",
  COND: "var(--fuko-cond)",
  LOOP: "var(--fuko-skill)",
  GATE: "var(--fuko-guard)",
};

const EDGE_DASH: Record<string, string | undefined> = {
  COND: "6 4",
  LOOP: "2 4",
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

type View = { x: number; y: number; k: number };

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
  const duplicateNode = useFlowStore((s) => s.duplicateNode);
  const applyLayout = useFlowStore((s) => s.applyLayout);
  const undoAction = useFlowStore((s) => s.undoAction);
  const redoAction = useFlowStore((s) => s.redoAction);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const [pan, setPan] = useState<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const [hoverTarget, setHoverTarget] = useState<string | null>(null);

  const issues = useMemo(() => validateGraph(nodes, edges), [nodes, edges]);

  const toLocal = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: (clientX - rect.left - view.x) / view.k,
        y: (clientY - rect.top - view.y) / view.k,
      };
    },
    [view],
  );

  const bounds = useMemo(() => {
    if (!nodes.length) return { minX: 0, minY: 0, maxX: 1200, maxY: 700 };
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    return {
      minX: Math.min(...xs) - NODE_W,
      minY: Math.min(...ys) - NODE_H,
      maxX: Math.max(...xs) + NODE_W,
      maxY: Math.max(...ys) + NODE_H,
    };
  }, [nodes]);

  const fitView = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const w = el.clientWidth || 1000;
    const h = el.clientHeight || 700;
    const gw = Math.max(200, bounds.maxX - bounds.minX);
    const gh = Math.max(200, bounds.maxY - bounds.minY);
    const k = Math.min(MAX_K, Math.max(MIN_K, Math.min(w / gw, h / gh) * 0.9));
    setView({
      k,
      x: (w - gw * k) / 2 - bounds.minX * k,
      y: (h - gh * k) / 2 - bounds.minY * k,
    });
  }, [bounds]);

  function zoomBy(factor: number) {
    const el = wrapRef.current;
    const w = el?.clientWidth ?? 800;
    const h = el?.clientHeight ?? 600;
    setView((v) => {
      const k = Math.min(MAX_K, Math.max(MIN_K, v.k * factor));
      const scale = k / v.k;
      return { k, x: w / 2 - (w / 2 - v.x) * scale, y: h / 2 - (h / 2 - v.y) * scale };
    });
  }

  const didFit = useRef(false);
  useEffect(() => {
    if (didFit.current || !nodes.length) return;
    const id = requestAnimationFrame(() => {
      didFit.current = true;
      fitView();
    });
    return () => cancelAnimationFrame(id);
  }, [nodes.length, fitView]);


  useEffect(() => {

    const el = wrapRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey && Math.abs(e.deltaY) < 2) return;
      e.preventDefault();
      const rect = el!.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      setView((v) => {
        const k = Math.min(MAX_K, Math.max(MIN_K, v.k * (e.deltaY < 0 ? 1.1 : 1 / 1.1)));
        const scale = k / v.k;
        return { k, x: px - (px - v.x) * scale, y: py - (py - v.y) * scale };
      });
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
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
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d" && selection?.kind === "node") {
        e.preventDefault();
        duplicateNode(selection.id);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redoAction();
        else undoAction();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selection, cancelConnect, select, removeNode, removeEdge, undoAction, redoAction, duplicateNode]);

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

  function onBgPointerDown(e: React.PointerEvent) {
    if (e.button === 1 || (e.button === 0 && !connecting)) {
      setPan({ sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y });
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const p = toLocal(e.clientX, e.clientY);
    setMouse(p);
    if (pan) {
      setView((v) => ({ ...v, x: pan.ox + (e.clientX - pan.sx), y: pan.oy + (e.clientY - pan.sy) }));
      return;
    }
    if (drag) {
      const nx = Math.round((p.x - drag.dx) / GRID) * GRID;
      const ny = Math.round((p.y - drag.dy) / GRID) * GRID;
      updateNode(drag.id, { x: nx, y: ny });
    }
  }

  function onPointerUp() {
    if (connecting && hoverTarget) finishConnect(hoverTarget);
    setDrag(null);
    setPan(null);
    setHoverTarget(null);
  }

  function onBgClick() {
    if (pan) return;
    if (connecting) cancelConnect();
    select(null);
  }

  return (
    <div ref={wrapRef} className="relative min-h-0 flex-1 overflow-hidden bg-background">
      <svg
        ref={svgRef}
        id="kk1-flow-svg"
        data-flow-svg
        width="100%"
        height="100%"
        onPointerDown={onBgPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onClick={onBgClick}
        className={pan ? "block cursor-grabbing" : "block cursor-default"}
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

        <g data-flow-viewport transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          <rect x={-4000} y={-4000} width={12000} height={12000} fill="url(#flow-grid)" />

          {edges.map((edge) => (
            <EdgeShape
              key={edge.id}
              edge={edge}
              nodes={nodes}
              selected={selection?.kind === "edge" && selection.id === edge.id}
              onSelect={() => select({ kind: "edge", id: edge.id })}
            />
          ))}

          {connecting && mouse && <ConnectingLine nodes={nodes} fromId={connecting} to={mouse} />}

          {nodes.map((node) => (
            <NodeShape
              key={node.id}
              node={node}
              selected={selection?.kind === "node" && selection.id === node.id}
              connecting={connecting === node.id}
              targetable={!!connecting && connecting !== node.id}
              hovered={hoverTarget === node.id}
              onHover={(on) => setHoverTarget(on ? node.id : null)}
              onPointerDown={(e) => onNodePointerDown(e, node)}
              onStartConnect={() => startConnect(node.id)}
            />
          ))}
        </g>
      </svg>

      {/* zoom controls */}
      <div className="absolute left-2 top-2 flex flex-col gap-1">
        <ZoomBtn onClick={() => zoomBy(1.2)} label="+" />
        <ZoomBtn onClick={() => zoomBy(1 / 1.2)} label="−" />
        <ZoomBtn onClick={fitView} label="fit" />
        <ZoomBtn onClick={() => setView({ x: 0, y: 0, k: 1 })} label="1:1" />
        <ZoomBtn
          onClick={() => applyLayout(computeLayout(nodes, edges))}
          label="auto"
          title="auto layout"
        />
      </div>

      {/* validation bar */}
      {issues.length > 0 && (
        <div className="pointer-events-none absolute left-1/2 top-2 flex max-w-[60%] -translate-x-1/2 flex-wrap justify-center gap-1">
          {issues.slice(0, 4).map((iss, i) => (
            <span
              key={i}
              className={`rounded border px-2 py-0.5 font-mono text-[10px] ${
                iss.level === "error"
                  ? "border-fuko-guard/50 bg-fuko-guard/10 text-fuko-guard"
                  : "border-fuko-cond/40 bg-fuko-cond/10 text-fuko-cond"
              }`}
            >
              {iss.message}
            </span>
          ))}
        </div>
      )}

      <Minimap nodes={nodes} bounds={bounds} />

      <div className="pointer-events-none absolute bottom-2 right-2 rounded border border-border bg-panel/80 px-2 py-1 font-mono text-[10px] text-muted-foreground">
        scroll = zoom · drag tła = pan · port ● → węzeł = połącz · del = usuń · ctrl+d = duplikuj · ctrl+z = undo
      </div>
    </div>
  );
}

function ZoomBtn({ onClick, label, title }: { onClick: () => void; label: string; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title ?? label}
      className="h-6 w-8 rounded border border-border bg-panel/90 font-mono text-[10px] text-muted-foreground hover:border-primary/50 hover:text-primary"
    >
      {label}
    </button>
  );
}

function Minimap({
  nodes,
  bounds,
}: {
  nodes: FlowNode[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}) {
  const w = 150;
  const h = 90;
  const gw = Math.max(1, bounds.maxX - bounds.minX);
  const gh = Math.max(1, bounds.maxY - bounds.minY);
  const k = Math.min(w / gw, h / gh);
  return (
    <div className="pointer-events-none absolute bottom-10 right-2 rounded border border-border bg-panel/85">
      <svg width={w} height={h}>
        {nodes.map((n) => (
          <rect
            key={n.id}
            x={(n.x - bounds.minX) * k - 4}
            y={(n.y - bounds.minY) * k - 2}
            width={8}
            height={4}
            rx={1}
            fill={kindStyle(n.kind).stroke}
            opacity={0.8}
          />
        ))}
      </svg>
    </div>
  );
}

function NodeShape({
  node,
  selected,
  connecting,
  targetable,
  hovered,
  onHover,
  onPointerDown,
  onStartConnect,
}: {
  node: FlowNode;
  selected: boolean;
  connecting: boolean;
  targetable: boolean;
  hovered: boolean;
  onHover: (on: boolean) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onStartConnect: () => void;
}) {
  const style = kindStyle(node.kind);
  const rounded = node.kind === "start" || node.kind === "end" ? NODE_H / 2 : 6;
  const label = node.agent.length > 18 ? node.agent.slice(0, 17) + "…" : node.agent;
  return (
    <g
      transform={`translate(${node.x - NODE_W / 2} ${node.y - NODE_H / 2})`}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
    >
      {node.kind === "gate" ? (
        <polygon
          points={`${NODE_W / 2},0 ${NODE_W},${NODE_H / 2} ${NODE_W / 2},${NODE_H} 0,${NODE_H / 2}`}
          fill={style.fill}
          stroke={selected || connecting || (targetable && hovered) ? "var(--primary)" : style.stroke}
          strokeWidth={selected || connecting || (targetable && hovered) ? 2 : 1}
          onPointerDown={onPointerDown}
          style={{ cursor: "grab" }}
        />
      ) : (
        <rect
          width={NODE_W}
          height={NODE_H}
          rx={rounded}
          fill={style.fill}
          stroke={selected || connecting || (targetable && hovered) ? "var(--primary)" : style.stroke}
          strokeWidth={selected || connecting || (targetable && hovered) ? 2 : 1}
          onPointerDown={onPointerDown}
          style={{ cursor: "grab" }}
        />
      )}
      <title>{`${node.agent} · ${node.kind}${node.note ? ` — ${node.note}` : ""}`}</title>
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
        {label}
      </text>
      <text
        x={NODE_W / 2}
        y={NODE_H - 9}
        textAnchor="middle"
        fontFamily="var(--font-mono, monospace)"
        fontSize={8}
        fill="var(--muted-foreground)"
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {node.kind}
        {node.note ? " ✎" : ""}
      </text>

      {/* input port */}
      {node.kind !== "start" && (
        <circle
          cx={0}
          cy={NODE_H / 2}
          r={4}
          fill={targetable && hovered ? "var(--primary)" : "var(--panel)"}
          stroke="var(--border)"
          strokeWidth={1}
        />
      )}

      {/* output port */}
      {node.kind !== "end" && (
        <g
          transform={`translate(${NODE_W} ${NODE_H / 2})`}
          onPointerDown={(e) => {
            e.stopPropagation();
            onStartConnect();
          }}
          style={{ cursor: "crosshair" }}
        >
          <circle r={6} fill="var(--panel)" stroke="var(--primary)" strokeWidth={1.5} />
          <circle r={2} fill="var(--primary)" style={{ pointerEvents: "none" }} />
        </g>
      )}
    </g>
  );
}

function edgePath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = Math.max(40, Math.abs(to.x - from.x) * 0.5);
  return `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`;
}

function loopPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const lift = 70;
  const midY = Math.min(from.y, to.y) - lift;
  return `M ${from.x} ${from.y} C ${from.x + 60} ${midY}, ${to.x - 60} ${midY}, ${to.x} ${to.y}`;
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
  const backwards = to.x < from.x;
  const p1 = { x: from.x + NODE_W / 2, y: from.y };
  const p2 = { x: to.x - NODE_W / 2, y: to.y };
  const d = edge.type === "LOOP" || backwards ? loopPath(p1, p2) : edgePath(p1, p2);
  const color = EDGE_COLOR[edge.type] ?? "var(--primary)";
  const mid = {
    x: (p1.x + p2.x) / 2,
    y: edge.type === "LOOP" || backwards ? Math.min(p1.y, p2.y) - 44 : (p1.y + p2.y) / 2 - 8,
  };
  const label = `${edge.type} · ${edge.label || "task"}`;
  const w = Math.min(240, label.length * 6 + 12);

  return (
    <g onClick={(e) => { e.stopPropagation(); onSelect(); }} style={{ cursor: "pointer" }}>
      <path d={d} stroke="transparent" strokeWidth={16} fill="none" />
      {edge.type === "PAR" && (
        <path d={d} stroke={color} strokeWidth={selected ? 5 : 4} fill="none" opacity={0.25} />
      )}
      <path
        d={d}
        stroke={color}
        strokeWidth={selected ? 2.5 : 1.5}
        strokeDasharray={selected ? "6 4" : EDGE_DASH[edge.type]}
        fill="none"
        markerEnd={`url(#arrow-${edge.type})`}
        opacity={selected ? 1 : 0.85}
      >
        {selected && (
          <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.6s" repeatCount="indefinite" />
        )}
      </path>
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
