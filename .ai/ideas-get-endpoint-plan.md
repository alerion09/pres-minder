<analysis>
1) Kluczowe punkty specyfikacji API:
- Endpoint: GET /api/ideas
- Cel: stronicowana lista pomysłów użytkownika (z nazwami relacji/okazji).
- Autentykacja: wymagane JWT (Supabase).
- Filtrowanie: relation_id, occasion_id, source.
- Sortowanie: sort (created_at|updated_at|name), order (asc|desc).
- Paginacja: page (1), limit (20, max 100).
- Odpowiedź: data: IdeaDTO[], pagination meta. Błędy: 401, 400.

2. Parametry:

- Wymagane: brak.
- Opcjonalne (query): page:int>=1 default 1, limit:int 1..100 default 20, sort: enum, order: enum, relation_id:int>0, occasion_id:int>0, source: enum(manual|ai|edited-ai).

3. DTO i Command modele:

- DTO: IdeaDTO, PaginationMetaDTO, PaginatedIdeasDTO.
- Query model: GetIdeasQueryParams.
- Command modele: brak (GET).

4. Ekstrakcja logiki do service:

- Nowy serwis w src/lib/services/ideas.service.ts:
  - parseAndValidateGetIdeasQuery(query: URLSearchParams | Record<string,string>)
  - getIdeasForUser(userId, params): { data: IdeaDTO[], pagination }
  - mapIdeaRowToDTO(row)
- Ewentualne helpers: buildIdeasQuery(supabase, userId, params), getTotalCount.

5. Walidacja:

- Zod schema dla query: page, limit, sort, order, relation_id, occasion_id, source; coerce z stringów; ograniczenia: limit 1..100; page >=1; id >0; source z enumu types.ts; domyślne wartości; walidacja budżetów nie dotyczy GET listy.
- Walidacja sort/order whitelist, aby uniknąć SQL injection (chociaż Supabase parametryzuje).

6. Logowanie błędów:

- console.error z kontekstem [GET /api/ideas], userId (jeśli dostępny), requestId (z nagłówka lub generowany), timestamp, szczegóły DB.
- Jeśli istnieje tabela błędów: asynchroniczny insert bez blokowania odpowiedzi; w przeciwnym wypadku tylko log.

7. Zagrożenia bezpieczeństwa:

- Brak autoryzacji usera → wyciek danych; wymagane sprawdzenie user_id=auth.uid() oraz RLS.
- Injection przez sort/order → ograniczyć do whitelisty.
- Nadmierne wycieki w błędach → zwracać ogólne komunikaty.
- Brak paginacji limitu → DoS; enforce max 100.
- CORS, nagłówki security; nosniff.
- RLS musi wymuszać user_id = auth.uid(). (Migracja dev może mieć wyłączone RLS — uwaga).

8. Scenariusze błędów:

- Brak/nieprawidłowy JWT → 401 { error: "Authentication required" } (lub zgodnie z planem: "Missing or invalid token").
- Nieprawidłowe query (limit>100, sort spoza enum) → 400 { error: "Validation error", details: [...] }.
- Błąd bazy / joinów → 500 { error: "Internal server error" }.
- Pusta lista → 200 z data: [], poprawne pagination.
  </analysis>

# API Endpoint Implementation Plan: GET /api/ideas

## 1. Przegląd punktu końcowego

Zwraca stronicowaną listę pomysłów na prezenty należących do zalogowanego użytkownika, zdenormalizowaną o nazwy relacji i okazji. Obsługuje filtrowanie, sortowanie i paginację.

## 2. Szczegóły żądania

- Metoda HTTP: GET
- Struktura URL: /api/ideas
- Parametry (query):
  - Wymagane: brak
  - Opcjonalne:
    - page: integer, min 1, domyślnie 1
    - limit: integer, 1..100, domyślnie 20
    - sort: enum [created_at, updated_at, name], domyślnie created_at
    - order: enum [asc, desc], domyślnie desc
    - relation_id: integer > 0
    - occasion_id: integer > 0
    - source: enum ['manual','ai','edited-ai']
- Nagłówki:
  - Authorization: Bearer <jwt_token> (wymagany)
- Request Body: brak

## 3. Wykorzystywane typy

- DTO:
  - IdeaDTO
  - PaginationMetaDTO
  - PaginatedIdeasDTO
- Query:
  - GetIdeasQueryParams

## 3. Szczegóły odpowiedzi

- 200 OK
  - Body: PaginatedIdeasDTO
  - Nagłówki:
    - Content-Type: application/json; charset=utf-8
    - X-Content-Type-Options: nosniff
- 400 Bad Request
  - Body: { "error": "Validation error", "details": string[] }
- 401 Unauthorized
  - Body: { "error": "Authentication required" }
- 500 Internal Server Error
  - Body: { "error": "Internal server error" }

Przykładowa odpowiedź 200:

- data: IdeaDTO[] zawierające: id, name, content, age, interests, person_description, budget_min, budget_max, relation_id, relation_name, occasion_id, occasion_name, source, created_at, updated_at
- pagination: { page, limit, total, total_pages }

## 4. Przepływ danych

