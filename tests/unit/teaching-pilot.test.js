import test from 'node:test';
import assert from 'node:assert/strict';
import { itemCard, lessonHelpSteps, countComplete, countPartsFor, teachingFeedbackFor } from '../../js/views/lesson.js';
import { helpSteps } from '../../js/lib/lessons.js';
const bar=(n=0)=>({type:'fraction',kind:'bar',parts:3,wholes:1,selected:Array.from({length:n},(_,i)=>i)});
const item={id:'pilot',type:'number',prompt:'How many parts?',model:bar(),answer:'3',hints:['Legacy generic hint.'],show:['Legacy answer 3.'],teaching:{count:{prompt:'Tap each part once.',parts:[0,1,2]},steps:[{text:'Look at the entire strip. It is one whole.',model:bar(0)},{text:'Mark each of its parts as you count.',model:bar(1)},{text:'All three parts together cover the whole.',model:bar(3)}],correct:{text:'Three parts cover the strip, so you counted all the parts.',model:bar(3)},wrong:[{text:'Look for every dividing line, not just shaded pieces.',model:bar(1)}]}};
const view=(st={},stage='together',lesson='7-1')=>itemCard({id:lesson},item,stage,{items:{pilot:st}}).s;
test('Chapter7 authored teaching is opt-in; Chapter5/6 keep legacy Help',()=>{
 const steps=lessonHelpSteps({id:'7-1'},item);assert.equal(steps[0].text,item.teaching.steps[0].text);assert.equal(steps.length,3);assert.ok(steps.every(s=>s.model));assert.equal(steps.at(-1).kind,'show');
 for(const lesson of ['5-1','6-1'])assert.deepEqual(lessonHelpSteps({id:lesson},item),helpSteps(item));
 assert.deepEqual(lessonHelpSteps({id:'7-1'},{...item,teaching:undefined}),helpSteps(item));
});
test('success and error feedback explains its local model with one connected diagram',()=>{
 for(const status of ['correct','notyet']){
  const feedback=status==='correct'?item.teaching.correct:item.teaching.wrong[0];
  const html=view({status,tries:1,resp:{answer:status==='correct'?'3':'4'},counted:[0,1,2],coachView:'feedback',teachingFeedback:feedback,say:feedback.text});
  assert.ok(html.includes('data-coach="feedback"'));assert.ok(html.includes('tabindex="-1" data-coach-heading'));assert.ok(html.includes(feedback.text));assert.equal((html.match(/<figure class="model">/g)||[]).length,1);assert.ok(!html.includes('Legacy generic hint.'));
 }
});
test('each help step changes the displayed diagram; previous prose is collapsed',()=>{
 const first=view({status:'notyet',tries:1,help:1,counted:[0,1,2],coachView:'help'});
 const next=view({status:'notyet',tries:1,help:2,counted:[0,1,2],coachView:'help'});
 assert.ok(first.includes(item.teaching.steps[0].text));assert.ok(!first.includes(item.teaching.steps[1].text));assert.ok(next.includes('Review earlier steps'));assert.ok(next.includes(item.teaching.steps[1].text));assert.notEqual(first,next);assert.equal((next.match(/<figure class="model">/g)||[]).length,1);
 const corrected=view({status:'correct',tries:2,help:2,counted:[0,1,2],coachView:'feedback',teachingFeedback:item.teaching.correct,say:item.teaching.correct.text});assert.ok(corrected.includes('data-coach="feedback"'));assert.ok(!corrected.includes('data-coach="help"'));
});
test('counting scaffold precedes and gates entry, counts every part, and is absent in tests',()=>{
 assert.deepEqual(countPartsFor({id:'7-1'},item),[0,1,2]);assert.equal(countComplete({id:'7-1'},item,{counted:[0,1]}),false);assert.equal(countComplete({id:'7-1'},item,{counted:[2,0,1]}),true);
 const html=view();assert.ok(html.indexOf('count-scaffold')<html.indexOf('count-answer-gate'));assert.ok(html.includes('<fieldset disabled'));assert.ok(html.includes('aria-pressed="false"'));
 const counted=view({counted:[0,1,2]});assert.ok(!counted.includes('count-answer-gate'));assert.ok(counted.includes('3 of 3 parts counted'));
 const testHtml=view({},'test');for(const token of ['count-scaffold','data-coach','Legacy answer','Three parts cover','Mark each'])assert.ok(!testHtml.includes(token),token);
 const legacy=view({},'together','6-1');assert.ok(!legacy.includes('count-scaffold'));assert.ok(!legacy.includes('count-answer-gate'));
});

