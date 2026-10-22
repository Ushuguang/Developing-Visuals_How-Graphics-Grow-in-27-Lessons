import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chapter01 } from '../teaching-viz/chapter-01.js';
import { chapter02 } from '../teaching-viz/chapter-02.js';
import { chapter03 } from '../teaching-viz/chapter-03.js';
import { chapter04 } from '../teaching-viz/chapter-04.js';
import { chapter05 } from '../teaching-viz/chapter-05.js';

test('all 27 sections have four tabs including direct mapping and bounded code focuses',()=>{
 const factories=[chapter01,chapter02,chapter03,chapter04,chapter05],counts=[5,4,8,5,5];
 const definitions=factories.flatMap(factory=>factory({}));assert.equal(definitions.length,27);
 assert.equal(new Set(definitions.map(d=>d.sectionId)).size,27);
 factories.forEach((factory,index)=>{
  const html=readFileSync(new URL(`../lesson-0${index+1}/index.html`,import.meta.url),'utf8');
  assert.equal(factory({}).length,counts[index]);
  for(const definition of factory({})){
   const id='ch-'+definition.sectionId.replace('.','-');
   const article=html.match(new RegExp(`<article[^>]*id="${id}"[\\s\\S]*?<\/article>`))[0];
   for(const panel of ['explain','code','mapping','demo']){
    assert.equal([...article.matchAll(new RegExp(`data-panel="${panel}"`,'g'))].length,1,`${id}: one ${panel} panel`);
    assert.equal([...article.matchAll(new RegExp(`data-tab="${panel}"`,'g'))].length,1,`${id}: one ${panel} tab`);
   }
   assert.ok(article.includes('data-i18n="tab.mapping">→ 映射</button>'));
   assert.ok(definition.steps.length>=3);assert.equal(new Set(definition.steps.map(s=>s.id)).size,definition.steps.length);
   const codePanel=article.match(/<div[^>]*data-panel="code"[\s\S]*?(?=<div[^>]*data-panel="demo")/)[0];
   const blocks=[...codePanel.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/g)].map(m=>m[1].replace(/<\/?[a-zA-Z][^>]*>/g,'').split('\n'));
   for(const step of definition.steps)for(const range of step.codeTargets??[]){
    assert.ok(blocks[range.block],`${id} ${step.id}: original block`);
    assert.ok(range.from>=1&&(range.to??range.from)<=blocks[range.block].length,`${id} ${step.id}: original lines`);
   }
  }
 });
});
