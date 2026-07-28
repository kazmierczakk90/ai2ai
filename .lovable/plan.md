# Plan: SOK Canvas — Środowisko Operacyjne KK1

Port the provided HTML mockup into the existing TanStack Start app as a new top-level tab `/sok`, wired to the existing Lovable AI Gateway (Gemini) via a server function. Reuse existing design tokens and `Shell` layout — no CDN Tailwind, no inline `<script>`, no client-side API keys.

## Scope

1. **New route** `src/routes/sok.tsx` — mounted inside `<Shell>`, own `head()` with unique title/description/OG, `sr-only` H1.
2. **Nav entry** — add "SOK" tab in `src/components/kk1/Layout.tsx` topbar alongside Command / Architecture / Flow / Connect / Import.
3. **Server function** `src/lib/sok.functions.ts`:
   - `analyzeSokIntent({ text, lang })` using `createLovableAiGatewayProvider` + `google/gemini-3.1-pro-preview` (same helper as `chat.functions.ts`).
   - `Output.object` with zod schema `{ priority, assignedAgent, category, verdict }`.
   - System prompt = Polish FUKO-FLOW orchestrator prompt from the mockup, extended to respect selected UI language (`en/pl/fr/es`) for the `verdict` field.
   - Emits `sok.intent.analyzed` on the event bus (server-side skipped; client emits after receiving result).
4. **UI components** under `src/components/kk1/sok/`:
   - `SokTerminal.tsx` — textarea + Przetwarzaj/Wyczyść buttons, loading spinner, result card (priority / agent pill / category / verdict). Uses `FukoText` to auto-render `@agent`/`#tool`/`$process` tokens in the verdict.
   - `PriorityHierarchy.tsx` — P0–P3 cards (red/amber/blue/slate borders), open shadcn `Dialog` on click.
   - `CognitiveLayers.tsx` — W0–W6 rows; W1/W2/W5 highlighted, W5 uses existing `pulse-border` style (add to `styles.css` if missing).
   - `KnowledgeGraphModels.tsx` — 5 model cards (Psychological / Decision / Business / Creative / Risk) + telemetry footer (DRIFT_TOLERANCE / STATE_PERSISTENCE / EMOTION_TRACES).
   - `SokInfoDialog.tsx` — shared shadcn `Dialog` driven by a small `useState` map matching `modalData` from the mockup.
5. **i18n** — add `sok.*` keys (title, subtitle, priority/layer/model labels, button labels) to `src/i18n/i18n.ts` for EN/PL/FR/ES; page reads via existing `useT()`.
6. **Styling** — use existing Tailwind v4 tokens (`bg-slate-900/80`, `border-blue-500/30`, etc.). Add `glass-card`, `pulse-border`, `animate-spin-slow` utilities to `src/styles.css` if not already present. Fonts (Inter/Fira Code) — reuse whatever the app already loads; do not add remote `@import` in CSS.
7. **Event bus** — emit `sok.intent.submitted` and `sok.intent.analyzed` from client so the existing `EventLog` picks them up.
8. **SEO** — add `/sok` to `src/routes/sitemap[.]xml.ts`.

## Explicitly out of scope

- No client-side Gemini API key, no direct `generativelanguage.googleapis.com` fetch.
- No CDN Tailwind or Font Awesome — reuse Lucide icons already in the project.
- No changes to existing Terminal / Flow / Architecture routes.

## Technical notes

- Follow `chat.functions.ts` pattern exactly: `createServerFn({method:"POST"}).inputValidator(zod).handler(...)`, read `LOVABLE_API_KEY` inside handler.
- Client calls the server fn via `useServerFn` inside `useMutation` (TanStack Query already installed).
- Result card uses semantic tokens; priority color derived from `priority` string prefix (`P0`→red, `P1`→amber, `P2`→blue, `P3`→slate).
- Dialog content comes from a typed `Record<ModalKey, {title, body: ReactNode}>` map; no `dangerouslySetInnerHTML`.

## File tree

```text
src/
  routes/sok.tsx                          (new)
  lib/sok.functions.ts                    (new)
  components/kk1/sok/
    SokTerminal.tsx                       (new)
    PriorityHierarchy.tsx                 (new)
    CognitiveLayers.tsx                   (new)
    KnowledgeGraphModels.tsx              (new)
    SokInfoDialog.tsx                     (new)
  components/kk1/Layout.tsx               (edit — add nav item)
  i18n/i18n.ts                            (edit — add sok.* keys)
  styles.css                              (edit — glass-card/pulse-border if missing)
  routes/sitemap[.]xml.ts                 (edit — add /sok)
```
