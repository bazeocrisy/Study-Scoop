// Exercises the built/local site or the actual production URL via --url.
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import {ROOT,BASE,startBrowser,startServer} from './lib/harness.js';
const arg=(key)=>{const n=process.argv.indexOf(key);return n<0?null:process.argv[n+1];};
const server=arg('--url')?null:await startServer({root:arg('--site')?path.resolve(arg('--site')):ROOT});
const base=arg('--url')||server.origin+BASE;
const b=await startBrowser();let checks=0;
const expect=(v,msg)=>{assert.ok(v,msg);checks++;};
const text=()=>b.js('return document.getElementById("app").innerText;');
const visible=(sel)=>b.js(`return [...document.querySelectorAll(${JSON.stringify(sel)})].filter(el=>el.getClientRects().length).length;`);
async function click(sel){const before=await b.js('return document.getElementById("app").dataset.rendered;');await b.clickAt(sel);await b.waitFor(`document.getElementById('app').dataset.rendered !== ${JSON.stringify(before)}`);}
async function route(act=''){await b.load(base+'#homework?week=2026-11-02'+(act?'&act='+act:''));}
async function fill(sel,value){await b.js(`const el=document.querySelector(${JSON.stringify(sel)});el.value=${JSON.stringify(String(value))};el.dispatchEvent(new Event('input',{bubbles:true}));`);}
async function submitItem(id,a,bb){await fill(`form[data-item="${id}"] [name=a]`,a);await fill(`form[data-item="${id}"] [name=b]`,bb);await click(`form[data-item="${id}"] button[type=submit]`);}
try {
 for(const width of [360,390,768,1024,1366,1920]){
  await b.viewport(width,900);await route();
  for(const act of ['fractions','parts','fluency','comprehension'])expect(await visible(`.hw-activity-grid a[href*="act=${act}"]`)===1,`${width}: ${act} entry`);
  expect(await b.js('return document.documentElement.scrollWidth <= document.documentElement.clientWidth;'),`${width}: entry overflow`);
  for(const act of ['fractions','parts','fluency','comprehension']){
   await route(act);expect(!(await text()).includes('Nothing to practice yet'),`${act} activity opens`);
   expect(await b.js('return document.documentElement.scrollWidth <= document.documentElement.clientWidth;'),`${width}: ${act} overflow`);
   expect(await visible('a[href^="#homework"]:not([href*="act="])')>0,'back to Homework exists');
   if(['fractions','parts','comprehension'].includes(act))expect(await visible('form[data-item]')===1,'one question visible');
   if(act==='fluency')expect(await visible('[data-fluency]')===6,'six manual reading fields');
   if(process.env.SS_SHOTS){fs.mkdirSync(process.env.SS_SHOTS,{recursive:true});await b.shot(path.join(process.env.SS_SHOTS,`${act}-${width}.png`));}
  }
 }
 await b.viewport(390,844);await route('fractions');
 expect(await visible('[data-act=help]')===0,'answers and help hidden before attempt');
 await submitItem('f1',3,2);expect((await text()).includes('numbers are switched'),'explanatory incorrect feedback');expect(await visible('[data-act=help]')===1,'Help after attempt');
 await click('[data-act=help]');expect((await text()).includes('Help: step 1'),'Help opens incrementally');
 await submitItem('f1',2,3);expect((await text()).includes('Yes! 2 out of 3'),'correct feedback');
 const packet=JSON.parse(fs.readFileSync(new URL('../data/homework/2026-11-02.json',import.meta.url),'utf8'));
 for(const act of ['fractions','parts']){
  await route(act);
  const pg=packet.pages.find(p=>p.id===act);
  for(let i=0;i<pg.problems.length;i++){
   const it=pg.problems[i].items[0];await submitItem(it.id,it.answer.a,it.answer.b);
   expect((await text()).includes('Yes!'),`${it.id}: accepts right answer`);
   if(i<pg.problems.length-1)await click('[data-hw-nav="1"]');
  }
  expect((await text()).includes(`${pg.problems.length} of ${pg.problems.length}`),'all fraction questions complete');
  if(act==='fractions'){
   await click('[data-hw-nav="1"]');
   await b.js('document.querySelector("#triangle-cut").value="edge";document.querySelector("form[data-partition=triangle]").requestSubmit();');
   expect((await text()).includes('different areas'),'triangle wrong partition explanation');
   await b.js('document.querySelector("#triangle-cut").value="middle";document.querySelector("form[data-partition=triangle]").requestSubmit();');
   expect((await text()).includes('Two equal areas'),'triangle halves');
   await fill('#partition-rows',2);await fill('#partition-cols',4);
   await b.js('document.querySelector("form[data-partition=rectangle]").requestSubmit();');
   expect((await text()).includes('Eight equal parts'),'rectangle eighths');
   expect(await b.js('return document.documentElement.scrollWidth <= document.documentElement.clientWidth;'),'drawing step phone overflow');
   await click('[data-act=restart]');await click('[data-hw-nav="1"]');
   expect((await text()).includes('Step 2 of 9'),'navigation works after restart');
  }
 }
 await route('fluency');expect(!(await text()).includes('0 of 0'),'tracker-specific summary');
 for(let n=1;n<=3;n++){await fill(`[data-fluency=right${n}]`,160+n);await fill(`[data-fluency=errors${n}]`,3);}
 expect((await text()).includes('3 of 3 reading attempts recorded'),'manual reading completion');
 await click('[data-act=restart]');await fill('[data-fluency=right1]',150);await fill('[data-fluency=errors1]',4);
 await b.hash('#homework?week=2026-11-02');await b.hash('#homework?week=2026-11-02&act=fluency');expect(await b.js('return document.querySelector("[data-fluency=right1]").value')==='150','restart uses current run for records');
 await route('comprehension');
 for(let n=1;n<=2;n++){
  await fill(`#c${n}-text`,n===1?'The author likes a sunny place with a cozy blanket.':'The author buys the new book to read it without waiting.');
  await click(`form[data-item=c${n}] button[type=submit]`);expect((await text()).includes('Compare your answer'),'written response comparison, not auto grade');
  if(n===1)await click('[data-hw-nav="1"]');
 }
 await b.media('print');expect(await visible('form[data-item]')===2,'both written answers printable');await b.media();
 for(const week of ['2026-10-12','2026-10-19','2026-10-26']){await b.load(base+`#homework?week=${week}`);expect((await text()).includes('Homework'),'previous week');}
 expect(b.errors.length===0,JSON.stringify(b.errors));expect(b.failures.length===0,JSON.stringify(b.failures));if(server)expect(server.missing.length===0,JSON.stringify(server.missing));
 console.log(`${checks} November homework browser checks passed on ${base}`);
}finally{b.close();server?.close();}
