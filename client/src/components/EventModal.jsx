import { useEffect, useState } from 'react';
import { PERSONS, EVENT_TYPES } from '../constants.js';
import { formatDateISO, formatTime, combineDateAndTime } from '../utils/date.js';

const RECURRENCE_OPTIONS = [
  { value: '', label: 'Ingen upprepning' },
  { value: 'daily', label: 'Dagligen' },
  { value: 'weekly', label: 'Varje vecka' },
  { value: 'monthly', label: 'Varje månad' },
];

function buildInitialState(state) {
  // Edit a specific occurrence (creates a standalone copy)
  if (state.mode === 'create_from_recurring') {
    const e = state.event;
    const start = new Date(e.start_time);
    const end = e.end_time ? new Date(e.end_time) : null;
    return {
      title: e.title,
      person: e.person,
      type: e.type || 'event',
      metadata: e.metadata || {},
      date: formatDateISO(start),
      startTime: formatTime(start),
      endTime: end ? formatTime(end) : '',
      location: e.location || '',
      notes: e.notes || '',
      recurrence: '',
      recurrenceEnd: '',
    };
  }
  // Edit existing event (series or standalone)
  if (state.mode === 'edit') {
    const e = state.event;
    const start = new Date(e.start_time);
    const end = e.end_time ? new Date(e.end_time) : null;
    return {
      title: e.title,
      person: e.person,
      type: e.type || 'event',
      metadata: e.metadata || {},
      date: formatDateISO(start),
      startTime: formatTime(start),
      endTime: end ? formatTime(end) : '',
      location: e.location || '',
      notes: e.notes || '',
      recurrence: e.recurrence || '',
      recurrenceEnd: e.recurrence_end ? formatDateISO(new Date(e.recurrence_end)) : '',
    };
  }
  // Create new event
  const { date, hour } = state.initial;
  return {
    title: '',
    person: 'erik',
    type: 'event',
    metadata: {},
    date: formatDateISO(date),
    startTime: `${String(hour).padStart(2, '0')}:00`,
    endTime: `${String(Math.min(hour + 1, 22)).padStart(2, '0')}:00`,
    location: '',
    notes: '',
    recurrence: '',
    recurrenceEnd: '',
  };
}

export default function EventModal({ state, colors, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(() => buildInitialState(state));
  const [showMore, setShowMore] = useState(
    state.mode === 'edit' || state.mode === 'create_from_recurring'
  );
  const [submitting, setSubmitting] = useState(false);

  const isEdit = state.mode === 'edit';
  const isFromRecurring = state.mode === 'create_from_recurring';
  const editingRecurring = isEdit && !!state.event.recurrence;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!form.title.trim()) { alert('Titel krävs.'); return; }

    const start = combineDateAndTime(form.date, form.startTime);
    const end = form.endTime ? combineDateAndTime(form.date, form.endTime) : null;
    if (end && end <= start) { alert('Sluttiden måste vara efter starttiden.'); return; }

    const payload = {
      title: form.title.trim(),
      person: form.person,
      type: form.type,
      metadata: form.metadata,
      start_time: start.toISOString(),
      end_time: end ? end.toISOString() : null,
      location: form.location.trim() || null,
      notes: form.notes.trim() || null,
      recurrence: form.recurrence || null,
      recurrence_end:
        form.recurrence && form.recurrenceEnd
          ? new Date(form.recurrenceEnd + 'T23:59:59').toISOString()
          : null,
    };

    setSubmitting(true);
    try {
      await onSave(
        payload,
        isEdit ? state.event.id : null,
        isFromRecurring ? state.event.occurrence_date : null
      );
    } finally {
      setSubmitting(false);
    }
  };

  const title = isFromRecurring
    ? 'Redigera denna händelse'
    : isEdit
    ? 'Redigera händelse'
    : 'Ny händelse';

  return (
    <div
      className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90dvh] overflow-y-auto border border-white/20"
      >
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            {(isEdit && editingRecurring) || isFromRecurring ? (
              <span className="text-blue-500 animate-spin-slow">↻</span>
            ) : null}
            {title}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl transition-colors" aria-label="Stäng">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {EVENT_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => update('type', t.id)}
                className={`flex-1 flex flex-col items-center py-2 rounded-lg transition-all ${
                  form.type === t.id
                    ? 'bg-white dark:bg-slate-700 shadow-md scale-105'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <span className="text-xl">{t.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">{t.label}</span>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Titel</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              autoFocus
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Datum</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => update('date', e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Starttid</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => update('startTime', e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Person</label>
            <select
              value={form.person}
              onChange={(e) => update('person', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ borderLeft: `6px solid ${colors[form.person]}` }}
            >
              {PERSONS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {!showMore && (
            <button type="button" onClick={() => setShowMore(true)} className="text-sm text-blue-600 hover:underline">
              + Fler detaljer
            </button>
          )}

          {showMore && (
            <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
              {form.type === 'meal' && (
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-900/30">
                  <label className="block text-sm font-bold text-orange-800 dark:text-orange-300 mb-1">Vad ska vi äta? 🍳</label>
                  <input
                    type="text"
                    placeholder="T.ex. Lasagne"
                    value={form.metadata.dish || ''}
                    onChange={(e) => update('metadata', { ...form.metadata, dish: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 dark:text-white"
                  />
                </div>
              )}

              {form.type === 'chore' && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                  <label className="block text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-1">Belöning / Poäng? 🏆</label>
                  <input
                    type="text"
                    placeholder="T.ex. 10p eller 'En glass'"
                    value={form.metadata.reward || ''}
                    onChange={(e) => update('metadata', { ...form.metadata, reward: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:text-white"
                  />
                </div>
              )}

              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sluttid</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => update('endTime', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Plats</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => update('location', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Anteckningar</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Recurrence — not shown when editing a single occurrence */}
              {!isFromRecurring && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Upprepning</label>
                    <select
                      value={form.recurrence}
                      onChange={(e) => update('recurrence', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {RECURRENCE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  {form.recurrence && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Serien slutar (valfritt)
                      </label>
                      <input
                        type="date"
                        value={form.recurrenceEnd}
                        onChange={(e) => update('recurrenceEnd', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-3">
            {isEdit ? (
              <button
                type="button"
                onClick={() => onDelete(state.event.id)}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
              >
                Ta bort{editingRecurring ? ' serie' : ''}
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md">
                Avbryt
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isEdit ? 'Spara' : 'Skapa'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
