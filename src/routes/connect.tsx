import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, Check, ExternalLink, Terminal as TerminalIcon } from "lucide-react";
import { Shell } from "@/components/kk1/Layout";

const APP_NAME = "KK1 Core";
const APP_SLUG = "kk1-core";

export const Route = createFileRoute("/connect")({
  head: () => ({
    meta: [
      { title: "Agent integrations — KK1 Core" },
      { name: "description", content: "Connect ChatGPT, Claude, Claude Code, or any MCP-capable AI assistant to the KK1 Core MCP server." },
      { property: "og:title", content: "Agent integrations — KK1 Core" },
      { property: "og:description", content: "Point your AI assistant at KK1 Core's MCP server and refresh it when the app changes." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ai2ai.lovable.app/connect" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ai2ai.lovable.app/connect" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "How do I connect KK1 Core to ChatGPT?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Open ChatGPT Settings → Connectors → Advanced, enable Developer mode, click Create app, name the connector, and paste the KK1 Core MCP URL.",
              },
            },
            {
              "@type": "Question",
              name: "How do I connect KK1 Core to Claude?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "In Claude's Connectors page, click Add custom connector, name it, and paste the KK1 Core MCP URL, then approve the OAuth flow.",
              },
            },
            {
              "@type": "Question",
              name: "How do I connect KK1 Core to Claude Code?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Run `claude mcp add --scope user --transport http kk1-core <MCP_URL>` in your terminal, then start Claude Code and run /mcp to confirm the connection.",
              },
            },
          ],
        }),
      },
    ],
  }),
  component: ConnectPage,
});

function ConnectPage() {
  const [mcpUrl, setMcpUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setMcpUrl(new URL("/mcp", window.location.origin).toString());
    }
  }, []);

  const claudeDeepLink = mcpUrl
    ? `https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=${encodeURIComponent(APP_NAME)}&connectorUrl=${encodeURIComponent(mcpUrl)}`
    : "#";
  const claudeCodeCmd = mcpUrl
    ? `claude mcp add --scope user --transport http ${APP_SLUG} '${mcpUrl.replace(/'/g, "'\\''")}'`
    : "";

  return (
    <Shell>
      <div className="min-h-0 flex-1 overflow-y-auto bg-background">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <header className="mb-6">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              /-integration · agent-connect
            </div>
            <h1 className="mb-2 text-2xl font-bold text-foreground">Connect an AI assistant to {APP_NAME}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              KK1 Core exposes its FUKO tagger, Telegram inbox and system status through the Model Context Protocol.
              Paste the URL below into ChatGPT or Claude, or run the one-line command in Claude Code.
            </p>
          </header>

          <section className="mb-8 rounded-lg border border-primary/40 bg-primary/5 p-4">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-primary">
              MCP server URL
            </div>
            <UrlBox value={mcpUrl} />
            <p className="mt-2 font-mono text-[10px] text-muted-foreground">
              Uses the current origin — always matches this deployment.
            </p>
          </section>

          <Section title="Connect" subtitle="One-time setup per assistant">
            <ClientCard title="ChatGPT" number="1">
              <Step>
                Open{" "}
                <ExternalA href="https://chatgpt.com/#settings/Connectors/Advanced">
                  Settings → Connectors → Advanced
                </ExternalA>{" "}
                and enable <b>Developer mode</b>. If it isn't available, ask a ChatGPT admin to enable it.
              </Step>
              <Step>Click <b>Create app</b> next to the back button.</Step>
              <Step>Give the connector a name and paste the MCP URL above.</Step>
              <Step>Click <b>Create</b>.</Step>
              <Step>Enable the app from the chat composer, then ask ChatGPT to use {APP_NAME}.</Step>
            </ClientCard>

            <ClientCard title="Claude" number="2">
              <Step>
                Open the prefilled dialog:{" "}
                <ExternalA href={claudeDeepLink}>Add {APP_NAME} to Claude</ExternalA>.
              </Step>
              <Step>Review the details and click <b>Add</b>.</Step>
              <Step>
                If the prefilled form doesn't open, go to Claude's <b>Connectors</b> page, choose{" "}
                <b>Add custom connector</b>, then name it and paste the MCP URL above.
              </Step>
              <Step>Enable the connector from the chat composer, then ask Claude to use {APP_NAME}.</Step>
            </ClientCard>

            <ClientCard title="Claude Code" number="3">
              <Step>Run this command in a terminal — it installs the connection for all your Claude Code sessions:</Step>
              <CodeBlock value={claudeCodeCmd} />
              <Step>Start Claude Code and run <Kbd>/mcp</Kbd> to confirm {APP_NAME} is connected.</Step>
              <Step>Ask Claude Code to use {APP_NAME}.</Step>
            </ClientCard>

            <ClientCard title="Other MCP clients" number="4">
              <Step>Open the client's MCP server or custom connector settings.</Step>
              <Step>Create a new remote MCP server connection.</Step>
              <Step>Name it and paste the MCP URL above.</Step>
              <Step>Finish any sign-in or authorization prompts.</Step>
              <Step>Enable the connection, then ask the assistant to use {APP_NAME}.</Step>
            </ClientCard>
          </Section>

          <Section title="Refresh after the app changes" subtitle="Connected assistants cache the tool list — refresh to pick up new tools">
            <ClientCard title="ChatGPT" number="1">
              <Step>Open ChatGPT's app preferences and pick {APP_NAME} under <b>Enabled apps</b>.</Step>
              <Step>Next to <b>Information</b>, click <b>Refresh</b>.</Step>
              <Step>If the URL changed, paste the latest URL from above.</Step>
              <Step>Start a new chat and ask ChatGPT to use {APP_NAME}.</Step>
            </ClientCard>

            <ClientCard title="Claude" number="2">
              <Step>Open the <b>Connectors</b> page and select {APP_NAME}.</Step>
              <Step>Refresh or update the connector's tools.</Step>
              <Step>If the URL changed, paste the latest URL from above.</Step>
              <Step>Ask Claude to use {APP_NAME}.</Step>
            </ClientCard>

            <ClientCard title="Claude Code" number="3">
              <Step>Start a new Claude Code session — it loads the latest tools on connect.</Step>
              <Step>
                If the URL changed, run <Kbd>claude mcp remove {APP_SLUG}</Kbd>, then run the install command again with the latest URL.
              </Step>
              <Step>Ask Claude Code to use {APP_NAME}.</Step>
            </ClientCard>

            <ClientCard title="Other MCP clients" number="4">
              <Step>Open the client's MCP server or connector settings.</Step>
              <Step>Select the connection created for {APP_NAME}.</Step>
              <Step>Refresh the tool list, reload the server, or reconnect it.</Step>
              <Step>If the URL changed, paste the latest URL from above.</Step>
              <Step>Start a new chat or session and ask the assistant to use {APP_NAME}.</Step>
            </ClientCard>
          </Section>
        </div>
      </div>
    </Shell>
  );
}

