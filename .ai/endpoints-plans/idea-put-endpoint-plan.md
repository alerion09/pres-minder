1. Kluczowe punkty specyfikacji API

- Endpoint: PUT /api/ideas/:id
- Cel: Aktualizacja istniejącej idei prezentu z częściowym body.
- Autentykacja: Wymagana (JWT), tylko właściciel zasobu.
- Parametry: id (integer, required) w URL.
- Body: pola opcjonalne (name, content, age 1-500, interests, person_description, budget_min >= 0, budget_max >= budget_min, relation_id, occasion_id, source; null pozwala usunąć relację/okazję).
- Logika biznesowa: pole source jest przekazywane z frontendu jako część request body i akceptowane przez endpoint.
- Odpowiedź 200: { data: IdeaDTO } z relation_name i occasion_name.
- Błędy: 401, 404, 400 (walidacja z details), 500.

2. Parametry

- Wymagane: id (integer, URL).
- Opcjonalne: wszystkie pola w body, częściowo/całkowicie.
- Uwierzytelnienie: JWT.

3. Niezbędne typy DTO i Command

- UpdateIdeaCommand (zdefiniowany w src/types.ts).
- IdeaDTO (response).
- IdeaSource enum (do logiki źródła).
- ValidationErrorDTO: { error: "Validation error", details: string[] }.

4. Ekstrakcja logiki do service

- W src/lib/services/ideas/update-idea.service.ts dodać updateIdea(supabase, userId, id, cmd): Promise<IdeaDTO | null>.
- Serwis:
  - Pobiera aktualny rekord (id + user_id).
  - Wykonuje update z returning (source jest przekazywane w cmd z frontendu).
  - Dociąga relation_name i occasion_name przez LEFT JOIN lub select po update.

5. Walidacja danych wejściowych

- Zod schema dla UpdateIdeaCommand (partial):
  - name: string.min(2).max(255) opcjonalnie
  - content: string opcjonalnie z rozsądnym max 10000
  - age: int w 1..500 opcjonalnie
  - interests, person_description: string opcjonalnie (z max)
  - budget_min: number >= 0 opcjonalnie
  - budget_max: number >= 0 i >= budget_min gdy oba podane
  - relation_id, occasion_id: int pozytywny lub null (null usuwa)
  - source: enum("manual", "ai", "edited-ai") opcjonalnie
- Dodatkowa walidacja biznesowa: co najmniej jedno pole w body.
- Walidacja spójności budżetu przy pojedynczych zmianach (np. gdy tylko budget_max podany, porównać względem istniejącego budget_min).

6. Logowanie błędów

- 4xx: warn z kontekstem (route, userId, ideaId, fields).
- 5xx: error z details z Supabase (bez danych wrażliwych).
- Jeżeli istnieje centralna tabela logów błędów/audit – zapisać wpis; w przeciwnym razie console.warn/error.

7. Potencjalne zagrożenia bezpieczeństwa

- Brak autentykacji/nieprawidłowy JWT -> 401.
- Dostęp do cudzych rekordów -> filtr user_id + RLS (w prod) + zawsze 404.
- Injekcje -> użycie supabase SDK, Zod sanitizacja i ograniczenia długości.
- Ujawnianie user_id -> IdeaDTO wyklucza.
- Pole source -> przyjmowane z body; walidowane przez Zod enum; odpowiedzialność za poprawną wartość leży po stronie frontendu.
- RLS w dev wyłączone: wymusić warunek user_id.

8. Scenariusze błędów i kody

- 400: puste body, name za krótkie, age poza zakresem, budget_max < budget_min, typy niezgodne, zbyt długie stringi.
- 401: brak/nieważny JWT.
- 404: brak rekordu lub cudzy rekord.
- 409: brak (nie przewidziano konfliktów), można pozostać przy 400 dla constraint violation.
- 500: błąd DB/nieprzewidziany wyjątek.
  </analysis>

# API Endpoint Implementation Plan: PUT /api/ideas/:id

## 1. Przegląd punktu końcowego

Aktualizuje istniejącą ideę prezentu należącą do zalogowanego użytkownika. Obsługuje częściowe aktualizacje pól edytowalnych przez użytkownika, w tym pole source przekazywane z frontendu.

