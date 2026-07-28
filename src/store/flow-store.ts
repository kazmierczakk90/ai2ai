/**
 * Flow Canvas store — nodes + edges for graphical agent-route design.
 * Persisted to localStorage under `kk1.flow.graph`. Every mutation
 * pushes a snapshot onto the undo stack and emits a bus event.
 */
import { create } from "zustand";
import { emit } from "@/lib/event-bus";

export type FlowNodeKind = "agent" | "start" | "gate" | "end";
export type FlowEdgeType = "SEQ" | "PAR" | "COND" | "LOOP" | "GATE";

export type FlowNode = {
  id: string;
  kind: FlowNodeKind;
  agent: string; // handle like "@ceo" or label like "START"
  x: number;
  y: number;
  note?: string;
};

export type FlowEdge = {
  id: string;
  from: string;
  to: string;
  type: FlowEdgeType;
  label: string;
  skill?: string;
  condition?: string;
  maxIterations?: number;
  priority?: number;
};

export type FlowSelection =
  | { kind: "node"; id: string }
  | { kind: "edge"; id: string }
  | null;

type Snapshot = { nodes: FlowNode[]; edges: FlowEdge[] };

type FlowState = {
  name: string;
  trigger: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  selection: FlowSelection;
  connecting: string | null; // node id when drawing edge
  undo: Snapshot[];
  redo: Snapshot[];

  setName: (n: string) => void;
  setTrigger: (t: string) => void;

  addNode: (n: Omit<FlowNode, "id">) => string;
  updateNode: (id: string, patch: Partial<FlowNode>) => void;
  removeNode: (id: string) => void;

  addEdge: (e: Omit<FlowEdge, "id">) => string;
  updateEdge: (id: string, patch: Partial<FlowEdge>) => void;
  removeEdge: (id: string) => void;

  select: (s: FlowSelection) => void;
  startConnect: (nodeId: string) => void;
  cancelConnect: () => void;
  finishConnect: (targetId: string) => void;

  clear: () => void;
  save: () => void;
  load: () => void;
  importGraph: (payload: { name?: string; trigger?: string; nodes: FlowNode[]; edges: FlowEdge[] }) => void;

  undoAction: () => void;
  redoAction: () => void;
};

