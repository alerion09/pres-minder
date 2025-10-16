<analysis>
1) Podsumowanie specyfikacji API
- Endpoint: DELETE /api/ideas/:id
- Cel: Usunięcie pomysłu na prezent.
- Autentykacja: Wymagana (JWT), użytkownik może usuwać tylko własne rekordy.
- Parametry: id (integer, required) w URL.
- Odpowiedzi:
  - 200 OK: { "message": "Idea deleted successfully" }
  - 401 Unauthorized: brak/nieprawidłowy token
  - 404 Not Found: rekord nie istnieje lub nie należy do użytkownika

2. Parametry

- Wymagane: id (integer > 0) jako URL param.
- Opcjonalne: brak.
- Body: brak.

3. Niezbędne typy DTO i Command

- Brak body → brak Command modelu.
- DTO odpowiedzi sukcesu: { message: string } (można inline).
- DTO błędu: { error: string } (spójne z innymi planami).

4. Ekstrakcja logiki do service

- Użyć nowego serwisu: src/lib/services/ideas/delete-idea.service.ts.
- Dodać metodę: deleteIdeaById(supabase, userId: string, id: number): Promise<boolean>
  - Realizuje DELETE FROM ideas WHERE id=:id AND user_id=:userId
  - Zwraca true, jeśli usunięto (rowCount > 0), w przeciwnym razie false.

5. Walidacja danych wejściowych

- Zod schema dla param id: z.coerce.number().int().positive().
- Walidacja autentykacji: sprawdzenie sesji użytkownika przez context.locals.supabase.
- Spójność z DB: FK na relacje/okazje nie wpływają (usunięcie idei nie narusza FK); CASCADE na users usuwa pomysły — poza zakresem endpointu.

6. Rejestrowanie błędów

- 4xx: console.warn z kontekstem (route, userId jeśli znany, id).
- 5xx: console.error z detalami błędu Supabase (bez danych wrażliwych).
- Jeśli istnieje centralna tabela błędów — asynchroniczny zapis (best-effort).

7. Zagrożenia bezpieczeństwa

- Brak JWT lub nieważny → 401.
- Przejęcie obcych zasobów → zabezpieczyć przez WHERE user_id=:userId (plus RLS w prod).
- Enumeracja ID → dla cudzych rekordów zwracaj 404.
- CSRF: używamy Bearer JWT, więc niski poziom ryzyka; zachować standardowe nagłówki.
- Logi: nie logować pełnych tokenów ani PII.

8. Scenariusze błędów i kody

- 400: nieprawidłowy id (NaN, <=0).
- 401: brak/nieprawidłowy JWT.
- 404: rekord nie istnieje lub nie należy do użytkownika.
- 500: błąd Supabase/DB lub nieoczekiwany wyjątek.

</analysis>

# API Endpoint Implementation Plan: DELETE /api/ideas/:id

## 1. Przegląd punktu końcowego

Usuwa istniejącą ideę prezentu należącą do zalogowanego użytkownika. Wymagana autentykacja JWT. Brak body, identyfikator idei w URL.

## 2. Szczegóły żądania

- Metoda HTTP: DELETE
- Struktura URL: /api/ideas/:id
- Parametry:
  - Wymagane: id (integer > 0, w URL)
  - Opcjonalne: brak
- Request Body: brak
- Nagłówki:
  - Authorization: Bearer <jwt_token> (wymagany)

## 3. Wykorzystywane typy

- Response (sukces): { message: string }
- ErrorDTO: { error: string }

## 3. Szczegóły odpowiedzi

- 200 OK
  - Body: { "message": "Idea deleted successfully" }
- 400 Bad Request
  - Body: { "error": "Invalid id" }
- 401 Unauthorized
  - Body: { "error": "Unauthorized" }
- 404 Not Found
  - Body: { "error": "Idea not found" }
- 500 Internal Server Error
  - Body: { "error": "Internal server error" }

## 4. Przepływ danych

1. Klient wywołuje DELETE /api/ideas/:id z JWT.
2. Astro middleware udostępnia Supabase w context.locals.supabase.
3. Handler:
   - Pobiera usera z sesji Supabase; brak → 401.
   - Waliduje id (Zod: int > 0); niepoprawny → 400.
   - Wywołuje service.deleteIdeaById(supabase, userId, id):
     - DELETE FROM ideas WHERE id=:id AND user_id=:userId
     - Zwraca true, jeśli usunięto rekord, inaczej false.
   - false → 404; true → 200 z komunikatem sukcesu.
4. Błędy SDK/DB → logowanie i 500.

## 5. Względy bezpieczeństwa

- Autentykacja: wymagana; weryfikacja JWT przez Supabase w locals.
- Autoryzacja: ograniczenie do rekordów usera poprzez WHERE user_id=:userId; w produkcji dodatkowo RLS.
- Brak ujawniania informacji o cudzych rekordach (404 dla brakujących/cudzych).
- Parametryzowane zapytania przez supabase-js, brak surowego SQL.
- Nagłówki bezpieczeństwa jak X-Content-Type-Options: nosniff.

## 6. Obsługa błędów

- 400: nieprawidłowy id (NaN, <= 0).
- 401: brak lub niepoprawny token.
- 404: id nie istnieje lub rekord nie należy do użytkownika.
- 500: wyjątki Supabase/nieprzewidziane błędy.
- Logowanie:
  - 4xx → console.warn z kontekstem (endpoint, userId?, id).
  - 5xx → console.error z trace i kodem/wiadomością błędu.

## 7. Wydajność

- Operacja O(1) po PK+user_id; pojedyncze zapytanie DELETE.
- Indeks: PK na ideas.id; dodatkowo selektywność zwiększa warunek user_id.
- Brak zbędnych round-tripów; brak joinów.
- Idempotencja: wielokrotne DELETE na tym samym id → 404 po pierwszym udanym usunięciu (zgodne ze spec).

## 8. Kroki implementacji

1. Środowisko i middleware
   - Upewnij się, że:
     - export const prerender = false dla API.
     - context.locals.supabase jest dostępny (wg backend.md).
2. Walidacja Zod
   - Zdefiniuj IdParamSchema = z.coerce.number().int().positive() w module endpointu lub wspólnym.
3. Serwis
   - W src/lib/services/ideas/delete-idea.service.ts dodaj:
     - async function deleteIdeaById(supabase, userId: string, id: number): Promise<boolean>
       - Wykonaj delete z warunkiem id oraz user_id.
       - Zwróć true, jeśli usunięto wiersz; inaczej false.
   - Dodaj lekkie logowanie wyjątków wewnątrz lub propaguj do handlera.
4. Endpoint API
   - Utwórz plik: src/pages/api/ideas/[id].ts (jeśli już istnieje dla GET/PUT, dodaj DELETE w tym samym pliku).
   - Eksportuj:
     - export const prerender = false
     - export async function DELETE(context)
       - Pobierz supabase z context.locals.
       - Pobierz usera przez supabase.auth.getUser(); brak → 401.
       - Parsuj id z params; waliduj Zod; błąd → 400.
       - Wywołaj ideasService.deleteIdeaById(supabase, user.id, id).
       - false → 404 { error: "Idea not found" }.
       - true → 200 { message: "Idea deleted successfully" }.
       - try/catch → 500 w razie wyjątków.
     - Dodaj nagłówki JSON i X-Content-Type-Options: nosniff.
5. Jakość i zgodność
   - Trzymaj się typów z src/types.ts (ErrorDTO konwencja).
   - SupabaseClient typ z src/db/supabase.client.ts (zgodnie z backend.md).
   - ESLint/Prettier: brak ostrzeżeń.
