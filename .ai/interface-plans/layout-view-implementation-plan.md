# Plan implementacji widoku Layout aplikacji

## 1. Przegląd

Layout aplikacji zapewnia wspólny szkielet UI dla widoków po zalogowaniu. Zawiera pasek górny z nazwą aplikacji (link do strony głównej), ikonę ustawień (link do `/settings`) i ikonę wylogowania (akcja `signOut` z Supabase). Dostarcza także: globalne centrum powiadomień (toasts) oraz warstwę portali na potrzeby modalów. Layout ma być responsywny i dostępny, z wyróżnieniem aktywnej pozycji nawigacji (`aria-current`).

## 2. Routing widoku

- Layout stosowany w widokach: `/ideas`, `/settings` (i przyszłe widoki „po zalogowaniu”).
- Implementacja jako dedykowany layout Astro: `src/layouts/AppLayout.astro` wykorzystywany przez strony: `src/pages/ideas.astro`, `src/pages/settings.astro` (zamiast bazowego `Layout.astro`).
- Strona główna i ewentualne publiczne strony nadal używają `src/layouts/Layout.astro`.

## 3. Struktura komponentów

- `AppLayout.astro`
  - `AppTopBar` (nagłówek)
    - `BrandLogo` (link do `/`)
    - `NavActions`
      - `SettingsLink` (link do `/settings`, `aria-current` gdy aktywny)
      - `LogoutButton` (akcja wylogowania)
  - `<slot />` (zawartość strony)
  - `Toaster` (centrum powiadomień – już dostępny w bazowym layoucie)
  - `PortalLayer` (kontener dla modalów)

## 4. Szczegóły komponentów

### AppLayout.astro

- Opis: Layout sekcji „po zalogowaniu”. Odpowiada za wspólny nagłówek, kontenery i gniazdo na zawartość. Bazuje na `src/layouts/Layout.astro` jako powłoce HTML i dokłada pasek górny + warstwę portali.
- Główne elementy: `<header>`, nawigacja, `<main><slot /></main>`, kontener portali.
- Obsługiwane interakcje: Brak własnych (delegowane do dzieci – linki, logout).
- Walidacja: Brak walidacji danych. Dba o strukturę i dostępność (role/aria, focus styles).
- Typy: Brak dedykowanych DTO. Opcjonalny `title?: string` do ustawienia tytułu dokumentu (przekazywany do Layout.astro).
- Propsy: `{ title?: string }` – przekazywane do bazowego `Layout.astro`.

### AppTopBar (Astro/mała logika)

- Opis: Pasek górny z marką i akcjami. Responsywny – na małych ekranach grupuje akcje, na dużych pokazuje je w linii.
- Główne elementy: `<nav>`, `BrandLogo`, `NavActions` (SettingsLink, LogoutButton). Ikony jako inline SVG (brak nowych zależności).
- Interakcje: Kliknięcia w linki (nawigacja), kliknięcie w LogoutButton (akcja wylogowania).
- Walidacja: `aria-current="page"` dla aktywnej pozycji (ustalane na podstawie `Astro.url.pathname`). Kontrast i rozmiary klikalne (min. 44x44 px strefy dotyku).
- Typy: Brak DTO. Wewnątrz przekazuje aktualną ścieżkę do linków.
- Propsy: `{ currentPath: string }` (opcjonalnie – w Astro dostęp do `Astro.url.pathname`).

### BrandLogo (Astro)

- Opis: Link tekstowy z nazwą aplikacji (np. „PresMinder”) prowadzący na `/`.
- Główne elementy: `<a href="/" aria-label="Strona główna">PresMinder</a>`.
- Interakcje: Kliknięcie – nawigacja do `/`.
- Walidacja: Brak; atrybut `aria-label` dla dostępności.
- Typy: Brak.
- Propsy: Brak.

### SettingsLink (Astro)

- Opis: Link-ikona do `/settings`.
- Główne elementy: `<a href="/settings" aria-label="Ustawienia">[ikona]</a>`; `aria-current="page"` jeżeli `pathname === "/settings"`.
- Interakcje: Kliknięcie – nawigacja do ustawień.
- Walidacja: `aria-current` tylko dla dokładnego dopasowania ścieżki; fokus i stany hover.
- Typy: Brak.
- Propsy: `{ active?: boolean }` – steruje `aria-current` i stylem.

### LogoutButton (React 19 – interaktywny)

- Opis: Przycisk-ikona wylogowania. Wywołuje `supabaseClient.auth.signOut()` i po sukcesie przekierowuje do strony logowania (np. `/` lub `/login` – do potwierdzenia, domyślnie `/`).
- Główne elementy: `<button aria-label="Wyloguj">[ikona]</button>` + stan ładowania (spinner/aria-busy).
- Interakcje: `onClick` → `signOut()` → toast sukcesu/błędu → redirect.
- Walidacja: Debounce/lock w trakcie żądania (`disabled`/`aria-disabled`) by zapobiec wielokrotnym kliknięciom.
- Typy: ViewModel: `LogoutViewModel`.
- Propsy: `{ redirectTo?: string }` (domyślnie `/`).

### PortalLayer (Astro)

