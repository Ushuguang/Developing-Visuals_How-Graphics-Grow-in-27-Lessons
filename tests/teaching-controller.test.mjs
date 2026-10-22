import test from 'node:test';
import assert from 'node:assert/strict';
import { createStepState, waitForScene } from '../teaching-viz/linked-learning.js';
test('step navigation is bounded, rejects unknown steps, resets and isolates instances', () => {
  const a = createStepState(['source','group','count']);
  const b = createStepState(['source','group','count']);
  assert.equal(a.previous(),'source');
  for(let n=0;n<20;n++) a.next();
  assert.equal(a.id,'count'); assert.equal(a.index,2);
  assert.equal(a.select('bad'),'count'); assert.equal(a.select('group'),'group');
  assert.equal(b.id,'source'); assert.equal(a.reset(),'source');
  assert.throws(()=>createStepState(['a','a'])); assert.throws(()=>createStepState([]));
});
test('an aborted old load cannot cancel a newer load deadline', async () => {
  const old = new AbortController(), newer = new AbortController();
  let completeOld;
  const oldRequest = waitForScene(new Promise(resolve => { completeOld = resolve; }), { signal: old.signal, timeoutMs: 100 });
  const rejected = assert.rejects(oldRequest, { name: 'AbortError' });
  old.abort(); await rejected;
  const newRequest = waitForScene(new Promise(() => {}), { signal: newer.signal, timeoutMs: 10, message: 'new request timed out' });
  completeOld({ stale: true });
  await assert.rejects(newRequest, /new request timed out/);
});
test('successful scene loads return their result and clear their own deadline', async () => {
  const aborter = new AbortController();
  const result = await waitForScene(Promise.resolve({ ready: true }), { signal: aborter.signal, timeoutMs: 50 });
  assert.deepEqual(result, { ready: true }); aborter.abort();
});
