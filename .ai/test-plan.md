<plan_testów>
Cel i kontekst

- Zapewnienie jakości aplikacji PresMinder (Astro 5 SSR + React 19 + Tailwind 4 + Supabase + OpenRouter), obejmującej logowanie/rejestrację, CRUD pomysłów na prezenty, generowanie AI, filtrowanie/paginację,
  ustawienia konta i middleware autoryzujący.
- Weryfikacja bezpieczeństwa dostępu do danych użytkownika, poprawności walidacji Zod, stabilności integracji z Supabase oraz jakości UI (SSR + interaktywne komponenty React).

Zakres

- Flows użytkownika: rejestracja/logowanie/wylogowanie, reset/update hasła, dashboard z pomysłami (lista, filtry, podgląd, paginacja), CRUD pomysłu (manual/AI/edytowane), generowanie AI, usuwanie konta.
- API SSR (src/pages/api/...): auth, ideas (GET/POST/PUT/DELETE, generate), relations/occasions, account/delete.
- Warstwa usług: serwisy ideas, OpenRouter, walidacje Zod.
- UI/UX: komponenty React (IdeasView i dialogi), Shadcn/ui, nawigacja z View Transitions.
- Bezpieczeństwo i dane: autoryzacja middleware, filtrowanie po user_id, RLS (dev wyłączone w migracji), poprawne czyszczenie cookies przy logout/delete.
- Wyłączone z zakresu: testy instalatora CI/CD (poza sanity run), pełne pen-testy produkcyjne.

Typy testów

- Testy jednostkowe (Vitest): walidacje Zod (auth, ideas), logika usług (mapowanie IdeaDTO, reguły budżetu, budowa promptu AI).
- Testy integracyjne API (supertest/fetch w środowisku SSR): autoryzacja, kody statusów, treści odpowiedzi, nagłówki bezpieczeństwa.
- Testy end-to-end (Playwright): główne ścieżki użytkownika w przeglądarce (SSR + klient React + nawigacja).
- Testy kontraktowe/Schema: spójność src/types.ts z Supabase database.types.ts, payloady OpenRouter (response_format JSON Schema).
- Testy wydajnościowe (lekki smoke): czas odpowiedzi API ideas/generate pod lokalnym Supabase, responsywność listy przy filtrach/paginacji.
- Testy bezpieczeństwa: dostęp do API bez sesji, próby obejścia user_id, CSRF (brak form? – API JSON), zarządzanie sesją po delete/logout.
- Testy dostępności: kluczowe widoki (login, lista, dialogi) – ARIA, focus, keyboard nav.
- Testy regresji wizualnej (opcjonalnie): krytyczne ekrany (login, lista, dialog formularza, pusta lista).

Scenariusze kluczowe

- Auth: rejestracja poprawna/błędne pola/duplikaty; logowanie poprawne/złe hasło; reset request/confirm (sprawdzenie walidacji); update-password flow; logout czyści sesję.
- Middleware: brak sesji → redirect na /login dla stron chronionych; API bez sesji → 401.
- Ideas GET: paginacja (page/limit), sortowanie (created_at/updated_at/name asc/desc), filtry relation/occasion/source; błąd walidacji parametrów (np. negatywny limit) → 400; dane tylko danego usera.
- Idea create: poprawne dane (manual/ai/edited-ai), reguły budżetu, wymagalność name/content, FK relation/occasion; błędny JSON → 400; walidacja długości pól; zwrócony DTO zawiera relation_name/
  occasion_name.
- Idea update/delete (endpointy [id].ts): autoryzacja usera, walidacja ID, aktualizacja pól częściowa, obsługa 404/403, usunięcie i odświeżenie listy.
- Idea preview/dialog: otwarcie podglądu, edycja z wstępnym wypełnieniem, zapis z aktualizacją stanu i reloadem.
- Generowanie AI: poprawne parametry (budżet relacja/okazja), puste wartości -> null, obsługa validation error (Zod), 401 bez sesji, błąd OpenRouter (symulacja timeout/rate limit) → komunikat 500;
  weryfikacja struktury suggestions[5].content po JSON Schema.
