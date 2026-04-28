import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DAY_NAMES, HOUR_START, HOUR_END } from '../constants.js';
import { addDays, isSameDay, formatTime } from '../utils/date.js';
import { hexToRgba, readableTextColor } from '../utils/colors.js';

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
    <div className="flex-1 min-h-0 flex flex-col bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-x-auto flex flex-col">
        <div className="min-w-[700px] h-full flex flex-col">
          {/* Day header */}
          <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))] border-b border-slate-200 bg-white flex-shrink-0">
            <div />
            {days.map((d, i) => {
              const isToday = isSameDay(d, today);
              return (
                <div
                  key={i}
                  className={`p-2 text-center border-l border-slate-200 ${isToday ? 'bg-blue-50' : ''}`}
                >
                  <div className="text-xs uppercase tracking-wide text-slate-500">{DAY_NAMES[i]}</div>
                  <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-slate-800'}`}>
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div ref={gridRef} className="flex-1 min-h-0">
            <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))] h-full">
              {/* Time labels */}
              <div className="flex flex-col">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="text-xs text-slate-500 text-right pr-2 border-b border-slate-100 flex-shrink-0"
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
                return (
                  <div
                    key={di}
                    className="relative border-l border-slate-200"
                    style={{ height: slotHeight * HOURS.length }}
                  >
                    {HOURS.map((h) => (
                      <div
                        key={h}
                        onClick={() => onEmptySlotClick(day, h)}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
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

function EventBlock({ event, color, slotHeight, onClick }) {
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

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="absolute left-1 right-1 rounded-md px-1.5 py-0.5 text-left text-xs shadow-sm overflow-hidden hover:opacity-90 transition"
      style={{
        top,
        height,
        backgroundColor: color,
        color: textColor,
        borderLeft: `3px solid ${hexToRgba(color, 0.7)}`,
      }}
      title={event.title}
    >
      <div className="font-semibold truncate leading-tight flex items-center gap-1">
        {event.is_recurring && <span className="opacity-80 flex-shrink-0">↻</span>}
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
