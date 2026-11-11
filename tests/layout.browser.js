// Regression checks for shared navigation, section headers and Test Center alignment.
import assert from 'node:assert/strict';
import path from 'node:path';
import {ROOT,BASE,startServer,startBrowser} from './lib/harness.js';
const arg=process.argv.indexOf('--site');
const server=await startServer({root:arg<0?ROOT:path.resolve(process.argv[arg+1])});
const b=await startBrowser();let checks=0;
const expect=(value,label)=>{assert.ok(value,label);checks++};
const url=(section,week='2026-11-09')=>server.origin+BASE+`#${section}?week=${week}`;
try{
 for(const width of [1366,1920]){
  await b.viewport(width,900,false);
  const headers=[];
  for(const section of ['spelling','vocab','reading','math','skills','homework','newsletter','tests']){
   await b.load(url(section));
   headers.push(await b.js('await document.fonts.ready;const h=document.querySelector(".section-head"),t=h.querySelector("h1"),r=h.getBoundingClientRect(),s=t.getBoundingClientRect();return [r.x,r.y,r.width,r.height,s.x,s.y];'));
   expect(await b.js('return !!document.querySelector(".section-head .crumbs a");'),section+' keeps Home navigation');
  }
  expect(headers.every(h=>h.every((n,i)=>Math.abs(n-headers[0][i])<2)),'subject section headers and title positions align at '+width);
 }
 for(const width of [360,390,640,641,768,1024,1100,1200,1201,1366,1920]){
  await b.viewport(width,900,width<1024);await b.load(url('tests'));
  const result=await b.js(`
   await document.fonts.ready;
   const cards=[...document.querySelectorAll('.test-card')];
   const first=cards.slice(0,2).map(c=>({card:c.getBoundingClientRect(),action:c.querySelector('.test-card-action').getBoundingClientRect(),facts:c.querySelector('.facts').getBoundingClientRect()}));
   return {overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
    noTabs:!document.querySelector('.tabs'),
    twoColumns:Math.abs(first[0].card.top-first[1].card.top)<1,
    actionAligned:Math.abs(first[0].action.top-first[1].action.top)<1,
    factsAligned:Math.abs(first[0].facts.top-first[1].facts.top)<1,
    unavailableMargin:getComputedStyle(document.querySelector('.unavailable')).marginTop};
  `);
  expect(!result.overflow,'page fits '+width);
  expect(result.noTabs,'cards have no competing top subject menu '+width);
  expect(result.twoColumns===(width>=700),'responsive card columns '+width);
  expect(result.unavailableMargin==='0px','unavailable message has no automatic spacer '+width);
  if(width>=700)expect(result.actionAligned&&result.factsAligned,'actions and facts share rows '+width);
  if(process.env.SS_LAYOUT_SHOTS&&[390,1366,1920].includes(width))await b.shot(path.join(process.env.SS_LAYOUT_SHOTS,`tests-${width}.png`));
 }
 for(const week of ['2026-10-12','2026-10-19','2026-11-02']){
  await b.viewport(1366,768,false);await b.load(url('tests',week));
  expect(await b.js('const a=[...document.querySelectorAll(".test-card-action")].slice(0,2).map(e=>e.getBoundingClientRect());return Math.abs(a[0].top-a[1].top)<1&&a.every(r=>r.top<innerHeight);'),'archived and current first-row actions align '+week);
 }
 expect(!b.errors.length,'no browser errors: '+b.errors.join('; '));
 expect(!server.missing.length,'no missing resources');
 console.log(`${checks} shared-layout browser checks passed`);
}finally{b.close();server.close()}
