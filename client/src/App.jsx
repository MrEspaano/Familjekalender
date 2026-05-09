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
import MealPlanner from './components/MealPlanner.jsx';
import ShoppingList from './components/ShoppingList.jsx';

export default function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [view, setView] = useState('week');
  const [currentDate, setCurrentDate] = useState(() => startOfWeek(new Date()));
  const [activePersons, setActivePersons] = useState(() => new Set(PERSON_IDS));
  const [colors, setColors] = useState(loadColors);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [modalState, setModalState] = useState(null);
  const [recurrenceDialog, setRecurrenceDialog] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('meals');

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
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

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
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Offline banner */}
      {isOffline && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2 flex-shrink-0">
          <span>⚠️</span>
          {!navigator.onLine
            ? 'Du är offline. Senast hämtade händelser visas.'
            : 'Kunde inte ansluta till servern. Kontrollera att den körs.'}
        </div>
      )}

      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 shadow-sm transition-colors">
        <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Familjekalendern
            </h1>
            <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              {['week', 'month'].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                    view === v
                      ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {v === 'week' ? 'Vecka' : 'Månad'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mr-2">
              <button onClick={goPrev} aria-label="Föregående" className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all">‹</button>
              <button onClick={goToday} className="px-3 py-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium transition-all">Idag</button>
              <button onClick={goNext} aria-label="Nästa" className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all">›</button>
            </div>

            <span className="hidden lg:inline-flex items-center gap-2 ml-2 mr-4">
              {weekData && (
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-full px-2.5 py-0.5">
                  v.{weekData.week}
                </span>
              )}
              <span className="text-slate-700 dark:text-slate-300 font-semibold capitalize text-lg">{headerLabel}</span>
            </span>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Inställningar"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all"
              title="Inställningar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-3 flex flex-wrap items-center gap-3 justify-between border-t border-slate-50 dark:border-slate-800/50 pt-3">
          <FilterBar persons={PERSONS} colors={colors} active={activePersons} onToggle={togglePerson} />
          <div className="sm:hidden flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {['week', 'month'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                  view === v ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {v === 'week' ? 'Vecka' : 'Månad'}
              </button>
            ))}
          </div>
          <span className="lg:hidden inline-flex items-center gap-2">
            {weekData && (
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-full px-2.5 py-0.5">
                v.{weekData.week}
              </span>
            )}
            <span className="text-slate-700 dark:text-slate-300 font-semibold capitalize">{headerLabel}</span>
          </span>
        </div>
      </header>

      <main className="flex-1 min-h-0 px-2 sm:px-6 py-2 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 flex flex-col min-h-0">
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
        </div>

        {/* Sidebar - Family Hub */}
        <div className="hidden lg:flex flex-col w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
          <div className="p-1 flex bg-slate-100 dark:bg-slate-800 m-4 rounded-xl">
            <button
              onClick={() => setSidebarTab('meals')}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                sidebarTab === 'meals' ? 'bg-white dark:bg-slate-700 shadow-md text-orange-600 dark:text-orange-400' : 'text-slate-500'
              }`}
            >
              Måltider
            </button>
            <button
              onClick={() => setSidebarTab('shopping')}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                sidebarTab === 'shopping' ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 dark:text-blue-400' : 'text-slate-500'
              }`}
            >
              Inköp
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sidebarTab === 'meals' ? (
              <MealPlanner
                events={filteredEvents}
                colors={colors}
                onEventClick={openEdit}
              />
            ) : (
              <ShoppingList />
            )}
          </div>
        </div>
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
