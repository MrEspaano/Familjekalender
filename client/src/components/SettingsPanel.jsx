import { useEffect } from 'react';
import { PERSONS } from '../constants.js';
import { defaultColors } from '../utils/colors.js';

export default function SettingsPanel({ colors, onChange, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const update = (id, value) => onChange({ ...colors, [id]: value });

  return (
    <div
      className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
      >
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Inställningar</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-xl leading-none"
            aria-label="Stäng"
          >
            ×
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              Färger för familjemedlemmar
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Ändringar sparas automatiskt på den här enheten.
            </p>
            <div className="space-y-2">
              {PERSONS.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 p-2 rounded-md border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block w-6 h-6 rounded-full border border-slate-300"
                      style={{ backgroundColor: colors[p.id] }}
                    />
                    <span className="text-sm font-medium text-slate-800">
                      {p.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colors[p.id]}
                      onChange={(e) => update(p.id, e.target.value)}
                      className="w-10 h-8 p-0 border border-slate-300 rounded cursor-pointer bg-white"
                      aria-label={`Välj färg för ${p.name}`}
                    />
                    <input
                      type="text"
                      value={colors[p.id]}
                      onChange={(e) => update(p.id, e.target.value)}
                      className="w-24 px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => onChange(defaultColors())}
              className="text-sm text-slate-600 hover:underline"
            >
              Återställ standardfärger
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Klar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