const LS_KEY = "kk1.flow.graph";
const uid = (p: string) =>
  `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

function seed(): Pick<FlowState, "nodes" | "edges" | "name" | "trigger"> {
  const start: FlowNode = { id: "n-start", kind: "start", agent: "START", x: 120, y: 180 };
  const analyzer: FlowNode = { id: "n-analyzer", kind: "agent", agent: "@analyzer", x: 360, y: 180 };
  const ceo: FlowNode = { id: "n-ceo", kind: "agent", agent: "@ceo", x: 620, y: 180 };
  const end: FlowNode = { id: "n-end", kind: "end", agent: "END", x: 880, y: 180 };
  return {
    name: "market-brief",
    trigger: "operator request",
    nodes: [start, analyzer, ceo, end],
    edges: [
      { id: "e-1", from: start.id, to: analyzer.id, type: "SEQ", label: "collect market data", skill: "kb-query", priority: 7 },
      { id: "e-2", from: analyzer.id, to: ceo.id, type: "SEQ", label: "hand decision brief", skill: "chain-of-thought-log", priority: 8 },
      { id: "e-3", from: ceo.id, to: end.id, type: "GATE", label: "approve & publish", skill: "task-delegation", priority: 9 },
    ],
  };
}

function loadPersisted(): Snapshot & { name?: string; trigger?: string } | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persist(s: FlowState) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ name: s.name, trigger: s.trigger, nodes: s.nodes, edges: s.edges }),
    );
  } catch {
    /* ignore */
  }
}

function pushHistory(state: FlowState): Pick<FlowState, "undo" | "redo"> {
  const snap: Snapshot = { nodes: state.nodes, edges: state.edges };
  const undo = [...state.undo, snap].slice(-40);
  return { undo, redo: [] };
}

export const useFlowStore = create<FlowState>((set, get) => {
  const persisted = loadPersisted();
  const initial = persisted ?? seed();
  return {
    name: initial.name ?? "market-brief",
    trigger: initial.trigger ?? "operator request",
    nodes: initial.nodes,
    edges: initial.edges,
    selection: null,
    connecting: null,
    undo: [],
    redo: [],

    setName: (n) => {
      set({ name: n });
      persist(get());
    },
    setTrigger: (t) => {
      set({ trigger: t });
      persist(get());
    },

    addNode: (n) => {
      const id = uid("n");
      set((s) => ({ ...pushHistory(s), nodes: [...s.nodes, { ...n, id }] }));
      emit("flow.node.added", "flow.store", { id, agent: n.agent, kind: n.kind });
      persist(get());
      return id;
    },
    updateNode: (id, patch) => {
      set((s) => ({
        ...pushHistory(s),
        nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
      }));
      persist(get());
    },
    removeNode: (id) => {
      set((s) => ({
        ...pushHistory(s),
        nodes: s.nodes.filter((n) => n.id !== id),
        edges: s.edges.filter((e) => e.from !== id && e.to !== id),
        selection: s.selection?.kind === "node" && s.selection.id === id ? null : s.selection,
      }));
      emit("flow.node.removed", "flow.store", { id });
      persist(get());
    },

    addEdge: (e) => {
      const id = uid("e");
      set((s) => ({ ...pushHistory(s), edges: [...s.edges, { ...e, id }] }));
      emit("flow.edge.added", "flow.store", { id, from: e.from, to: e.to, type: e.type });
      persist(get());
      return id;
    },
    updateEdge: (id, patch) => {
      set((s) => ({
        ...pushHistory(s),
        edges: s.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      }));
      emit("flow.edge.updated", "flow.store", { id, patch });
      persist(get());
    },
    removeEdge: (id) => {
      set((s) => ({
        ...pushHistory(s),
        edges: s.edges.filter((e) => e.id !== id),
        selection: s.selection?.kind === "edge" && s.selection.id === id ? null : s.selection,
      }));
      emit("flow.edge.removed", "flow.store", { id });
      persist(get());
    },

    select: (s) => set({ selection: s }),
    startConnect: (nodeId) => set({ connecting: nodeId }),
    cancelConnect: () => set({ connecting: null }),
    finishConnect: (targetId) => {
      const from = get().connecting;
      set({ connecting: null });
      if (!from || from === targetId) return;
      get().addEdge({ from, to: targetId, type: "SEQ", label: "task", priority: 5 });
    },

    clear: () => {
      set((s) => ({
        ...pushHistory(s),
        nodes: [],
        edges: [],
        selection: null,
      }));
      emit("flow.graph.cleared", "flow.store", {});
      persist(get());
    },
    save: () => {
      persist(get());
      emit("flow.graph.saved", "flow.store", {
        name: get().name,
        nodes: get().nodes.length,
        edges: get().edges.length,
      });
    },
    load: () => {
      const p = loadPersisted();
      if (!p) return;
      set({
        nodes: p.nodes,
        edges: p.edges,
        name: p.name ?? get().name,
        trigger: p.trigger ?? get().trigger,
        selection: null,
      });
    },

    undoAction: () => {
      const s = get();
      if (!s.undo.length) return;
      const prev = s.undo[s.undo.length - 1];
      const cur: Snapshot = { nodes: s.nodes, edges: s.edges };
      set({
        nodes: prev.nodes,
        edges: prev.edges,
        undo: s.undo.slice(0, -1),
        redo: [...s.redo, cur].slice(-40),
      });
      persist(get());
    },
    redoAction: () => {
      const s = get();
      if (!s.redo.length) return;
      const next = s.redo[s.redo.length - 1];
      const cur: Snapshot = { nodes: s.nodes, edges: s.edges };
      set({
        nodes: next.nodes,
        edges: next.edges,
        redo: s.redo.slice(0, -1),
        undo: [...s.undo, cur].slice(-40),
      });
      persist(get());
    },
  };
});
