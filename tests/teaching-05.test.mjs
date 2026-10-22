import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { localKey,weatherKey,localDays,calendarCell,createSpiralGeometry,yearWindow,loadWeather,STORY_DATA } from '../teaching-viz/models-05.js';
import { chapter05 } from '../teaching-viz/chapter-05.js';

test('local leap-year interval includes Dec 31 and excludes next Jan 1',()=>{
  const days=localDays(2024);
  assert.equal(days.length,366);assert.equal(localKey(days[0]),'2024-01-01');assert.equal(localKey(days.at(-1)),'2024-12-31');
  assert.equal(localKey(days[59]),'2024-02-29');assert.equal(localDays(2023).length,365);
  assert.equal(new Set(days.map(localKey)).size,366);
});

test('Sunday and Monday calendar boundaries and pixels are correct',()=>{
  const dates=[new Date(2024,0,1),new Date(2024,0,7),new Date(2024,0,8),new Date(2024,1,29),new Date(2024,11,31)];
  assert.deepEqual(dates.map(d=>{const c=calendarCell(d,0);return[c.row,c.column];}),[[1,0],[0,1],[1,1],[4,8],[2,52]]);
  assert.deepEqual(dates.map(d=>{const c=calendarCell(d,1);return[c.row,c.column];}),[[0,0],[6,0],[0,1],[3,8],[1,52]]);
  for(const start of [0,1]){
    const cells=localDays().map(d=>calendarCell(d,start,24));
    assert.equal(new Set(cells.map(c=>`${c.column}:${c.row}`)).size,366);
    for(const c of cells){assert.equal(c.x,c.column*24);assert.equal(c.y,c.row*24);assert.ok(c.row>=0&&c.row<7);}
  }
});

test('calendar uses civil days rather than elapsed milliseconds across DST',()=>{
  const url=new URL('../teaching-viz/models-05.js',import.meta.url).href;
  const program=`import {localDays,calendarCell} from ${JSON.stringify(url)}; const days=localDays(2024); console.log(JSON.stringify([days.length,calendarCell(days[70]).day,new Set(days.map(d=>{const c=calendarCell(d);return c.row+':'+c.column;})).size]));`;
  const run=spawnSync(process.execPath,['--input-type=module','-e',program],{encoding:'utf8',env:{...process.env,TZ:'America/New_York'}});
  assert.equal(run.status,0,run.stderr);assert.deepEqual(JSON.parse(run.stdout),[366,71,366]);
});

test('spiral positions, increments and four vertices retain actual demo geometry',()=>{
  const g=createSpiralGeometry();
  assert.equal(g.boxSize,22);assert.ok(Math.abs(g.pos(Math.PI).r-15.4)<1e-12);
  assert.ok(Math.abs(g.pos(Math.PI).x+15.4)<1e-12);assert.ok(Math.abs(g.pos(Math.PI).y)<1e-12);
  assert.ok(g.angleDelta(60)>g.angleDelta(240));
  let theta=g.startTheta;const segments=[];
  for(let i=0;i<366;i++){const t0=theta;theta+=g.angleDelta(g.pos(theta).r);segments.push([t0,theta]);}
  for(const index of [0,183,365]){
    const [t0,t1]=segments[index],points=g.vertices(t0,t1),p=g.pos(t0);
    assert.equal(points.length,4);assert.ok(t1>t0);
    assert.ok(Math.abs(Math.hypot(p.x,p.y)-p.r)<1e-10);
    assert.ok(Math.abs(Math.hypot(points[0].x,points[0].y)-Math.hypot(points[3].x,points[3].y)-1.4)<1e-10);
    assert.ok(Math.abs((t1-t0)*Math.sqrt(g.b*g.b+p.r*p.r)-22)<1e-10);
    const path=g.arcPath(t0,t1);assert.ok(path.startsWith('M '));assert.ok(path.endsWith(' Z'));assert.equal((path.match(/ A /g)||[]).length,2);assert.ok(!/NaN|Infinity/.test(path));
  }
  const altered=createSpiralGeometry({boxSize:30,coilGap:42,ringT:2});
  assert.ok(altered.pos(20).r!==g.pos(20).r);
  assert.ok(Math.abs(Math.hypot(...Object.values(altered.vertices(20,21)[0]))-altered.pos(20).r-2)<1e-10);
});

