# Plan: Katalog umiejętności KK1 Core + procesy per warstwa

## Cel
Zebrać w jedno miejsce WSZYSTKIE umiejętności (skille) opisane w źródłach projektu, policzyć je, pogrupować per warstwa architektury KK1, a następnie zaprojektować **5 procesów PDL** — po jednym na każdą warstwę — które te skille realnie wykorzystują.

## Źródła prawdy (do przeczytania w fazie inwentaryzacji)
1. `KK1_MASTER_ARCHITECTURE.md` (Google Doc, ~5131 linii) — pełne profile agentów, ich `capabilities` i `skills`.
2. `#AKRUSZ GEMINI` (Google Sheet) — katalog ~50 agentów z przypisanymi skillami/rolami i protokół `#tabela`.
3. Skill `karol-process-designer` (już w repo) — bazowe 10 skilli operacyjnych: `kb-query`, `kb-write`, `agent-ask`, `agent-broadcast`, `opinion-engine`, `agent-consensus`, `chain-of-thought-log`, `task-delegation`, `context-sync`, `realtime-monitor`.
4. Kod repo (`src/store/kk1-store.ts`, `AgentBoard.tsx`, `telegram-store.server.ts`) — skille faktycznie zaimplementowane w UI/backendzie.

## Deliverable (2 pliki)

### 1. `/mnt/documents/kk1-skills-catalog.md` — Pełny katalog
Struktura:
```
# Katalog umiejętności KK1 Core

## Podsumowanie liczbowe
- Skille z KK1_MASTER_ARCHITECTURE.md: N1
- Skille z #AKRUSZ GEMINI:              N2
- Skille z karol-process-designer:      10
- Skille zaimplementowane w kodzie:     N3
- Unikalne skille (po deduplikacji):    N
- Agenci ogółem:                        47

## Skille per warstwa (5 warstw KK1)
### Warstwa Cognitive
| Skill | Opis | Input | Output | Właściciel (agent) | Źródło |
### Warstwa System
...
### Warstwa Execution
...
### Warstwa Emotional
...
### Warstwa Strategic
...

## Mapa: agent → skille
(tabela 47 agentów × ich skille)

## Skille duplikaty / aliasy
(gdy ten sam skill występuje pod różnymi nazwami w źródłach)
```

### 2. `/mnt/documents/kk1-processes-per-layer.md` — 5 procesów PDL

Każdy proces w formacie z `karol-process-designer` (KROK 4): nazwa, trigger, czas, kroki numerowane, typ (SEQ/PAR/COND/LOOP/GATE), agent → skill, wejście/wyjście, exit conditions.

**Proces 1 — Warstwa Cognitive: `$deep-reasoning-consensus`**
Trigger: nowa decyzja strategiczna. Wykorzystuje: `kb-query`, `opinion-engine`, `agent-consensus`, `chain-of-thought-log`. Aktorzy: `@analyzer`, `@critic`, `@evaluator`, `@mentor`, `@ceo`. Wzorzec: SEQ → PAR (3 opinie) → COND (consensus > 0.7?) → LOOP (jeśli nie) → SEQ (zapis).

**Proces 2 — Warstwa System: `$fuko-ingestion-pipeline`**
Trigger: przychodząca wiadomość Telegram/webhook. Wykorzystuje: `/intent-extraction`, `/protocol-parsing`, `#parse_intent`, `context-sync`, `realtime-monitor`. Aktorzy: `@fuko_flow_agent`, `@ram_agent`, `@router`, `@guardian-core`. Wzorzec: SEQ×4 → GATE (guardrail check) → SEQ.

**Proces 3 — Warstwa Execution: `$arbitrage-decision-loop`**
Trigger: cron `*/15 min`. Wykorzystuje: `/market-analysis`, `#calculate_roi`, `task-delegation`, `kb-write`. Aktorzy: `@arbitrage_agent`, `@data-ops`, `@todo`, `@impact-tracker`. Wzorzec: LOOP (skan) → COND (ROI > 15%) → SEQ (execute) → SEQ (log).

**Proces 4 — Warstwa Emotional: `$empathy-6d-scoring`**
Trigger: nowa wiadomość operatora. Wykorzystuje: `opinion-engine`, `/natural-language-routing`, `agent-ask`. Aktorzy: `@mentor`, `@narrator`, `@support`, `@voice-core`. Wzorzec: PAR (6 wymiarów: Confidence/Risk/Empathy/Focus/Energy/Curiosity) → SEQ (agregat) → COND (energy < 0.3 → route do @mentor).

**Proces 5 — Warstwa Strategic: `$ceo-weekly-orchestration`**
Trigger: cron poniedziałek 09:00. Wykorzystuje: `kb-query`, `agent-broadcast`, `agent-consensus`, `chain-of-thought-log`, `task-delegation`, `kb-write`. Aktorzy: `@ceo`, `@product`, `@controlling`, `@architect`, `@passport`. Wzorzec: SEQ (audyt) → PAR (opinie 4 agentów) → GATE (zatwierdzenie) → SEQ×3 (roadmap, ADR, delegacja).

## Kroki wykonania (w trybie build)

1. **Fetch** — pobrać przez connector `google_drive`/`google_sheets` pełny tekst `KK1_MASTER_ARCHITECTURE.md` i pełną zawartość arkusza `#AKRUSZ GEMINI` (wszystkie zakładki, nie tylko podsumowanie).
2. **Parse** — wyciągnąć skille regexem/strukturalnie z profili agentów (`skills:`, `capabilities:`, `/-nazwa`, `#-nazwa-`).
3. **Deduplikacja** — połączyć aliasy (np. `intent-extraction` vs `/intent-extraction` vs `#parse_intent`).
4. **Klasyfikacja per warstwa** — użyć mapowania agent→warstwa z `src/store/kk1-store.ts` (już mamy 47 agentów × 5 warstw) i zdziedziczyć warstwę skilla po jego głównym właścicielu.
5. **Wygenerować oba pliki .md** do `/mnt/documents/` i wystawić jako `<presentation-artifact>`.
6. **Podsumować** — podać końcową liczbę unikalnych skilli (N) w chacie.

## Czego NIE robię (w tym planie)
- Nie zmieniam UI ani kodu aplikacji — to czysty deliverable dokumentowy.
- Nie uruchamiam procesów — projektuję je zgodnie z `karol-process-designer` KROK 4 (prezentacja przed uruchomieniem).
- Nie tworzę procesu per skill (Twój wybór: "zgrupowane per warstwa" = 5 procesów).

## Ryzyka / założenia
- Realną liczbę N poznam dopiero po sparsowaniu Google Doc (5131 linii). Szacunek wstępny: **35–60 unikalnych skilli** po deduplikacji.
- Jeśli `#AKRUSZ GEMINI` ma zakładki, których wcześniej nie odczytałem, liczba może wzrosnąć — plik zostanie odczytany w całości w kroku 1.
