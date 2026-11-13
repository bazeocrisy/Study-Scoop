// These checks establish reachable/rendered teaching paths, not the semantic merit of every explanation.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { check, solution } from '../../js/lib/lessons.js';
import { fractionModelProblems } from '../../js/lib/fractions.js';
import { itemCard, teachingFeedbackFor, lessonHelpSteps } from '../../js/views/lesson.js';
const L=JSON.parse(fs.readFileSync(new URL('../../data/lessons/7-1.json',import.meta.url)));
const items=[...L.learn.screens.flatMap(s=>s.item&&s.item.type!=='sentence'?[{stage:'learn',item:s.item}]:[]),...L.watch.examples.flatMap(e=>e.why?[{stage:'watch',item:e.why}]:[]),...['together','try','test'].flatMap(stage=>L[stage].items.map(item=>({stage,item})))];
const st=(item,response)=>{const r=check(item,response,L),f=teachingFeedbackFor(L,item,response,r.status);return {...r,resp:response,tries:1,counted:item.teaching?.count?.parts||[],coachView:'feedback',teachingFeedback:f};};
const render=(item,state,stage='together')=>itemCard(L,item,stage,{items:{[item.id]:state}}).s;

test('every pilot objective has renderable local correct and wrong explanation paths, all wrong choices included',()=>{
 let wrongs=0;
 for(const {stage,item} of items){
  assert.ok(item.teaching,`${stage}/${item.id}: authored teaching exists`);
  const correct=st(item,solution(item));assert.equal(correct.status,'correct');assert.ok(correct.teachingFeedback,`${stage}/${item.id}: correct feedback resolves`);
  assert.deepEqual(fractionModelProblems(correct.teachingFeedback.model),[],`${item.id}: correct model valid`);
  assert.ok(render(item,correct).includes('data-coach="feedback"'),`${item.id}: local correct visual is rendered`);
  const responses=item.type==='choice'?item.options.flatMap((o,i)=>o.correct?[]:[{choice:String(i)}]):[...Array.from({length:Number(item.answer)+2},(_,n)=>String(n)),'999','0001'].filter(n=>Number(n)!==Number(item.answer)).map(answer=>({answer}));
  for(const response of responses){const s=st(item,response);assert.equal(s.status,'notyet',`${item.id}: wrong probe ${JSON.stringify(response)}`);assert.ok(s.teachingFeedback,`${item.id}: all wrong paths resolve`);assert.deepEqual(fractionModelProblems(s.teachingFeedback.model),[],`${item.id}: wrong explanation model valid`);if(item.type==='number'){const n=Number(response.answer),expected=n===item.model.selected.length?'selectedOnly':item.model.kind==='bar'&&n===item.model.parts-1?'insideLines':n<Number(item.answer)?'tooLow':'tooHigh';assert.equal(s.teachingFeedback.when,expected,`${item.id}: observed count class ${response.answer}`);}
  const html=render(item,s);assert.ok(html.includes(s.teachingFeedback.text),`${item.id}: selected wrong reason reaches rendered feedback`);assert.equal((html.match(/data-coach="feedback"/g)||[]).length,1);if(item.type==='choice')assert.equal(s.teachingFeedback.text,item.options[Number(response.choice)].why,`${item.id}: selected distractor explanation, not another option's reason`);wrongs++;}
 }
 assert.ok(wrongs>0);console.log(`Pilot exhaustive rendering: ${items.length} items, ${wrongs} wrong paths.`);
});

test('test items suppress all instructional layers before submission even with contaminated help state',()=>{
 for(const item of L.test.items){const state=st(item,solution(item));Object.assign(state,{help:3,shown:true,counted:[0,1,2]});const html=render(item,state,'test');for(const token of ['data-coach=','count-scaffold','data-act="help"','data-act="count-part"',item.teaching.correct.text,...item.teaching.steps.map(s=>s.text)])assert.ok(!html.includes(token),`${item.id}: test hides ${token}`);}
});

test('all help diagrams and Watch diagrams change across authored steps without changing the original question',()=>{
 for(const {item}of items){const initial=JSON.stringify(item.model),steps=lessonHelpSteps(L,item);assert.ok(steps.length>=2,item.id);assert.ok(new Set(steps.map(s=>JSON.stringify(s.model))).size>=2,`${item.id}: help changes from whole/context to a worked part view`);for(const step of steps)assert.deepEqual(fractionModelProblems(step.model),[],item.id);assert.equal(JSON.stringify(item.model),initial);}
 for(const ex of L.watch.examples){assert.equal(new Set(ex.steps.map(s=>JSON.stringify(s.model))).size,ex.steps.length,`${ex.title}: Watch changes geometry/selection each step`);for(const step of ex.steps)assert.deepEqual(fractionModelProblems(step.model),[],ex.title);}
});

import { modelFigure } from '../../js/lib/models.js';
test('shared modelFigure preserves orientation and count annotations used by the teaching views',()=>{
 const column={type:'fraction',kind:'bar',parts:2,wholes:1,selected:[0]},row={...column,layout:'rows'},counted={...column,counted:[1,0]};
 const rows=modelFigure(row).s,columns=modelFigure(column).s,marked=modelFigure(counted).s;
 assert.notEqual(rows,columns,'top/bottom partition reaches the actual shared renderer');
 assert.match(rows,/size 1/,'accessible geometry describes horizontal parts');
 assert.match(marked,/data-count-marker="1"/);assert.match(marked,/data-count-marker="2"/);assert.match(marked,/count marker 1/);
});

test('paired comparison and joining explanations preserve the mathematical reference whole',()=>{
 for(const id of ['t17','t18','t20','x10']){
  const item=[...L.try.items,...L.test.items].find(x=>x.id===id),joining=['t20','x10'].includes(id);
  for(const node of [item.teaching.correct,...item.teaching.wrong,...item.teaching.steps]){
   assert.equal(node.models.length,2,`${id}: both before/reference and after/comparison states`);
   for(const m of node.models){assert.deepEqual(fractionModelProblems(m),[]);assert.equal(m.wholes,1);assert.equal(m.kind,'bar');}
   const [a,b]=node.models;
   assert.equal(b.parts,joining?a.parts/2:a.parts*2,`${id}: expected partition relationship`);
   if(joining)assert.equal(a.selected.length*b.parts,b.selected.length*a.parts,`${id}: highlighted fraction area is unchanged`);
   else if(a.selected.length&&b.selected.length){assert.equal(a.selected.length,1);assert.equal(b.selected.length,1);assert.ok(1/a.parts>1/b.parts,'larger denominator gives smaller piece of same whole');}
  }
 }
});
