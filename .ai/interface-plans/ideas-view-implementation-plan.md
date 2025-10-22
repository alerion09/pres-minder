# Plan implementacji widoku Lista pomysłów

## 1. Przegląd

Widok listy pomysłów (`/ideas`) prezentuje zapisane pomysły użytkownika w formie siatki kart z filtrowaniem, sortowaniem i paginacją. Umożliwia szybki podgląd, edycję i usuwanie pojedynczych pomysłów. Zapewnia dostępność (nawigacja klawiaturą, aria-atributy), zachowanie stanu w query stringach oraz czytelną obsługę błędów.

## 2. Routing widoku

- Ścieżka: `/ideas`
- Strona SSR w Astro: `src/pages/ideas.astro` (SSR, pobranie danych początkowych po stronie serwera na podstawie query)
- Interakcje klienta aktualizują query string i przeładowują dane (przejścia widoków: View Transitions w Astro)

## 3. Struktura komponentów

- Pasek filtrów (FilterBar)
  - Kontrolki filtrów (FilterControls)
  - Licznik wyników (ResultsCount)
- Siatka kart (IdeasGrid)
  - Karta pomysłu (IdeaCard)
    - Znacznik źródła (IdeaSourceBadge)
    - Akcje: Podgląd, Edytuj, Usuń
- Paginacja (IdeasPagination)
- Pusty stan (EmptyState)
- Szkielety ładowania (IdeaCardSkeleton)
- Modal podglądu (IdeaPreviewDialog)
- Modal formularza (IdeaFormDialog – tworzenie/edycja)
- Potwierdzenie usunięcia (IdeaDeleteAlert)

## 4. Szczegóły komponentów

### FilterBar

- Opis: Pasek u góry widoku z filtrami, sortowaniem i licznikiem wyników; synchronizuje stan z query string.
- Główne elementy: `Select` (relacja, okazja, źródło), `Select`/`Dropdown` (sort, order), `Button` reset, `ResultsCount`.
- Obsługiwane interakcje: zmiana każdego filtra, reset filtrów, nawigacja klawiaturą; aktualizacja query i odświeżenie listy.
- Walidacja: dopuszczalne wartości `source ∈ {manual, ai, edited-ai}`, `relation_id`, `occasion_id` > 0; `sort ∈ {created_at, updated_at, name}`, `order ∈ {asc, desc}`.
- Typy: `GetIdeasQueryParams`, `FilterStateVM`.
- Propsy: `{ value: FilterStateVM, relations: RelationDTO[], occasions: OccasionDTO[], onChange(next: FilterStateVM): void }`.

### FilterControls

- Opis: Wydzielone kontrolki do `FilterBar` dla utrzymania czytelności.
- Główne elementy: `Select` x 4-5, etykiety z `aria-controls="ideas-list"` i `aria-describedby` dla podpowiedzi.
- Interakcje: `onValueChange` dla każdego selecta, Enter/Escape obsługa klawiatury.
- Walidacja: jak wyżej – tylko wartości dozwolone; na starcie wypełnienie z query string.
- Typy: `FilterStateVM` i częściowe typy opcji (`SelectOption<T>`).
- Propsy: `{ value: FilterStateVM, options: FilterOptionsVM, onChange: (p: Partial<FilterStateVM>) => void }`.

### ResultsCount

- Opis: Wyświetla „X z Y wyników” na podstawie metadanych paginacji.
- Główne elementy: tekst z `aria-live="polite"`.
- Interakcje: brak.
- Walidacja: brak (formatowanie liczb).
- Typy: `{ total: number, page: number, limit: number }`.
- Propsy: jw.

### IdeasGrid

- Opis: Siatka kart pomysłów; sterowana przez dane i stan ładowania.
- Główne elementy: `div` grid, dzieci `IdeaCard` lub `IdeaCardSkeleton`/`EmptyState`.
- Interakcje: brak własnych; deleguje do `IdeaCard`.
- Walidacja: brak.
- Typy: `IdeaDTO[]`.
- Propsy: `{ ideas: IdeaDTO[], isLoading: boolean }`.

