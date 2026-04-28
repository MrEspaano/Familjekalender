const BASE = '/api/events';
const EVENTS_CACHE_KEY = 'familjekalender:events_cache';

async function handle(res) {
  if (!res.ok) {
    let message = 'Något gick fel.';
    try {
      const data = await res.json();
      message = data.errors?.join(' ') || data.error || message;
    } catch {}
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

function defaultRange() {
  const now = Date.now();
  return {
    from: new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString(),
    to: new Date(now + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export async function listEvents() {
  const { from, to } = defaultRange();
  const url = `${BASE}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  const data = await fetch(url).then(handle);
  localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(data));
  return data;
}

export function getCachedEvents() {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_CACHE_KEY) || 'null');
  } catch {
    return null;
  }
}

export function getEvent(id) {
  return fetch(`${BASE}/${id}`).then(handle);
}

export function createEvent(data) {
  return fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handle);
}

export function updateEvent(id, data) {
  return fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handle);
}

export function updateRecurrence(id, data) {
  return fetch(`${BASE}/${id}/recurrence`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handle);
}

export function skipOccurrence(id, occurrence_date) {
  return fetch(`${BASE}/${id}/skip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ occurrence_date }),
  }).then(handle);
}

export function deleteEvent(id) {
  return fetch(`${BASE}/${id}`, { method: 'DELETE' }).then(handle);
}
