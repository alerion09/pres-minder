# Specyfikacja techniczna: Moduł autentykacji (US-001, US-002, US-003, US-004, US-010)

Dokument opisuje architekturę funkcjonalności rejestracji, logowania, wylogowania, odzyskiwania hasła oraz wymuszania bezpiecznego dostępu w aplikacji PresMinder. Opracowano zgodnie z PRD (.ai/prd.md) i stackiem (.ai/tech-stack.md) oraz wzorcami architektonicznymi repozytorium (AGENTS.md).

## 1. Architektura interfejsu użytkownika

Cele UI (MVP):

- Oddzielne widoki dla stanu niezalogowanego (auth) i zalogowanego (app).
- Formularze w React 19 z walidacją po stronie klienta, strony i layouty w Astro 5.
- Zgodność z Tailwind 4 oraz shadcn/ui.

### 1.1. Strony i układy

- `src/layouts/AppLayout.astro` (istnieje):
  - Widok dla zalogowanych. Zawiera top bar (`src/components/app/AppTopBar.astro`).
  - Modyfikacja: przyjmuje opcjonalny `user` (email, id) do warunkowego renderowania akcji (np. wyloguj, ustawienia).

- `src/layouts/AuthLayout.astro` (nowy):
  - Minimalny układ dla stron autentykacji (bez top bara z akcjami użytkownika), z brandingiem i miejscem na formularz.
  - Zawiera odnośniki nawigacyjne: „Masz konto? Zaloguj się”, „Nie masz konta? Zarejestruj się”.

- Strony auth (Astro, prerender=false):
  - `src/pages/login.astro`: logowanie (US-002). Zawiera `LoginForm` (React) jako komponent klienta.
  - `src/pages/register.astro`: rejestracja (US-001). Zawiera `RegisterForm` (React).
  - `src/pages/reset-password.astro`: żądanie linku resetu hasła (US-003). Zawiera `PasswordResetRequestForm` (React).
  - `src/pages/update-password.astro`: ustawienie nowego hasła po kliknięciu w link e-mail (obsługa callbacku Supabase). Zawiera `PasswordUpdateForm` (React). (Może być etap 2, patrz 3.3.)

- Strony aplikacji:
  - `src/pages/index.astro` (istnieje): strona główna listy pomysłów. Modyfikacja: SSR-gate – jeśli brak sesji, redirect 302 do `/login` (US-010).
  - `src/pages/settings.astro` (istnieje): ustawienia konta. Modyfikacja: SSR-gate oraz wczytywanie emailu użytkownika z sesji (zamiast TODO). Sekcja usuwania konta (US-004) wykorzysta modal/potwierdzenie w komponencie.

### 1.2. Komponenty React (formularze i UI)

- Katalog: `src/components/auth/`
  - `LoginForm.tsx` – pola: email, password, submit. Akcje: POST do `/api/auth/login`. Obsługa błędów (invalid_credentials, rate-limit, network). Po sukcesie: toast + redirect do `/`.
  - `RegisterForm.tsx` – pola: email, password, checkbox akceptacji regulaminu (opcjonalnie). Akcje: POST do `/api/auth/register`. Obsługa konfliktu e-mail (email_already_used). Po sukcesie: toast + redirect do `/`.
  - `PasswordResetRequestForm.tsx` – pole: email. Akcje: POST do `/api/auth/reset/request`. Komunikat: „Jeśli adres istnieje, wysłaliśmy instrukcje” (bez ujawniania istnienia konta).
  - `PasswordUpdateForm.tsx` – pola: newPassword, confirmPassword. Po załadowaniu strony próbuje wymienić code na sesję (Supabase, patrz 3.3), potem POST do `/api/auth/reset/confirm` lub bezpośrednio `supabase.auth.updateUser`. Po sukcesie: redirect do `/`.
  - `DeleteAccountButton.tsx` – sekcja ustawień: przycisk z potwierdzeniem (checkbox + wpisanie hasła lub wpisanie „USUŃ”). Akcja: DELETE do `/api/auth/account` z body `{ password }` (opcjonalna ponowna weryfikacja hasła). Po sukcesie: redirect do `/login`.
  - Wszystkie formularze: shadcn/ui (`Input`, `Label`, `Button`, `Alert`), walidacja client-side przez Zod, komunikaty błędów przy polach i globalne toast’y (`src/lib/utils/toast-helpers`).

