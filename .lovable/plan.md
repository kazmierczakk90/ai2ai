# Flow Canvas v2 — lepsze budowanie wizualne + AI z pliku

## 1. Ulepszenia wizualne canvasu (`FlowCanvas.tsx`)

- **Pan & zoom**: kółko myszy = zoom (0.3–2.5x), przeciąganie tła / środkowy przycisk = przesuwanie. Przyciski `+ / − / fit / 1:1` w rogu canvasu; „fit” dopasowuje widok do grafu.
- **Porty zamiast jednego uchwytu**: wejście po lewej, wyjście po prawej. Podświetlenie portu docelowego przy przeciąganiu; łączenie przez drag-and-drop (obecnie: klik → klik, zostaje jako fallback).
- **Czytelniejsze węzły**: kształt zależny od rodzaju (start/end = zaokrąglone „pigułki”, gate = romb, agent = karta z paskiem koloru warstwy), skrócone etykiety z tooltipem, ikona notatki gdy `note` jest ustawiona.
- **Krawędzie**: routing ortogonalny/beziera zależnie od położenia węzłów, unikanie nachodzenia etykiet, styl linii wg typu (COND = przerywana, LOOP = z pętlą zwrotną, PAR = podwójna), animowany „flow dash” dla zaznaczonej ścieżki.
- **Auto-layout**: przycisk „auto layout” — prosty układ warstwowy (topological ranks, kolumny po lewej→prawo), z animowanym przejściem pozycji.
- **Multi-select + wyrównanie**: zaznaczanie ramką (shift+drag), przesuwanie grupy, `Ctrl+D` duplikacja węzła.
- **Minimapa** w prawym dolnym rogu z podglądem viewportu.
- **Walidacja grafu**: pasek ostrzeżeń (brak START/END, węzły osierocone, cykl bez LOOP) z klikalnymi wskazaniami.

## 2. Import pliku → AI proponuje flow

- **Nowy przycisk w toolbarze**: „AI from file” (ikona upload) otwierający dialog:
  - drop-zone + wybór pliku, opcjonalne pole „dodatkowe instrukcje”,
  - obsługiwane formaty tekstowe: `.txt .md .json .csv .log .yaml` (odczyt w przeglądarce), limit ~200 KB tekstu (dłuższe przycinane z informacją),
  - podgląd wyniku przed zastosowaniem: lista węzłów i krawędzi + wybór „zastąp graf” / „dołącz do grafu”.
- **Nowa funkcja serwerowa** `src/lib/flow.functions.ts` → `proposeFlowFromDocument`:
  - Lovable AI Gateway (`google/gemini-3.1-pro-preview`, ten sam provider co SOK),
  - structured output (Zod): `{ name, trigger, nodes[{key, kind, agent, note}], edges[{from, to, type, label, skill, condition, maxIterations, priority}] }`,
  - system prompt w konwencji FUKO-LANG: agenci z prefiksem `@`, typy krawędzi SEQ/PAR/COND/LOOP/GATE, wymuszony jeden START i co najmniej jeden END, zadanie opisane NA strzałce (zgodnie z ideą „instrukcja pomiędzy punktami”),
  - obsługa błędów 429 / 402 z czytelnym komunikatem w UI.
- **Mapowanie na store**: konwersja kluczy AI na ID węzłów, przypisanie pozycji przez auto-layout, wywołanie `importGraph` (jedno wejście w historii undo) + event `flow.graph.ai_imported` na szynie zdarzeń.

## 3. Szczegóły techniczne

- Transformacja widoku trzymana lokalnie w `FlowCanvas` (`{x, y, k}`) i aplikowana jako `<g transform>`; eksport SVG/PNG pozostaje niezależny od zoomu (eksport z bounding boxa grafu).
- Auto-layout w nowym `src/lib/flow/layout.ts` (czysta funkcja, używana i przez przycisk, i przez import AI).
- Store `flow-store.ts`: dodanie `selectionMany: string[]`, akcji `duplicateNode`, `moveMany`, `applyLayout` — bez zmiany formatu persistencji (kompatybilne ze starymi zapisami i share-linkami).
- Odczyt pliku wyłącznie po stronie klienta; do serwera trafia sam tekst — bez uploadu do storage.
- Przy okazji: poprawka hydratacji znacznika czasu w `Terminal.tsx` (render czasu dopiero po zamontowaniu).

## Poza zakresem
- PDF/DOCX/obrazy (wymagają dodatkowego parsera) — mogę dodać w kolejnym kroku, jeśli będą potrzebne.
