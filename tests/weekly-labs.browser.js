// Real-browser checks for weekly illustrated labs, both repository and allowlisted build.
import assert from 'node:assert/strict';
import path from 'node:path';
import { ROOT, BASE, startBrowser, startServer } from './lib/harness.js';
const flag=process.argv.indexOf('--site');
const server=await startServer({root:flag<0?ROOT:path.resolve(process.argv[flag+1])});
const base=server.origin+BASE,id='2026-11-09';
const b=await startBrowser();let checks=0;
const expect=(v,m)=>{assert.ok(v,m);checks++};
await b.initScript(`window.__speech=[];Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel(){},speak(u){window.__speech.push(u.text)}}});window.SpeechSynthesisUtterance=function(text){this.text=text};`);
async function open(subject){
  await b.send('Page.navigate',{url:'about:blank'});
  await b.send('Page.navigate',{url:base+`labs/${id}-${subject}.html`});
  await b.waitFor("typeof LAB_CONFIG !== 'undefined' && !!document.querySelector('#app .menu')");
}
try{
 for(const subject of ['spelling','vocab']){
  await b.load(base+`#${subject}?week=${id}`);
  const link=`a[href="labs/${id}-${subject}.html"]`;
  expect(await b.js(`return !!document.querySelector('${link}');`),subject+' menu links lab');
  await b.clickAt(link);await b.waitFor("typeof LAB_CONFIG !== 'undefined' && !!document.querySelector('#app .menu')");
  expect(await b.js(`return document.querySelector('.lab-return a').getAttribute('href')==='../index.html#${subject}?week=${id}';`),'exact return link');
  for(const width of [360,390,768,1024,1366,1920]){
   await b.viewport(width,900);
   await b.js('learn(0);');
   expect(await b.js('return document.documentElement.scrollWidth<=document.documentElement.clientWidth;'),subject+' no overflow '+width);
   expect(await b.js('const r=document.querySelector(".word-picture").getBoundingClientRect();return r.width>100&&Math.abs(r.width-r.height)<1;'),subject+' square picture '+width);
   if(process.env.SS_LAB_SHOTS && [390,1366].includes(width))await b.shot(path.join(process.env.SS_LAB_SHOTS,`${subject}-${width}.png`));
  }
  for(let i=0;i<12;i++){
   await b.js(`learn(${i});`);
   expect(await b.js(`return document.querySelector('.word-picture').getAttribute('aria-label')===LAB_CONFIG.pictures[${i}].alt;`),'word/image mapping '+subject+i);
  }
  expect(await b.js('for(const src of LAB_CONFIG.sources){const im=new Image();im.src=src;await im.decode();if(im.naturalWidth<300||im.naturalHeight<300)return false}return true;'),'embedded images decode');
  await b.js('flash();document.querySelector(".flip").focus();');
  expect(await b.js('return !document.querySelector(".word-picture");'),'flash question hides picture');
  await b.key('Enter');
  expect(await b.js('return !!document.querySelector(".word-picture")&&document.activeElement.matches(".flip");'),'Enter reveals picture and retains focus');
  await b.key(' ');
  expect(await b.js('return !document.querySelector(".word-picture")&&document.activeElement.matches(".flip");'),'Space flips back and retains focus');
  await b.js('learn(0);window.__speech=[];');
  await b.clickAt(subject==='spelling'?'button[onclick^="sayWord"]':'button[onclick="sayWord(0)"]');
  expect(await b.js('return window.__speech.length>0&&window.__speech.at(-1)===WORDS[0].w;'),'word audio called');
  if(subject==='vocab'){
   await b.clickAt('button[onclick="sayDef(0)"]');expect(await b.js('return window.__speech.at(-1)===WORDS[0].d;'),'meaning audio called');
   for(const kind of ['mc','fill','tf','match']){
    await b.js(`startQuiz('${kind}',ALL);`);
    expect(await b.js('return !document.querySelector(".word-picture");'),kind+' has no test pictures');
    if(kind==='match'){
     for(let round=0;round<2;round++){
      const ids=await b.js('return M.rounds[M.r];');
      for(const i of ids){await b.clickAt('#mw'+i);await b.clickAt('#md'+i)}
      await b.clickAt('#nx button');
     }
    }else{
     for(let i=0;i<12;i++){
      const answer=await b.js(kind==='tf'?'return Number(Q.tf[Q.queue[Q.i]]);':'return Q.queue[Q.i];');
      await b.clickAt(kind==='tf'?`[data-tf="${answer}"]`:`[data-id="${answer}"]`);
      await b.clickAt('#nx button');
     }
    }
    expect(await b.js('return document.querySelector(".big").textContent.includes("12 out of 12");'),kind+' completes with correct score');
   }
  }else{
   for(const test of [false,true]){
    await b.js(`spell(${test});`);
    expect(await b.js('return !document.querySelector(".word-picture");'),'spelling test/practice hides pictures');
    expect(await b.js('return document.querySelector("#ans").getAttribute("aria-label").length>0;'),'answer input label');
   }
  }
  await b.clickAt('.lab-return a');await b.ready();
  expect(await b.js(`return location.hash==='#${subject}?week=${id}';`),'returns to exact week');
 }
 // The canonical Learn My Words view uses the same week-scoped picture registry.
 await b.load(base+`#spelling?week=${id}&act=learn`);
 expect(await b.js('return !!document.querySelector(".word-atlas image");'),'native cards show reviewed atlas');
 expect(!server.missing.length,'no missing resources');
 expect(!b.errors.length,'no browser errors: '+b.errors.join('; '));
 console.log(`${checks} illustrated weekly lab browser checks passed`);
}finally{b.close();server.close()}
