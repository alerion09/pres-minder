# API Endpoint Implementation Plan: GET /api/occasions

## 1. Przegląd punktu końcowego

Zwraca listę dostępnych typów okazji (słownik) dla zalogowanych użytkowników. Dane pochodzą z tabeli dictionary `occasions`. Wymaga uwierzytelnienia (JWT przez Supabase).

## 2. Szczegóły żądania

- Metoda HTTP: GET
- Struktura URL: /api/occasions
- Parametry:
  - Wymagane: brak
  - Opcjonalne: brak
- Request Body: brak
- Nagłówki:
  - Authorization: Bearer <jwt_token> (wymagany)

## 3. Wykorzystywane typy

- DTO:
  - OccasionDTO: { id: number; name: string }
- Brak Command modeli (endpoint tylko do odczytu)

## 3. Szczegóły odpowiedzi

- 200 OK
  - Body:
    {
    "data": [
    { "id": number, "name": string }
    ]
    }
  - Nagłówki: Content-Type: application/json; charset=utf-8, Cache-Control: public, max-age=300, stale-while-revalidate=600, X-Content-Type-Options: nosniff
- 401 Unauthorized
  - Body: { "error": "Authentication required" }
- 500 Internal Server Error
  - Body: { "error": "Internal server error" }

## 4. Przepływ danych

1. Klient wysyła GET /api/occasions z ważnym JWT (Supabase).
2. Astro middleware udostępnia Supabase client w context.locals.supabase.
3. Handler API wykonuje zapytanie: select id, name from occasions order by name asc.
4. Supabase RLS dopuszcza SELECT dla roli authenticated.
5. Wynik mapowany do OccasionDTO[] i zwracany jako { data: [...] }.

## 5. Względy bezpieczeństwa

- Uwierzytelnienie: wymagany JWT Supabase; brak tokenu lub nieważny → 401.
- Autoryzacja: dostęp dla wszystkich zalogowanych (zgodnie z RLS na tabeli occasions).
- Nagłówki bezpieczeństwa: X-Content-Type-Options: nosniff.
- Ograniczenie informacji o błędach: bez wycieków szczegółów DB w odpowiedzi (logi wyłącznie serwerowe).
- CORS: korzystać z globalnej konfiguracji (jeśli ustawiona), endpoint nie zmienia zasad.

## 6. Obsługa błędów

- 401 Unauthorized: brak/niepoprawny token.
- 500 Internal Server Error: błąd bazy lub nieoczekiwany wyjątek.
- Logowanie błędów: console.error z kontekstem [GET /api/occasions], znacznik czasu i treść błędu. (Jeśli istnieje centralna tabela błędów, dodać zapis asynchroniczny bez blokowania odpowiedzi).

## 7. Rozważania dotyczące wydajności

- Słownik mały i statyczny → dodaj krótkie cache (max-age=300, stale-while-revalidate=600).
- Indeksy: primary key na occasions(id) wystarczający; sortowanie po name (kolumna unikalna) – rozmiar mały, brak potrzeby dodatkowego indeksu.
- Minimalna alokacja pamięci: selekcja tylko id, name.
-

## 8. Etapy wdrożenia

1. Utwórz plik endpointu:
   - Ścieżka: src/pages/api/occasions.ts
   - export const prerender = false
   - export const GET: APIRoute
2. W handlerze:
   - Pobierz supabase z context.locals.supabase.
   - Zweryfikuj sesję użytkownika:
     - Wywołaj supabase.auth.getUser() lub sprawdź presence tokena w kontekście; w razie braku/autoryzacji → 401 z { error: "Authentication required" }.
   - Zapytanie do DB:
     - from("occasions").select("id, name").order("name", { ascending: true })
   - Obsłuż błąd bazy:
     - console.error z kontekstem i timestampem.
     - Zwróć 500 z { error: "Internal server error" }.
   - Zwróć 200 z { data: OccasionDTO[] } i nagłówkami Content-Type, Cache-Control, X-Content-Type-Options.
