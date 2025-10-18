# API Endpoint Implementation Plan: POST /api/ideas/generate

## 1. Przegląd punktu końcowego
Endpoint generuje propozycje prezentów przy użyciu AI na podstawie podanych wskazówek, bez zapisywania danych w bazie. Wymaga uwierzytelnienia (JWT przez Supabase), wdraża limitowanie żądań per użytkownik i zwraca listę sugestii wraz z metadanymi modelu i czasem generacji.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Struktura URL: /api/ideas/generate
- Parametry:
    - Wymagane: brak (wszystkie pola body są opcjonalne)
    - Opcjonalne:
        - age: integer, 1–500
        - interests: string
        - person_description: string
        - budget_min: number, >= 0
        - budget_max: number, >= budget_min
        - relation_id: integer
        - occasion_id: integer
- Request Body (JSON):
    - Zgodnie z zakresem GenerateIdeaCommand
    - Walidacja i normalizacja z Zod (opis w sekcji 8)
    - Twarde limity długości pól tekstowych (np. 1–1,000 znaków) dla bezpieczeństwa i kosztów

## 3. Wykorzystywane typy
- Command:
    - GenerateIdeaCommand: { age?, interests?, person_description?, budget_min?, budget_max?, relation_id?, occasion_id? }
- DTO:
    - IdeaSuggestionDTO: { content: string }
    - GenerateIdeaResponseDTO: { suggestions: IdeaSuggestionDTO[]; metadata: { model: string; generated_at: string } }
- Dodatkowe typy pomocnicze (w kodzie):
    - ValidationErrorDTO: { error: "Validation error"; details: string[] }
    - RateLimitErrorDTO: { error: "Rate limit exceeded"; message: string; retry_after: number }
    - ServiceUnavailableDTO: { error: "AI service unavailable"; message: string }

## 3. Szczegóły odpowiedzi
- 200 OK
    - Body: { data: { suggestions: [{ content }...], metadata: { model, generated_at } } }
- 400 Bad Request
    - Body: { error: "Validation error", details: [ "..." ] }
- 401 Unauthorized
    - Body: { error: "Unauthorized", message: "Missing or invalid token" }
- 429 Too Many Requests
    - Body: { error: "Rate limit exceeded", message: "Maximum 10 requests per minute. Please try again later.", retry_after: number }
    - Nagłówki: Retry-After: <sekundy do resetu>
- 503 Service Unavailable
    - Body: { error: "AI service unavailable", message: "Unable to generate suggestions at this time. Please try again later." }
- 500 Internal Server Error
    - Body: { error: "Internal server error", message: "Unexpected error" }

Nagłówki wspólne:
- Content-Type: application/json; charset=utf-8
- Cache-Control: no-store

## 4. Przepływ danych
1. Autoryzacja:
    - Endpoint sprawdza JWT przez Supabase: locals.supabase.auth.getUser()
    - Brak użytkownika lub token nieprawidłowy → 401
2. Limitowanie:
    - Rate limiter per user_id: 10 req/min
    - Zwiększenie licznika; gdy przekroczony → 429 + Retry-After
3. Walidacja wejścia:
    - Zod schema weryfikuje typy i reguły (age, budżet, długości tekstów)
    - Budżet: budget_min >= 0, budget_max >= budget_min
    - Opcjonalnie: soft-lookup relation_id/occasion_id (jeśli podane) do wzbogacenia promptu; w razie braku zgodności nie błąd, a pominięcie opisu
4. Przygotowanie promptu:
    - Normalizacja i sanitacja tekstów (trim, collapse whitespace, limit znaków)
    - Zbudowanie instrukcji system + user z kontekstem (wiek, relacja, okazja, budżet, zainteresowania, opis osoby)
    - Ustalenie liczby propozycji (np. 5) i formatu zwrotnego (lista krótkich opisów, bez danych osobowych)
5. Wywołanie AI:
    - OpenRouter API z kluczem z env (OPENROUTER_API_KEY), timeouts, max tokens, temperature
    - Obsługa błędów i przekroczeń limitów dostawcy
6. Mapowanie odpowiedzi:
    - Parsowanie i sprowadzenie do IdeaSuggestionDTO[]
    - Utworzenie metadata: { model, generated_at: new Date().toISOString() }
7. Odpowiedź:
    - 200 OK z { data: { suggestions, metadata } }
8. Audyt/Logowanie błędów (asynchronicznie):
    - W razie błędu AI/serwera: zapis do tabeli logów (np. ai_generation_errors) lub zewnętrzny logger

Brak zapisu do tabeli ideas (zgodnie ze specyfikacją).

## 5. Względy bezpieczeństwa
- Uwierzytelnienie:
    - Wymagane JWT (Supabase), brak publicznego dostępu
- Limitowanie i anty-DoS:
    - 10/min per user; krótkie timeouts (np. 15s), body size limit (np. 32KB)
- Ochrona danych i PII:
    - Nie wysyłać do modelu danych konta użytkownika (tylko treści z żądania)
    - Trunkacja wejścia i filtracja znaków sterujących
