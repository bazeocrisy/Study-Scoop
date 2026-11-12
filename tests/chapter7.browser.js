// Real browser acceptance checks for Chapter 7; run on repository or --site <allowlisted build>.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, BASE, startBrowser, startServer } from './lib/harness.js';
const pos=process.argv.indexOf('--site');
const root=pos<0?ROOT:path.resolve(process.argv[pos+1]);
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const lessons=Array.from({length:7},(_,i)=>read(`data/lessons/7-${i+1}.json`));
const server=await startServer({root});const b=await startBrowser();let passed=0;
const expect=(value,message)=>{assert.ok(value,message);passed++;};
// Lessons 7-2 to 7-7 open Try It Yourself and the Test only after the teaching stages (teach first). These checks are
// about each stage itself, so they mark the earlier stages finished in this visit first (the locks are tested in
// tests/chapter7-teacher.browser.js).
const unlock=id=>b.js(`const m=await import('./js/lesson-player.js');for(const s of ['learn','watch','together','try'])m.stateFor(${JSON.stringify(id)},s).completed=true;`);
const route=async h=>{const id=(h.match(/lesson=(7-[2-7])/)||[])[1];
 if(id){await b.load(server.origin+BASE+`#math?lesson=${id}&stage=parent`);await unlock(id);await b.hash(h);}else await b.load(server.origin+BASE+h);
 expect(await b.js('return !document.querySelector(".error");'),`${h}: no error screen`);};
