-- ============================================================
-- Familjekalendern — Supabase schema
-- Kör detta i Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS events (
  id            BIGSERIAL PRIMARY KEY,
  title         TEXT        NOT NULL,
  person        TEXT        NOT NULL,
  start_time    TIMESTAMPTZ NOT NULL,
  end_time      TIMESTAMPTZ,
  location      TEXT,
  notes         TEXT,
  recurrence    TEXT        CHECK (recurrence IN ('daily', 'weekly', 'monthly')),
  recurrence_end TIMESTAMPTZ,
  skipped_dates JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enkel app utan inloggning — stäng av RLS
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Exempeldata — anpassar datum till innevarande vecka
-- ============================================================

DO $$
DECLARE
  monday DATE := date_trunc('week', NOW())::date;  -- Måndag denna vecka
BEGIN
  INSERT INTO events (title, person, start_time, end_time, location, notes, recurrence, recurrence_end, skipped_dates) VALUES

  ('Jobbmöte',
   'erik',
   (monday + 0 + interval '9 hours'),
   (monday + 0 + interval '10 hours 30 minutes'),
   'Kontoret', 'Veckans avstämning med teamet',
   'weekly', NULL, '[]'),

  ('Yoga',
   'suzanne',
   (monday + 1 + interval '18 hours'),
   (monday + 1 + interval '19 hours'),
   'Friskis & Svettis', NULL,
   NULL, NULL, '[]'),

  ('Fotbollsträning',
   'lilly',
   (monday + 2 + interval '17 hours'),
   (monday + 2 + interval '18 hours 30 minutes'),
   'Idrottsplatsen', 'Ta med vattenflaska',
   'weekly', NULL, '[]'),

  ('Familjemiddag',
   'alla',
   (monday + 3 + interval '18 hours 30 minutes'),
   (monday + 3 + interval '20 hours'),
   'Hemma', 'Suzanne lagar pasta',
   NULL, NULL, '[]'),

  ('Tandläkare',
   'lilly',
   (monday + 4 + interval '14 hours'),
   (monday + 4 + interval '15 hours'),
   'Tandvårdscentralen', 'Halvårskontroll',
   NULL, NULL, '[]'),

  ('Bio',
   'alla',
   (monday + 5 + interval '19 hours'),
   (monday + 5 + interval '21 hours 30 minutes'),
   'Filmstaden', 'Boka biljetter i förväg',
   NULL, NULL, '[]'),

  ('Löprunda',
   'erik',
   (monday + 6 + interval '8 hours'),
   (monday + 6 + interval '9 hours'),
   'Stadsparken', NULL,
   'weekly', NULL, '[]'),

  ('Brunch med vänner',
   'suzanne',
   (monday + 6 + interval '11 hours'),
   (monday + 6 + interval '13 hours'),
   'Café Centralen', NULL,
   NULL, NULL, '[]');
END $$;