### 1.3. Zachowania nawigacji i stany

- Widok niezalogowany: dostępne jedynie `/login`, `/register`, `/reset-password` (+ ew. `/update-password`). TopBar ukryty lub w wersji ograniczonej.
- Po rejestracji/logowaniu: redirect do `/` (US-001, US-002, US-008 z PRD – onboarding bez samouczków).
- Po wylogowaniu: redirect do `/login` (US-009).
- Błędy walidacji: inline przy polach (email format, hasło minimalna długość), globalny alert dla błędów serwera. Komunikaty dostępne (ARIA live, role=alert).

### 1.4. Walidacja po stronie klienta (Zod)

- Schematy (współdzielone z backendem, patrz 2.2):
  - `AuthEmailSchema = z.string().email()`
  - `AuthPasswordSchema = z.string().min(8)`
  - `LoginSchema = z.object({ email, password })`
  - `RegisterSchema = z.object({ email, password })`
  - `PasswordResetRequestSchema = z.object({ email })`
  - `PasswordUpdateSchema = z.object({ password, confirmPassword }).refine(passwordsMatch)`

## 2. Logika backendowa

### 2.1. Struktura endpointów API

Lokalizacja: `src/pages/api/auth/*` (wszystkie z `export const prerender = false` oraz nazwaną obsługą metod HTTP), wzorzec walidacji i odpowiedzi jak w istniejących API.

- `src/pages/api/auth/register.ts` (POST)
  - Body: `{ email, password }` → walidacja Zod.
  - Działanie: `context.locals.supabase.auth.signUp({ email, password })`.
  - Odpowiedzi:
    - 201 { message: "registered", userId }
    - 409 { error: "email_already_used" }
    - 400/422 walidacja; 500 nieznane błędy.
  - Po sukcesie: jeśli Supabase zwróci sesję – ustawia ciasteczka sesyjne (patrz 3.1/3.2) i autologuje użytkownika.

- `src/pages/api/auth/login.ts` (POST)
  - Body: `{ email, password }` → Zod.
  - Działanie: `supabase.auth.signInWithPassword`.
  - Odpowiedzi: 200 { message: "ok" } lub 401 { error: "invalid_credentials" }.

- `src/pages/api/auth/logout.ts` (POST)
  - Działanie: `supabase.auth.signOut()`; czyści ciasteczka sesyjne.
  - Odpowiedź: 200 { message: "signed_out" }.

- `src/pages/api/auth/reset/request.ts` (POST)
  - Body: `{ email }` → Zod.
  - Działanie: `supabase.auth.resetPasswordForEmail(email, { redirectTo: BASE_URL + "/update-password" })`.
  - Odpowiedź: 200 zawsze (po stronie UI komunikat neutralny, bez ujawniania istnienia konta).

- `src/pages/api/auth/reset/confirm.ts` (POST) – opcjonalne, jeśli implementujemy update przez API
  - Body: `{ password }` → Zod; wymaga, by sesja była aktywna po wymianie code (patrz 3.3).
  - Działanie: `supabase.auth.updateUser({ password })`.
  - Odpowiedź: 200 { message: "password_updated" } lub 401/400 na błędy.

- `src/pages/api/auth/account.ts` (DELETE)
  - Działanie: usuwa konto i dane użytkownika (US-004). Wymaga uprawnień admin (service role).
  - Kroki:
    1. Pobierz `userId` z sesji.
    2. Usuń dane domenowe użytkownika (tabela `ideas`) – `delete from ideas where user_id = :userId`.
    3. Usuń użytkownika z Supabase Auth: `adminClient.auth.admin.deleteUser(userId)`.
  - Odpowiedzi: 200 { message: "account_deleted" } lub 401/403/500.

