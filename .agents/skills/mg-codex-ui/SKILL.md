---
name: mg-codex-ui
description: Odtwarzaj istniejące wzorce Angular 21 i PrimeNG w interfejsie Mistrzowie Gry. Używaj razem z mg-codex-executor przy zmianach stron, tabel, formularzy, dialogów, nawigacji, SCSS lub tekstów widocznych dla użytkownika.
---

# Mistrzowie Gry — UI Pattern Reuse

To uzupełnienie wykonawczego skilla Codexa dla **rzeczywistych zadań UI**, nie osobne zlecenie redesignu. Root `AGENTS.md` pozostaje źródłem twardych reguł, w tym istniejącego UI pattern gate, naming gate oraz copy approval contract.

## Zanim powstanie template

1. Wskaż odpowiedzialność edytowanego widoku: strona, lista, tabela, edytor, formularz, dialog, shell, nawigacja, akcje albo empty/loading/error state.
2. Znajdź i **przeczytaj** najbliższy produkcyjny odpowiednik o podobnym modelu interakcji; sprawdź kompletny HTML, TS, SCSS i sposób osadzenia w rodzicu. Gdy nie istnieje wiarygodny odpowiednik, nazwij brak, zamiast twierdzić, że był reuse.
3. Zapisz dla siebie istniejący wzorzec: rodzic/shell, szerokości i overflow, taby, sekcje, nagłówki, CTA, footer akcji, responsywność, PrimeNG oraz loading/error/empty/retry.
4. Sprawdź komponenty współdzielone, globalne SCSS i utilities **przed** wprowadzeniem nowych wrapperów, klas i selektorów. Pojedyncza podobna klasa nie wystarcza, jeśli cała kompozycja strony różni się od analogicznego widoku.

## Implementacja

- Zachowaj odpowiedni istniejący shell (`mg-section`, `mg-container`, `RouteTabShell` lub inny faktycznie używany w danym feature). Nie traktuj nowej trasy jako uzasadnienia dla nowego systemu layoutu.
- Dla tabel prześledź także wzorzec `mg-responsive-table`, układ mobilny, overflow, loading i akcje w wierszach. Dla formularzy sprawdź walidację, disabled/submitting state, footer i obsługę błędów.
- Używaj PrimeNG i globalnych stylów zgodnie z istniejącą praktyką. Lokalny SCSS dodaj wyłącznie dla unikalnej odpowiedzialności, której nie pokrywa istniejący wzorzec; nie maskuj nim brakującego kontenera.
- Logikę dostępu, walidację domenową i operacje backendowe lokuj w istniejących warstwach, nie w widoku. Kontroluj SSR i brak layout shift przy stanach ładowanych asynchronicznie.
- Dla widocznych tekstów stosuj Transloco, zatwierdzone wartości oraz zasady `[PH]` i chronionego copy z `AGENTS.md`. Nie paraprazuj copy wyłącznie dlatego, że zmieniasz template/i18n.
- Zachowuj dostępność: etykiety pól, semantykę kontroli, focus, obsługę klawiatury i czytelny stan błędu. Nie wprowadzaj własnej konwencji konkurującej z istniejącym wzorcem.

## Odbiór własnej pracy

Prześledź cały finalny ekran na podstawie kodu: default, loading, sukces, błąd, brak danych, mobile i uprawnienia, jeśli dotyczą zakresu. Przeczytaj pełne dotknięte TS/HTML/SCSS; usuń martwy układ i nadmiarowe style.

W obowiązkowym raporcie `AGENTS.md` pole `Quality: reuse:` wskaż **konkretny** plik-wzorzec i rzeczywiście wykorzystane komponenty/globalne style. Nie deklaruj manual smoke ani akceptacji UI przez użytkownika.
