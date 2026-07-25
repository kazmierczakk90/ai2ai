## Cel
Nowa zakładka **Chat Import** w KK1 Core: przyjmuje wiadomości z Telegrama (live przez konektor Lovable), backend FastAPI wykonuje auto-tagowanie FUKO na poziomie słów, panel wyświetla wiadomości z inline-podświetleniem "słowo → znacznik".

## 1. Konektor Telegram
- Wywołanie `standard_connectors--connect` z `connector_id: telegram` (osobny krok, wymaga potwierdzenia użytkownika).
- Po podpięciu dostępne env: `LOVABLE_API_KEY`, `TELEGRAM_API_KEY` w runtime.

## 2. Backend FastAPI (`backend/main.py`)
Nowe endpointy:
- `POST /api/v1/telegram/webhook` — odbiera update'y Telegrama, weryfikuje `X-Telegram-Bot-Api-Secret-Token` (SHA-256 z `TELEGRAM_API_KEY`), zapisuje wiadomość w pamięci procesu (lista + dict po `chat_id`), uruchamia tagger, emituje event.
- `GET /api/v1/telegram/messages?since=<id>` — long-poll / prosty polling dla frontu; zwraca wiadomości + tagi.
- `POST /api/v1/telegram/tag` — pojedyncza wiadomość → lista `{start, end, word, tag, confidence, symbol}`.

Tagger (Pydantic model `TaggedToken`):
- Tokenizacja + heurystyki + LLM-lite (na start słownik + reguły; strukturalny output gotowy pod swap na model).
- Mapowanie tagów na 6 symboli FUKO: `agent`, `funkcja`, `proces`, `wytyczne`, `umiejętność`, `warunek`.

## 3. Rejestracja webhooka (sandbox, po podpięciu konektora)
Skrypt uruchamiany raz przez `code--exec`:
- Wylicz `secret_token = base64url(sha256("telegram-webhook:" + TELEGRAM_API_KEY))`.
- `POST https://connector-gateway.lovable.dev/telegram/setWebhook` z URL `https://project--<id>-dev.lovable.app/api/public/telegram/webhook` (proxy → lokalny backend przez fetch server route) **albo** bezpośrednio na publiczny tunel FastAPI, jeśli użytkownik go ma. Domyślnie: proxy przez server route TanStack, która forwarduje do `http://localhost:8000`.

## 4. Frontend — nowa zakładka
- `src/routes/import.tsx` — nowa trasa `/import` z head() i własnym title/description.
- `src/components/kk1/Layout.tsx` — dodać link "Chat Import" w topbarze obok "Command" / "Architecture".
- `src/components/kk1/ChatImport.tsx`:
  - Lewy panel: lista rozmów (chat_id → ostatnia wiadomość, licznik, status webhook).
  - Prawy panel: wiadomości wybranej rozmowy, każda z:
    - autor, timestamp, surowy tekst,
    - **inline-podświetlenie**: renderer bierze `tokens` z backendu i owija otagowane słowa w kolorowe chipy (te same style co `FukoText`, ale bazowane na offsetach zamiast na regexie),
    - tooltip: `tag`, `confidence`, `symbol`, sugerowana forma FUKO (np. `@-analyzer`).
  - Toolbar: filtr po tagu, przycisk "Retag" (ponowne wywołanie `/api/v1/telegram/tag`), status webhooka (OK/rekonfiguracja).

## 5. API proxy (`src/lib/api.ts`)
Nowe funkcje:
- `fetchTelegramMessages(sinceId?)` → GET `/api/v1/telegram/messages`.
- `retagMessage(id)` → POST `/api/v1/telegram/tag`.
- `fetchWebhookStatus()` → GET `/api/v1/telegram/status`.
Każde wywołanie emituje event na Event Bus (`telegram.messages.fetched`, `telegram.tag.updated`).

## 6. Zustand store
- `src/store/telegram-store.ts` — `messages[]`, `byChat`, `selectedChatId`, `polling`, `webhookStatus`, akcje `startPolling/stopPolling/select/retag`.
- Poll co 3 s gdy widok aktywny; auto-stop po opuszczeniu trasy.

## 7. Renderer inline-tagów
- `src/components/kk1/TaggedText.tsx` — przyjmuje `text` + `tokens[]`, składa fragmenty w kolejności offsetów, dla każdego tokena renderuje odpowiedni chip (reuse stylów z `FukoText`).
- Fallback: gdy brak tokenów → zwykły `FukoText` (regex FUKO na już-otagowanych treściach).

## 8. i18n
Dodać klucze (EN/PL/FR/ES) dla: "Chat Import", "Conversations", "Retag message", "Webhook active", "No messages yet", tooltipów tagów.

## 9. Bezpieczeństwo
- Webhook: timing-safe compare secret tokena; walidacja payloadu Pydantic; upsert po `update_id` (idempotencja).
- Frontend: sanitizacja tekstu (React już escapuje), limity długości w tooltipach.

## Sekcja techniczna
- Nowe pliki: `src/routes/import.tsx`, `src/components/kk1/ChatImport.tsx`, `src/components/kk1/TaggedText.tsx`, `src/store/telegram-store.ts`, rozbudowa `backend/main.py`.
- Zmodyfikowane: `src/components/kk1/Layout.tsx` (nav), `src/lib/api.ts` (3 nowe funkcje), `src/i18n/i18n.ts` (klucze), `src/store/kk1-store.ts` (bez zmian struktury, ewentualnie eventy).
- Konektor Telegram podpinany osobno przez `standard_connectors--connect` — poproszę Cię o zatwierdzenie karty w chacie.
- Rejestracja webhooka: pojedyncze `curl` w sandboxie po podpięciu konektora.

## Kolejność wykonania
1. Podpięcie konektora Telegram (osobna karta).
2. Rozbudowa backendu FastAPI (webhook + tagger + listy).
3. Rejestracja webhooka przez gateway.
4. Frontend: store, API, komponenty, trasa, nav, i18n.
5. Test end-to-end: wysłanie wiadomości do bota → pojawia się w `/import` z podświetlonymi tagami.