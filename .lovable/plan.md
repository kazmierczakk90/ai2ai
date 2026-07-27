
# Plan: KK1 Terminal podłączony do Gemini

Cel: okno czatu w KK1 (`/` Terminal) wysyła wiadomości do modelu Gemini przez Lovable AI Gateway zamiast do lokalnego FastAPI `http://localhost:8000`. Odpowiedzi renderowane bez zmian w Dual-Output Terminal z FUKO-LANG i Deep Reasoning.

## Zakres

- Tylko warstwa czatu (`sendMessageToCore`). Bez zmian w: MCP, Telegram, Architecture, AgentBoard, Emergency Stop, i18n, FUKO parser.
- Model: `google/gemini-3.1-pro-preview` (odpowiednik `gpt-5.5` z katalogu). Bez fast mode (Gemini nie wspiera).
- Domyślnie: bez streamingu (jedno wywołanie, jedna odpowiedź) — pasuje do obecnego UI.

## Zmiany

1. **Nowy server function** `src/lib/chat.functions.ts`
   - `sendChatMessage({ text, lang, history })` z `createServerFn({ method: "POST" })`.
   - Handler: czyta `process.env.LOVABLE_API_KEY`, tworzy provider przez helper z `ai-sdk-lovable-gateway`, woła `generateText` z:
     - system prompt: rola KK1 Core (FUKO-LANG, warstwy, styl command-center), instrukcja odpowiadania w języku `lang`, wymuszenie użycia symboli `@- #- $- !- /- &-` gdy adekwatne.
     - `messages`: krótka historia (ostatnie ~10) + nowy user turn.
     - `Output.object` (constraint-free) ze schemą `{ dialogue, w0_summary, w1_identity, fuko_decision, scoring: {confidence,risk,empathy,focus,energy,curiosity}, sda_routing: string[] }`; guard `NoObjectGeneratedError` z fallbackiem: cały tekst → `dialogue`, puste pola analytics.
   - Zwraca DTO w kształcie `BackendChatResponse` (dialogue + strategic_analysis) — istniejący adapter w `api.ts` przełoży go dalej.

2. **Nowy helper providera** `src/lib/ai-gateway.server.ts`
   - Dokładnie snippet z `ai-sdk-lovable-gateway` (`createLovableAiGatewayProvider`, run-id fetch). Import z `@ai-sdk/openai-compatible` i `ai`.

3. **`src/lib/api.ts`**
   - `sendMessageToCore` przełączone z `fetch("http://localhost:8000/api/v1/chat")` na `useServerFn(sendChatMessage)` wywołany imperatywnie (import funkcji i wywołanie `sendChatMessage({ data: {...} })` — TanStack pozwala na to spoza komponentu).
   - Zbudowanie `history` z aktualnych `messages` w `useKK1Store` (bierze `pickLocalized` do stringa w bieżącym `lang`).
   - Adapter DTO → `Message` / `StrategicAnalysis` bez zmian.
   - Event bus emit zachowany (`api.request`, `api.response`, `api.error`), tylko z etykietą `chat/gemini`.

4. **Zależności**
   - `bun add ai @ai-sdk/openai-compatible zod` (zod już jest).
   - `ai_gateway--create` — upewnić się, że `LOVABLE_API_KEY` istnieje.

5. **Bez zmian**
   - Terminal.tsx, DeepReasoning, FUKO parser, i18n, kontrakty typów Message/StrategicAnalysis.
   - Backend FastAPI zostaje jako artefakt (`backend/main.py`), po prostu nieużywany przez czat.

## Techniczne uwagi

- Server function jest publiczna (bez `requireSupabaseAuth`) — chat nie wymaga logowania. Rate-limit: brak własnego (zgodnie z rules); polegamy na gateway.
- Błędy: 429/402/5xx z gateway → rzucamy `Error` z message; Terminal ma już fallback catch (dopisuje user message lokalnie). Rozszerzę fallback, żeby pokazać jednorazowy system-message z komunikatem błędu (dialogue = "⚠️ Gateway error: …").
- Multi-język: `lang` przekazany do system promptu ("Reply in {en|pl|fr|es}."); wszystkie 4 języki obsłużone bez tłumaczeń po stronie klienta.
- `strategic_analysis.sda_routing` z modelu (lista nazw agentów jak `@ceo`, `@fuko_flow_agent`) — adapter już mapuje na obiekty z `latency_ms`.
