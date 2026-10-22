import test from 'node:test';
import assert from 'node:assert/strict';
import { quizValues, paletteParameters, transformRGB, paperMarks } from '../teaching-viz/chapter-03-extra.js';
import { simulateCVD, rgbToHsl } from '../teaching-viz/models-03.js';

test('four quiz cases use the original eight values without changing geometry',()=>{
  const expected=Array.from({length:8},(_,i)=>2+(i*1.3+0.5)%5+Math.sin(i)*1.2);
  assert.deepEqual(quizValues(),expected);
  for(let i=0;i<4;i++)assert.deepEqual(quizValues(),expected);
});

test('seven palette parameters preserve the original defaults and derived quantities',()=>{
  const values=paletteParameters(220,70,55);assert.equal(values.length,7);
  assert.deepEqual(values.map(p=>p.h),[190,190,220,250,250,40,220]);
  assert.deepEqual(values.map(p=>p.s),[42,70,70,70,42,56,14]);
  const expectedL=[60.5,55,55,55,60.5,52.25,77];
  values.forEach((p,i)=>{assert.ok(Math.abs(p.l-expectedL[i])<1e-10);assert.equal(p.clipped,false);});
  const limit=paletteParameters(360,100,80);assert.equal(limit[6].l,112);assert.equal(limit[6].displayL,100);assert.equal(limit[6].clipped,true);
  assert.equal(paletteParameters(0,20,30)[0].h,330);
});

test('normal/gray/three CVD modes change colors only and reuse the original matrix',()=>{
  const input=[220,38,38];assert.deepEqual(transformRGB(input,'normal'),input);
  assert.notEqual(transformRGB(input,'normal'),input,'normal returns an independent array');
  for(const mode of ['protanopia','deuteranopia','tritanopia']){
    const output=transformRGB(input,mode);assert.deepEqual(output,simulateCVD(input,mode));assert.ok(output.every(v=>Number.isInteger(v)&&v>=0&&v<=255));
  }
  const gray=transformRGB(input,'gray');assert.equal(gray[0],gray[1]);assert.equal(gray[1],gray[2]);
  assert.deepEqual(rgbToHsl(255,0,0),[0,100,50]);
});

test('all three original illustration geometries keep stable IDs and counts',()=>{
  for(const [kind,count]of [['scatter',40],['heat',70],['bars',5]]){
    const before=paperMarks(kind),after=paperMarks(kind);assert.equal(before.length,count);assert.equal(new Set(before.map(p=>p.id)).size,count);assert.deepEqual(before,after);
    assert.ok(before.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
  }
  assert.equal(paperMarks('heat')[69].value,69/70);
  assert.deepEqual(paperMarks('scatter')[0],{id:0,cat:0,x:20,y:15});
});