### IdeaCard

- Opis: Karta z nazwą, okazją, skrótem treści, badge źródła i przyciskami akcji.
- Główne elementy: `Card`, `CardHeader`, `CardContent`, `CardFooter`, `Badge`, `Button` x3.
- Interakcje: `onPreview(id)`, `onEdit(id)`, `onDelete(id)`; zabezpieczenie przed wieloklikiem (disable podczas pending).
- Walidacja: skrót treści (limit znaków), obecność nazwy; bezpieczne renderowanie tekstu.
- Typy: `IdeaDTO` lub `IdeaCardVM`.
- Propsy: `{ idea: IdeaDTO, onPreview: (id:number)=>void, onEdit:(id:number)=>void, onDelete:(id:number)=>void, pending?: boolean }`.

### IdeaSourceBadge

- Opis: Wizualny znacznik źródła `manual|ai|edited-ai`.
- Główne elementy: `Badge` z wariantem zależnym od źródła.
- Interakcje: brak.
- Walidacja: mapowanie tylko do dozwolonych wartości.
- Typy: `IdeaSource`.
- Propsy: `{ source: IdeaSource }`.

### IdeasPagination

- Opis: Sterowanie stronami; aktualizuje `page` w query i fokusuje listę.
- Główne elementy: przyciski `Prev/Next`, „Strona X z Y”, opcjonalnie `Select` rozmiaru strony.
- Interakcje: klik w `Prev/Next`, wybór strony, skróty klawiaturowe (←/→) z `aria-label`.
- Walidacja: `page ≥ 1`, `limit ∈ [1,100]`.
- Typy: `PaginationMetaDTO`.
- Propsy: `{ pagination: PaginationMetaDTO, onPageChange: (next:number)=>void }`.

### EmptyState

- Opis: Pusty stan z krótką informacją i CTA (np. „Dodaj pomysł”).
- Główne elementy: tekst, `Button`.
- Interakcje: CTA otwiera modal formularza w trybie tworzenia.
- Walidacja: brak.
- Typy: brak.
- Propsy: `{ onCreate?: ()=>void }`.

### IdeaCardSkeleton

- Opis: Szkielet karty w trakcie ładowania.
- Główne elementy: `Skeleton` bloki.
- Interakcje: brak.
- Walidacja: brak.
- Typy: brak.
- Propsy: brak.

### IdeaPreviewDialog

- Opis: Modal tylko-do-odczytu z pełnymi danymi pomysłu.
- Główne elementy: `Dialog`, tytuł, siatka pól, `Close`.
- Interakcje: otwórz/zamknij; fokusowanie pierwszego elementu; `Esc` zamyka.
- Walidacja: brak – dane tylko do wyświetlenia.
- Typy: `IdeaDTO`.
- Propsy: `{ open:boolean, idea?: IdeaDTO, onOpenChange:(o:boolean)=>void }`.

### IdeaFormDialog (tworzenie/edycja)

- Opis: Jeden modal obsługujący zarówno dodawanie nowego pomysłu, jak i edycję istniejącego. W trybie tworzenia oraz edycji pozwala na generowanie propozycji AI.
- Główne elementy: `Dialog`, pola formularza (nazwa, wiek, zainteresowania, relacja, okazja, budżet, opis, treść), panel sugestii AI (lista 5 wyników z przyciskami „Akceptuj”), przyciski `Zapisz`/`Anuluj`.
- Interakcje: walidacja klienta; submit → `POST /api/ideas` (create) lub `PUT /api/ideas/:id` (edit); blokada przycisków w trakcie zapisu; zmiana `source` zgodnie z regułami (ai → edited-ai po edycji; manual gdy treść wpisana od zera); sukces: zamknij modal i zaktualizuj listę.
- Walidacja: tworzenie zgodnie z `CreateIdeaCommand` (nazwa 2..255, content 1..10000, budżet spójny, opcjonalne pola ≤ limity); edycja zgodnie z `UpdateIdeaCommand` (min. 1 pole poza `user_id`, budżet spójny, długości pól).
- Typy: `CreateIdeaCommand`, `UpdateIdeaCommand`, `IdeaDTO`.
- Propsy: `{ open:boolean, mode:'create'|'edit', idea?: IdeaDTO, relations: RelationDTO[], occasions: OccasionDTO[], onOpenChange:(o:boolean)=>void, onSaved:(idea:IdeaDTO)=>void }`.

