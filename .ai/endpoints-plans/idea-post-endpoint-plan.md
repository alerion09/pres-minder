<analysis>
1) Kluczowe punkty specyfikacji API:
- Endpoint: POST /api/ideas
- Cel: utworzenie nowej propozycji prezentu.
- Autentykacja: wymagana (JWT).
- Body: name (min 2), content (required), opcjonalne metadane (age 1-500, interests, person_description, budget_min >= 0, budget_max >= budget_min), relation_id, occasion_id, source enum manual|ai|edited-ai (required, domyślnie manual).
- Odpowiedź 201: data: IdeaDTO z denormalizowanymi relation_name i occasion_name, bez user_id.
- Błędy: 401 przy braku/niepoprawnym tokenie; 400 z listą błędów walidacji.

2. Wymagane i opcjonalne parametry:

- Wymagane: name, content, source (domyślna wartość manual – ale spec mówi required; zapewnimy default jeśli brak).
- Opcjonalne: age, interests, person_description, budget_min, budget_max, relation_id, occasion_id.
- JWT wymaga użytkownika (user_id) z kontekstu.

3. Niezbędne typy DTO i Command Modele:

- CreateIdeaCommand (request) – już zdefiniowany w src/types.ts.
- IdeaDTO (response) – już zdefiniowany.
- Enums IdeaSource.
- Ewentualnie ValidationErrorDTO do spójnej odpowiedzi 400.

4. Ekstrakcja logiki do service:

- Użyj nowego serwisu src/lib/services/ideas/create-idea.service.ts. Dodaj metodę createIdea(supabase, userId, cmd): Promise<IdeaDTO>.
- Serwis: walidacja referencyjna relation_id/occasion_id (opcjonalna: existence check), zapis do tabeli ideas, pobranie z joinami nazwy relation/occasion albo osobne zapytanie po insert z left join.
- Serwis kapsułkuje mapowanie Idea -> IdeaDTO.

5. Walidacja danych wejściowych:

- Zod schema dla CreateIdeaCommand z regułami: name min(2), content required, source enum, age int w 1..500, budget_min >= 0, budget_max >= budget_min (jeśli oba podane), relation_id/occasion_id dodatnie liczby całkowite.
- Dodatkowo biznesowa walidacja: source default na 'manual' jeżeli brak; trymer stringów.
- Opcjonalnie walidacja istnienia relation_id/occasion_id (SELECT EXISTS) – w razie braku, 400 z komunikatem „relation_id not found”/„occasion_id not found”.

6. Rejestrowanie błędów:

- Jeśli istnieje tabela błędów – brak wzmianki – więc minimalnie: log do server console oraz do Supabase function logów. Jeżeli w projekcie mamy middleware logger lub usługę telemetryjną, wywołać ją. Opcjonalnie dodać event do dedykowanej tabeli audit/logs (poza zakresem jeśli nie ma).

7. Zagrożenia bezpieczeństwa:

- Brak RLS: w migracjach jest „disable_rls_for_development.sql” – zabezpieczyć dostęp przez serwerowy supabase z locals i wymuszać user_id = auth user; nigdy nie przyjmować user_id z klienta.
- JWT w Astro: korzystać z locals.supabase i locals.user; sprawdzić, że user jest zalogowany.
- Walidacja inputu przeciwko injection (Zod i parametryzowane zapytania przez supabase-js).
- Źródła: tylko enum zdefiniowany.
- Limit długości pól, by uniknąć abuse (opcjonalnie schema: max długości np. 5000 dla content).
- Rate limiting (middleware) i CSRF nie dotyczy czystego API z Bearer, ale można dodać.

8. Scenariusze błędów i kody:

- 401: brak/invalid JWT lub brak user w locals.
- 400: naruszenie schemy (min name, budżety, zakres wieku), nieistniejący relation_id/occasion_id, konflikt budżetu.
- 500: błąd bazy (insert/select fail), wewnętrzne wyjątki.

</analysis>

# API Endpoint Implementation Plan: POST /api/ideas

## 1. Przegląd punktu końcowego

Tworzy nową propozycję prezentu przypisaną do zalogowanego użytkownika. Wymaga JWT. Zwraca pełny obiekt IdeaDTO z nazwami powiązanych słowników (relation_name, occasion_name).

## 2. Szczegóły żądania

- Metoda HTTP: POST
- Struktura URL: /api/ideas
- Parametry:
  - Wymagane w body: name, content, source (domyślnie manual, jeśli nie podano)
  - Opcjonalne w body: age, interests, person_description, budget_min, budget_max, relation_id, occasion_id
- Request Body (JSON):
  - name: string, min 2, max 255
  - content: string, max 10000
  - age?: integer 1–500
  - interests?: string, max 5000
  - person_description?: string, max 5000
  - budget_min?: number >= 0
  - budget_max?: number >= budget_min (jeśli oba podane)
  - relation_id?: integer
  - occasion_id?: integer
  - source?: enum: manual|ai|edited-ai

## 3. Wykorzystywane typy

- CreateIdeaCommand (request)
- IdeaDTO (response)
- IdeaSource enum
- Ewentualny ValidationErrorDTO:
  - { error: "Validation error", details: string[] }

## 3. Szczegóły odpowiedzi

- 201 Created:
  - { data: IdeaDTO }
- 400 Bad Request:
  - { error: "Validation error", details: string[] }
- 401 Unauthorized:
  - { error: "Unauthorized" }
- 500 Internal Server Error:
  - { error: "Internal server error" }

IdeaDTO pola:

- id, name, content, age, interests, person_description, budget_min, budget_max, relation_id, relation_name, occasion_id, occasion_name, source, created_at, updated_at

