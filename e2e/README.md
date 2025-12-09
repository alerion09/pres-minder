# E2E Tests - PresMinder

Testy end-to-end dla aplikacji PresMinder używające Playwright i wzorca Page Object Model (POM).

## 📋 Wymagania

1. **Node.js 22.14.0** (zgodnie z `.nvmrc`)
2. **Zainstalowane zależności:**
   ```bash
   npm install
   ```
3. **Uruchomiona aplikacja:**

   ```bash
   npm run dev
   ```

   Aplikacja musi działać na `http://localhost:3000`

4. **Plik `.env.test` z danymi testowymi:**
   ```bash
   cp .env.test.example .env.test
   ```
   Następnie wypełnij plik `.env.test` prawdziwymi danymi:
   - `SUPABASE_URL` - URL twojego projektu Supabase
   - `SUPABASE_PUBLIC_KEY` - Publiczny klucz Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` - Klucz service role Supabase
   - `OPENROUTER_API_KEY` - Klucz API OpenRouter (dla AI)
   - `E2E_USERNAME` - Email testowego użytkownika
   - `E2E_PASSWORD` - Hasło testowego użytkownika
   - `E2E_USERNAME_ID` - UUID testowego użytkownika w Supabase

## 🚀 Uruchamianie testów

### Podstawowe komendy (npm scripts)

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Uruchom z interfejsem UI (tryb interaktywny) - ZALECANE
npm run test:e2e:ui

# Uruchom z widoczną przeglądarką (headed mode)
npm run test:e2e:headed

# Uruchom w trybie debug
npm run test:e2e:debug

# Zobacz raport po testach
npm run test:e2e:report

# Codegen - nagraj nowy test
npm run test:e2e:codegen
```

### Zaawansowane komendy (bezpośrednie Playwright)

```bash
# Uruchom konkretny plik testowy
npx playwright test e2e/ideas.spec.ts

# Uruchom konkretny test po nazwie
npx playwright test -g "should create a new idea"

# Uruchom konkretny test suite
npx playwright test -g "Create New Idea"

# Uruchom z widoczną przeglądarką
npx playwright test --headed

# Uruchom w trybie debug
npx playwright test --debug
```

### Zalecane dla developmentu

```bash
# Najprostszy sposób - tryb UI
npm run test:e2e:ui

# Lub z widoczną przeglądarką
npm run test:e2e:headed
```

## 📁 Struktura katalogów

```
e2e/
├── pages/                    # Page Object Model classes
│   ├── BasePage.ts          # Bazowa klasa dla wszystkich stron
│   ├── LoginPage.ts         # Strona logowania
│   ├── IdeasPage.ts         # Strona z listą pomysłów
│   ├── IdeaFormDialog.ts    # Dialog formularza pomysłu
│   └── index.ts             # Eksport wszystkich klas POM
├── fixtures/                 # Test fixtures
│   └── auth.fixture.ts      # Fixture do automatycznego logowania
├── ideas.spec.ts            # Testy dla zarządzania pomysłami
└── README.md                # Ten plik
```

## 🎯 Page Object Model (POM)

Testy wykorzystują wzorzec POM dla lepszej maintainability:

### BasePage

Bazowa klasa z wspólnymi metodami dla wszystkich stron:

- `goto(path)` - nawigacja do strony
- `getByTestId(testId)` - pobieranie elementów po `data-test-id`
- `clickByTestId(testId)` - klikanie elementów
- `fillByTestId(testId, value)` - wypełnianie pól

### LoginPage

Strona logowania:

- `login(email, password)` - pełny proces logowania
- `waitForLoginSuccess()` - czekanie na przekierowanie po logowaniu

### IdeasPage

Strona główna z listą pomysłów:

- `clickCreateIdea()` - otwiera dialog tworzenia pomysłu
- `getIdeaCount()` - zwraca liczbę pomysłów
- `findIdeaByTitle(title)` - szuka pomysłu po tytule
- `clickEditOnCard(index)` - otwiera edycję pomysłu

### IdeaFormDialog

Dialog formularza pomysłu (tworzenie/edycja):