test('authored pilot all-correct and all-wrong test results explain all ten questions only after submission',async()=>{
 const {readFileSync}=await import('node:fs');const {stageInner}=await import('../../js/views/lesson.js');const {solution}=await import('../../js/lib/lessons.js');
 const L=JSON.parse(readFileSync(new URL('../../data/lessons/7-1.json',import.meta.url)));
 const ctx={lesson:L,stage:'test',lessons:{lessons:[]},link:()=> '#math',actLink:()=> '#math',lessonLink:()=> '#math',chapterLink:()=> '#math'};
 const before=stageInner({...ctx,lessonState:{i:0,items:{},steps:{}}}).s;assert.ok(!before.includes('data-test-coach'));assert.ok(!before.includes('data-coach='));assert.ok(!before.includes('count-scaffold'));
 for(const correct of [true,false]) {
  const state={i:9,submitted:true,items:{},steps:{}};
  for(const it of L.test.items) state.items[it.id]={status:correct?'correct':'notyet',resp: correct?Object.fromEntries(Object.entries(solution(it)).map(([k,v])=>[k,String(v)])):it.type==='choice'?{choice:String(it.options.findIndex(o=>!o.correct))}:{answer:'999'}};
  const html=stageInner({...ctx,lessonState:state}).s;
  assert.equal((html.match(/data-test-coach=/g)||[]).length,10);assert.equal((html.match(/data-coach="test-review"/g)||[]).length,10);
  for(const it of L.test.items){const fb=teachingFeedbackFor({id:'7-1'},it,state.items[it.id].resp,state.items[it.id].status);assert.ok(fb?.text);assert.ok(html.includes(fb.text));}
 }
});
test('pilot Help does not repeat stale wrong-answer feedback below the current teaching diagram',()=>{
 const html=view({status:'notyet',tries:1,help:1,counted:[0,1,2],coachView:'help',say:'STALE_WRONG_TEXT',teachingFeedback:item.teaching.wrong[0]});assert.ok(!html.includes('STALE_WRONG_TEXT'));assert.equal((html.match(/data-coach=/g)||[]).length,1);
});

test('numeric misconception feedback matches whole-number response before default fallback',()=>{
 const colored={answer:'2',text:'You counted only the colored pieces.',model:bar(2)};
 const lines={answer:'4',text:'Count spaces, not dividing lines.',model:bar(0)};
 const fallback={text:'Count each part once.',model:bar(3)};
 const q={...item,teaching:{...item.teaching,wrong:[fallback,colored,lines]}};
 for(const answer of ['2',' 2 ','02','+2']) assert.equal(teachingFeedbackFor({id:'7-1'},q,{answer},'notyet'),colored);
 assert.equal(teachingFeedbackFor({id:'7-1'},q,{answer:'4'},'notyet'),lines);
 for(const answer of ['9','2oops','2.0','']) assert.equal(teachingFeedbackFor({id:'7-1'},q,{answer},'notyet'),fallback);
});
test('numeric wrong classes prioritize observed colored count and bar inside lines over magnitude',()=>{
 const entries=['tooLow','tooHigh','insideLines','selectedOnly','default'].map(when=>({when,text:when,model:bar()}));
 const q={...item,answer:'5',model:{...bar(2),parts:5},teaching:{wrong:entries}};
 const feedback=answer=>teachingFeedbackFor({id:'7-1'},q,{answer},'notyet').when;
 assert.equal(feedback('2'),'selectedOnly');assert.equal(feedback('4'),'insideLines');assert.equal(feedback('1'),'tooLow');assert.equal(feedback('9'),'tooHigh');assert.equal(feedback('bad'),'default');
 assert.equal(teachingFeedbackFor({id:'7-1'},{...q,model:{...q.model,selected:[]}}, {answer:'0'},'notyet').when,'selectedOnly');
});
test('pilot wrong and partial Help offer explicit retry; answer mode restores original picture',()=>{
 const wrong=view({status:'notyet',tries:1,counted:[0,1,2],coachView:'feedback',teachingFeedback:item.teaching.wrong[0],say:'wrong'});
 const help=view({status:'notyet',tries:1,help:1,counted:[0,1,2],coachView:'help'});
 for(const html of [wrong,help]) assert.ok(html.includes('data-act="coach-retry"'));
 assert.ok(help.includes('tabindex="-1" data-coach-heading'));
 const retry=view({status:'unanswered',tries:1,help:1,counted:[0,1,2],coachView:'answer',say:''});
 assert.ok(retry.includes('pic-card'));assert.ok(!retry.includes('data-coach='));assert.ok(retry.includes('? Show Steps'));
 const correct=view({status:'correct',tries:2,counted:[0,1,2],coachView:'feedback',teachingFeedback:item.teaching.correct,say:'correct'});
 assert.ok(!correct.includes('data-act="coach-retry"'));
});
test('paired teaching figures replace fallback and original figures in Help and feedback',()=>{
 const models=[{...bar(1),caption:'First whole'},{...bar(2),caption:'Second whole'}];
 const node={text:'Compare both pictures.',model:bar(),models};
 const q={...item,models:[bar(),bar()],teaching:{...item.teaching,steps:[node,node],correct:node,wrong:[node]}};
 for(const st of [{status:'notyet',help:1,coachView:'help'},{status:'correct',coachView:'feedback',teachingFeedback:node,say:node.text}]){
  const html=itemCard({id:'7-1'},q,'together',{items:{pilot:{tries:1,counted:[0,1,2],...st}}}).s;
  assert.equal((html.match(/<figure class="model">/g)||[]).length,2);
  assert.ok(!html.includes('pic-card'));assert.ok(html.includes('First whole'));assert.ok(html.includes('Second whole'));
 }
});
