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
  assert.deepEqual(await nav(),[]);checks++;
  await b.clickAt('.home-paths a[href="#extra"]');
  await b.waitFor('document.querySelector("h1")?.textContent==="Extra Learning"');
  check((await nav()).length===0,'Extra Learning offers cards without a competing tab row');
  await b.clickAt('.path-grid a[href="#reading"]');
  await b.waitFor('document.querySelector("h1")?.textContent==="Reading Practice"');
  check(await b.js('return document.querySelectorAll(".rd-card").length>=8;'),'existing passage library opens');
  check(await b.js('return document.querySelector(".crumbs").textContent.includes("Extra Learning");'),'Reading breadcrumb names path');
  await go('#home');
  await b.clickAt('.home-paths a[href="#week"]');
  await b.waitFor('document.querySelector("h1")?.textContent==="This Week"');
  await b.clickAt('.path-grid a[href="#spelling"]');
  await b.waitFor('document.querySelector("h1")?.textContent==="Spelling"');
  check((await nav()).length===0,'chosen subject has no competing top menu');
  await b.clickAt('.path-controls a[href="#week"]');
  await b.waitFor('document.querySelector(".path-grid")');
  check(await b.js('return document.querySelectorAll(".path-grid .path-card").length===6;'),'Back returns to the six Schoolwork cards');
  await go('#week?week=2026-11-09');
  check(await b.js('document.documentElement.dataset.theme="dark"; return [...document.querySelectorAll(".path-card h3")].every(h=>getComputedStyle(h).color==="rgb(36, 29, 24)");'),'Schoolwork card headings remain readable in the optional dark palette');
  await b.js('delete document.documentElement.dataset.theme;');
  check((await nav()).length===0,'Schoolwork offers cards without a competing tab row');
  check(await b.js('return document.querySelectorAll(".path-grid .path-card").length===6;'),'Schoolwork has six subject cards');
  check(await b.js('return document.querySelector(".path-grid a[href*=homework]").hash.includes("week=2026-11-09") || document.querySelector("#weekSelect").value==="2026-11-09";'),'Schoolwork keeps selected week');
  await go('#homework?week=2026-11-09&act=comprehension');
  check(await b.js('return document.querySelector(".crumbs").textContent.includes("Schoolwork");'),'assigned comprehension stays under Schoolwork');
  await go('#math?ch=7');
  check(await b.js('return document.querySelector("h1").textContent.includes("Chapter 7");'),'existing Chapter 7 link works');
  for(const route of ['#home','#extra','#week','#reading','#skills']){
   await go(route);
   check((await nav()).length===0,`${route}: no top subject menu`);
   check(await b.js('return document.documentElement.scrollWidth<=innerWidth;'),`${width} ${route}: no overflow`);
  }
 }
 // Screenshots are an optional local review artifact, never a machine-specific CI requirement.
 const shots=process.env.SS_PATH_SHOTS;
 if(shots){
  fs.mkdirSync(shots,{recursive:true});
  for(const [name,hash] of [['home','#home'],['schoolwork','#week'],['extra-learning','#extra'],['reading','#reading']]){
   await b.viewport(1366,1000,false);await go(hash);await b.shot(path.join(shots,`${name}.png`));
  }
  await b.viewport(390,1000,false);await go('#home');await b.shot(path.join(shots,'home-phone.png'));
 }
 check(b.errors.length===0,JSON.stringify(b.errors));
 check(b.failures.length===0,JSON.stringify(b.failures));
 console.log(`${checks} learning-path browser checks passed`);
}finally{b.close();await server.close();}

process.exit(0);
