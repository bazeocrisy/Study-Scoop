// Chapter 7 skill journeys (Lessons 7-2 to 7-7): each skill is its own section with I Do → We Do → You Do, in the
// same student experience as Lesson 7-1. This suite walks every card of every lesson as a child would: reading,
// stepping through worked examples, answering through the real inputs, trying again after a wrong answer, and
// checking that nothing can be skipped. It also checks saved progress (refresh), the Final Check, the report and reset.
// Run: node tests/skill-journey.browser.js [--site _site]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { BASE, ROOT, startBrowser, startServer } from './lib/harness.js';

const p = process.argv.indexOf('--site'), root = p < 0 ? ROOT : path.resolve(process.argv[p + 1]);
const server = await startServer({ root }), b = await startBrowser();
let checks = 0;
const ok = (v, m) => { assert.ok(v, m); checks++; };
const js = (s) => b.js(s);
const url = (id, stage) => `${server.origin}${BASE}#math?lesson=${id}${stage ? `&stage=${stage}` : ''}`;
const step = (name) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${name} (${checks} checks so far)`);
const read = (id) => JSON.parse(fs.readFileSync(path.join(root, `data/lessons/${id}.json`)));
const click = async (sel) => { await b.clickAt(sel); await b.wait(40); };
const has = (sel) => js(`return !!document.querySelector(${JSON.stringify(sel)})`);
const cardInfo = () => js('const c=document.querySelector("[data-card]");return c?{id:c.dataset.card,phase:c.dataset.phase,kind:c.dataset.kind}:null');

/** Answers the question on the screen with its solution (or a wrong answer), through the real inputs. */
async function answer(item, right) {
  // Counting scaffold first (the child touches each part), when the question has one.
  for (let n = 0; n < 30 && await has('[data-act=count-part][aria-pressed=false]'); n++) await click('[data-act=count-part][aria-pressed=false]');
  if (item.type === 'sentence') {
    await js(`const t=document.querySelector('textarea[name=text]');t.value='I count all the equal parts for the bottom and the chosen parts for the top.';t.dispatchEvent(new Event('input',{bubbles:true}));`);
    await click('form[data-item] button[type=submit]');
    for (const k of ['whole', 'reason', 'compare']) await js(`const c=document.querySelector('[data-review-check="${k}"]');if(c&&!c.checked){c.click();}`);
    await click('[data-act="review-written"]');
    return;
  }
  await js(`const {solution}=await import('./js/lib/lessons.js');const it=${JSON.stringify(item)};const sol=solution(it);const f=document.querySelector('form[data-item="'+it.id+'"]');
    for(const [k,v] of Object.entries(sol)){if(k==='choice'){const n=it.options.length;const pick=${right}?Number(v):(Number(v)+1)%n;f.querySelector('input[name=choice][value="'+pick+'"]').click();}
      else{const e=f.querySelector('[name="'+k+'"]');if(e){e.value=String(${right}?v:Number(v)+1);e.dispatchEvent(new Event('input',{bubbles:true}));}}}`);
  await click(`form[data-item="${item.id}"] button[type=submit]`);
  if (!right && await has('[data-act="coach-retry"]')) await click('[data-act="coach-retry"]');
}

try {
  await b.viewport(1366, 768, false);
  const LESSONS = ['7-2', '7-3', '7-4', '7-5', '7-6', '7-7'];
  for (const id of LESSONS) {
    const L = read(id), secs = L.journey.sections;
    step(`${id}: ${secs.length} skills`);
    await b.load(url(id)); await js('localStorage.clear()'); await b.load(url(id));
    ok(await js(`return location.hash.includes("stage=${secs[0].id}")`), `${id}: opening the lesson goes to Part A`);
    ok(await js('return document.querySelectorAll(".j-map .j-where").length===1 && !!document.querySelector(".j-map-all") && !!document.querySelector(".j-badge")'), `${id}: same map line, "See all parts" and phase badge as Lesson 7-1`);
    ok(await js('return !!document.querySelector(".teacher-words")'), `${id}: the math words are on the first card`);
    // Locked: later parts and the Final Check by address.
    await b.load(url(id, secs[1].id));
    ok(await js('return document.querySelector("#lesson-stage").dataset.locked==="true" && /is locked/.test(document.querySelector("#stage-h").textContent)'), `${id}: Part B by its address is locked`);
    await b.load(url(id, 'test'));
    ok(await js('return document.querySelector("#lesson-stage").dataset.locked==="true"'), `${id}: the Final Check by its address is locked`);
    // Jumping ahead inside a part (a forced card number) is pulled back to the first unfinished card.
    await b.load(url(id, secs[0].id));
    await js(`const m=await import('./js/lesson-player.js');m.stateFor('${id}','${secs[0].id}').i=${secs[0].cards.length - 1};`);
    await b.hash(`#math?lesson=${id}&stage=parent`); await b.hash(`#math?lesson=${id}&stage=${secs[0].id}`);
    ok(await js('return /Card 2 of/.test(document.querySelector(".j-cardnum").textContent)'), `${id}: a forced jump ahead shows the first unfinished card (card 1 was read, card 2 was not)`);
    for (const [si, s] of secs.entries()) {
      await b.load(url(id, s.id));
      ok(await js('return !document.querySelector("#lesson-stage").dataset.locked'), `${id} ${s.id}: open after the earlier parts`);
      const phases = s.cards.map((c) => c.phase);
      ok(phases.includes('ido') && phases.includes('wedo') && phases.includes('youdo') && phases.indexOf('ido') < phases.indexOf('wedo') && phases.indexOf('wedo') < phases.indexOf('youdo'), `${id} ${s.id}: I Do, then We Do, then You Do`);
      for (const [ci, c] of s.cards.entries()) {
        const info = await cardInfo();
        ok(info && info.phase === c.phase && info.kind === c.kind, `${id} ${s.id} card ${ci + 1}: shown in order (${c.phase} ${c.kind})`);
        ok(await js(`return /Card ${ci + 1} of ${s.cards.length}/.test(document.querySelector(".j-cardnum").textContent) && /Part ${String.fromCharCode(65 + si)}/.test(document.querySelector(".j-where").textContent)`), `${id} ${s.id} card ${ci + 1}: progress line`);
        const item = c.kind === 'example' ? c.why : c.item;
        if (c.kind === 'example') {
          ok(await js('return !document.querySelector(".j-nav [data-act=next]:not([disabled]), .j-nav a.btn-primary")'), `${id} ${s.id}: a worked example cannot be skipped (no way forward before its last step)`);
          while (await has('[data-act="step-next"]')) await click('[data-act="step-next"]');
        }
        if (item) {
          ok(await js('const n=document.querySelector(".j-nav [data-act=next]")||document.querySelector(".j-nav .btn[disabled]");return !!n && n.disabled'), `${id} ${s.id} ${item.id}: Next waits for the answer`);
          if (c.phase === 'youdo') ok(!(await has('[data-act="help"]')), `${id} ${s.id} ${item.id}: You Do has no help before a try`);
          if (c.phase === 'wedo' && item.type !== 'sentence') ok(await has('[data-act="help"]'), `${id} ${s.id} ${item.id}: We Do offers help from the start`);
          if (c.phase === 'youdo' && ci === s.cards.findIndex((x) => x.phase === 'youdo') && item.type !== 'sentence') {
            await answer(item, false);
            ok(await js(`return document.querySelector('form[data-item="${item.id}"]')?.dataset.state!=='correct'`), `${id} ${s.id} ${item.id}: a wrong answer is not accepted`);
            ok(await has('[data-act="help"]'), `${id} ${s.id} ${item.id}: help opens after a try`);
          }
          await answer(item, true);
          ok(await js(`return document.querySelector('form[data-item="${item.id}"]')?.dataset.state==='correct'`), `${id} ${s.id} ${item.id}: the right answer is accepted`);
        }
        if (ci < s.cards.length - 1) { await click('.j-nav [data-act="next"]'); }
      }
      ok(await has('.j-nav a.btn-primary'), `${id} ${s.id}: the last card leads on`);
      if (si === 0) {
        // Saved progress: a refresh keeps the finished part, and the lesson resumes at Part B.
        await b.load(url(id));
        ok(await js(`return location.hash.includes("stage=${secs[1].id}")`), `${id}: after a refresh the lesson resumes at Part B`);
        ok(await js(`return Object.keys(localStorage).join()==="studyScoop.lesson${id}.progress"`), `${id}: one storage key for the lesson`);
      }
    }
    // Final Check opens, then the report.
    await b.load(url(id, 'test'));
    ok(await js('return !document.querySelector("#lesson-stage").dataset.locked && /Final Check/.test(document.querySelector("#stage-h").textContent)'), `${id}: the Final Check opens after every skill`);
    for (const [i, it] of L.test.items.entries()) {
      await answer({ ...it, type: it.type }, i % 3 !== 0).catch(() => {});
      await click(i < L.test.items.length - 1 ? '[data-act=next]' : '[data-act=submit]');
      if (i === L.test.items.length - 1 && await has('[data-act=submit]')) await click('[data-act=submit]');
    }
    ok(await js('return /out of 10/.test(document.querySelector("#lesson-stage").textContent)'), `${id}: Final Check scored`);
    await b.load(url(id, 'parent'));
    const report = await js('return document.querySelector(".j-summary").textContent.replace(/\\s+/g," ")');
    ok(new RegExp(`Lesson ${id} readiness report`).test(report) && /Final Check \(first try\): \d+ of 10/.test(report), `${id}: report shows the first Final Check`);
    ok(await js(`return document.querySelectorAll(".j-ready tbody tr").length===${secs.length}`), `${id}: report lists every skill`);
    ok(/On own, first try|After help steps|On own, after another try/.test(report), `${id}: report separates on own and with help`);
    // Reset with confirmation.
    await click('[data-l-reset="ask"]'); await click('[data-l-reset="no"]');
    ok(await js(`return !!localStorage.getItem("studyScoop.lesson${id}.progress")`), `${id}: Cancel keeps progress`);
    await click('[data-l-reset="ask"]'); await click('[data-l-reset="yes"]'); await b.wait(200);
    ok(await js(`return !localStorage.getItem("studyScoop.lesson${id}.progress")`), `${id}: Reset erases the lesson's progress`);
  }

  step('7-1 and 7-2 side by side');
  // The same instructional pattern: one progress line, one card with a phase badge, gated Next, parts that open in order.
  const shape = async (u) => { await b.load(u); return js(`return {map:!!document.querySelector(".j-map .j-where .j-cardnum"),all:!!document.querySelector(".j-map-all summary"),badge:document.querySelector(".j-badge")?.textContent.trim(),cards:document.querySelectorAll("[data-card]").length,nav:!!document.querySelector(".j-nav"),locked:document.querySelectorAll(".j-stepper li.locked").length>0}`); };
  await js('localStorage.clear()');
  const a = await shape(url('7-1', 'explore')), c = await shape(url('7-2'));
  ok(JSON.stringify(a) === JSON.stringify(c), `7-1 and 7-2 share the pattern: ${JSON.stringify(a)} vs ${JSON.stringify(c)}`);
  for (const w of [320, 390]) {
    await b.viewport(w, 740); await b.load(url('7-4'));
    ok(await js('return document.documentElement.scrollWidth<=innerWidth'), `${w}px: no sideways scrolling`);
    ok(await js('const r=document.querySelector("#stage-h").getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight'), `${w}px: the card title is on the first screen`);
  }
  ok(b.errors.length === 0, `no browser errors: ${b.errors.join('; ')}`);
  ok(server.missing.length === 0, `no missing requests: ${server.missing.join('; ')}`);
  console.log(`Skill journeys: ${checks} checks passed (${p < 0 ? 'repository' : 'built site'}).`);
} finally { b.close(); server.close(); }
