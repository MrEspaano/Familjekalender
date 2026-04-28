import './load-env.js';
import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import db from './db.js';

const app = express();
const PORT = process.env.PORT || 4000;
const MAX_RECURRENCE_INSTANCES = 500;

app.use(cors());
app.use(express.json());

// ── Zod schemas ────────────────────────────────────────────────────────────

const PersonEnum = z.enum(['erik', 'suzanne', 'lilly', 'alla']);
const RecurrenceEnum = z.enum(['daily', 'weekly', 'monthly']).nullable();

const EventSchema = z.object({
  title: z.string().min(1, 'Titel krävs.').trim(),
  person: PersonEnum,
  start_time: z.string().min(1, 'Starttid krävs.').refine(
    (v) => !Number.isNaN(Date.parse(v)),
    'Starttid har ogiltigt format.'
  ),
  end_time: z
    .string()
    .nullable()
    .optional()
    .refine((v) => v == null || v === '' || !Number.isNaN(Date.parse(v)), 'Sluttid har ogiltigt format.'),
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  recurrence: RecurrenceEnum.optional().default(null),
  recurrence_end: z
    .string()
    .nullable()
    .optional()
    .refine((v) => v == null || v === '' || !Number.isNaN(Date.parse(v)), 'Slutdatum för serie har ogiltigt format.'),
});

const RecurrenceUpdateSchema = z.object({
  recurrence: RecurrenceEnum,
  recurrence_end: z
    .string()
    .nullable()
    .optional()
    .refine((v) => v == null || v === '' || !Number.isNaN(Date.parse(v)), 'Slutdatum har ogiltigt format.'),
});

// ── Recurrence expansion ───────────────────────────────────────────────────

function expandEvents(rows, fromDate, toDate) {
  const result = [];

  for (const event of rows) {
    if (!event.recurrence) {
      const start = new Date(event.start_time);
      if (start >= fromDate && start <= toDate) result.push(event);
      continue;
    }

    const baseStart = new Date(event.start_time);
    const baseEnd = event.end_time ? new Date(event.end_time) : null;
    const duration = baseEnd ? baseEnd - baseStart : null;
    const seriesEnd = event.recurrence_end ? new Date(event.recurrence_end) : null;
    const skipped = JSON.parse(event.skipped_dates || '[]');

    let current = new Date(baseStart);
    let count = 0;

    while (count < MAX_RECURRENCE_INSTANCES) {
      if (seriesEnd && current > seriesEnd) break;
      if (current > toDate) break;

      const dateStr = current.toISOString().slice(0, 10);

      if (current >= fromDate && !skipped.includes(dateStr)) {
        const instanceEnd = duration ? new Date(current.getTime() + duration) : null;
        result.push({
          ...event,
          start_time: current.toISOString(),
          end_time: instanceEnd ? instanceEnd.toISOString() : null,
          is_recurring: true,
          occurrence_date: dateStr,
        });
        count++;
      }

      if (event.recurrence === 'daily') {
        current.setDate(current.getDate() + 1);
      } else if (event.recurrence === 'weekly') {
        current.setDate(current.getDate() + 7);
      } else if (event.recurrence === 'monthly') {
        current.setMonth(current.getMonth() + 1);
      } else {
        break;
      }
    }
  }

  return result.sort((a, b) => a.start_time.localeCompare(b.start_time));
}

// ── Helpers ────────────────────────────────────────────────────────────────

function normalize(data) {
  return {
    title: data.title.trim(),
    person: data.person,
    start_time: data.start_time,
    end_time: data.end_time && data.end_time !== '' ? data.end_time : null,
    location: data.location && data.location.trim() ? data.location.trim() : null,
    notes: data.notes && data.notes.trim() ? data.notes.trim() : null,
    recurrence: data.recurrence || null,
    recurrence_end: data.recurrence_end && data.recurrence_end !== '' ? data.recurrence_end : null,
  };
}

function zodError(res, err) {
  const errors = err.errors.map((e) => e.message);
  return res.status(400).json({ errors });
}

