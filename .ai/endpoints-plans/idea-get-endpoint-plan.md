<analysis>
1) Kluczowe punkty specyfikacji API
- Endpoint: GET /api/ideas/:id
- Cel: Pobranie pojedynczej idei prezentu po ID, wzbogaconej o nazwy relacji i okazji.
- Autentykacja: Wymagana (JWT), tylko właściciel zasobu.
- Parametry: id (integer, required) w URL.
- Odpowiedź 200: { data: IdeaDTO } z polami relation_name, occasion_name.
- Błędy: 401 (brak/nieprawidłowy token), 404 (nie istnieje lub nie należy do użytkownika).

2. Parametry

- Wymagane: id (integer, URL param).
- Opcjonalne: brak.
- Body: brak.

3. Niezbędne typy DTO i Command

- DTO: IdeaDTO (już w src/types.ts).
- Command: brak (GET nie ma body).
- Dodatkowo przydatne: ErrorDTO { error: string } (można użyć ad hoc, bez dedykowanego typu).

4. Ekstrakcja logiki do service

- Użyć istniejącego src/lib/services/ideas.service.ts.
- Dodać metodę getIdeaById(supabase, userId, id): Promise<IdeaDTO | null>.
- Metoda wykonuje SELECT z JOIN-ami (lub subselectami) na relations i occasions do pobrania relation_name i occasion_name, z filtrem po user_id (RLS + jawny warunek).

5. Walidacja wejścia (Zod)

- Zod schema dla URL param id: Z.coerce.number().int().positive().
- Walidacja autentykacji: obecność user w Supabase auth (context.locals.supabase.auth.getUser()) lub middleware, zgodnie z backend.md (korzystać z supabase w context.locals).
- Ewentualne sanity checks: zakres integer, ochrona przed nie-numerycznym id.

6. Rejestrowanie błędów

- Jeśli istnieje tabela logów błędów: logować 500 oraz niespodziewane błędy serwera z kontekstem (route, userId, params). Jeśli brak, log do console.error i plan dodania centralnego loggera/middleware.

7. Zagrożenia bezpieczeństwa

- Brak autentykacji/nieprawidłowy JWT -> 401.
- Eskalacja uprawnień: próba dostępu do cudzych idei -> RLS + filtr user_id.
- Enumeracja zasobów przez różne id -> zawsze zwracać 404 bez ujawniania istnienia cudzych rekordów.
- Wstrzyknięcia: użycie SDK Supabase zamiast surowych zapytań.
- Wycieki danych: nie zwracać user_id, trzymać się IdeaDTO.

8. Scenariusze błędów i kody

- Brak/JWT niepoprawny: 401 { error: 'Unauthorized' }.
- id nieprawidłowe (np. NaN, <=0): 400 { error: 'Invalid id' }.
- Idea nie istnieje lub nie należy: 404 { error: 'Idea not found' }.
- Błąd Supabase/DB: 500 { error: 'Internal server error' }.

</analysis>

# API Endpoint Implementation Plan: GET /api/ideas/:id

## 1. Przegląd punktu końcowego

Pobiera pojedynczą ideę prezentu na podstawie identyfikatora należącą do zalogowanego użytkownika. Zwraca obiekt IdeaDTO z nazwami relacji i okazji.

## 2. Szczegóły żądania

- Metoda HTTP: GET
- Struktura URL: /api/ideas/:id
- Parametry:
  - Wymagane: id (integer, > 0)
  - Opcjonalne: brak
- Request Body: brak
- Uwierzytelnienie: JWT przez Supabase (context.locals.supabase)

## 3. Wykorzystywane typy

- IdeaDTO (z src/types.ts)
- Pomocniczo: prosty ErrorDTO w odpowiedziach błędów: { error: string }

## 3. Szczegóły odpowiedzi

- 200 OK
  - Body: { data: IdeaDTO }
- 400 Bad Request
  - Body: { error: "Invalid id" }
- 401 Unauthorized
  - Body: { error: "Unauthorized" }
- 404 Not Found
  - Body: { error: "Idea not found" }
- 500 Internal Server Error
  - Body: { error: "Internal server error" }

IdeaDTO pola (istotne): id, name, content, age, interests, person_description, budget_min, budget_max, relation_id, relation_name, occasion_id, occasion_name, source, created_at, updated_at.

## 4. Przepływ danych

1. Wejście: HTTP GET z URL param :id.
2. Middleware: context.locals.supabase dostępny (zgodnie z backend.md).
3. Autentykacja: pobranie userId z Supabase (np. supabase.auth.getUser() lub verified session z cookies).
4. Walidacja parametru id (Zod).
5. Wywołanie serwisu ideasService.getIdeaById(supabase, userId, id):
   - Zapytanie do tabeli ideas z dołączeniem nazw:
     - relation_name: relations.name na podstawie relation_id (LEFT JOIN lub subselect).
     - occasion_name: occasions.name na podstawie occasion_id (LEFT JOIN lub subselect).
   - Filtrowanie po id oraz user_id użytkownika (dodatkowo do RLS).
