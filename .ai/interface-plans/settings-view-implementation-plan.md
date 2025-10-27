# Plan implementacji widoku Ustawienia konta

## 1. Przegląd

Widok ustawień konta udostępnia użytkownikowi możliwość zarządzania krytycznymi aspektami konta. W tym etapie skupiamy się na bezpiecznym, świadomym i nieodwracalnym procesie trwałego usunięcia konta. Interfejs prowadzi użytkownika przez wyraźne ostrzeżenie, potwierdzenie za pomocą checkboxa i finalny przycisk akcji, aby zminimalizować ryzyko przypadkowej utraty danych.

## 2. Routing widoku

- Ścieżka: `/settings`
- Tryb renderowania: SSR (Astro 5, Node adapter)
- Dostęp: wyłącznie dla zalogowanych - wszystkie widoki poza logowaniem i rejestracją będą docelowo tylko dla zalogowanych, ale na tym etapie nie wdrażamy takich ograniczeń.

## 3. Struktura komponentów

- Layout: `SettingsLayout` (Astro) – ogólny układ strony ustawień, nagłówek i slot na sekcje
- Sekcja: `SettingsHeader` (Astro) – tytuł i opis strony
- Panel: `DeleteAccountPanel` (React) – interaktywny, zawiera ostrzeżenia, checkbox i przycisk usunięcia
- UI: komponenty shadcn/ui oraz klasy Tailwind do stylowania (Alert/Callout, Checkbox, Button – wariant „destructive”)

## 4. Szczegóły komponentów

### SettingsLayout (Astro)

- Opis: Układ strony ustawień; renderuje stały nagłówek, kontener treści i slot na sekcje.
- Główne elementy: wrapper z maksymalną szerokością, breadcrumbs/tytuł, slot na sekcje.
- Obsługiwane interakcje: brak (komponent statyczny).
- Walidacja: brak.
- Typy: brak własnych; przyjmuje dzieci (slot).
- Propsy: brak (zwykły layout z `<slot />`).

### SettingsHeader (Astro)

- Opis: Sekcja nagłówka strony z nazwą „Ustawienia konta” i krótkim opisem skutków operacji.
- Główne elementy: `h1`, `p`, ewentualnie ikonografia ostrzegawcza.
- Interakcje: brak.
- Walidacja: brak.
- Typy: brak.
- Propsy: `{ title?: string; description?: string }` (opcjonalnie, domyślne wartości dla widoku ustawień konta).

### DeleteAccountPanel (React)

- Opis: Interaktywny panel „Niebezpieczna operacja”. Wymaga jednego warunku: zaznaczenia checkboxa „Rozumiem nieodwracalność operacji”. Dopiero po spełnieniu warunku odblokowany zostaje przycisk „Usuń konto”. W tym etapie nie podpinamy realnego endpointu – akcja zostanie dodana później.
- Główne elementy:
  - Alert/Callout ostrzegawczy (np. czerwony/amber),
  - `Checkbox` z labelką o nieodwracalności,
  - `Button` z wariantem „destructive”.
- Obsługiwane interakcje:
  - `onConfirmAcknowledgeChange(checked: boolean)` – zmiana stanu checkboxa,
  - `onDeleteClick()` – kliknięcie przycisku; w przyszłości wyśle żądanie do API, tu wyłącznie mock/placeholder.
- Warunki walidacji:
  - Checkbox zaznaczony: `acknowledged === true`.
  - Gdy spełniony: przycisk aktywny; w przeciwnym razie nieaktywny.
  - Po inicjacji akcji przycisk w stanie `loading`/`disabled` aż do zakończenia (w przyszłości – odpowiedzi API).
- Typy:
  - `DeleteAccountViewModel` – model stanu panelu (szczegóły w sekcji Typy).
  - `DeleteAccountActionResult` – wynik próby usunięcia (sukces/błąd, komunikaty).
  - `DeleteAccountValidation` – wynik lokalnej walidacji.
- Propsy:
  - `{ userEmail?: string }` – do wyświetlenia w ostrzeżeniu (opcjonalnie),
  - `{ onRequestDelete?: () => Promise<DeleteAccountActionResult> }` – callback podłączany w przyszłości; na razie opcjonalny i nieużywany.

## 5. Typy

- `DeleteAccountViewModel`
  - Pola:
    - `acknowledged: boolean` – stan checkboxa.
    - `isValid: boolean` – wynik walidacji lokalnej (równy `acknowledged`).
    - `isSubmitting: boolean` – stan żądania (spinner/blokada przycisku).
    - `error?: string | null` – komunikat błędu do wyświetlenia w panelu.
    - `success?: boolean` – flaga sukcesu po wykonaniu akcji.
- `DeleteAccountActionResult`
  - Pola: `{ success: boolean; message?: string }` – wynik przyszłego wywołania API.
