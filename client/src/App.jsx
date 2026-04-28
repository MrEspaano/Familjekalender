import { useCallback, useEffect, useMemo, useState } from 'react';
import { PERSONS, PERSON_IDS } from './constants.js';
import {
  startOfWeek,
  addWeeks,
  addMonths,
  formatWeekRange,
  formatMonth,
} from './utils/date.js';
import { loadColors, saveColors } from './utils/colors.js';
import * as api from './api.js';
import WeekView from './components/WeekView.jsx';
import MonthView from './components/MonthView.jsx';
import FilterBar from './components/FilterBar.jsx';
import EventModal from './components/EventModal.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import RecurrenceDialog from './components/RecurrenceDialog.jsx';
import InstallPrompt from './components/InstallPrompt.jsx';

export default function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [view, setView] = useState('week');
  const [currentDate, setCurrentDate] = useState(() => startOfWeek(new Date()));
  const [activePersons, setActivePersons] = useState(() => new Set(PERSON_IDS));
  const [colors, setColors] = useState(loadColors);
  const [modalState, setModalState] = useState(null);
  const [recurrenceDialog, setRecurrenceDialog] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await api.listEvents();
      setEvents(rows);
      setIsOffline(false);
      setError(null);
    } catch (err) {
      const cached = api.getCachedEvents();
      if (cached) {
        setEvents(cached);
        setIsOffline(true);
        setError(null);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => { saveColors(colors); }, [colors]);

  useEffect(() => {
    const goOnline = () => { setIsOffline(false); fetchEvents(); };
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [fetchEvents]);

  const filteredEvents = useMemo(
    () => events.filter((e) => activePersons.has(e.person)),
    [events, activePersons]
  );

  const togglePerson = (id) =>
    setActivePersons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const goPrev = () =>
    setCurrentDate((d) => view === 'week' ? addWeeks(d, -1) : addMonths(d, -1));
  const goNext = () =>
    setCurrentDate((d) => view === 'week' ? addWeeks(d, 1) : addMonths(d, 1));
  const goToday = () =>
    setCurrentDate(view === 'week' ? startOfWeek(new Date()) : new Date());

  const openCreate = (date, hour) =>
    setModalState({ mode: 'create', initial: { date, hour } });

  const openEdit = (event) => {
    if (event.is_recurring) {
      setRecurrenceDialog({ event });
    } else {
      setModalState({ mode: 'edit', event });
    }
  };

  const handleRecurrenceChoice = async (choice) => {
    const { event } = recurrenceDialog;
    setRecurrenceDialog(null);
    if (choice === 'this') {
      setModalState({ mode: 'create_from_recurring', event });
    } else {
      try {
        const baseEvent = await api.getEvent(event.id);
        setModalState({ mode: 'edit', event: baseEvent });
      } catch {
        setModalState({ mode: 'edit', event: { ...event, is_recurring: false, occurrence_date: undefined } });
      }
    }
  };

  const closeModal = () => setModalState(null);

  const handleSave = async (data, id, occurrenceDate) => {
    try {
      if (id && occurrenceDate) {
        // Editing a single occurrence: create a standalone copy + skip the original
        await api.createEvent(data);
        await api.skipOccurrence(id, occurrenceDate);
      } else if (id) {
        await api.updateEvent(id, data);
      } else {
        await api.createEvent(data);
      }
      await fetchEvents();
      closeModal();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Vill du verkligen ta bort den här händelsen (och hela serien om den upprepas)?')) return;
    try {
      await api.deleteEvent(id);
      await fetchEvents();
      closeModal();
    } catch (err) {
      alert(err.message);
    }
  };

  const weekData = view === 'week' ? formatWeekRange(currentDate) : null;
  const headerLabel = weekData ? weekData.range : formatMonth(currentDate);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Offline banner */}
      {isOffline && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 flex items-center gap-2 flex-shrink-0">
          <span>⚠️</span>
          {!navigator.onLine
            ? 'Du är offline. Senast hämtade händelser visas.'
            : 'Kunde inte ansluta till servern. Kontrollera att den körs.'}
        </div>
      )}

      <header className="bg-white border-b border-slate-200 flex-shrink-0">
        <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">Familjekalendern</h1>
            <div className="hidden sm:flex bg-slate-100 rounded-lg p-1">
              {['week', 'month'].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                    view === v ? 'bg-white shadow text-slate-900' : 'text-slate-600'
                  }`}
                >
                  {v === 'week' ? 'Vecka' : 'Månad'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={goPrev} aria-label="Föregående" className="px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700">‹</button>
            <button onClick={goToday} className="px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium">Idag</button>
            <button onClick={goNext} aria-label="Nästa" className="px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700">›</button>
            <span className="hidden md:inline-flex items-center gap-2 ml-2">
              {weekData && (
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
                  v.{weekData.week}
                </span>
              )}
              <span className="text-slate-700 font-medium capitalize">{headerLabel}</span>
            </span>
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Inställningar"
              className="ml-2 p-2 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700"
              title="Inställningar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-3 flex flex-wrap items-center gap-3 justify-between">
          <FilterBar persons={PERSONS} colors={colors} active={activePersons} onToggle={togglePerson} />
          <div className="sm:hidden flex bg-slate-100 rounded-lg p-1">
            {['week', 'month'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                  view === v ? 'bg-white shadow text-slate-900' : 'text-slate-600'
                }`}
              >
                {v === 'week' ? 'Vecka' : 'Månad'}
              </button>
            ))}
          </div>
          <span className="md:hidden inline-flex items-center gap-2">
            {weekData && (
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
                v.{weekData.week}
              </span>
            )}
            <span className="text-slate-700 font-medium capitalize">{headerLabel}</span>
          </span>
        </div>
      </header>

      <main className="flex-1 min-h-0 px-2 sm:px-6 py-2 flex flex-col">
        {error && (
          <div className="mb-2 p-3 rounded bg-red-100 text-red-800 text-sm flex-shrink-0">
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-center text-slate-500 py-10">Laddar…</div>
        ) : view === 'week' ? (
          <WeekView
            weekStart={currentDate}
            events={filteredEvents}
            colors={colors}
            onEmptySlotClick={openCreate}
            onEventClick={openEdit}
          />
        ) : (
          <div className="flex-1 overflow-y-auto">
            <MonthView
              monthDate={currentDate}
              events={filteredEvents}
              colors={colors}
              onDayClick={(date) => openCreate(date, 9)}
              onEventClick={openEdit}
            />
          </div>
        )}
      </main>

      {recurrenceDialog && (
        <RecurrenceDialog
          onEditThis={() => handleRecurrenceChoice('this')}
          onEditSeries={() => handleRecurrenceChoice('series')}
          onCancel={() => setRecurrenceDialog(null)}
        />
      )}

      {modalState && (
        <EventModal
          state={modalState}
          colors={colors}
          onClose={closeModal}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {settingsOpen && (
        <SettingsPanel
          colors={colors}
          onChange={setColors}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      <InstallPrompt />
    </div>
  );
}
