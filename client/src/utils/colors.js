import { PERSONS } from '../constants.js';

const STORAGE_KEY = 'familjekalender:colors';

export function loadColors() {
  if (typeof window === 'undefined') return defaultColors();
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const result = {};
    for (const p of PERSONS) {
      result[p.id] = stored[p.id] || p.defaultColor;
    }
    return result;
  } catch {
    return defaultColors();
  }
}

export function saveColors(colors) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
}

export function defaultColors() {
  return Object.fromEntries(PERSONS.map((p) => [p.id, p.defaultColor]));
}

export function hexToRgba(hex, alpha = 1) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function readableTextColor(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1f2937' : '#ffffff';
}