## 2. Szczegóły żądania

- Metoda HTTP: PUT
- Struktura URL: /api/ideas/:id
- Parametry:
  - Wymagane: id (integer > 0, w URL)
  - Opcjonalne: brak
- Request Body (JSON; wszystkie pola opcjonalne, partial update):
  - name: string (min 2)
  - content: string
  - age: integer (1–500)
  - interests: string
  - person_description: string
  - budget_min: number (>= 0)
  - budget_max: number (>= 0 i >= budget_min)
  - relation_id: integer lub null (null usuwa)
  - occasion_id: integer lub null (null usuwa)
  - source: enum("manual", "ai", "edited-ai")
- Uwierzytelnienie: JWT przez Supabase (context.locals.supabase)
- Wymaganie: co najmniej jedno pole w body

## 3. Wykorzystywane typy

- UpdateIdeaCommand (request)
- IdeaDTO (response)
- IdeaSource enum (internal)
- ValidationErrorDTO: { error: "Validation error", details: string[] }

## 3. Szczegóły odpowiedzi

- 200 OK:
  - Body: { data: IdeaDTO }
- 400 Bad Request:
  - Body: { error: "Validation error", details: string[] }
- 401 Unauthorized:
  - Body: { error: "Unauthorized" }
- 404 Not Found:
  - Body: { error: "Idea not found" }
- 500 Internal Server Error:
  - Body: { error: "Internal server error" }

## 4. Przepływ danych

1. Klient wysyła PUT z JWT i JSON body na /api/ideas/:id.
2. Middleware udostępnia locals.supabase.
3. Autentykacja: pobranie usera z sesji Supabase; brak -> 401.
4. Walidacja id (Zod: integer > 0).
5. Walidacja body (Zod; partial, reguły jak w sekcji 2).
6. Odczyt bieżącej idei (SELECT WHERE id=:id AND user_id=:userId). Brak -> 404.
7. Logika zmiany source będzie po stronie frontendu i source zostanie przekazane do endpointa.
8. Ustal wartości budżetu przy walidacji krzyżowej:
   - Jeśli podano tylko budget_max, porównaj z istniejącym (old) budget_min.
   - Jeśli podano tylko budget_min, upewnij się, że istniejący budget_max (jeśli istnieje) >= nowy budget_min.
9. Wykonaj UPDATE z returning.
10. Dociągnij relation_name i occasion_name (LEFT JOIN) i zwróć IdeaDTO (bez user_id).
11. Błędy Supabase -> 400 dla naruszeń walidacji/constraint, w pozostałych przypadkach 500.

## 5. Względy bezpieczeństwa

- Wymagane JWT; brak/niepoprawny -> 401.
- Autoryzacja: użytkownik może aktualizować wyłącznie swoje rekordy (filtr user_id w SELECT/UPDATE). W prod RLS; w dev dodatkowe jawne warunki.
- Ochrona przed enumeracją: 404 dla cudzych lub nieistniejących rekordów.
- Walidacja wejścia (Zod) i ograniczenia długości pól.
- Unikanie ujawniania user_id w odpowiedzi.
- Supabase SDK zapewnia parametryzację zapytań.

## 6. Obsługa błędów

- 400:
  - Puste body lub brak zmienianych pól.
  - Niespójny budżet (budget_max < budget_min).
  - age poza zakresem, name < 2, niepoprawne typy, zbyt długie stringi.
  - FK violation dla relation_id/occasion_id (mapowane do details).
- 401: Brak sesji JWT.
- 404: Nie znaleziono rekordu dla id+user_id.
- 500: Nieoczekiwany błąd serwera/SDK.
- Logowanie:
  - 4xx -> warn z kontekstem (endpoint, userId, ideaId, fields).
  - 5xx -> error z trace i informacją o odpowiedzi DB (bez PII).
  - Opcjonalnie zapis do centralnej tabeli logów/telemetrii.

## 7. Wydajność

- Jedno odczytanie istniejącego rekordu + pojedynczy UPDATE z returning i LEFT JOIN do słowników (lub select po update) — 2 zapytania.
- Indeksy: PK na ideas.id, FK na relation_id/occasion_id; filtr po user_id i id jest selektywny.
- Ograniczenie liczby kolumn w SELECT (tylko potrzebne do IdeaDTO).
- Brak zbędnych round-tripów; pole source przyjmowane bezpośrednio z frontendu.

