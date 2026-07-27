
# Analiza Drive → propozycja aktualizacji KK1 Core

## Co jest w folderze `repo-audit-target`

Kluczowe dokumenty (Google Docs, zaciągnięte i przeczytane):

- **SYSTEM_ANALYSIS_REPORT.md** — audyt legacy „Karol‑Core AGI” (warstwy P0‑P3, AGI 10.0). Wskazuje 8 problemów (duplikacja orchestration engine, izolowane P0‑P3, brak Event Busa, brak unified state, brak scheduled telemetry, brak scenariuszy).
- **OPTIMIZATION_SUMMARY.md** — docelowa architektura: `eventBus`, `centralStateManager`, **3 bridges**: Guardian↔Recalibration, Influence↔LoadBalancer, Style↔Memory + replay eventów i time‑travel debug.
- **FUNCTIONAL_SPECIFICATION.md** — pełny kontrakt UX: **F1‑F12**, **Ctrl+1..5**, **Alt+S/A/R/M/V**, **Ctrl+Shift+E/R/S**, komendy głosowe PL (`aktywuj agenta`, `zmień styl`, `status systemu`, `stop awaryjny`), 4 scenariusze FUKO‑PZK (Senior Health Check, Lead Nurturing, System Optimization, Emergency Response), progi KPI (Sales < 70%, Engagement < 60%, Perf < 85%).
- COMMANDS.md, karol_core_full_structure, karol_core_71_opisy, manifest.intelligence.karol.md — powielają katalog komend i modułów; nic nowego względem powyższych.

Pliki `.zip`, `.bat`, `.py` (`tts_coqui.py`, `stt_vosk.py`, `decision_engine.py`) to legacy runtime na innym stacku (Python + Vite CRA) — nie migrujemy kodu, tylko wnioski funkcjonalne.

## Jak to się ma do obecnego KK1 Core

Mamy już: FUKO‑LANG parser, Dual‑Output Terminal, Gemini chat + Process Designer + Process Editor, MCP, Telegram ingest, AgentBoard (47 agentów), EventBus + EventLog, Architecture (5 filarów), skróty F1/F4/F6, Emergency overlay, PZK toasty.

Braki względem specyfikacji z Drive, które warto wprowadzić:

1. Skróty klawiszowe pokryte w ~20%.
2. Głos: tylko `SpeechRecognition` free‑form, bez grammar komend PL.
3. EventBus jest logowany, ale bez replay/time‑travel ani mostków cross‑layer.
4. Brak progów KPI i auto‑alertów.
5. Brak scenariuszy FUKO‑PZK jednym klikiem.
6. Architecture pokazuje 5 filarów, ale bez zakładek P0‑P3 / AGI 10.0.

## Propozycja aktualizacji (zakres, do zatwierdzenia)

### A. Skróty klawiszowe (rozszerzenie `ShortcutManager.tsx`)

Dodać (nie ruszając F1/F4/F6):
- **F2** Activate Agent (losowy Idle → Processing + PZK), **F3** Freeze Evolution (globalny lock w store), **F5** Refresh (`fetchSystemStatus` + `fetchAgentStatuses`), **F7** Switch Agent (round‑robin), **F8** Optimize (mock KPI sweep), **F9** Generate Report (pobranie ledger + toast), **F10** Backup State (zapis Zustand do `localStorage`), **F11** Maintenance Mode (banner + wyłączenie composera), **F12** System Status (PZK + TTS jeśli Voice Mode).
- **Ctrl+1..5** — set focus agent: `@ceo`, `@voice-core`, `@guardian-core`, `@router`, `@controlling`.
- **Alt+S/A/R/M/V** — KPI scan / performance analysis / reset random agent / mic toggle / volume slider.
- **Ctrl+Shift+E/R/S** — Emergency Shutdown (twardszy niż F4, blokuje input), Force Restart (clear store), Save State.

Każda akcja emituje event i PZK z 7‑elementową strukturą.

### B. Grammar komend głosowych (`Terminal.tsx`)

