# 🚀 Quick Start - E2E Tests Setup

Przewodnik krok po kroku do uruchomienia testów E2E.

## ✅ Checklist

- [ ] Node.js 22.14.0 zainstalowany
- [ ] Zależności zainstalowane (`npm install`)
- [ ] Plik `.env.test` skonfigurowany
- [ ] Testowy użytkownik utworzony w Supabase
- [ ] Aplikacja uruchomiona (`npm run dev`)

## 📝 Krok po kroku

### 1. Upewnij się, że używasz poprawnej wersji Node.js

```bash
# Sprawdź wersję Node.js
node --version
# Powinno być v22.14.0

# Jeśli używasz nvm:
nvm use
```

### 2. Zainstaluj zależności (jeśli jeszcze nie)

```bash
npm install
```

### 3. Utwórz testowego użytkownika w Supabase

1. Zaloguj się do [Supabase Dashboard](https://app.supabase.com)
2. Przejdź do swojego projektu
3. Otwórz **Authentication** → **Users**
4. Kliknij **Add user** → **Create new user**
5. Wprowadź email i hasło (np. `test@example.com` / `TestPass123!`)
6. **Zapisz UUID użytkownika** - będzie potrzebny w `.env.test`

### 4. Skonfiguruj `.env.test`

```bash
# Skopiuj przykładowy plik
cp .env.test.example .env.test

# Edytuj plik .env.test
nano .env.test  # lub inny edytor
```

Wypełnij wszystkie zmienne:

```bash
# Supabase Configuration (z Supabase Dashboard)
SUPABASE_URL=https://twojprojekt.supabase.co
SUPABASE_PUBLIC_KEY=twoj_publiczny_klucz_anon
SUPABASE_SERVICE_ROLE_KEY=twoj_klucz_service_role

# OpenRouter API Key (dla AI)
OPENROUTER_API_KEY=twoj_klucz_openrouter

# E2E Test User (utworzony w kroku 3)
E2E_USERNAME_ID=uuid-testowego-użytkownika
E2E_USERNAME=test@example.com
E2E_PASSWORD=TestPass123!
```

**Gdzie znaleźć klucze Supabase:**

- Supabase Dashboard → Settings → API
- `SUPABASE_URL` = Project URL
- `SUPABASE_PUBLIC_KEY` = anon public key
- `SUPABASE_SERVICE_ROLE_KEY` = service_role key (⚠️ trzymaj w tajemnicy!)

### 5. Uruchom aplikację

```bash
# W jednym terminalu uruchom dev server
npm run dev
```

Aplikacja powinna działać na `http://localhost:3000`

### 6. Uruchom testy!

```bash
# W drugim terminalu uruchom testy
npm run test:e2e:ui
```

**Lub:**

```bash
# Z widoczną przeglądarką
npm run test:e2e:headed
```

## 🎉 Gotowe!

Jeśli wszystko poszło dobrze, powinieneś zobaczyć:

- Playwright UI otwiera się z listą testów
- Testy automatycznie logują użytkownika
- Testy wykonują scenariusze dodawania pomysłów

## ❓ Troubleshooting

### Problem: "Test credentials not found"

**Rozwiązanie:** Sprawdź czy `.env.test` zawiera `E2E_USERNAME` i `E2E_PASSWORD`

### Problem: "Navigation timeout"

**Rozwiązanie:**

1. Sprawdź czy aplikacja działa na `http://localhost:3000`
2. Uruchom `npm run dev` w osobnym terminalu

### Problem: "Login failed"

**Rozwiązanie:**

1. Sprawdź czy testowy użytkownik istnieje w Supabase
2. Sprawdź czy email i hasło w `.env.test` są poprawne
3. Sprawdź czy użytkownik ma potwierdzony email w Supabase

### Problem: "SUPABASE_URL is not defined"

**Rozwiązanie:**

1. Sprawdź czy plik `.env.test` istnieje w głównym katalogu projektu
2. Sprawdź czy `playwright.config.ts` ładuje zmienne z `.env.test` (powinien - mamy tam `dotenv.config`)

### Problem: Testy przechodzą ale nie widzę logowania

**To normalne!** Logowanie dzieje się w tle dzięki fixture `authenticatedPage`. Każdy test zaczyna się już z zalogowanym użytkownikiem.

## 📚 Dalsze kroki

- Przeczytaj [e2e/README.md](./README.md) - pełna dokumentacja
- Sprawdź [e2e/ideas.spec.ts](./ideas.spec.ts) - przykładowe testy
- Poznaj [Page Object Model](./pages/) - struktura klas POM

## 🆘 Potrzebujesz pomocy?

1. Sprawdź dokumentację Playwright: https://playwright.dev
2. Sprawdź logi w terminalu - często pokazują dokładny problem
3. Użyj trybu debug: `npm run test:e2e:debug`
