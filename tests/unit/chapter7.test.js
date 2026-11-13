// Independent Chapter 7 acceptance checks: contracts, authored content and exact arithmetic.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateLesson, check, solution } from '../../js/lib/lessons.js';
import { chapterLessons, chapterMenu, CHAPTER_ROLES, chapterFor } from '../../js/lib/chapters.js';
import { activityInfo } from '../../js/lib/activities.js';
const read = p => JSON.parse(fs.readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8'));
const lessons = () => Array.from({length:7},(_,i)=>read(`data/lessons/7-${i+1}.json`));
const pack = () => read('data/chapters/7.json');
const allItems = l => [...l.learn.screens.flatMap(s=>s.item?[s.item]:[]),...l.watch.examples.flatMap(e=>e.why?[e.why]:[]),...l.together.items,...l.try.items,...l.test.items];
const canonical = v => Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
// The picture, answer task and answer/options are the substance; changing an id or story name is not a new scored question.
const signature = it => JSON.stringify(canonical({type:it.type,model:it.model,models:it.models,asks:it.asks,answerPolicy:it.answerPolicy,intent:it.intent,answer:it.answer,options:it.options?.map(o=>({text:o.text,correct:Boolean(o.correct)})).sort((a,b)=>a.text.localeCompare(b.text))}));

test('Chapter 7 inventory: seven complete lessons, separate practice and ten-question tests',()=>{
 const ls=lessons();assert.deepEqual(ls.map(l=>l.id),['7-1','7-2','7-3','7-4','7-5','7-6','7-7']);
 for(const l of ls){assert.deepEqual(validateLesson(l,l.id),[],l.id);assert.ok(l.watch.examples.length>=3,`${l.id}: at least three worked examples`);assert.equal(l.together.items.length,6,`${l.id}: six guided`);assert.equal(l.try.items.length,20,`${l.id}: twenty independent`);assert.equal(l.test.items.length,10,`${l.id}: ten scored`);assert.ok([...l.try.items,...l.test.items].every(it=>it.type!=='sentence'),`${l.id}: written explanations remain ungraded`);assert.equal(l.learn.screens.filter(s=>s.item?.type==='sentence').length,1,`${l.id}: one ungraded written checkpoint`);
 assert.equal(new Set(l.test.items.map(signature)).size,10,`${l.id}: distinct scored tasks`);
 const practice=new Set([...l.together.items,...l.try.items].map(signature));for(const it of l.test.items)assert.ok(!practice.has(signature(it)),`${l.id} ${it.id}: scored question repeats practice`);
 }
});

test('Chapter 7 vocabulary preserves all four exact teacher definitions and distinguishes chapter review',()=>{
 const p=pack(),teacher=read('data/2026-11-09.json').mathUpcoming.words;const words=p.vocabulary;
 assert.equal(words.filter(w=>w.source==='teacher').length,4);
 for(const w of teacher){const here=words.find(x=>x.word.toLowerCase()===w.word.toLowerCase());assert.ok(here,w.word);assert.equal(here.def,w.def,w.word);assert.equal(here.source,'teacher',w.word);}
 for(const name of ['partition','fraction tiles'])assert.equal(words.find(w=>w.word.toLowerCase()===name)?.source,'review',name);
 assert.equal(read('data/2026-11-09.json').tests.filter(t=>t.kind==='math').length,0,'newsletter never announced a Math quiz');
});

test('Chapter 7 cumulative assessment:28 original questions, four from each lesson, practice provenance',()=>{
 const p=pack();assert.equal(p.test.items.length,28);assert.equal(p.test.pass,23);assert.match(p.test.note,/practice|Study Scoop/i);assert.match(p.test.note,/not|rather than/i);
 for(let i=1;i<=7;i++)assert.equal(p.test.items.filter(it=>it.skill===`l7${i}`).length,4,`lesson7-${i}`);
 const practice=new Set([...p.practice.items,...lessons().flatMap(l=>[...l.together.items,...l.try.items])].map(signature));
 for(const it of p.test.items)assert.ok(!practice.has(signature(it)),`${it.id}: cumulative test repeats practice`);
 assert.equal(new Set(p.test.items.map(it=>it.id)).size,28);
 assert.equal(new Set(p.test.items.map(signature)).size,28,'distinct cumulative scored tasks');
});

test('Chapter 7 registry exposes six roles and every registered child remains in Chapter 7',()=>{
 const idx=read('data/lessons/index.json');assert.deepEqual(chapterLessons(idx,7).map(l=>l.id),['7-1','7-2','7-3','7-4','7-5','7-6','7-7']);assert.deepEqual(chapterMenu(7).map(r=>r.role),CHAPTER_ROLES.map(r=>r.role));
 for(const role of chapterMenu(7)){assert.equal(chapterFor(idx,{act:role.act.id})?.id,7);if(role.act.parent)assert.equal(activityInfo('math',role.act.parent)?.chapter,7);}
 assert.equal(chapterFor(idx,{lesson:'7-6'})?.id,7);assert.equal(chapterFor(idx,{ch:5})?.id,5);assert.equal(chapterFor(idx,{ch:6})?.id,6);
});

import { validFraction, equalFractions, parseFraction, fractionModelProblems, fractionOfModel, checkFraction, fractionItemProblems, rationalChainHolds, wrongFractionFactsInText } from '../../js/lib/fractions.js';
import { fractionSvg, describeFraction } from '../../js/lib/fraction-models.js';
import { modelFigure } from '../../js/lib/models.js';

test('exact fraction grading distinguishes value answers from the requested partition',()=>{
 const base={type:'fraction',asks:'fraction',model:{type:'fraction',kind:'bar',parts:4,selected:[0,1]},answer:{n:2,d:4}};
 const value={...base,answerPolicy:'value'},partition={...base,answerPolicy:'partition'};
 for(const [n,d] of [['1','2'],['2','4'],['3','6'],['4999','9998']])assert.equal(checkFraction(value,{n,d}).status,'correct',`${n}/${d}`);
 assert.equal(checkFraction(partition,{n:'1',d:'2'}).status,'notyet');assert.equal(checkFraction(partition,{n:'2',d:'4'}).status,'correct');
 assert.equal(checkFraction(value,{n:'',d:'2'}).status,'empty');assert.equal(checkFraction(value,{n:'1',d:''}).status,'empty');assert.equal(checkFraction(value,{n:'1',d:'0'}).status,'notyet');
 for(const bad of ['-1','1.5','1e2','Infinity','NaN'])assert.notEqual(checkFraction(value,{n:bad,d:'2'}).status,'correct',bad);
 assert.equal(checkFraction(value,{n:'1',d:'3'}).status,'notyet');assert.equal(validFraction({n:1,d:0}),false);assert.equal(validFraction({n:-1,d:2}),false);assert.equal(equalFractions({n:1,d:0},{n:2,d:0}),false);
 assert.deepEqual(parseFraction(' 02 / 04 '),{n:2,d:4});assert.equal(parseFraction('1/0'),null);assert.equal(parseFraction('1/2/3'),null);
 assert.deepEqual(check(value,{n:'1',d:'2'}),checkFraction(value,{n:'1',d:'2'}),'shared lesson checker uses the fraction contract');
 assert.deepEqual(solution(value),{n:2,d:4});
});

test('fraction model fixtures preserve proper, whole, n/1, greater-than-one, unequal and twelve-object cases',()=>{
 const fixtures=[
 [{type:'fraction',kind:'bar',parts:4,selected:[0,2]},{n:2,d:4}],
 [{type:'fraction',kind:'circle',parts:6,selected:[0,1,2,3,4,5]},{n:6,d:6}],
 [{type:'fraction',kind:'bar',parts:1,wholes:3,selected:[0,1,2]},{n:3,d:1}],
 [{type:'fraction',kind:'bar',parts:4,wholes:2,selected:[0,1,2,3,4]},{n:5,d:4}],
 [{type:'fraction',kind:'line',parts:3,max:4,point:10},{n:10,d:3}],
 [{type:'fraction',kind:'set',parts:12,selected:[4,9]},{n:2,d:12}]
 ];
 for(const [m,f] of fixtures){assert.deepEqual(fractionModelProblems(m),[]);assert.deepEqual(fractionOfModel(m),f);const svg=fractionSvg(m);assert.match(svg,/<svg/);assert.doesNotMatch(svg,/NaN|undefined|Infinity/);const wrapped=modelFigure(m).s;assert.match(wrapped,/role="img"/);assert.match(wrapped,/aria-label=/);assert.ok(!describeFraction(m).includes(`${f.n}/${f.d}`),'accessible observation does not give the computed fraction');}
 const unequal={type:'fraction',kind:'bar',parts:3,weights:[1,2,1],selected:[0]};assert.deepEqual(fractionModelProblems(unequal),[]);assert.throws(()=>fractionOfModel(unequal),/Unequal/);
 for(const m of [{type:'fraction',kind:'bar',parts:4,selected:[4]},{type:'fraction',kind:'bar',parts:4,selected:[0,0]},{type:'fraction',kind:'line',parts:3,max:2,point:7},{type:'fraction',kind:'set',parts:12,wholes:2,selected:[0]},{type:'fraction',kind:'circle',parts:0,selected:[]}]){assert.ok(fractionModelProblems(m).length,JSON.stringify(m));assert.throws(()=>fractionOfModel(m));}
});

test('SVG geometry independently matches selected-part counts and beyond-one tick positions',()=>{
 const attrs=s=>Object.fromEntries([...s.matchAll(/([a-z][a-z0-9-]*)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
 for(const parts of [1,2,3,4,6,8])for(const wholes of [1,2,3]){
  const total=parts*wholes,n=Math.max(1,total-1),selected=Array.from({length:n},(_,i)=>i),m={type:'fraction',kind:'bar',parts,wholes,selected};const svg=fractionSvg(m);const rects=[...svg.matchAll(/<rect\b[^>]*>/g)].map(a=>attrs(a[0]));
  assert.equal(rects.length,total);assert.equal(rects.filter(r=>r.fill==='#583084').length,n);assert.ok(rects.every(r=>Math.abs(Number(r.width)-300/parts)<1e-10),'all equal widths');
  for(let w=0;w<wholes;w++)assert.ok(Math.abs(rects.slice(w*parts,(w+1)*parts).reduce((a,r)=>a+Number(r.width),0)-300)<1e-9,'every whole has the same width');
 }
 for(const parts of [1,2,3,4,6,8])for(const max of [1,2,3,4])for(const point of [0,1,parts*max]){
  const svg=fractionSvg({type:'fraction',kind:'line',parts,max,point}),lines=[...svg.matchAll(/<line\b[^>]*>/g)].map(a=>attrs(a[0])),ticks=lines.filter(l=>l.x1===l.x2),dot=attrs(svg.match(/<circle\b[^>]*>/)[0]);assert.equal(ticks.length,parts*max+1);
  for(let i=0;i<ticks.length;i++)assert.ok(Math.abs(Number(ticks[i].x1)-(20+520*i/(parts*max)))<1e-9,'equal physical intervals');
  assert.ok(Math.abs(Number(dot.cx)-(20+520*point/(parts*max)))<1e-9,'point is placed at the requested tick');
 }
 const set=fractionSvg({type:'fraction',kind:'set',parts:12,selected:[0,1,7]});const objects=[...set.matchAll(/<circle\b[^>]*r="15"[^>]*>/g)].map(x=>attrs(x[0]));assert.equal(objects.length,12);assert.equal(objects.filter(x=>x.fill==='#583084').length,3);
});

test('fraction validators independently reject altered answers and equivalent duplicate options',()=>{
 const model={type:'fraction',kind:'bar',parts:4,selected:[0,1]},item={type:'fraction',asks:'fraction',model,answer:{n:2,d:4},answerPolicy:'partition'};assert.deepEqual(fractionItemProblems(item),[]);
 assert.ok(fractionItemProblems({...item,answer:{n:3,d:4}}).some(e=>/match/.test(e)));
 const choice={type:'choice',asks:'fraction',model,options:[{text:'1/2',correct:true},{text:'2/4',correct:true},{text:'1/4'}]};assert.ok(fractionItemProblems(choice).some(e=>/duplicate/.test(e)));
 assert.ok(rationalChainHolds('2/4 = 1/2'));assert.ok(rationalChainHolds('5/4 = 1 + 1/4'));assert.ok(!rationalChainHolds('1/2 = 1/3'));assert.ok(!rationalChainHolds('1/0 = 2/0'));assert.ok(!rationalChainHolds('1/2 = alert(1)'));
 assert.deepEqual(wrongFractionFactsInText('Half is 1/2 = 2/4.'),[]);assert.ok(wrongFractionFactsInText('Wrong: 1/2 = 1/3.').length);
});

test('the seven source objectives are represented by taught models and appropriately scoped denominators',()=>{
 const ls=lessons();const models=l=>{const out=[];const walk=(x,nonExample=false)=>{if(!x||typeof x!=='object')return;if(x.type==='fraction'&&x.kind)out.push({...x,auditCorrectionNonExample:nonExample});for(const [key,v] of Object.entries(x)){if(key==='wrong'&&Array.isArray(v))v.forEach(node=>walk(node,node?.nonExample===true));else if(typeof v==='object')walk(v,nonExample);}};walk(l);return out;};
 const m=ls.map(models);
 assert.ok(m[0].some(x=>x.weights&&new Set(x.weights).size>1),'7-1 unequal-area nonexample');assert.ok(new Set(m[0].map(x=>x.kind)).size>=2,'7-1 different valid shape representations');
 assert.ok(m[1].some(x=>x.selected?.length===1),'7-2 unit fractions');assert.ok(m[1].some(x=>x.selected?.length>1&&x.selected.length<x.parts),'7-2 proper nonunit fractions');
 assert.ok(m[2].some(x=>x.kind==='line'&&x.point>0&&x.point<x.parts),'7-3 proper fraction number line');
 assert.ok(m[3].some(x=>x.kind==='line'&&x.point===x.parts),'7-4 one-whole number line');assert.ok(m[3].some(x=>x.selected?.length===x.parts),'7-4 b/b model');
 assert.ok(m[4].some(x=>x.parts===1&&(x.wholes??1)>1),'7-5 n/1 multiple wholes');assert.ok(m[4].some(x=>x.kind==='line'&&x.parts===1&&x.point>1),'7-5 whole-number line');
 assert.ok(m[5].some(x=>x.kind==='line'&&x.point>x.parts&&x.max>=3),'7-6 line beyond one and extending through three');
 assert.ok(pack().practice.items.some(x=>x.skill==='l76'&&/4/.test(x.prompt)&&/less than|greater than/.test(x.prompt)),'7-6 comparison to whole number four');
 for(const d of [5,10,12])assert.ok(m[6].some(x=>x.kind==='set'&&x.parts===d),`7-7 set denominator${d}`);
 assert.ok(m[6].some(x=>x.kind==='set'&&x.selected.length===1),'7-7 one object');assert.ok(m[6].some(x=>x.kind==='set'&&x.selected.length>1),'7-7 selected/uncompleted object extension');
 for(const [index,here] of m.entries())for(const model of here){if(model.kind==='set')assert.ok([2,3,4,5,6,8,10,12].includes(model.parts),'set denominator scope');else if(model.auditCorrectionNonExample && index===0 && model.kind==='bar')assert.ok([2,3,4,5,6,7,8,9].includes(model.parts),'7-1 wrong-cut correction counts pieces without naming new fraction units');else assert.ok([1,2,3,4,6,8].includes(model.parts),'area/line denominator scope');}
});

test('every authored fraction key is independently derivable from geometry and scored tests have no hints',()=>{
 const p=pack(),items=[...lessons().flatMap(allItems),...p.practice.items,...p.test.items];
 for(const it of items){
  if(it.type==='fraction'){const m=it.model,n=m.kind==='line'?m.point:m.selected.length,d=m.parts;assert.equal(BigInt(it.answer.n)*BigInt(d),BigInt(n)*BigInt(it.answer.d),`${it.id}: exact geometry value`);if(it.answerPolicy==='partition')assert.deepEqual(it.answer,{n,d},`${it.id}: requested displayed partition`);assert.equal(check(it,Object.fromEntries(Object.entries(it.answer).map(([k,v])=>[k,String(v)]))).status,'correct',it.id);}
 }
 for(const l of lessons())for(const it of l.test.items)assert.ok(!it.hints,`${l.id} ${it.id}: no test hints`);
 for(const it of p.test.items){assert.ok(!it.hints&&!it.show,`${it.id}: no scored-test help`);assert.ok(!it.id.startsWith('f'),'fluency is separate');}
 for(const l of lessons())for(const word of read('data/2026-11-09.json').mathUpcoming.words)assert.equal(l.teacher.find(t=>t.term===word.word)?.def,word.def,`${l.id} ${word.word}`);
});

import { fractionVocabItems, fractionPracticeItems, validateFractionChapter } from '../../js/lib/chapter7.js';
import { rng } from '../../js/lib/activities.js';

test('chapter-owned vocabulary generates twenty distinct, valid questions per mode without dropping teacher text',()=>{
 const p=pack();assert.deepEqual(validateFractionChapter(p,read('data/2026-11-09.json').mathUpcoming.words),[]);
 for(const mode of ['choice','truefalse','fill']){
  const items=fractionVocabItems(p,mode,rng(2027));assert.equal(items.length,20);assert.equal(new Set(items.map(q=>q.prompt)).size,20);
  for(const it of items){const term=p.vocabulary.find(w=>w.word===it.word);assert.ok(it.explain.includes(term.def),'definition is preserved exactly in feedback');assert.equal(check(it,Object.fromEntries(Object.entries(solution(it)).map(([k,v])=>[k,String(v)]))).status,'correct',it.id);if(it.type==='choice'){assert.equal(it.options.filter(o=>o.correct).length,1);assert.equal(new Set(it.options.map(o=>o.text)).size,it.options.length);}}
  if(mode==='choice')for(const it of items.slice(6,10)){assert.ok(it.prompt.includes('___'),'definition cue masks target term');assert.ok(!it.prompt.toLowerCase().includes(it.word.toLowerCase()),`${it.id}: term retrieval does not state its answer`);}
  if(mode==='truefalse'){assert.ok(items.some(q=>q.truth)&&items.some(q=>!q.truth),'both true and false statements');}
 }
 const wrong=structuredClone(p);wrong.vocabulary.find(w=>w.source==='teacher').def+=' altered';assert.ok(validateFractionChapter(wrong,read('data/2026-11-09.json').mathUpcoming.words).some(x=>/mismatch/.test(x)),'changed teacher definition fails validation');
 for(const act of ['fchoice','ftf','ffill'])assert.ok(fractionPracticeItems(p,act,rng(3)).length>0,`${act} is not an empty activity`);
});

import { runFor } from '../../js/activity-player.js';
import { activityInner } from '../../js/views/activity.js';

test('late chapter resources replace an unavailable cached run and chapter history spans practice subsets',()=>{
 const ctx={weekId:'chapter7-late-resource-audit',week:read('data/2026-11-09.json'),chapter:{id:7},fractions:null};
 assert.equal(runFor(ctx,'math','fpractice').unavailable,true);
 ctx.fractions=pack();const loaded=runFor(ctx,'math','fpractice');assert.ok(!loaded.unavailable);assert.equal(loaded.items.length,ctx.fractions.practice.items.length);
 const subset=runFor(ctx,'math','ffill');assert.equal(subset.history,loaded.history,'same chapter group preserves assistance across practice menus');
 const vocab=runFor(ctx,'math','fvchoice');assert.notEqual(vocab.history,loaded.history,'vocabulary assistance is a separate group');
 assert.deepEqual(loaded.items_,{});loaded.items[0].prompt='private mutation';assert.notEqual(ctx.fractions.practice.items.find(x=>x.id===loaded.items[0].id).prompt,'private mutation','practice state cannot rewrite authored data');
});

test('prior assistance remains visible separately from a clean current-round score, including test miss IDs',()=>{
 const it=pack().test.items[0], run={chapter:7,subject:'math',act:'fmisses',mode:'practice',i:0,items:[{...it,id:`test-${it.id}`}],items_:{},history:{[it.id]:{help:2,revealed:true,checks:3}}};
 const ctx={run,actLink:()=> '#math',link:()=> '#math',week:read('data/2026-11-09.json')};
 let out=activityInner(ctx).s;assert.match(out,/For grown-ups, this visit/);assert.match(out,/1 question used Help, and 1 answer was shown/);assert.match(out,/this round only/);assert.deepEqual(run.items_,{},'history never manufactures a current answer');
 run.finished=true;run.items_[`test-${it.id}`]={first:'correct',status:'correct',resp:solution(it)};
 out=activityInner(ctx).s;assert.match(out,/1 question used Help, and 1 answer was shown/);assert.match(out,/Every answer was right on the first try/,'current-round score stays separate from earlier assistance');
});
