# Architektura UI dla PresMinder

## 1. Przegląd struktury UI

- Strefa nieautoryzowana (`/login`, `/register`) obejmuje minimalistyczny layout formularzy logowania i rejestracji, oddzielony od części aplikacyjnej.
- Strefa autoryzowana (`/ideas`, `/settings`) korzysta z layoutu z górnym paskiem nawigacyjnym, menu profilu, globalnym centrum toastów i portali modalnych.
- Główny widok `/ideas` łączy górne filtry, licznik wyników, siatkę kart pomysłów, paginację i pusty stan, korzystając z danych słownikowych buforowanych w pamięci.
- Modale formularza, podglądu i usuwania działają jako nakładki na `/ideas`, utrzymując focus trap, kontrolując flagi `source` i integrację z `POST/PUT/DELETE /api/ideas`.
- Widok ustawień `/settings` konsoliduje akcje konta (zmiana hasła, usunięcie konta) i komunikuje krytyczne operacje poprzez ostrzeżenia oraz dodatkowe potwierdzenia.

## 2. Lista widoków

### Layout autoryzacji

- Nazwa widoku: Layout autoryzacji
- Ścieżka widoku: `/login`, `/register`
- Główny cel: Dostarczyć spójny kontener dla formularzy logowania i rejestracji bez elementów rozpraszających.
- Kluczowe informacje do wyświetlenia: Logo, nazwa produktu, linki do przełączania formularzy.
- Kluczowe komponenty widoku: 'layout ekranu autoryzacji', 'shell formularza', 'komunikat inline', 'linki w stopce'.
- UX, dostępność i względy bezpieczeństwa: Czytelna hierarchia, autofocus na pierwszym polu, obsługa klawiatury, maskowanie haseł, komunikaty błędów w `aria-live`.

### Widok logowania

- Nazwa widoku: Formularz logowania
- Ścieżka widoku: `/login`
- Główny cel: Umożliwić zalogowanie do konta i przekierować do listy pomysłów.
- Kluczowe informacje do wyświetlenia: Pola `email`, `hasło`, przycisk „Zaloguj się”, link do rejestracji, komunikat o błędnych danych.
- Kluczowe komponenty widoku: 'formularz logowania', 'pole tekstowe e-mail', 'pole hasła', 'przycisk wysyłki', 'obszar błędów formularza'.
- UX, dostępność i względy bezpieczeństwa: Walidacja formatu e-mail, blokada wielokrotnego wysłania, obsługa błędów Supabase, klawisz Enter i czytelne `aria-labels`.

### Widok rejestracji

- Nazwa widoku: Formularz rejestracji
- Ścieżka widoku: `/register`
- Główny cel: Stworzyć konto użytkownika i automatycznie zalogować na listę pomysłów.
- Kluczowe informacje do wyświetlenia: Pola `email`, `hasło`, checkbox zgody (jeśli wymagane), przycisk „Utwórz konto”, komunikaty błędów.
- Kluczowe komponenty widoku: 'formularz rejestracji', 'pole tekstowe e-mail', 'pole hasła', 'notyfikacja o politykach', 'przycisk utworzenia konta'.
- UX, dostępność i względy bezpieczeństwa: Wymuszenie minimalnej długości hasła, asynchroniczne stany przycisku, focus na komunikaty błędów, sanitizacja wejść, brak autopodpowiadania haseł.

### Layout aplikacji
- Nazwa widoku: Layout aplikacji
- Ścieżka widoku: `/ideas`, `/settings`
- Główny cel: Zapewnić wspólną strukturę nawigacji i kontekst dla widoków po zalogowaniu.
- Kluczowe informacje do wyświetlenia: Pasek górny z nazwą aplikacji jako logo (kliknięcie przekierowuje na homepage '/'), po prawej stronie ikona zębatki (przejście do '/settings') oraz ikona wylogowanie (uruchomienie akcji wylogowania).
- Kluczowe komponenty widoku: 'szkielet aplikacji z nawigacją', 'górny pasek z nazwą aplikacji', 'centrum powiadomień toast', 'warstwa portali modalnych'.
- UX, dostępność i względy bezpieczeństwa: Responsywna nawigacja (przełączanie na menu rozwijane), `aria-current` na aktywnych pozycjach.

### Widok listy pomysłów