// ── Routes ─────────────────────────────────────────────────────────────────

app.get('/api/events', (req, res, next) => {
  try {
    const now = Date.now();
    const fromDate = req.query.from
      ? new Date(req.query.from)
      : new Date(now - 365 * 24 * 60 * 60 * 1000);
    const toDate = req.query.to
      ? new Date(req.query.to)
      : new Date(now + 2 * 365 * 24 * 60 * 60 * 1000);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return res.status(400).json({ error: 'Ogiltigt datumintervall.' });
    }

    const rows = db.prepare('SELECT * FROM events ORDER BY start_time ASC').all();
    const expanded = expandEvents(rows, fromDate, toDate);
    res.json(expanded);
  } catch (err) {
    next(err);
  }
});

app.get('/api/events/:id', (req, res, next) => {
  try {
    const row = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Händelsen hittades inte.' });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

app.post('/api/events', (req, res, next) => {
  try {
    const parsed = EventSchema.safeParse(req.body);
    if (!parsed.success) return zodError(res, parsed.error);

    const data = normalize(parsed.data);
    const created_at = new Date().toISOString();

    const result = db
      .prepare(
        `INSERT INTO events
           (title, person, start_time, end_time, location, notes, recurrence, recurrence_end, skipped_dates, created_at)
         VALUES
           (@title, @person, @start_time, @end_time, @location, @notes, @recurrence, @recurrence_end, '[]', @created_at)`
      )
      .run({ ...data, created_at });

    const created = db
      .prepare('SELECT * FROM events WHERE id = ?')
      .get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

app.put('/api/events/:id', (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Händelsen hittades inte.' });

    const parsed = EventSchema.safeParse(req.body);
    if (!parsed.success) return zodError(res, parsed.error);

    const data = normalize(parsed.data);
    db.prepare(
      `UPDATE events
       SET title = @title, person = @person, start_time = @start_time,
           end_time = @end_time, location = @location, notes = @notes,
           recurrence = @recurrence, recurrence_end = @recurrence_end
       WHERE id = @id`
    ).run({ ...data, id: req.params.id });

    const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Update recurrence settings for a series
app.put('/api/events/:id/recurrence', (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Händelsen hittades inte.' });

    const parsed = RecurrenceUpdateSchema.safeParse(req.body);
    if (!parsed.success) return zodError(res, parsed.error);

    const { recurrence, recurrence_end } = parsed.data;
    db.prepare(
      'UPDATE events SET recurrence = @recurrence, recurrence_end = @recurrence_end WHERE id = @id'
    ).run({
      recurrence: recurrence || null,
      recurrence_end: recurrence_end && recurrence_end !== '' ? recurrence_end : null,
      id: req.params.id,
    });

    res.json(db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id));
  } catch (err) {
    next(err);
  }
});

// Skip a single occurrence of a recurring event
app.post('/api/events/:id/skip', (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Händelsen hittades inte.' });
    if (!existing.recurrence) {
      return res.status(400).json({ error: 'Händelsen är inte återkommande.' });
    }

    const { occurrence_date } = req.body;
    if (!occurrence_date || !/^\d{4}-\d{2}-\d{2}$/.test(occurrence_date)) {
      return res.status(400).json({ error: 'Ogiltigt datum (YYYY-MM-DD krävs).' });
    }

    const skipped = JSON.parse(existing.skipped_dates || '[]');
    if (!skipped.includes(occurrence_date)) {
      skipped.push(occurrence_date);
      db.prepare('UPDATE events SET skipped_dates = ? WHERE id = ?').run(
        JSON.stringify(skipped),
        req.params.id
      );
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/events/:id', (req, res, next) => {
  try {
    const result = db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
    if (result.changes === 0)
      return res.status(404).json({ error: 'Händelsen hittades inte.' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ── Global error handler ───────────────────────────────────────────────────

app.use((err, req, res, _next) => {
  console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.path}:`, err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internt serverfel.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Familjekalendern API kör på http://localhost:${PORT}`);
});
