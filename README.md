# Familjekalendern

En familjekalender för Erik, Suzanne, Lilly och hela familjen ("Alla"). React + Vite på frontend, Express + SQLite på backend. Inga konton — en gemensam vy för hela familjen. Fungerar som PWA och kan installeras på mobilens hemskärm.

## Funktioner

- **Veckovy** (standard) med rutnät för måndag–söndag, 06:00–22:00, utan scroll
- **Månadsvy** som du kan växla till uppe i headern
- **Återkommande händelser** — dagligen, varje vecka eller varje månad, med valfritt slutdatum
- Klicka på en tom tidslucka för att skapa en händelse
- Klicka på en händelse för att redigera eller ta bort den; återkommande händelser frågar om du vill redigera bara den eller hela serien
- Filterknappar per familjemedlem
- Veckonummer visas uppe till höger
- Egna färger per person via kugghjulet — sparas i `localStorage`
- Offline-stöd: senast hämtade händelser visas med en varningsbanner om servern inte nås
- Installationsuppmaning för hemskärm (PWA)
- Automatisk databasbackup med rotation (max 30 filer)

## Projektstruktur

```
Familjekalender/
├── client/          # React + Vite + Tailwind + PWA
├── server/          # Express + better-sqlite3
│   ├── scripts/
│   │   └── backup.js
│   ├── .env         # Miljövariabler (skapa från .env.example)
│   └── .env.example
└── README.md
```

## Krav

- Node.js 18+

## Komma igång

Öppna **två terminaler**.

### 1. Starta backend (port 4000)

```bash
cd server
npm install
cp .env.example .env   # justera vid behov
npm run dev
```

Databasen `familjekalender.db` skapas automatiskt med exempelhändelser vid första start.

### 2. Starta frontend (port 5173)

```bash
cd client
npm install
npm run dev
```

Öppna `http://localhost:5173`. Vite proxar `/api`-anrop till backend automatiskt.

## Miljövariabler (server/.env)

| Variabel       | Standardvärde          | Beskrivning                          |
| -------------- | ---------------------- | ------------------------------------ |
| `PORT`         | `4000`                 | Port för API-servern                 |
| `DB_PATH`      | `./familjekalender.db` | Sökväg till SQLite-databasen         |
| `BACKUP_PATH`  | `./backups`            | Mapp för backup-filer                |
| `NODE_ENV`     | `development`          | Miljö (`development` / `production`) |

## Databasbackup

Kör backup manuellt:

```bash
cd server
npm run backup
```

Skapar `backups/familjekalendern-YYYY-MM-DD.sqlite`. Behåller max 30 filer och raderar de äldsta automatiskt.

### Automatisk backup via cron (macOS / Linux)

```bash
crontab -e
```

Lägg till (kör varje dag kl. 03:00):

```
0 3 * * * cd /absolut/sökväg/till/server && npm run backup >> /tmp/familjekalender-backup.log 2>&1
```

### Automatisk backup via Task Scheduler (Windows)

1. Öppna **Schemaläggaren** (Task Scheduler)
2. Klicka **Skapa grundläggande uppgift…**
3. Namn: `Familjekalendern backup`
4. Utlösare: **Dagligen**, välj tid
5. Åtgärd: **Starta ett program**
   - Program: `cmd.exe`
   - Argument: `/c "cd /d C:\sökväg\till\server && npm run backup >> C:\Temp\familjekalender-backup.log 2>&1"`
6. Slutför och spara

## REST API

Bas-URL: `http://localhost:4000/api/events`

| Metod  | Endpoint                    | Beskrivning                            |
| ------ | --------------------------- | -------------------------------------- |
| GET    | `/api/events`               | Lista händelser (expanderar återkomm.) |
| GET    | `/api/events/:id`           | Hämta en händelse (bas-post)           |
| POST   | `/api/events`               | Skapa händelse                         |
| PUT    | `/api/events/:id`           | Uppdatera händelse / serie             |
| PUT    | `/api/events/:id/recurrence`| Uppdatera upprepningsinställningar     |
| POST   | `/api/events/:id/skip`      | Hoppa över ett specifikt tillfälle     |
| DELETE | `/api/events/:id`           | Ta bort händelse (och hela serien)     |

`GET /api/events` expanderar återkommande händelser inom intervallet `?from=ISO&to=ISO` (standard: −1 år till +2 år från idag).

### Exempel på händelse

```json
{
  "title": "Fotbollsträning",
  "person": "lilly",
  "start_time": "2026-04-29T17:00:00.000Z",
  "end_time": "2026-04-29T18:30:00.000Z",
  "location": "Idrottsplatsen",
  "notes": "Ta med vattenflaska",
  "recurrence": "weekly",
  "recurrence_end": null
}
```

`person` måste vara `erik`, `suzanne`, `lilly` eller `alla`.  
`recurrence` kan vara `"daily"`, `"weekly"`, `"monthly"` eller `null`.

## Databasschema

Tabell: `events`

| Kolumn          | Typ     | Anteckning                                    |
| --------------- | ------- | --------------------------------------------- |
| `id`            | INTEGER | Primärnyckel, autoincrement                   |
| `title`         | TEXT    | Titel                                         |
| `person`        | TEXT    | `erik` / `suzanne` / `lilly` / `alla`         |
| `start_time`    | TEXT    | ISO 8601                                      |
| `end_time`      | TEXT    | ISO 8601, kan vara null                       |
| `location`      | TEXT    | Kan vara null                                 |
| `notes`         | TEXT    | Kan vara null                                 |
| `recurrence`    | TEXT    | `daily` / `weekly` / `monthly` / null         |
| `recurrence_end`| TEXT    | ISO 8601, serien slutar (null = ingen gräns)  |
| `skipped_dates` | TEXT    | JSON-array med överhoppade datum (`[]`)       |
| `created_at`    | TEXT    | ISO 8601                                      |

## PWA — installera på mobilen

I mobila webbläsare visas en banner som erbjuder installation på hemskärmen. I Chrome på Android: **Meny → Lägg till på startskärmen**.

Appen cachas med en service worker och fungerar offline (visar senast hämtade händelser).

## Bygga för produktion

```bash
cd client
npm run build      # genererar client/dist (inkl. sw.js och manifest.webmanifest)
npm run preview
```

I produktion: servera `client/dist` via t.ex. Nginx och konfigurera `/api`-proxyn mot backend-servern. HTTPS krävs för att service workern ska aktiveras.

## Standardfärger

| Person  | Färg                                      |
| ------- | ----------------------------------------- |
| Erik    | `#3B82F6` blå                             |
| Suzanne | `#A855F7` lila                            |
| Lilly   | `#22C55E` grön                            |
| Alla    | `#EAB308` gul                             |

Anpassade färger sparas i `localStorage` under nyckeln `familjekalender:colors`.
