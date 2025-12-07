<authentication_analysis>

1. Przepływy: rejestracja z automatycznym logowaniem; logowanie; dostęp
   do stron chronionych z weryfikacją sesji; odświeżanie access tokenu z
   refresh tokenu; reset hasła przez link e‑mail; wylogowanie; hard delete
   kont, które usuwa dane i sesję; przekierowania na login dla gościa.
2. Aktorzy: Przeglądarka (użytkownik); Middleware Astro (SSR, strażnik
   tras, zarządzanie cookies/supabase clientem); Astro API (handlery auth,
   logika domenowa); Supabase Auth (rejestracja, logowanie, refresh,
   signout, reset, delete user).
3. Weryfikacja/odświeżanie: Middleware sprawdza access token z cookies;
   gdy wygasł próbuje refresh przez Supabase Auth, zapisuje nowe tokeny lub
   przekierowuje na login przy porażce; API ufa kontekstowi supabase w
   SSR; wylogowanie kasuje refresh/access.
4. Kroki: (a) formularz rejestracji/logowania wysyła POST do Astro API;
   API woła Supabase signUp/signIn; przy sukcesie ustawia ciasteczka i
   przekierowuje na listę pomysłów; (b) przy wejściu na trasę chronioną
   middleware waliduje sesję, ewentualnie refreshuje i wpuszcza do API lub
   odrzuca; (c) reset hasła inicjuje e-mail z linkiem; (d) wylogowanie i
   hard delete czyszczą sesję i wylogowują.
   </authentication_analysis>

<mermaid_diagram>

```mermaid
sequenceDiagram
  autonumber
  participant Browser as Przeglądarka
  participant Middleware as Middleware SSR
  participant API as Astro API
  participant Auth as Supabase Auth

  Browser->>Middleware: GET /logowanie
  Middleware->>Browser: Renderuje formularz logowania
  Browser->>API: POST /api/auth/login (email, hasło)
  activate API
  API->>Auth: signIn(email, hasło)
  alt Dane poprawne
    Auth-->>API: access+refresh token
    API-->>Browser: Set-Cookie, 302 do /
  else Dane błędne
    Auth-->>API: Błąd autentykacji
    API-->>Browser: Komunikat o błędzie
  end
  deactivate API

  Browser->>Middleware: GET /rejestracja
  Middleware->>Browser: Renderuje formularz rejestracji
  Browser->>API: POST /api/auth/signup (email, hasło)
  activate API
  API->>Auth: signUp(email, hasło)
  alt Konto utworzone
    Auth-->>API: Sesja startowa
    API-->>Browser: Set-Cookie, 302 do /
  else E-mail zajęty
    Auth-->>API: Błąd duplikatu
    API-->>Browser: Komunikat o błędzie
  end
  deactivate API

  Browser->>Middleware: GET /
  activate Middleware
  Middleware->>Auth: verify(access token z cookies)
  alt Token ważny
    Auth-->>Middleware: Sesja OK
    Middleware->>API: Forward SSR request
    API-->>Browser: HTML z listą pomysłów
  else Token wygasł
    Middleware->>Auth: refreshSession(refresh token)
    alt Refresh udany
      Auth-->>Middleware: Nowe tokeny
      Middleware-->>Browser: Set-Cookie nowe tokeny
      Middleware->>API: Forward SSR request
      API-->>Browser: HTML z listą pomysłów
    else Refresh nieudany
      Auth-->>Middleware: Brak sesji
      Middleware-->>Browser: 302 do /logowanie
    end
  end
  deactivate Middleware

  Browser->>API: POST /api/auth/reset (email)
  API->>Auth: sendPasswordResetEmail
  Auth-->>Browser: Link resetu wysłany e-mailem

  Browser->>API: POST /api/auth/logout
  API->>Auth: signOut(session)
  Auth-->>API: Sesja usunięta
  API-->>Browser: Clear cookies, 302 do /logowanie

  Browser->>API: POST /api/account/delete (auth)
  API->>Auth: deleteUser
  API->>API: Usunięcie danych powiązanych
  API-->>Browser: Potwierdzenie, 302 do /rejestracja
```

</mermaid_diagram>
