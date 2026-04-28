import { useEffect } from 'react';

export default function RecurrenceDialog({ onEditThis, onEditSeries, onCancel }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6"
      >
        <h2 className="text-base font-semibold text-slate-800 mb-2 flex items-center gap-2">
          <span>↻</span> Återkommande händelse
        </h2>
        <p className="text-sm text-slate-600 mb-5">
          Vill du redigera bara den här händelsen, eller hela serien?
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onEditThis}
            className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            Bara den här händelsen
          </button>
          <button
            onClick={onEditSeries}
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-800 text-sm font-medium hover:bg-slate-50"
          >
            Hela serien
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg text-slate-500 text-sm hover:bg-slate-50"
          >
            Avbryt
          </button>
        </div>
      </div>
    </div>
  );
}
