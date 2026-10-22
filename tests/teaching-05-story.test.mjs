import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STORY_DATA } from '../teaching-viz/models-05.js';
import { CAMPUS_STORY, storyCase, storyScaleSpec, projectStoryPoint, storyEventFrame, storyStage } from '../teaching-viz/models-05-story.js';
import { storyDefinition } from '../teaching-viz/chapter-05-story.js';

test('original case remains the same five roles, 27 samples and two event objects', () => {
  assert.equal(storyCase('original'), STORY_DATA);
  assert.equal(storyCase('anything-else'), STORY_DATA);
  assert.deepEqual(STORY_DATA.characters.map(character => character.points.length), [8, 5, 5, 6, 3]);
  assert.equal(STORY_DATA.characters.reduce((sum, character) => sum + character.points.length, 0), 27);
  assert.deepEqual(STORY_DATA.events.map(event => [event.time, event.y]), [[78, 105], [48, 335]]);
});

test('time projection shares the original demo domain/range and event x at 78', () => {
  assert.deepEqual(storyScaleSpec(STORY_DATA), { xDomain: [0, 127], xRange: [110, 770], yDomain: [0, 400], yRange: [420, 30] });
  assert.deepEqual(projectStoryPoint(STORY_DATA, { time: 0, y: 0 }), { x: 110, y: 420 });
  assert.deepEqual(projectStoryPoint(STORY_DATA, { time: 127, y: 400 }), { x: 770, y: 30 });
  const frame = storyEventFrame(STORY_DATA, 0);
  const grant = frame.roles[0].point, rex = frame.roles[1].point;
  assert.equal(grant.y, 80); assert.equal(rex.y, 130);
  assert.equal(projectStoryPoint(STORY_DATA, grant).x, frame.position.x);
  assert.equal(projectStoryPoint(STORY_DATA, rex).x, frame.position.x);
  assert.ok(Math.abs(frame.position.x - 515.3543307086615) < 1e-9);
});

test('event frame preserves absent samples and does not invent Nedry as a sixth role', () => {
  const snapshot = JSON.stringify(STORY_DATA);
  const first = storyEventFrame(STORY_DATA, 0), second = storyEventFrame(STORY_DATA, 1);
  assert.deepEqual(first.roles.filter(role => role.related).map(role => role.character.name), ['Alan Grant & Kids', 'T-REX']);
  assert.equal(first.roles.filter(role => role.point).length, 2);
  assert.equal(second.roles.filter(role => role.point).length, 1);
  assert.equal(second.roles[4].point.y, 320);
  assert.equal(second.event.y, 335);
  assert.ok(!second.roles.some(role => role.character.name.includes('Nedry')));
  assert.equal(JSON.stringify(STORY_DATA), snapshot);
  assert.throws(() => storyEventFrame(STORY_DATA, 99), RangeError);
});

test('constructed campus case makes gathering and separation explicit without mutating source', () => {
  assert.equal(storyCase('campus'), CAMPUS_STORY);
  assert.equal(CAMPUS_STORY.characters.length, 3);
  for (const character of CAMPUS_STORY.characters) assert.deepEqual(character.points.map(point => point.time), [0, 5, 10, 15, 20, 30]);
  const at = time => CAMPUS_STORY.characters.map(character => character.points.find(point => point.time === time).y);
  const spread = values => Math.max(...values) - Math.min(...values);
  assert.equal(spread(at(15)), 10);
  assert.ok(spread(at(0)) > spread(at(15)) && spread(at(20)) > spread(at(15)));
  for (let index = 0; index < 2; index++) {
    const frame = storyEventFrame(CAMPUS_STORY, index);
    assert.ok(frame.roles.every(role => role.point && role.related));
    frame.roles.forEach(role => assert.equal(projectStoryPoint(CAMPUS_STORY, role.point).x, frame.position.x));
  }
});

test('five focus steps select different actual drawing modes and binding/skeleton overlays', () => {
  const modes = ['time', 'points', 'datum', 'curve', 'events'].map(storyStage);
  assert.deepEqual(modes.map(mode => mode.mode), ['tracks', 'role', 'role', 'role', 'events']);
  assert.ok(modes[2].binding && !modes[1].binding);
  assert.ok(modes[3].skeleton && !modes[2].skeleton);
  assert.equal(new Set(modes.map(mode => JSON.stringify(mode))).size, 5);
  assert.throws(() => storyStage('not-a-stage'), RangeError);
});

test('five steps bind to existing original code rather than invented lines', () => {
  const definition = storyDefinition({}), html = readFileSync(new URL('../lesson-05/index.html', import.meta.url), 'utf8');
  assert.deepEqual(definition.steps.map(step => step.id), ['time', 'points', 'datum', 'curve', 'events']);
  const article = html.slice(html.indexOf('id="ch-5-5"'), html.indexOf('</article>', html.indexOf('id="ch-5-5"')));
  const blocks = [...article.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/g)].map(match => match[1].replace(/<[^>]+>/g, '').split(/\r?\n/));
  for (const step of definition.steps) for (const target of step.codeTargets) {
    assert.ok(blocks[target.block]); assert.ok(target.from > 0 && target.to <= blocks[target.block].length);
  }
  assert.match(blocks[0][25], /datum\(c.points\)/);
});
