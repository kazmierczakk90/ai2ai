
## Analiza uploadów

| Plik | Zawartość | Wykorzystanie |
|---|---|---|
| `agent_code_system_prompt.md.docx` | Spec agenta **@code** — Edukator/Egzekutor z formatem `[EDU][PLAN][KROK][NEXT]` + tryby `/cisza /deep /schema /skip /why`, kontekst KK1 Core v2.0 (W0-W6, FUKO-FLOW 7-punktowy, 6D weights: leverage 0.25, monopoly 0.20, compound 0.20, ecosystem 0.15, data 0.10, asset 0.10) | Nowy agent-tryb w Terminalu |
| `w2_routing.py` | **SDA (Strategic Decision Architecture) Router** — macierz decyzyjna: 15 reguł w 5 domenach (Ingestion/Decisions/Execution/Memory/Optimization), routing 3-etapowy: exact `@agent` → keyword scoring → FUKO fallback, per-reguła: `domain/actor/impact_area(W0-W6)/priority(1-10)/strategy(leverage\|monopol\|compound\|ecosystem\|data\|asset)` | Warstwa preprocessingu wiadomości przed Gemini |
| `agent_orchestrator.py` | State-machine agentów: `REGISTERED→IDLE→ASSIGNED→RUNNING→COMPLETED/ERROR→REPORTING→ARCHIVED` + heartbeat 5s + retry (max 3) + auto-restart po 16s bezczynności | Rozszerzenie AgentBoard |
| `Architektura_technologiczna.docx` | **Uszkodzony** (nie dekompresuje) | Pominąć, poprosić user o re-upload jeśli krytyczny |

## Trzy propozycje aktualizacji

### 1) SDA Router w preprocessingu wiadomości (największa wartość)

Warstwa "W2 Routing" analizuje każde wejście operatora **zanim** trafi do Gemini i przypina metadane:
- **`src/lib/sda/matrix.ts`** — port macierzy z Pythona (15 reguł × 5 domen), typy `SDA_Rule` i `SDARoutingDecision`, słowniki PL/EN keywordów (używam istniejącego `i18n`).
- **`src/lib/sda/router.ts`** — funkcja `routeSda(input, lang)` z pipeline: exact `@agent` → keyword scoring (Jaccard) → fallback `@system-admin`, próg `0.3`.
- **`src/lib/chat.functions.ts`** — przed `generateText` wywołujemy `routeSda`, wynik wstrzykujemy do `system` prompt jako `SDA_ROUTING_HINT` (domain, actor, impact_area, priority, strategy, confidence) → Gemini uwzględnia to w `fuko_decision` i `sda_routing`.
- **`src/components/kk1/DeepReasoning.tsx`** — nowy panel **"SDA Routing Matrix"** (piąty kafelek) pokazujący dopasowaną regułę, confidence bar i routing_type badge.
- **`src/lib/event-bus.ts`** — nowy typ `sda.decision` emitowany per wiadomość.
- Persystencja w `localStorage` (namespace `kk1.sda.matrix`) — zastępuje SQLite z Pythona, z możliwością eksportu do JSON.

### 2) Nowy tryb agenta **@code** w Terminalu

- **`src/lib/agents/code-agent.ts`** — system-prompt agenta `@code` (przetłumaczony z docx) z formatem `[EDU][PLAN][KROK][NEXT]`, trybami `/cisza /deep /schema /skip /why /koniec`, kontekstem W0-W6 i wagami 6D.
- **`src/lib/chat.functions.ts`** — router promptów: jeśli wiadomość zaczyna się od `@code` → używa `codeAgentSystemPrompt` zamiast domyślnego process-designer, inne zaczyna standardowo.
- **`src/store/kk1-store.ts`** — nowy stan `codeSession: { schema: Step[], currentStep, silentMode }`, akcje `markStepDone/skipStep/toggleSilent`.
- **`src/components/kk1/Terminal.tsx`** — pasek trybu "AGENT: @code" gdy aktywny, licznik kroków `3/12`, przyciski `/deep /why /cisza`.
- **`src/components/kk1/CodeSchemaPanel.tsx`** (nowy) — sidebar/tab pokazujący `schemat_NAZWA.md` z checkboxami `[DONE]/[NOW]/[TODO]/[SKIP]/[BLOCKED]`.

### 3) State-Machine w AgentBoard

- **`src/store/kk1-store.ts`** — rozszerzenie typu `Agent`:
  ```ts
  state: 'REGISTERED'|'IDLE'|'ASSIGNED'|'RUNNING'|'COMPLETED'|'ERROR'|'REPORTING'|'ARCHIVED';
  lastHeartbeat: number;
  retries: number;
  maxRetries: 3;
  ```
- **`src/lib/orchestrator.ts`** — port `Orchestrator` z Pythona: `useEffect`-driven heartbeat pulse co 5s + `monitor_agents` co 10s (auto-restart po 16s stale). Uruchamiany w `Shell`.
- **`src/lib/event-bus.ts`** — nowe typy: `agent.state.transitioned`, `agent.heartbeat.missed`, `agent.retry`.
- **`src/components/kk1/AgentBoard.tsx`** — kolorowe pigułki per-state (7 stanów zamiast 3), tooltip z `lastHeartbeat` i `retries`, animacja pulse przy `RUNNING`.
- **`src/components/kk1/Architecture.tsx`** — nowy panel **"State Machine Telemetry"** w zakładce AGI 10.0 z live-count per state.

## Kolejność wdrożenia
1. SDA Router (izolowana warstwa, największy zysk analityczny) — 1 batch: `matrix.ts`, `router.ts`, `chat.functions.ts` patch, `DeepReasoning.tsx` panel, event bus, testy.
2. State-Machine (rozszerza istniejący store i AgentBoard) — 1 batch: store, orchestrator, AgentBoard, event bus.
3. Agent `@code` (największa zmiana UX, wymaga panelu schematu) — 1 batch: code-agent.ts, chat.functions.ts routing, store session, Terminal UI, CodeSchemaPanel.

Po każdym batch — `tsgo` typecheck.

## Poza zakresem
- Backend SQLite (`w2_routing.py` persistuje w `~/.kk1-core-v2/sda_routing.db`) — zastępuję localStorage (frontendowa aplikacja).
- `Architektura_technologiczna.docx` uszkodzony — pominięty; jeśli krytyczny, poproszę o re-upload po planie.
- Integracja z Telegram Bot / Crostini deployment z docx `@code` — to instrukcje wdrożeniowe dla operatora, nie funkcje aplikacji web.

Zatwierdź plan, żebym wszedł w tryb build i wdrożył kolejno etapy 1→2→3.