test('weather normalization preserves zero and missing values and shares one request',async()=>{
  let calls=0;const d3={csv:async(path,convert)=>{calls++;assert.equal(path,'./data/weather_2024.csv');return[{date:'2024-01-01',temp_max:'0'},{date:'2024-01-02',temp_max:''},{date:'2024-01-03',temp_max:'-5'}].map(convert);}};
  const [a,b]=await Promise.all([loadWeather(d3),loadWeather(d3)]);
  assert.equal(calls,1);assert.equal(a,b);assert.deepEqual(a.map(d=>d.temp_max),[0,null,-5]);
  assert.equal(weatherKey(new Date('2024-01-01T00:00:00Z')),'2024-01-01');
});

test('original weather and names files have stable date/value coverage',async()=>{
  const weather=await readFile(new URL('../lesson-05/data/weather_2024.csv',import.meta.url),'utf8');
  const rows=weather.trim().split(/\r?\n/).slice(1).map(line=>line.split(','));
  assert.equal(rows.length,366);assert.equal(new Set(rows.map(d=>d[0])).size,366);assert.ok(rows.every(d=>d[1]!==''&&Number.isFinite(+d[1])));
  const data=JSON.parse(await readFile(new URL('../lesson-05/data/french_names.json',import.meta.url),'utf8'));
  assert.deepEqual(Object.keys(data.names),['Marie','Jean','Camille']);
  for(const records of Object.values(data.names)){
    assert.equal(records.length,121);const window=yearWindow(records,1950,2000);assert.equal(window.length,51);
    assert.equal(window[0].year,1950);assert.equal(window.at(-1).year,2000);
    assert.equal(window[15],records.find(d=>d.year===1965));
  }
  assert.deepEqual(Object.values(data.names).map(records=>records.find(d=>d.year===1965).count),[4711,4394,399]);
});

test('original five Storyline roles, controls and event times stay unchanged',()=>{
  assert.deepEqual(STORY_DATA.characters.map(d=>d.name),['Alan Grant & Kids','T-REX','Raptors','Malcolm','Dilophosaurus']);
  assert.deepEqual(STORY_DATA.characters.map(d=>d.points.length),[8,5,5,6,3]);
  assert.deepEqual(STORY_DATA.events.map(d=>[d.time,d.x,d.y]),[[78,78,105],[48,48,335]]);
  for(const c of STORY_DATA.characters)for(const p of c.points){assert.ok(p.time>=0&&p.time<=127);assert.ok(Number.isFinite(p.y));}
});

test('five section definitions retain valid original code line targets',async()=>{
  const html=await readFile(new URL('../lesson-05/index.html',import.meta.url),'utf8'),definitions=chapter05({});
  assert.deepEqual(definitions.map(d=>d.sectionId),['5.1','5.2','5.3','5.4','5.5']);
  for(const definition of definitions){
    const start=html.indexOf(`id="ch-${definition.sectionId.replace('.','-')}"`),article=html.slice(start,html.indexOf('</article>',start));
    const codeStart=article.search(/<div[^>]+data-panel="code"/),demoStart=article.search(/<div[^>]+data-panel="demo"/);
    const blocks=[...article.slice(codeStart,demoStart).matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/g)].map(match=>match[1].replace(/<\/?[A-Za-z][^>]*>/g,'').replace(/\r\n/g,'\n').split('\n'));
    assert.ok(definition.steps.length>=3&&definition.steps.length<=6);
    for(const step of definition.steps)for(const target of step.codeTargets){
      assert.ok(blocks[target.block],`${definition.sectionId}/${step.id} block`);
      assert.ok(target.from>=1&&target.to>=target.from&&target.to<=blocks[target.block].length,`${definition.sectionId}/${step.id} lines`);
      assert.ok(blocks[target.block].slice(target.from-1,target.to).join('').trim());
    }
  }
});
