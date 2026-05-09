/**
 * Detects overlapping events for the same person.
 */
export function detectConflicts(events) {
  const conflicts = new Set();
  const sorted = [...events].sort((a, b) => a.start_time.localeCompare(b.start_time));

  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    const aStart = new Date(a.start_time);
    const aEnd = a.end_time ? new Date(a.end_time) : new Date(aStart.getTime() + 60 * 60 * 1000);

    for (let j = i + 1; j < sorted.length; j++) {
      const b = sorted[j];
      const bStart = new Date(b.start_time);

      // If B starts after A ends, no more overlaps possible for A in sorted list
      if (bStart >= aEnd) break;

      // Check if they are for the same person (or 'alla')
      const samePerson = a.person === b.person || a.person === 'alla' || b.person === 'alla';

      if (samePerson) {
        conflicts.add(a.id + (a.occurrence_date || ''));
        conflicts.add(b.id + (b.occurrence_date || ''));
      }
    }
  }

  return conflicts;
}
