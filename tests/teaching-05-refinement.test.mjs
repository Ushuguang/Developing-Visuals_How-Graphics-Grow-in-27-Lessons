import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPUS_DAY, clockLabel, dailyPhase, minuteSubdivision } from '../teaching-viz/chapter-05-attributes.js';
import { CHAPTER05_GUIDES } from '../teaching-viz/chapter-05-guides.js';
import { chapter05 } from '../teaching-viz/chapter-05.js';

test('campus example retains event identities while time ordering and clock values agree',()=>{
  assert.equal(new Set(CAMPUS_DAY.map(d=>d.id)).size,4);
  const input=[CAMPUS_DAY[3],CAMPUS_DAY[0],CAMPUS_DAY[1],CAMPUS_DAY[2]];
  const sorted=[...input].sort((a,b)=>a.minute-b.minute);
  assert.deepEqual(sorted.map(d=>clockLabel(d.minute)),['08:00','09:00','12:00','18:00']);
  assert.deepEqual(input.map(d=>d.id),['run','breakfast','lecture','lunch']);
  assert.ok(sorted.every(d=>input.includes(d)));
});

test('equal daily phase differs from absolute time; minute subdivisions stay inside the interval',()=>{
  assert.equal(dailyPhase(9),dailyPhase(33));assert.equal(dailyPhase(-15),9);
  assert.equal(minuteSubdivision(0),30);assert.equal(minuteSubdivision(4),1.875);
  assert.ok(Array.from({length:5},(_,i)=>minuteSubdivision(i)).every(v=>v>0&&v<60));
});

test('every teaching inquiry opens an existing step and motion opt-in is scoped to chapter five',()=>{
  const definitions=chapter05({});assert.equal(CHAPTER05_GUIDES.length,5);
  for(const guide of CHAPTER05_GUIDES){
    const definition=definitions.find(d=>d.sectionId===guide.section);assert.ok(definition);
    for(const [target] of guide.tasks)assert.ok(definition.steps.some(s=>s.id===target),`${guide.section} ${target}`);
    assert.equal(definition.motionByDefault,true);assert.equal(definition.stepFeedback,true);
  }
});
