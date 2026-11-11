import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {testCatalog,weeklyTestListed} from '../../js/lib/activities.js';
import {runFor} from '../../js/activity-player.js';
import {testsView} from '../../js/views/tests.js';
const json=p=>JSON.parse(fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8'));
const words=json('data/practice/math-words.json'),area=json('data/practice/area.json');
for(const [id,kinds] of [
 ['2026-10-12',['spelling','vocab']],
 ['2026-10-19',['math','spelling','vocab','mathwords']],
 ['2026-10-26',['spelling','vocab','mathwords']],
 ['2026-11-02',['spelling','vocab','mathwords']],
 ['2026-11-09',['spelling','vocab']],
]) test(`${id}: weekly tests match its newsletter; no unrelated chapter review`,()=>{
 const week=json(`data/${id}.json`);let bank=null;try{bank=json(`data/tests/${id}.json`)}catch{}
 assert.deepEqual(testCatalog(week,bank,words,area).map(c=>c.kind),kinds);
 assert.deepEqual(['math','spelling','vocab','mathwords'].filter(k=>weeklyTestListed(k,week)),kinds);
});
test('November 9 deep links cannot open old math tests even when those banks are loaded',()=>{
 const week=json('data/2026-11-09.json');
 const ctx={weekId:week.id,week,tests:json('data/tests/2026-11-09.json'),mathWords:words,area};
 assert.equal(runFor(ctx,'tests','mathwords'),null);
 assert.equal(runFor(ctx,'tests','math'),null);
 assert.equal(runFor(ctx,'tests','spelling').items.length,12);
 assert.equal(runFor(ctx,'tests','vocab').items.length,6);
});
test('weekly eligibility is checked before reusing a cached run; chapter tests remain independent',()=>{
 const week=json('data/2026-10-19.json');const ctx={weekId:week.id,week,tests:json('data/tests/2026-10-19.json'),mathWords:words};
 assert.equal(runFor(ctx,'tests','mathwords').items.length,15);
 const noSchedule={...ctx,week:{...week,tests:[]}};
 assert.equal(runFor(noSchedule,'tests','mathwords'),null);
 assert.deepEqual(testCatalog(noSchedule.week,ctx.tests,words),[]);
 assert.equal(runFor(noSchedule,'math','ch5test').items.length,20);
});
test('a week with no scheduled tests shows an honest empty state',()=>{
 const week={...json('data/2026-11-09.json'),tests:[]};
 const ctx={week,weekId:week.id,section:'tests',isCurrent:true,index:{current:week.id},link:s=>'#'+s};
 const out=testsView(ctx).s;
 assert.match(out,/No tests are listed for this week/);
 assert.doesNotMatch(out,/Start test|test-card/);
});
