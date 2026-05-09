import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DAY_NAMES, HOUR_START, HOUR_END, EVENT_TYPES } from '../constants.js';
import { addDays, isSameDay, formatTime } from '../utils/date.js';
import { hexToRgba, readableTextColor } from '../utils/colors.js';
import { detectConflicts } from '../utils/logistics.js';

const HOURS = [];
for (let h = HOUR_START; h <= HOUR_END; h++) HOURS.push(h);

export default function WeekView({
  weekStart,
  events,
  colors,
  onEmptySlotClick,
  onEventClick,
}) {
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const gridRef = useRef(null);
  const [slotHeight, setSlotHeight] = useState(48);

  useLayoutEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const update = () => {
      setSlotHeight(Math.max(28, Math.floor(el.offsetHeight / HOURS.length)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const conflicts = useMemo(() => detectConflicts(events), [events]);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    days.forEach((d) => map.set(d.toDateString(), []));
    for (const e of events) {
      const key = new Date(e.start_time).toDateString();
      if (map.has(key)) map.get(key).push(e);
    }
    return map;
  }, [events, days]);

  const today = new Date();

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
      <div className="flex-1 min-h-0 overflow-x-auto flex flex-col">
        <div className="min-w-[800px] h-full flex flex-col">
          {/* Day header */}
          <div className="grid grid-cols-[70px_repeat(7,minmax(0,1fr))] border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0 sticky top-0 z-10 transition-colors">
            <div className="border-r border-slate-100 dark:border-slate-800/50" />
            {days.map((d, i) => {
              const isToday = isSameDay(d, today);
              return (
                <div
                  key={i}
                  className={`p-3 text-center border-l border-slate-100 dark:border-slate-800/50 ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                >
                  <div className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>{DAY_NAMES[i]}</div>
                  <div className={`text-xl font-black mt-0.5 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div ref={gridRef} className="flex-1 min-h-0">
            <div className="grid grid-cols-[70px_repeat(7,minmax(0,1fr))] h-full">
              {/* Time labels */}
              <div className="flex flex-col bg-slate-50/30 dark:bg-slate-900/30 border-r border-slate-100 dark:border-slate-800/50">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="text-[10px] font-bold text-slate-400 dark:text-slate-500 text-right pr-3 border-b border-slate-50 dark:border-slate-800/30 flex-shrink-0"
                    style={{ height: slotHeight }}
                  >
                    <span className="-translate-y-2 inline-block">
                      {String(h).padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map((day, di) => {
                const dayEvents = eventsByDay.get(day.toDateString()) || [];
                const isToday = isSameDay(day, today);
                return (
                  <div
                    key={di}
                    className={`relative border-l border-slate-100 dark:border-slate-800/50 ${isToday ? 'bg-blue-50/10 dark:bg-blue-900/5' : ''}`}
                    style={{ height: slotHeight * HOURS.length }}
                  >
                    {HOURS.map((h) => (
                      <div
                        key={h}
                        onClick={() => onEmptySlotClick(day, h)}
                        className="border-b border-slate-50 dark:border-slate-800/30 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer transition-colors"
                        style={{ height: slotHeight }}
                      />
                    ))}
                    {dayEvents.map((e, idx) => (
                      <EventBlock
                        key={`${e.id}-${e.occurrence_date ?? idx}`}
                        event={e}
                        color={colors[e.person]}
                        slotHeight={slotHeight}
                        onClick={() => onEventClick(e)}
                        isConflicting={conflicts.has(e.id + (e.occurrence_date || ''))}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventBlock({ event, color, slotHeight, onClick, isConflicting }) {
  const start = new Date(event.start_time);
  const end = event.end_time
    ? new Date(event.end_time)
    : new Date(start.getTime() + 60 * 60 * 1000);

  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;
  const top = Math.max(0, (startHour - HOUR_START) * slotHeight);
  const height = Math.max(18, (endHour - startHour) * slotHeight - 2);

  if (startHour >= HOUR_END + 1 || endHour <= HOUR_START) return null;

  const isShort = height < 36;
  const textColor = readableTextColor(color);
  const typeIcon = EVENT_TYPES.find(t => t.id === event.type)?.icon || '📅';

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`absolute left-1 right-1 rounded-lg px-2 py-1 text-left text-[11px] shadow-lg overflow-hidden hover:scale-[1.02] hover:brightness-110 active:scale-95 transition-all z-1 ${
        isConflicting ? 'ring-2 ring-red-500 ring-offset-2 dark:ring-offset-slate-900 animate-pulse-slow' : ''
      }`}
      style={{
        top,
        height,
        backgroundColor: color,
        color: textColor,
        boxShadow: isConflicting
          ? `0 0 15px ${hexToRgba('#ef4444', 0.5)}`
          : `0 4px 12px ${hexToRgba(color, 0.3)}`,
        borderLeft: `4px solid ${hexToRgba(color, 0.5)}`,
      }}
      title={isConflicting ? `KONFLIKT: ${event.title}` : event.title}
    >
      {isConflicting && (
        <div className="absolute top-0 right-0 bg-red-500 text-white px-1 rounded-bl-md font-black text-[8px] z-10 shadow-sm">
          !
        </div>
      )}
      <div className="font-bold truncate leading-tight flex items-center gap-1">
        <span className="text-xs">{typeIcon}</span>
        {event.is_recurring && <span className="opacity-70 flex-shrink-0 text-[10px]">↻</span>}
        <span className="truncate">{event.title}</span>
      </div>
      {!isShort && (
        <div className="opacity-90 truncate leading-tight">
          {formatTime(start)}{event.end_time ? `–${formatTime(end)}` : ''}
        </div>
      )}
      {!isShort && event.location && (
        <div className="opacity-80 truncate leading-tight">{event.location}</div>
      )}
    </button>
  );
}
