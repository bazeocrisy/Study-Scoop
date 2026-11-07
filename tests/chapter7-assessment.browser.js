// Focused Chapter 7 review/assistance state contracts on repository and built output.
import assert from 'node:assert/strict';
import path from 'node:path';
import { BASE, startServer, startBrowser } from './lib/harness.js';
const arg=process.argv.indexOf('--site');const server=await startServer(arg<0?{}:{root:path.resolve(process.argv[arg+1])});const b=await startBrowser();
let passed=0;
const js=(s)=>b.js(s),click=async(s)=>{await js(`document.querySelector(${JSON.stringify(s)}).click()`);await b.wait(50);};
const edit=async(text)=>js(`const el=document.querySelector('textarea');el.value=${JSON.stringify(text)};el.dispatchEvent(new Event('input',{bubbles:true}));`);
try {
 await b.load(server.origin+BASE+'#math?lesson=7-1&stage=learn');
 await js(`const {stateFor}=await import('./js/lesson-player.js');stateFor('7-1','learn').i=5;`);
 await b.hash('#math?lesson=7-1&stage=watch');await b.hash('#math?lesson=7-1&stage=learn');
 assert.ok(await js('return !!document.querySelector("textarea")'));
 await click('form button[type=submit]');assert.equal(await js('return !!document.querySelector("[data-written-review]")'),false);
 assert.equal(await js('return document.querySelector(".stage-nav .btn-primary").disabled'),true);
 await edit('i see the parts take the same space');await click('form button[type=submit]');
 assert.equal(await js('return !!document.querySelector("[data-written-review]")'),true);
 assert.equal(await js('return document.querySelector(".stage-nav .btn-primary").disabled'),true);
 await click('[data-act=review-written]');assert.equal(await js('return document.querySelector(".stage-nav .btn-primary").disabled'),true);
 await js('for(const el of document.querySelectorAll("[data-review-check]"))el.checked=true;');await click('[data-act=review-written]');
 assert.equal(await js('return document.querySelector(".stage-nav .btn-primary").tagName'),'A');
 await js(`const el=document.querySelector('[data-review-check=whole]');el.checked=false;el.dispatchEvent(new Event('change',{bubbles:true}));`);assert.equal(await js('return document.querySelector(".stage-nav .btn-primary").getAttribute("aria-disabled")'),'true');
 await edit('my changed response');assert.equal(await js('return document.querySelector("[data-written-review]").hidden'),true);assert.equal(await js('return getComputedStyle(document.querySelector("[data-written-review]")).display'),'none');
 assert.equal(await js('return document.querySelector(".stage-nav .btn-primary").getAttribute("aria-disabled")'),'true');
 await click('.stage-nav .btn-primary');assert.ok((await js('return location.hash')).includes('stage=learn'));
 await click('form button[type=submit]');assert.equal(await js('return [...document.querySelectorAll("[data-review-check]")].some(x=>x.checked)'),false);
 passed++;console.log('ok: blank blocked; self/parent checklist required; edits invalidate old comparison and completion');
 // Lesson assistance survives a new round, and appears in the same lesson's Parent Guide.
 await b.load(server.origin+BASE+'#math?lesson=7-1&stage=try');
 await js(`const L=await(await fetch('data/lessons/7-1.json')).json();const first=L.try.items[0];if(first.type==='choice')document.querySelectorAll('input[type=radio]')[first.options.findIndex(o=>!o.correct)].click();else for(const el of document.querySelectorAll('input.box')){el.value='999';el.dispatchEvent(new Event('input',{bubbles:true}));}`);await click('form button[type=submit]');
 await click('[data-act=help]');
 for(let k=0;k<10 && await js('return !!document.querySelector("[data-act=help]")');k++)await click('[data-act=help]');
 assert.ok((await js('return document.querySelector(".lesson-history").textContent')).includes('1 answers revealed'));
 await js(`const {stateFor}=await import('./js/lesson-player.js');const L=await(await fetch('data/lessons/7-1.json')).json();stateFor('7-1','try').i=L.try.items.length;`);
 await b.hash('#math?lesson=7-1&stage=parent');await b.hash('#math?lesson=7-1&stage=try');
 await click('[data-act=restart]');
 assert.ok((await js('return document.querySelector(".lesson-history").textContent')).match(/[1-9]\d* help steps opened/));
 assert.ok((await js('return document.querySelector(".lesson-history").textContent')).includes('0 questions right on the first attempt'));
 await b.hash('#math?lesson=7-1&stage=parent');assert.ok((await js('return document.querySelector(".lesson-history").textContent')).match(/[1-9]\d* help steps opened/));
 passed++;console.log('ok: lesson help history survives restart and remains in Parent Guide, separate from current round');
 // Chapter activity player history survives its restart too.
 await b.load(server.origin+BASE+'#math?act=ffill');
 await js('for(const el of document.querySelectorAll("input.box")){el.value="999";el.dispatchEvent(new Event("input",{bubbles:true}));}');await click('form button[type=submit]');await click('[data-act=help]');
 const before=await js(`const{runFor}=await import('./js/activity-player.js');return document.querySelector('.activity-history')?.textContent||document.querySelector('.assistance-history')?.textContent||document.querySelector('#act-stage').innerText;`);
 // Finish the round through the shared run, using UI Next and Help as needed is covered by the chapter suite;
 // restarting via final-results button is exercised by moving the same in-memory run to its summary.
 await js(`const{runFor}=await import('./js/activity-player.js');const pack=await(await fetch('data/chapters/7.json')).json();const week=await(await fetch('data/2026-11-09.json')).json();const r=runFor({weekId:'2026-11-09',week,chapter:{id:7},fractions:pack},'math','ffill');r.finished=true;`);
 await b.hash('#math?act=fracpractice');await b.hash('#math?act=ffill');await click('[data-act=restart]');
 await js(`const{runFor}=await import('./js/activity-player.js');const pack=await(await fetch('data/chapters/7.json')).json();const week=await(await fetch('data/2026-11-09.json')).json();const r=runFor({weekId:'2026-11-09',week,chapter:{id:7},fractions:pack},'math','ffill');r.i=r.items.findIndex(it=>r.history[it.id]?.help>0);`);await b.hash('#math?act=fracpractice');await b.hash('#math?act=ffill');
 const after=await js('return document.querySelector("#act-stage").innerText');
 assert.ok(/earlier|Across|visit|assistance/i.test(after));assert.ok(/1 question used Help/i.test(after),after);
 await js('for(const el of document.querySelectorAll("input.box")){el.value="999";el.dispatchEvent(new Event("input",{bubbles:true}));}');await click('form button[type=submit]');await click('[data-act=help]');
 assert.ok(await js(`const{runFor}=await import('./js/activity-player.js');const pack=await(await fetch('data/chapters/7.json')).json();const week=await(await fetch('data/2026-11-09.json')).json();const r=runFor({weekId:'2026-11-09',week,chapter:{id:7},fractions:pack},'math','ffill');return r.history[r.items[r.i].id].help>=2;`));
 passed++;console.log('ok: activity help survives restart; subsequent help adds to retained history');
 assert.deepEqual(b.errors,[]);assert.deepEqual(b.failures,[]);assert.deepEqual(server.missing,[]);console.log(`${passed} focused assessment browser checks passed${arg<0?'':' on built site'}`);
} finally {b.close();server.close();}
