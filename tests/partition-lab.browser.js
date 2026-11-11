// Real browser interactions, desktop/touch emulation and honest assistance history.
// This establishes behavior, not observed child comprehension or physical-device support.
import assert from 'node:assert/strict';
import path from 'node:path';
import { BASE, ROOT, startBrowser, startServer } from './lib/harness.js';
const arg = process.argv.indexOf('--site');
const root = arg < 0 ? ROOT : path.resolve(process.argv[arg + 1]);
const server = await startServer({ root });
const b = await startBrowser();
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks++; };
const act = action => `[data-partition-lab] [data-lab-action="${action}"]`;
const mode = async value => { await b.clickAt(`${act('mode')}[data-mode="${value}"]`); };
const choose = async id => { await b.js(`const s=document.querySelector('[data-lab-task]');s.value=${JSON.stringify(id)};s.dispatchEvent(new Event('change',{bubbles:true}));`); };
const solve = async task => {
  for (const pair of task.solutions[0]) {
    for (const point of pair) await b.clickAt(`.partition-point-buttons [data-lab-point="${point}"]`);
  }
  await b.clickAt(act('check'));
};
try {
  await b.viewport(1366, 900, false);
  await b.load(server.origin + BASE + '#math?lesson=7-1&stage=learn');
  await b.clickAt('.partition-lab-shell > summary');
  await b.waitFor('document.querySelector("[data-lab-task]")');
  const state = () => b.js('const m=await import("./js/partition-lab.js");return m.labState;');
  const tasks = await b.js('const m=await import("./js/lib/partition-geometry.js");return m.PARTITION_TASKS;');
  ok(tasks.length >= 8, 'required construction shapes registered');
  await mode('learn');
  const before = await b.js('return document.querySelector("[data-partition-lab] svg").outerHTML');
  await b.clickAt(act('next-step'));
  ok(await b.js('return document.querySelector("[data-partition-lab] svg").outerHTML') !== before, 'Learn It changes the construction picture');
  await mode('practice');
  await b.clickAt(act('check'));
  ok(await b.js('return !/Great|equal parts are correct/.test(document.querySelector("[data-partition-lab]").textContent)'), 'empty construction is not credited');
  await b.clickAt(act('hint'));
  await b.clickAt(act('reveal'));
  await mode('practice');
  await b.clickAt(act('reset'));
  await solve(tasks[0]);
  ok(!(await state()).records[`${tasks[0].id}:practice`].independent, 'revealed practice never earns independent credit');
  const assisted = await b.js('return document.querySelector("[data-lab-summary]").textContent');
  ok(/hint/i.test(assisted) && /reveal|solution/i.test(assisted), 'parent summary exposes both assistance types');
  await mode('test');
  ok(await b.js(`return !document.querySelector('${act('hint')},${act('reveal')},${act('next-step')}')`), 'Test Me withholds teaching controls');
  const transfer = await b.js('const m=await import("./js/lib/partition-geometry.js");return m.TASKS.map(m.makeTestTask);');
  ok(transfer[0].polygon[1][0] !== tasks[0].polygon[1][0], 'transfer triangle changes proportions, not only orientation');
  ok(transfer.find(t=>t.id==="circle-eighths").count === 6, 'circle transfer changes partition count');
  for (const task of transfer) {
    await choose(task.id); await b.clickAt(act('reset')); await solve(task);
    const record = (await state()).records[`${task.id}:test`];
    ok(record?.correct, `${task.id} construction is checked correctly by the browser`);
    ok(record?.independent === true, `${task.id} fresh transfer test receives independent first-check credit`);
  }
  const square = transfer.find(t => t.id === 'square-sixths');
  if (square?.solutions[1]) {
    await choose(square.id); await b.clickAt(act('reset'));
    await solve({ ...square, solutions: [square.solutions[1]] });
    ok((await state()).result.valid, 'alternative six-part grid accepted through actual controls');
  }
  await choose(tasks[0].id);
  ok((await state()).result === null, 'changing tasks clears prior checked regions');
  const assistedRecord = (await state()).records[`${tasks[0].id}:practice`];
  ok(assistedRecord.hints && assistedRecord.revealed, 'reset and mode changes preserve help history');
  ok(await b.js('return /independen/i.test(document.querySelector("[data-lab-summary]").textContent)'), 'summary distinguishes independent completion');
  await choose('diamond-fourths');
  await b.clickAt(act('reset'));
  await b.clickAt('.partition-point-buttons [data-lab-point="v0"]');
  await b.clickAt('.partition-point-buttons [data-lab-point="v2"]');
  await b.clickAt(act('check'));
  ok(!(await state()).result.valid, 'incomplete two-region construction rejected');
  ok(/2 parts/.test((await state()).feedback), 'wrong feedback describes actual region count');
  const reasoning = await b.js('const m=await import("./js/lib/partition-reasoning.js");return m.REASONING_TASKS;');
  for (const task of reasoning) {
    await mode('practice'); await choose(task.id);
    await b.clickAt(`[data-lab-choice][value="${task.choices.find(([value])=>value!==task.answer)[0]}"]`);
    await b.clickAt(act('check'));
    ok(!(await state()).result.valid, `${task.id} misconception is rejected`);
    ok((await state()).feedback.includes(task.why), `${task.id} wrong answer explains observable areas`);
    await b.clickAt(`[data-lab-choice][value="${task.answer}"]`);
    await b.clickAt(act('check'));
    ok((await state()).result.valid, `${task.id} correct reasoning accepted`);
    await b.clickAt(`[data-lab-choice][value="${task.choices.find(([value])=>value!==task.answer)[0]}"]`);
    ok((await state()).result === null && (await state()).feedback === '', `${task.id} response revision clears stale success feedback`);
    await mode('learn');
    const picture = await b.js('return document.querySelector("[data-partition-lab] svg").outerHTML');
    await b.clickAt(act('next-step'));
    ok(await b.js('return document.querySelector("[data-partition-lab] svg").outerHTML') !== picture, `${task.id} demonstration changes observable diagram`);
  }
  for (const task of [...tasks, ...reasoning]) {
    await mode('practice'); await choose(task.id); await b.clickAt(act('reset'));
    if (task.solutions) {
      for (const point of task.solutions[0][0]) await b.clickAt(`.partition-point-buttons [data-lab-point="${point}"]`);
    } else await b.clickAt(`[data-lab-choice][value="${task.choices[0][0]}"]`);
    const work = await state();
    await b.clickAt(act('question-help'));
    ok(await b.js(`return !!document.querySelector('${act('help-hint')}') && !document.querySelector('${act('help-steps')},${act('help-answer')}')`), `${task.id} help begins with only a Hint`);
    await b.clickAt(act('help-hint'));
    ok(await b.js(`return !!document.querySelector('${act('help-steps')}') && !document.querySelector('${act('help-answer')}')`), `${task.id} hint unlocks steps without revealing answer`);
    await b.clickAt(act('help-steps'));
    while (await b.js(`return !!document.querySelector('${act('help-next')}')`)) await b.clickAt(act('help-next'));
    ok(await b.js(`return !!document.querySelector('${act('help-answer')}')`), `${task.id} completed steps unlock explicit answer reveal`);
    await b.clickAt(act('help-answer'));
    const helped = await state(), record = helped.records[`${task.id}:practice`];
    assert.deepEqual(helped.lines, work.lines, `${task.id} help keeps the child's divider construction`);
    assert.equal(helped.choice, work.choice, `${task.id} help keeps the child's chosen response`);
    ok(record.hints && record.stepsUsed && record.revealed && !record.independent, `${task.id} all help levels recorded separately from independent mastery`);
    await b.clickAt(act('reset'));
    ok((await state()).help === null && (await state()).records[`${task.id}:practice`].revealed, `${task.id} reset closes help and preserves reveal history`);
  }
  await mode('test');
  await b.clickAt(act('question-help'));
  ok(await b.js(`return !document.querySelector('${act('help-hint')},${act('help-steps')},${act('help-answer')}')`), 'test question-mark help does not expose mathematical assistance');
  await mode('practice');
  await choose(tasks[0].id);
  await b.clickAt(act('reset'));
  await b.js('document.querySelector("[data-lab-point]").focus()');
  await b.key('Enter');
  ok(await b.js('return document.activeElement.matches("[data-lab-point]")'), 'endpoint keyboard activation retains focus');
  for (const width of [360, 390, 768, 1024, 1366, 1920]) {
    await b.viewport(width, width < 768 ? 844 : 1000);
    ok(await b.js('return document.documentElement.scrollWidth <= innerWidth'), `${width}px has no horizontal overflow`);
    ok(await b.js('return [...document.querySelectorAll(".partition-point-buttons [data-lab-point]")].every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44;})'), `${width}px endpoint touch targets >=44px`);
    if (width === 390) {
      await b.clickAt(act('reset'));
      const target = await b.js('const e=document.querySelector(".partition-point-buttons [data-lab-point]");e.scrollIntoView({block:"center"});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,id:e.dataset.labPoint};');
      await b.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[{x:target.x,y:target.y}]});
      await b.send('Input.dispatchTouchEvent', {type:'touchEnd', touchPoints:[]});
      await b.waitFor(`document.querySelector('.partition-point-buttons [data-lab-point="${target.id}"]').getAttribute('aria-pressed')==='true'`);
      ok((await state()).selected === target.id, 'touch emulation activates a construction endpoint');
    }
    await b.shot(path.join(ROOT, 'docs/reviews/images', `partition-lab-${width}.png`));
  }
  await b.viewport(390, 844);
  await mode('learn');
  while (await b.js('return !document.querySelector("[data-lab-action=next-step]").disabled')) await b.clickAt(act('next-step'));
  await b.shot(path.join(ROOT, 'docs/reviews/images', 'partition-lab-triangle-demonstration.png'));
  await mode('practice'); await b.clickAt(act('check'));
  await b.shot(path.join(ROOT, 'docs/reviews/images', 'partition-lab-correction.png'));
  await b.hash('#math?lesson=7-1&stage=parent');
  ok(Object.keys((await state()).records).length > 8, 'in-memory report survives lesson stage navigation');
  await b.hash('#math?lesson=7-1&stage=test');
  ok(await b.js('return !document.querySelector("[data-partition-lab]")'), 'shared scored test cannot expose the lab solution');
  await b.load(server.origin + BASE + '#math?lesson=7-1&stage=together');
  ok(await b.js('return document.querySelector("[data-act=help]")?.textContent.includes("Hint")'), 'shared guided question offers a question hint before any wrong answer');
  await b.clickAt('[data-act=help]');
  const answer = await b.js('const l=await(await fetch("data/lessons/7-1.json")).json();return l.together.items[0].options.findIndex(o=>o.correct);');
  await b.clickAt(`form input[name=choice][value="${answer}"]`);
  await b.clickAt('form button[type=submit]');
  ok(await b.js('const {stateFor}=await import("./js/lesson-player.js");const s=stateFor("7-1","together");const v=Object.values(s.items)[0];return v.status==="correct" && v.scaffoldAssisted===true;'), 'first correct shared answer after a hint is assisted');
  ok(await b.js('return document.querySelector(".lesson-history").textContent.includes("Current round: 0 questions right on the first attempt")'), 'shared current summary excludes hinted first-check success');
  await b.hash('#math?lesson=7-1&stage=parent');
  ok(await b.js('return /Practice Together, latest round: 0 right/.test(document.querySelector(".lesson-history").textContent)'), 'parent summary excludes assisted first-check success');
  await b.load(server.origin + BASE + '#math?lesson=7-1&stage=learn');
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
  ok(b.errors.length === 0, `no browser errors: ${b.errors.join('; ')}`);
  ok(server.missing.length === 0, `no missing requests: ${server.missing.join('; ')}`);
  console.log(`Partition lab: ${checks} checks passed (${arg < 0 ? 'repository' : 'built site'}).`);
} finally { b.close(); server.close(); }
