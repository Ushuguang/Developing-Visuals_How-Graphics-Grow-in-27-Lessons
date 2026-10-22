import { createSpiralGeometry } from './models-05.js';

export const DEMO_PARAMETERS = Object.freeze({ boxSize: 22, coilGap: 22 * 1.4, startRadius: 60, ringT: 1.4 });
export const LECTURE_PARAMETERS = Object.freeze({ boxSize: 32, coilGap: 38.4, startRadius: 100 });

// A controlled formula comparison: both modes receive the actual selected
// segment's t0/t1. Lecture mode does not claim to rerun the 365-day lecture loop.
export function inspectSpiralSegment(segment, mode = 'demo') {
  const demo = createSpiralGeometry(DEMO_PARAMETERS);
  const b = mode === 'demo' ? demo.b : LECTURE_PARAMETERS.coilGap / (2 * Math.PI);
  const pos = mode === 'demo' ? demo.pos : t => ({ r: b * t, x: b * t * Math.cos(t), y: b * t * Math.sin(t) });
  const p = pos(segment.t0), q = pos(segment.t1);
  const vertices = mode === 'demo' ? demo.vertices(segment.t0, segment.t1) : [
    [p.r + LECTURE_PARAMETERS.coilGap / 2, segment.t0],
    [q.r + LECTURE_PARAMETERS.coilGap / 2, segment.t1],
    [q.r - LECTURE_PARAMETERS.coilGap / 2, segment.t1],
    [p.r - LECTURE_PARAMETERS.coilGap / 2, segment.t0]
  ].map(([r,t]) => ({ x: r * Math.cos(t), y: r * Math.sin(t) }));
  const [a,c,d,e] = vertices;
  const commands = mode === 'demo' ? [
    `M ${a.x} ${a.y}`, `A ${p.r + demo.ringT} ${p.r + demo.ringT} 0 0 1 ${c.x} ${c.y}`,
    `L ${d.x} ${d.y}`, `A ${q.r} ${q.r} 0 0 0 ${e.x} ${e.y}`, 'Z'
  ] : [`M ${a.x} ${a.y}`, `L ${c.x} ${c.y}`, `L ${d.x} ${d.y}`, `L ${e.x} ${e.y}`, 'Z'];
  return { mode, b, p, q, vertices, commands, path: commands.join(' '), delta: segment.t1 - segment.t0 };
}

export function constructionState(sample, stage) {
  const index = Math.max(0, Math.min(4, Math.floor(stage)));
  return { stage: index, commands: sample.commands.slice(0, index + 1), path: sample.commands.slice(0, index + 1).join(' '), closed: index === 4, cursor: sample.vertices[index === 4 ? 0 : index] };
}

export function actualSampling(segments, index) {
  const geometry = createSpiralGeometry(DEMO_PARAMETERS);
  return [...new Set([0, Math.max(0, Math.min(segments.length - 1, index)), segments.length - 1])].map(i => {
    const segment = segments[i], r = geometry.pos(segment.t0).r, delta = segment.t1 - segment.t0;
    return { index: i, r, delta, formulaDelta: geometry.angleDelta(r), estimatedLength: Math.sqrt(geometry.b ** 2 + r ** 2) * delta };
  });
}

// Explicit teaching data: a repeated seven-day activity pattern, never weather.
export function weeklyIllustration() {
  const geometry = createSpiralGeometry(DEMO_PARAMETERS), values = [2,3,6,5,4,8,1];
  let t = geometry.startTheta;
  return Array.from({ length: 14 }, (_, index) => {
    const theta = t; t += geometry.angleDelta(geometry.pos(t).r);
    const phaseTheta = geometry.startTheta + index * 2 * Math.PI / 7;
    return { id: index, day: index % 7, value: values[index % 7], equal: { ...geometry.pos(theta), theta }, weekly: { ...geometry.pos(phaseTheta), theta: phaseTheta } };
  });
}

export function boundsFor(points, margin = 0) {
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  return { x: Math.min(...xs) - margin, y: Math.min(...ys) - margin, width: Math.max(...xs) - Math.min(...xs) + 2 * margin, height: Math.max(...ys) - Math.min(...ys) + 2 * margin };
}

// Owned listeners and the borrowed SVG are returned exactly once. No hover
// tooltip from the old demo can escape into document.body while it is borrowed.
export function leaseSpiralListeners(segments, select, original, placeholder, overlay, onPick) {
  const snapshots=[];
  segments.each(function(){const node=select(this);snapshots.push([this,node.on('mouseover'),node.on('mouseout'),node.on('click.teachingSpiral')]);});
  segments.on('mouseover',null).on('mouseout',null).on('click.teachingSpiral',onPick);
  let released=false;
  return ()=>{
    if(released)return;released=true;overlay.remove();
    snapshots.forEach(([node,over,out,pick])=>select(node).on('mouseover',over).on('mouseout',out).on('click.teachingSpiral',pick));
    placeholder.replaceWith(original);
  };
}