Standard odpowiedzi błędów:

- JSON: `{ error: string, timestamp: ISO8601, route: string, details?: any }`.
- Logowanie: `console.error` z kontekstem trasy i kodem błędu.

### 2.2. Schematy walidacji (Zod, współdzielone)

- Lokalizacja: `src/types.ts` (sekcja auth) lub `src/lib/validation/auth.schemas.ts`.
- Eksportowane typy/DTO do użycia w formularzach i API:
  - `LoginDto`, `RegisterDto`, `PasswordResetRequestDto`, `PasswordUpdateDto`.
- Serwerowe użycie: parsowanie `await request.json()` → walidacja → serwis → odpowiedź.

### 2.3. Serwis autentykacji

- Lokalizacja: `src/lib/services/auth/auth.service.ts` (+ `index.ts` barrel) – API serwisu wywoływane w route handlerach, kapsułkuje supabase-js.
- Interfejs (przykładowo):
  - `register(supabase, dto: RegisterDto): Promise<{ userId: string }>`
  - `login(supabase, dto: LoginDto): Promise<void>`
  - `logout(supabase): Promise<void>`
  - `requestPasswordReset(supabase, dto: PasswordResetRequestDto, redirectTo: string): Promise<void>`
  - `updatePassword(supabase, dto: PasswordUpdateDto): Promise<void>`
  - `deleteAccount(adminClient, userId: string): Promise<void>`
- Obsługa retry i mapowanie błędów na kody domenowe (np. email_already_used, invalid_credentials).

### 2.4. Aktualizacja SSR renderingu

- `src/pages/index.astro`: przed pobraniem danych sprawdza sesję (patrz 3.2). Jeśli brak – `return Astro.redirect('/login')`.
- `src/pages/settings.astro`: jak wyżej. Uzupełnia `userEmail` z sesji.
- `src/components/app/AppTopBar.astro`: przyjmuje `user?: { id: string; email?: string }`; renderuje przycisk wylogowania tylko jeśli `user` istnieje.

## 3. System autentykacji (Supabase + Astro)

### 3.1. Klienci Supabase

- Istniejący klient: `src/db/supabase.client.ts` (anon key) – pozostaje dla operacji publicznych/bez sesji, ale do autentykacji w SSR potrzebny klient per-request.
- Nowy klient SSR: `src/db/supabase.ssr.ts` (nowy)
  - Tworzenie przez `@supabase/ssr createServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, { cookies: { get, set, remove } })`.
  - Integracja z Astro middleware w celu korzystania z ciasteczek HttpOnly i utrzymywania sesji.
- Klient Admin: `src/db/supabase.admin.ts` (nowy)
  - Tworzy klienta z `SUPABASE_SERVICE_ROLE_KEY` (tylko server-side, nigdy w przeglądarce) dla operacji administracyjnych (US-004 delete user).

### 3.2. Middleware i kontekst żądania

- `src/middleware/index.ts` (modyfikacja):
  - Zamiast statycznego klienta, twórz per-request SSR client i przypisz do `context.locals.supabase`.
  - Dodaj: `context.locals.getSession = () => supabase.auth.getSession()` i `context.locals.getUser = async () => (await supabase.auth.getUser()).data.user`.
  - Ustaw pola pomocnicze: `context.locals.user` (jeśli sesja istnieje) dla wygodnego dostępu na stronach.
  - Opcjonalnie: prosta ochrona tras – jeżeli ścieżka nie zaczyna się od `/login`, `/register`, `/reset-password`, `/update-password`, a brak sesji → redirect do `/login` (US-010). Alternatywnie – sprawdzanie na poziomie stron, aby nie przepinać globalnej nawigacji.

### 3.3. Reset hasła – przepływ

