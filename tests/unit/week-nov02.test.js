import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { rng, spellingItems, testFor, validateTests } from '../../js/lib/activities.js';
import { validateQuiz } from '../../js/lib/lessons.js';
const week=JSON.parse(fs.readFileSync(new URL('../../data/2026-11-02.json',import.meta.url)));
const bank=JSON.parse(fs.readFileSync(new URL('../../data/tests/2026-11-02.json',import.meta.url)));
test('root words and real suffixes generate 20 usable spelling prompts without invented bases',()=>{
 for(const mode of ['letters','listen']) {
  const items=spellingItems(week,mode);assert.equal(items.length,20);assert.deepEqual(validateQuiz(items,1),[]);
  for(const q of items.filter(q=>q.id.startsWith('bw-'))) assert.ok(['bankruptcy','disruptions','eruption'].includes(q.answer));
 }
 const words=week.spelling.words;assert.equal(words.find(w=>w.word==='rupture').whole,true);
 for(const w of words.filter(w=>w.base)) assert.equal(w.base+w.suffix,w.word);
});
test('six random vocabulary words are distinct, shuffled, cover all 12 over attempts, and preserve bank',()=>{
 const before=JSON.stringify(bank),seen=new Set(),positions=new Set(),draws=new Set();
 for(let seed=1;seed<=100;seed++) {
  const t=testFor('vocab',week,bank,rng(seed));assert.equal(t.items.length,6);assert.equal(t.pass,5);assert.equal(new Set(t.items.map(q=>q.word)).size,6);
  assert.deepEqual(validateQuiz(t.items,t.pass),[]);draws.add(t.items.map(q=>q.word).join('|'));
  for(const q of t.items){seen.add(q.word);assert.ok(!q.hints&&!q.show);if(q.options.length===4)positions.add(q.options.findIndex(o=>o.correct));}
 }
 assert.equal(seen.size,12);assert.equal(positions.size,4);assert.ok(draws.size>50);assert.equal(JSON.stringify(bank),before);
});
test('sampled banks reject invalid sizes, repeated words and impossible pass marks',()=>{
 assert.deepEqual(validateTests(bank,week),[]);
 for(const size of [0,-1,1.5,13]){const b=structuredClone(bank);b.vocab.sampleSize=size;assert.ok(validateTests(b,week).some(e=>e.includes('sampleSize')));}
 const b=structuredClone(bank);b.vocab.items[1].word=b.vocab.items[0].word;assert.ok(validateTests(b,week).some(e=>e.includes('distinct word')));
 const c=structuredClone(bank);c.vocab.pass=7;assert.ok(validateTests(c,week).some(e=>e.includes('sampled test size')));
});

test('later Area weeks can reuse checked chapter vocabulary, but different teacher definitions fail',async()=>{
 const {validateArea}=await import('../../js/lib/area.js');
 const area=JSON.parse(fs.readFileSync(new URL('../../data/practice/area.json',import.meta.url)));
 assert.notEqual(area.week,week.id);assert.deepEqual(validateArea(area,week),[]);
 const changed=structuredClone(week);changed.math.words[0].def='A changed definition';assert.ok(validateArea(area,changed).length);
});
