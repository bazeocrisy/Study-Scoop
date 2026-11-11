import assert from 'node:assert/strict';
import path from 'node:path';
import {ROOT,BASE,startServer,startBrowser} from './lib/harness.js';
const arg=process.argv.indexOf('--site');
const server=await startServer({root:arg<0?ROOT:path.resolve(process.argv[arg+1])});
const b=await startBrowser();let checks=0;
const check=(v,m)=>{assert.ok(v,m);checks++};
const kinds=()=>b.js('return [...document.querySelectorAll(".test-card")].map(e=>["math","spelling","vocab","mathwords"].find(k=>e.classList.contains("test-"+k)));');
const go=(week,tail='')=>b.load(server.origin+BASE+`#tests?week=${week}${tail}`);
try {
 for(const width of [360,768,1366]){
  await b.viewport(width,900,width<700);
  const requestStart=b.requests.length;
  await go('2026-11-09');
  check(!b.requests.slice(requestStart).some(u=>/data\/practice\/(math-words|area)\.json/.test(u)),'unrelated math review banks are not loaded for this week');
  assert.deepEqual(await kinds(),['spelling','vocab']);checks++;
  check(await b.js('return document.querySelectorAll(".test-card a.btn-primary").length===2;'),'two scheduled tests can start');
  check(await b.js('return [...document.querySelectorAll(".test-card .facts div:first-child dd")].every(e=>e.textContent==="Friday, November 13");'),'both dates match the selected newsletter');
  check(await b.js('return !/Unit 5|multiplication properties|Chapter 5|Review of/i.test(document.querySelector("#app").textContent);'),'old chapter content never appears in this week’s tests');
  check(await b.js('return document.documentElement.scrollWidth<=innerWidth;'),'weekly list fits viewport');
  for(const kind of ['mathwords','math']){
   await go('2026-11-09','&test='+kind);
   check(await b.js('return document.querySelector("h1").textContent==="Tests"&&!location.hash.includes("test=")&&!document.querySelector("#act-stage");'),'unlisted direct link returns to weekly tests');
   assert.deepEqual(await kinds(),['spelling','vocab']);checks++;
  }
  for(const [kind,count] of [['spelling',12],['vocab',6]]){
   await go('2026-11-09','&test='+kind);
   check(await b.js(`return document.querySelector('#act-stage').textContent.includes('Question 1 of ${count}');`),`${kind} opens the correct current-week questions`);
  }
 }
 await b.viewport(1366,900,false);
 for(const [week,expected] of [['2026-10-12',['spelling','vocab']],['2026-10-19',['math','spelling','vocab','mathwords']],['2026-10-26',['spelling','vocab','mathwords']],['2026-11-02',['spelling','vocab','mathwords']]]){
  await go(week);assert.deepEqual(await kinds(),expected);checks++;
 }
 await go('2026-10-19','&test=mathwords');
 check(await b.js('return document.querySelector("#act-stage").textContent.includes("Question 1 of 15");'),'property vocabulary still belongs to its scheduled week');
 await b.js('const s=document.querySelector("#weekSelect");s.value="2026-11-09";s.dispatchEvent(new Event("change"));');
 await b.waitFor('document.querySelector("h1")?.textContent==="Tests"');
 assert.deepEqual(await kinds(),['spelling','vocab']);checks++;
 await go('2026-10-26','&test=math');
 check(await b.js('return document.querySelector("h1").textContent==="Tests"&&!location.hash.includes("test=");'),'Area chapter review does not masquerade as the weekly vocabulary test');
 for(const [act,count] of [['ch5test',20],['ch6test',27]]){
  await b.load(server.origin+BASE+`#math?week=2026-11-09&act=${act}`);
  check(await b.js(`return document.querySelector('#act-stage').textContent.includes('Question 1 of ${count}');`),'chapter-owned tests stay available through Math');
 }
 check(!b.errors.length,JSON.stringify(b.errors));check(!server.missing.length,'no missing resources');
 console.log(`${checks} weekly-test scope browser checks passed`);
}finally{b.close();server.close()}process.exit(0);
