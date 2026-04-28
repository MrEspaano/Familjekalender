import { hexToRgba, readableTextColor } from '../utils/colors.js';

export default function FilterBar({ persons, colors, active, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {persons.map((p) => {
        const color = colors[p.id];
        const isActive = active.has(p.id);
        return (
          <button
            key={p.id}
            onClick={() => onToggle(p.id)}
            className="px-3 py-1.5 rounded-full text-sm font-medium border transition"
            style={
              isActive
                ? {
                    backgroundColor: color,
                    color: readableTextColor(color),
                    borderColor: color,
                  }
                : {
                    backgroundColor: hexToRgba(color, 0.12),
                    color: '#475569',
                    borderColor: hexToRgba(color, 0.4),
                    opacity: 0.7,
                  }
            }
            aria-pressed={isActive}
          >
            <span
              className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
              style={{
                backgroundColor: isActive ? readableTextColor(color) : color,
              }}
            />
            {p.name}
          </button>
        );
      })}
    </div>
  );
}