6. Wyjście serwisu:
   - IdeaDTO lub null.
7. Mapowanie na odpowiedź HTTP:
   - null -> 404.
   - obiekt -> 200 z { data }.
8. Obsługa błędów: przechwycenie błędu Supabase/SDK -> log + 500.

## 5. Względy bezpieczeństwa

- Uwierzytelnienie wymagane (JWT). Brak lub nieważny token -> 401.
- Autoryzacja: RLS na tabeli ideas + jawne filtrowanie user_id = auth.uid().
- Brak ujawniania user_id w odpowiedzi (IdeaDTO go wyklucza).
- Unikanie ujawniania istnienia cudzych rekordów: zawsze 404 przy braku dostępu.
- Walidacja id zapobiega nadużyciom (np. injection przez ścieżkę).
- Dane środowiskowe przez import.meta.env, bez wycieków.

## 6. Obsługa błędów

- Nieprawidłowe id (NaN, <=0): 400 { error: "Invalid id" }.
- Brak sesji / token nieważny: 401 { error: "Unauthorized" }.
- Nie znaleziono lub cudzy rekord: 404 { error: "Idea not found" }.
- Błąd bazy/Supabase: 500 { error: "Internal server error" }.
- Logowanie:
  - 4xx: ostrzegawczo (warn) z kontekstem: route, userId (jeśli znany), id.
  - 5xx: error z wyjątkiem i szczegółami odpowiedzi Supabase (bez danych wrażliwych).
  - Opcjonalnie: centralny middleware loggera oraz metryki czasu odpowiedzi.

## 7. Rozważania dotyczące wydajności

- Zapytanie po kluczu głównym id + user_id jest selektywne; indeksy pkey i idx_ideas_user_created zapewniają wydajność.
- LEFT JOIN na małe słowniki relations/occasions jest tanie; można użyć subselectów, ale JOIN jest czytelniejszy.
- Ograniczyć selekcję do potrzebnych kolumn.
- Upewnić się, że RLS nie dodaje nadmiernego kosztu (standard w Supabase).
- Dodanie krótkiego timeoutu zapytania (jeśli dostępne w SDK) i retry policy wyłączone dla GET pojedynczego zasobu.

## 8. Etapy wdrożenia

1. Walidacja środowiska:
   - Sprawdź pliki: src/db/supabase.client.ts, src/middleware/index.ts, src/env.d.ts zgodnie z inicjalizacją Supabase dla Astro.
   - Upewnij się, że context.locals.supabase jest dostępny.
2. Dodanie walidacji Zod:
   - Stwórz schema IdParamSchema = z.coerce.number().int().positive().
3. Rozbudowa serwisu:
   - W pliku src/lib/services/ideas.service.ts dodaj funkcję getIdeaById(supabase, userId, id) zwracającą IdeaDTO lub null.
   - Implementacja SELECT:
     - FROM ideas i
     - LEFT JOIN relations r ON r.id = i.relation_id
     - LEFT JOIN occasions o ON o.id = i.occasion_id
     - WHERE i.id = :id AND i.user_id = :userId
     - Wybierz kolumny zgodne z IdeaDTO (bez user_id) oraz r.name AS relation_name, o.name AS occasion_name.
   - Obsłuż supabase error -> rzucić błąd serwisowy lub zwrócić null po 404 (prefer rzucić i niech handler zmapuje).
4. Implementacja endpointu:
   - Plik: src/pages/api/ideas.ts jest listą; dla /api/ideas/:id utwórz nowy plik src/pages/api/ideas/[id].ts z:
     - export const prerender = false
     - export async function GET(context)
     - Pobranie supabase z context.locals.
     - Pobranie usera (supabase.auth.getUser() lub z middleware sesji).
     - Walidacja id z Zod -> 400 w razie błędu.
     - Jeśli brak user -> 401.
     - Wywołanie ideasService.getIdeaById -> jeśli null -> 404, wpp 200 { data }.
     - Try/catch na 500 z logowaniem.
5. Logowanie i monitoring:
   - Dodaj spójne logi dla 4xx/5xx.
   - Jeśli istnieje centralny logger, użyj go; w przeciwnym razie console.warn/error.
6. Przegląd bezpieczeństwa:
   - Zweryfikuj aktywne RLS (w produkcji).
   - Sprawdź, że endpoint nie ujawnia istnienia cudzych rekordów.
