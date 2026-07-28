import type { FlowEdge, FlowNode } from "@/store/flow-store";

export type FlowGraphPayload = {
  name: string;
  trigger: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
};

const CSS_VARS: Record<string, string> = {
  "--background": "#0b0f17",
  "--foreground": "#e5e7eb",
  "--panel": "#111827",
  "--border": "#1f2937",
  "--muted-foreground": "#9ca3af",
  "--primary": "#60a5fa",
  "--fuko-func": "#34d399",
  "--fuko-cond": "#fb923c",
  "--fuko-skill": "#a78bfa",
  "--fuko-guard": "#f87171",
};

function download(filename: string, blob: Blob) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function downloadJson(payload: FlowGraphPayload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  download(`kk1-flow-${payload.name || "graph"}.json`, blob);
}

/**
 * Serialize the live SVG, inline CSS var colours so the file renders
 * standalone in any viewer (draw.io / Figma / browser preview).
 */
function inlineSvg(): { svg: SVGSVGElement; source: string } | null {
  const svg = document.querySelector<SVGSVGElement>("[data-flow-svg]");
  if (!svg) return null;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  let source = new XMLSerializer().serializeToString(clone);
  for (const [k, v] of Object.entries(CSS_VARS)) {
    source = source.replaceAll(`var(${k})`, v);
  }
  // strip any remaining var(...) references
  source = source.replace(/var\([^)]+\)/g, "#94a3b8");
  return { svg, source };
}

export function downloadSvg(name: string) {
  const res = inlineSvg();
  if (!res) throw new Error("Canvas SVG not found");
  const blob = new Blob([res.source], { type: "image/svg+xml;charset=utf-8" });
  download(`kk1-flow-${name || "graph"}.svg`, blob);
}

export async function downloadPng(name: string) {
  const res = inlineSvg();
  if (!res) throw new Error("Canvas SVG not found");
  const w = Number(res.svg.getAttribute("width")) || 1600;
  const h = Number(res.svg.getAttribute("height")) || 900;
  const svgBlob = new Blob([res.source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("SVG rasterization failed"));
      img.src = url;
    });
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");
    ctx.fillStyle = CSS_VARS["--background"];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("PNG encode failed"))),
        "image/png",
      ),
    );
    download(`kk1-flow-${name || "graph"}.png`, blob);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function toMermaid(payload: FlowGraphPayload): string {
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9_]/g, "_");
  const lines: string[] = [`flowchart LR`];
  lines.push(`  %% $-${payload.name} — trigger: ${payload.trigger}`);
  for (const n of payload.nodes) {
    const id = safe(n.id);
    const label = n.agent.replace(/"/g, "'");
    if (n.kind === "start" || n.kind === "end") lines.push(`  ${id}(["${label}"])`);
    else if (n.kind === "gate") lines.push(`  ${id}{{"${label}"}}`);
    else lines.push(`  ${id}["${label}"]`);
  }
  for (const e of payload.edges) {
    const arrow = e.type === "COND" ? "-.->|" : e.type === "LOOP" ? "==>|" : "-->|";
    const label = `${e.type}: ${e.label || "task"}`.replace(/"/g, "'");
    lines.push(`  ${safe(e.from)} ${arrow}${label}| ${safe(e.to)}`);
  }
  return lines.join("\n");
}

export function downloadMermaid(payload: FlowGraphPayload) {
  const blob = new Blob([toMermaid(payload)], { type: "text/plain;charset=utf-8" });
  download(`kk1-flow-${payload.name || "graph"}.mmd`, blob);
}

/* ---------- Shareable link (compact URL hash) ---------- */

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function gzip(str: string): Promise<Uint8Array> {
  if (typeof CompressionStream === "undefined") {
    return new TextEncoder().encode(str);
  }
  const cs = new CompressionStream("gzip");
  const stream = new Blob([str]).stream().pipeThrough(cs);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzip(bytes: Uint8Array): Promise<string> {
  if (typeof DecompressionStream === "undefined") {
    return new TextDecoder().decode(bytes);
  }
  const ds = new DecompressionStream("gzip");
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(ds);
  return await new Response(stream).text();
}

export async function encodeShareHash(payload: FlowGraphPayload): Promise<string> {
  const json = JSON.stringify(payload);
  const gz = await gzip(json);
  return `flow=${toBase64Url(gz)}`;
}

export async function decodeShareHash(hash: string): Promise<FlowGraphPayload | null> {
  const m = /(?:^|[#&?])flow=([A-Za-z0-9_-]+)/.exec(hash);
  if (!m) return null;
  try {
    const bytes = fromBase64Url(m[1]);
    const json = await gunzip(bytes);
    const parsed = JSON.parse(json);
    if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) return null;
    return parsed as FlowGraphPayload;
  } catch {
    return null;
  }
}

export async function buildShareUrl(payload: FlowGraphPayload): Promise<string> {
  const hash = await encodeShareHash(payload);
  const base = `${window.location.origin}/flow`;
  return `${base}#${hash}`;
}
