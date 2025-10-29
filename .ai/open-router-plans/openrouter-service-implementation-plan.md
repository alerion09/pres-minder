# Usługa OpenRouter — Zwięzły plan implementacji (Astro 5 / TS 5 / Node 22)

## 1. Opis usługi

- Warstwa pośrednia do komunikacji z OpenRouter dla czatów LLM (w tym odpowiedzi ustrukturyzowane JSON).
- Jednolity interfejs: konfiguracja modelu i parametrów per wywołanie, wsparcie system/user message, response_format.
- Kontrola niezawodności: timeout, retry z backoff, mapowanie błędów i minimalne logowanie metadanych.
- Przeznaczona do użycia w SSR Astro i w API routes (`src/pages/api`).

## 2. Opis konstruktora

- Pola konfiguracyjne: `apiKey`, `baseUrl`, `defaultModel`, `defaultParams`, `requestTimeoutMs`, `retry{maxAttempts, baseDelayMs, factor}`, `appMeta{appName, appUrl}`.
- Domyślne wartości: `baseUrl=https://openrouter.ai/api/v1`, bezpieczne `defaultParams`, rozsądny `requestTimeoutMs` i `retry`.
- Źródła: klucz z `import.meta.env` (strona serwera), nagłówki identyfikujące aplikację.

## 3. Publiczne metody i pola

- chat(options): obsługa rozmów (system + user + inne role), wybór modelu i parametrów, zwrot znormalizowanego wyniku (treść, model, usage).
- chatStructured(options): jak wyżej, z `response_format` typu `json_schema` oraz walidacją wyniku (po stronie usługi lub wywołującego).
- withOverrides(overrides): tworzy instancję z nadpisaną konfiguracją domyślną.
- getDefaultConfig(): zwraca efektywną konfigurację (bez ujawniania sekretów).

Uwzględnij elementy OpenRouter w wywołaniach:

- Komunikat systemowy: pierwsza wiadomość, definiuje zachowanie modelu.
- Komunikat użytkownika: właściwa treść zapytania; unikaj wrażliwych danych.
- Ustrukturyzowane odpowiedzi: `response_format` typu json_schema (name, strict=true, schema=JSON Schema); oczekuj zwrotu zgodnego z tym schematem.
- Nazwa modelu: w `options.model`, z domyślną wartością w konfiguracji.
- Parametry modelu: w `options.params` (np. temperature, top_p, max_tokens); łączone z domyślnymi.

## 4. Prywatne metody i pola

- \_request(): opakowanie `fetch` z `AbortController`, retry/backoff, rozpoznanie 429/5xx, obsługa timeout.
- \_headers(): budowa nagłówków (Authorization, Content-Type, HTTP-Referer, X-Title).
- \_toChatPayload(): normalizacja wejścia do formatu OpenRouter (`/responses` lub `/chat/completions`).
- \_parseChatResponse(): ujednolicenie odpowiedzi (tekst, model, usage), niezależnie od wariantu endpointu.
- \_parseStructured(): bezpieczny parsing JSON zgodny ze wskazanym `response_format`, opcjonalna walidacja.
- Pole prywatne z konfiguracją zmergowaną z domyślnymi.

## 5. Obsługa błędów

1. Brak/niepoprawny klucz API lub kontekst — błąd konfiguracji, bez ujawniania sekretów.
2. Timeout — klasyfikuj jako retryable do wyczerpania prób; finalnie błąd timeout.
3. Rate-limit (429) — respektuj `Retry-After`; retry z backoff, potem błąd limitu.
4. Błędy 5xx — retry; po wyczerpaniu błąd dostawcy.
5. Błędy walidacji schematu — błąd walidacji z krótką diagnostyką.
6. Nieprawidłowe wejście (wiadomości, brak treści) — błąd wejścia z listą naruszeń.
7. Błędy sieciowe — retryable; finalnie błąd sieci.

## 6. Kwestie bezpieczeństwa

- Klucz API wyłącznie na serwerze (SSR/API), nie w kliencie.
- Limity rozmiaru wejścia/wyjścia i `max_tokens` oraz rozsądne timeouts.
- Ograniczone logowanie: metadane zamiast pełnej treści; redakcja wrażliwych danych.
- Rate limiting/quoty na poziomie API route (np. na użytkownika/Sesję Supabase).
- `response_format` ze `strict=true` i walidacja po stronie backendu przed dalszym użyciem.

## 7. Plan wdrożenia krok po kroku

- Utwórz serwis w `src/lib/services/openrouter.service.ts` oraz typy w `src/lib/services/openrouter.types.ts`.
- Skonfiguruj środowisko: `OPENROUTER_API_KEY`, ewentualnie `PUBLIC_APP_URL` i `PUBLIC_APP_NAME` (nagłówki identyfikacyjne).
- Zaimplementuj metody publiczne i prywatne zgodnie z opisem (bez ujawniania sekretów w logach).
- W API routes (`src/pages/api/*`): `export const prerender = false`, walidacja wejścia (Zod), użycie serwisu z dobranym modelem i parametrami.
- Zdefiniuj: system message (polityka asystenta), user message (zadanie), `response_format` (json_schema z nazwą i schematem), nazwę modelu oraz parametry modelu.
- Dodaj retry/backoff, timeouts i mapowanie błędów; zwracaj spójne payloady błędów 4xx/5xx.
