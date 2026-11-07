// Diagnostic inventory only. Manual teaching judgments and child observation are separate evidence.
// Usage: node scripts/audit-chapter7-teaching.mjs --root /path/to/frozen/worktree --out /tmp/teaching-evidence
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1]};
const root=path.resolve(arg('--root',process.cwd()));
const out=path.resolve(arg('--out',path.join(os.tmpdir(),`study-scoop-teaching-${Date.now()}`)));
fs.mkdirSync(out,{recursive:true});
const mod=p=>import(pathToFileURL(path.join(root,p)).href);
const {check,solution,helpSteps}=await mod('js/lib/lessons.js');
const {describe:describeFraction}=await mod('js/lib/models.js');
const {fractionVocabItems}=await mod('js/lib/chapter7.js');
const {teachingFeedbackFor}=await mod('js/views/lesson.js');
const commit=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const dirty=Boolean(execFileSync('git',['-C',root,'status','--porcelain'],{encoding:'utf8'}).trim());
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const records=[], ancillary=[];
function inspect(it,path,lesson={}){
 const call=r=>{try{return check(it,r,lesson)}catch(e){return {error:e.message}}};
 const correct=call(solution(it)),wrong=[];
 if(it.type==='choice')it.options.forEach((o,i)=>{if(!o.correct)wrong.push({option:i,text:o.text,authored:o.why||null,result:call({choice:String(i)})})});
 else if(it.type==='fraction')for(const [name,r]of [['numerator one too high',{n:it.answer.n+1,d:it.answer.d}],['denominator one too high',{n:it.answer.n,d:it.answer.d+1}],['swapped numerator denominator',{n:it.answer.d,d:it.answer.n}],['zero denominator',{n:it.answer.n,d:0}]])wrong.push({case:name,response:r,result:call(r)});
 else if(it.type==='number')for(const answer of [0,Math.max(0,Number(it.answer)-1),Number(it.answer)+1]){if(answer!==Number(it.answer))wrong.push({response:{answer},result:call({answer})})}
 else if(it.type!=='sentence')wrong.push({response:{text:'not the term'},result:call({text:'not the term'})});
 const models=it.models||(it.model?[it.model]:[]),captions=models.map(m=>{try{return describeFraction(m)}catch(e){return `UNSUPPORTED:${e.message}`}}),hints=it.hints||[],show=it.show||[];
 const flags=[];
 if(!it.yes&&it.type!=='sentence')flags.push('default positive feedback');
 if(wrong.some(w=>w.result.status==='notyet'&&/^(Look at the picture and try again\.|Try again\.)$/.test(w.result.say)))flags.push('unexplained wrong response');
 if(hints.some(h=>/identify the whole|count.*equal parts|think about what this term/i.test(h)))flags.push('shared/general hint: inspect fit to actual task');
 if(hints.some(h=>/numerator|denominator/.test(h))&&models.some(m=>m.kind==='line'))flags.push('line hint: inspect interval-vs-area language');
 if(models.length===0)flags.push('no authored model (may be intentional text reasoning)');
 if(wrong.some(w=>w.result.status==='correct'))flags.push('probe accepted: inspect valid equivalent or invalid misconception');
 if(it.type==='sentence')flags.push('shared check() output is NOT Chapter7 written-review runtime; inspect comparison workflow separately');
 const deliveredCorrect=typeof teachingFeedbackFor==='function'?teachingFeedbackFor(lesson,it,solution(it),'correct'):null;
 for(const probe of wrong)if(typeof teachingFeedbackFor==='function'){const response=probe.response || {choice:String(probe.option)};probe.authoredVisualFeedback=teachingFeedbackFor(lesson,it,response,probe.result.status);}
 records.push({path,assessmentVisibility:path.includes('.test[')?'after submission only':'practice/checkpoint',authoredVisualTeaching:it.teaching||null,deliveredCorrectCoach:deliveredCorrect,id:it.id,type:it.type,prompt:it.prompt,model:models,pictureDescriptions:captions,picturePromptMatch:{status:'manual review required',note:'Generated labels describe geometry; matching instructional purpose cannot be established by a universal semantic heuristic.'},correctResponse:solution(it),correctFeedback:correct,wrongPaths:wrong,hints,show,helpSteps:helpSteps(it),genericHintTriage:flags.includes('shared/general hint: inspect fit to actual task'),flags,manualVerdict:'not yet individually adjudicated'});
}
for(let n=1;n<=7;n++){
 const l=read(`data/lessons/7-${n}.json`);
 l.learn.screens.forEach((s,i)=>{if(s.item)inspect(s.item,`${l.id}.learn[${i}]`,l);ancillary.push({path:`${l.id}.learn[${i}]`,...s})});
 l.watch.examples.forEach((e,i)=>{if(e.why)inspect(e.why,`${l.id}.watch[${i}].why`,l);ancillary.push({path:`${l.id}.watch[${i}]`,...e})});
 for(const stage of ['together','try','test'])l[stage].items.forEach((it,i)=>inspect(it,`${l.id}.${stage}[${i}]`,l));
}
const p=read('data/chapters/7.json');for(const key of ['practice','test','fluency'])p[key].items.forEach((it,i)=>inspect(it,`pack.${key}[${i}]`));
for(const mode of ['choice','truefalse','fill'])fractionVocabItems(p,mode,()=>.37).forEach((it,i)=>inspect(it,`pack.vocabulary.${mode}[${i}]`));
p.guide.sections.forEach((s,i)=>ancillary.push({path:`pack.guide[${i}]`,...s}));p.performance.tasks.forEach((t,i)=>ancillary.push({path:`pack.performance[${i}]`,...t}));
const counts={items:records.length,wrongPaths:records.reduce((n,r)=>n+r.wrongPaths.length,0),byType:Object.fromEntries([...new Set(records.map(r=>r.type))].map(t=>[t,records.filter(r=>r.type===t).length])),flags:Object.fromEntries([...new Set(records.flatMap(r=>r.flags))].map(f=>[f,records.filter(r=>r.flags.includes(f)).length]))};
fs.writeFileSync(path.join(out,'inventory.json'),JSON.stringify({commit,dirty,scope:'All authored learner quiz items plus generated vocabulary modes; instructional screen/example/guide/performance content in ancillary.',counts,items:records,ancillary},null,2));
const lines=['# Chapter 7 diagnostic feedback inventory','','Commit: 88081b. Flags are triage, not semantic verdicts. All individual manual verdicts start unreviewed.','',JSON.stringify(counts,null,2),''];
for(const r of records){lines.push(`## ${r.path} — ${r.id} (${r.type})`,r.prompt,'',`Correct: ${JSON.stringify(r.correctFeedback)}`,...r.wrongPaths.map(w=>`Wrong path: ${JSON.stringify(w)}`),`Hints: ${JSON.stringify(r.hints)}`,`Show: ${JSON.stringify(r.show)}`,`Picture labels: ${JSON.stringify(r.pictureDescriptions)}`,`Picture/prompt: ${r.picturePromptMatch.status}`,`Triage flags: ${r.flags.join('; ')||'none'}`,`Manual verdict: ${r.manualVerdict}`,'');}
fs.writeFileSync(path.join(out,'inventory.md'),lines.join('\n'));console.log(JSON.stringify(counts,null,2));
