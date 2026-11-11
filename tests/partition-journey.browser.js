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
  return { journey: m.JOURNEY.map(s=>s.id), cards: Object.fromEntries(Object.entries(m.CARDS).map(([k,v])=>[k,v.map(c=>({id:c.id,type:c.type,multi:!!c.multi,independent:!!c.independent,steps:c.steps?.length||0,
    solutions:c.task?.solutions||null,options:c.options?.map(o=>({correct:!!o.correct,value:o.value}))||null,answer:c.answer||null,name:c.name||null,regions:c.figure?.regions.length||0,different:c.different||null}))])) };`); })();

const used = {};
/** A fresh visit opened at one card (a reload clears the visit, so the card is chosen after loading). */
async function openCard(stage, index) {
  await b.load(url(stage));
  await b.js(`const m=await import('./js/partition-journey.js');m.resetJourney();m.journeyState.at['${stage}']=${index};`);
  await b.hash('#math?lesson=7-1&stage=parent'); await b.hash(`#math?lesson=7-1&stage=${stage}`);
}
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
    ok(await isOk(), `${c.id}: correct construction accepted by geometry (${await feedback()})`);
    return;
  }
  if (c.type === 'count') {
    for (let i = 0; i < c.regions; i++) await tapRegion(i);
    ok(await b.js(`return document.querySelectorAll('.j-stage-pic .j-tile.counted').length === ${c.regions}`), `${c.id}: every tapped region is counted and numbered`);
    if (wrongFirst) { await tap(`input[data-j-num][value="${c.answer === '4' ? '6' : '4'}"]`); await tap(`input[data-j-name][value="${c.name}"]`); await tap(J('check')); ok(!(await isOk()), `${c.id}: wrong count rejected`); }
    await tap(`input[data-j-num][value="${c.answer}"]`); await tap(`input[data-j-name][value="${c.name}"]`);
    await tap(J('check'));
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
  await tap(J('check'));
  ok(await isOk(), `${c.id}: correct answer accepted`);
}

