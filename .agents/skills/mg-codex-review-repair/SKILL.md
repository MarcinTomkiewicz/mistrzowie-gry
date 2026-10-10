---
name: mg-codex-review-repair
description: Napraw bieżącą paczkę zmian Mistrzowie Gry według konkretnego Comment for Codex lub listy DO ZMIANY / DO USUNIĘCIA od Reviewera. Używaj wyłącznie przy poprawkach po zewnętrznym review, bez projektowania nowych funkcji.
---

# Mistrzowie Gry — Review Repair

## Kontrakt

Wykonujesz poprawki do **już istniejącej paczki** ocenionej przez niezależnego Reviewera. `Comment for Codex` to zamknięta lista obowiązkowych korekt, nie nowy epic i nie zaproszenie do generalnego refaktoru.

Aktualny `AGENTS.md` i instrukcje najbliższego katalogu nadal obowiązują w całości. Komentarz Reviewera nie zastępuje ich procedur, weryfikacji ani formatu raportu.

## Przebieg

1. Przeczytaj aktualny komentarz, `git status --short`, cały bieżący dirty tree i konieczne pliki/kontrakty. Oddziel zmiany tej paczki od zmian starszych lub niezwiązanych.
2. Zamień każdy punkt `DO ZMIANY` / `DO USUNIĘCIA` na dokładny plik, symbol lub blok template i oczekiwany stan po poprawce. Pomijaj elementy już zaakceptowane, uwagi informacyjne i wcześniejsze zamknięte taski.
3. Konfrontuj komentarz ze stanem kodu. Jeśli wskazany symbol już nie istnieje albo poprawka wymaga nowego, brakującego kontraktu, nazwij **rzeczywisty** blocker; nie zgaduj ani nie wykonuj alternatywy obok zalecenia.
4. Wykonaj jedną spójną ścieżkę naprawy dla każdego punktu. Usuń przyczynę naruszenia, zastąpione fragmenty, niepotrzebne obejścia, aliasy i martwe referencje z zakresu paczki. Nie dodawaj nowych funkcji ani abstrakcji „na przyszłość”.
5. Po poprawce sprawdź cały zestaw plików, a nie tylko linie wymienione przez Reviewera. Zbadaj bezpośrednich konsumentów, nazwy, ownership, SRP/SoC/DRY/KISS, zachowanie runtime oraz brak regresji i pozostałości starej ścieżki.
6. Zastosuj wymagane bramki weryfikacji i dokładnie raport z `AGENTS.md`. Zostaw working tree do ponownego, niezależnego review. Nie przyznawaj sobie werdyktu `ACCEPT` i nie commituj.

## Czego nie robić

- Nie zamieniaj krótkiego komentarza Reviewera w nowy task, harmonogram ani raport konkurencyjny wobec `AGENTS.md`.
- Nie rozszerzaj scope na kolejne slice'y, nie otwieraj ponownie zatwierdzonych decyzji.
- Nie traktuj manual smoke użytkownika, samego builda ani własnego completion receipt jako zgody na commit.
- Nie wykonuj SQL/DB zamiast Migratora i nie obchodź brakującego kontraktu sztucznym fallbackiem.
