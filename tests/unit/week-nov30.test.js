import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {weekView} from '../../js/views/week.js';
import {vocabView} from '../../js/views/vocab.js';
import {validateWeek} from '../../js/lib/validate.js';
const week=JSON.parse(fs.readFileSync(new URL('../../data/2026-11-30.json',import.meta.url)));
const lessons=JSON.parse(fs.readFileSync(new URL('../../data/lessons/index.json',import.meta.url)));
const ctx={week,lessons,index:{current:'2026-11-16'},section:'week',today:new Date(2026,10,28),link:s=>`#${s}?week=${week.id}`,chapterLink:n=>`#math?ch=${n}`,actLink:(s,a)=>`#${s}?act=${a}`};
test('division announcement never points at a fractions practice test',()=>{
 const out=weekView(ctx).toString();
 const card=out.slice(out.indexOf('<h3>Division Review Quiz'),out.indexOf('</li>',out.indexOf('<h3>Division Review Quiz')));
 assert.match(card,/10 questions/);assert.doesNotMatch(card,/href=/);
 assert.match(out,/Equivalent fractions and comparing fractions/);
 assert.match(out,/games\/fraction-scoop-shop.html/);
});
test('provided purple vocabulary words never show the old missing-list message',()=>{
 const out=vocabView({...ctx,section:'vocab'}).toString();
 assert.doesNotMatch(out,/purple words are not on this list yet/);
 assert.match(out,/6 words/);
});
test('optional study links and chapter scope notes are validated',()=>{
 const bad=structuredClone(week);bad.tests[0].practice='no';bad.mathStudyNote=12;
 assert(validateWeek(bad,week.id).some(x=>x.includes('practice')));
 assert(validateWeek(bad,week.id).some(x=>x.includes('mathStudyNote')));
});
