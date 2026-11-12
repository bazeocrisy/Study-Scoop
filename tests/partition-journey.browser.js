// Lesson 7-1 learning journey in a real browser: every card of sections A–I is completed with real clicks,
// help levels are exercised, independent and assisted results are reported apart, and layouts are checked.
// This establishes on-screen behaviour, not a child's understanding.
import assert from 'node:assert/strict';
import path from 'node:path';
import { BASE, ROOT, startBrowser, startServer } from './lib/harness.js';
const arg = process.argv.indexOf('--site');
const root = arg < 0 ? ROOT : path.resolve(process.argv[arg + 1]);
const shots = process.argv.includes('--shots');
const server = await startServer({ root });
const b = await startBrowser();
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks++; };
const url = (stage) => `${server.origin}${BASE}#math?lesson=7-1${stage ? `&stage=${stage}` : ''}`;
const J = (a) => `[data-j="${a}"]`;
const state = () => b.js('const m=await import("./js/partition-journey.js");return JSON.parse(JSON.stringify(m.journeyState));');
const card = () => b.js('return document.querySelector("[data-card]").dataset.card');
const feedback = () => b.js('return document.querySelector(".j-feedback")?.textContent.trim() || ""');
const isOk = () => b.js('return document.querySelector(".j-feedback")?.classList.contains("ok")');
const mainSvg = () => b.js('return document.querySelector(".j-stage-pic svg")?.outerHTML || ""');
const tap = async (selector) => { await b.clickAt(selector); };
const draw = async (lines) => { for (const [a, c] of lines) { await tap(`.j-stage-pic [data-point="${a}"]`); await tap(`.j-stage-pic [data-point="${c}"]`); } };
const meta = await (async () => { await b.load(url('explore')); return b.js(`const m=await import('./js/lib/partition-journey.js');
  return { journey: m.JOURNEY.map(s=>s.id), cards: Object.fromEntries(Object.entries(m.CARDS).map(([k,v])=>[k,v.map(c=>({id:c.id,type:c.type,phase:c.phase,multi:!!c.multi,independent:!!c.independent,steps:c.steps?.length||0,
    solutions:c.task?.solutions||null,options:c.options?.map(o=>({correct:!!o.correct,value:o.value}))||null,answer:c.answer||null,name:c.name||null,regions:c.figure?.regions.length||0,different:c.different||null}))])) };`); })();