- Żądanie resetu (US-003): z formularza wywołujemy `/api/auth/reset/request`. Backend używa `supabase.auth.resetPasswordForEmail(email, { redirectTo })`.
- Link w e-mailu przekieruje do `redirectTo` z `code`/`token`. Na stronie `src/pages/update-password.astro`:
  - Na mount: `supabase.auth.exchangeCodeForSession(code)` (SSR: przez klienta przeglądarkowego lub endpoint pośredni) – tymczasowa sesja umożliwia ustawienie nowego hasła.
  - Po wymianie: wyślij nowe hasło do `/api/auth/reset/confirm` lub wywołaj bezpośrednio `supabase.auth.updateUser({ password })` w przeglądarce, po czym redirect do `/`.
- MVP: PRD wymaga jedynie linku „Odzyskaj hasło” na stronie logowania. Implementacja pełnego callbacku może być etapem 2, lecz spec uwzględnia ścieżkę docelową.

### 3.4. Wylogowanie

- Front: `LogoutButton.tsx` wywołuje POST `/api/auth/logout` i po sukcesie redirect do `/login`.
- Back: `supabase.auth.signOut()` oraz czyszczenie ciasteczek SSR.

### 3.5. Bezpieczny dostęp do danych (US-010)

- SSR gating: strony aplikacji sprawdzają sesję. Brak sesji → `/login`.
- API: końcówki domenowe (np. `src/pages/api/ideas*.ts`) – modyfikacja, aby userId był brany wyłącznie z sesji (`(await supabase.auth.getUser()).data.user?.id`) zamiast z `import.meta.env.SUPABASE_UUID` lub body. W razie braku sesji → 401.
- Baza danych: zalecane włączenie RLS i polityki dla `ideas`:
  - Enable RLS on `public.ideas`.
  - Policy „owner can select/insert/update/delete”: using `auth.uid() = user_id`.
  - W insert/update usuń możliwość ustawienia `user_id` z zewnątrz – ustawiane serwerowo z sesji.

### 3.6. Ciasteczka i bezpieczeństwo

- `@supabase/ssr` obsługuje sesję w HttpOnly cookies; wymaga przekazania funkcji `get/set/remove` opartych o `Astro.cookies`.
- Atrybuty cookies: `secure`, `sameSite='lax'`, `httpOnly`, `path='/'`.
- Brak ujawniania szczegółów błędów auth użytkownikowi (np. przy reset request – zawsze neutralny komunikat).
- Ochrona przed brute force: opcjonalnie dodać prosty rate-limit na endpointy auth (np. w pamięci lub przez adapter). W MVP – logowanie audit i opóźnienie przy błędach.

## 4. Zmiany i integracje w istniejącym kodzie

### 4.1. Aktualizacja stron i komponentów

- `src/pages/index.astro`: usuń użycie `import.meta.env.SUPABASE_UUID`; pobierz userId z sesji SSR i przekaż do `IdeasView` jako prop. Brak sesji → redirect.
- `src/pages/settings.astro`: wczytaj `userEmail` z `context.locals.user.email` (SSR). Dodaj `DeleteAccountButton`.
- `src/components/app/AppTopBar.astro`: renderuj `LogoutButton` tylko dla zalogowanych; po wylogowaniu redirect do `/login`.

### 4.2. API domenowe (ideas/relations/occasions)

- W plikach `src/pages/api/ideas*.ts` usuń pobieranie `user_id` z body/ENV. Zastąp: `const userId = (await supabase.auth.getUser()).data.user?.id; if (!userId) return 401`.
- Zapytania do bazy filtruj po `user_id = :userId`.

### 4.3. Nowe pliki – podsumowanie

