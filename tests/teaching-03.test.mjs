import test from 'node:test';
import assert from 'node:assert/strict';
import { rgbToHsl,simulateCVD,CLASSIC_PALETTES } from '../teaching-viz/models-03.js';
test('original RGB-HSL conversion handles primaries and achromatic colors',()=>{
  assert.deepEqual(rgbToHsl(255,0,0),[0,100,50]);
  assert.deepEqual(rgbToHsl(0,255,0),[120,100,50]);
  assert.deepEqual(rgbToHsl(0,0,255),[240,100,50]);
  assert.deepEqual(rgbToHsl(0,0,0),[0,0,0]);
  assert.deepEqual(rgbToHsl(255,255,255),[0,0,100]);
});
test('original CVD matrices keep RGB finite, bounded, and preserve neutral endpoints',()=>{
 for(const type of ['protanopia','deuteranopia','tritanopia']){
  assert.deepEqual(simulateCVD([0,0,0],type),[0,0,0]);
  assert.deepEqual(simulateCVD([255,255,255],type),[255,255,255]);
  assert.ok(simulateCVD([100,50,200],type).every(v=>Number.isFinite(v)&&v>=0&&v<=255));
 }
 assert.equal(CLASSIC_PALETTES['Wong 2011'].length,8);
 assert.ok(Object.values(CLASSIC_PALETTES).flat().every(color=>/^#[0-9a-f]{6}$/i.test(color)));
});
