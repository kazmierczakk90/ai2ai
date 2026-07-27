# Podłączenie KK1 Core → Gemini Enterprise

W workspace nie ma jeszcze połączenia `gemini_enterprise` — najpierw je linkujemy, potem budujemy warstwę server + UI.

## 1. Connector (jedno kliknięcie)
- Wywołanie `standard_connectors--connect(connector_id: "gemini_enterprise")` — użytkownik wybiera konto GCP, projekt, lokalizację i engine ID w karcie w czacie.
- Po zlinkowaniu zapisze się `GEMINI_ENTERPRISE_API_KEY` oraz konfiguracja projekt/lokalizacja/engine (odczytane server-side przez `get_connection_configuration`).

## 2. Wybór trybu zapytań
KK1 Core to command-center z terminalem + widokiem architektury. Proponuję **oba** endpointy Gemini Enterprise, bo mapują się 1:1 na istniejące widoki:

- **`streamAssist`** → Terminal (Dual-Output). Odpowiedzi Gemini + citations lądują jako `dialogue`, a `textGroundingMetadata` + reasoning chunks jako `strategic_analysis` (W0 = query, W1 = grounding decisions, SDA routing = kolejność referencji).
- **`search`** → nowa mini-sekcja "Grounded Search" w Chat Import / Command (ranked hits z filtrami).

Zaczniemy od `streamAssist` (główny use-case), `search` dodam w tym samym planie jako drugi krok.

## 3. Server (TanStack)
Nowy plik `src/lib/gemini.functions.ts`:
- `askGemini` — `createServerFn({ method: "POST" })` + `.middleware([requireSupabaseAuth])` (żeby chronić credits konta GCP klienta).
- Wewnątrz handlera: `process.env.LOVABLE_API_KEY` + `process.env.GEMINI_ENTERPRISE_API_KEY`, POST do `https://connector-gateway.lovable.dev/gemini_enterprise/v1alpha/{assistant}:streamAssist`.
- Parser: **depth-tracking brace parser** dla JSON-array streamu (zgodnie z gemini_enterprise knowledge — NIE NDJSON), merge chunków z 3 przypadkami (superset / partial overlap / append), filtrowanie `thought:true`.
- Obsługa `state: "SKIPPED"` → zwracam fallback message.
- Response: `{ answer: string (markdown), references: [{title, uri, snippet}], sessionId }`.
- Second server fn `geminiSearch` (opcjonalnie w drugiej iteracji) → POST `/v1/{servingConfig}:search`.

Konfiguracja (project/location/engine) czytana raz na starcie handlera z env wariantów `VITE_LOVABLE_CONNECTOR_GEMINI_ENTERPRISE_*` (non-secret fields z connect'a).

## 4. Frontend
- `src/lib/api.ts` — nowa funkcja `askGeminiEnterprise(text, sessionId?)` używająca `useServerFn`.
- `src/store/kk1-store.ts` — akcja `sendToGemini`: emituje event `gemini.query.sent` / `gemini.answer.received`, dopisuje wiadomość do terminala z `strategic_analysis` zbudowanym z citations (grounding references → lista źródeł w Deep Reasoning UI, sekcja "Grounding Sources").
- `src/components/kk1/Terminal.tsx` — toggle w kompozerze: **[KK1 Core] / [Gemini Enterprise]** (radio pill). Wybór routuje wysyłkę do `sendMessageToCore` albo `askGeminiEnterprise`.
- `src/i18n/i18n.ts` — nowe klucze `gemini.*` (EN/PL/FR/ES): label toggla, "Grounded by Gemini", "Skipped by Gemini (non-query)", "Sources".
- Markdown renderer dla `answer` (już mamy `react-markdown`? — jeśli nie, dodaję `react-markdown` w kroku instalacji).

## 5. Bez zmian
- MCP server, Telegram ingestion, backend FastAPI, agent board, architecture dashboard — nietknięte.
- Emergency stop / shortcut manager — nietknięte.

## Szczegóły techniczne

**Endpointy (przez connector gateway):**
```
POST /gemini_enterprise/v1alpha/projects/{P}/locations/{L}/collections/default_collection/engines/{E}/assistants/default_assistant:streamAssist
POST /gemini_enterprise/v1/projects/{P}/locations/{L}/collections/default_collection/engines/{E}/servingConfigs/default_search:search
```
Nagłówki: `Authorization: Bearer $LOVABLE_API_KEY`, `X-Connection-Api-Key: $GEMINI_ENTERPRISE_API_KEY`.

**Body streamAssist (multi-turn):**
```json
{ "query": {"text": "..."}, "toolsSpec": {"vertexAiSearchSpec": {}}, "session": "<optional path>" }
```

**Ograniczenia (z knowledge Gemini Enterprise):**
- Akcje (send email, create issue) są dostępne tylko w konsoli GCP, nie przez API — nie wystawiamy tego w UI.
- Website data stores nie działają w Gemini Enterprise search/assistant.
- Billing idzie na projekt GCP klienta (nie Lovable).

## Do potwierdzenia po zatwierdzeniu planu
Po `connect` odczytam GCP project ID / location / engine ID z konfiguracji połączenia (`get_connection_configuration`) — nie muszę Cię o nie pytać.