1. Klient wywołuje GET /api/ideas z JWT.
2. Middleware Astro udostępnia Supabase w context.locals.supabase.
3. Handler:
   - Pobiera usera: supabase.auth.getUser(); w razie braku → 401.
   - Parsuje i waliduje query (Zod) z domyślnymi wartościami.
   - Buduje zapytanie:
     - from("ideas")
     - select z joinami:
       - select("id,name,content,age,interests,person_description,budget_min,budget_max,relation_id,occasion_id,source,created_at,updated_at, relations!left(name), occasions!left(name)")
       - lub aliasowane: relations(name), occasions(name)
     - where user_id = auth.uid() (wspierane też przez RLS)
     - opcjonalne filtry relation_id, occasion_id, source
     - order(sort, { ascending: order==='asc' })
     - range(offset, offset+limit-1)
   - Równolegle lub sekwencyjnie pobiera total count (np. .select('\*', { count: 'exact', head: true }) lub drugi lekki count query).
   - Mapuje wynik do IdeaDTO (relation_name, occasion_name z joinów; user_id pomija).
   - Zwraca 200 z danymi i metadanymi paginacji.
4. Błędy DB/SDK → log i 500.

## 5. Względy bezpieczeństwa

- Uwierzytelnienie: Supabase JWT wymagane; brak/niepoprawny → 401.
- Autoryzacja: dostęp wyłącznie do pomysłów zalogowanego użytkownika:
  - Filtrowanie po user_id = authenticated user.
  - Wsparcie przez RLS: polityki SELECT/UPDATE/DELETE na ideas z warunkiem user_id = auth.uid().
- Sanityzacja parametrów: whitelist dla sort i order; walidacja typów i zakresów (Zod).
- Ograniczenie limitu do 100 rekordów na żądanie.
- Brak ujawniania user_id w odpowiedzi (IdeaDTO go nie zawiera).
- Nagłówki bezpieczeństwa: X-Content-Type-Options: nosniff.
- CORS: użyć globalnej konfiguracji (endpoint nie nadpisuje).

## 6. Obsługa błędów

- 401 Unauthorized:
  - supabase.auth.getUser() zwraca błąd/brak usera.
- 400 Bad Request:
  - Zod validation fail (np. limit poza zakresem, zły enum sort/order/source).
  - Format odpowiedzi: { error: "Validation error", details: [list błędów] }.
- 500 Internal Server Error:
  - Błąd połączenia/bazy/SDK.
  - Nie zwracać szczegółów technicznych.
- Pusta lista wyników:
  - 200 z data: [] i właściwą paginacją.

Logowanie:

- console.error("[GET /api/ideas]", { userId, requestId, timestamp, error })
- Jeżeli istnieje centralna tabela błędów: asynchroniczny zapis (best-effort), bez blokowania odpowiedzi.

## 7. Wydajność

- Paginacja obowiązkowa, limit max 100.
- Indeksy zalecane:
  - (user_id, created_at DESC), (user_id, updated_at DESC), (user_id, name)
  - (user_id, relation_id), (user_id, occasion_id), (user_id, source)
- Wybieraj tylko potrzebne kolumny.
- Joiny po słownikach jako LEFT JOIN (nazwa może być NULL).
- Count:
  - Prefer select('_', { count: 'exact', head: true }) dla total; ewentualnie osobne zapytanie count(_) z tymi samymi filtrami.
- Unikaj nadmiernych round-tripów (łącz count i listę o ile możliwe; pamiętaj, że Supabase może zwrócić count wraz z listą gdy head: true w oddzielnym zapytaniu).
- Brak cache na poziomie HTTP dla danych użytkownika (dynamiczne i prywatne).

## 8. Kroki implementacji

1. Typy i kontrakty
   - Upewnij się, że src/types.ts zawiera: IdeaDTO, PaginationMetaDTO, PaginatedIdeasDTO, GetIdeasQueryParams (już istnieją).
2. Schemat walidacji
   - Dodaj Zod schema dla query:
     - page: z.coerce.number().int().min(1).default(1)
     - limit: z.coerce.number().int().min(1).max(100).default(20)
     - sort: z.enum(['created_at','updated_at','name']).default('created_at')
     - order: z.enum(['asc','desc']).default('desc')
     - relation_id: z.coerce.number().int().positive().optional()
     - occasion_id: z.coerce.number().int().positive().optional()
     - source: z.enum(['manual','ai','edited-ai']).optional()
3. Serwis
   - Utwórz plik: src/lib/services/ideas.service.ts
   - Funkcje:
     - parseAndValidateGetIdeasQuery(query): zwraca GetIdeasQueryParams lub rzuca ValidationError (z listą details).
     - buildIdeasQuery(supabase, userId, params): konstruuje zapytanie select z filtrami, sort i zakresem.
     - getIdeasForUser(supabase, userId, params):
       - wykonuje zapytanie danych (range offset/limit)
       - wykonuje zapytanie z count (exact) dla total (z tymi samymi filtrami, bez range)
       - mapuje rekordy do IdeaDTO (relation_name = relations.name, occasion_name = occasions.name)
       - zwraca { data, pagination }.
4. Endpoint
   - Ścieżka: src/pages/api/ideas.ts
   - export const prerender = false
   - export const GET: APIRoute = async (context) => { ... }
   - Kroki w handlerze:
     - const supabase = context.locals.supabase
     - const { data: userData, error: authError } = await supabase.auth.getUser()
     - jeśli authError lub !userData.user → 401
     - pobierz query z context.url.searchParams
     - spróbuj parseAndValidateGetIdeasQuery; w razie błędu → 400 z details
     - wywołaj getIdeasForUser(supabase, userId, params)
     - jeśli błąd DB → log + 500
     - zwróć 200 z { data, pagination }, nagłówki JSON + nosniff