## 4. Przepływ danych

- Klient -> POST /api/ideas z JWT i JSON body.
- Middleware/locals dostarcza supabase i user.
- Walidacja Zod na body -> normalizacja (trim, defaulty).
- Opcjonalny check istnienia relation_id/occasion_id.
- Insert do tabeli ideas z user_id = user.id.
- Select po wstawieniu (by id) z left join relations/occasions (lub dwa dodatkowe zapytania) w celu uzupełnienia relation_name, occasion_name.
- Mapowanie rekordu do IdeaDTO (bez user_id).
- Odpowiedź 201 z data: IdeaDTO.

## 5. Względy bezpieczeństwa

- Autentykacja: wymagany zalogowany user z JWT; użyć locals.supabase i locals.user z Astro middleware.
- Autoryzacja: user może tworzyć tylko własne pomysły; user_id ustawiany serwerowo.
- RLS: w dev wyłączone – endpoint musi bezwzględnie nadawać user_id z tokena, nie z inputu.
- Walidacja danych: Zod schema zgodna z ograniczeniami DB; ogranicz długość stringów (np. name max 255, content rozsądny limit, np. 10k).
- Ochrona przed nadużyciami: rozważyć rate limiting na IP/user (middleware).
- Dane wrażliwe: nie zwracamy user_id.
- Env: używać import.meta.env; brak bezpośrednich sekretów w kodzie.
- SQL Injection: supabase-js używa parametryzacji; nie interpolować ręcznych zapytań.

## 6. Obsługa błędów

- 401: brak user w locals -> zwróć { error: "Unauthorized" }.
- 400:
  - Nieprawidłowe pola wg Zod -> zbierz z.errors do details[].
  - age poza zakresem, name krótsze niż 2, budżety niespójne, nieistniejący relation_id/occasion_id.
- 500:
  - Błędy bazy (insert/select) lub inne nieoczekiwane wyjątki.
- Logowanie:
  - console.error na serwerze z kontekstem (endpoint, userId, correlationId jeśli dostępny).
  - Jeśli istnieje centralny logger/middleware – użyj.
- Format odpowiedzi błędu spójny z resztą API.

## 7. Rozważania dotyczące wydajności

- Wstawienie + pojedynczy select z left join zamiast wielu zapytań.
- Indeksy: primary key na ideas.id; opcjonalnie indeksy na relation_id i occasion_id już zapewnione przez FK; nie wymagamy dodatkowych dla create.
- Ograniczenie rozmiaru content w celu uniknięcia dużych payloadów.
- Utrzymanie lekkiej walidacji po stronie serwera; brak nadmiarowych round-tripów.

## 8. Etapy wdrożenia

1. Walidacja i middleware
   - Upewnij się, że middleware ustawia locals.supabase i locals.user.
   - Dodaj export const prerender = false w pliku endpointu.
2. Schemat Zod
   - Utwórz zod schema CreateIdeaSchema w /src/pages/api/ideas.ts (lub wyodrębnij do src/lib/schemas/ideas.ts).
   - Reguły: name min(2) max(255), content min(1) max(np. 10000), age int 1..500, budget_min >= 0, budget_max >= budget_min, relation_id/occasion_id dodatnie int, source enum z default 'manual'. Trim dla stringów.
3. Serwis
   - W src/lib/services/ideas/create-idea.service.ts dodaj funkcję:
     - createIdea(supabase, userId: string, cmd: CreateIdeaCommand): Promise<IdeaDTO>
     - Zapis: insert do ideas z user_id, returning id.
     - Następnie select join:
       - ideas i
       - left join relations r on r.id = i.relation_id
       - left join occasions o on o.id = i.occasion_id
       - where i.id = insertedId
     - Mapowanie do IdeaDTO (relation_name/occasion_name z r.name/o.name).
   - Opcjonalnie dodaj funkcję checkDictionaryExistence jeśli decydujemy się walidować existence relation_id/occasion_id przed insertem; alternatywnie zaufać FK (SET NULL na delete – ale przy insercie FK wymaga istnienia).
4. Endpoint
   - W src/pages/api/ideas.ts dodaj obsługę POST:
     - Sprawdź user z locals; w razie braku -> 401.
     - Parsuj JSON body; waliduj Zod; w razie błędów -> 400 z details[].
     - Wywołaj ideasService.createIdea(locals.supabase, user.id, parsedData).
     - Zwróć 201 z { data: ideaDto }.
   - Zapewnij nagłówki: Content-Type: application/json.
5. Błędy DB i spójność
   - Jeśli supabase insert zwróci error (np. FK violation gdy relation_id/occasion_id nie istnieje) -> mapuj na 400 z details zawierającymi odpowiedni komunikat (np. "relation_id not found").
6. Testy ręczne i automatyczne
   - Scenariusze:
     - Brak JWT -> 401
     - Poprawne dane minimalne (name, content) -> 201
     - age=0, name="" -> 400 z listą błędów
     - budget_max < budget_min -> 400
     - Nieistniejący relation_id -> 400 (lub błąd DB zmapowany)
     - source brak -> default manual -> 201
   - Sprawdź, że response nie zawiera user_id i posiada relation_name/occasion_name.
7. Jakość i lint
   - Zgodność z ESLint/Prettier.
   - Typy z src/types.ts (CreateIdeaCommand, IdeaDTO).
   - SupabaseClient type z src/db/supabase.client.ts (nie z @supabase/supabase-js).
8. Monitorowanie i limity
   - Dodać podstawowy rate limit w middleware (opcjonalnie).
   - Logować błędy z korelacją (request id) jeśli dostępne.
