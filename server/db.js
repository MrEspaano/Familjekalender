import './load-env.js';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dbPath = process.env.DB_PATH
  ? resolve(__dirname, process.env.DB_PATH)
  : join(__dirname, 'familjekalender.db');

let db;
try {
  db = new Database(dbPath);
} catch (err) {
  console.error(
    `[${new Date().toISOString()}] FATAL: Kunde inte öppna databasen på ${dbPath}: ${err.message}`
  );
  process.exit(1);
}

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    person TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    location TEXT,
    notes TEXT,
    recurrence TEXT,
    recurrence_end TEXT,
    skipped_dates TEXT DEFAULT '[]',
    created_at TEXT NOT NULL
  )
`);

// Migrate existing databases that lack the new columns
const existingCols = db
  .prepare('PRAGMA table_info(events)')
  .all()
  .map((c) => c.name);

if (!existingCols.includes('recurrence'))
  db.exec('ALTER TABLE events ADD COLUMN recurrence TEXT');
if (!existingCols.includes('recurrence_end'))
  db.exec('ALTER TABLE events ADD COLUMN recurrence_end TEXT');
if (!existingCols.includes('skipped_dates'))
  db.exec("ALTER TABLE events ADD COLUMN skipped_dates TEXT DEFAULT '[]'");

function seedIfEmpty() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM events').get();
  if (count > 0) return;

  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  function makeDate(dayOffset, hour, minute = 0) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  }

  const samples = [
    {
      title: 'Jobbmöte',
      person: 'erik',
      start_time: makeDate(0, 9, 0),
      end_time: makeDate(0, 10, 30),
      location: 'Kontoret',
      notes: 'Veckans avstämning med teamet',
      recurrence: 'weekly',
      recurrence_end: null,
    },
    {
      title: 'Yoga',
      person: 'suzanne',
      start_time: makeDate(1, 18, 0),
      end_time: makeDate(1, 19, 0),
      location: 'Friskis & Svettis',
      notes: null,
      recurrence: null,
      recurrence_end: null,
    },
    {
      title: 'Fotbollsträning',
      person: 'lilly',
      start_time: makeDate(2, 17, 0),
      end_time: makeDate(2, 18, 30),
      location: 'Idrottsplatsen',
      notes: 'Ta med vattenflaska',
      recurrence: 'weekly',
      recurrence_end: null,
    },
    {
      title: 'Familjemiddag',
      person: 'alla',
      start_time: makeDate(3, 18, 30),
      end_time: makeDate(3, 20, 0),
      location: 'Hemma',
      notes: 'Suzanne lagar pasta',
      recurrence: null,
      recurrence_end: null,
    },
    {
      title: 'Tandläkare',
      person: 'lilly',
      start_time: makeDate(4, 14, 0),
      end_time: makeDate(4, 15, 0),
      location: 'Tandvårdscentralen',
      notes: 'Halvårskontroll',
      recurrence: null,
      recurrence_end: null,
    },
    {
      title: 'Bio',
      person: 'alla',
      start_time: makeDate(5, 19, 0),
      end_time: makeDate(5, 21, 30),
      location: 'Filmstaden',
      notes: 'Boka biljetter i förväg',
      recurrence: null,
      recurrence_end: null,
    },
    {
      title: 'Löprunda',
      person: 'erik',
      start_time: makeDate(6, 8, 0),
      end_time: makeDate(6, 9, 0),
      location: 'Stadsparken',
      notes: null,
      recurrence: 'weekly',
      recurrence_end: null,
    },
    {
      title: 'Brunch med vänner',
      person: 'suzanne',
      start_time: makeDate(6, 11, 0),
      end_time: makeDate(6, 13, 0),
      location: 'Café Centralen',
      notes: null,
      recurrence: null,
      recurrence_end: null,
    },
  ];

  const insert = db.prepare(`
    INSERT INTO events
      (title, person, start_time, end_time, location, notes, recurrence, recurrence_end, skipped_dates, created_at)
    VALUES
      (@title, @person, @start_time, @end_time, @location, @notes, @recurrence, @recurrence_end, '[]', @created_at)
  `);

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insert.run({ ...row, created_at: new Date().toISOString() });
    }
  });

  insertMany(samples);
}

seedIfEmpty();

export default db;