### IdeaDeleteAlert

- Opis: Okno potwierdzenia usunięcia.
- Główne elementy: `AlertDialog` z „Usuń/Anuluj”.
- Interakcje: potwierdzenie → `DELETE /api/ideas/:id`, blokada przycisków podczas pending.
- Walidacja: brak.
- Typy: brak.
- Propsy: `{ open:boolean, ideaId:number, onOpenChange, onDeleted:()=>void }`.

## 5. Typy

- Backendowe DTO (z `src/types.ts`): `RelationDTO`, `OccasionDTO`, `IdeaDTO`, `PaginatedIdeasDTO`, `PaginationMetaDTO`, `IdeaSource`, `GetIdeasQueryParams`.
- Nowe typy ViewModel:
  - `FilterStateVM`: `{ page:number; limit:number; sort:'created_at'|'updated_at'|'name'; order:'asc'|'desc'; relation_id?:number; occasion_id?:number; source?:IdeaSource }`.
  - `FilterOptionsVM`: `{ relations: {id:number;name:string}[]; occasions: {id:number;name:string}[]; sources: {value:IdeaSource;label:string}[]; sorts: {value:'created_at'|'updated_at'|'name';label:string}[]; orders: {value:'asc'|'desc';label:string}[] }`.
  - `SelectOption<T>`: generyczna para `{ value:T; label:string }`.
  - `IdeaCardVM`: alias `IdeaDTO` z polem `excerpt?:string` do skrótu treści.

## 6. Zarządzanie stanem

- Stan filtrów i paginacji w URL (query string) – źródło prawdy; inicjalizacja z `context.url.searchParams` po SSR i hydratacja w kliencie.
- Lokalny stan komponentów: otwarcia dialogów, pending akcji, aktualnie wybrany `ideaId`.
- Custom hooki:
  - `useQueryStateSync<T>()`: synchronizacja stanu z `URLSearchParams` (pushState/replaceState), debouncing.
  - `useIdeasList(filters: FilterStateVM)`: pobranie `/api/ideas` z `filters`, zarządzanie `isLoading`, `error`, `data`.
  - `useKeyboardPagination()`: ←/→ do zmiany `page` (po włączeniu focusu na liście).

## 7. Integracja API

- Słowniki:
  - `GET /api/relations` → `RelationDTO[]`
  - `GET /api/occasions` → `OccasionDTO[]`
- Lista pomysłów:
  - `GET /api/ideas?page&limit&sort&order&relation_id&occasion_id&source` → `PaginatedIdeasDTO`
- Operacje na elemencie:
  - Dodanie: `POST /api/ideas` body `CreateIdeaCommand` → `{ data: IdeaDTO }`
  - Podgląd: `GET /api/ideas/:id` → `{ data: IdeaDTO }`
  - Edycja: `PUT /api/ideas/:id` body `UpdateIdeaCommand` → `{ data: IdeaDTO }`
  - Usunięcie: `DELETE /api/ideas/:id` → `{ message: string }`
- Walidacja po stronie UI: trzymać się zakresów i enumeracji z Zod (min/max, dozwolone wartości); komunikaty błędów z backendu wyświetlać użytkownikowi.

## 8. Interakcje użytkownika