function UrlBox({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }
  return (
    <div className="flex items-stretch gap-2">
      <code className="flex-1 truncate rounded border border-border bg-background/60 px-3 py-2 font-mono text-sm text-primary">
        {value || "loading…"}
      </code>
      <button
        onClick={copy}
        disabled={!value}
        className="flex items-center gap-1.5 rounded border border-primary/60 bg-primary/10 px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-primary hover:bg-primary/20 disabled:opacity-40"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "copied" : "copy"}
      </button>
    </div>
  );
}

function CodeBlock({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }
  return (
    <div className="my-2 flex items-stretch gap-2">
      <pre className="flex-1 overflow-x-auto rounded border border-border bg-background/70 px-3 py-2 font-mono text-[12px] text-foreground">
        <span className="text-muted-foreground">$ </span>
        {value || "…"}
      </pre>
      <button
        onClick={copy}
        disabled={!value}
        className="flex shrink-0 items-center gap-1.5 rounded border border-border bg-background/60 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:border-primary/40 hover:text-foreground disabled:opacity-40"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "copied" : "copy"}
      </button>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-1 text-lg font-semibold text-foreground">{title}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{subtitle}</p>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
}

function ClientCard({ title, number, children }: { title: string; number: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-panel p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded border border-primary/40 bg-primary/10 font-mono text-[10px] text-primary">
          {number}
        </span>
        <h3 className="flex items-center gap-1.5 font-mono text-sm font-semibold text-foreground">
          {title === "Claude Code" && <TerminalIcon className="h-3.5 w-3.5 text-muted-foreground" />}
          {title}
        </h3>
      </div>
      <ol className="space-y-2 text-sm text-foreground">{children}</ol>
    </div>
  );
}

let stepCounter = 0;
function Step({ children }: { children: React.ReactNode }) {
  stepCounter++;
  return (
    <li className="flex gap-2 leading-relaxed">
      <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">›</span>
      <span className="flex-1">{children}</span>
    </li>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded border border-border bg-background/60 px-1.5 py-0.5 font-mono text-[11px] text-primary">
      {children}
    </code>
  );
}

function ExternalA({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-0.5 text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
    >
      {children}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}
