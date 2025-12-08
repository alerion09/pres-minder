# Migration Guide: Code + Name Pattern

## Podsumowanie zmian

Tabele `relations` i `occasions` zostały rozszerzone o kolumnę `code`:

- **`code`** (varchar, unique, not null) - stabilny identyfikator po angielsku (np. `'friend'`, `'birthday'`)
- **`name`** (text, not null) - polska nazwa wyświetlana użytkownikowi (np. `'Przyjaciel'`, `'Urodziny'`)

## Struktura danych

### Relations

| id  | code        | name                     |
| --- | ----------- | ------------------------ |
| 1   | friend      | Przyjaciel               |
| 2   | parent      | Rodzic                   |
| 3   | sibling     | Rodzeństwo               |
| 4   | partner     | Partner/Partnerka        |
| 5   | colleague   | Kolega/Koleżanka z pracy |
| 6   | child       | Dziecko                  |
| 7   | grandparent | Dziadek/Babcia           |
| 8   | other       | Inna relacja             |

### Occasions

| id  | code           | name                     |
| --- | -------------- | ------------------------ |
| 1   | birthday       | Urodziny                 |
| 2   | anniversary    | Rocznica                 |
| 3   | wedding        | Ślub                     |
| 4   | christmas      | Święta (Boże Narodzenie) |
| 5   | valentines_day | Walentynki               |
| 6   | graduation     | Ukończenie szkoły        |
| 7   | baby_shower    | Baby shower              |
| 8   | housewarming   | Parapetówka              |
| 9   | other          | Inna okazja              |

## Użycie w komponentach

### 1. Pobieranie danych w API route

```typescript
// src/pages/api/relations.ts
import type { APIContext } from "astro";

export const prerender = false;

export const GET = async ({ locals }: APIContext) => {
  const { supabase } = locals;

  // Pobierz wszystkie relacje z kodem i nazwą
  const { data, error } = await supabase.from("relations").select("id, code, name").order("id");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
```

### 2. Wyświetlanie w komponencie React (Select)

```tsx
// src/components/RelationSelect.tsx
import { useState, useEffect } from "react";
import type { Database } from "@/db/database.types";

type Relation = Database["public"]["Tables"]["relations"]["Row"];

export function RelationSelect() {
  const [relations, setRelations] = useState<Relation[]>([]);

  useEffect(() => {
    fetch("/api/relations")
      .then((res) => res.json())
      .then((data) => setRelations(data));
  }, []);

  return (
    <select>
      <option value="">Wybierz relację</option>
      {relations.map((relation) => (
        <option key={relation.id} value={relation.id}>
          {relation.name} {/* Wyświetlamy polską nazwę */}
        </option>
      ))}
    </select>
  );
}
```

### 3. Filtrowanie po kodzie

```typescript
// Wyszukiwanie po kodzie (stabilne, niezależne od języka)
const { data } = await supabase.from("relations").select("id, code, name").eq("code", "friend").single();

// Wynik: { id: 1, code: 'friend', name: 'Przyjaciel' }
```

### 4. Pobieranie ideas z nazwami relacji/okazji

```typescript
// src/pages/api/ideas.ts
export const GET = async ({ locals, url }: APIContext) => {
  const { supabase } = locals;

  const { data, error } = await supabase.from("ideas").select(`
      *,
      relation:relations(id, code, name),
      occasion:occasions(id, code, name)
    `);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify(data), { status: 200 });
};

// Wynik:
// [{
//   id: 1,
//   name: "Smartwatch fitness tracker",
//   relation: { id: 1, code: "friend", name: "Przyjaciel" },
//   occasion: { id: 1, code: "birthday", name: "Urodziny" }
// }]
```

### 5. Dodawanie własnych wartości przez użytkownika

Jeśli planujesz pozwolić użytkownikom dodawać własne relacje/okazje:

```typescript
// src/pages/api/relations.ts
export const POST = async ({ locals, request }: APIContext) => {
  const { supabase } = locals;
  const body = await request.json();

  // Użytkownik wpisuje polską nazwę
  const polishName = body.name; // np. "Kuzyn"

  // Generuj kod (slug) z polskiej nazwy
  const code = polishName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Usuń akcenty
    .replace(/[^a-z0-9]/g, "_"); // Zamień znaki specjalne na _

  const { data, error } = await supabase.from("relations").insert({ code, name: polishName }).select().single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }

  return new Response(JSON.stringify(data), { status: 201 });
};
```

## Korzyści tego podejścia

1. **Stabilne API** - `code` pozostaje po angielsku, więc URL-e i API są czytelne
2. **Polskie UI** - użytkownik widzi polskie nazwy (`name`)
3. **Gotowe na i18n** - łatwo dodać tłumaczenia dla innych języków w przyszłości
4. **Edytowalne** - użytkownicy mogą dodawać własne wartości
5. **Sortowanie** - możesz sortować po `code` (angielski) lub `name` (polski)

## Migracja istniejącego kodu

### Przed:

```typescript
// Stary kod (używał tylko 'name')
const { data } = await supabase.from("relations").select("id, name").eq("name", "friend"); // ❌ Teraz 'name' to 'Przyjaciel'
```

### Po:

```typescript
// Nowy kod (używa 'code' do filtrowania, 'name' do wyświetlania)
const { data } = await supabase.from("relations").select("id, code, name").eq("code", "friend"); // ✅ 'code' pozostaje 'friend'
```

## Pytania?

Jeśli masz pytania dotyczące migracji, sprawdź:

- Plik migracji: `supabase/migrations/20251015000001_add_code_column_to_dictionaries.sql`
- Typy TypeScript: `src/db/database.types.ts`
