import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import { buildWeeklyLabs, ROOT } from '../../scripts/author/build-weekly-labs.mjs';
import { validateWeek } from '../../js/lib/validate.js';
import { illustratedLab, wordPicture } from '../../js/views/common.js';
import { buildSite, verifySite } from '../../scripts/build-site.js';

const id='2026-11-09';
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const week=read(`data/${id}.json`);
const manifest=read(`docs/weekly/${id}/lab-images.json`);
function lab(subject) {
  let markup='', value='';
  const app={set innerHTML(s){markup=s},get innerHTML(){return markup},querySelector(){return null}};
  const ctx=vm.createContext({document:{getElementById(i){return i==='app'?app:{get value(){return value},focus(){}}}},window:{},setTimeout(){}});
  const html=fs.readFileSync(path.join(ROOT,week.labs[subject]),'utf8');
  vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
  return {run:s=>vm.runInContext(s,ctx),answer(s){value=s},html,get markup(){return markup}};
}

test('labs preserve newsletter word order and exact definitions; learning pictures stay out of tests',()=>{
  for(const subject of ['spelling','vocab']) {
    const l=lab(subject);
    assert.deepEqual(Array.from(l.run('WORDS.map(w=>w.w)')),week[subject].words.map(w=>w.word.toLowerCase()));
    if(subject==='vocab')assert.deepEqual(Array.from(l.run('WORDS.map(w=>w.d)')),week.vocab.words.map(w=>w.def));
    for(let i=0;i<12;i++){l.run(`learn(${i})`);assert(l.markup.includes('class="word-picture"'));assert(l.markup.includes(manifest[subject][week[subject].words[i].word.toLowerCase()].illustration.alt));}
    l.run('flash()');assert(!l.markup.includes('class="word-picture"'));
    l.run('fFlipped=true;flashShow()');assert(l.markup.includes('class="word-picture"'));
    if(subject==='spelling')for(const mode of [false,true]){l.run(`spell(${mode})`);assert(!l.markup.includes('class="word-picture"'))}
    else for(const mode of ['mc','fill','tf','match']){l.run(`startQuiz('${mode}',ALL)`);assert(!l.markup.includes('class="word-picture"'))}
  }
});

test('a recycled miss never earns first-attempt credit or a perfect score',()=>{
  const l=lab('spelling');l.run('spell(false)');
  const missed=l.run('sq[0].w');
  l.answer('wrong');l.run('spellCheck()');l.answer('wrong');l.run('spellCheck()');
  for(let i=0;i<12;i++){l.answer(l.run('sq[0].w'));l.run('spellCheck()')}
  l.run('awardSpell()');assert.equal(l.run('sStars'),11);assert(l.markup.includes(missed));assert(!l.markup.includes('PERFECT!'));
});

test('a hint-assisted answer stays in the practice list and cannot claim all first-try answers',()=>{
  const l=lab('spelling');l.run('spell(false)');
  const missed=l.run('sq[0].w');l.answer('wrong');l.run('spellCheck()');
  for(let i=0;i<12;i++){l.answer(l.run('sq[0].w'));l.run('spellCheck()')}
  l.run('awardSpell()');assert.equal(l.run('sStars'),11);assert(l.markup.includes(missed));assert(!l.markup.includes('You spelled every word right on the first try!'));
});

test('typed markup is escaped in spelling results',()=>{
  const l=lab('spelling');l.run('spell(true)');l.answer('<img src=x onerror=alert(1)>');l.run('spellCheck()');
  for(let i=0;i<11;i++){l.answer(l.run('sq[0].w'));l.run('spellCheck()')}
  assert(!l.markup.includes('<img src=x'));assert(l.markup.includes('&lt;img src=x'));
});

test('a future word that matches an object prototype property still gets first-attempt credit',()=>{
  const l=lab('spelling');
  l.run("WORDS.splice(0,WORDS.length,{w:'constructor',s:['con','struc','tor'],t:'A constructor builds things.'});spell(false)");
  l.answer('constructor');l.run('spellCheck()');assert.equal(l.run('sStars'),1);
});

test('known teacher-definition notes remain visible in vocabulary learning views',()=>{
  const l=lab('vocab');assert(l.markup.includes(week.vocab.groupsNote));
  l.run('learn(11)');assert(l.markup.includes(week.vocab.words[11].note));
});

test('native cards use reviewed illustrations and week menus expose only their own labs',()=>{
  const pictures=read('data/pictures.json');
  for(const subject of ['spelling','vocab'])for(const item of week[subject].words){
    const image=wordPicture({pictures,week,section:subject},item.word,'fallback').toString();assert(image.includes(`lab-${subject}-${id}.webp`));
  }
  assert(illustratedLab({week},'spelling').toString().includes(week.labs.spelling));
  const old=read('data/2026-11-02.json');assert.equal(illustratedLab({week:old},'spelling'),'');
  assert(!wordPicture({pictures,week:old,section:'spelling'},'tractor','fallback').toString().includes(`lab-spelling-${id}.webp`));
  assert(validateWeek({...week,labs:{spelling:'https://example.com',vocab:week.labs.vocab}},id).some(e=>e.includes('labs.spelling')));
});

test('site verification checks lab resource links and exact return week and subject',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'ss-lab-build-'));
  try{
    buildSite(root);assert.deepEqual(verifySite(root),[]);
    const file=path.join(root,week.labs.spelling),original=fs.readFileSync(file,'utf8');
    fs.writeFileSync(file,original.replace('</head>','<script src="https://example.com/outside.js"></script></head>'));
    assert(verifySite(root).some(e=>e.includes('loads https://example.com')));
    fs.writeFileSync(file,original.replace(`../index.html#spelling?week=${id}`,'../index.html#vocab?week=2026-11-02'));
    assert(verifySite(root).some(e=>e.includes('correct week and subject')));
  }finally{fs.rmSync(root,{recursive:true,force:true})}
});

test('weekly generator is repeatable and rejects missing reviews, missing words and paths outside assets',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'ss-weekly-labs-'));
  try {
    fs.mkdirSync(path.join(root,'data'),{recursive:true});fs.mkdirSync(path.join(root,'images/words'),{recursive:true});
    fs.writeFileSync(path.join(root,`data/${id}.json`),JSON.stringify(week));
    fs.writeFileSync(path.join(root,'data/pictures.json'),'{}');
    for(const kind of ['spelling','vocab'])fs.copyFileSync(path.join(ROOT,`images/words/lab-${kind}-${id}.webp`),path.join(root,`images/words/lab-${kind}-${id}.webp`));
    const m=path.join(root,'manifest.json');fs.writeFileSync(m,JSON.stringify(manifest));
    buildWeeklyLabs(id,m,{root});
    const first=fs.readFileSync(path.join(root,week.labs.spelling),'utf8');buildWeeklyLabs(id,m,{root});
    assert.equal(fs.readFileSync(path.join(root,week.labs.spelling),'utf8'),first);
    for(const change of [m=>delete m.spelling.tractor,m=>m.spelling.tractor.illustration.reviewed=false,m=>m.spelling.tractor.illustration.file='../../private.webp',m=>m.spelling.tractor.syllables=['wrong']]){
      const bad=structuredClone(manifest);change(bad);fs.writeFileSync(m,JSON.stringify(bad));assert.throws(()=>buildWeeklyLabs(id,m,{root}));
      assert.equal(fs.readFileSync(path.join(root,week.labs.spelling),'utf8'),first);
    }
  }finally{fs.rmSync(root,{recursive:true,force:true})}
});
