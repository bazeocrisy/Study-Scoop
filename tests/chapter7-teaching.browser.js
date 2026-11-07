// Reachability/rendering evidence, not a claim that a child independently learned the concepts.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {BASE,ROOT,startServer,startBrowser} from './lib/harness.js';
const a=process.argv.indexOf('--site'),server=await startServer(a<0?{}:{root:path.resolve(process.argv[a+1])}),b=await startBrowser();
const L=JSON.parse(fs.readFileSync(path.join(ROOT,'data/lessons/7-1.json'))),js=s=>b.js(s);
const click=async s=>{await js(`document.querySelector(${JSON.stringify(s)}).click()`);await b.wait(35);};
const edit=async response=>js(`const f=document.querySelector('form[data-item]');for(const[k,v]of Object.entries(${JSON.stringify(response)})){const e=f.querySelector('[name="'+k+'"]');if(k==='choice')f.querySelector('input[name=choice][value="'+v+'"]').click();else e.value=String(v);}f.dispatchEvent(new Event('input',{bubbles:true}));`);
const at=async(stage,i=0)=>{await b.load(server.origin+BASE+`#math?lesson=7-1&stage=${stage}`);if(i){await js(`const{stateFor}=await import('./js/lesson-player.js');stateFor('7-1',${JSON.stringify(stage)}).i=${i};`);await b.hash('#math?lesson=7-1&stage=parent');await b.hash(`#math?lesson=7-1&stage=${stage}`);}};
let passed=0;
try{
 await at('together');
 const exhaustive=await js(`const L=await(await fetch('data/lessons/7-1.json')).json();const{itemCard,teachingFeedbackFor}=await import('./js/views/lesson.js');const{check,solution}=await import('./js/lib/lessons.js');
 const items=[...L.learn.screens.flatMap(s=>s.item&&s.item.type!=='sentence'?[s.item]:[]),...L.watch.examples.flatMap(e=>e.why?[e.why]:[]),...['together','try','test'].flatMap(s=>L[s].items)];const failures=[];let paths=0;
 const host=document.createElement('div');document.body.append(host);
 for(const item of items){const wrong=item.type==='choice'?item.options.flatMap((o,i)=>o.correct?[]:[{choice:String(i)}]):[...Array.from({length:Number(item.answer)+2},(_,n)=>String(n)),'999','0001'].filter(n=>Number(n)!==Number(item.answer)).map(answer=>({answer}));
 for(const resp of [solution(item),...wrong]){const r=check(item,resp,L),feedback=teachingFeedbackFor(L,item,resp,r.status);const st={...r,resp,tries:1,counted:item.teaching?.count?.parts||[],coachView:'feedback',teachingFeedback:feedback,say:feedback?.text};host.innerHTML=itemCard(L,item,'together',{items:{[item.id]:st}}).s;
 const text=host.querySelector('[data-coach=feedback] .coach-instruction');if(!text||text.textContent!==feedback?.text||!host.querySelector('[data-coach=feedback] .coach-model svg')||getComputedStyle(text).display==='none')failures.push(item.id+':'+JSON.stringify(resp));paths++;}}
 host.remove();return{items:items.length,paths,failures};`);
 assert.equal(exhaustive.items,38);assert.deepEqual(exhaustive.failures,[]);passed++;console.log(`ok: actual DOM renders correct+each wrong choice and all counts0..key+1,999,leadingzero for all38 pilot items (${exhaustive.paths} paths)`);
 await at('try',3);const item=L.try.items[3];
 for(const label of item.options.filter(o=>!o.correct).map(o=>o.text)){
  const index=item.options.findIndex(o=>o.text===label);await edit({choice:index});await click('form button[type=submit]');
  assert.equal(await js('return document.querySelector("[data-coach=feedback] .coach-instruction").textContent'),item.options[index].why);
  assert.equal(await js('return document.querySelectorAll("[data-coach=feedback] .coach-model svg").length'),1);
 }
 await edit({choice:item.options.findIndex(o=>o.correct)});await click('form button[type=submit]');
 assert.equal(await js('return document.querySelector("[data-coach=feedback] .coach-instruction").textContent'),item.teaching.correct.text);
 assert.equal(await js('return getComputedStyle(document.querySelector("[data-coach=feedback]")).display !== "none"'),true);
 passed++;console.log('ok: each three-part naming distractor gives its own visible reason+model; correct immediately explains why');
 await at('try',3);await edit({choice:0});await click('form button[type=submit]');await click('[data-act=help]');
 const first=await js('return document.querySelector("[data-coach=help] .coach-model svg").outerHTML');await click('[data-act=help]');
 assert.notEqual(await js('return document.querySelector("[data-coach=help] .coach-model svg").outerHTML'),first);
 assert.equal(await js('return document.querySelectorAll("#lesson-stage figure.model").length'),1);
 passed++;console.log('ok: Help advances the visual model in one connected teaching panel');
 await at('learn',L.learn.screens.findIndex(s=>s.item?.teaching?.count));
 const countItem=L.learn.screens.find(s=>s.item?.teaching?.count).item,parts=countItem.teaching.count.parts;
 assert.equal(await js('return document.querySelector("form button[type=submit]").disabled'),true);
 for(const p of parts){await click(`[data-act=count-part][data-part="${p}"]`);}
 assert.equal(await js('return document.querySelector("form button[type=submit]").disabled'),false);
 assert.equal(await js('return document.querySelectorAll("figure.model [data-count-marker]").length'),parts.length,'ordinal numbers visibly appear on counted model parts');
 assert.equal(await js('return document.querySelector(".count-status").textContent'),`${parts.length} of ${parts.length} parts counted. Now write your answer.`);
 await edit({answer:countItem.answer});await click('form button[type=submit]');
 const record=await js(`const{stateFor}=await import('./js/lesson-player.js');const s=stateFor('7-1','learn');return {assisted:s.items[${JSON.stringify(countItem.id)}].scaffoldAssisted,count:s.history.items['learn:${countItem.id}'].countScaffold};`);
 assert.deepEqual(record,{assisted:true,count:true});
 passed++;console.log('ok: tapping every model part gates answer entry and records counting assistance separately');
 await at('watch');
 for(const [i,ex]of L.watch.examples.entries()){
  let previous=await js('return document.querySelector("#lesson-stage figure.model svg").outerHTML');
  for(let step=1;step<ex.steps.length;step++){await click('[data-act=step-next]');const next=await js('return document.querySelector("#lesson-stage figure.model svg").outerHTML');assert.notEqual(next,previous,`${ex.title} step${step+1}`);previous=next;assert.equal(await js('return document.querySelectorAll("#lesson-stage figure.model").length'),1);}
  if(i<L.watch.examples.length-1)await click('[data-act=next]');
 }
 passed++;console.log('ok: all three Watch examples visibly change diagram at every step');
 await at('test');
 for(const [i,it]of L.test.items.entries()){
  assert.equal(await js('return document.querySelectorAll("[data-act=help],[data-act=count-part],[data-coach]").length'),0);
  assert.equal(await js(`return document.querySelector('#lesson-stage').textContent.includes(${JSON.stringify(it.teaching.correct.text)});`),false);
  const response=it.type==='choice'?{choice:it.options.findIndex(o=>i%2===0?o.correct:!o.correct)}:{answer:i%2===0?it.answer:Number(it.answer)+1};
  await edit(response);if(i<L.test.items.length-1)await click('[data-act=next]');
 }
 await click('[data-act=submit]');
 assert.equal(await js('return document.querySelectorAll("[data-test-coach]").length'),10);
 for(const it of L.test.items){await click(`[data-test-coach="${it.id}"] summary`);assert.equal(await js(`return !!document.querySelector('[data-test-coach="${it.id}"] svg');`),true);assert.equal(await js(`const e=document.querySelector('[data-test-coach="${it.id}"] .coach-instruction');return !!e.textContent.trim()&&getComputedStyle(e).display!=='none';`),true);}
 assert.equal(await js('return [...document.querySelectorAll("[data-test-coach] summary")].filter(e=>e.textContent.includes(": correct")).length'),5);
 passed++;console.log('ok: pre-submit tests hide teaching; after mixed5/10 score all10 answers have expandable visual reasons');
 // Actual pointer activation from near the phone viewport bottom. No test-side scrolling follows clicks.
 await b.viewport(390,844);
 const bottomClick=async selector=>{
  const point=await js(`const e=document.querySelector(${JSON.stringify(selector)});window.scrollBy(0,e.getBoundingClientRect().top-760);const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,top:r.top,bottom:r.bottom};`);
  assert.ok(Math.abs(point.top-760)<3&&point.bottom<=844,`button really starts near y760: ${JSON.stringify(point)}`);
  for(const type of ['mouseMoved','mousePressed','mouseReleased'])await b.send('Input.dispatchMouseEvent',{type,x:point.x,y:point.y,button:type==='mouseMoved'?'none':'left',clickCount:type==='mouseMoved'?0:1});
  await b.wait(180);
 };
 const visibleCoach=async label=>{
  const state=await js(`const within=e=>{if(!e)return false;const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth;};const c=document.querySelector('[data-coach]');return{model:within(c?.querySelector('.coach-model')),why:within(c?.querySelector('.coach-instruction')),focus:within(document.activeElement),focusIsHeading:document.activeElement===c?.querySelector('h3')};`);
  assert.deepEqual(state,{model:true,why:true,focus:true,focusIsHeading:true},label);
 };
 for(const kind of ['wrong','correct']){
  await at('together');const item=L.together.items[0],choice=item.options.findIndex(o=>kind==='correct'?o.correct:!o.correct);
  const original=await js('return document.querySelector(".pic-card svg").outerHTML');
  await b.clickAt(`input[name=choice][value="${choice}"]`);await bottomClick('form button[type=submit]');await visibleCoach(`${kind} Check bottom-positioned button`);
  if(kind==='wrong'){
   await bottomClick('[data-act=help]');await visibleCoach('Help bottom-positioned button');
   await bottomClick('[data-act=help]');await visibleCoach('Next Help bottom-positioned button');
   const before=await js(`const{stateFor}=await import('./js/lesson-player.js');const s=stateFor('7-1','together');return{item:s.items.g1,history:s.history.items['together:g1']};`);
   await b.clickAt('[data-act=coach-retry]');await b.wait(180);
   assert.equal(await js('return document.querySelector(".pic-card svg").outerHTML'),original,'Try again restores original question picture');
   const retry=await js(`const within=e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;};return{picture:within(document.querySelector('.pic-card')),input:within(document.activeElement),focusInput:document.activeElement.matches('input[name=choice]'),coaches:document.querySelectorAll('[data-coach]').length};`);
   assert.deepEqual(retry,{picture:true,input:true,focusInput:true,coaches:0},'original stimulus and focused response both visible after Try again');
   const retained=await js(`const{stateFor}=await import('./js/lesson-player.js');const s=stateFor('7-1','together');return{tries:s.items.g1.tries,help:s.items.g1.help,history:s.history.items['together:g1']};`);
   assert.equal(retained.tries,before.item.tries);assert.equal(retained.help,before.item.help);assert.deepEqual(retained.history,before.history);
   await bottomClick('form button[type=submit]');await visibleCoach('unchanged wrong answer can be checked again');
   const repeated=await js(`const{stateFor}=await import('./js/lesson-player.js');const s=stateFor('7-1','together');return{tries:s.items.g1.tries,attempts:s.history.items['together:g1'].attempts,help:s.items.g1.help};`);
   assert.equal(repeated.tries,before.item.tries+1);assert.equal(repeated.attempts,before.history.attempts+1);assert.equal(repeated.help,before.item.help);
  }
 }
 passed++;console.log('ok: real phone pointer Check/Help/Next Help near y760 reveals whole coach+focus; Try again shows original+response and preserves history, identical wrong retry counts');
 // Paired visual evidence is essential to compare piece sizes or preserve area while joining.
 const pairGeometry=async selector=>js(`const scope=document.querySelector(${JSON.stringify(selector)});const within=e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth;};return [...scope.querySelectorAll('.coach-model figure')].map(f=>{const rects=[...f.querySelectorAll('svg rect')],r=rects.map(e=>e.getBoundingClientRect());return{caption:f.querySelector('figcaption')?.textContent,parts:rects.length,width:Math.max(...r.map(q=>q.right))-Math.min(...r.map(q=>q.left)),height:Math.max(...r.map(q=>q.bottom))-Math.min(...r.map(q=>q.top)),pieceWidth:r[0].width,selected:rects.filter(e=>e.getAttribute('fill')==='#583084').length,highlightArea:rects.reduce((n,e)=>{const q=e.getBoundingClientRect();return n+(e.getAttribute('fill')==='#583084'?q.width*q.height:0);},0),visible:within(f)};});`);
 const assertPair=async(selector,models,{fit=true,join=false}={})=>{
  const g=await pairGeometry(selector);assert.equal(g.length,2,'both reference wholes survive the active teaching state');
  assert.ok(Math.abs(g[0].width-g[1].width)<.1&&Math.abs(g[0].height-g[1].height)<.1,'same whole has same actual CSS dimensions');
  for(let i=0;i<2;i++){assert.equal(g[i].parts,models[i].parts);assert.equal(g[i].selected,models[i].selected.length);assert.equal(g[i].caption,models[i].caption);assert.ok(Math.abs(g[i].pieceWidth/g[i].width-1/models[i].parts)<.001,'actual highlighted piece widths follow the equal partition');if(fit)assert.ok(g[i].visible,'each whole fully visible in phone viewport');}
  if(join){assert.equal(g[0].parts,2*g[1].parts,'joining pairs halves the part count');assert.ok(Math.abs(g[0].highlightArea-g[1].highlightArea)<.5,'joining preserves the highlighted area');if(g[0].selected===2)assert.equal(g[1].selected,1,'two old pieces visibly become one new piece');}
  return g;
 };
 for(const index of [16,17,19]){
  const item=L.try.items[index],join=index===19;
  for(const [option,o]of item.options.entries()){
   await at('try',index);await b.clickAt(`input[name=choice][value="${option}"]`);await bottomClick('form button[type=submit]');await visibleCoach(`${item.id}/${o.text}: paired feedback fits`);
   const node=o.correct?item.teaching.correct:item.teaching.wrong.find(w=>w.option===o.text);
   const g=await assertPair('[data-coach=feedback]',node.models,{join});
   if(!join)assert.ok(g[0].pieceWidth>g[1].pieceWidth,'the fewer-piece whole has a visibly wider highlighted piece');
   if(!o.correct){
    for(const step of item.teaching.steps){await bottomClick('[data-act=help]');await visibleCoach(`${item.id}: paired help fits`);await assertPair('[data-coach=help]',step.models,{join});}
   }
  }
 }
 // Joining transfer in the test exposes its second (after) reference only after submission.
 const x10=L.test.items.find(it=>it.id==='x10');
 for(const [option,o]of x10.options.entries()){
  await at('test',9);assert.equal(await js('return document.querySelectorAll("#lesson-stage figure").length'),1,'test initially shows original before-joining stimulus only');
  assert.equal(await js('return document.querySelector("#lesson-stage").textContent.includes("After joining")'),false);
  await js(`const{stateFor}=await import('./js/lesson-player.js');const{solution}=await import('./js/lib/lessons.js');const L=await(await fetch('data/lessons/7-1.json')).json(),s=stateFor('7-1','test');for(const it of L.test.items)s.items[it.id]={resp:solution(it)};`);
  await edit({choice:option});await click('[data-act=submit]');await b.clickAt('[data-test-coach=x10] summary');
  const node=o.correct?x10.teaching.correct:x10.teaching.wrong.find(w=>w.option===o.text);
  await assertPair('[data-test-coach=x10]',node.models,{fit:false,join:true});
 }
 passed++;console.log('ok: comparison and joining correct/everywrong/Help retain two equal-size wholes, scaled piece widths and conserved joining area at390px; test joining pair stays hidden until submitted');
 assert.deepEqual(b.errors,[]);assert.deepEqual(b.failures,[]);console.log(`${passed} passed, 0 failed`);
}finally{await b.close();server.close();}
