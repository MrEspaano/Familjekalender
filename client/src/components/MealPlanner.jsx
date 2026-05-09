import { useMemo } from 'react';
import { formatTime } from '../utils/date.js';

export default function MealPlanner({ events, colors, onEventClick }) {
  const meals = useMemo(() => {
    return events
      .filter((e) => e.type === 'meal')
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [events]);

  if (meals.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-slate-400 dark:text-slate-500 text-sm">Inga måltider planerade denna vecka.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-2">
      {meals.map((meal) => (
        <button
          key={meal.id + (meal.occurrence_date || '')}
          onClick={() => onEventClick(meal)}
          className="w-full text-left p-3 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
              {new Date(meal.start_time).toLocaleDateString('sv-SE', { weekday: 'short' })} {formatTime(new Date(meal.start_time))}
            </span>
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors[meal.person] }}
            />
          </div>
          <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
            {meal.metadata?.dish || meal.title}
          </h4>
          {meal.location && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              📍 {meal.location}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}
