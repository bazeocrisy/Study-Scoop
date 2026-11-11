// Original guided constructions. State lasts only in the open tab.
import { html } from './lib/html.js';
import { REASONING_TASKS, reasoningPicture, makeReasoningTest, reasoningCorrection } from './lib/partition-reasoning.js';
import { TASKS, validatePartition, makeTestTask } from './lib/partition-geometry.js';
export const labState = { mode: 'learn', task: TASKS[0]?.id, step: 0, lines: [], selected: null, feedback: '', records: {}, opened: false, help: null };
const recordFor = (task, mode = labState.mode) => labState.records[`${task.id}:${mode}`] ||= { task: task.label, mode, attempts: 0, correct: false, independent: false, hints: false, stepsUsed: false, revealed: false, learned: false, wrong: false };
const allTasks = () => [...TASKS,...REASONING_TASKS];
const currentTask = () => { const task=allTasks().find(t=>t.id===labState.task)||TASKS[0]; return labState.mode==='test'?(task.kind==='reasoning'?makeReasoningTest(task):makeTestTask(task)):task; };
const pointFor = (task,id) => task.points.find(p => p.id === id);
const clean = () => { labState.help=null; labState.alternate=false; labState.result = null; labState.choice = null; labState.lines = []; labState.selected = null; labState.feedback = ''; labState.step = 0; };
export function partitionLabShell() {
  return html`<details class="card partition-lab-shell" ${labState.opened ? html`open` : ''}><summary>Partition Lab: make equal parts</summary><div data-partition-lab></div></details>`;
}
function svg(task, lines, active, resultOverride) {
  const transform = '';
  const shownResult=resultOverride!==undefined?resultOverride:labState.mode==='learn'&&labState.step===task.steps.length-1?validatePartition(task,lines):labState.result; const regions=shownResult?.valid?shownResult.regions||[]:[];
  return html`<svg class="partition-picture" viewBox="0 0 300 300" role="group" aria-label="${task.label}. ${lines.length} divider lines drawn. ${task.points.map((p,i)=>`Point ${i+1} is ${p.label}`).join('. ')}. Drawn lines: ${lines.map(([a,b])=>`${task.points.findIndex(p=>p.id===a)+1} to ${task.points.findIndex(p=>p.id===b)+1}`).join(', ') || 'none'}. Choose two labeled points to draw a divider."><g transform="${transform}">
    ${task.shape === 'circle' ? html`<circle class="partition-whole" cx="${task.center[0]}" cy="${task.center[1]}" r="${task.radius}"/>` : html`<polygon class="partition-whole" points="${task.polygon.map(p=>p.join(',')).join(' ')}"/>`}
    ${regions.filter(r=>Array.isArray(r)).map((r,i)=>html`<polygon class="partition-region region-${i%4}" points="${r.map(p=>p.join(',')).join(' ')}"/>${task.id==='triangle-fourths'?html`<text class="partition-share" x="${r.reduce((n,p)=>n+p[0],0)/r.length}" y="${r.reduce((n,p)=>n+p[1],0)/r.length}">1/4</text>`:''}`)}
    ${lines.map(([a,b])=>{const p=pointFor(task,a),q=pointFor(task,b);return p&&q?html`<line class="partition-divider" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"/>`:'';})}
    ${(active || labState.step > 0) ? task.points.map((p,i)=>html`<g ${active ? html`role="button" tabindex="0" data-lab-point="${p.id}" aria-label="Point ${i+1}: ${p.label}" aria-pressed="${labState.selected === p.id}"` : ''} class="partition-point ${labState.selected === p.id ? 'selected':''}"><circle class="point-hit" cx="${p.x}" cy="${p.y}" r="18"/><circle cx="${p.x}" cy="${p.y}" r="8"/><text x="${p.x}" y="${p.y-13}" >${i+1}</text></g>`):''}
  </g></svg>`;
}
function history() {
  const records=Object.values(labState.records), attempted=records.filter(r=>r.attempts), correct=records.filter(r=>r.correct), independent=records.filter(r=>r.independent);
  return html`<details data-lab-summary class="partition-parent"><summary>Parent: Partition Lab summary</summary><p>Activities attempted: ${attempted.length}. Completed correctly: ${correct.length}. Independent Test Me completions: ${independent.length}. Activities with hints: ${records.filter(r=>r.hints).length}. Activities with step help: ${records.filter(r=>r.stepsUsed).length}. Activities with a revealed solution: ${records.filter(r=>r.revealed).length}.</p><p>Independent means correct on the first checked Test Me attempt. Earlier Learn It and Practice It help is shown separately. Test Me offers no assistance. Correct answers after an incorrect check are reported as completed on retry.</p><ul>${records.map(r=>html`<li>${r.task}, ${r.mode}: ${r.attempts} checks; ${r.correct?'completed correctly':'not yet completed'}${r.independent?'; independent first check':r.correct&&r.mode==='test'?'; completed on retry':''}${r.hints?'; hint used':''}${r.stepsUsed?'; visual steps used':''}${r.revealed?'; solution revealed':''}${r.learned?'; demonstration viewed':''}${r.wrong?'; review this shape':''}.</li>`)}</ul><p>Only this open tab; refreshing clears the report. Explanations are discussed with a grown-up, not computer-graded for meaning.</p></details>`;
}
function render() {
  const base=currentTask(); const task=labState.alternate&&base.alternateSteps&&labState.mode==='learn'?{...base,steps:base.alternateSteps}:base; if(task.kind==='reasoning') return renderReasoning(task); const learn=labState.mode==='learn', lines=learn ? (task.steps[Math.min(labState.step,(task.steps?.length || 3)-1)]?.lines || []) : labState.lines;
  return html`<h2 tabindex="-1" data-lab-heading>Make equal parts</h2><p>Partition means divide a whole into parts. Equal parts cover the same amount of space. We compare area, not just the number of pieces.</p>
    <div class="partition-modes" aria-label="Learning mode">${[['learn','Learn It'],['practice','Practice It'],['test','Test Me']].map(([id,label])=>html`<button type="button" data-lab-action="mode" data-mode="${id}" aria-pressed="${labState.mode===id}">${label}</button>`)}</div>
    <label class="partition-task-label">Choose a shape <select data-lab-task>${allTasks().map(t=>html`<option value="${t.id}" ${t.id===task.id?html`selected`:''}>${t.label}</option>`)}</select></label>
    <h3>Divide this ${task.label.split(':')[0].toLowerCase()} into ${task.count} equal parts.</h3>${questionHelpButton()}
    ${!learn?html`<p>${labState.mode==='test'?'New problem. Work on your own; no hints here. ':''}Tap or click two numbered points to join them. Keyboard: Tab to a point, then Enter or Space. Tap the same pair again to remove its line.</p>`:''}
    ${svg(task,lines,!learn)}
    ${learn&&labState.step>0?html`<p>${task.points.map((p,i)=>`${i+1}: ${p.label}`).join('; ')}</p>`:''}
    ${!learn ? html`<div class="partition-point-buttons" aria-label="Construction points">${task.points.map((p,i)=>html`<button type="button" data-lab-point="${p.id}" aria-pressed="${labState.selected===p.id}">${i+1}: ${p.label}</button>`)}</div>` : ''}
    ${learn?html`<p class="partition-teaching" aria-live="polite">Step ${labState.step+1} of ${(task.steps?.length || 3)}: ${task.steps[labState.step]?.text}</p><div class="partition-controls"><button type="button" data-lab-action="previous-step" ${labState.step===0?html`disabled`:''}>Previous step</button><button type="button" data-lab-action="next-step" ${labState.step>=(task.steps?.length || 3)-1?html`disabled`:''}>Next step</button><button type="button" data-lab-action="mode" data-mode="practice">Try it myself</button>${task.alternateSteps?html`<button type="button" data-lab-action="alternate">Show another way</button>`:''}</div>`:html`<p class="partition-selection">${labState.selected ? `Point ${task.points.findIndex(p=>p.id===labState.selected)+1} selected. Choose the other end.`:'Choose the first end of a line.'}</p><div class="partition-controls"><button type="button" data-lab-action="check">Check my parts</button><button type="button" data-lab-action="reset">Reset drawing</button>${labState.mode==='practice'?html`<button type="button" data-lab-action="hint">Hint</button><button type="button" data-lab-action="reveal">Show Me How</button>`:''}</div>`}
    ${questionHelp(task)}<p class="partition-feedback" role="status" tabindex="-1">${labState.feedback}</p>
    ${history()}`;
}
export function mountPartitionLab(app, signal) {
  const root=app.querySelector('[data-partition-lab]');if(!root)return;
  const redraw=(focus)=>{root.innerHTML=render().s;const target=root.querySelector(focus||'[data-lab-heading]'); (target&&!target.disabled?target:root.querySelector('[data-lab-heading]'))?.focus({preventScroll:true});if(focus==='[data-lab-help-heading]')target?.scrollIntoView({block:'start'});};
  root.innerHTML=render().s;
  root.closest('details').addEventListener('toggle',()=>{labState.opened=root.closest('details').open;if(labState.opened&&labState.mode==='learn')recordFor(currentTask(),'learn').learned=true;},{signal});
  root.addEventListener('change',e=>{if(e.target.matches('[data-lab-choice]')){labState.choice=e.target.value;labState.feedback='';labState.result=null;const feedback=root.querySelector('.partition-feedback');if(feedback)feedback.textContent='';return;}if(!e.target.matches('[data-lab-task]'))return;labState.task=e.target.value;clean();if(labState.mode==='learn')recordFor(currentTask(),'learn').learned=true;redraw('[data-lab-task]');},{signal});
  const activate=(e)=>{
    const p=e.target.closest('[data-lab-point]');if(p&&labState.mode!=='learn'){
      const id=p.dataset.labPoint;if(labState.selected&&labState.selected!==id){const a=labState.selected;const idx=labState.lines.findIndex(l=>l.includes(a)&&l.includes(id));if(idx<0)labState.lines.push([a,id]);else labState.lines.splice(idx,1);labState.selected=null;labState.feedback='';labState.result=null;}else labState.selected=labState.selected===id?null:id;
      redraw(`${p.tagName==='BUTTON'?'.partition-point-buttons ':''}[data-lab-point="${id}"]`);return;
    }
    const b=e.target.closest('[data-lab-action]');if(!b)return;
    const action=b.dataset.labAction,task=currentTask();
    if(action==='question-help'){labState.help=labState.help?null:{level:0,step:0};redraw(labState.help?'[data-lab-help-heading]':'[data-lab-action=question-help]');return;}
    if(action==='help-hint'&&labState.mode!=='test'){labState.help={level:1,step:0};recordFor(task).hints=true;redraw('[data-lab-help-heading]');return;}
    if(action==='help-steps'&&labState.mode!=='test'){labState.help={level:2,step:0};recordFor(task).stepsUsed=true;redraw('[data-lab-help-heading]');return;}
    if(action==='help-next'&&labState.mode!=='test'){labState.help.step=Math.min(helpStepsFor(task).length-1,(labState.help.step||0)+1);recordFor(task).stepsUsed=true;redraw('[data-lab-help-heading]');return;}
    if(action==='help-answer'&&labState.mode!=='test'){labState.help={level:3,step:0};recordFor(task).revealed=true;redraw('[data-lab-help-heading]');return;}
    if(action==='mode'){labState.mode=b.dataset.mode;clean();if(labState.mode==='learn')recordFor(currentTask(),'learn').learned=true;redraw(`[data-mode="${labState.mode}"]`);return;}
    if(action==='alternate'&&task.alternateSteps){labState.alternate=!labState.alternate;labState.step=0;redraw('[data-lab-heading]');return;}
    if(action==='reset'){clean();redraw('[data-lab-action="reset"]');return;}
    if(action==='next-step'||action==='previous-step'){labState.step=Math.max(0,Math.min((labState.alternate&&task.alternateSteps?task.alternateSteps.length:(task.steps?.length || 3))-1,labState.step+(action==='next-step'?1:-1)));recordFor(task,'learn').learned=true;redraw(`[data-lab-action="${action}"]`);return;}
    if(action==='hint'&&labState.mode==='practice'){recordFor(task).hints=true;labState.feedback=task.hint || (task.kind==='reasoning'?task.steps[1]:task.steps[1]?.text)||'Compare the areas covered by each part.';redraw('.partition-feedback');return;}
    if(action==='reveal'&&labState.mode==='practice'){recordFor(task).revealed=true;labState.mode='learn';labState.step=0;recordFor(task,'learn').learned=true;redraw('[data-lab-heading]');return;}
    if(action==='check'&&labState.mode!=='learn'){
      const r=recordFor(task),result=task.kind==='reasoning'?{valid:labState.choice===task.answer,message:labState.choice?reasoningCorrection(task,labState.choice):'Choose an answer before checking.'}:validatePartition(task,labState.lines);labState.result=result;r.attempts++;
      const assisted=r.hints||r.revealed;
      if(task.kind==='reasoning'&&!labState.choice){r.attempts--;labState.feedback=result.message;redraw('.partition-feedback');return;}
      if(result.valid){r.correct=true;if(labState.mode==='test'&&r.attempts===1&&!assisted)r.independent=true;labState.feedback=`Yes! ${task.why} ${labState.mode==='test'?'Test result recorded.':''}`;}else{r.wrong=true;labState.feedback=result.message||`These dividers do not yet make ${task.count} equal-area parts. Compare the spaces, then move or add a divider.`;}
      redraw('.partition-feedback');
    }
  };
  root.addEventListener('click',activate,{signal});
  root.addEventListener('keydown',e=>{if(e.target.tagName !== 'BUTTON' && (e.key==='Enter'||e.key===' ')&&e.target.closest('[data-lab-point]')){e.preventDefault();activate(e);}},{signal});
}

function renderReasoning(task) {
 const learn=labState.mode==='learn';
 return html`<h2 tabindex="-1" data-lab-heading>Shape detective</h2><div class="partition-modes">${[['learn','Learn It'],['practice','Practice It'],['test','Test Me']].map(([id,label])=>html`<button type="button" data-lab-action="mode" data-mode="${id}" aria-pressed="${labState.mode===id}">${label}</button>`)}</div><label class="partition-task-label">Choose a task<select data-lab-task>${allTasks().map(t=>html`<option value="${t.id}" ${t.id===task.id?html`selected`:''}>${t.label}</option>`)}</select></label><h3>${task.question}</h3>${questionHelpButton()}${reasoningPicture(task,learn?labState.step:3,labState.mode==='test')}${learn?html`<p class="partition-teaching">Step ${labState.step+1} of 3: ${task.steps[labState.step]}</p><div class="partition-controls"><button type="button" data-lab-action="previous-step" ${labState.step===0?html`disabled`:''}>Previous step</button><button type="button" data-lab-action="next-step" ${labState.step===2?html`disabled`:''}>Next step</button><button type="button" data-lab-action="mode" data-mode="practice">Try it myself</button></div>`:html`<fieldset><legend>Choose your answer</legend>${task.choices.map(([value,label])=>html`<label class="partition-choice"><input type="radio" name="lab-choice" data-lab-choice value="${value}" ${labState.choice===value?html`checked`:''}>${label}</label>`)}</fieldset><div class="partition-controls"><button type="button" data-lab-action="check">Check my parts</button><button type="button" data-lab-action="reset">Try again</button>${labState.mode==='practice'?html`<button type="button" data-lab-action="hint">Hint</button><button type="button" data-lab-action="reveal">Show Me How</button>`:''}</div>`}${questionHelp(task)}<p class="partition-feedback" role="status" tabindex="-1">${labState.feedback}</p>${history()}`;
}

function questionHelpButton() {
 return html`<button type="button" class="partition-question-help" data-lab-action="question-help" aria-label="Help with this question" aria-expanded="${Boolean(labState.help)}">? <span>Help with this question</span></button>`;
}
const HELP_HINTS={
 'triangle-fourths':'Find each halfway point along a side. A midpoint is equally far from that side’s two corners.',
 'diamond-fourths':'Look for corners opposite one another. Compare the spaces on each side of the center.',
 'square-sixths':'The edge points are equally spaced. Matching widths can help you make equal areas.',
 'circle-eighths':'Use the center. Compare the turns between dividers, not the lengths of the curved edges alone.',
 'octagon-fourths':'Look for the center and opposite corners. Think about how a quarter turn moves the shape.',
 'hexagon-sixths':'All sides of this regular hexagon are the same length. Think about the distance from the center to a side.',
 'octagon-eighths':'Each side of this regular octagon is the same length. Look for repeated regions around the center.',
 'cross-fourths':'Imagine turning the cross a quarter turn. Which arms and spaces match?',
 'more-parts':'Keep the size of the whole the same. Compare just one share from each bar.',
 'circle-error':'Count the pieces, then compare their areas. Pay attention to the curved ends.',
 'rhombi-name':'Trace the outline of one complete tile. Count spaces, not the lines between them.',
 'slanted-name':'Begin at one corner and trace each complete triangle once. Count regions, not line segments.',
 'different-outline':'Use the faint grid. Count the little squares inside each piece, even when its outline looks different.',
};
function helpStepsFor(task) {
 if(task.kind==='reasoning') return task.steps.slice(0,2).map((text,i)=>({text,picture:reasoningPicture(task,i,false)}));
 // Stop before the completed construction. The answer is a separate reveal.
 const steps=task.steps.filter(step=>!validatePartition(task,step.lines||[]).valid);
 return steps.map(step=>({text:step.text,picture:svg(task,step.lines||[],false,{valid:false})}));
}
function questionHelp(task) {
 const help=labState.help;if(!help)return '';
 if(labState.mode==='test')return html`<section class="partition-question-coach"><h4 tabindex="-1" data-lab-help-heading>Work on your own</h4><p>Test Me checks independent work. Hints and worked answers are available in Practice It. Your test drawing stays here until you change modes or reset it.</p><button type="button" data-lab-action="question-help">Close help</button></section>`;
 const steps=helpStepsFor(task),step=steps[Math.min(help.step||0,steps.length-1)];
 return html`<section class="partition-question-coach" aria-label="Help for this question"><h4 tabindex="-1" data-lab-help-heading>Help for this question</h4>
 ${help.level===0?html`<p>Start with a hint. Then see the construction one step at a time. The full answer stays hidden until you choose Show Answer.</p><button type="button" data-lab-action="help-hint">Hint</button>`:''}
 ${help.level===1?html`<p>${HELP_HINTS[task.id]||'Compare the area inside each part.'}</p>${task.kind==='reasoning'?reasoningPicture(task,0,false):svg(task,[],false,{valid:false})}<button type="button" data-lab-action="help-steps">Show Steps</button>`:''}
 ${help.level===2?html`<p>Step ${(help.step||0)+1} of ${steps.length}: ${step?.text}</p>${step?.picture}<div class="partition-controls">${(help.step||0)<steps.length-1?html`<button type="button" data-lab-action="help-next">Next help step</button>`:html`<p>Finish the construction yourself, or choose to reveal the full answer.</p><button type="button" data-lab-action="help-answer">Show Answer</button>`}</div>`:''}
 ${help.level===3?html`${task.kind==='reasoning'?reasoningPicture(task,3,false):svg(task,task.solution,false,validatePartition(task,task.solution))}<p>${task.why}</p><p>This solution is recorded as revealed. Your own work above has been kept so you can try again.</p>`:''}
 <button type="button" data-lab-action="question-help">Close help</button></section>`;
}
