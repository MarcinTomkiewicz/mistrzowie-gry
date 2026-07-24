# Aktualizacja katalogów referencyjnych

Katalogi są lokalnymi, wersjonowanymi danymi frontendu. Aplikacja nie wykonuje
w runtime żadnych requestów do KAS, NFZ, ISO ani ONZ.

## Źródła

- KAS: [Dane teleadresowe jednostek Krajowej Administracji Skarbowej](https://www.gov.pl/web/kas/dane-teleadresowe-jednostek-kas).
- NFZ: [identyfikatory oddziałów wojewódzkich](https://www.nfz.gov.pl/o-nfz/struktura-nfz/identyfikatory-oddzialow-wojewodzkich-nfz/)
  oraz [oficjalna struktura i siedziby oddziałów](https://www.nfz.gov.pl/kontakt/oddzialy-nfz/).
- ISO: [ISO 3166 - kody krajów](https://www.iso.org/iso-3166-country-codes.html).
- ONZ: [UN M49 - lista krajów i obszarów](https://unstats.un.org/unsd/methodology/m49/overview/).

## Urzędy Skarbowe

Generator wybiera wyłącznie rekordy `TYP === 'US'` z oficjalnego arkusza KAS
i nadpisuje jeden plik:
`src/app/core/configs/reference-catalogs/tax-offices.generated.json`.
Nie obejmuje pozostałych jednostek KAS ani wyspecjalizowanych urzędów
skarbowych (`WUS`). Pliku wynikowego nie wolno edytować ręcznie.

1. Pobierz aktualny XLSX „Dane teleadresowe jednostek Krajowej Administracji
   Skarbowej” z oficjalnej strony KAS i zapisz go lokalnie.
2. Uruchom generator, przekazując lokalną ścieżkę oraz datę pliku źródłowego:

   ```text
   npm run generate:tax-offices -- <source.xlsx> <YYYY-MM-DD>
   ```

   Ścieżkę zawierającą spacje ujmij w cudzysłów.
3. Sprawdź diff wygenerowanego katalogu, w szczególności usunięte i dodane
   urzędy, ich kody, nazwy, miasta oraz metadata.
4. Potwierdź, że `sourceFileDate` odpowiada dacie publikacji pobranego XLSX.
   `generatedAt` ustawia generator. Przy zmianie kontraktu lub reguł generatora
   zaktualizuj także `GENERATOR_VERSION`.
5. Zatwierdź wygenerowany katalog razem z jego zaktualizowanymi metadanymi.

Generator odrzuca rekord `US` bez czterocyfrowego kodu, nazwy lub miasta,
wykrywa duplikaty kodów i zapisuje rekordy posortowane po kodzie.

## Oddziały wojewódzkie NFZ

Katalog NFZ jest utrzymywany statycznie w
`src/app/core/configs/reference-catalogs/nfz-branches.config.ts`.

1. Porównaj kody z oficjalną dokumentacją identyfikatorów NFZ.
2. Porównaj oficjalne nazwy i siedziby z aktualną stroną oddziałów NFZ.
3. Zaktualizuj wyłącznie rekordy potwierdzone w obu źródłach. Kod NFZ pozostaje
   identyfikatorem; nazwa województwa nie zastępuje kodu.
4. Sprawdź, że katalog nadal zawiera dokładnie 16 oddziałów i 16 unikalnych
   kodów, a każdy rekord ma `code`, `voivodeshipName`, `officialName` i `seat`.
5. Ustaw `verifiedAt` na datę weryfikacji i zwiększ `catalogVersion`, jeśli dane
   katalogu się zmieniły, a następnie sprawdź diff.

## Kody krajów ISO 3166-1 alpha-2

Lista kodów jest utrzymywana statycznie w
`src/app/core/configs/reference-catalogs/country-codes.config.ts`. Etykiety są
tworzone lokalnie przez `Intl.DisplayNames`; identyfikatorem pozostaje kod.

1. Porównaj listę z aktualnym wykazem ISO 3166-1 alpha-2.
2. Zweryfikuj zakres krajów i obszarów względem zestawienia UN M49.
3. Zaktualizuj kody, zachowując wielkie litery, porządek alfabetyczny,
   unikalność oraz obecność `PL`.
4. Ustaw `verifiedAt` na datę weryfikacji i zwiększ `catalogVersion`, jeśli lista
   się zmieniła, a następnie sprawdź diff.

Aktualizacja każdego katalogu odbywa się podczas pracy nad repozytorium.
Źródła zewnętrzne nie są zależnością runtime aplikacji.
