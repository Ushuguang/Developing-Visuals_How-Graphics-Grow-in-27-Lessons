import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpiralGeometry } from '../teaching-viz/models-05.js';
import { inspectSpiralSegment, constructionState, actualSampling, weeklyIllustration, boundsFor, leaseSpiralListeners } from '../teaching-viz/chapter-05-spiral-model.js';
import { spiralDefinition } from '../teaching-viz/chapter-05-spiral.js';

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} differs from ${b}`);
function originalSegments(){
  const g=createSpiralGeometry(),out=[];let theta=g.startTheta;
  for(let i=0;i<366;i++){const t0=theta;theta+=g.angleDelta(g.pos(theta).r);out.push({t0,t1:theta});}
  return out;
}

test('first/middle/last microscopes retain the exact original running geometry and path',()=>{
  const g=createSpiralGeometry(),segments=originalSegments();
  for(const index of [0,183,365]){
    const segment=segments[index],sample=inspectSpiralSegment(segment,'demo');
    assert.deepEqual(sample.p,g.pos(segment.t0));assert.deepEqual(sample.q,g.pos(segment.t1));
    assert.deepEqual(sample.vertices,g.vertices(segment.t0,segment.t1));
    assert.equal(sample.path,g.arcPath(segment.t0,segment.t1));
    assert.deepEqual(sample.commands.map(c=>c[0]),['M','A','L','A','Z']);
  }
});

test('lecture comparison executes the printed coords formula with visibly separate inputs',()=>{
  const segment=originalSegments()[183],sample=inspectSpiralSegment(segment,'lecture');
  const b=38.4/(2*Math.PI),coords=(t,sign)=>({x:(b*t+sign*38.4/2)*Math.cos(t),y:(b*t+sign*38.4/2)*Math.sin(t)});
  assert.deepEqual(sample.vertices,[coords(segment.t0,1),coords(segment.t1,1),coords(segment.t1,-1),coords(segment.t0,-1)]);
  assert.deepEqual(sample.commands.map(c=>c[0]),['M','L','L','L','Z']);
  assert.notDeepEqual(sample.vertices,inspectSpiralSegment(segment,'demo').vertices);
  near(sample.delta,segment.t1-segment.t0);
});

test('path stages execute only their own command prefix and close only at Z',()=>{
  for(const mode of ['demo','lecture']){
    const sample=inspectSpiralSegment(originalSegments()[10],mode),states=[];
    for(let stage=0;stage<5;stage++){
      const s=constructionState(sample,stage);states.push(s.path);assert.equal(s.commands.length,stage+1);
      assert.equal(s.closed,stage===4);assert.equal(s.path.endsWith('Z'),stage===4);
      assert.deepEqual(s.cursor,sample.vertices[stage===4?0:stage]);
    }
    assert.equal(new Set(states).size,5);assert.equal(states[4],sample.path);
    assert.equal(constructionState(sample,-1).stage,0);assert.equal(constructionState(sample,99).stage,4);
  }
});

test('actual angular-increment comparison preserves bound values and approximately equal arc lengths',()=>{
  const rows=actualSampling(originalSegments(),183);assert.deepEqual(rows.map(r=>r.index),[0,183,365]);
  for(const row of rows){near(row.delta,row.formulaDelta);near(row.estimatedLength,22);}
  assert.ok(rows[0].r<rows[2].r);assert.ok(rows[0].delta>rows[2].delta);
  assert.equal(actualSampling(originalSegments(),0).length,2,'duplicate first/selected rows are not invented');
});

test('the explicit fourteen-day teaching case keeps values fixed while changing only time layout',()=>{
  const rows=weeklyIllustration();assert.equal(rows.length,14);assert.equal(new Set(rows.map(r=>r.id)).size,14);
  for(let i=0;i<7;i++){
    const a=rows[i],b=rows[i+7];assert.equal(a.value,b.value);assert.equal(a.day,b.day);
    near(b.weekly.theta-a.weekly.theta,2*Math.PI);
    assert.ok(Math.abs((b.equal.theta-a.equal.theta)%(2*Math.PI))>0.1,'equal-arc sampling is not mislabeled as weekly alignment');
  }
  assert.deepEqual(rows.slice(0,7).map(r=>r.value),[2,3,6,5,4,8,1]);
  const bounds=boundsFor(rows.map(r=>r.weekly),4);assert.ok(bounds.width>0&&bounds.height>0);
});

test('borrowing and restoring the original SVG twenty times does not multiply handlers or restore twice',()=>{
  const over=()=>{},out=()=>{},priorPick=()=>{},node={listeners:new Map([['mouseover',over],['mouseout',out],['click.teachingSpiral',priorPick]])};
  const select=target=>({on(key,value){if(arguments.length===1)return target.listeners.get(key);if(value==null)target.listeners.delete(key);else target.listeners.set(key,value);return this;}});
  const selection={each(fn){fn.call(node);return this;},on(key,value){select(node).on(key,value);return this;}};
  let restored=0,removed=0;const original={},placeholder={replaceWith(n){assert.equal(n,original);restored++;}},overlay={remove(){removed++;}};
  for(let i=0;i<20;i++){
    const release=leaseSpiralListeners(selection,select,original,placeholder,overlay,()=>{});
    assert.equal(node.listeners.has('mouseover'),false);assert.equal(node.listeners.has('mouseout'),false);
    release();release();assert.equal(node.listeners.size,3);assert.equal(node.listeners.get('mouseover'),over);assert.equal(node.listeners.get('mouseout'),out);assert.equal(node.listeners.get('click.teachingSpiral'),priorPick);
  }
  assert.equal(restored,20);assert.equal(removed,20);
});

test('five focus states retain separate original code scopes and explicit path/vertex distinctions',()=>{
  const definition=spiralDefinition({});assert.deepEqual(definition.steps.map(s=>s.id),['radius','projection','delta','vertices','path']);
  assert.deepEqual(definition.steps[1].codeTargets,[{block:0,from:11,to:12}]);
  assert.deepEqual(definition.steps[4].codeTargets,[{block:2,from:11,to:11}]);
  assert.equal(new Set(definition.steps.map(s=>s.explain[0])).size,5);
});
