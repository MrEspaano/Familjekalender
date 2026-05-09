import { useState, useEffect } from 'react';

export default function ShoppingList() {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('familjekalender:shopping_list');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');

  useEffect(() => {
    localStorage.setItem('familjekalender:shopping_list', JSON.stringify(items));
  }, [items]);

  const addItem = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setItems([{ id: Date.now(), text: input.trim(), checked: false }, ...items]);
    setInput('');
  };

  const toggleItem = (id) => {
    setItems(items.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const clearChecked = () => {
    setItems(items.filter(item => !item.checked));
  };

  return (
    <div className="flex flex-col h-full p-4">
      <form onSubmit={addItem} className="mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Lägg till i inköpslistan..."
          className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
        />
      </form>

      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
              item.checked
                ? 'bg-slate-50 dark:bg-slate-900 opacity-50'
                : 'bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              item.checked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600'
            }`}>
              {item.checked && <span className="text-white text-[10px]">✓</span>}
            </div>
            <span className={`text-sm font-medium dark:text-slate-200 ${item.checked ? 'line-through' : ''}`}>
              {item.text}
            </span>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center text-slate-400 dark:text-slate-500 text-sm mt-10">Inköpslistan är tom.</p>
        )}
      </div>

      {items.some(i => i.checked) && (
        <button
          onClick={clearChecked}
          className="w-full py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
        >
          Rensa köpta varor
        </button>
      )}
    </div>
  );
}
