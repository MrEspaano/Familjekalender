const MAX_INSTANCES = 500;

export function expandEvents(rows, fromDate, toDate) {
  const result = [];

  for (const event of rows) {
    if (!event.recurrence) {
      const start = new Date(event.start_time);
      if (start >= fromDate && start <= toDate) result.push(event);
      continue;
    }

    const baseStart = new Date(event.start_time);
    const baseEnd = event.end_time ? new Date(event.end_time) : null;
    const duration = baseEnd ? baseEnd - baseStart : null;
    const seriesEnd = event.recurrence_end ? new Date(event.recurrence_end) : null;
    const skipped = Array.isArray(event.skipped_dates) ? event.skipped_dates : [];

    let current = new Date(baseStart);
    let count = 0;

    while (count < MAX_INSTANCES) {
      if (seriesEnd && current > seriesEnd) break;
      if (current > toDate) break;

      const dateStr = current.toISOString().slice(0, 10);

      if (current >= fromDate && !skipped.includes(dateStr)) {
        const instanceEnd = duration ? new Date(current.getTime() + duration) : null;
        result.push({
          ...event,
          start_time: current.toISOString(),
          end_time: instanceEnd ? instanceEnd.toISOString() : null,
          is_recurring: true,
          occurrence_date: dateStr,
          type: event.type || 'event',
          metadata: event.metadata || {},
        });
        count++;
      }

      if (event.recurrence === 'daily') {
        current.setDate(current.getDate() + 1);
      } else if (event.recurrence === 'weekly') {
        current.setDate(current.getDate() + 7);
      } else if (event.recurrence === 'monthly') {
        current.setMonth(current.getMonth() + 1);
      } else {
        break;
      }
    }
  }

  return result.sort((a, b) => a.start_time.localeCompare(b.start_time));
}
