# Dokument wymagań produktu (PRD) - PresMinder

## 1. Przegląd produktu

PresMinder to aplikacja webowa (MVP) zaprojektowana w celu uproszczenia procesu znajdowania prezentów. Główną funkcją aplikacji jest wykorzystanie sztucznej inteligencji do generowania spersonalizowanych pomysłów na prezenty na podstawie informacji o osobie obdarowywanej, podanych przez użytkownika. Użytkownicy mogą również ręcznie tworzyć, zapisywać, edytować i usuwać swoje pomysły. Aplikacja będzie w pełni darmowa, a do generowania propozycji przez AI wykorzystana zostanie usługa Openrouter.ai.

## 2. Problem użytkownika

Wybór odpowiedniego prezentu na ważną okazję jest często trudnym i stresującym zadaniem. Użytkownicy mają trudności ze znalezieniem inspiracji, dopasowaniem prezentu do zainteresowań i osobowości odbiorcy oraz uwzględnieniem określonego budżetu. Proces ten jest czasochłonny i nie zawsze prowadzi do satysfakcjonującego rezultatu. PresMinder ma na celu rozwiązanie tego problemu, dostarczając narzędzie, które w szybki i prosty sposób generuje trafne propozycje prezentów i pozwala na ich organizację.

## 3. Wymagania funkcjonalne

### 3.1. System kont użytkowników

- Użytkownik może założyć konto, podając adres e-mail i hasło.
- Użytkownik może zalogować się na swoje konto.
- Użytkownik może skorzystać z funkcji zmiany hasła.
- Użytkownik ma możliwość trwałego usunięcia swojego konta (hard delete). Operacja ta jest poprzedzona komunikatem informacyjnym i wymaga dodatkowego potwierdzenia.

### 3.2. Tworzenie i zarządzanie pomysłami na prezenty

- Użytkownik ma dostęp do listy swoich pomysłów, która jest głównym widokiem aplikacji.
- Tworzenie nowego pomysłu odbywa się poprzez modal, który zawiera ustrukturyzowany formularz.
- Formularz zawiera pola do opisu osoby i okazji: 'Nazwa pomysłu', 'Wiek', 'Zainteresowania', 'Relacja' (predefiniowana lista), 'Okazja' (predefiniowana lista), 'Budżet' (półka cenowa).
- Modal zawiera również pole tekstowe do wpisania lub edycji treści pomysłu.

### 3.3. Generowanie pomysłów przez AI

- W modalu tworzenia pomysłu użytkownik może użyć przycisku "Generuj pomysły", aby otrzymać propozycje od AI.
- Do AI wysyłane są dane z formularza: 'Wiek', 'Zainteresowania', 'Relacja', 'Okazja', 'Budżet'. Pole 'Nazwa pomysłu' nie jest wysyłane.
- AI generuje 5 propozycji pomysłów.
- Użytkownik może "zaakceptować" jedną z propozycji, co powoduje skopiowanie jej treści do pola tekstowego jako edytowalnego draftu.

### 3.4. Zapisywanie i śledzenie pomysłów

- Każdy zapisany pomysł jest powiązany z kontem użytkownika.
- Pomysł jest zapisywany w bazie danych po kliknięciu przycisku "Zapisz na liście".
- Zapisywane są wszystkie dane wejściowe z formularza oraz treść pomysłu.
- Każdy pomysł ma flagę `source` o wartości `ai` lub `manual`.
- Pomysł wygenerowany przez AI, nawet po edycji, zachowuje flagę `ai`. Flaga zmienia się na `manual` tylko wtedy, gdy użytkownik usunie całą treść i wpisze nową od zera.

### 3.5. Wyświetlanie i interakcja z pomysłami

- Zapisane pomysły są wyświetlane na liście w formie kafelków.
- Każdy kafelek wyświetla 'Nazwę pomysłu' oraz 'Okazję' i zawiera przyciski do podglądu, edycji i usunięcia.
- Podgląd pomysłu otwiera modal z zestawieniem wszystkich zapisanych danych (dane wejściowe i treść pomysłu).

## 4. Granice produktu

Następujące funkcje nie wchodzą w zakres MVP:

- Dzielenie się pomysłami na prezenty między użytkownikami.
- Osobny widok z profilami/szablonami osób, dla których szukane są prezenty.
- Funkcje społecznościowe (komentarze, polubienia, udostępnianie).
- Zaawansowana obsługa multimediów (np. dodawanie zdjęć do pomysłów).
- Integracje z zewnętrznymi sklepami i porównywarkami cen.
- Systemy powiadomień i przypomnień.
- Aplikacje mobilne (iOS, Android) - produkt będzie dostępny wyłącznie jako aplikacja webowa.

## 5. Historyjki użytkowników

### US-001: Rejestracja użytkownika

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto za pomocą mojego adresu e-mail i hasła, aby móc zapisywać swoje pomysły na prezenty.
- Kryteria akceptacji:
  - Formularz rejestracji zawiera pola na adres e-mail i hasło.
  - System waliduje format adresu e-mail.
  - System informuje o błędzie, jeśli podany e-mail jest już zajęty.
  - Po udanej rejestracji jestem automatycznie zalogowany i przekierowany do widoku mojej listy pomysłów.

### US-002: Logowanie użytkownika

- ID: US-002
- Tytuł: Logowanie do aplikacji
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na moje konto, aby uzyskać dostęp do moich zapisanych pomysłów.
- Kryteria akceptacji:
  - Formularz logowania zawiera pola na adres e-mail i hasło.
  - System informuje o błędzie w przypadku podania nieprawidłowych danych logowania.
  - Po udanym logowaniu jestem przekierowany do widoku mojej listy pomysłów.

