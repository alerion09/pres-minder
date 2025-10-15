# API Endpoint Implementation Plan: GET /api/relations

## 1. Przegląd punktu końcowego

Zwraca listę dostępnych typów relacji (słownik). Endpoint wymaga uwierzytelnienia JWT (Supabase). Dane pochodzą z tabeli relations i są dostępne dla wszystkich zalogowanych użytkowników zgodnie z RLS.

## 2. Szczegóły żądania

- Metoda HTTP: GET
- Struktura URL: /api/relations
- Parametry:
  - Wymagane: brak
  - Opcjonalne: brak
- Request Body: brak
- Nagłówki:
  - Authorization: Bearer <jwt_token>

## 3. Wykorzystywane typy

- DTO:
  - RelationDTO (id: number, name: string) – bezpośrednie mapowanie tabeli relations
- Modele Command: brak (brak body)

## 3. Szczegóły odpowiedzi

- 200 OK
  - Body:
    {
    "data": [
    { "id": number, "name": string }
    ]
    }
- 401 Unauthorized
  - Body:
    { "error": "Authentication required" }
- 500 Internal Server Error
  - Body:
    { "error": "Internal server error" }

Nagłówki:

- Content-Type: application/json; charset=utf-8
- Cache-Control: public, max-age=300, stale-while-revalidate=600 (możliwe krótkie cache dla słownika)

## 4. Przepływ danych

1. Klient wywołuje GET /api/relations z nagłówkiem Authorization.
2. Middleware Astro udostępnia context.locals.supabase (SupabaseClient).
3. Handler endpointu:
   - Waliduje obecność i ważność JWT (sprawdzenie user poprzez supabase.auth.getUser() lub odczyt sesji z requestu jeśli używany helper).
   - Zapytanie do DB przez Supabase: from("relations").select("id,name").order("name", { ascending: true }).
   - RLS: polityka TO authenticated USING (true) umożliwia SELECT po uwierzytelnieniu.
4. Mapowanie wyników bez transformacji do RelationDTO[].
5. Zwraca 200 z { data: [...] }.
6. Błędy uwierzytelnienia → 401; inne błędy → 500 (logowane).

## 5. Względy bezpieczeństwa

- Uwierzytelnienie: wymagane JWT (Supabase Auth). Odmowa bez tokena/nieprawidłowy token (401).
- Autoryzacja: oparcie o RLS “Authenticated users can view relations”.
- Brak danych wrażliwych w odpowiedzi.
- Ochrona przed nadużyciami:
  - Opcjonalnie: prosty rate limit (np. 60 req/min per IP/user) na warstwie edge/reverse proxy.
- Nagłówki bezpieczeństwa:
  - X-Content-Type-Options: nosniff
  - Content-Security-Policy dla całej aplikacji (globalnie)
- Unikanie ujawniania szczegółów błędów w 500.

## 6. Obsługa błędów

- 401 Unauthorized: brak/niepoprawny token (supabase.auth.getUser() zwraca błąd/brak usera).
- 500 Internal Server Error: błędy SDK/połączenia/bazy.
- Scenariusze:
  - Brak Authorization → 401
  - Przeterminowany token → 401
  - Błąd sieci/DB → 500
  - Pusta tabela → 200 z data: [] (to nie jest błąd)

Logowanie:

- Log błędów serwerowych (500) z kontekstem: route, userId (jeśli dostępny), correlationId (request id).
- Bez zapisu danych osobowych lub tokenów.

## 7. Rozważania dotyczące wydajności

- Słownik mały i rzadko zmienny:
  - Użyj krótkiego cache HTTP: Cache-Control public, max-age=300.
  - Po stronie klienta: cache i reużycie.
- Indeks domyślny po PK; zapytanie lekkie (select id,name).
- Ewentualnie dodać order po name z indeksem po name, jeżeli rozmiar urośnie.

## 8. Etapy wdrożenia

1. Struktura plików
   - Upewnij się, że istnieją:
     - /src/db/database.types.ts
     - /src/db/supabase.client.ts
     - /src/middleware/index.ts (dodaje supabase do context.locals)
     - /src/types.ts (RelationDTO)
2. Implementacja endpointu
   - Utwórz plik: /src/pages/api/relations.ts
   - W endpointcie:
     - export const prerender = false
     - export async function GET(context)
     - Pobierz supabase z context.locals.supabase
     - Zweryfikuj użytkownika (supabase.auth.getUser())
       - Jeśli błąd/brak usera → 401 { error: "Authentication required" }
     - Zapytanie: supabase.from("relations").select("id,name").order("name", { ascending: true })
       - Obsłuż error → 500 { error: "Internal server error" } (zaloguj)
     - Zwróć 200 { data: rows } z nagłówkami JSON i Cache-Control
3. Walidacja i kontrakty
   - Brak parametrów wejściowych → brak Zod dla query/body.
   - (Opcjonalnie) Zod do walidacji kształtu danych z DB przed zwróceniem (spójność DTO).
4. RLS i DB
   - Upewnij się, że RLS dla relations jest włączone z polityką TO authenticated USING (true).
   - Dane inicjalne (friend, parent, ...) obecne (zgodnie z migracjami).
