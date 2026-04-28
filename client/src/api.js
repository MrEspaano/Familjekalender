import { supabase } from './lib/supabase.js';
import { expandEvents } from './lib/expand.js';

const CACHE_KEY = 'familjekalender:events_cache';

function defaultRange() {
  const now = Date.now();
  return {
    from: new Date(now - 365 * 24 * 60 * 60 * 1000),
    to: new Date(now + 2 * 365 * 24 * 60 * 60 * 1000),
  };
}

function normalizeForDB(data) {
  return {
    title: data.title?.trim(),
    person: data.person,
    start_time: data.start_time,
    end_time: data.end_time || null,
    location: data.location?.trim() || null,
    notes: data.notes?.trim() || null,
    recurrence: data.recurrence || null,
    recurrence_end: data.recurrence_end || null,
  };
}

export async function listEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('start_time', { ascending: true });

  if (error) throw new Error(error.message);

  const { from, to } = defaultRange();
  const expanded = expandEvents(data, from, to);
  localStorage.setItem(CACHE_KEY, JSON.stringify(expanded));
  return expanded;
}

export function getCachedEvents() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
  } catch {
    return null;
  }
}

export async function getEvent(id) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createEvent(eventData) {
  const { data, error } = await supabase
    .from('events')
    .insert([normalizeForDB(eventData)])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateEvent(id, eventData) {
  const { data, error } = await supabase
    .from('events')
    .update(normalizeForDB(eventData))
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateRecurrence(id, recurrenceData) {
  const { data, error } = await supabase
    .from('events')
    .update({
      recurrence: recurrenceData.recurrence || null,
      recurrence_end: recurrenceData.recurrence_end || null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function skipOccurrence(id, occurrence_date) {
  const { data: event, error: fetchErr } = await supabase
    .from('events')
    .select('skipped_dates')
    .eq('id', id)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  const skipped = Array.isArray(event.skipped_dates) ? [...event.skipped_dates] : [];
  if (!skipped.includes(occurrence_date)) skipped.push(occurrence_date);

  const { error } = await supabase
    .from('events')
    .update({ skipped_dates: skipped })
    .eq('id', id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function deleteEvent(id) {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return null;
}