### US-003: Zmiana hasła

- ID: US-003
- Tytuł: Zmiana hasła
- Opis: Jako użytkownik, chcę zmienić swoje hasło.
- Kryteria akceptacji:
  - W ustawieniach konta znajduje się opcja zmiany hasła.
  - Formularz zawiera pole aktualne hasło i nowe hasło.
  - System informuje o błędzie w przypadku podania nieprawidłowych haseł.
  - Po udanej zmianie hasła dostaję komunikat o powodzeniu zmiany hasła.

### US-004: Usunięcie konta

- ID: US-004
- Tytuł: Trwałe usunięcie konta
- Opis: Jako użytkownik, chcę mieć możliwość trwałego usunięcia mojego konta i wszystkich powiązanych z nim danych.
- Kryteria akceptacji:
  - W ustawieniach konta znajduje się opcja usunięcia.
  - Przed usunięciem wyświetlany jest komunikat ostrzegawczy o nieodwracalności tej operacji.
  - Muszę potwierdzić chęć usunięcia konta (np. poprzez checkbox lub wpisanie hasła).
  - Po potwierdzeniu, moje konto i wszystkie moje dane (w tym zapisane pomysły) są trwale usuwane z bazy danych.

### US-005: Tworzenie pomysłu z pomocą AI

- ID: US-005
- Tytuł: Generowanie pomysłu na prezent przy użyciu AI
- Opis: Jako użytkownik, chcę wypełnić formularz dotyczący osoby i okazji, a następnie wygenerować pomysły za pomocą AI, aby znaleźć inspirację.
- Kryteria akceptacji:
  - Mogę otworzyć modal tworzenia pomysłu.
  - Po wypełnieniu pól ('Wiek', 'Zainteresowania', 'Relacja', 'Okazja', 'Budżet') mogę kliknąć przycisk "Generuj pomysły".
  - System wyświetla 5 propozycji wygenerowanych przez AI.
  - Przy każdej propozycji znajduje się przycisk "Akceptuj".
  - Kliknięcie "Akceptuj" kopiuje treść propozycji do edytowalnego pola tekstowego.
  - Mogę edytować skopiowaną treść przed zapisaniem.
  - Po zapisaniu pomysł ma flagę `source` ustawioną na `ai`.

### US-006: Manualne tworzenie pomysłu

- ID: US-006
- Tytuł: Ręczne dodawanie pomysłu na prezent
- Opis: Jako użytkownik, chcę mieć możliwość ręcznego wpisania własnego pomysłu na prezent, bez korzystania z propozycji AI.
- Kryteria akceptacji:
  - Mogę otworzyć modal tworzenia pomysłu.
  - Mogę wypełnić pola formularza ('Nazwa pomysłu', 'Okazja' itp.).
  - Mogę wpisać dowolną treść bezpośrednio w pole tekstowe pomysłu.
  - Mogę zapisać pomysł, nie klikając przycisku "Generuj pomysły".
  - Po zapisaniu pomysł ma flagę `source` ustawioną na `manual`.

### US-007: Zarządzanie listą pomysłów

- ID: US-007
- Tytuł: Przeglądanie, edycja i usuwanie zapisanych pomysłów
- Opis: Jako użytkownik, chcę widzieć listę moich zapisanych pomysłów oraz mieć możliwość ich edycji, podglądu i usunięcia.
- Kryteria akceptacji:
  - Moja lista pomysłów jest wyświetlana w formie kafelków.
  - Każdy kafelek pokazuje 'Nazwę pomysłu' i 'Okazję'.
  - Na każdym kafelku znajdują się przyciski: "Podgląd", "Edytuj", "Usuń".
  - Kliknięcie "Podgląd" otwiera modal z pełnymi informacjami o pomyśle (w trybie do odczytu).
  - Kliknięcie "Edytuj" otwiera modal z formularzem wypełnionym danymi tego pomysłu, umożliwiając ich zmianę.
  - Kliknięcie "Usuń" i potwierdzenie operacji trwale usuwa pomysł z mojej listy.

### US-008: Onboarding nowego użytkownika

- ID: US-008
- Tytuł: Pierwsze doświadczenie nowego użytkownika
- Opis: Jako nowy, zalogowany użytkownik, chcę od razu trafić do głównej funkcjonalności aplikacji, bez zbędnych samouczków.
- Kryteria akceptacji:
  - Po pierwszej rejestracji i zalogowaniu jestem przekierowany do widoku listy pomysłów.
  - Lista jest pusta i zawiera wyraźny przycisk lub zachętę do stworzenia pierwszego pomysłu.
  - Aplikacja nie wyświetla żadnych pełnoekranowych samouczków ani instrukcji.

## 6. Metryki sukcesu

### 6.1. Adopcja funkcji generowania przez AI

- Cel: Użytkownicy tworzą 75% pomysłów na prezenty z wykorzystaniem AI.
- Sposób mierzenia: Analiza stosunku liczby pomysłów z flagą `source: 'ai'` do całkowitej liczby zapisanych pomysłów w bazie danych.
- Wzór: `(Liczba pomysłów z 'ai' / Łączna liczba pomysłów) * 100%`

### 6.2. Zaangażowanie użytkowników

- Cel: 75% użytkowników zapisuje co najmniej jeden pomysł na prezent.
- Sposób mierzenia: Analiza stosunku liczby użytkowników, którzy mają na swoim koncie co najmniej jeden zapisany pomysł, do całkowitej liczby zarejestrowanych użytkowników.
- Wzór: `(Liczba użytkowników z co najmniej 1 pomysłem / Łączna liczba użytkowników) * 100%`