- Nazwa widoku: Lista pomysłów
- Ścieżka widoku: `/ideas`
- Główny cel: Prezentować pomysły użytkownika z możliwością filtrowania, paginowania i akcji na kartach.
- Kluczowe informacje do wyświetlenia: Górny pasek filtrów (relacja, okazja, źródło, sortowanie), licznik wyniku, siatka kart z nazwą, okazją, skrótem treści, badge `source`, pusty stan lub skeletony, paginacja.
- Kluczowe komponenty widoku: 'pasek filtrów', 'kontrolki wyboru filtrów', 'licznik wyników', 'siatka kart pomysłów', 'karta pomysłu', 'znacznik źródła pomysłu', 'paginacja', 'pusty stan tablicy', 'szkielet karty podczas ładowania'.
- UX, dostępność i względy bezpieczeństwa: Sterowanie filtrami po klawiaturze, `aria-controls` między filtrami a listą, zachowanie stanu filtrów w query stringach, informowanie o błędach ładowania, ochrona przed kliknięciami wielokrotnymi.

### Modal formularza pomysłu (tworzenie/edycja)

- Nazwa widoku: Modal formularza pomysłu
- Ścieżka widoku: nie jest potrzebna
- Główny cel: Umożliwić tworzenie lub edycję pomysłu oraz integrację z generowaniem AI.
- Kluczowe informacje do wyświetlenia: Formularz z polami `nazwa`, `wiek`, `zainteresowania`, `relacja`, `okazja`, `budżet`, `opis`, edytowalne pole treści pomysłu, panel wyników AI z listą 5 propozycji, wskaźniki źródła.
- Kluczowe komponenty widoku: 'warstwa modalna', 'siatka pól formularza', 'pole numeryczne', 'pole wielowierszowe', 'lista wyboru', 'kontrolka zakresu budżetu', 'panel sugestii AI', 'karta sugestii', 'przycisk generowania AI', 'stopka formularza'.
- UX, dostępność i względy bezpieczeństwa: Focus trap, `aria-modal`, walidacja w czasie rzeczywistym, blokada przycisku generowania podczas żądania, komunikaty w `aria-live`, obsługa błędów 429/503, ostrzeżenie przed utratą zmian przy zamknięciu.

### Modal podglądu pomysłu

- Nazwa widoku: Modal podglądu pomysłu
- Ścieżka widoku: `/ideas?modal=idea-preview` z id itemu
- Główny cel: Pokazać pełne dane pomysłu w trybie tylko do odczytu z wejściem do edycji lub usunięcia.
- Kluczowe informacje do wyświetlenia: Wszystkie pola pomysłu, badge `source`, daty utworzenia/aktualizacji, przyciski „Edytuj” i „Usuń”.
- Kluczowe komponenty widoku: 'modal podglądu pomysłu', 'lista szczegółów pomysłu', 'znacznik statusu', 'przyciski akcji'.
- UX, dostępność i względy bezpieczeństwa: Czytelne etykiety, możliwość zamknięcia klawiszem Escape, `aria-labelledby`, ostrzeżenie przy przejściu do usunięcia, brak kopiowania treści do schowka automatycznie.

### Modal potwierdzenia usunięcia pomysłu

- Nazwa widoku: Modal potwierdzenia usunięcia
- Ścieżka widoku: nie jest potrzebna
- Główny cel: Uzyskać jednoznaczne potwierdzenie przed trwałym skasowaniem pomysłu.
- Kluczowe informacje do wyświetlenia: Nazwa pomysłu, komunikat o nieodwracalności, przyciski „Anuluj” i „Usuń”, ewentualny checkbox o zrozumieniu konsekwencji.
- Kluczowe komponenty widoku: 'modal potwierdzenia', 'ikona ostrzeżenia', 'przycisk podstawowy', 'przycisk destrukcyjny'.
- UX, dostępność i względy bezpieczeństwa: Wyraźna hierarchia wizualna, ustawiony focus na przycisku anuluj, potwierdzenie usunięcia toastem, obsługa błędów `Idea not found`.

### Widok ustawień konta

