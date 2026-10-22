import { STORY_DATA } from './models-05.js';

// Explicitly constructed teaching example, not student tracking or location data.
export const CAMPUS_STORY = {
  title: '校园小组协作 · 构造教学微案例', duration_min: 30,
  characters: [
    { name: '小林 / Lin', color: '#1976d2', width: 4, points: [{ time: 0, y: 70 }, { time: 5, y: 100 }, { time: 10, y: 160 }, { time: 15, y: 210 }, { time: 20, y: 130 }, { time: 30, y: 90 }] },
    { name: '小周 / Zhou', color: '#d32f2f', width: 4, points: [{ time: 0, y: 330 }, { time: 5, y: 300 }, { time: 10, y: 250 }, { time: 15, y: 215 }, { time: 20, y: 280 }, { time: 30, y: 320 }] },
    { name: '小陈 / Chen', color: '#388e3c', width: 4, points: [{ time: 0, y: 220 }, { time: 5, y: 200 }, { time: 10, y: 205 }, { time: 15, y: 205 }, { time: 20, y: 210 }, { time: 30, y: 210 }] }
  ],
  events: [
    { time: 15, y: 210, name: '会合 / Meet', desc: '三人交流进展：手工让线靠近，表示同一协作情境。', descEn: 'Three members discuss progress; nearby lines encode a shared collaboration context.', related: [0, 1, 2] },
    { time: 20, y: 210, name: '再分工 / Split tasks', desc: '小林与小周继续不同任务；分开是叙事布局，不是测量距离。', descEn: 'Lin and Zhou resume separate tasks; separation is narrative layout, not measured distance.', related: [0, 1, 2] }
  ]
};

export const storyCase = id => id === 'campus' ? CAMPUS_STORY : STORY_DATA;
export function storyScaleSpec(data) {
  return { xDomain: [0, data.duration_min], xRange: [110, 770], yDomain: [0, 400], yRange: [420, 30] };
}
export function projectStoryPoint(data, point) {
  const spec = storyScaleSpec(data);
  return { x: spec.xRange[0] + point.time / data.duration_min * 660, y: spec.yRange[0] - point.y / 400 * 390 };
}
export function storyEventFrame(data, index) {
  const event = data.events[index];
  if (!event) throw new RangeError('Unknown story event');
  const related = event.related ?? (index === 0 ? [0, 1] : [4]);
  return {
    event, position: projectStoryPoint(data, event),
    roles: data.characters.map((character, i) => ({
      character, related: related.includes(i),
      // Missing samples remain missing; do not invent a movie position.
      point: character.points.find(point => point.time === event.time) ?? null
    }))
  };
}
export function storyStage(stage) {
  const modes = { time: 'tracks', points: 'role', datum: 'role', curve: 'role', events: 'events' };
  if (!modes[stage]) throw new RangeError('Unknown Storyline stage');
  return { mode: modes[stage], points: ['points', 'datum', 'curve'].includes(stage), binding: stage === 'datum', skeleton: stage === 'curve' };
}