const text=()=>b.js('return document.querySelector("#app").innerText;');
const visible=s=>b.js(`return [...document.querySelectorAll(${JSON.stringify(s)})].filter(e=>e.getClientRects().length).length;`);
const click=async s=>{const old=await b.js('return document.querySelector("#app").dataset.rendered;');await b.clickAt(s);await b.waitFor(`document.querySelector('#app').dataset.rendered !== ${JSON.stringify(old)}`);};
const fill=async(s,v)=>b.js(`const el=document.querySelector(${JSON.stringify(s)});el.value=${JSON.stringify(String(v))};el.dispatchEvent(new Event('input',{bubbles:true}));`);
const assertLayout=async label=>{
 expect(await b.js('return document.querySelectorAll("h1").length===1;'),`${label}: one h1`);
 expect(await b.js('return document.documentElement.scrollWidth<=document.documentElement.clientWidth;'),`${label}: no horizontal overflow`);
 expect(await b.js('return [...document.querySelectorAll("img")].every(e=>e.hasAttribute("alt"));'),`${label}: images have alt`);
 expect(await b.js('return [...document.querySelectorAll("#app button")].filter(e=>e.getClientRects().length).every(e=>(e.getAttribute("aria-label")||e.innerText).trim());'),`${label}: buttons have names`);
};
try{
 await b.viewport(390,844);
 await route('#math?ch=7&week=2026-11-02');
 const menu=await b.js('return [...document.querySelectorAll(".menu-card")].map(e=>({href:e.getAttribute("href"),text:e.innerText}));');
 expect(menu.length===6,'Chapter 7 has six role cards');
 for(const word of ['Vocabulary','Lessons','Practice','Guide','Test'])expect(menu.some(c=>c.text.includes(word)),`Chapter 7 role ${word}`);
 expect(menu.every(c=>!/[?&](?:ch=[56]|lesson=[56]-|act=(?:ch[56]|area|props|split|breakapart))/.test(c.href)),'Chapter 7 menu contains only its chapter');
 for(const l of lessons)for(const stage of ['learn','watch','together','try','test','parent']){
  await route(`#math?lesson=${l.id}&stage=${stage}&week=2026-11-02`);
  expect((await text()).includes(l.title),`${l.id} ${stage}: actual lesson title`);
  expect(await visible('#lesson-stage')===1,`${l.id} ${stage}: lesson stage mounted`);
  if(stage==='test'){
   expect(await visible('[data-act="help"], .help-panel, .feedback')===0,`${l.id}: test exposes no help or feedback`);
   expect(await visible('form button[type="submit"]')===0,`${l.id}: test cannot check answer early`);
   expect(await visible('[data-correct], .is-right, .is-wrong')===0,`${l.id}: unanswered test has no answer markers`);
  }
 }
 for(const ch of [5,6]){
  await route(`#math?ch=${ch}&week=2026-11-02`);
  expect(await visible('.menu-card')===6,`Chapter ${ch} still has six roles`);
  expect(!await b.js('return [...document.querySelectorAll(".menu-card")].some(e=>/act=(?:frac|ch7|fpractice|fchoice|ftf|ffill|fmisses|fvflash)/.test(e.getAttribute("href")));'),`Chapter ${ch} contains no Chapter 7 activities`);
 }
 for(const act of ['fraclearn','fracwords','fracpractice','ch7guide','ch7','fpractice','fchoice','ftf','ffill','fmisses','fvflash','fvchoice','fvtf','fvfill','fvmisses','ch7test']){
  await route(`#math?act=${act}&week=2026-11-02`);
  await assertLayout(`390 ${act}`);
  expect(!(await text()).includes('could not be loaded'),`${act}: resources loaded`);
  expect(await b.js(`return document.querySelectorAll('a[href*="ch=7"]').length>0;`),`${act}: chapter breadcrumb/back link exists`);
 }
 await route('#math?act=fvflash&week=2026-11-02');
 const cardWord=await b.js('return document.querySelector(".frac-card h3").textContent;');
 const cardDefinition=read('data/chapters/7.json').vocabulary.find(w=>w.word===cardWord).def;
 await b.js('document.querySelector(".frac-card .flip-btn").focus();');await b.key('Enter');
 await b.waitFor('document.querySelector(".frac-card .definition")');
 await b.waitFor(`document.querySelector('#live').textContent.includes(${JSON.stringify(cardDefinition)})`);
 expect(await b.js('return document.activeElement.matches(".frac-card .flip-btn");'),'vocabulary keyboard flip preserves button focus');
 expect(await b.js(`return !document.querySelector('#live').textContent.includes('undefined')&&document.querySelector('#live').textContent.includes(${JSON.stringify(cardDefinition)});`),'vocabulary flip announces actual meaning');
 // Use actual authored items. Selecting their screen avoids pretending a helper-injected answer was a learner action.
 const candidate=lessons.flatMap(l=>l.try.items.map((it,index)=>({l,it,index}))).find(x=>x.it.type==='fraction');
 expect(!!candidate,'an authored fraction input is available');
 const {l,it,index}=candidate;
 await route(`#math?lesson=${l.id}&stage=learn`);
 await b.js(`const m=await import('./js/lesson-player.js');m.stateFor(${JSON.stringify(l.id)},'try').i=${index};`);
 await b.hash(`#math?lesson=${l.id}&stage=try`);
 expect(await visible('input[name="n"]')===1&&await visible('input[name="d"]')===1,'fraction has separate numerator and denominator inputs');
 expect(await b.js('return [...document.querySelectorAll("input[name=n],input[name=d]")].every(e=>e.labels.length||e.getAttribute("aria-label"));'),'fraction inputs have accessible names');
 await click('form button[type="submit"]');
 expect(await b.js('return ["n","d"].includes(document.activeElement.name);'),'empty fraction returns focus to an input');
 expect(await visible('[aria-invalid="true"]')>0,'empty fraction marked invalid');
 await b.key('Tab');
 expect(await b.js('return document.activeElement.name==="d";'),'Tab reaches denominator from numerator');
 expect(await b.js('return getComputedStyle(document.activeElement).outlineStyle!=="none";'),'keyboard denominator focus is visible');
 await b.key('Tab',true);
 expect(await b.js('return document.activeElement.name==="n";'),'Shift-Tab returns to numerator');
 await fill('input[name="n"]',it.answer.n);await fill('input[name="d"]',it.answer.d+1);await click('form button[type="submit"]');
 expect(await b.js('return document.querySelector("form[data-item]").dataset.state==="notyet";'),'wrong fraction rejected');
 if(it.teaching) expect(await b.js('return document.activeElement.matches("[data-coach-heading]")&&!!document.querySelector("[data-coach=feedback] .coach-model svg");'),'wrong denominator opens and focuses its visual explanation');
 else expect(await b.js('return document.activeElement.name==="d";'),'wrong denominator receives correction focus');
 expect(await visible('[data-act="help"]')===1,'wrong fraction unlocks incremental help');
 await click('[data-act="help"]');expect(await visible('.help-panel')===1,'first help step displayed');
 if(it.teaching) await click('[data-act="coach-retry"]');
 await fill('input[name="n"]',it.answer.n);await fill('input[name="d"]',it.answer.d);await click('form button[type="submit"]');
 expect(await b.js('return document.querySelector("form[data-item]").dataset.state==="correct";'),'exact authored fraction accepted');
 expect(await b.js(`const m=await import('./js/lesson-player.js');const st=m.stateFor(${JSON.stringify(l.id)},'try').items[${JSON.stringify(it.id)}];return st.first==='notyet'&&st.tries>=2&&st.help>=1;`),'corrected fraction retains first miss and help history');
 for(const policy of ['partition','value']){
  const c=lessons.flatMap(l=>l.try.items.map((it,index)=>({l,it,index}))).find(x=>x.it.type==='fraction'&&x.it.answerPolicy===policy);
  expect(!!c,`authored ${policy} fraction input is available`);
  await route(`#math?lesson=${c.l.id}&stage=learn`);
  await b.js(`const m=await import('./js/lesson-player.js');const s=m.stateFor(${JSON.stringify(c.l.id)},'try');s.i=${c.index};delete s.items[${JSON.stringify(c.it.id)}];`);
  await b.hash(`#math?lesson=${c.l.id}&stage=try`);
  await fill('input[name="n"]',c.it.answer.n*2);await fill('input[name="d"]',c.it.answer.d*2);await click('form button[type="submit"]');
  expect(await b.js(`return document.querySelector('form[data-item]').dataset.state===${JSON.stringify(policy==='value'?'correct':'notyet')};`),`${policy}: equivalent fraction follows declared answer policy`);
 }
 // Screen-reader model descriptions must expose countable parts without embedding the solved fraction.
 await route(`#math?lesson=${l.id}&stage=try`);
 expect(await visible('.model-pic[role="img"]')>0,'fraction model has an accessible image role');
 expect(await b.js('return [...document.querySelectorAll(".model-pic[role=img]")].every(e=>!!e.getAttribute("aria-label")&&!/\\d+\\s*\\/\\s*\\d+/.test(e.getAttribute("aria-label")));'),'model descriptions expose observations without solved fractions');
 // Open written thinking receives a model comparison, never an automatic meaning grade.
 const writing=lessons.flatMap(l=>l.learn.screens.map((screen,index)=>({l,screen,index}))).find(x=>x.screen.item?.type==='sentence');
 expect(!!writing,'Chapter 7 has an authored explanation task');
 await route(`#math?lesson=${writing.l.id}&stage=watch`);
 await b.js(`const m=await import('./js/lesson-player.js');m.stateFor(${JSON.stringify(writing.l.id)},'learn').i=${writing.index};`);
 await b.hash(`#math?lesson=${writing.l.id}&stage=learn`);
 expect(await b.js('return document.querySelector("textarea").labels.length>0;'),'written explanation has a label');
 await click('form button[type="submit"]');
 expect(await b.js('return document.activeElement.tagName==="TEXTAREA"&&document.activeElement.getAttribute("aria-invalid")==="true";'),'empty written response focuses invalid textarea');
 await fill('textarea','My response is being revised.');
 expect(await visible('form .feedback')===0,'typing hides stale empty-response feedback');
 await fill('textarea',writing.screen.item.example);await click('form button[type="submit"]');
 expect(await visible('[data-written-review]')===1&&await visible('.feedback.ok')===0,'written response gets ungraded model comparison');
 expect((await text()).includes('computer does not grade its mathematical meaning'),'comparison explicitly leaves meaning review to learner or grown-up');
 expect(await b.js('return document.activeElement.matches("[data-review-check]");'),'comparison moves keyboard focus to review checklist');
 expect(await b.js('return document.querySelector(".stage-nav .btn-primary").disabled===true;'),'comparison alone does not complete review');
 await b.clickAt('[data-act="review-written"]');
 await b.waitFor('document.querySelector("#live").textContent.includes("Check all three")');
 expect(await b.js('return document.querySelector(".stage-nav .btn-primary").disabled===true;'),'unfinished checklist cannot bypass review');
 for(const key of ['whole','reason','compare'])await b.clickAt(`[data-review-check="${key}"]`);
 await click('[data-act="review-written"]');
 expect((await text()).includes('Review completed for this response'),'review completion is explicit and ungraded');
 expect(await b.js('return !document.querySelector(".stage-nav .btn-primary").disabled;'),'review unlocks next stage');
 expect(await b.js('return [...document.querySelectorAll("[aria-describedby]")].every(e=>e.getAttribute("aria-describedby").split(/\\s+/).every(id=>document.getElementById(id)));'),'completed review description references resolve');
 await fill('textarea',writing.screen.item.example+' I checked again.');
 expect(await visible('[data-written-review]')===0,'editing hides stale comparison');
 expect(await b.js('const e=document.querySelector(".stage-nav .btn-primary");return e.disabled===true||e.getAttribute("aria-disabled")==="true";'),'editing invalidates progression gate');
 await click('form button[type="submit"]');
 expect(await b.js('return [...document.querySelectorAll("[data-review-check]")].every(e=>!e.checked);'),'recomparison starts with fresh review checks');
 expect(!(await text()).includes('Review completed for this response'),'edited response does not inherit completed review');
 // A real incorrect practice attempt follows the Chapter 7 bank even in an older selected week.
 const pack=read('data/chapters/7.json');
 await route('#math?act=fpractice&week=2026-11-02');
 const practiceId=await b.js('return document.querySelector("form[data-item]").dataset.item;');
 const practiceItem=pack.practice.items.find(x=>x.id===practiceId);
 expect(!!practiceItem,'practice screen uses the Chapter 7 authored bank');
 if(practiceItem.type==='fraction'){
  await fill('input[name="n"]',99);await fill('input[name="d"]',1);
 }else if(practiceItem.type==='choice'){
  const wrong=practiceItem.options.find(x=>!x.correct).text;
  await b.js(`const label=[...document.querySelectorAll('form label')].find(e=>e.textContent.trim()===${JSON.stringify(wrong)});if(!label)throw new Error('Wrong authored option not displayed');label.querySelector('input').click();`);
 }else if(practiceItem.type==='number')await fill('form input.box',999);
 else throw new Error(`Add an explicit wrong-answer interaction for practice type ${practiceItem.type}`);
 await click('form button[type="submit"]');
 expect(await b.js('return document.querySelector("form[data-item]").dataset.state==="notyet";'),'authored Chapter 7 practice answer rejected');
 await b.hash('#math?act=fmisses&week=2026-11-02');
 expect(await b.js(`return document.querySelector('form[data-item]')?.dataset.item===${JSON.stringify(practiceId)};`),'Chapter 7 miss preserved with Nov 2 selected');
 expect((await text()).includes(practiceItem.prompt),'misses display exact Chapter 7 prompt');
 await b.hash('#math?act=areamisses&week=2026-11-02');
 expect(!(await text()).includes(practiceItem.prompt),'Chapter 7 miss does not leak into Chapter 6');
 await b.hash('#math?act=misses&week=2026-11-02');
 expect(!(await text()).includes(practiceItem.prompt),'Chapter 7 miss does not leak into Chapter 5');
 for(const width of [360,390,768,1024,1366,1920]){
  await b.viewport(width,900);
  for(const act of ['fraclearn','fracpractice','ch7guide','fpractice','ch7test']){
   await route(`#math?act=${act}&week=2026-11-02`);await assertLayout(`${width} ${act}`);
   expect(!(await text()).includes('Nothing to practice yet'),`${width} ${act}: actual chapter content`);
   expect(await b.js('return [...document.querySelectorAll("#app .btn, #app .read")].filter(e=>e.getClientRects().length).every(e=>e.getBoundingClientRect().height>=44);'),`${width} ${act}: 44px primary controls`);
   if(act==='ch7test')expect(await visible('[data-act="help"], .help-panel, .feedback')===0,`${width}: chapter test has no help or feedback`);
   if(process.env.SS_SHOTS){fs.mkdirSync(process.env.SS_SHOTS,{recursive:true});await b.shot(path.join(process.env.SS_SHOTS,`chapter7-${act}-${width}.png`));}
  }
 }
 await route('#math?act=ch7guide&week=2026-11-02');await b.media('print');
 expect((await text()).includes('Chapter 7'),'print guide retains chapter heading');
 expect(await b.js('return [...document.querySelectorAll(".frac-answer-key > :not(summary)")].length>0&&[...document.querySelectorAll(".frac-answer-key > :not(summary)")].every(e=>e.getBoundingClientRect().height>0);'),'print exposes closed answer-key content');
 const pdf=await b.send('Page.printToPDF',{paperWidth:8.5,paperHeight:11,printBackground:true,displayHeaderFooter:false});
 expect(!!pdf.result?.data,'Letter-size guide PDF generated');
 if(process.env.SS_SHOTS)fs.writeFileSync(path.join(process.env.SS_SHOTS,'chapter7-guide-letter.pdf'),Buffer.from(pdf.result.data,'base64'));
 await b.media('');
 expect(b.errors.length===0,`no browser exceptions: ${b.errors.join('; ')}`);
 expect(server.missing.length===0,`no missing local assets: ${server.missing.join('; ')}`);
 expect(b.requests.every(u=>!/(?:images\/(?:newsletters|textbooks)|\.pdf(?:$|\?))/.test(u)),'no raw newsletter or textbook source requested');
 console.log(`Chapter 7 browser: ${passed} checks passed (${pos<0?'repository':'built site'}).`);
}catch(e){console.error(`Chapter 7 browser failed after ${passed} checks:`,e);console.error(await b.js('return {url:location.href,text:document.querySelector("#app")?.innerText};'));console.error(b.errors,b.failures);if(process.env.SS_SHOTS){fs.mkdirSync(process.env.SS_SHOTS,{recursive:true});await b.shot(path.join(process.env.SS_SHOTS,'failure.png'));}process.exitCode=1;}finally{b.close();server.close();}