- `DeleteAccountValidation`
  - Pola: `{ acknowledged: boolean; isValid: boolean }` – rozbicie walidacji na części składowe.
- Uwaga: Na tym etapie nie wprowadzamy nowych DTO do warstwy API, ponieważ endpoint nie istnieje. W przyszłości przewidywany `DeleteAccountCommand` (np. puste body) i `DeleteAccountResponseDTO`.

## 6. Zarządzanie stanem

- Stan lokalny w `DeleteAccountPanel` (React, useState/useMemo/useCallback):
  - `acknowledged`, `isSubmitting`, `error`, `success`.
  - `isValid` obliczany memoizacją jako `acknowledged`.
- Custom hook: `useDeleteAccount()` (opcjonalnie od razu)
  - Odpowiada za: kontrolę walidacji, stan wysyłki, wyświetlanie błędów, przygotowanie wywołania API w przyszłości.
  - API: `{ vm, setAcknowledged, submit }`.

## 7. Integracja API

- Na tym etapie brak realnych endpointów – nie dodajemy ich teraz.
- Projektowane kontrakty (na później):
  - `POST /api/account/delete` (prerender = false), autoryzacja przez `context.locals.supabase`.
  - Request: puste body lub minimalny payload `{ reason?: string }` (opcjonalnie – do analityki), weryfikacja sesji po stronie backendu.
  - Response: `{ success: true }` lub `{ success: false, error: { code, message } }`.
  - Błędy: 401 (brak sesji), 400 (walidacja – jeśli wprowadzimy dodatkowe warunki), 429 (rate limit), 500 (błąd serwera). Zgodnie z guideline: zod weryfikacja wejścia, spójne logowanie błędów.
- W komponencie: przyszłe `submit()` wykona `fetch('/api/account/delete', { method: 'POST' })` i zaktualizuje stan na podstawie odpowiedzi.

## 8. Interakcje użytkownika

- Zaznaczenie checkboxa „Rozumiem nieodwracalność operacji” – aktualizuje `acknowledged`.
- Przycisk „Usuń konto” – aktywny tylko, gdy `acknowledged === true`; po kliknięciu rozpoczyna proces usuwania (docelowo: wywołanie API), przycisk przechodzi w stan `loading`.
- Po sukcesie (docelowo): wylogowanie i przekierowanie do strony startowej z komunikatem.
- Po błędzie (docelowo): wyświetlenie błędu w `Alert` w panelu.

## 9. Warunki i walidacja

- Warunki interfejsu (wymuszone w komponencie):
  - `acknowledged === true`.
- Blokady UI:
  - Przycisk „Usuń konto” `disabled` do czasu `isValid === true`.
  - `isSubmitting === true` blokuje ponowne kliknięcia i pola wejściowe.
- Walidacja klienta: prosta, bez zod; możliwość rozszerzenia w przyszłości.

## 10. Obsługa błędów

- Błędy klienta (walidacja):
  - Checkbox nie zaznaczony – informacja: „Musisz potwierdzić nieodwracalność operacji”.
- Błędy sieci/serwera (docelowo):
  - 401 – wylogowanie i redirect do logowania.
  - 400 – wyświetlenie błędu walidacji zwróconego przez API (jeśli dotyczy).
  - 500 – komunikat ogólny: „Wystąpił błąd. Spróbuj ponownie później.”
  - Timeout/Network – komunikat i możliwość ponowienia.
- Re-trial: przycisk „Spróbuj ponownie” w panelu po błędzie.

## 11. Kroki implementacji.

1. Layout: utwórz `src/pages/settings.astro` oparte na `SettingsLayout` i `SettingsHeader`.
2. Panel React: dodaj `DeleteAccountPanel.tsx` w `src/components/settings/` z logiką checkbox + blokada/odblokowanie przycisku.
3. UI i styl: użyj shadcn/ui (Alert/Checkbox/Button) i klas Tailwind (wariant `destructive`).
4. Walidacja: lokalna walidacja w komponencie lub w `useDeleteAccount` (prosta zależność od `acknowledged`).
5. Stany: zaimplementuj `isSubmitting`, `error`, `success`, ścieżki UI dla każdego stanu.
6. Hook (opcjonalnie): wyodrębnij `useDeleteAccount()` do `src/hooks/useDeleteAccount.ts` dla czytelności i testowalności.
7. Integracja API (później): przygotuj `submit()` i kontrakty; na razie użyj mocku i wyraźnie oznacz TODO.
8. A11y: powiąż labelki z kontrolkami, aria-live dla komunikatów stanu/błędu, focus management po błędach i po sukcesie.
9. Kopie i treści: dodaj jasne i jednoznaczne teksty ostrzegawcze, w tym informację o nieodwracalności i utracie danych.