Nakładka na istniejące `SpeechRecognition`: przed wysłaniem do Gemini dopasowanie PL/EN regexem do słownika:
`aktywuj agenta|activate agent`, `zmień styl|style shift`, `status systemu|system status`, `stop awaryjny|emergency stop`. Trafienie → odpowiedni skrót zamiast czatu. Brak trafienia → wysyłka do Gemini bez zmian.

### C. Bridges na EventBusie (`src/lib/bridges/`)

Trzy moduły subskrybujące istniejący `event-bus`:
- `guardian-recalibration.ts` — na `agent.status.degraded` → emit `agent.recalibrate` + update `trustScore`.
- `influence-loadbalancer.ts` — na `sda.route` → aktualizacja wag routingu w store (widoczne w AgentBoard jako „influence weight”).
- `style-memory.ts` — na `chat.style.detected` (dodać emit w `sendMessageToCore`) → zapis profilu stylu użytkownika w store, wykorzystywany w system prompcie kolejnych wywołań Gemini.

### D. Replay i time‑travel w EventLog (`EventLog.tsx`)

Do istniejącego panelu dodać: filtr po typie, przycisk **Replay** (odtwarza ostatnie N eventów w interwałach), przycisk **Snapshot** (dumpuje stan Zustand + eventy do JSON download). Podłączyć pod F10.

### E. KPI Monitor (nowy widget na `Architecture`)

Karta „KPI Guardrails”: 4 mierniki (Sales Conversion, User Engagement, System Performance, Agent Efficiency) z mock‑danymi z `api.ts`. Progi z FUNCTIONAL_SPECIFICATION → automatyczny PZK+toast przy przekroczeniu, event `kpi.threshold.breached`.

### F. FUKO‑PZK Scenariusze (`ShortcutManager` + prosty selector w Topbarze)

Nowy dropdown „Scenarios” → 4 pozycje z FUNCTIONAL_SPECIFICATION (Senior Health Check, Lead Nurturing, System Optimization, Emergency Response). Każdy scenariusz to skrypt sekwencji PZK + eventów odpalanych z opóźnieniami (2‑4 kroki), bez wywołań backendu.

### G. Architecture: zakładki P0‑P3 + AGI 10.0

W `Architecture.tsx` przełączyć z pojedynczej siatki na `Tabs`: **Pillars** (obecne 5), **P0 Guardian**, **P1 Audit**, **P2 Recalibration**, **P3 Cognitive**, **AGI 10.0**. Każda zakładka: 2‑3 karty z mock‑telemetry z `api.ts` (drift score, event throughput, recalibration queue, influence graph mini, autonomy meter).

### H. Zmiany podtrzymujące

- `kk1-store.ts`: dodać `focusAgent`, `frozenEvolution`, `maintenanceMode`, `styleProfile`, `kpi`, `influenceWeights`.
- `event-bus.ts`: eksport helpera `replay(events, intervalMs)`.
- `api.ts`: `fetchKpi()`, `runScenario(id)` — czyste mocki, zgodne z konwencją event `api.request/response`.
- `i18n/i18n.ts`: 4 języki dla nowych etykiet (skróty, KPI, scenariusze).

### Poza zakresem (świadomie pomijamy)

- Migracja legacy Pythona (`stt_vosk.py`, `tts_coqui.py`, `decision_engine.py`) — nasz stack to TanStack Start + Web Speech API, nie Node/Python worker.
- „OrchestrationEngine V1/V2” — nie mamy takiego kodu, uwaga niedotycząca.
- Backend FastAPI (`backend/main.py`) — zostaje jak jest, chat idzie przez Gemini Gateway.

## Uwagi techniczne

- Wszystko po stronie frontu; brak nowych server functions, brak zmian schematu Supabase.
- Nowe skróty muszą respektować focus w `<input>/<textarea>` (istniejący guard w `ShortcutManager`).
- Bridges: subskrypcje w pojedynczym `useEffect` w `Shell`, żeby nie duplikować przy HMR.
- Replay w EventLog nie może rzucać w bus wpisami `debug.*` z podwójnym flagiem (żeby nie zapętlić).