- Filtry/paginacja UI: zmiana filtrów resetuje page=1, synchronizacja query params (useQueryStateSync), nawigacja z astro:transitions, loading state.
- Ustawienia: delete account sukces/błąd; po usunięciu brak dostępu do zasobów; komunikaty w UI.
- Dane referencyjne: pobranie relations/occasions w index.astro, obsługa błędów DB.
- UI/UX: brak pustych stanów → EmptyState poprawnie renderuje CTA; skeletony przy ładowaniu; responsywność gridu.
- Dostępność: focus trap w dialogach (Shadcn), role/aria w formularzach, focus po zmianie strony na liście.
- Lokalne migracje: supabase db reset i seed – weryfikacja konsystencji testowych danych (idea_source enum).

Środowisko

- Node 22.14.0; lokalny Supabase (API 54321, DB 54322) z migracjami z supabase/migrations.
- Konfiguracja env bez wycieku tajemnic; stub/fake OpenRouter dla testów automatycznych (np. MSW) lub testowy klucz z limitem.
- Przeglądarka E2E: Chromium/Firefox przez Playwright; viewport desktop/mobile.
- Dane startowe: seed z migracji + konta testowe (user1/user2) do sprawdzania izolacji danych.

Narzędzia

- Vitest + Testing Library (React) do unit/integration.
- Playwright do E2E (headless/headful, trace).
- MSW lub intercept w Playwright do stubu OpenRouter; supabase-js SSR client z testowym serwerem.
- ESLint/Prettier w pipeline; GitHub Actions (CI smoke: lint + unit + e2e-lite).
- Postman/Bruno do eksploracyjnych API.

Harmonogram (iteracje)

- Dzień 1: przegląd testowalności, konfiguracja środowiska, szkielety testów unit (walidacje, usługi).
- Dzień 2: testy integracyjne API (auth, ideas), stub OpenRouter, dane testowe Supabase.
- Dzień 3: scenariusze E2E krytyczne (auth, lista, CRUD, AI happy path), a11y smoke.
- Dzień 4: pokrycie ryzyk (błędy walidacji, autoryzacja, delete account), wydajnościowy smoke.
- Dzień 5: regresja, naprawy, raport, stabilizacja CI.

Kryteria akceptacji

- 0 krytycznych/większych defektów otwartych; wszystkie P1 zamknięte lub obejścia zaakceptowane.
- Zautomatyzowane: ≥80% pokrycia usług walidacyjnych, green pipeline (lint, unit, integracja, e2e smoke).
- Kluczowe ścieżki (auth, CRUD, AI generate, delete account) przechodzą E2E.
- Brak naruszeń autoryzacji (brak dostępu bez sesji/między użytkownikami).
- UI dostępny (brak blokujących problemów WCAG na krytycznych widokach).

Role i odpowiedzialności

- QA: projektowanie/wykonywanie testów, raportowanie defektów, utrzymanie Playwright/MSW, a11y smoke.
- Dev: naprawa defektów, wsparcie stubów, utrzymanie migracji/test data.
- DevOps: utrzymanie CI (GitHub Actions), tajemnice CI, testowe środowisko Supabase.
- PM/Owner: priorytetyzacja defektów, akceptacja kryteriów wyjścia.

Raportowanie błędów

- Narzędzie: backlog (Jira/GitHub Issues); każdy defekt z kontekstem: środowisko, commit, ścieżka kroków, oczek./rzeczywisty wynik, logi (API body/status, console), zrzuty ekranu/trace Playwright.
- Tagowanie: auth, ideas, ai, supabase, ui, a11y, performance.
- SLA: P1 – natychmiast/24h, P2 – 48h, P3 – według sprintu; retesty po fixie + smoke regresja.
  </plan_testów>