- SSR klient: `src/db/supabase.ssr.ts`
- Admin klient: `src/db/supabase.admin.ts` (server-only)
- Schematy: `src/lib/validation/auth.schemas.ts`
- Serwis: `src/lib/services/auth/auth.service.ts`
- API:
  - `src/pages/api/auth/register.ts`
  - `src/pages/api/auth/login.ts`
  - `src/pages/api/auth/logout.ts`
  - `src/pages/api/auth/reset/request.ts`
  - `src/pages/api/auth/reset/confirm.ts` (opcjonalny)
  - `src/pages/api/auth/account.ts` (DELETE)
- UI:
  - `src/layouts/AuthLayout.astro`
  - `src/pages/login.astro`, `src/pages/register.astro`, `src/pages/reset-password.astro`, `src/pages/update-password.astro`
  - `src/components/auth/LoginForm.tsx`, `RegisterForm.tsx`, `PasswordResetRequestForm.tsx`, `PasswordUpdateForm.tsx`
  - `src/components/settings/DeleteAccountButton.tsx`

## 5. Kontrakty i przykładowe odpowiedzi API

- POST `/api/auth/register`
  - 201: `{ message: "registered", userId: "uuid" }`
  - 409: `{ error: "email_already_used", timestamp, route }`

- POST `/api/auth/login`
  - 200: `{ message: "ok" }`
  - 401: `{ error: "invalid_credentials", timestamp, route }`

- POST `/api/auth/logout`
  - 200: `{ message: "signed_out" }`

- POST `/api/auth/reset/request`
  - 200: `{ message: "email_sent_if_exists" }`

- POST `/api/auth/reset/confirm`
  - 200: `{ message: "password_updated" }`
  - 401/400: `{ error: "invalid_or_expired", ... }`

- DELETE `/api/auth/account`
  - 200: `{ message: "account_deleted" }`
  - 401/403: brak autoryzacji

## 6. Edge cases i obsługa błędów

- Rejestracja: e-mail w użyciu → 409; format e-maila → 422.
- Logowanie: błędny e-mail/hasło → 401; blokada konta (opcjonalna) → 423.
- Reset hasła: zawsze 200 (nie ujawniamy istnienia konta). Link wygasły → komunikat na stronie update-password i możliwość ponowienia.
- Wylogowanie: toleruj brak sesji (idempotentne).
- Usunięcie konta: operacja atomowa – w razie błędu częściowego zwracamy 500 i log; dane użytkownika w tabelach domenowych usuwane przed kasacją użytkownika z Auth.

## 7. Wymagania środowiskowe i konfiguracja

- Zmienne środowiskowe (server-side only):
  - `SUPABASE_URL`, `SUPABASE_KEY` (istniejące)
  - `SUPABASE_SERVICE_ROLE_KEY` – wymagane dla endpointu DELETE konta.
  - `APP_BASE_URL` – do generowania `redirectTo` w reset hasła.
- Nie ujawniamy wartości w kliencie; admin key używany tylko w kodzie serwerowym.

## 8. Plan wdrożenia (etapy)

1. Infrastruktura SSR auth: klienci (`supabase.ssr.ts`, `supabase.admin.ts`), middleware z sesją.
2. UI auth: layout, strony, formularze, integracja z API.
3. Endpointy `/api/auth/*`, mapowanie błędów, logowanie.
4. Gating SSR na stronach app i modyfikacje API domenowych (ideas) – userId z sesji.
5. (Opcjonalnie) pełny flow update-password z `exchangeCodeForSession` i stroną callbacku.
6. (Opcjonalnie) RLS + polityki dla tabel domenowych.

## 9. Zgodność z repozytorium i wzorcami

- Wszystkie endpointy: `export const prerender = false`, nazwy metod `export const POST/GET/...`.
- W route handlerach dostęp do bazy i auth przez `context.locals.supabase`.
- Walidacja: Zod, ten sam wzorzec jak w `src/pages/api/ideas*.ts` (parse → validate → service → response).
- Obsługa błędów: spójny JSON z timestamp i route.
- Frontend: React 19 tylko dla interaktywnych formularzy; Astro dla stron i SSR, Tailwind 4 + shadcn/ui, dostępność (ARIA) i czytelne komunikaty.
