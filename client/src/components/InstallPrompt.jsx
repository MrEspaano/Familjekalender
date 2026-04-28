import { useEffect, useState } from 'react';

const DISMISSED_KEY = 'familjekalender:install_dismissed';

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
    else dismiss();
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-20 bg-white rounded-xl shadow-lg border border-slate-200 p-4 flex items-start gap-3">
      <div className="text-2xl flex-shrink-0">📅</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800">Installera Familjekalendern</p>
        <p className="text-xs text-slate-500 mt-0.5">
          Lägg till på hemskärmen för snabb åtkomst.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={install}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
          >
            Installera
          </button>
          <button
            onClick={dismiss}
            className="px-3 py-1.5 text-slate-600 text-xs rounded-lg hover:bg-slate-100"
          >
            Inte nu
          </button>
        </div>
      </div>
      <button onClick={dismiss} className="text-slate-400 hover:text-slate-600 flex-shrink-0" aria-label="Stäng">
        ×
      </button>
    </div>
  );
}
