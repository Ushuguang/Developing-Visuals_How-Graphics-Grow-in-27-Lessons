import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVisits, readVisits, saveVisit, STORAGE_KEY } from '../learning-progress.js';

test('malformed or incompatible browser records do not break the homepage', () => {
  for (const value of [null, '', '{bad', 'null', '[]', '{"version":2,"visits":{}}']) assert.deepEqual(parseVisits(value), {});
  const clean = parseVisits(JSON.stringify({ version: 1, visits: {
    1: { at: 100, section: 'ch-5-1', tab: 'unrecognized', offset: 1e20 },
    2: { at: 200, section: 'ch-2-3', tab: 'code', offset: -255 },
    3: { at: 'invalid' }, 7: { at: 300 }
  } }));
  assert.deepEqual(Object.keys(clean), ['1', '2']);
  assert.deepEqual(clean[1], { at: 100, section: 'ch-1-1', tab: 'explain', offset: 100000 });
  assert.deepEqual(clean[2], { at: 200, section: 'ch-2-3', tab: 'code', offset: -255 });
});

test('saving another chapter preserves visits; unavailable storage degrades safely', () => {
  const memory = new Map();
  globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
  const record = { at: 100, section: 'ch-1-2', tab: 'explain', offset: 45 };
  assert.equal(saveVisit(1, record), true);
  assert.equal(saveVisit(2, { ...record, at: 200, section: 'ch-2-3', tab: 'code' }), true);
  assert.deepEqual(Object.keys(readVisits().visits), ['1', '2']);
  assert.equal(JSON.parse(memory.get(STORAGE_KEY)).version, 1);
  globalThis.localStorage = { getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); } };
  assert.deepEqual(readVisits(), { visits: {}, available: false });
  assert.equal(saveVisit(1, record), false);
  delete globalThis.localStorage;
});

test('mapping visits are restored without changing the existing record version', () => {
  const record = { at: 300, section: 'ch-1-2', tab: 'mapping', offset: 180 };
  assert.deepEqual(parseVisits(JSON.stringify({ version: 1, visits: { 1: record } }))[1], record);
});