- Prompt injection i nadużycia:
    - Instrukcje systemowe zabraniają ujawniania sekretów i danych implementacyjnych
    - Model nie powinien odzwierciedlać sekcji wejściowych dosłownie; prośba o streszczenia
- Tajemnice:
    - OPENROUTER_API_KEY wyłącznie po stronie serwera; nigdy w odpowiedzi ani logach
- RLS i DB:
    - Jeśli wykonujemy lookups relation/occasion, korzystamy z locals.supabase z RLS, wyłącznie SELECT, bez zapisu
- CORS:
    - Ograniczony do zaufanego origin, jeśli endpoint będzie wywoływany z przeglądarki (w Astro domyślnie SSR – kontrola po stronie serwera)
- Nagłówki:
    - No-store, JSON, brak “X-Powered-By” tam, gdzie możliwe

## 6. Obsługa błędów
- 400:
    - Np. age poza zakresem, budget_max < budget_min, błędne typy, zbyt długie pola
- 401:
    - Brak/nieprawidłowy JWT
- 429:
    - Przekroczony limit 10/min; Retry-After w sekundach do resetu okna
- 503:
    - Błąd dostawcy AI (HTTP 5xx/429 z OpenRouter), timeout po stronie AI
- 500:
    - Niespodziewane wyjątki, problemy sieciowe inne niż czasowe
- Logowanie:
    - Minimalne metadane błędu: user_id, path, correlation_id (request-id), error_code, provider_status, timestamp
    - Wrażliwych treści nie logujemy; ewentualnie skrócone hash/preview wejścia

## 7. Rozważania dotyczące wydajności
- Rate limiting:
    - Implementacja o stałym czasie O(1); in-memory LRU dla dev, wariant oparty o Postgres (tabela z rolling window lub fixed window) dla produkcji wieloinstancyjnej
- Wywołania AI:
    - Reużycie połączeń HTTP/keep-alive, krótki timeout, rozważenie strumieniowania w przyszłości
- Ograniczenia kosztów:
    - Twarde limity długości promptu i max_tokens, możliwość konfiguracji temperature/top_p
- Brak zapisu do DB:
    - Zmniejsza latencję; opcjonalne selekty (relation/occasion) tylko jeśli dostarczono ID
- Skalowanie:
    - Idempotentność nie jest wymagana; w przyszłości można rozważyć Idempotency-Key
    - Przy klastrze: użyć współdzielonego store (np. Postgres) do rate limiting

## 8. Etapy wdrożenia
1. Konfiguracja środowiska:
    - Dodać zmienne: OPENROUTER_API_KEY (required), AI_TIMEOUT_MS (np. 15000)
    - Upewnić się, że API routes nie są prerenderowane (prerender = false)
2. Walidacja wejścia:
    - Stworzyć Zod schema GenerateIdeaCommand z regułami: age 1–500; budget_min >= 0; budget_max >= budget_min; ograniczyć długości interests/person_description (np. do 1000 znaków); relation_id/occasion_id jako int dodatnie
    - Funkcja normalizująca stringi (trim, collapse whitespace), bezpieczne rzutowania liczb
3. Uwierzytelnianie:
    - W endpointzie: pobrać user przez locals.supabase.auth.getUser(); brak → 401
4. Rate limiting:
    - Dodać serwis rateLimit(userId, limit=10, window=60s) zwracający { allowed: boolean; retryAfterSec?: number }
    - Zwracać 429 i Retry-After przy odmowie
    - Wersja produkcyjna: tabela np. api_rate_limits(user_id, window_start, count) i upsert w transakcji (fixed window)
5. Lookups słownikowe (opcjonalne, “best effort”):
    - Jeśli relation_id/occasion_id są podane, pobrać ich nazwy przez locals.supabase (SELECT z RLS); jeśli brak lub nie znaleziono – pominąć
6. Serwis AI:
    - Utworzyć usługę generateGiftIdeas(command, options) realizującą:
        - Budowę bezpiecznego promptu (system + user)
        - Wywołanie OpenRouter (chat/completions), timeout, retry (np. 1 raz na 429/5xx z backoff)
        - Parsowanie wyników do IdeaSuggestionDTO[] (dokładnie 5 pozycji; w razie mniejszej liczby – uzupełnienie/odrzucenie wg reguł)
        - Mapowanie metadata: { model, generated_at }
7. Endpoint API:
    - Utworzyć handler POST:
        - Sprawdzić auth → rate limit → walidacja → lookups → AI → 200 z { data: { suggestions, metadata } }
        - Ustawić nagłówki: Content-Type, Cache-Control, opcjonalnie Retry-After
8. Obsługa błędów:
    - Mapowanie wyjątków walidacji → 400; auth → 401; rate limit → 429; AI błędy/timeout → 503; inne → 500
    - Spójny format błędów JSON
    - Zwracać trace id (request-id) w nagłówku dla korelacji (jeśli dostępne)