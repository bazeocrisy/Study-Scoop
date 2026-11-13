// Build the owner's illustrated spelling and vocabulary labs from reviewed weekly data.
// Usage: node scripts/author/build-weekly-labs.mjs YYYY-MM-DD docs/weekly/YYYY-MM-DD/lab-images.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateWeek } from '../../js/lib/validate.js';

const HERE=path.dirname(fileURLToPath(import.meta.url));
export const ROOT=path.resolve(HERE,'../..');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const scriptJSON=o=>JSON.stringify(o).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
const mime={'.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg'};

export function buildWeeklyLabs(id, manifestFile, {root=ROOT, templates=path.join(HERE,'lab-templates')}={}) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(id))throw Error('Use a YYYY-MM-DD week ID');
  const weekFile=path.join(root,'data',id+'.json'), week=read(weekFile);
  const errors=validateWeek(week,id);if(errors.length)throw Error(errors.join('\n'));
  const manifest=read(path.resolve(root,manifestFile));
  if(manifest.week!==id || manifest.people!=='Black only')throw Error('Review the manifest week and Black-only people requirement');
  const picturesFile=path.join(root,'data/pictures.json'), pictures=read(picturesFile);
  pictures.illustrations ??= {};
  pictures.illustrations[id] ??= {};
  const outputs=[];
  // Validate and render both subjects before changing any files.
  for(const subject of ['spelling','vocab']) {
    pictures.illustrations[id][subject] = {};
    const records=week[subject].words, entries=manifest[subject];
    if(!entries || Object.keys(entries).length!==records.length)throw Error(subject+': provide exactly one reviewed entry per word');
    const sources=[], images=[], words=[];
    for(const record of records) {
      const w=record.word.toLowerCase(), entry=entries[w];
      if(!/^[a-z]+(?:-[a-z]+)*$/.test(w))throw Error('Unsupported word spelling: '+w);
      if(!entry || !Array.isArray(entry.syllables) || !entry.syllables.length || entry.syllables.some(s=>typeof s!=='string'||!/^[a-z-]+$/.test(s)) || entry.syllables.join('')!==w)throw Error(w+': review syllables; they must reconstruct the word');
      const p=entry.illustration;
      if(!p || typeof p.alt!=='string'||!p.alt.trim() || p.reviewed!==true)throw Error(w+': missing illustration review or description');
      if(typeof p.file!=='string'||!/^images\/words\/[a-z0-9-]+\.webp$/.test(p.file))throw Error(w+': image must be WebP inside images/words');
      const asset=fs.realpathSync(path.join(root,p.file)), assetRoot=fs.realpathSync(path.join(root,'images/words'));
      if(!asset.startsWith(assetRoot+path.sep))throw Error(w+': image escapes images/words');
      const columns=p.columns??1, rows=p.rows??1, index=p.index??0;
      if(![columns,rows,index].every(Number.isInteger)||columns<1||rows<1||index<0||index>=columns*rows)throw Error(w+': invalid sprite grid');
      const bytes=fs.readFileSync(asset), type=mime[path.extname(asset)];
      if(bytes.length>5*1024*1024)throw Error(w+': illustration is too large');
      const data='data:'+type+';base64,'+bytes.toString('base64');
      let source=sources.indexOf(data);if(source<0){source=sources.length;sources.push(data)}
      images.push({source,alt:p.alt,columns,rows,index});
      pictures.illustrations[id][subject][w]={src:p.file,alt:p.alt,columns,rows,index};
      words.push({w,s:entry.syllables,t:record.sentence,...(subject==='vocab'?{d:record.def,note:record.note||''}:{} )});
    }
    const schoolTest=week.tests.find(t=>t.kind===subject);
    const day=(d)=>new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',timeZone:'UTC'});
    const testNote=schoolTest?`${schoolTest.title}: ${day(schoolTest.date)}. ${schoolTest.detail||''}`:'No school test date was supplied.';
    const config={week:id,pattern:week.spelling.pattern,patterns:manifest.patterns||[],vocabTitle:week.vocab.title,parentNote:week.vocab.groupsNote||'',testNote,words,pictures:images,sources};
    if(!Array.isArray(config.patterns)||config.patterns.some(s=>typeof s!=='string'||!/^[a-z]+$/.test(s)))throw Error('Review spelling highlight patterns');
    const filename=`labs/${id}-${subject}.html`;
    let html=fs.readFileSync(path.join(templates,subject+'.html'),'utf8');
    html=html.replace('/*__LAB_CONFIG__*/null',()=>scriptJSON(config))
      .replace('/*__PAGE_TITLE__*/',()=>esc((subject==='spelling'?week.spelling.pattern:week.vocab.title)+' '+subject+' lab · '+week.label))
      .replace('/*__RETURN_URL__*/',`../index.html#${subject}?week=${id}`);
    if(/\/\*__\w+__\*\//.test(html))throw Error('Unfilled template marker');
    outputs.push({filename,html});
  }
  fs.mkdirSync(path.join(root,'labs'),{recursive:true});
  for(const out of outputs)fs.writeFileSync(path.join(root,out.filename),out.html);
  week.labs=Object.fromEntries(outputs.map(o=>[o.filename.includes('-spelling.')?'spelling':'vocab',o.filename]));
  fs.writeFileSync(weekFile,JSON.stringify(week,null,2)+'\n');
  fs.writeFileSync(picturesFile,JSON.stringify(pictures,null,2)+'\n');
  return outputs.map(o=>o.filename);
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const [id,manifest]=process.argv.slice(2);
  if(!id||!manifest)throw Error('Usage: build-weekly-labs.mjs YYYY-MM-DD manifest.json');
  console.log(buildWeeklyLabs(id,manifest).join('\n'));
}
