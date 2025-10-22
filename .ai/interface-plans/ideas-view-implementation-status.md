# Status implementacji widoku Lista pomysłów

## Zrealizowane kroki

### 1. Routing i podstawowa struktura ✅

- **Plik**: `src/pages/ideas.astro`
- Utworzono stronę SSR z konfiguracją `prerender = false`
- Zaimplementowano parsowanie parametrów query (page, limit, sort, order, relationId, occasionId, source)
- Wykorzystano typy z `GetIdeasQueryParams` i `IdeaSource`
- Zmieniono nazwy zmiennych na camelCase zgodnie z konwencją projektu

### 2. Pobieranie danych po stronie serwera ✅

- Równoległe pobieranie danych z 3 endpointów API:
  - `GET /api/relations` - słownik relacji
  - `GET /api/occasions` - słownik okazji
  - `GET /api/ideas` - lista pomysłów z filtrowaniem i paginacją
- Przygotowanie `initialState` do przekazania do komponentów React
- Podstawowa obsługa błędów

### 3. Instalacja komponentów shadcn/ui ✅

- Zainstalowano komponenty: `select`, `card`, `badge`, `dialog`, `alert-dialog`, `skeleton`, `input`, `textarea`, `label`, `separator`, `sonner`

### 4. Typy ViewModel ✅

- **Plik**: `src/lib/types/ideas-view.types.ts`
- Utworzono typy dla widoku:
  - `FilterStateVM` - stan filtrów
  - `FilterOptionsVM` - opcje dla dropdown'ów
  - `SelectOption<T>` - generyczny typ opcji
  - `IdeaCardVM` - model widoku karty pomysłu

### 5. Custom hook dla synchronizacji z URL ✅

- **Plik**: `src/hooks/useQueryStateSync.ts`
- Funkcje: `updateFilters`, `resetFilters`
- Automatyczne resetowanie do strony 1 przy zmianie filtrów
- Synchronizacja stanu z URL query params
- Automatyczne przeładowanie strony po zmianie parametrów

### 6. Komponenty filtrowania ✅

#### FilterControls

- **Plik**: `src/components/ideas/FilterControls.tsx`
- Zrefaktoryzowany do generycznego podejścia z konfiguracją FILTER_CONFIGS
- 5 kontrolek Select: relacja, okazja, źródło, sortowanie, kolejność
- Pełna obsługa ARIA (aria-controls, aria-label)
- Brak powtarzalnego kodu dzięki mapowaniu konfiguracji

#### ResultsCount

- **Plik**: `src/components/ideas/ResultsCount.tsx`
- Wyświetla "X–Y z Z wyników"
- Atrybut `aria-live="polite"` dla dostępności

#### FilterBar

- **Plik**: `src/components/ideas/FilterBar.tsx`
- Łączy FilterControls i ResultsCount
- Inteligentne wykrywanie aktywnych filtrów przez porównanie z DEFAULT_FILTERS
- Przycisk resetowania filtrów (widoczny tylko gdy są aktywne filtry)

### 7. Komponenty siatki pomysłów ✅

#### IdeaCard

- **Plik**: `src/components/ideas/IdeaCard.tsx`
- Karta z nazwą, badge źródła, relacją/okazją, skrótem treści
- Przyciski akcji: Podgląd, Edytuj, Usuń
- Funkcja `truncateText` do skracania treści (150 znaków)
- Obsługa stanu pending i pełne ARIA labels

#### IdeaSourceBadge

- **Plik**: `src/components/ideas/IdeaSourceBadge.tsx`
- Badge z różnymi wariantami dla manual/ai/edited-ai
- Konfiguracja sourceConfig z labelami i wariantami

#### IdeaCardSkeleton

- **Plik**: `src/components/ideas/IdeaCardSkeleton.tsx`
- Szkielet karty podczas ładowania
- Używa komponentu Skeleton z shadcn/ui

#### EmptyState

- **Plik**: `src/components/ideas/EmptyState.tsx`
- Komunikat "Brak pomysłów"
- Opcjonalny przycisk CTA "Dodaj pomysł"

#### IdeasGrid

- **Plik**: `src/components/ideas/IdeasGrid.tsx`
- Responsywna siatka (1/2/3 kolumny)
- Obsługa stanów: loading (skeletons), empty (EmptyState), loaded (karty)
- ARIA attributes: role="list", aria-live="polite", aria-busy

### 8. Paginacja ✅

- **Plik**: `src/components/ideas/IdeasPagination.tsx`
- Przyciski Prev/Next z disable state
- Wyświetla "Strona X z Y"
- Obsługa skrótów klawiaturowych (←/→) z wykluczeniem dla input/textarea/select
- Automatyczne ukrywanie gdy total_pages <= 1
- Fokusowanie listy po zmianie strony dla dostępności

### 9. Główny komponent IdeasView ✅

- **Plik**: `src/components/ideas/IdeasView.tsx`
- Integracja wszystkich komponentów
- Zarządzanie stanem (selectedIdeaId, filters)
- Przygotowanie opcji filtrów z relations/occasions
- Handlery dla akcji: handlePreview, handleEdit, handleDelete, handleCreate (z TODO dla dialogów)
- Pełna integracja z useQueryStateSync

### 10. Integracja z Astro ✅

