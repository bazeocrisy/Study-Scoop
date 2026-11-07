// Exhaustive path/geometry/grading contracts. Semantic teaching judgments are documented independently.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {html as escapeHtml} from '../../js/lib/html.js';
import {fractionVocabItems} from '../../js/lib/chapter7.js';
import {check,solution} from '../../js/lib/lessons.js';
import {fractionModelProblems} from '../../js/lib/fractions.js';
import {itemCard,teachingFeedbackFor,lessonHelpSteps} from '../../js/views/lesson.js';
import {teachingItems,teachingResponses} from '../lib/teaching-probes.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(`../../${p}`,import.meta.url)));
const lessons=Array.from({length:7},(_,i)=>read(`data/lessons/7-${i+1}.json`)),pack=read('data/chapters/7.json');
const all=[...lessons.flatMap(lesson=>teachingItems(lesson).map(r=>({...r,lesson,label:`${lesson.id}/${r.stage}/${r.item.id}`}))),...['choice','truefalse','fill'].flatMap(mode=>fractionVocabItems(pack,mode,()=>.37).map(item=>({item,stage:'vocabulary',lesson:{chapter:7},label:`resources/vocabulary/${item.id}`}))),...['practice','test'].flatMap(stage=>pack[stage].items.map(item=>({item,stage,lesson:{chapter:7,id:'chapter-7'},label:`resources/${stage}/${item.id}`})))];
const models=node=>node?.models?.length?node.models:node?.model?[node.model]:[];

test('all Chapter7 lesson and resource correct/wrong/blank/invalid response classes grade and deliver local explanations',()=>{
 let paths=0,wrong=0,empty=0;
 for(const {item,lesson,label} of all){
  assert.ok(item.teaching,`${label}: visual explanation contract`);
  for(const probe of teachingResponses(item)){
   const result=check(item,probe.response,lesson);assert.equal(result.status,probe.status,`${label}/${probe.name}: independently expected grading`);
   if(result.status==='empty'){empty++;continue;}
   const node=teachingFeedbackFor(lesson,item,probe.response,result.status);assert.ok(node,`${label}/${probe.name}: authored route exists`);assert.ok(models(node).length,`${label}/${probe.name}: observable model exists`);
   for(const m of models(node))assert.deepEqual(fractionModelProblems(m),[],`${label}/${probe.name}: model arithmetic valid`);
   if(item.type==='choice'&&result.status==='notyet')assert.equal(node.option,item.options[Number(probe.response.choice)].text,`${label}: exact wrong-option route`);
   const state={...result,resp:probe.response,tries:1,counted:item.teaching.count?.parts||[],coachView:'feedback',teachingFeedback:node,say:node.text};
   const html=itemCard(lesson,item,'together',{items:{[item.id]:state}}).s;
   assert.ok(html.includes('data-coach="feedback"'),`${label}/${probe.name}: actual shared renderer delivers feedback`);
   assert.ok(html.includes(escapeHtml`${node.text}`.s),`${label}/${probe.name}: authored explanation reaches DOM markup`);
   paths++;if(result.status==='notyet')wrong++;
  }
 }
 console.log(`Chapter7 teaching: ${all.length} items, ${paths} rendered nonempty paths (${wrong} wrong), ${empty} empty/invalid checks.`);
});

test('all scored lesson and cumulative tests hide answer-bearing teaching even with contaminated assistance state',()=>{
 for(const {item,lesson,label,stage}of all.filter(r=>r.stage==='test')){
  const node=item.teaching.correct,state={status:'correct',resp:solution(item),shown:true,help:99,coachView:'feedback',teachingFeedback:node,counted:item.teaching.count?.parts||[]};
  const html=itemCard(lesson,item,'test',{items:{[item.id]:state}}).s;
  for(const token of ['data-coach=','data-act="count-part"','data-act="help"',node.text])assert.ok(!html.includes(token),`${label}: withheld ${token}`);
 }
});

test('every authored Help model validates and changes the relevant evidence across the sequence',()=>{
 for(const {item,lesson,label}of all){const steps=lessonHelpSteps(lesson,item);assert.ok(steps.length>=2,label);const pictures=steps.map(s=>models(s));for(const set of pictures){assert.ok(set.length,label);for(const m of set)assert.deepEqual(fractionModelProblems(m),[],label);}assert.ok(new Set(pictures.map(x=>JSON.stringify(x))).size>=2,`${label}: instruction has a changed picture, not the same finished model throughout`);}
});

test('cumulative assessment does not reuse a lesson assessment geometry and answer task after recoloring or extending the line',()=>{
 const normalize=m=>m?{kind:m.kind,parts:m.parts,wholes:m.wholes||1,...(m.kind==='line'?{point:m.point}:{selected:m.selected?.length||0}),layout:m.layout}:null;
 const signature=it=>JSON.stringify({type:it.type,asks:it.asks,policy:it.answerPolicy,answer:it.answer??it.options?.find(o=>o.correct)?.text,models:(it.models||[it.model]).map(normalize)});
 const lessonTests=new Map(lessons.flatMap(l=>l.test.items.map(it=>[signature(it),`${l.id}/${it.id}`])));
 for(const it of pack.test.items)assert.ok(!lessonTests.has(signature(it)),`${it.id}: repeats ${lessonTests.get(signature(it))}`);
});

test('remaining-gap transfer counts only intervals from its given starting point, while a value-policy whole accepts equivalent names',()=>{
 const remaining=pack.test.items.find(it=>it.id==='x301');assert.equal(remaining.type,'number');assert.equal(Number(remaining.answer),remaining.model.parts-remaining.model.point,'independent endpoint interval count');
 const last=remaining.teaching.steps.at(-1),expected=Array.from({length:remaining.model.parts-remaining.model.point},(_,i)=>remaining.model.point+i);assert.deepEqual(last.model.counted,expected,'visual evidence counts the remaining gaps rather than the trip from zero');
 const value=lessons[3].try.items.find(it=>it.type==='fraction'&&it.answerPolicy==='value');assert.ok(value,'accepted whole-value practice remains authored');
 for(const response of [{n:'1',d:'1'},{n:'2',d:'2'},{n:'7',d:'7'}]){assert.equal(check(value,response,lessons[3]).status,'correct');assert.equal(teachingFeedbackFor(lessons[3],value,response,'correct'),value.teaching.correct,'equivalent whole names receive the success explanation');}
 assert.ok(!value.teaching.wrong.some(n=>n.when==='equivalentPartition'),'value question cannot teach an irrelevant shown-partition restriction');
});
