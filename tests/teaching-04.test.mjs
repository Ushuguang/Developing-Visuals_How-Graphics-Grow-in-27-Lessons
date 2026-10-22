import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CRIME_METRICS, toLong, coordinateTrace, encodeCase, valuesForCase, inspectCell, ORIGINAL_EDGE_TABLE, syntheticField, lineAtAngle, CURVES } from '../teaching-viz/models-04.js';

const csv=fs.readFileSync(new URL('../lesson-04/data/crime.csv',import.meta.url),'utf8').trim().split(/\r?\n/);
const keys=csv.shift().split(',');
const rows=csv.map(line=>Object.fromEntries(line.split(',').map((value,i)=>[keys[i],i===0?value:+value])));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);

test('Crime wide-to-long preserves every source cell and state identity',()=>{
  assert.equal(rows.length,50);const long=toLong(rows);assert.equal(long.length,150);
  rows.forEach((row,i)=>CRIME_METRICS.forEach((metric,j)=>assert.deepEqual(long[i*3+j],{state:row.state,metric,value:row[metric]})));
  assert.equal(toLong([{state:'X',murder:0,robbery:NaN,burglary:null}])[0].value,0);
  assert.ok(Number.isNaN(toLong([{state:'X',murder:0,robbery:NaN,burglary:null}])[1].value));
  assert.equal(toLong([{state:'X',murder:0,robbery:NaN,burglary:null}])[2].value,null);
});

test('three actual states at two widths have consistent data/internal/SVG coordinates',()=>{
  const maxX=Math.max(...rows.map(r=>r.murder)),maxY=Math.max(...rows.map(r=>r.robbery));
  for(const width of [540,720])for(const row of [rows[0],rows[24],rows.at(-1)])for(const mode of ['linear','log','sqrt']){
    const result=coordinateTrace(row,maxX,maxY,width,360,mode);assert.ok(result);
    near(result.screen.x-result.internal.x,50);near(result.screen.y-result.internal.y,30);
    near(result.internal.y,290*(1-row.robbery/maxY));assert.ok(Number.isFinite(result.screen.x));
    const expected=(mode==='log'?Math.log(row.murder)/Math.log(maxX):mode==='sqrt'?Math.sqrt(row.murder/maxX):row.murder/maxX)*(width-70)+50;
    near(result.screen.x,expected);
  }
  for(const width of [540,720]){near(coordinateTrace({murder:0,robbery:0},maxX,maxY,width).screen.x,50);near(coordinateTrace({murder:maxX,robbery:maxY},maxX,maxY,width).screen.x,width-20);}
  assert.equal(coordinateTrace({murder:0,robbery:1},maxX,maxY,720,360,'log'),null);
  assert.equal(coordinateTrace({murder:-1,robbery:1},maxX,maxY,720,360,'log'),null);
  assert.equal(coordinateTrace({murder:NaN,robbery:1},maxX,maxY),null);
});

test('all sixteen cases use actual crossing edges; 0/15 draw nothing; 5/10 are explicit saddles',()=>{
  for(let code=0;code<16;code++){
    const values=valuesForCase(code);assert.equal(encodeCase(values,0.5),code);
    const c=inspectCell(values,0.5);assert.equal(c.saddle,code===5||code===10);
    if(code===0||code===15){assert.equal(c.geometry.length,0);assert.equal(c.points.filter(Boolean).length,0);}
    c.geometry.forEach(pair=>pair.forEach(edge=>{const p=c.points[edge];assert.ok(p);assert.ok(p.x===0||p.x===1||p.y===0||p.y===1);assert.ok(p.fraction>=0&&p.fraction<=1);}));
  }
  assert.deepEqual(ORIGINAL_EDGE_TABLE[1],[[3,0]],'Original classroom lookup is preserved, not silently replaced');
  assert.equal(inspectCell(valuesForCase(1),0.5).mismatch,true,'Known bit/edge mismatch is explicitly detected');
});

test('intersections respect unequal values and equality-at-corner boundary without NaN',()=>{
  const c=inspectCell([0.1,0.9,0.6,0.2],0.5);
  near(c.points[3].x,0.5);near(c.points[1].x,0.75);
  const equal=inspectCell([0.5,1,0,0],0.5);assert.equal(equal.code,4);assert.equal(equal.points[3].x,0);
  assert.equal(encodeCase([NaN,0,1,0],0.5),null);
  for(let y=0;y<7;y++)for(let x=0;x<7;x++)for(const threshold of [0.05,0.5,0.95]){
    const c=inspectCell([syntheticField(x,y),syntheticField(x+1,y),syntheticField(x+1,y+1),syntheticField(x,y+1)],threshold);
    c.geometry.flat().forEach(edge=>{const p=c.points[edge];assert.ok(p);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));});
  }
});

test('all ten original curve options remain and angle geometry covers UI and pure limits',()=>{
  assert.equal(CURVES.length,10);assert.equal(new Set(CURVES.map(c=>c[0])).size,10);
  for(const angle of [0,5,45,85,90]){
    const p=lineAtAngle(angle);near(Math.hypot(p.x2-p.x1,p.y2-p.y1),240);assert.ok(p.x2>=100-1e-10&&p.y2<=240+1e-10);
  }
  near(lineAtAngle(0).x2,340);near(lineAtAngle(90).y2,0);
});