try {
  await b.viewport(1366, 768, false);
  // Entry: Lesson 7-1 opens on the journey, not a collapsed panel or a dropdown.
  await b.load(url());
  ok(await b.js('return location.hash.includes("stage=explore")'), 'Lesson 7-1 opens on section A');
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
      const graded = !['demo', 'concept', 'sizes'].includes(c.type);
      ok(await b.js(`return ${graded} === !!document.querySelector('${J('help')}')`), `${c.id}: ? Help shown on every question (and not on watch-only cards)`);
      // Independent questions are completed without help so they can earn independent credit.
      const wrongFirst = !c.independent && !triedWrong.has(c.type);
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
  ok(await b.js('return /Finish|results/i.test(document.title + document.querySelector(".j-summary h2").textContent)'), 'the last card leads to the results summary');

  // Every alternative construction listed for a shape is accepted through the real controls (not only the first).
  await b.load(url('shapes'));
  for (const c of meta.cards.shapes.filter((x) => x.type === 'build')) {
    await b.js(`const m=await import('./js/partition-journey.js');m.journeyState.at.shapes=${meta.cards.shapes.findIndex((x) => x.id === c.id)};`);
    await b.hash('#math?lesson=7-1&stage=parent'); await b.hash('#math?lesson=7-1&stage=shapes');
    for (let k = 0; k < c.solutions.length; k++) {
      await b.js(`const m=await import('./js/partition-journey.js');(m.journeyState.ui['${c.id}'] ||= {}).lines=[];`);
      await b.hash('#math?lesson=7-1&stage=parent'); await b.hash('#math?lesson=7-1&stage=shapes');
      await draw(c.solutions[k]); await tap(J('check'));
      ok(await isOk(), `${c.id}: alternative construction ${k + 1} of ${c.solutions.length} accepted`);
    }
  }

  // Unequal parts: the right number of parts with unequal areas is rejected and the pieces are marked.
  await openCard('method', 1);
  await draw([['t2-4', 'b2-4'], ['l2-4', 'b2-4'], ['t2-4', 'r2-4']]); // 4 parts: two triangles (1/8 each) and two pentagons (3/8 each)
  await tap(J('check'));
  const fb = await feedback();
  ok(!(await isOk()), 'unequal partition rejected');
  ok(/4 parts/.test(fb) && /bigger/.test(fb) && await b.js('return document.querySelectorAll(".j-tag").length === 2'), `unequal partition explained and the bigger/smaller parts are marked: ${fb}`);

  // Circle chords that miss the center are not accepted as slices.
  await openCard('mistake', meta.cards.mistake.findIndex((c) => c.id === 'f-fix'));
  await draw([['e0', 'e2'], ['e4', 'e6']]); await tap(J('check'));
  ok(!(await isOk()) && /center/.test(await feedback()), 'unsupported circle chord gets an honest message, not success');

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

  // Keyboard: a line can be drawn with Tab and Enter/Space alone.
  await openCard('method', 1);
  await b.js('document.querySelector(\'[data-point="t2-4"]\').focus()');
  await b.key('Enter');
  ok(await b.js('return document.activeElement?.dataset.point === "t2-4" && document.activeElement.getAttribute("aria-pressed") === "true"'), 'keyboard selects a point and keeps focus on it');
  await b.js('document.querySelector(\'[data-point="b2-4"]\').focus()');
  await b.key(' ');
  ok(await b.js('return document.querySelectorAll(".j-stage-pic .j-cut").length === 1'), 'keyboard Space completes a line');
  await tap(J('undo'));
  ok(await b.js('return document.querySelectorAll(".j-stage-pic .j-cut").length === 0'), 'Undo removes the last line');

  // Grown-up summary separates independent, wrong-first and assisted work.
  await openCard('shapes', 0);
  await tap(J('next')); await draw([['v0', 'v2'], ['v1', 'v3']]); await tap(J('check')); // guide: independent first try
  await tap(J('next')); await draw([['v0', 'v2']]); await tap(J('check')); await draw([['v1', 'v3']]); await tap(J('check')); // my turn: wrong first
  await tap(J('next')); await tap(J('next')); await tap(J('help')); await tap(J('hint')); await draw([['t2-6', 'b2-6'], ['t4-6', 'b4-6'], ['l1-2', 'r1-2']]); await tap(J('check'));
  await b.hash('#math?lesson=7-1&stage=parent');
  const sum = await b.js('return document.querySelector(".j-summary").textContent.replace(/\\s+/g," ")');
  ok(/1 wrong on the first try/.test(sum), `summary counts wrong first tries: ${sum.slice(0, 300)}`);
  ok(/1 finished after a hint/.test(sum), 'summary counts hint-assisted completions');
  ok(/1 right on the first try with no help/.test(sum), 'summary counts independent first-try successes (Guide Me diamond only)');
  ok(/Solo tries \(My Turn and Check & Reflect\): 0 of 15/.test(sum), 'a My Turn fixed after a wrong first try is not counted as a solo success');
  ok(/Skills to practise more/.test(sum) && /Diamond into fourths/.test(sum), 'summary lists skills needing practice');
  ok(await b.js('return !!document.querySelector(".parent-guide") && !!document.querySelector(".j-extra a[href*=\\"stage=try\\"]")'), 'parent page keeps the Parent Guide and links the original extra practice');

  // The original stages still work as optional extra practice.
  await b.load(url('learn'));
  ok(await b.js('return !!document.querySelector(".j-stepper") && !!document.querySelector("nav.stepper[aria-label=\\"Extra practice steps\\"] a[aria-current=step]")'), 'original Learn It opens as extra practice with both steppers');
  await b.load(url('test'));
  ok(await b.js('return !document.querySelector("[data-j=help]") && !document.querySelector("[data-act=help]")'), 'original scored test still has no hints');

  // Layout: no sideways scrolling; touch targets; light/dark contrast is handled by tokens (checked in the accessibility suite).
  for (const [w, h] of [[360, 740], [390, 844], [768, 1024], [1024, 768], [1280, 800], [1366, 768], [1920, 1080]]) {
    await b.viewport(w, h);
    for (const stage of ['explore', 'method', 'shapes', 'count', 'area', 'parent']) {
      await b.load(url(stage));
      ok(await b.js('return document.documentElement.scrollWidth <= innerWidth'), `${w}px ${stage}: no horizontal scroll`);
    }
    await b.load(url('shapes')); await tap(J('next'));
    const minPoint = await b.js('return Math.min(...[...document.querySelectorAll(".j-stage-pic [data-point] .hit")].map(e=>e.getBoundingClientRect().width))');
    ok(minPoint >= 24, `${w}px: construction targets at least 24px (smallest ${minPoint.toFixed(0)}px)`);
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
  // Every card (not only the first of each section) fits the screen at phone, tablet and Chromebook widths.
  for (const [w, h] of [[320, 640], [360, 740], [390, 844], [768, 1024], [1366, 768]]) {
    await b.viewport(w, h);
    for (const stage of meta.journey) {
      await b.load(url(stage));
      for (let i = 0; i < meta.cards[stage].length; i++) {
        const over = await b.js('return document.documentElement.scrollWidth - innerWidth');
        const pic = await b.js('const s=document.querySelector(".j-stage-pic svg");if(!s)return true;const r=s.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1');
        ok(over <= 0 && pic, `${w}px ${meta.cards[stage][i].id}: fits the screen (overflow ${over}px)`);
        if (i < meta.cards[stage].length - 1) await tap(J('next'));
      }
    }
  }
  await b.viewport(1366, 768, false);
  ok(b.errors.length === 0, `no browser errors: ${b.errors.join('; ')}`);
  ok(server.missing.length === 0, `no missing requests: ${server.missing.join('; ')}`);
  console.log(`Lesson 7-1 journey: ${checks} checks passed (${arg < 0 ? 'repository' : 'built site'}).`);
} finally { b.close(); server.close(); }