- **Plik**: `src/pages/ideas.astro`
- Skrypt kliencki montujący React component IdeasView
- Przekazanie initialState z danych SSR do React
- Wykorzystanie createRoot i createElement z React 19

## Kolejne kroki

Zgodnie z planem implementacji (`ideas-view-implementation-plan.md`), pozostały do realizacji:

### 7. IdeaPreviewDialog (TODO)

- Modal tylko do odczytu z pełnymi danymi pomysłu
- Komponenty: Dialog, tytuł, siatka pól, przycisk Close
- Interakcje: otwórz/zamknij, fokusowanie pierwszego elementu, Esc zamyka
- Props: `{ open: boolean, idea?: IdeaDTO, onOpenChange: (o: boolean) => void }`

### 8. IdeaFormDialog - tworzenie/edycja (TODO)

- Jeden modal dla create i edit
- Pola formularza: nazwa, wiek, zainteresowania, relacja, okazja, budżet, opis, treść
- Panel sugestii AI (lista 5 wyników z przyciskami "Akceptuj")
- Walidacja klienta zgodnie z `CreateIdeaCommand` / `UpdateIdeaCommand`
- Integracja z API: `POST /api/ideas` (create) lub `PUT /api/ideas/:id` (edit)
- Obsługa zmiany source: ai → edited-ai po edycji, manual gdy wpisane od zera
- Props: `{ open: boolean, mode: 'create'|'edit', idea?: IdeaDTO, relations: RelationDTO[], occasions: OccasionDTO[], onOpenChange, onSaved }`

### 9. IdeaDeleteAlert (TODO)

- AlertDialog z potwierdzeniem usunięcia
- Przyciski: Usuń/Anuluj
- Integracja z `DELETE /api/ideas/:id`
- Blokada przycisków podczas pending
- Obsługa przypadku brzegowego: ostatni element na stronie → cofnij page o 1
- Props: `{ open: boolean, ideaId: number, onOpenChange, onDeleted: () => void }`

### 10. Błędy i toasty (TODO)

- Zunifikowana obsługa błędów (komponent toast/sonner)
- Obsługa błędów walidacji (400): lista komunikatów, focus na pierwszym błędnym polu
- Obsługa 401: redirect do logowania (w przyszłości)
- Obsługa 404: toast "Nie znaleziono", odświeżenie listy
- Obsługa 500: toast "Błąd serwera", przycisk "Spróbuj ponownie"
- Warstwa dostępności: aria-live dla komunikatów, role="alert" dla poważnych błędów
- Logowanie błędów z timestamp w konsoli

### 11. Testy manualne (TODO)

- Scenariusze: filtry, sortowanie, paginacja, edycja, usuwanie
- Przypadki brzegowe:
  - Ostatni element na stronie
  - Brak wyników
  - Błędy API
  - Długie nazwy/treści
  - Walidacja formularzy
  - Nawigacja klawiaturą
  - Skróty klawiaturowe (←/→)

## Struktura plików

```
src/
├── pages/
│   └── ideas.astro                        # Strona SSR z integracją React
├── components/
│   └── ideas/
│       ├── FilterBar.tsx                  # Pasek filtrów z resetem
│       ├── FilterControls.tsx             # Kontrolki filtrów (generyczne)
│       ├── ResultsCount.tsx               # Licznik wyników
│       ├── IdeasGrid.tsx                  # Siatka kart
│       ├── IdeaCard.tsx                   # Karta pomysłu
│       ├── IdeaSourceBadge.tsx            # Badge źródła
│       ├── IdeaCardSkeleton.tsx           # Szkielet karty
│       ├── EmptyState.tsx                 # Pusty stan
│       ├── IdeasPagination.tsx            # Paginacja
│       └── IdeasView.tsx                  # Główny komponent
├── hooks/
│   └── useQueryStateSync.ts               # Hook synchronizacji z URL
└── lib/
    └── types/
        └── ideas-view.types.ts            # Typy ViewModel
```

## Uwagi techniczne

### Refaktoryzacje i poprawki

1. **FilterBar**: Zaimplementowano funkcję `hasActiveFilters()` porównującą ze stałą `DEFAULT_FILTERS` zamiast wyliczania każdej opcji oddzielnie
2. **FilterControls**: Zrefaktoryzowano do generycznego podejścia z konfiguracją `FILTER_CONFIGS`, eliminując powtarzalny kod
3. **Hooks**: Przeniesiono folder `hooks` na poziom `src/hooks` (zamiast `src/components/hooks`)

### Dostępność (a11y)

- Wszystkie kontrolki mają odpowiednie ARIA labels
- Dynamiczne regiony z aria-live="polite"
- Nawigacja klawiaturowa (←/→) dla paginacji
- Fokusowanie listy po zmianie filtrów/strony
- Wyłączenie skrótów gdy focus na input/textarea/select

### Wydajność

- Równoległe pobieranie danych (relations, occasions, ideas) w SSR
- Skeletons podczas ładowania
- Truncate długich treści w kartach

### Zgodność z zasadami projektu

- Typy z `@/types` dla API DTOs
- Custom hooki w `src/hooks`
- Komponenty React tylko tam gdzie potrzebna interaktywność
- Tailwind CSS dla stylowania
- Shadcn/ui dla komponentów UI
- TypeScript dla bezpieczeństwa typów
