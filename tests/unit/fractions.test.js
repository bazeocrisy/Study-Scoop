import test from 'node:test';
import assert from 'node:assert/strict';
import { fractionModelProblems, fractionOfModel, equalFractions, fractionItemProblems, rationalChainHolds, wrongFractionFactsInText } from '../../js/lib/fractions.js';
import { check, solution, boxes, answerText, validateQuiz } from '../../js/lib/lessons.js';
import { modelFigure } from '../../js/lib/models.js';
const model = (parts, selected, wholes = 1) => ({ type: 'fraction', kind: 'bar', parts, selected, wholes });
const item = (m, policy = 'partition') => ({ id: 'f1', type: 'fraction', asks: 'fraction', prompt: 'Write the fraction.', model: m, answer: fractionOfModel(m), answerPolicy: policy });
test('fractions count proper, whole, n/1 and several identical wholes exactly', () => {
 for (const [m, want] of [[model(4,[0]),{n:1,d:4}], [model(3,[0,1,2]),{n:3,d:3}], [model(1,[0,1,2],3),{n:3,d:1}], [model(4,[0,1,2,3,4],2),{n:5,d:4}], [{type:'fraction',kind:'set',parts:12,selected:[0]}, {n:1,d:12}], [{type:'fraction',kind:'line',parts:4,max:3,point:9},{n:9,d:4}]]) {
  assert.deepEqual(fractionModelProblems(m),[]);assert.deepEqual(fractionOfModel(m),want);assert.deepEqual(validateQuiz([item(m)],1,'fraction'),[]);
 }
});
test('invalid geometry and indices cannot quietly become a different model', () => {
 for (const m of [model(0,[]),model(4,[4]),model(4,[0,0]),model(2,[-1]),model(2,[.5]),{type:'fraction',kind:'line',parts:3,max:2,point:7},{type:'fraction',kind:'set',parts:12,wholes:2,selected:[]}, {...model(3,[0]),weights:[1,0,2]}]) {
  assert.ok(fractionModelProblems(m).length);assert.throws(()=>fractionOfModel(m));
 }
 const unequal={...model(3,[0]),weights:[1,2,1]};assert.deepEqual(fractionModelProblems(unequal),[]);assert.throws(()=>fractionOfModel(unequal));
 assert.ok(fractionItemProblems({...item(model(3,[0])),model:unequal}).length);
});
test('partition answers respect original parts; values accept equivalent positive-denominator fractions',()=>{
 const i=item(model(2,[0]));assert.deepEqual(boxes(i),['n','d']);assert.deepEqual(solution(i),{n:1,d:2});assert.equal(answerText(i),'1/2');
 assert.equal(check(i,{n:'2',d:'4'}).status,'notyet');assert.equal(check({...i,answerPolicy:'value'},{n:'2',d:'4'}).status,'correct');
 assert.equal(check(i,{n:'1',d:'0'}).status,'notyet');for(const r of [{n:'',d:'2'},{n:'1.0',d:'2'},{n:'1',d:'-2'},{n:'1/2',d:'2'}])assert.equal(check(i,r).status,'empty');
 assert.equal(equalFractions({n:1,d:3},{n:3333,d:9999}),true);assert.equal(equalFractions({n:0,d:0},{n:0,d:2}),false);
});
test('model-derived keys and equivalent duplicate choices are checked',()=>{
 const m=model(4,[0,1]);assert.ok(fractionItemProblems({...item(m),answer:{n:3,d:4}}).length);
 const i={id:'c',type:'choice',asks:'fraction',model:m,prompt:'Which fraction?',options:[{text:'1/2',correct:true},{text:'2/4',why:'Try again.'}]};assert.ok(validateQuiz([i],1,'choice').some(s=>s.includes('equivalent duplicate')));
});
test('authored equations use exact rational arithmetic and reject invalid denominators',()=>{
 for(const s of ['1/3 + 1/3 + 1/3 = 1','5/4 = 1 + 1/4','3/1 = 3','2/4 = 1/2'])assert.equal(rationalChainHolds(s),true,s);
 for(const s of ['1/2 = 2/3','1/0 = 1','1/3 = .333','2/3 = 3/2'])assert.equal(rationalChainHolds(s),false,s);
 assert.deepEqual(wrongFractionFactsInText('We know 1/2 = 2/3.'),['1/2 = 2/3']);assert.deepEqual(wrongFractionFactsInText('We know 2/4 = 1/2.'),[]);
});
test('figures keep full improper fraction, whole circle and accessible observations without computed answers',()=>{
 const m=model(4,[0,1,2,3,4],2),html=modelFigure(m).s;assert.equal((html.match(/fill="#583084"/g)||[]).length,5);assert.ok(!html.includes('5/4'));
 const c=modelFigure({type:'fraction',kind:'circle',parts:1,wholes:1,selected:[0]}).s;assert.ok(c.includes('<circle'));assert.ok(!c.includes('NaN'));
 const line=modelFigure({type:'fraction',kind:'line',parts:4,max:3,point:9}).s;assert.ok(!line.includes('9/4'));/* forensic audit 2026-11-13: ticks are listed one by one (the child counts), never 'tick 9' or 'Each unit has 4' */assert.ok(!/tick 9|Each unit has|9 intervals/.test(line));assert.equal((line.match(/\btick(?! marks)/g)||[]).length,13);assert.ok(line.includes('tick with the point'));assert.ok(['tick labeled 0','tick labeled 1','tick labeled 2','tick labeled 3'].every((t)=>line.includes(t)));
});

test('partition assessment descriptions provide width observations without the equality judgment',()=>{
 for(const weights of [[1,1],[1,2]]) {
  const html=modelFigure({...model(2,[]),weights}).s;
  const label=/aria-label="([^"]+)"/.exec(html)[1];
  assert.ok(!/\bequal|unequal/i.test(label));
  assert.ok(label.includes('1 unit wide'));
  assert.ok(label.includes(`${weights[1]} ${weights[1] === 1 ? 'unit' : 'units'} wide`));
 }
});

test('fraction-expression choice targets use exact rational validation rather than the integer parser',()=>{
 const i={id:'target',type:'choice',prompt:'Which expression has this value?',target:'2/4',options:[{text:'1/2',correct:true},{text:'1/3',why:'Compare the values.'}]};
 assert.deepEqual(validateQuiz([i],1,'rational target'),[]);
 assert.ok(validateQuiz([{...i,target:'1/0'}],1,'invalid rational target').some(x=>x.includes('invalid choice target')));
 assert.ok(validateQuiz([{...i,options:[{text:'1/3',correct:true},{text:'1/2',why:'Try again.'}]}],1,'bad rational target').length);
});
