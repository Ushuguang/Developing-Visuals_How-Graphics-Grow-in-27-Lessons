import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { localDays } from '../teaching-viz/models-05.js';
import { peakRecord, compareYears, calendarFrame, weatherExtremes } from '../teaching-viz/models-05-names-calendar.js';
import { namesDefinition, calendarDefinition } from '../teaching-viz/chapter-05-names-calendar.js';

const sourceNames = JSON.parse(await readFile(new URL('../lesson-05/data/french_names.json', import.meta.url), 'utf8')).names;
const sourceWeather = (await readFile(new URL('../lesson-05/data/weather_2024.csv', import.meta.url), 'utf8')).trim().split(/\r?\n/).slice(1).map(line => { const [key, temp] = line.split(','); return [key, +temp]; });

test('name comparisons retain zero, missing, signed differences and source objects', () => {
  const names = { A: [{year: 1, count: 0}, {year: 2, count: 4}], B: [{year: 1, count: 3}] };
  assert.deepEqual(compareYears(names, 1, 2), [
    {name: 'A', first: 0, second: 4, change: 4}, {name: 'B', first: 3, second: undefined, change: null}
  ]);
  assert.equal(compareYears(names, 2, 1)[0].change, -4);
  assert.equal(peakRecord(names.A), names.A[1]);
  assert.equal(peakRecord(names.A, 3, 4), null);
  const tied = [{year: 1, count: 5}, {year: 2, count: 5}];
  assert.equal(peakRecord(tied), tied[0], 'ties preserve first source row');
});

test('actual name tasks read original frequencies without changing their source', () => {
  const snapshot = JSON.stringify(sourceNames);
  const changes = compareYears(sourceNames, 1965, 2000);
  assert.deepEqual(changes.map(d => [d.first, d.second]), [[4711, 1490], [4394, 3698], [399, 5051]]);
  for (const [name, records] of Object.entries(sourceNames)) {
    const peak = peakRecord(records);
    assert.equal(peak.count, Math.max(...records.map(d => d.count)), name);
    assert.equal(records.find(d => d.year === peak.year), peak);
  }
  assert.equal(JSON.stringify(sourceNames), snapshot);
});

test('all 366 dates are conserved when partitioned by weekday or actual week', () => {
  for (const weekStart of [0, 1]) {
    const frame = calendarFrame(localDays(2024), weekStart, '2024-02-29');
    assert.equal(frame.cells.length, 366);
    assert.equal(frame.weekdays.reduce((sum, group) => sum + group.members.length, 0), 366);
    assert.equal(frame.weeks.reduce((sum, group) => sum + group.members.length, 0), 366);
    assert.equal(new Set(frame.weekdays.flatMap(group => group.members.map(d => d.key))).size, 366);
    assert.equal(new Set(frame.weeks.flatMap(group => group.members.map(d => d.key))).size, 366);
    assert.ok(frame.weeks.every(group => group.members.length >= 1 && group.members.length <= 7));
    assert.equal(frame.selected.day, 60);
    assert.ok(frame.visible.some(d => d.key === '2024-02-29'));
  }
});

test('week boundaries, zoom positions and month-border cells use actual dates', () => {
  const days = localDays(2024);
  const before = calendarFrame(days, 0, '2024-01-06'), after = calendarFrame(days, 0, '2024-01-07');
  assert.deepEqual([before.selected.column, before.selected.row], [0, 6]);
  assert.deepEqual([after.selected.column, after.selected.row], [1, 0]);
  const monday = calendarFrame(days, 1, '2024-01-07');
  assert.deepEqual([monday.selected.column, monday.selected.row], [0, 6]);
  for (const size of [14, 44]) {
    const frame = calendarFrame(days, 0, '2024-02-29', false, size);
    assert.equal(frame.selected.x, frame.selected.column * size);
    assert.equal(frame.selected.y, frame.selected.row * size);
    for (const cell of frame.boundaries) {
      const previous = new Date(cell.date.getFullYear(), cell.date.getMonth(), cell.date.getDate() - 7);
      assert.ok(previous.getFullYear() !== cell.date.getFullYear() || previous.getMonth() !== cell.date.getMonth());
    }
    assert.ok(frame.boundaries.some(cell => cell.key === '2024-03-01'));
  }
  assert.equal(calendarFrame(days, 0, '2024-12-31', true).visible.length, 366);
});

test('temperature tasks find actual extremes, never treat missing as zero', () => {
  const frame = calendarFrame(localDays(2024), 0, '2024-02-29');
  const byKey = new Map(sourceWeather), snapshot = [...byKey];
  const extremes = weatherExtremes(frame.cells, byKey);
  assert.equal(byKey.get(extremes.min.key), Math.min(...byKey.values()));
  assert.equal(byKey.get(extremes.max.key), Math.max(...byKey.values()));
  assert.deepEqual([...byKey], snapshot);
  const sparse = new Map([[frame.cells[0].key, null], [frame.cells[1].key, 0], [frame.cells[2].key, 2]]);
  assert.equal(weatherExtremes(frame.cells, sparse).min.key, frame.cells[1].key);
  assert.deepEqual(weatherExtremes(frame.cells, new Map()), {min: null, max: null});
});

test('refined steps still target the original teacher code blocks and line bounds', async () => {
  const html = await readFile(new URL('../lesson-05/index.html', import.meta.url), 'utf8');
  for (const definition of [namesDefinition({}), calendarDefinition({})]) {
    const start = html.indexOf(`id="ch-${definition.sectionId.replace('.', '-')}"`), article = html.slice(start, html.indexOf('</article>', start));
    const code = article.slice(article.search(/<div[^>]+data-panel="code"/), article.search(/<div[^>]+data-panel="demo"/));
    const blocks = [...code.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/g)].map(match => match[1].replace(/<\/?[A-Za-z][^>]*>/g, '').replace(/\r\n/g, '\n').split('\n'));
    for (const step of definition.steps) for (const target of step.codeTargets) {
      assert.ok(blocks[target.block]); assert.ok(target.from >= 1 && target.to >= target.from && target.to <= blocks[target.block].length);
      assert.ok(blocks[target.block].slice(target.from - 1, target.to).join('').trim());
    }
  }
});