## 8. Kroki implementacji

1. Przygotowanie środowiska
   - Upewnij się, że middleware ustawiający context.locals.supabase działa.
   - W endpointach API dodaj export const prerender = false.

2. Schemy walidacji (Zod)
   - IdParamSchema: z.coerce.number().int().positive().
   - UpdateIdeaSchema: z.object({
     name: z.string().min(2).max(255).optional(),
     content: z.string().max(10000).optional(),
     age: z.coerce.number().int().min(1).max(500).optional(),
     interests: z.string().max(5000).optional(),
     person_description: z.string().max(5000).optional(),
     budget_min: z.coerce.number().min(0).optional(),
     budget_max: z.coerce.number().min(0).optional(),
     relation_id: z.coerce.number().int().positive().nullable().optional(),
     source: z.enum(["manual", "ai", "edited-ai"]).optional(),
     occasion_id: z.coerce.number().int().positive().nullable().optional(),
     })
     .refine(obj => Object.keys(obj).length > 0, { message: "At least one field must be provided" })
     .refine(obj => {
     // spójność budżetu w kontekście payloadu; krzyżowe sprawdzenie z DB w serwisie
     if (obj.budget_min != null && obj.budget_max != null) return obj.budget_max >= obj.budget_min;
     return true;
     }, { message: "budget_max must be greater than or equal to budget_min" });

3. Rozszerzenie serwisu src/lib/services/ideas/update-idea.service.ts
   - Dodaj:
     - getIdeaByIdForUser(supabase, userId: string, id: number): Promise<Idea | null> — minimalny odczyt istniejącego rekordu (bez joinów).
     - updateIdea(
       supabase,
       userId: string,
       id: number,
       cmd: UpdateIdeaCommand
       ): Promise<IdeaDTO | null>
       - Wczytaj istniejący rekord; jeśli brak -> null.
       - Złóż payload update: rozpakuj cmd, usuń undefined; w tym source jeśli podane; obsłuż null dla relation_id/occasion_id.
       - UPDATE ideas SET ... WHERE id=:id AND user_id=:userId RETURNING \*
       - Dociągnij relation_name i occasion_name (JOIN relations/occasions).
       - Zmapuj do IdeaDTO.
       - Obsłuż błędy supabase -> zamapuj na 400/500.

   - Walidacja krzyżowa budżetu:
     - Jeśli w payloadzie brakuje jednej składowej, porównaj podaną z wartością z old, odrzuć jeśli niespójne (400).

4. Endpoint API: src/pages/api/ideas/[id].ts
   - export const prerender = false
   - export async function PUT(context):
     - Pobierz supabase z context.locals.
     - Sprawdź user (401 jeśli brak).
     - Waliduj id (400).
     - Parsuj JSON i waliduj UpdateIdeaSchema (400 z details[]).
     - Wywołaj service.updateIdea(supabase, user.id, id, parsed).
       - Jeśli null -> 404.
       - Wpp -> 200 { data }.
     - Obsłuż wyjątki: 500.

5. Mapowanie błędów
   - Constraint violations (FK, CHECK) -> 400 z details dopasowanymi do specyfikacji (np. „budget_max must be greater than or equal to budget_min”).
   - Brak rekordu -> 404.
   - Inne -> 500.

6. Testy
   - 401 bez JWT.
   - 404 dla cudzej idei/nieistniejącej.
   - 400: puste body; name="a"; age=0; budget_min=100, budget_max=50; tylko budget_max=50 przy old budget_min=100.
   - Poprawne przekazanie pola source z frontendu.
   - Null relation_id/occasion_id usuwa powiązanie.

7. Jakość i zgodność
   - Zgodność z ESLint/Prettier.
   - Typy z src/types.ts.
   - SupabaseClient typ z src/db/supabase.client.ts.
   - Nie wystawiać user_id w response.

8. Monitorowanie i wydajność
   - Loguj czas wykonania i liczbę zapytań (opcjonalnie).
   - Upewnij się, że liczba round-tripów to max 2.
   - Dodaj proste rate limiting na endpoint (opcjonalnie w middleware).