- Zmiana filtra/ sortu → aktualizacja query → pobranie listy → fokusoanie kontenera listy (`aria-live="polite"`).
- Klik „Podgląd” → otwarcie `IdeaPreviewDialog` z danymi; zamknięcie klawiszem `Esc` możliwe.
- Klik „Dodaj pomysł” (CTA/pasek akcji) → `IdeaFormDialog` w trybie `create`; po zapisie pokaż toast powodzenia i odśwież listę (lub wstaw element na początek zgodnie z sortem).
- Klik „Edytuj” → `IdeaFormDialog` w trybie `edit`; po zapisie zamknij modal, pokaż toast powodzenia, odśwież listę lub zaktualizuj element w miejscu.
- Klik „Usuń” → `IdeaDeleteAlert`; po potwierdzeniu usuń element, odśwież licznik i paginację (skrajny przypadek: ostatni element na stronie – cofnij `page` o 1).
- Paginacja: `Prev/Next`, ewentualnie wybór strony; skróty ←/→.

## 9. Warunki i walidacja

- Query: `page ≥ 1`, `limit ∈ [1,100]`, `sort ∈ {created_at,updated_at,name}`, `order ∈ {asc,desc}`, `relation_id|occasion_id > 0`, `source ∈ {manual,ai,edited-ai}`.
- Formularz tworzenia/edycji: dla tworzenia – nazwa 2..255, content 1..10000, pola opcjonalne w limitach, budżet `min ≤ max`; dla edycji – co najmniej jedno pole poza `user_id`, długości i budżet j.w.; `source ∈ {manual, ai, edited-ai}` z aktualizacją po edycji treści.
- UI ogranicza wybory do dozwolonych wartości (Selecty). Przy treści wyświetlanej – bezpieczne renderowanie (tylko tekst, brak HTML).

## 10. Obsługa błędów

- Błędy walidacji (400) → pokazuj listę komunikatów z backendu (toast/inline pod polem), ustaw focus na pierwszym błędnym polu.
- 401 (w przyszłości) → redirect do logowania.
- 404 przy operacjach na elemencie → toast „Nie znaleziono”, odśwież listę.
- 500 → toast „Błąd serwera”, przycisk „Spróbuj ponownie”.
- Warstwa dostępności: `aria-live` dla komunikatów, `role="alert"` dla poważnych błędów.

## 11. Kroki implementacji

1. Routing: utwórz `src/pages/ideas.astro` (SSR, `prerender = false`).
2. Serwer: pobierz słowniki (`relations`, `occasions`) oraz startową listę z query (`/api/ideas`).
3. UI podstawy: dodaj komponenty shadcn (wg potrzeb) przez `npx shadcn@latest add`: `select`, `card`, `badge`, `dialog`, `alert-dialog`, `skeleton`, `input`, `textarea`, `label`, `separator`, `toast` (sonner) lub ekwiwalent.
4. Zaimplementuj `FilterBar` i `FilterControls` z synchronizacją query (`useQueryStateSync`).
5. Zaimplementuj `IdeasGrid`, `IdeaCard`, `IdeaSourceBadge`; dodaj przyciski akcji.
6. Dodaj `IdeasPagination` i obsłuż klawisze ←/→ (opcjonalnie hook `useKeyboardPagination`).
7. Dodaj `IdeaPreviewDialog` (tylko odczyt) oraz `IdeaFormDialog` (jeden modal dla tworzenia i edycji; obsługa POST/PUT, walidacja klienta, panel AI dla trybu tworzenia).
8. Dodaj `IdeaDeleteAlert` i pełną obsługę usunięcia (zabezpieczenie przed wieloklikiem, aktualizacja listy/strony).
9. Pusty stan i szkielety: `EmptyState`, `IdeaCardSkeleton`; aria-live dla komunikatów.
10. Błędy i toasty: zunifikuj obsługę (komponent „toast/sonner”), logowanie błędów z timestamp w konsoli.
11. Testy manualne: scenariusze filtrów, sortu, paginacji, edycji, usuwania; przypadki brzegowe (ostatni element na stronie, brak wyników).
