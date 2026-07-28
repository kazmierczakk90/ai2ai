
# Flow Canvas — wizualna mapa przepływu agentów

Nowa zakładka w topbarze („Flow"), obok Command / Architecture / Chat Import. Graficzny canvas w stylu draw.io / n8n, gdzie:

- **Węzeł (node)** = agent z katalogu 27/47 (np. `@analyzer`, `@ceo`) lub węzeł specjalny (START, GATE, END).
- **Strzałka (edge)** = zadanie/instrukcja przekazywana między agentami — klikalna, edytowalna, z etykietą typu `SEQ / COND / PAR / LOOP / GATE` i treścią zadania (np. „przekaż dane rynkowe do decyzji").

## Zachowanie UX

- Drag-and-drop agentów z lewego palette panel (grupy: Cognitive / System / Execution / Emotional / Strategic).
- Klik na canvas + drag = łączenie dwóch węzłów strzałką. Domyślny typ `SEQ`.
- Klik na strzałkę → inspektor po prawej: `type`, `task_label`, `skill`, `condition` (dla COND), `max_iterations` (dla LOOP), `priority`.
- Klik na węzeł → inspektor: agent handle, licencja L0–L5, trust score (readonly z store), notatka.
- Pasek narzędzi: `Nowy graf`, `Zapisz`, `Wczytaj`, `Eksport JSON` (PDL), `Wyślij do Command` (serializuje graf do bloku FUKO i wysyła jako wiadomość do Gemini w Terminalu — reuse istniejącej ścieżki `sendMessageToCore`).
- Zoom + pan (kółko myszy + spacja-drag), snap to grid 16px, mini-mapa w rogu.
- Multi-select + delete, undo/redo (Ctrl+Z / Ctrl+Shift+Z).

## Integracje

- **SDA Router**: przy dodaniu strzałki z etykietą-tekstem uruchamiam `routeSda(label)` i podpowiadam sugerowanego `target_agent` (chip „SDA suggests @ceo").
- **Event bus**: każda mutacja grafu emituje `flow.node.added` / `flow.edge.added` / `flow.graph.saved` (widoczne w EventLog).
- **ProcessEditor kompatybilność**: eksport grafu = ten sam format bloku FUKO co dzisiaj parsuje `ProcessEditor`, więc graf można otworzyć w edytorze tekstowym i vice-versa.
- **i18n**: labelki paska/inspektora w EN/PL/FR/ES.

## Zakres tego etapu (jeden PR)

1. Nowa trasa `src/routes/flow.tsx` + wpis w topbarze (`Layout.tsx`).
2. Zustand: `src/store/flow-store.ts` — `nodes[]`, `edges[]`, `selection`, `history[]`, akcje CRUD + undo/redo, persist do `localStorage` (`kk1.flow.graphs`).
3. Komponenty pod `src/components/kk1/flow/`:
   - `FlowCanvas.tsx` — SVG-based canvas (własna implementacja, żeby zachować dark command-center estetykę; bez ciężkich zależności).
   - `AgentPalette.tsx` — lewa kolumna z agentami z `AGENT_SEED`.
   - `NodeInspector.tsx` / `EdgeInspector.tsx` — prawy panel.
   - `FlowToolbar.tsx` — górny pasek narzędzi.
   - `MiniMap.tsx`.
4. `src/lib/flow/serialize.ts` — graf ↔ blok FUKO (`$-<name>` + kroki), reuse w Terminalu.
5. Wysyłka do Command: przycisk „Send to Terminal" wywołuje istniejące `sendMessageToCore` z serializowanym blokiem, żeby Gemini/Process-Designer go zwalidował.
6. i18n stringi w `src/i18n/i18n.ts`.

## Poza zakresem

- Realne wykonanie procesu (tylko design + wysyłka do Gemini).
- Kolaboracja realtime / współdzielenie linków.
- Import z draw.io / mermaid (można dołożyć osobno).

## Szczegóły techniczne

```text
┌─ palette ─┬─────── FlowCanvas (SVG) ────────┬─ inspector ─┐
│ Cognitive │  ●──SEQ: analiza rynku──►●      │ edge: SEQ   │
│  @analyzer│  │                        │      │ task: ...   │
│  @critic  │  │                COND    │      │ skill: ...  │
│ System    │  │                ▼       │      │ priority: 8 │
│  @ingestor│  ●◄──LOOP: max 3──●──────►●END   │             │
└───────────┴────────────────────────────┴─────────────────┘
                       toolbar: [new] [save] [export] [→ terminal]
```

- Węzły przechowywane jako `{id, agent, x, y, kind: "agent" | "start" | "gate" | "end", note}`.
- Krawędzie: `{id, from, to, type: SEQ|PAR|COND|LOOP|GATE, label, skill?, condition?, maxIterations?, priority?}`.
- Renderowanie strzałek: cubic bezier między środkami węzłów, etykieta na środku ścieżki (SVG `<text>` z tłem `--surface`).
- Interakcje: pointer events na SVG, hit-test przez ID w `data-*`.
- Bez `react-flow` / `reactflow` — trzymamy lekką własną implementację (spójna estetyka, brak dodatkowej zależności ~200 kB).

## Weryfikacja

- Typecheck (`tsgo`).
- Ręczny smoke test w preview: dodać 3 agentów, połączyć strzałkami, zmienić typ krawędzi na COND, wysłać do Terminala i sprawdzić, że Gemini zwraca to jako proces.
- EventLog pokazuje `flow.*` eventy.
