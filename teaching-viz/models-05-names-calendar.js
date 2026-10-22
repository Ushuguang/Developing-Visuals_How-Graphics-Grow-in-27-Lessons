import { calendarCell, localKey } from './models-05.js';

export function peakRecord(records, start = -Infinity, end = Infinity) {
  return records.filter(d => d.year >= start && d.year <= end && Number.isFinite(d.count))
    .reduce((peak, d) => !peak || d.count > peak.count ? d : peak, null);
}

export function compareYears(names, first, second) {
  return Object.entries(names).map(([name, records]) => {
    const a = records.find(d => d.year === first)?.count;
    const b = records.find(d => d.year === second)?.count;
    return { name, first: a, second: b, change: a == null || b == null ? null : b - a };
  });
}

export function calendarFrame(days, weekStart, selectedKey, whole = false, size = 24) {
  const cells = days.map(date => ({ date, key: localKey(date), ...calendarCell(date, weekStart, size) }));
  const selected = cells.find(d => d.key === selectedKey) ?? cells[0];
  const firstColumn = whole ? 0 : Math.floor(selected.column / 4) * 4;
  const visible = cells.filter(d => whole || (d.column >= firstColumn && d.column < firstColumn + 4));
  const weekdays = Array.from({ length: 7 }, (_, row) => ({ row, members: cells.filter(d => d.row === row) }));
  const weeks = Array.from({ length: Math.max(...cells.map(d => d.column)) + 1 }, (_, column) => ({ column, members: cells.filter(d => d.column === column) }));
  const boundaries = visible.filter(d => {
    const before = new Date(d.date.getFullYear(), d.date.getMonth(), d.date.getDate() - 7);
    return before.getMonth() !== d.date.getMonth() || before.getFullYear() !== d.date.getFullYear();
  });
  return { cells, selected, firstColumn, visible, weekdays, weeks, boundaries };
}

export function weatherExtremes(cells, byKey) {
  const available = cells.filter(d => Number.isFinite(byKey.get(d.key)));
  if (!available.length) return { min: null, max: null };
  return available.reduce((out, cell) => {
    const value = byKey.get(cell.key);
    if (value < byKey.get(out.min.key)) out.min = cell;
    if (value > byKey.get(out.max.key)) out.max = cell;
    return out;
  }, { min: available[0], max: available[0] });
}
