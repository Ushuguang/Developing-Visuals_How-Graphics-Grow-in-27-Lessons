import test from 'node:test';
import assert from 'node:assert/strict';
import { renderDemo } from '../teaching-viz/render-demo.js';
const flush = () => new Promise(resolve => setImmediate(resolve));
test('a pending original demo is mounted once and remains usable after resolution', async () => {
  const mount={dataset:{}};let calls=0,finish;
  const factory=()=>{calls++;return new Promise(resolve=>{finish=resolve;});};
  renderDemo(mount,factory);renderDemo(mount,factory);
  assert.equal(calls,1);assert.equal(mount.dataset.rendering,'1');
  finish();await flush();assert.equal(mount.dataset.rendered,'1');
  assert.equal(mount.dataset.rendering,undefined);renderDemo(mount,factory);assert.equal(calls,1);
});
test('failed original demos offer a retry without removing the lecture', async () => {
  const before=globalThis.document;
  globalThis.document={documentElement:{lang:'en'},createElement:()=>({setAttribute(){},remove(){}})};
  try{
    const messages=[],mount={dataset:{},append(...nodes){messages.push(...nodes);}};let calls=0;
    const factory=()=>{calls++;if(calls===1)return Promise.reject(Error('network'));return Promise.resolve();};
    renderDemo(mount,factory);await flush();
    assert.equal(mount.dataset.rendered,undefined);assert.equal(mount.dataset.rendering,undefined);
    assert.match(messages[0].textContent,/notes and code remain readable/);assert.equal(messages[1].textContent,'Retry');
    messages[1].onclick();await flush();assert.equal(calls,2);assert.equal(mount.dataset.rendered,'1');
  }finally{globalThis.document=before;}
});
