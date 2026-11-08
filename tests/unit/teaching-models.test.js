import test from 'node:test';
import assert from 'node:assert/strict';
import { modelFigure } from '../../js/lib/models.js';
import { fractionModelProblems, fractionOfModel } from '../../js/lib/fractions.js';
const bar={type:'fraction',kind:'bar',parts:2,wholes:1,selected:[0]};
test('row partitions keep the same whole and represented fraction through the real figure renderer',()=>{
 const html=modelFigure({...bar,layout:'rows'}).s;
 assert.match(html, /width="300" height="44"/);
 assert.match(html, /y="56" width="300" height="44"/);
 assert.match(html, /height 1 relative units/);
 assert.deepEqual(fractionOfModel({...bar,layout:'rows'}),{n:1,d:2});
 assert.ok(fractionModelProblems({...bar,layout:'diagonal'}).length);
});
test('count markers survive the figure boundary without changing selection or fraction value',()=>{
 const html=modelFigure({...bar,counted:[1,0]}).s;
 assert.match(html,/data-count-marker="1"/);assert.match(html,/data-count-marker="2"/);
 assert.match(html,/part 2, width 1 relative units: unshaded, count marker 1/);
 assert.deepEqual(fractionOfModel({...bar,counted:[1,0]}),{n:1,d:2});
 for(const counted of [[2],[0,0],['1'],[-1]]) assert.ok(fractionModelProblems({...bar,counted}).length);
 const countedLine={type:'fraction',kind:'line',parts:2,max:1,point:1,counted:[0]};
 assert.deepEqual(fractionModelProblems(countedLine),[]);
 assert.match(modelFigure(countedLine).s,/data-count-marker="1"/);
 assert.deepEqual(fractionOfModel(countedLine),{n:1,d:2});
 for(const counted of [[2],[-1],[0,0],['1']]) assert.ok(fractionModelProblems({...countedLine,counted}).length,'line annotations must name unique existing intervals');
 const plain=modelFigure(bar).s;assert.doesNotMatch(plain,/data-count-marker/);
});
test('opt-in close framing enlarges teaching circles without changing their mathematics or legacy framing',()=>{
 const m={type:'fraction',kind:'circle',parts:8,wholes:1,selected:[0]};
 const zoom=modelFigure({...m,framing:'close'}).s, legacy=modelFigure(m).s;
 assert.match(zoom,/data-framing="close"/);assert.match(zoom,/viewBox="104 0 116 116" width="232" height="232"/);
 assert.match(legacy,/viewBox="0 0 324 116"/);
 assert.deepEqual(fractionOfModel({...m,framing:'close'}),{n:1,d:8});
 assert.ok(fractionModelProblems({...bar,framing:'close'}).length);
});
test('teaching wiring validation rejects missing correction paths and invalid coach geometry',async()=>{
 const {readFileSync}=await import('node:fs');const {validateLesson}=await import('../../js/lib/lessons.js');
 const lesson=JSON.parse(readFileSync(new URL('../../data/lessons/7-1.json',import.meta.url)));
 const corrupt=structuredClone(lesson);const choice=corrupt.try.items.find(x=>x.type==='choice');choice.teaching.wrong.pop();
 assert.ok(validateLesson(corrupt,'7-1').some(x=>x.includes('each wrong choice')));
 const bad=structuredClone(lesson);bad.try.items[0].teaching.correct.model.parts=0;
 assert.ok(validateLesson(bad,'7-1').some(x=>x.includes('parts must be')));
 const malformed=structuredClone(lesson);malformed.try.items[0].teaching.wrong=[null];
 assert.ok(validateLesson(malformed,'7-1').length);
});

test('opt-in whole grids preserve equal-size whole units, selected counts and ordinal annotations',()=>{
 for(const kind of ['bar','circle']){
  const m={type:'fraction',kind,parts:1,wholes:6,selected:[0,2,5],counted:[0,2,5],wholeLayout:'grid'};
  assert.deepEqual(fractionModelProblems(m),[]);assert.deepEqual(fractionOfModel(m),{n:3,d:1});
  const svg=modelFigure(m).s;assert.match(svg,/data-whole-layout="grid"/);for(const k of [1,2,3])assert.match(svg,new RegExp(`data-count-marker="${k}"`));
  if(kind==='bar'){const rects=[...svg.matchAll(/<rect\b[^>]*>/g)].map(([s])=>Object.fromEntries([...s.matchAll(/(x|y|width|height|fill)="([^"]+)"/g)].map(m=>[m[1],m[2]])));assert.equal(rects.length,6);assert.equal(new Set(rects.map(r=>r.width+':'+r.height)).size,1,'whole rectangles keep equal dimensions');assert.equal(new Set(rects.map(r=>r.x)).size,2,'two columns');assert.equal(new Set(rects.map(r=>r.y)).size,3,'three rows');assert.equal(rects.filter(r=>r.fill==='#583084').length,3);}
 }
 for(const base of [{type:'fraction',kind:'line',parts:2,point:1,max:1},{type:'fraction',kind:'set',parts:2,selected:[0]}]){assert.deepEqual(fractionModelProblems(base),[]);assert.ok(fractionModelProblems({...base,wholeLayout:'grid'}).some(e=>e.includes('wholeLayout')));}
 assert.ok(fractionModelProblems({...bar,wholeLayout:'stack'}).length,'unrecognized whole layout rejected');
});