- Opis: Kontener dla portali modalnych (np. Radix UI). Dodaje `<div id="modal-root" />` tuż przed zamknięciem `<body>`.
- Główne elementy: `<div id="modal-root" />`.
- Interakcje: Brak.
- Walidacja: Unikalny `id` w DOM.
- Typy/Propsy: Brak.

## 5. Typy

- `LogoutViewModel`
  - `isLoading: boolean` – kontrola stanu aktywnego żądania sign-out.
  - `error?: string | null` – komunikat błędu do ewentualnego wyświetlenia (opcjonalny; głównie toasts).
- Wykorzystanie istniejących typów: brak nowych DTO. Layout nie pobiera danych z API.

## 6. Zarządzanie stanem

- Stan lokalny w `LogoutButton` (React): `isLoading`, `error` via `useState`.
- Brak globalnego stanu. Aktywny link ustalany przez `Astro.url.pathname` i przekazywany jako prop/warunek w Astro.
- Responsywność realizowana CSS/Tailwind (bez stanu) – ewentualnie pojedynczy toggle dla menu mobilnego (opcjonalne, z `useState`).

## 7. Integracja API

- Brak własnych endpointów. Logika będzie implementowana na dalszym etapie budowania aplikacji. Na razie akcja ma być zmockowana.
  - Powiadomienia: `showSuccessToast("Wylogowano pomyślnie")`/`showErrorToast("Nie udało się wylogować")` z `src/lib/utils/toast-helpers.ts`.

## 8. Interakcje użytkownika

- Klik w logo: Nawigacja do strony głównej `/`.
- Klik w ikonę zębatki: Nawigacja do `/settings`; link ma `aria-current="page"` gdy aktywny.
- Klik w ikonę wylogowania: `signOut` → toast → przekierowanie do `/` (lub `/login` gdy taki widok powstanie).
- Fokus i klawiatura: Wszystkie elementy fokusowalne (`tabindex` domyślny), aktywacja enter/space na przycisku logout.

## 9. Warunki i walidacja

- `aria-current` tylko przy dokładnym dopasowaniu aktywnej ścieżki (`/settings`).
- `LogoutButton`:
  - Gdy `isLoading` – atrybuty: `disabled`, `aria-disabled`, `aria-busy`, blokada wielokrotnego kliknięcia.
  - Obsługa błędu: pokazanie toastu i pozostanie na bieżącej stronie.
- Kontrast i rozmiar celów dotykowych (min. ~44px): klasy Tailwind zapewniające czytelność i dostępność.

## 10. Obsługa błędów

- `signOut` zwraca błąd (np. problem sieciowy):
  - Pokaż `showErrorToast` z przyjaznym komunikatem.
  - Zresetuj `isLoading` i pozwól na ponowną próbę.

## 11. Kroki implementacji

1. Utwórz `src/layouts/AppLayout.astro` bazujący na `src/layouts/Layout.astro` i dodaj w nim:
   - `<header>` z `AppTopBar`.
   - `<main class="container mx-auto px-4 py-6"><slot /></main>`.
   - `<div id="modal-root" />` przed zamknięciem `<body>` (jeśli nie jest już w bazowym layoucie).
2. Dodaj `src/components/app/AppTopBar.astro` z `BrandLogo`, `SettingsLink`, `LogoutButton`:
   - Ustal `currentPath = Astro.url.pathname` i ustaw `aria-current` na linku ustawień przy dopasowaniu.
   - Zastosuj Tailwind do ułożenia i stanów interakcji (hover/focus-visible/active, dark mode).
   - Wbuduj proste inline SVG dla ikon (zębatka, wylogowanie).
3. Dodaj `src/components/app/LogoutButton.tsx` (React 19):
   - `useState` dla `isLoading` i obsługi błędów.
   - `onClick`: `await supabaseClient.auth.signOut()`; pokaż toast; przekieruj do `/`.
   - Atrybuty dostępności: `aria-label`, `aria-busy`, `disabled` podczas żądania.
   - Eksport jako komponent z `client:only="react"` w Astro.
4. Zaktualizuj strony do użycia nowego layoutu:
   - `src/pages/ideas.astro`: import `AppLayout` i owiń `<IdeasView />` w `<AppLayout title="Moje pomysły"> ... </AppLayout>`.
   - `src/pages/settings.astro`: import `AppLayout` i owiń zawartość w `<AppLayout title="Ustawienia konta"> ... </AppLayout>`.
5. Upewnij się, że `Toaster` pozostaje dostępny globalnie:
   - Jeśli `Toaster` jest tylko w `Layout.astro`, a `AppLayout` używa `Layout.astro` jako bazy, nie rób duplikacji.
6. Stylowanie i responsywność:
   - Nagłówek: sticky top, tło i obramowanie (np. `sticky top-0 bg-background/80 backdrop-blur border-b`), spacing.
   - Przyciski/ikonki: rozmiary dotykowe, focus-visible ring.
7. Dostępność:
   - Dodaj `aria-label` do ikon, `aria-current` do aktywnego linku, sensowną kolejność tab.
8. Testy manualne (lokalnie):
   - Klik w logo → `/`.
   - Klik w zębatkę → `/settings` i aktywny stan linku.
   - Klik w wylogowanie → toast + redirect.
   - Sprawdź zachowanie na małych i dużych ekranach.
