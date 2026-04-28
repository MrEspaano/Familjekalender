# Familjekalendern

En familjekalender för Erik, Suzanne, Lilly och hela familjen. React + Vite på frontend, Supabase (PostgreSQL) som databas. Driftsätts på Vercel — ingen separat backend behövs.

## Funktioner

- **Veckovy** (standard) och **månadsvy**
- **Återkommande händelser** — dagligen, varje vecka, varje månad
- Klicka på tidslucka för att skapa händelse; klicka på händelse för att redigera/ta bort
- Filterknappar per familjemedlem med anpassningsbara färger
- Veckonummer i headern
- Offline-stöd via service worker + localStorage-cache
- PWA — kan installeras på mobilens hemskärm

## Snabbstart (lokal utveckling)

### 1. Skapa Supabase-projekt

1. Gå till [supabase.com](https://supabase.com) och skapa ett nytt projekt
2. Öppna **SQL Editor** och kör innehållet i [`supabase/schema.sql`](supabase/schema.sql) — detta skapar tabellen och lägger in exempeldata
3. Gå till **Settings → API** och kopiera **Project URL** och **anon public key**

### 2. Konfigurera miljövariabler

```bash
cd client
cp .env.local.example .env.local
# Fyll i VITE_SUPABASE_URL och VITE_SUPABASE_ANON_KEY
```

### 3. Starta frontend

```bash
cd client
npm install
npm run dev
```

Öppna `http://localhost:5173`.

> **Backend behövs inte lokalt.** Appen anropar Supabase direkt från webbläsaren.

---

## Driftsättning på Vercel

### 1. Koppla GitHub-repo

Importera `MrEspaano/Familjekalender` i Vercel. `vercel.json` i roten konfigurerar bygget automatiskt — ingen manuell inställning av Root Directory behövs.

### 2. Lägg till miljövariabler i Vercel

Under **Settings → Environment Variables**, lägg till:

| Namn                    | Värde                              |
| ----------------------- | ---------------------------------- |
| `VITE_SUPABASE_URL`     | `https://xxxxxxxxxxx.supabase.co`  |
| `VITE_SUPABASE_ANON_KEY`| `eyJ...` (anon public key)         |

### 3. Driftsätt

Klicka **Deploy**. Klart!

---

## Databasschema (Supabase / PostgreSQL)

Tabell: `events`

| Kolumn           | Typ         | Anteckning                                 |
| ---------------- | ----------- | ------------------------------------------ |
| `id`             | BIGSERIAL   | Primärnyckel                               |
| `title`          | TEXT        |                                            |
| `person`         | TEXT        | `erik` / `suzanne` / `lilly` / `alla`      |
| `start_time`     | TIMESTAMPTZ |                                            |
| `end_time`       | TIMESTAMPTZ | Nullable                                   |
| `location`       | TEXT        | Nullable                                   |
| `notes`          | TEXT        | Nullable                                   |
| `recurrence`     | TEXT        | `daily` / `weekly` / `monthly` / null      |
| `recurrence_end` | TIMESTAMPTZ | Nullable — serieslut                       |
| `skipped_dates`  | JSONB       | Array av `YYYY-MM-DD` för överhoppade dagar|
| `created_at`     | TIMESTAMPTZ | Sätts automatiskt                          |

Återkommande händelser expanderas till enskilda instanser i frontend-koden (`src/lib/expand.js`), inom intervallet ±1–2 år från idag.

---

## Databasbackup

Supabase hanterar automatisk backup (Point-in-Time Recovery på Pro-planen). På gratisplanen kan du exportera data manuellt via **Settings → Database → Backups** i Supabase Dashboard.

Om du vill köra en lokal Express-server mot Supabase finns koden kvar under `server/` — se `server/.env.example`.

---

## Standardfärger

| Person  | Färg                  |
| ------- | --------------------- |
| Erik    | `#3B82F6` blå         |
| Suzanne | `#A855F7` lila        |
| Lilly   | `#22C55E` grön        |
| Alla    | `#EAB308` gul         |

Anpassade färger sparas i `localStorage` under nyckeln `familjekalender:colors`.
