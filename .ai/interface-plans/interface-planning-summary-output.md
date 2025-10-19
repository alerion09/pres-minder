<conversation_summary>
<decisions>

1. Lista pomysłów użyje górnego paska filtrów (dropdowny + licznik wyników) nad siatką kart, z domyślnym sortowaniem created_at desc, klasyczną paginacją po 12 pozycji, skeletonami podczas ładowania,
   badge’ami source (źródło), podsumowaniem treści do 3 linii oraz brakiem deep linków i resetem stanu po odświeżeniu.
2. Modal tworzenia/edycji pozostanie jednosekcyjny z zakotwiczoną sekcją wyników AI w formie kart (długie propozycje będą miały przycisk 'pokaż więcej'). Wymagane jest ręczne wywołanie generowania oraz akceptacji propozycji, blokuje przycisk na czas żądania i pokazuje spinner bez szacowania czasu.
3. Słowniki (relacje, okazje) będą pobierane przy wejściu na listing, opcjonalnie buforowane w pamięci za pomocą TanStack Query bez dedykowanego magazynu stanu.
4. Widoki auth otrzymają minimalistyczny formularz w osobnym layoutcie; po zalogowaniu aplikacja korzysta z layoutu z górną belką nawigacyjną, menu profilu i linkiem do osobnej strony „Ustawienia”.
5. Pusty stan listy to tekstowy komunikat zachęcający z przyciskiem „Dodaj pierwszy pomysł”, bez ilustracji.
6. UI dla błędów używa komunikatów inline, toastów z możliwością ponowienia. Modal usuwania pomysłu ma potwierdzenie i toast po sukcesie.
7. Responsywność opiera się na prostym, funkcjonalnym dostosowaniu bez zaawansowanych tricków; utrzymujemy standardy WCAG na wysokim poziomie bez zbędnych komplikacji.
8. Komponenty bazują na shadcn/ui i mogą być wspomagane przez Tailwind.
   </decisions>
   <matched_recommendations>
9. Zastosowanie top-level filtrów z licznikami i klasyczną paginacją zapewnia spójność z parametrami /api/ideas.
10. Jednosekcyjny modal z panelem kart AI upraszcza przepływ od wypełnienia formularza po akceptację propozycji.
11. Skeletony kart i blokada przycisku „Generuj” poprawiają postrzeganą wydajność oraz komunikację stanów.
12. Wydzielone layouty (auth vs app) i nawigacja z menu profilu wspierają rozdział stref publicznych i zabezpieczonych.
13. Oddzielny widok „Ustawienia” upraszcza przyszłe rozszerzenia i powiązanie z akcjami konta.
    </matched_recommendations>
    <ui_architecture_planning_summary>
    Główne wymagania UI koncentrują się na liście pomysłów z górnymi filtrami i paginacją 12 kart na stronę, kontekstową informacją o liczbie wyników oraz kartami zawierającymi nazwę, okazję, skrócony opis
    i badge źródła. Pusty stan używa samego tekstu oraz CTA do dodania pierwszego wpisu. Modal tworzenia/edycji integruje formularz z sekcją wyników AI: użytkownik uruchamia generowanie ręcznie, widzi karty
    propozycji (z opcjonalnym rozwinięciem długich treści) i musi jawnie zaakceptować wybraną, przy czym przycisk pozostaje zablokowany ze spinnerem podczas żądania. Podgląd pomysłu udostępnia akcje „Edytuj”
    i „Usuń” z modalem potwierdzającym.

Kluczowe widoki obejmują minimalistyczne ekrany logowania/rejestracji w dedykowanym layoutcie, główny widok listy w layoutcie aplikacji z górną belką nawigacyjną oraz osobną stronę „Ustawienia” w menu
profilu. Przepływy użytkownika obejmują filtrowanie listy z aktualizacją query stringów, obsługę pustego stanu, tworzenie/edycję pomysłów (manualnie lub z AI) oraz przegląd i usuwanie istniejących pozycji.

Integracja z API zakłada wykorzystywanie /api/ideas z parametrami paginacji/filtrów, a także /api/ideas/generate dla generowania propozycji. Dane słownikowe z /api/relations i /api/occasions będą pobierane przy
wejściu na listing i mogą być chwilowo cache’owane w TanStack Query. Brak persystencji filtrów czy stanów modali oznacza reset po odświeżeniu strony, co upraszcza zarządzanie stanem MVP.

Responsywność zakłada prosty układ z filtrami na górze i siatką poniżej, adaptację mobilną bez skomplikowanych animacji oraz wykorzystanie skeletonów i badge’y o wysokim kontraście. Dostępność opiera się na
komponentach shadcn/ui, focus trapach w modalach i zachowaniu standardów WCAG bez nadmiernych udoskonaleń. Kwestie bezpieczeństwa (obsługa wygasłej sesji, autoryzacja) zostały odłożone na późniejszy etap,
ale autoryzowana część aplikacji jest odseparowana layoutowo.
</ui_architecture_planning_summary>
<unresolved_issues>

- Mechanika odświeżania/wygaśnięcia sesji Supabase oraz pełne scenariusze autoryzacji mają zostać ustalone w późniejszym etapie.
  </unresolved_issues>
  </conversation_summary>