const used = {};
const KEY = 'studyScoop.lesson7-1.progress';
/** A fresh start at one card: saved progress (D29) is erased first, so earlier checks cannot leak into this one. */
/** Earlier cards are finished first (the lesson cannot skip ahead); `all` finishes every card, for layout checks. */
async function openCard(stage, index, { all = false, save = false } = {}) {
  await b.load(url(stage));
  await b.js(`localStorage.removeItem('${KEY}');const m=await import('./js/partition-journey.js'),L=await import('./js/lib/partition-journey.js');m.resetJourney();
    const done=(c)=>{const r=L.newRecord(c);r.viewed=true;if(c.type==='write')r.written=true;else if(c.type!=='demo'){r.attempts=1;r.first='correct';r.correct=true;}return r;};
    for(const s of L.JOURNEY){const before=s.id!=='${stage}'&&L.JOURNEY.findIndex(x=>x.id===s.id)<L.JOURNEY.findIndex(x=>x.id==='${stage}');for(const [k,c] of L.CARDS[s.id].entries())if(${all}||before||(s.id==='${stage}'&&k<${index}))m.journeyState.records[c.id]=done(c);}
    m.journeyState.at['${stage}']=${index};m.journeyState.stage='${stage}';if(${save})m.saveJourney();`);
  const away = stage === 'parent' ? 'explore' : 'parent';
  await b.hash(`#math?lesson=7-1&stage=${away}`); await b.hash(`#math?lesson=7-1&stage=${stage}`);
  if (stage === 'parent') await b.js(`localStorage.removeItem('${KEY}');const m=await import('./js/partition-journey.js');m.resetJourney();`);
}
const fresh = (stage) => openCard(stage, 0);
const saved = () => b.js(`return JSON.parse(localStorage.getItem('${KEY}') || 'null')`);
// Taps the middle (centroid) of a region, where a child would touch, rather than the middle of its bounding box.
async function tapRegion(i) {
  const [x, y] = await b.js(`const g=document.querySelector('.j-stage-pic [data-region="${i}"]');g.scrollIntoView({block:'center'});const poly=g.querySelector('polygon'),svg=g.ownerSVGElement,m=poly.getScreenCTM(),p=[...poly.points];const c=p.reduce((s,q)=>[s[0]+q.x/p.length,s[1]+q.y/p.length],[0,0]);const q=svg.createSVGPoint();q.x=c[0];q.y=c[1];const r=q.matrixTransform(m);return [r.x,r.y];`);
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await b.send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: type === 'mouseMoved' ? 0 : 1 });
}
async function solve(c, { wrongFirst = false, solution = 0 } = {}) {
  if (c.type === 'demo') {
    const before = await mainSvg();
    while (!(await b.js(`return document.querySelector('${J('demo-next')}').disabled`))) await tap(J('demo-next'));
    ok((await mainSvg()) !== before, `${c.id}: Teach Me steps change the diagram`);
    ok((await state()).records[c.id]?.viewed, `${c.id}: worked example recorded as watched`);
    return;
  }
  if (c.type === 'concept') return;
  if (c.type === 'sizes') {
    const before = await mainSvg();
    for (const n of [4, 8]) await tap(`[data-parts="${n}"]`);
    ok((await mainSvg()) !== before, `${c.id}: choosing more parts changes the strip`);
    return;
  }
  if (c.type === 'write') {
    await tap(J('compare'));
    ok(/Write your own answer first/.test(await feedback()) && !(await b.js('return !!document.querySelector(".j-compare")')), `${c.id}: empty writing is not compared`);
    await b.js('document.querySelector("[data-j-text]").focus()');
    await b.type('Each part has to cover the same amount of space.');
    await tap(J('compare'));
    ok(await b.js('return !!document.querySelector(".j-compare")'), `${c.id}: example appears after writing`);
    for (let i = 0; i < 3; i++) await tap(`[data-j-review="${i}"]`);
    const r = (await state()).records[c.id];
    ok(r.written && r.reviewed && !r.correct, `${c.id}: writing is recorded as reviewed by a person, never machine-graded`);
    return;
  }
  if (c.type === 'build') {
    if (wrongFirst) {
      await draw([c.solutions[0][0]]);
      await tap(J('check'));
      ok(!(await isOk()), `${c.id}: incomplete construction is not accepted`);
      await tap(J('clear'));
    }
    if (c.different) solution = used[c.different] === 0 ? 1 : 0;
    used[c.id] = solution;
    const lines = c.solutions[solution];
    await draw(lines);
    await tap(J('check'));
    if (c.phase === 'assess') { ok(await b.js('return /one try/.test(document.querySelector("[data-j=check]").textContent)'), `${c.id}: asks before using its one try`); await tap(J('check')); }
    ok(await isOk(), `${c.id}: correct construction accepted by geometry (${await feedback()})`);
    return;
  }
  if (c.type === 'count') {
    for (let i = 0; i < c.regions; i++) await tapRegion(i);
    ok(await b.js(`return document.querySelectorAll('.j-stage-pic .j-tile.counted').length === ${c.regions}`), `${c.id}: every tapped region is counted and numbered`);
    if (wrongFirst) { await tap(`input[data-j-num][value="${c.answer === '4' ? '6' : '4'}"]`); await tap(`input[data-j-name][value="${c.name}"]`); await tap(J('check')); ok(!(await isOk()), `${c.id}: wrong count rejected`); }
    await tap(`input[data-j-num][value="${c.answer}"]`); await tap(`input[data-j-name][value="${c.name}"]`);
    await tap(J('check')); if (c.phase === 'assess') await tap(J('check'));
    ok(await isOk(), `${c.id}: correct sentence accepted`);
    return;
  }
  // choice and area
  const wrong = c.options.findIndex((o) => !o.correct);
  const sel = (i) => (c.type === 'area' ? `input[data-j-choice][value="${c.options[i].value}"]` : `input[data-j-choice][value="${i}"]`);
  if (c.type === 'area') { await tap('[data-piece="0"]'); ok(await b.js('return /squares/.test(document.querySelector(".j-stage-pic svg").getAttribute("aria-label"))'), `${c.id}: tapping a part reveals its unit-square count`); }
  if (wrongFirst && wrong >= 0) {
    await tap(sel(wrong)); await tap(J('check'));
    ok(!(await isOk()) && (await feedback()).length > 20, `${c.id}: wrong choice gets specific feedback`);
    await tap(sel(wrong)); // un-tick when multiple choice
  }
  for (let i = 0; i < c.options.length; i++) if (c.options[i].correct) {
    const checked = await b.js(`return document.querySelector('${sel(i).replace(/'/g, "\\'")}').checked`);
    if (!checked) await tap(sel(i));
  }
  await tap(J('check')); if (c.phase === 'assess') await tap(J('check'));
  ok(await isOk(), `${c.id}: correct answer accepted`);
}