- Nazwa widoku: Ustawienia konta
- Ścieżka widoku: `/settings`
- Główny cel: Pozwolić użytkownikowi zarządzać hasłem oraz trwałym usunięciem konta.
- Kluczowe informacje do wyświetlenia: Sekcja zmiany hasła (aktualne, nowe, powtórzenie), komunikaty sukcesu, sekcja usunięcia konta z ostrzeżeniem, checkboxem oraz polem potwierdzenia, przycisk „Usuń konto”.
- Kluczowe komponenty widoku: 'layout ustawień konta', 'nagłówki sekcji', 'formularz zmiany hasła', 'alert inline', 'panel usuwania konta', 'pole wyboru potwierdzenia', 'przycisk ostrzegawczy'.
- UX, dostępność i względy bezpieczeństwa: Wymuszenie różnicy między starym a nowym hasłem, informowanie o stanie asynchronicznym, dodatkowe potwierdzenia tekstowe, blokada przycisku do czasu spełnienia warunków, jasne komunikaty o skutkach usunięcia.

## 3. Mapa podróży użytkownika

- **Pierwsze użycie (US-001 + US-008):** Użytkownik przechodzi na `/register`, tworzy konto, po sukcesie trafia na pusty `/ideas`, czyta komunikat zachęcający, uruchamia modal formularza, opcjonalnie generuje propozycje AI, zapisuje pomysł i widzi nową kartę na górze listy.
- **Powracający użytkownik (US-002 + US-007):** Po logowaniu na `/login` trafia na `/ideas`, które ładuje zapisane filtry, przegląda karty z badge’ami źródła, korzysta z filtrów i paginacji, otwiera podgląd i w razie potrzeby edytuje lub usuwa pomysł.
- **Tworzenie z AI (US-005):** W modalu formularza uzupełnia dane, uruchamia `Generuj pomysły`, czeka na spinner, przegląda 5 kart, akceptuje jedną z nich, modyfikuje treść (zmienia flagę na `edited-ai`), zapisuje i otrzymuje toast potwierdzający.
- **Manualne tworzenie lub edycja (US-006 + US-007):** Użytkownik pomija generowanie, wpisuje treść ręcznie, zapisuje pomysł z flagą `manual`, podczas edycji modyfikuje dane i otrzymuje aktualizację listy bez przeładowania.
- **Zarządzanie kontem (US-003 + US-004):** Z menu profilu wybiera `/settings`, zmienia hasło z walidacją inline i komunikatem sukcesu, lub inicjuje usunięcie konta, zaznacza checkbox ostrzegawczy, wpisuje frazę potwierdzającą, potwierdza i zostaje wylogowany.

## 4. Układ i struktura nawigacji

- Górny pasek w layoutcie aplikacji prezentuje nazwę PresMinder prowadzącą na `/ideas` oraz menu profilu z linkami do `/ideas`, `/settings` i akcją wylogowania.
- Filtry listy znajdują się w poziomym pasku nad siatką; na urządzeniach mobilnych zwijają się do panelu typu disclosure sterowanego przyciskiem „Filtry”.
- Paginacja z przyciskami „Poprzednia/Następna” i numerami stron osadzona pod siatką, z informacją o zakresie wyników.
- Layout autoryzacji prezentuje formularze na środku ekranu z linkiem przełączającym, bez globalnej nawigacji.
- Wszystkie modale montowane są w warstwie portali modalnych zarządzanej przez layout aplikacji, dzięki czemu zachowują focus trap i możliwość sterowania klawiaturą.

## 5. Kluczowe komponenty

- Minimalny kontener formularzy autoryzacji – zapewnia spójny branding i focus management.
- Layout aplikacji po zalogowaniu – górna nawigacja, portale dla toastów i modalów oraz obsługa responsywności.
- Pasek filtrów z kontrolowanymi dropdownami – synchronizuje parametry z URL i emituje żądania do `GET /api/ideas`.
- Karta pomysłu w siatce – prezentuje nazwę, okazję, skrót treści, badge `source` oraz przyciski akcji z obsługą focusu.
- Modal formularza pomysłu – pełny formularz tworzenia/edycji z panelem sugestii AI, walidacją i logiką ustawiania flag `source`.
- Panel sugestii AI – lista propozycji z przyciskiem akceptacji, obsługuje stany ładowania, błędów i skracania treści.
- Centrum powiadomień toast – globalne powiadomienia dla sukcesów i błędów, wspiera `aria-live` i automatyczne zamykanie.
- Modal potwierdzenia akcji destrukcyjnych – obsługuje usunięcie pomysłu lub konta z blokadą przypadkowych kliknięć.
- Kontrola paginacji – zgodna z parametrami API, informuje użytkownika o aktualnym zakresie i łącznej liczbie stron.
- Pusty stan i szkielety kart – zapewniają płynność doświadczenia podczas pobierania danych.