- `fillRequiredFields(data)` - wypełnia wymagane pola
- `fillCompleteForm(data)` - wypełnia wszystkie pola
- `clickGenerateAI()` - generuje sugestie AI
- `clickAISuggestion(index)` - wybiera sugestię AI
- `submitAndWaitForClose()` - wysyła formularz i czeka na zamknięcie

## 🔐 Automatyczne logowanie

Testy automatycznie logują użytkownika przed każdym testem używając fixture `authenticatedPage`:

```typescript
test.beforeEach(async ({ authenticatedPage }) => {
  // authenticatedPage jest już zalogowany
  const ideasPage = new IdeasPage(authenticatedPage);
  await ideasPage.goto();
});
```

Dane logowania są pobierane z `.env.test`:

- `E2E_USERNAME` - email testowego użytkownika
- `E2E_PASSWORD` - hasło testowego użytkownika
- `E2E_USERNAME_ID` - UUID użytkownika (opcjonalne, ale może być przydatne w testach)

## 📝 Przykład testu

```typescript
import { test, expect } from "./fixtures/auth.fixture";
import { IdeasPage } from "./pages/IdeasPage";

test.describe("Ideas Management", () => {
  let ideasPage: IdeasPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    ideasPage = new IdeasPage(authenticatedPage);
    await ideasPage.goto();
  });

  test("should create a new idea", async () => {
    const formDialog = await ideasPage.clickCreateIdea();

    await formDialog.fillRequiredFields({
      name: "Test Idea",
      content: "Test content",
    });

    await formDialog.submitAndWaitForClose();

    const ideaIndex = await ideasPage.findIdeaByTitle("Test Idea");
    expect(ideaIndex).not.toBeNull();
  });
});
```

## 🏷️ Atrybuty data-test-id

Wszystkie kluczowe elementy UI mają atrybuty `data-test-id` dla łatwiejszej identyfikacji:

### IdeasPage

- `create-idea-button` - przycisk "Dodaj nowy pomysł"

### IdeaFormDialog

- `idea-form-dialog` - kontener dialogu
- `idea-name-input` - pole nazwy
- `idea-content-textarea` - pole treści
- `idea-budget-min-input` / `idea-budget-max-input` - pola budżetu
- `idea-relation-select` / `idea-occasion-select` - selecty relacji i okazji
- `idea-age-input` - pole wieku
- `idea-interests-textarea` - pole zainteresowań
- `idea-person-description-textarea` - pole opisu osoby
- `generate-ai-ideas-button` - przycisk generowania AI
- `ai-suggestions-list` - lista sugestii AI
- `ai-suggestion-card-{index}` - karta pojedynczej sugestii
- `idea-form-submit-button` - przycisk zapisz
- `idea-form-cancel-button` - przycisk anuluj

## 🐛 Debugowanie

### Trace Viewer

Po nieudanym teście, Playwright automatycznie zbiera trace. Zobacz go:

```bash
npx playwright show-trace
```

### Screenshots i Videos

Playwright automatycznie zbiera screenshoty i video przy błędach (konfiguracja w `playwright.config.ts`).

### Debug mode

```bash
npx playwright test --debug
```

Uruchamia testy z inspektorem Playwright, który pozwala na step-by-step debugging.

## 💡 Best Practices

1. **Używaj POM** - wszystkie interakcje z UI przez klasy Page Object
2. **Używaj data-test-id** - dla stabilnych selektorów
3. **Izoluj testy** - każdy test powinien być niezależny
4. **Czyszczenie danych** - rozważ cleanup po testach
5. **Konkretne assercje** - używaj konkretnych matcherów (np. `toHaveText()` zamiast `toBeTruthy()`)
6. **Czekaj na elementy** - używaj `waitFor()` dla elementów, które mogą pojawić się z opóźnieniem

## 🔧 Konfiguracja

Główna konfiguracja Playwright znajduje się w `playwright.config.ts`:

- Browser: Chromium/Desktop Chrome
- BaseURL: `http://localhost:3000`
- Retry: 2 na CI, 0 lokalnie
- Workers: 1 na CI, undefined lokalnie (wszystkie dostępne)
- Timeout: 120s dla webServer