const step = (name) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${name} (${checks} checks so far)`);
if (process.env.CPU_THROTTLE) await b.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.CPU_THROTTLE) });
try {
  await b.viewport(1366, 768, false);
  step('entry and full walk-through');
  // Entry: Lesson 7-1 opens on the journey, not a collapsed panel or a dropdown.
  await b.load(url());
  await b.js(`localStorage.removeItem('${KEY}')`); await b.load(url());
  ok(await b.js('return location.hash.includes("stage=explore")'), 'Lesson 7-1 opens on section A when nothing is saved');
  ok(await b.js('return !document.querySelector("details.partition-lab-shell, #lesson-stage select, .j-stepper select")'), 'no collapsed lab panel and no dropdown to find activities');
  ok(await b.js('return document.querySelectorAll(".j-stepper li").length === 10'), 'stepper shows sections A–I and the grown-up summary');
  ok(await b.js('return document.querySelector(".j-stepper a[aria-current=step]").textContent.includes("Explore")'), 'stepper marks the current section');

  // Walk the whole journey. Every card is answered; the first card of each kind starts with a wrong attempt.
  const triedWrong = new Set();
  for (const stage of meta.journey) {
    // Move on with the card's own "Next: <section>" link, as a child would (a reload would clear this visit's record).
    if (stage !== meta.journey[0]) { const before = await b.js('return document.getElementById("app").dataset.ready'); await tap('[data-j-next-stage]'); await b.ready(before); }
    ok(await b.js(`return location.hash.includes('stage=${stage}')`), `Next link leads to section ${stage}`);
    const list = meta.cards[stage];
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      ok((await card()) === c.id, `${stage} card ${i + 1} is ${c.id}`);
      ok(await b.js('return document.activeElement?.id === "stage-h" || document.activeElement === document.body || !!document.activeElement?.closest("#lesson-stage")'), `${c.id}: focus lands in the lesson`);
      const helps = ['wedo', 'say'].includes(c.phase) && !['demo', 'concept', 'sizes'].includes(c.type);
      ok(await b.js(`return ${helps} === !!document.querySelector('${J('help')}')`), `${c.id}: ? Help only in We Do (${c.phase})`);
      ok(await b.js(`return document.querySelector('[data-card]').dataset.phase === '${c.phase}'`) && await b.js('return !!document.querySelector(".j-badge")'), `${c.id}: shows its step (${c.phase})`);
      if (!['concept', 'sizes'].includes(c.type)) ok(await b.js('return !!document.querySelector(".j-nav [data-j=next][disabled], .j-nav button[disabled]") && !document.querySelector("[data-j-next-stage]")'), `${c.id}: Next waits until this card is done`);
      if (c.phase === 'youdo' || c.phase === 'assess') ok(await b.js('return !document.querySelector("[data-j=help], [data-j=hint]")'), `${c.id}: no hints on your own`);
      // Only We Do questions start with a wrong try here (You Do and the Final Check are answered right first).
      const wrongFirst = c.phase === 'wedo' && !triedWrong.has(c.type);
      triedWrong.add(c.type);
      await solve(c, { wrongFirst, solution: c.solutions && c.solutions.length > 1 && i % 2 ? 1 : 0 });
      if (i < list.length - 1) await tap(J('next'));
    }
  }
  const after = await state();
  const gradedIds = Object.values(meta.cards).flat().filter((c) => !['demo', 'concept', 'sizes', 'write'].includes(c.type)).map((c) => c.id);
  ok(gradedIds.every((id) => after.records[id]?.correct), `all ${gradedIds.length} graded cards were completed in one visit`);
  await tap('[data-j-next-stage]');
  await b.waitFor(`!!document.querySelector(".j-summary")`);
  ok(await b.js('return /report/i.test(document.querySelector(".j-summary h2").textContent) && /Ready/.test(document.querySelector(".j-verdict").textContent) && /10 of 10/.test(document.querySelector(".j-summary").textContent)'), 'the last card leads to the readiness report: 10 of 10, ready');

  step('alternative constructions');
  // Every alternative construction listed for a shape is accepted through the real controls (not only the first).
  for (const c of meta.cards.shapes.filter((x) => x.type === 'build')) {
    await openCard('shapes', meta.cards.shapes.findIndex((x) => x.id === c.id));
    for (let k = 0; k < c.solutions.length; k++) {
      await b.js(`const m=await import('./js/partition-journey.js');(m.journeyState.ui['${c.id}'] ||= {}).lines=[];`);
      await b.hash('#math?lesson=7-1&stage=parent'); await b.hash('#math?lesson=7-1&stage=shapes');
      await draw(c.solutions[k]); await tap(J('check'));
      ok(await isOk(), `${c.id}: alternative construction ${k + 1} of ${c.solutions.length} accepted`);
    }
  }

  step('unequal parts and circle chords');
  // Unequal parts: the right number of parts with unequal areas is rejected and the pieces are marked.
  await openCard('method', meta.cards.method.findIndex((c) => c.id === 'b-fourths-make'));
  await draw([['t2-4', 'b2-4'], ['l2-4', 'b2-4'], ['t2-4', 'r2-4']]); // 4 parts: two triangles (1/8 each) and two pentagons (3/8 each)
  await tap(J('check'));
  const fb = await feedback();
  ok(!(await isOk()), 'unequal partition rejected');
  ok(/4 parts/.test(fb) && /bigger/.test(fb) && /same amount of space/.test(fb) && await b.js('return document.querySelectorAll(".j-tag").length === 2'), `unequal partition explained and the bigger/smaller parts are marked: ${fb}`);

  // Circle chords that miss the center are not accepted as slices.
  await openCard('mistake', meta.cards.mistake.findIndex((c) => c.id === 'f-fix'));
  await draw([['e0', 'e2'], ['e4', 'e6']]); await tap(J('check'));
  ok(!(await isOk()) && /center/.test(await feedback()), 'unsupported circle chord gets an honest message, not success');

  step('help levels');
  // Progressive help on a construction: hint, then changing steps, then answer. The child's lines stay.
  await openCard('shapes', 1);
  await draw([['v0', 'v2']]);
  const mine = await mainSvg();
  await tap(J('help'));
  ok(await b.js(`return !!document.querySelector('${J('hint')}') && !document.querySelector('${J('steps')},${J('answer')}')`), 'help starts with only a hint button');
  ok(await b.js('return document.activeElement?.matches("[data-help-heading]")'), 'opening help moves focus to the help heading');
  await tap(J('hint'));
  ok(await b.js(`return !!document.querySelector('${J('steps')}') && !document.querySelector('.j-help-block.answer')`), 'hint unlocks steps without the answer');
  await tap(J('steps'));
  const helpPics = [await b.js('return document.querySelector(".j-help svg")?.outerHTML')];
  while (await b.js(`return !!document.querySelector('${J('next-help')}')`)) { await tap(J('next-help')); helpPics.push(await b.js('return document.querySelector(".j-help svg")?.outerHTML')); }
  ok(helpPics.every(Boolean), 'each help step shows a diagram');
  ok(new Set(helpPics).size === helpPics.length, 'help diagrams change between steps');
  ok(await b.js(`return !document.querySelector('.j-help-block.answer') && !!document.querySelector('${J('answer')}')`), 'steps stop before the complete answer');
  await tap(J('answer'));
  ok(await b.js('return !!document.querySelector(".j-help-block.answer svg")'), 'answer shows a verified construction');
  ok((await mainSvg()) === mine, 'help never changes the child\'s own drawing');
  ok(await b.js('return document.querySelector(".j-help").compareDocumentPosition(document.querySelector(".j-stage-pic")) & Node.DOCUMENT_POSITION_PRECEDING'), 'help appears beneath the active problem');
  await draw([['v1', 'v3']]); await tap(J('check'));
  let s = await state();
  ok(s.records['d-diamond-guide'].correct && s.records['d-diamond-guide'].first !== 'correct' && s.records['d-diamond-guide'].helpBeforeCorrect === 3, 'completion after a revealed answer is recorded as assisted');
  await tap(J('close-help'));
  ok(await b.js(`return document.activeElement?.matches('${J('help')}')`), 'closing help returns focus to ? Help');

  // My Turn: independent first-try success is credited; help on another My Turn is recorded.
  await tap(J('next'));
  ok((await card()) === 'd-diamond-myturn', 'Guide Me leads to My Turn');
  ok(await b.js('return !document.querySelector(".j-stage-pic .j-cut")'), 'My Turn starts with an empty shape (no solution shown)');
  await draw(meta.cards.shapes.find((c) => c.id === 'd-diamond-myturn').solutions[0]); await tap(J('check'));
  s = await state();
  ok(s.records['d-diamond-myturn'].first === 'correct', 'My Turn without help is independent');

  step('keyboard');
  // Keyboard: a line can be drawn with Tab and Enter/Space alone.
  await openCard('method', meta.cards.method.findIndex((c) => c.id === 'b-fourths-make'));
  await b.js('document.querySelector(\'[data-point="t2-4"]\').focus()');
  await b.key('Enter');
  ok(await b.js('return document.activeElement?.dataset.point === "t2-4" && document.activeElement.getAttribute("aria-pressed") === "true"'), 'keyboard selects a point and keeps focus on it');
  await b.js('document.querySelector(\'[data-point="b2-4"]\').focus()');
  await b.key(' ');
  ok(await b.js('return document.querySelectorAll(".j-stage-pic .j-cut").length === 1'), 'keyboard Space completes a line');
  await tap(J('undo'));
  ok(await b.js('return document.querySelectorAll(".j-stage-pic .j-cut").length === 0'), 'Undo removes the last line');

  step('grown-up summary');
  // Grown-up summary separates independent, wrong-first and assisted work.
  await openCard('shapes', 1);
  await draw([['v0', 'v2'], ['v1', 'v3']]); await tap(J('check'));                                       // We Do diamond: first try
  await tap(J('next')); await draw([['v0', 'v2']]); await tap(J('check'));                                // You Do diamond: wrong first,
  await tap(J('clear')); await draw([['v0', 'v2'], ['v1', 'v3']]); await tap(J('check'));                 // then right
  await tap(J('next')); while (!(await b.js(`return document.querySelector('${J('demo-next')}').disabled`))) await tap(J('demo-next'));
  await tap(J('next')); await tap(J('help')); await tap(J('hint')); await draw([['l2-6', 'r2-6'], ['l4-6', 'r4-6'], ['t1-2', 'b1-2']]); await tap(J('check')); // We Do square: hint
  await b.hash('#math?lesson=7-1&stage=parent');
  const sum = await b.js('return document.querySelector(".j-summary").textContent.replace(/\\s+/g," ")');
  ok(/1 wrong on the first try/.test(sum), `report counts wrong first tries: ${sum.slice(0, 300)}`);
  ok(/1 after a hint/.test(sum), 'report counts hint-assisted completions');
  ok(/On own, after another try/.test(sum) && /In progress/.test(sum), 'report shows the You Do result per skill and that the lesson is not finished');
  ok(/Final Check: 0 of 10/.test(sum), 'report shows the Final Check score');
  ok(await b.js('return !!document.querySelector(".parent-guide") && !!document.querySelector(".j-extra a[href*=\\"stage=try\\"]")'), 'parent page keeps the Parent Guide and links the original extra practice');

  step('original stages');
  // The original stages still work as optional extra practice.
  await b.load(url('learn'));
  ok(await b.js('return /Extra practice/.test(document.querySelector(".eyebrow").textContent) && !!document.querySelector("nav.stepper[aria-label=\\"Extra practice steps\\"] a[aria-current=step]") && !!document.querySelector(".bar-btns a[href*=\\"stage=explore\\"]")'), 'original Learn It opens as labelled extra practice with a way back to the main lesson');
  await b.load(url('test'));
  ok(await b.js('return !document.querySelector("[data-j=help]") && !document.querySelector("[data-act=help]")'), 'original scored test still has no hints');

  step('layouts');
  // Layout: no sideways scrolling; touch targets; light/dark contrast is handled by tokens (checked in the accessibility suite).
  for (const [w, h] of [[360, 740], [390, 844], [768, 1024], [1024, 768], [1280, 800], [1366, 768], [1920, 1080]]) {
    await b.viewport(w, h);
    for (const stage of ['explore', 'method', 'shapes', 'count', 'area', 'parent']) {
      await fresh(stage);
      ok(await b.js('return document.documentElement.scrollWidth <= innerWidth'), `${w}px ${stage}: no horizontal scroll`);
    }
    await openCard('shapes', 1);
    const minBtn = await b.js('return Math.min(...[...document.querySelectorAll("#lesson-stage button.btn, .j-help-btn")].filter(e=>e.offsetParent).map(e=>e.getBoundingClientRect().height))');
    ok(minBtn >= 44, `${w}px: buttons at least 44px tall (smallest ${minBtn.toFixed(0)}px)`);
    if (w === 390) {
      const t = await b.js('const e=document.querySelector(".j-stage-pic [data-point]");e.scrollIntoView({block:"center"});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,id:e.dataset.point};');
      await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: t.x, y: t.y }] });
      await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await b.waitFor(`document.querySelector('.j-stage-pic [data-point="${t.id}"]')?.getAttribute('aria-pressed')==='true'`);
      ok(true, 'touch emulation selects a construction point');
    }
    if (shots && [390, 1366].includes(w)) await b.shot(path.join(ROOT, 'docs/reviews/images', `lesson-7-1-journey-guide-${w}.png`));
  }
  step('original-stage help');
  // Carried over from the retired Partition Lab suite: the original stages keep their own question help and scored-test rules.
  await b.viewport(1366, 768, false);
  await b.load(url('together'));
  ok(await b.js('return document.querySelector("[data-act=help]")?.textContent.includes("Hint")'), 'shared guided question offers a question hint before any wrong answer');
  await b.clickAt('[data-act=help]');
  const answer = await b.js('const l=await(await fetch("data/lessons/7-1.json")).json();return l.together.items[0].options.findIndex(o=>o.correct);');
  await b.clickAt(`form input[name=choice][value="${answer}"]`);
  await b.clickAt('form button[type=submit]');
  ok(await b.js('const {stateFor}=await import("./js/lesson-player.js");const s=stateFor("7-1","together");const v=Object.values(s.items)[0];return v.status==="correct" && v.scaffoldAssisted===true;'), 'first correct shared answer after a hint is assisted');
  ok(await b.js('return document.querySelector(".lesson-history").textContent.includes("Current round: 0 questions right on the first attempt")'), 'shared current summary excludes hinted first-check success');
  await b.hash('#math?lesson=7-1&stage=parent');
  ok(await b.js('return /Practice Together, latest round: 0 right/.test(document.querySelector(".lesson-history").textContent)'), 'parent summary excludes assisted first-check success');
  await b.load(url('learn'));
  await b.js('const l=await(await fetch("data/lessons/7-1.json")).json();const {stateFor}=await import("./js/lesson-player.js");stateFor("7-1","learn").i=l.learn.screens.findIndex(s=>s.item?.type==="sentence");');
  await b.hash('#math?lesson=7-1&stage=parent');
  await b.hash('#math?lesson=7-1&stage=learn');
  await b.js('document.querySelector("textarea[name=text]").focus()');
  await b.type('I compare the area inside each part.');
  for (let level=1;level<=3;level++) {
    await b.clickAt('[data-act=writing-help]');
    ok(await b.js('return document.querySelector("textarea[name=text]").value === "I compare the area inside each part."'), `reflection help level ${level} preserves the written response`);
    ok(await b.js('return !!document.querySelector("[data-written-help] svg")'), `reflection help level ${level} supplies a visual example`);
  }
  ok(await b.js('return !document.querySelector("[data-written-complete]")'), 'revealing a writing sample does not grade or complete the child response');
  await b.hash('#math?lesson=7-1&stage=test');
  ok(await b.js('return !document.querySelector("[data-act=help],[data-act=writing-help]")'), 'shared scored test still withholds hints and writing solutions');
  step('every card fits');
  // Every card (not only the first of each section) fits the screen at phone, tablet and Chromebook widths.
  for (const [w, h] of [[320, 640], [360, 740], [390, 844], [768, 1024], [1366, 768]]) {
    await b.viewport(w, h);
    for (const stage of meta.journey) {
      await openCard(stage, 0, { all: true });
      for (let i = 0; i < meta.cards[stage].length; i++) {
        if (i) { await b.js(`const m=await import('./js/partition-journey.js');m.journeyState.at['${stage}']=${i};`); await b.hash('#math?lesson=7-1&stage=parent'); await b.hash(`#math?lesson=7-1&stage=${stage}`); }
        const over = await b.js('return document.documentElement.scrollWidth - innerWidth');
        const pic = await b.js('const s=document.querySelector(".j-stage-pic svg");if(!s)return true;const r=s.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1');
        ok(over <= 0 && pic, `${w}px ${meta.cards[stage][i].id}: fits the screen (overflow ${over}px)`);
      }
    }
  }
  await b.viewport(1366, 768, false);
  step('dot targets');
  // ---- Choosing dots (touch targets). The usable target of a dot is its "nearest dot" area: every press on the
  // drawing goes to the closest dot (no gaps, no overlaps), with a ring preview and slide-to-adjust before lifting.
  const dense = ['method', meta.cards.method.findIndex((c) => c.id === 'b-eighths-make')], sparse = ['shapes', 1];
  const targetReport = [];
  const press = async (x, y, type = 'mouse', moveTo = null) => {
    if (type === 'touch') {
      await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      if (moveTo) await b.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: moveTo[0], y: moveTo[1] }] });
      await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
      if (moveTo) { await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: moveTo[0], y: moveTo[1], button: 'left', buttons: 1 }); ok(await b.js('return document.querySelector("[data-j-preview]").textContent.trim().length > 3 && !!document.querySelector(".j-point.preview")'), 'while pressing, the dot that will be chosen is ringed and named'); }
      await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: moveTo ? moveTo[0] : x, y: moveTo ? moveTo[1] : y, button: 'left', clickCount: 1 });
    }
  };
  const selected = () => b.js('return document.querySelector(".j-stage-pic [data-point][aria-pressed=true]")?.dataset.point || null');
  const geometry = () => b.js(`const s=document.querySelector('.j-stage-pic svg');s.scrollIntoView({block:'center'});return [...s.querySelectorAll('[data-point]')].map(g=>{const r=g.querySelector('.dot').getBoundingClientRect();return {id:g.dataset.point,x:r.x+r.width/2,y:r.y+r.height/2};});`);
  for (const [w, h] of [[320, 640], [360, 740], [390, 844], [768, 1024], [1024, 768], [1366, 768]]) {
    await b.viewport(w, h);
    for (const [stage, index] of [dense, sparse]) {
      await openCard(stage, index);
      const pts = await geometry(), type = w < 1024 ? 'touch' : 'mouse';
      let smallest = Infinity;
      for (const p of pts) {
        const nb = pts.filter((q) => q !== p).sort((a, c) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(c.x - p.x, c.y - p.y))[0];
        const d = Math.hypot(nb.x - p.x, nb.y - p.y); smallest = Math.min(smallest, d);
        // Worst case: press just short of halfway toward the closest neighbour. It must still choose this dot.
        const reach = Math.min(d / 2 - 2, 44), k = reach / d, x = p.x + (nb.x - p.x) * k, y = p.y + (nb.y - p.y) * k;
        await press(x, y, type);
        ok((await selected()) === p.id, `${w}px ${stage}: a press ${Math.round(reach)}px from ${p.id}, toward ${nb.id}, chooses ${p.id}`);
        await press(p.x, p.y, type); // press it again to un-choose
        ok((await selected()) === null, `${w}px: pressing the chosen dot again un-chooses it`);
      }
      targetReport.push(`${w}px ${stage === 'method' ? 'densest (rectangle eighths)' : 'diamond'}: closest dots ${smallest.toFixed(0)}px apart`);
      if (w >= 768) ok(smallest >= 44, `${w}px: every dot owns a target at least 44px across (${smallest.toFixed(0)}px)`);
      else ok(smallest >= 28, `${w}px: dots at least 28px apart (${smallest.toFixed(0)}px), with nearest-dot choosing, ring preview and slide`);
      // Slide to adjust: press on one dot, slide to another, lift: only the second is chosen. A scroll cancels.
      const [a, c] = [pts[0], pts[pts.length - 1]];
      await press(a.x, a.y, 'mouse', [c.x, c.y]);
      ok((await selected()) === c.id, `${w}px: sliding to another dot before lifting chooses that dot`);
      await press(c.x, c.y);
      if (type === 'touch') {
        // Hold, then slide straight down to another dot: the ring follows and lifting chooses it (no scrolling).
        const down = pts.filter((q) => Math.abs(q.x - a.x) < 3 && q.y > a.y + 10).sort((m, n) => m.y - n.y)[0] || pts.find((q) => q !== a);
        const y0 = await b.js('return scrollY');
        await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x, y: a.y }] });
        await b.wait(300);
        for (let t = 1; t <= 4; t++) await b.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: a.x + (down.x - a.x) * t / 4, y: a.y + (down.y - a.y) * t / 4 }] });
        await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        ok((await selected()) === down.id && (await b.js('return scrollY')) === y0, `${w}px touch: hold then slide down from ${a.id} chooses ${down.id} without scrolling`);
        await press(down.x, down.y, 'touch');
        // A quick swipe that starts on the drawing still scrolls the page and chooses nothing.
        await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x, y: a.y }] });
        for (let t = 1; t <= 6; t++) await b.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: a.x, y: a.y - 20 * t }] });
        await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await b.wait(500);
        ok((await selected()) === null, `${w}px touch: a quick swipe on the drawing chooses nothing (checked after a pause)`);
      }
      // A press far from every dot does nothing.
      const now = await geometry();
      const far = await b.js('const r=document.querySelector(".j-stage-pic svg").getBoundingClientRect();return [r.left+4,r.top+4]');
      const nearestFar = Math.min(...now.map((p) => Math.hypot(p.x - far[0], p.y - far[1])));
      if (nearestFar > 52) { const pre = await selected(); await press(far[0], far[1]); const got = await selected(); ok(got === null, `${w}px: a press far from every dot chooses nothing (before ${pre}, got ${got}, nearest ${nearestFar.toFixed(0)}px, at ${far.map(Math.round)})`); }
    }
  }
  console.log('Dot targets: ' + targetReport.join('; '));
  step('arrow keys');
  // Keyboard: one Tab stop for the drawing, arrow keys move between dots, Enter chooses.
  await b.viewport(1366, 768, false);
  await openCard('method', meta.cards.method.findIndex((c) => c.id === 'b-fourths-make'));
  ok(await b.js('return document.querySelectorAll(".j-stage-pic [data-point][tabindex=\\"0\\"]").length === 1'), 'the drawing is a single Tab stop');
  await b.js('document.querySelector(".j-stage-pic [data-point][tabindex=\\"0\\"]").focus()');
  const first = await b.js('return document.activeElement.dataset.point');
  await b.key('ArrowRight');
  const second = await b.js('return document.activeElement.dataset.point');
  ok(second && second !== first && (await b.js('return document.activeElement.getAttribute("tabindex")')) === '0', `ArrowRight moves from ${first} to ${second} and keeps one Tab stop`);
  await b.key('Enter'); ok((await selected()) === second, 'Enter chooses the focused dot');

  step('saved progress');
  // ---- Saved progress (D29): refresh, reopen, resume, and the grown-up reset.
  await openCard('shapes', 1);
  await draw([['v0', 'v2'], ['v1', 'v3']]); await tap(J('check'));                      // We Do diamond: independent
  await tap(J('next')); await draw([['v0', 'v2']]); await tap(J('check'));               // You Do diamond: wrong, then
  await tap(J('clear')); await draw(meta.cards.shapes.find((c) => c.id === 'd-diamond-myturn').solutions[0]); await tap(J('check'));
  await tap(J('next')); while (!(await b.js(`return document.querySelector('${J('demo-next')}').disabled`))) await tap(J('demo-next'));
  await tap(J('next')); await draw([['l2-6', 'r2-6']]);                                     // We Do square: half-drawn
  const beforeRefresh = await state();
  let data = await saved();
  ok(data && data.stage === 'shapes' && data.at.shapes === 4, 'progress is saved as the child works (section and card)');
  ok(JSON.stringify(Object.keys(await b.js('return {...localStorage}'))) === JSON.stringify([KEY]), 'only the one Lesson 7-1 key is stored');
  await b.load(url());                                                                     // refresh / reopen with no section named
  ok(await b.js('return location.hash.includes("stage=shapes")') && (await card()) === 'd-square-guide', 'reopening Lesson 7-1 resumes at the same section and card');
  ok(await b.js('return document.querySelectorAll(".j-stage-pic .j-cut").length === 1'), 'the half-finished drawing is still there');
  const restored = await state();
  ok(restored.records['d-diamond-guide'].first === 'correct' && restored.records['d-diamond-myturn'].first === 'wrong' && restored.records['d-diamond-myturn'].correct, 'independent and retried results survive the refresh');
  ok(JSON.stringify(restored.records) === JSON.stringify(beforeRefresh.records), 'every record is restored exactly');
  await b.hash('#math?lesson=7-1&stage=parent');
  const sum2 = await b.js('return document.querySelector(".j-summary").textContent.replace(/\\s+/g," ")');
  ok(/1 wrong on the first try/.test(sum2) && /On own, after another try/.test(sum2), 'the grown-up report after a refresh still separates independent and retried work');
  ok(/saved only in this browser on this device/.test(sum2) && /no name/.test(sum2), 'the summary explains what is saved and that nothing is sent');
  // Reset needs a confirmation; Cancel keeps everything.
  await tap('[data-j-reset="ask"]');
  ok(await b.js('return !document.querySelector("[data-j-reset-confirm]").hidden && document.activeElement.dataset.jReset === "no"'), 'Reset asks to confirm, with focus on Cancel');
  await tap('[data-j-reset="no"]');
  ok((await saved()) !== null && await b.js('return document.querySelector("[data-j-reset-confirm]").hidden'), 'Cancel keeps the saved progress');
  await tap('[data-j-reset="ask"]'); await tap('[data-j-reset="yes"]');
  ok((await saved()) === null, 'confirmed Reset erases the saved Lesson 7-1 progress');
  ok(/0 right on the first try/.test(await b.js('return document.querySelector(".j-summary").textContent.replace(/\\s+/g," ")')), 'the summary shows a fresh start right away');
  await b.load(url());
  ok(await b.js('return location.hash.includes("stage=explore")') && Object.keys((await state()).records).length === 0, 'after Reset, Lesson 7-1 starts again at section A');
  step('two tabs');
  // Two copies of the lesson at once (a second tab, here a same-origin frame): neither overwrites the other,
  // and a Reset in one is not undone by the other.
  await openCard('explore', meta.cards.explore.findIndex((c) => c.id === 'a-notfourths'), { save: true });
  await b.js(`const f=document.createElement('iframe');f.id='tab2';f.style.cssText='width:1000px;height:700px';f.src=location.pathname+'#math?lesson=7-1&stage=explore';document.body.append(f);`);
  await b.waitFor('!!document.getElementById("tab2").contentDocument?.querySelector("[data-card]")', 10000);
  await b.js(`const d=document.getElementById('tab2').contentDocument;d.querySelector('input[data-j-choice][value="1"]').click();d.querySelector('[data-j="check"]').click();`);
  await b.waitFor(`(JSON.parse(localStorage.getItem('${KEY}')||'{}').records||{})['a-notfourths']?.correct === true`);
  await b.waitFor(`(await import('./js/partition-journey.js')).journeyState.records['a-notfourths']?.correct === true`);
  ok(true, 'an answer checked in the other tab arrives in this tab');
  await tap(J('next')); await tap('input[data-j-choice][value="1"]'); await tap('input[data-j-choice][value="2"]'); await tap(J('check'));
  data = await saved();
  ok(data.records['a-notfourths']?.correct && data.records['a-flags']?.correct, `work from both tabs is kept (no overwrite): ${JSON.stringify(data.records)} card=${await card()} fb=${await feedback()}`);
  await b.js(`const w=document.getElementById('tab2').contentWindow;w.localStorage.removeItem('${KEY}');`); // a Reset in the other tab
  await b.waitFor(`Object.keys((await import('./js/partition-journey.js')).journeyState.records).length === 0`);
  ok((await card()) === 'a-words', 'this tab shows the fresh start right away');
  await tap(J('next'));
  data = await saved();
  ok(!data || (!Object.values(data.records || {}).some((r) => r.correct || r.attempts) && !data.ui?.['a-notfourths']?.choice?.length && !data.ui?.['a-flags']), `after a Reset in another tab, this tab does not write the old progress back: ${JSON.stringify(data)}`);
  await b.js('document.getElementById("tab2").remove()');
  // A stale saved answer (an option that no longer exists) cannot break Check.
  await b.js(`localStorage.setItem('${KEY}', JSON.stringify({v:2,stage:'explore',at:{explore:3},ui:{'a-notfourths':{choice:['9']}},records:{'a-show':{viewed:true}}}))`);
  await b.load(url());
  await tap(J('check'));
  ok(/Choose an answer first/.test(await feedback()), 'a stale saved choice is dropped and Check still works');
  // Escape closes the Reset confirmation; Cancel is the emphasised (safe) button.
  await b.hash('#math?lesson=7-1&stage=parent'); await tap('[data-j-reset="ask"]');
  ok(await b.js('return document.querySelector("[data-j-reset=no]").classList.contains("btn-primary") && !document.querySelector("[data-j-reset=yes]").classList.contains("btn-primary")'), 'Cancel is the emphasised choice, erasing is not');
  await b.key('Escape');
  ok(await b.js('return document.querySelector("[data-j-reset-confirm]").hidden'), 'Escape closes the Reset confirmation');
  await b.js(`localStorage.removeItem('${KEY}')`);
  step('teaching rules');
  // Locked sections: a fresh start cannot jump ahead by link or by typing the address.
  await b.load(url()); await b.js(`localStorage.removeItem('${KEY}')`); await b.load(url('method'));
  ok(await b.js('return /is locked/.test(document.querySelector("#lesson-stage").textContent) && !document.querySelector("[data-card]")'), 'a later section opened by its address says it is locked and where to go');
  ok(await b.js('return !document.querySelector(".j-stepper li.locked a") && document.querySelectorAll(".j-stepper li.locked").length === 8'), 'later sections in the stepper are not links');
  // You Do: one miss gets the targeted explanation; a second adds a short visual quick fix and offers the whole
  // worked example (the child chooses it; it is not forced).
  await openCard('method', meta.cards.method.findIndex((c) => c.id === 'b-eighths-you'));
  await draw([['t2-4', 'b2-4']]); await tap(J('check'));
  ok(await b.js('return !document.querySelector(".j-relearn") && !document.querySelector(".j-quick")'), 'one miss: targeted feedback only');
  ok(/Let's count the parts/.test(await feedback()) && await b.js('return document.querySelectorAll(".j-tag").length >= 2'), 'wrong number of parts: the parts are numbered and region counting is explained');
  await tap(J('clear'));
  await draw([['t1-4', 'b1-4'], ['t3-4', 'b3-4']]); await tap(J('check'));
  ok(await b.js('return !!document.querySelector(".j-quick svg") && document.activeElement?.matches("[data-quick-heading]") && !document.querySelector(".j-relearn")'), 'second miss: a short quick fix with a picture, focus on it, and no forced example');
  ok(await b.js('return !!document.querySelector("[data-j=relearn-open]")'), 'the whole worked example is offered');
  await tap(J('relearn-open'));
  ok(await b.js('return !!document.querySelector(".j-relearn") && document.activeElement?.matches("[data-relearn-heading]")'), 'choosing the example opens "Let\'s learn it again" with focus on it');
  const pic0 = await b.js('return document.querySelector(".j-relearn svg").outerHTML');
  while (await b.js(`return !!document.querySelector('${J('relearn-next')}')`)) await tap(J('relearn-next'));
  ok((await b.js('return document.querySelector(".j-relearn svg").outerHTML')) !== pic0, 'the worked example steps change the picture');
  await tap(J('relearn-done'));
  ok(await b.js('return !document.querySelector(".j-relearn")'), 'after re-learning, the child tries again');
  await tap(J('clear')); await draw(meta.cards.method.find((c) => c.id === 'b-eighths-you').solutions[0]); await tap(J('check'));
  ok(await isOk() && (await state()).records['b-eighths-you'].relearn === true, 'right after re-learning, recorded as re-learned (not on own)');
  // Final Check: one try, then locked; a wrong answer still lets the child go on.
  await openCard('check', 0);
  await draw([['t1-4', 'b1-4']]); await tap(J('check')); await tap(J('check'));
  ok(await b.js('return !document.querySelector(".j-stage-pic [data-point]")'), 'a locked Final Check drawing is a picture, not buttons');
  ok(await b.js('return !!document.querySelector("fieldset.j-locked-answer[disabled]") && !document.querySelector(".j-nav [data-j=next][disabled]")'), 'a Final Check answer is locked after one try and Next opens');
  await tap(J('next')); ok((await card()) === 'q2', 'the Final Check moves to the next question');

  step('one task in view');
  // Owner brief (Round 5): the activity is the main thing on the screen; drawing is explained for touch, mouse and keyboard.
  for (const [w, h] of [[1366, 768], [390, 844], [320, 640]]) {
    await b.viewport(w, h); await openCard('method', meta.cards.method.findIndex((c) => c.id === 'b-fourths-make'));
    ok(await b.js('const r=document.querySelector("#stage-h").getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight'), `${w}px: the card title is on the first screen`);
    ok(await b.js('return document.querySelectorAll(".j-map").length === 1 && !document.querySelector(".j-map-all").open && !document.querySelector(".j-stepper").checkVisibility()'), `${w}px: one progress line; the full list of parts is folded away`);
    ok(await b.js('const s=document.querySelector(".j-map-all > summary").getBoundingClientRect(); return s.height >= 44 && s.width >= 44'), `${w}px: "See all parts" is a 44px target`);
  }
  await b.viewport(1366, 768, false);
  ok(await b.js('return document.querySelector(".j-drawhelp").open && /Undo last line/.test(document.querySelector(".j-drawhelp").textContent) && /arrow keys/.test(document.querySelector(".j-drawhelp").textContent)'), 'first drawing: "How to draw lines" is open and covers touch, mouse, mistakes and keyboard');
  await b.js('document.querySelector(".j-drawhelp > summary").click()');
  const firstDot = await b.js('return document.querySelector(".j-stage-pic [data-point]").dataset.point');
  await tap(`[data-point="${firstDot}"]`);
  ok(await b.js('return !document.querySelector(".j-drawhelp").open'), 'closing the drawing guide keeps it closed while drawing');
  ok(/chosen/.test(await b.js('return document.querySelector("[data-j-status]").textContent')), 'the status line says a dot is chosen and what to do next');
  await b.js('document.querySelector(".j-map-all > summary").click()');
  ok(await b.js('return document.querySelector(".j-stepper").checkVisibility() && document.querySelectorAll(".j-stepper li").length === 10'), '"See all parts" shows sections A–I and the report');

  step('other pages');
  // Other Study Scoop pages still store nothing.
  await b.load(`${server.origin}${BASE}#math?lesson=7-2&stage=try`); await b.load(`${server.origin}${BASE}#spelling`);
  ok(JSON.stringify(Object.keys(await b.js('return {...localStorage}'))).replace(KEY, '') === '[""]' || (await b.js('return localStorage.length')) <= 1, 'no other page adds anything to storage');

  ok(b.errors.length === 0, `no browser errors: ${b.errors.join('; ')}`);
  ok(server.missing.length === 0, `no missing requests: ${server.missing.join('; ')}`);
  console.log(`Lesson 7-1 journey: ${checks} checks passed (${arg < 0 ? 'repository' : 'built site'}).`);
} finally { b.close(); server.close(); }
