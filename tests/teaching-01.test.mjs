import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COLUMN_MAP, transformRow, inspectRow, joinMembers, dikwVertices, operationModel } from '../teaching-viz/models-01.js';
import { chapter01 } from '../teaching-viz/chapter-01.js';

const csv = readFileSync(new URL('../lesson-01/data/newstudent.csv', import.meta.url), 'utf8').trim().split(/\r?\n/);
const keys = csv.shift().split(',');
const rows = csv.map(line => Object.fromEntries(line.split(',').map((value, i) => [keys[i], value])));
test('all actual CSV rows share original conversion with no loss of six taught fields', () => {
  assert.equal(rows.length, 80);
  for (const raw of rows) {
    const value = transformRow(raw);
    assert.deepEqual(Object.keys(value).sort(), Object.values(COLUMN_MAP).sort());
    assert.equal(value.age, +raw['年龄']); assert.equal(value.class, raw['班级'].trim());
    assert.ok(value.birthday instanceof Date); assert.equal(inspectRow(raw).issues.length, 0);
  }
});
test('whitespace and invalid values are visible rather than silently repaired', () => {
  const raw = { ...rows[0], '姓名': ' 张明  ', '序号': '', '年龄': '十八', '生日': 'not-a-date' };
  const result = inspectRow(raw);
  assert.equal(result.value.name, '张明'); assert.equal(result.value.id, 0);
  assert.ok(Number.isNaN(result.value.age)); assert.ok(Number.isNaN(result.value.birthday.getTime()));
  assert.equal(result.issues.length, 3); assert.equal(raw['姓名'], ' 张明  ');
});
test('stable keys distinguish simultaneous three-state membership and reordering', () => {
  assert.deepEqual(joinMembers(['A', 'B', 'C'], ['B', 'C', 'D']), { enter: ['D'], update: ['B', 'C'], exit: ['A'] });
  assert.deepEqual(joinMembers(['B', 'C', 'D'], ['D', 'B', 'C']), { enter: [], update: ['D', 'B', 'C'], exit: [] });
  assert.deepEqual(joinMembers(['A', 'B', 'C'], ['B', 'C', 'D'], false), { enter: [], update: ['B', 'C', 'D'], exit: [] });
});
test('DIKW geometry uses original demo dimensions and exposes actual M/L/Z vertices', () => {
  assert.deepEqual(dikwVertices(60, 60, 0), [[270, 20], [330, 20], [360, 80], [240, 80]]);
  assert.deepEqual(dikwVertices(120, 150, 3), [[225, 260], [375, 260], [405, 380], [195, 380]]);
});
test('five first-chapter definitions have unique steps and original code line targets', () => {
  const definitions = chapter01({});
  assert.deepEqual(definitions.map(d => d.sectionId), ['1.1', '1.2', '1.3', '1.4', '1.5']);
  for (const definition of definitions) {
    assert.equal(new Set(definition.steps.map(d => d.id)).size, definition.steps.length);
    for (const focus of definition.steps) for (const line of focus.codeTargets) assert.ok(line.from > 0 && line.to >= line.from);
  }
});
test('eight operation fixtures preserve values and source links (D3 adapter test)', () => {
  // Zero-dependency adapter: this test validates our fixtures/mapping, not D3 internals.
  const transpose = matrix => matrix[0].map((_, i) => matrix.map(row => row[i]));
  const adapter = { cross: (a, b) => a.flatMap(x => b.map(y => [x, y])), merge: arrays => arrays.flat(), pairs: a => a.slice(1).map((v, i) => [a[i], v]), transpose, zip: (...arrays) => transpose(arrays) };
  const expected = { map: [1, 4, 9], reduce: 9, cross: [['A', 1], ['A', 2], ['A', 3], ['B', 1], ['B', 2], ['B', 3]], merge: [1, 2, 3], pairs: [['a', 'b'], ['b', 'c'], ['c', 'd']], transpose: [[1, 4], [2, 5], [3, 6]], zip: [['A', 1], ['B', 2], ['C', 3]], filter: [3, 4] };
  for (const [name, result] of Object.entries(expected)) {
    const model = operationModel(adapter, name); assert.deepEqual(model.result, result, name);
    for (const indices of model.links) for (const index of indices) assert.ok(index >= 0 && index < model.input.length, name);
    if (name === 'reduce') assert.deepEqual(model.stages, [2, 5, 9]);
    else if (name !== 'filter') model.result.forEach((value, i) => {
      const sources = model.links[i].map(index => model.input[index]);
      if (['cross', 'pairs', 'transpose', 'zip'].includes(name)) assert.deepEqual(sources, value);
    });
  }
  assert.throws(() => operationModel(adapter, 'not-an-operation'));
});
test('code targets remain within the original chapter code blocks', () => {
  const html = readFileSync(new URL('../lesson-01/index.html', import.meta.url), 'utf8');
  for (const definition of chapter01({})) {
    const article = html.match(new RegExp(`<article[^>]+id="ch-${definition.sectionId.replace('.', '-')}"[\\s\\S]*?</article>`))?.[0];
    assert.ok(article, definition.sectionId);
    const source = article.slice(article.indexOf('data-panel="code"'));
    const blocks = [...source.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/g)].map(match => match[1].replace(/<[^>]+>/g, '').split(/\r?\n/));
    for (const focus of definition.steps) for (const line of focus.codeTargets) {
      assert.ok(blocks[line.block] && line.to <= blocks[line.block].length, `${definition.sectionId}/${focus.id}`);
    }
  }
});
