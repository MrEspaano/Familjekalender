import { useMemo } from 'react';
import { DAY_NAMES, EVENT_TYPES } from '../constants.js';
import { getMonthGrid, isSameDay, isSameMonth, formatTime } from '../utils/date.js';
import { readableTextColor } from '../utils/colors.js';

export default function MonthView({
  monthDate,
  events,
  colors,
  onDayClick,
  onEventClick,
}) {
  const cells = useMemo(() => getMonthGrid(monthDate), [monthDate]);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const e of events) {
      const key = new Date(e.start_time).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    return map;
  }, [events]);

  const today = new Date();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {DAY_NAMES.map((d) => (
          <div key={d} className="p-2 text-center text-xs uppercase tracking-wide text-slate-500">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6">
        {cells.map((date, i) => {
          const inMonth = isSameMonth(date, monthDate);
          const isToday = isSameDay(date, today);
          const list = eventsByDay.get(date.toDateString()) || [];
          return (
            <div
              key={i}
              onClick={() => onDayClick(date)}
              className={`min-h-[90px] sm:min-h-[110px] border-l border-t border-slate-100 p-1 cursor-pointer hover:bg-slate-50 transition ${
                inMonth ? '' : 'bg-slate-50/50 text-slate-400'
              }`}
            >
              <div className="mb-1">
                <span
                  className={`inline-flex items-center justify-center text-xs font-semibold w-6 h-6 rounded-full ${
                    isToday ? 'bg-blue-600 text-white' : ''
                  }`}
                >
                  {date.getDate()}
                </span>
              </div>
              <div className="space-y-0.5">
                {list.slice(0, 3).map((e, idx) => {
                  const color = colors[e.person];
                  const typeIcon = EVENT_TYPES.find(t => t.id === e.type)?.icon || '📅';
                  return (
                    <button
                      key={`${e.id}-${e.occurrence_date ?? idx}`}
                      onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}
                      className="w-full text-left text-[10px] px-1.5 py-0.5 rounded-md truncate flex items-center gap-1 shadow-sm hover:brightness-110 transition-all"
                      style={{ backgroundColor: color, color: readableTextColor(color) }}
                      title={`${e.title} ${formatTime(new Date(e.start_time))}`}
                    >
                      <span className="flex-shrink-0 text-[10px]">{typeIcon}</span>
                      {e.is_recurring && <span className="flex-shrink-0 opacity-80 text-[8px]">↻</span>}
                      <span className="truncate font-medium">{formatTime(new Date(e.start_time))} {e.title}</span>
                    </button>
                  );
                })}
                {list.length > 3 && (
                  <div className="text-[10px] text-slate-500 px-1">+{list.length - 3} fler</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
