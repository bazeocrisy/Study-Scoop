import test from 'node:test';
import assert from 'node:assert/strict';
import { stateFor, updateWrittenResponse, compareWrittenResponse, reviewWrittenResponse, updateWrittenChecks, completedLessonStage, visitedStages } from '../../js/lesson-player.js';
import { itemCard, stageInner } from '../../js/views/lesson.js';
const item={id:'review',type:'sentence',prompt:'Explain how you know.',starter:'I think...',example:'The parts cover the same amount of the whole.'};
test('Chapter 7 explanation review uses the response revision, not grammar or keyword meaning grading',()=>{
 const st={resp:{text:''}};assert.equal(compareWrittenResponse(st,item),false);
 updateWrittenResponse(st,item.starter);assert.equal(compareWrittenResponse(st,item),false);
 updateWrittenResponse(st,'my own reasoning');assert.equal(compareWrittenResponse(st,item),true);assert.equal(st.status,'compared');
 assert.equal(reviewWrittenResponse(st),false);st.reviewChecks={whole:true,reason:true,compare:true};assert.equal(reviewWrittenResponse(st),true);
 assert.equal(st.status,'correct');assert.equal(st.reviewedRevision,st.revision);
 updateWrittenResponse(st,'my revised reasoning');assert.equal(st.reviewedRevision,undefined);assert.equal(st.comparedRevision,undefined);assert.equal(st.status,undefined);assert.equal(reviewWrittenResponse(st),false);
});
test('Chapter 7 written UI is editable, offers an honest checklist and never says computer-correct',()=>{
 const st={resp:{text:'own reasoning'},revision:1,comparedRevision:1,reviewChecks:{}};
 const html=itemCard({id:'7-1'},item,'learn',{items:{review:st}}).s;
 assert.ok(html.includes('data-review-check="whole"'));assert.ok(html.includes('data-review-check="reason"'));assert.ok(html.includes('data-review-check="compare"'));assert.ok(html.includes('data-act="review-written"'));assert.ok(!html.includes('readonly'));assert.ok(!html.includes('Check Answer'));assert.ok(html.includes('does not grade its mathematical meaning'));
});
test('Chapter 7 tab history is shared by lesson stages but isolated from other lessons and legacy chapters',()=>{
 const a=stateFor('7-1','try'),b=stateFor('7-1','parent'),c=stateFor('7-2','try');
 assert.equal(a.history,b.history);assert.notEqual(a.history,c.history);assert.equal(stateFor('6-1','try').history,undefined);
 a.history.items['try:probe']={attempts:2,help:1,reveals:1};const history=a.history;Object.assign(a,{i:0,items:{},steps:{},streak:0,submitted:false});assert.equal(a.history,history);assert.equal(a.history.items['try:probe'].reveals,1);
});

test('checking again and changing a checklist invalidates old review approval',()=>{
 const st={resp:{text:'my own response'}};compareWrittenResponse(st,item);st.reviewChecks={whole:true,reason:true,compare:true};reviewWrittenResponse(st);
 compareWrittenResponse(st,item);assert.equal(st.reviewedRevision,undefined);assert.equal(st.status,'compared');
 st.reviewChecks={whole:true,reason:true,compare:true};reviewWrittenResponse(st);assert.equal(updateWrittenChecks(st,{whole:false,reason:true,compare:true}),true);assert.equal(st.reviewedRevision,undefined);assert.equal(st.status,'compared');assert.equal(reviewWrittenResponse(st),false);
});

test('an untouched Chapter 7 written checkpoint does not complete a stage',()=>{
 const lesson={id:'7-9',learn:{screens:[{item}]}};const state=stateFor('7-9','learn');state.seen={0:true};
 assert.equal(completedLessonStage(lesson,'learn',state),false);assert.ok(!visitedStages('7-9').has('learn'));
 const st=state.items.review={resp:{text:'my reasoning'}};compareWrittenResponse(st,item);assert.equal(completedLessonStage(lesson,'learn',state),false);
 st.reviewChecks={whole:true,reason:true,compare:true};reviewWrittenResponse(st);assert.equal(completedLessonStage(lesson,'learn',state),true);
});
