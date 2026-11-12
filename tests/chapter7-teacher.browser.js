// Chapter 7 teaching release (Lessons 7-2 to 7-7): teach first, guided We Do, honest results and a readiness report.
// Run: node tests/chapter7-teacher.browser.js [--site _site]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { BASE, ROOT, startBrowser, startServer } from './lib/harness.js';

const p = process.argv.indexOf('--site'), root = p < 0 ? ROOT : path.resolve(process.argv[p + 1]);
const server = await startServer({ root }), b = await startBrowser();
let checks = 0;
const ok = (v, m) => { assert.ok(v, m); checks++; };
const js = (s) => b.js(s);
const url = (id, stage) => `${server.origin}${BASE}#math?lesson=${id}&stage=${stage}`;
const finish = (id, stages) => js(`const m=await import('./js/lesson-player.js');for(const s of ${JSON.stringify(stages)})m.stateFor(${JSON.stringify(id)},s).completed=true;`);
const text = () => js('return document.querySelector("#lesson-stage").textContent.replace(/\\s+/g," ")');

try {
  await b.viewport(1366, 768, false);
  for (const id of ['7-2', '7-3', '7-4', '7-5', '7-6', '7-7']) {
    const L = JSON.parse(fs.readFileSync(path.join(root, `data/lessons/${id}.json`)));
    // Lessons 7-2 to 7-7 are skill journeys (tests/skill-journey.browser.js walks them). The original five stages stay
    // as optional extra practice: open, labelled, without locks; the Final Check (test) opens after every skill.
    const sections = L.journey.sections.map((x) => x.id);
    await b.load(url(id, 'learn'));
    ok(/Extra practice \(optional\)/.test(await js('return document.querySelector(".lesson-bar").textContent')), `${id}: the original stages are labelled extra practice`);
    ok(await js('return document.querySelectorAll(".stepper li").length === 4 && !document.querySelector(".stepper li.locked")'), `${id}: extra practice has four open steps (the test is the Final Check)`);
    ok(await js('return document.querySelectorAll("#lesson-stage .teacher-words").length') === L.teacher.length && L.teacher.length > 0, `${id}: the math words are on the first Learn It screen`);
    await b.load(url(id, 'test'));
    ok(await js('return document.querySelector("#lesson-stage").dataset.locked === "true" && !document.querySelector("form[data-item]")'), `${id}: the Final Check by its address shows no questions before the skills`);
    // Practice Together (extra): help can be opened before the first try, and using it marks the answer as assisted.
    await b.load(url(id, 'together'));
    ok(await js('return !!document.querySelector("[data-act=help]")'), `${id}: Practice Together offers Help before the first try`);
    await b.clickAt('[data-act=help]');
    ok(await js(`const m=await import('./js/lesson-player.js');const st=m.stateFor(${JSON.stringify(id)},'together').items[${JSON.stringify(L.together.items[0].id)}];return st.help===1&&st.scaffoldAssisted===true;`), `${id}: help before a try is recorded as assisted`);
    await b.load(url(id, 'try'));
    ok(await js('return !document.querySelector("[data-act=help]")'), `${id}: Try It Yourself has no help before the first try`);
    await finish(id, sections);
    await b.hash(`#math?lesson=${id}&stage=test`);
    ok(await js('return !document.querySelector("#lesson-stage").dataset.locked && /Final Check/.test(document.querySelector("#stage-h").textContent)'), `${id}: the Final Check opens after every skill`);
    await js('localStorage.clear()');
  }

  // Honest results (7-3): the first test counts; a retake after the answers were shown is practice, never "You passed!".
  const id = '7-3', L = JSON.parse(fs.readFileSync(path.join(root, `data/lessons/${id}.json`)));
  await b.load(url(id, 'parent'));
  ok(/In progress\./.test(await text()), 'readiness report: in progress before the test');
  await finish(id, L.journey.sections.map((x) => x.id));
  await b.hash(`#math?lesson=${id}&stage=test`);
  const answerAll = async (right) => {
    for (let i = 0; i < L.test.items.length; i++) {
      const it = L.test.items[i];
      await js(`const {solution}=await import('./js/lib/lessons.js');const it=${JSON.stringify(it)};const sol=solution(it);const f=document.querySelector('form[data-item]');
        for(const [k,v] of Object.entries(sol)){if(k==='choice'){const n=it.options.length;const pick=${right}?Number(v):(Number(v)+1)%n;f.querySelector('input[name=choice][value="'+pick+'"]').click();}else{const e=f.querySelector('[name="'+k+'"]');if(e)e.value=String(${right}?v:Number(v)+1);}}
        f.dispatchEvent(new Event('input',{bubbles:true}));`);
      await b.clickAt(i < L.test.items.length - 1 ? '[data-act=next]' : '[data-act=submit]');
    }
  };
  await answerAll(false);
  ok(/0 out of 10/.test(await text()), 'first test: all wrong scores 0 of 10');
  await b.clickAt('.end-nav [data-act=restart]');
  await answerAll(true);
  const retake = await text();
  ok(/10 out of 10/.test(retake) && /practice retake/.test(retake) && !/You passed/.test(retake), 'a retake after the answers were shown is called practice, not "You passed!"');
  ok(/report uses the first test: 0 of 10/.test(retake), 'the retake says the first test is the one that counts');
  ok(!(await js('return [...document.querySelectorAll(".end-nav a.btn-primary")].some(a=>/Next: Lesson/.test(a.textContent))')), 'a failed first test does not send the child on to the next lesson');
  await b.hash(`#math?lesson=${id}&stage=parent`);
  const report = await text();
  ok(/Not ready yet\./.test(report) && /Final Check \(first try\): 0 of 10/.test(report), 'readiness report: the verdict comes from the first test');
  ok(/Questions missed on the Final Check/.test(report) && /workbook page done without help is the real check/.test(report), 'readiness report lists what to practice and the workbook step');

  // Phone width: the locked stepper fits (no sideways scrolling).
  for (const w of [320, 360, 390]) {
    await b.viewport(w, 740); await b.load(url('7-6', 'learn'));
    ok(await js('return document.documentElement.scrollWidth <= innerWidth'), `${w}px: no sideways scrolling with locked steps`);
    const small = await js('return [...document.querySelectorAll(".stepper a, .stepper .stage-locked")].filter(e=>{const r=e.getBoundingClientRect();return r.height<44||r.width<24}).length');
    ok(small === 0, `${w}px: every step in the stepper is a usable target`);
  }
  ok(b.errors.length === 0, `no browser errors: ${b.errors.join('; ')}`);
  ok(server.missing.length === 0, `no missing requests: ${server.missing.join('; ')}`);
  console.log(`Chapter 7 teacher: ${checks} checks passed (${p < 0 ? 'repository' : 'built site'}).`);
} finally { b.close(); server.close(); }
