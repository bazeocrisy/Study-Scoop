import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { ROOT, BASE, startServer, startBrowser } from './lib/harness.js';
const arg=process.argv.indexOf('--site');
const server=await startServer({root:arg<0?ROOT:path.resolve(process.argv[arg+1])});
const b=await startBrowser();let checks=0;
const check=(v,m)=>{assert.ok(v,m);checks++};
const nav=()=>b.js('return [...document.querySelectorAll(".tabs a")].filter(a=>a.getClientRects().length).map(a=>a.dataset.tab);');
async function go(hash){await b.load(server.origin+BASE+hash);}
try {
 for(const width of [360,768,1366]){
  await b.viewport(width,1000,false);
  await go('');
  check(await b.js('return document.querySelectorAll(".home-paths .path-card").length===2;'),'Home has two paths');
  assert.deepEqual(await nav(),['home','extra','week']);checks++;
  await b.clickAt('.home-paths a[href="#extra"]');
  await b.waitFor('document.querySelector("h1")?.textContent==="Extra Learning"');
  check((await nav()).includes('reading')&&!(await nav()).includes('spelling'),'Extra has its own navigation');
  await b.clickAt('.path-grid a[href="#reading"]');
  await b.waitFor('document.querySelector("h1")?.textContent==="Reading Practice"');
  check(await b.js('return document.querySelectorAll(".rd-card").length>=8;'),'existing passage library opens');
  check(await b.js('return document.querySelector(".crumbs").textContent.includes("Extra Learning");'),'Reading breadcrumb names path');
  await go('#week?week=2026-11-09');
  check(!(await nav()).includes('reading')&&!(await nav()).includes('skills'),'Schoolwork separates extra activities');
  check(await b.js('return document.querySelector(".path-grid a[href*=homework]").hash.includes("week=2026-11-09") || document.querySelector("#weekSelect").value==="2026-11-09";'),'Schoolwork keeps selected week');
  await go('#homework?week=2026-11-09&act=comprehension');
  check(await b.js('return document.querySelector(".crumbs").textContent.includes("Schoolwork");'),'assigned comprehension stays under Schoolwork');
  await go('#math?ch=7');
  check(await b.js('return document.querySelector("h1").textContent.includes("Chapter 7");'),'existing Chapter 7 link works');
  for(const route of ['#home','#extra','#week','#reading','#skills']){
   await go(route);
   check(await b.js('return document.documentElement.scrollWidth<=innerWidth;'),`${width} ${route}: no overflow`);
  }
 }
 fs.mkdirSync('/workspace/output/home-paths',{recursive:true});
 for(const [name,hash] of [['home','#home'],['schoolwork','#week'],['extra-learning','#extra'],['reading','#reading']]){
  await b.viewport(1366,1000,false);await go(hash);await b.shot(`/workspace/output/home-paths/${name}.png`);
 }
 await b.viewport(390,1000,false);await go('#home');await b.shot('/workspace/output/home-paths/home-phone.png');
 check(b.errors.length===0,JSON.stringify(b.errors));
 check(b.failures.length===0,JSON.stringify(b.failures));
 console.log(`${checks} learning-path browser checks passed`);
}finally{b.close();await server.close();}

process.exit(0);
