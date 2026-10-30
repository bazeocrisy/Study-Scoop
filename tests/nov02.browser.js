// Targeted weekly regression: run with CHROME_PATH and optional --site _site.
import assert from 'node:assert/strict';
import path from 'node:path';
import {BASE,ROOT,startBrowser,startServer} from './lib/harness.js';
const i=process.argv.indexOf('--site');
const server=await startServer({root:i<0?ROOT:path.resolve(process.argv[i+1])}),b=await startBrowser();
let checks=0;
const inspect=(code)=>b.js(code);
async function click(selector){const before=await inspect('return document.getElementById("app").dataset.rendered;');await b.clickAt(selector);await b.waitFor(`document.getElementById('app').dataset.rendered !== ${JSON.stringify(before)}`);}
async function runInfo(kind){return inspect(`const {runFor}=await import('./js/activity-player.js');const r=runFor({weekId:'2026-11-02'},'tests',${JSON.stringify(kind)});return {count:r.items.length,unique:new Set(r.items.map(q=>q.word||q.answer)).size,submitted:r.submitted,correct:r.items.filter(q=>r.items_[q.id]?.status==='correct').length};`);}
async function take(kind,expected,oneWrong=false){
 await b.load(server.origin+BASE+`#tests?week=2026-11-02&test=${kind}`);
 assert.equal((await runInfo(kind)).count,expected);checks++;
 for(let n=0;n<expected;n++){
  assert.equal(await inspect('return document.querySelectorAll("#app [data-act=help]").length'),0);checks++;
  if(kind==='spelling'){assert.equal(await inspect('return document.querySelectorAll("#app img").length'),0);checks++;}
  await inspect(`const {runFor}=await import('./js/activity-player.js');const {solution}=await import('./js/lib/lessons.js');const r=runFor({weekId:'2026-11-02'},'tests',${JSON.stringify(kind)});const q=r.items[r.i],v=solution(q);${oneWrong&&n===0?`if(q.type==='choice')v.choice=q.options.findIndex(o=>!o.correct);else for(const k in v)v[k]='wrong';`:''}const f=document.querySelector('form[data-item]');for(const [k,x] of Object.entries(v)){if(k==='choice')f.querySelector('input[name=choice][value="'+x+'"]').click();else {const el=f.querySelector('[name="'+k+'"]');if(el)el.value=String(x);}}f.dispatchEvent(new Event('input',{bubbles:true}));`);
  await click(`[data-act=${n===expected-1?'submit':'next'}]`);
 }
 const r=await runInfo(kind);assert.equal(r.submitted,true);assert.equal(r.correct,expected-(oneWrong?1:0));assert.ok((await inspect('return document.getElementById("app").innerText')).includes('your score'));checks+=3;
}
try{
 await b.viewport(390,844);await b.load(server.origin+BASE+'#tests?week=2026-11-02');
 assert.doesNotMatch(await inspect('return document.getElementById("app").innerText'),/Not available|could not be loaded/);checks++;
 await take('vocab',6,true);assert.equal((await runInfo('vocab')).unique,6);checks++;
 await b.hash('#vocab?week=2026-11-02&act=misses');assert.ok((await inspect('return document.getElementById("app").innerText')).includes('Question 1 of 1'));checks++;
 await take('mathwords',12,true);
 await b.hash('#math?week=2026-11-02&act=avmisses');assert.ok((await inspect('return document.getElementById("app").innerText')).includes('Question 1 of 1'));checks++;
 await take('spelling',10);
 assert.deepEqual(b.errors,[]);assert.deepEqual(b.failures,[]);assert.deepEqual(server.missing,[]);checks+=3;
 console.log(`${checks} targeted weekly browser checks passed: six-word quiz/results/misses, Area vocabulary/results/chapter misses, spelling dictation/results.`);
}finally{b.close();server.close();}
