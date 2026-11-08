// Explicit response classes. They define test inputs, not a semantic teaching-quality verdict.
export function teachingItems(lesson) {
 return [...lesson.learn.screens.flatMap((s,i)=>s.item&&s.item.type!=='sentence'?[{stage:'learn',screen:i,item:s.item}]:[]),...lesson.watch.examples.flatMap((e,i)=>e.why?[{stage:'watch',screen:i,item:e.why}]:[]),...['together','try','test'].flatMap(stage=>lesson[stage].items.map((item,screen)=>({stage,screen,item})))];
}
export function teachingResponses(item) {
 const out=[],add=(name,response,status)=>out.push({name,response,status});
 if(item.type==='choice') {item.options.forEach((o,i)=>add(`option ${i}: ${o.text}`,{choice:String(i)},o.correct?'correct':'notyet'));add('no choice',{},'empty');return out;}
 if(item.type==='fraction'){
  const {n,d}=item.answer,good=(a,b)=>item.answerPolicy==='value'?BigInt(a)*BigInt(d)===BigInt(n)*BigInt(b):a===n&&b===d;
  const f=(name,a,b)=>{if(Number.isInteger(a)&&a>=0&&Number.isInteger(b)&&b>0)add(name,{n:String(a),d:String(b)},good(a,b)?'correct':'notyet');};
  f('authored answer',n,d);f('numerator only off by one',n+1,d);f('denominator only off by one',n,d+1);f('inversion',d,n);f('complement count',Math.abs(d-n),d);f('equivalent doubled',2*n,2*d);
  let a=n,b=d;while(b){[a,b]=[b,a%b];}if(a>1)f('equivalent reduced',n/a,d/a);
  const m=item.model;if(m?.kind==='line'){f('marks rather than intervals',m.point+1,m.parts+1);f('entire drawn line as whole',m.point,m.parts*(m.max||1));f('count restarts at whole boundary',m.point%m.parts,m.parts);}
  else if(m){f('selected only for denominator',n,Math.max(1,m.selected.length));f('unselected only for denominator',n,Math.max(1,m.parts-m.selected.length));}
  add('both fields blank',{},'empty');add('numerator blank',{n:'',d:String(d)},'empty');add('denominator blank',{n:String(n),d:''},'empty');add('zero denominator',{n:String(n),d:'0'},'notyet');add('decimal numerator',{n:'1.5',d:String(d)},'empty');add('negative numerator',{n:'-1',d:String(d)},'empty');add('letters denominator',{n:String(n),d:'three'},'empty');
  return out;
 }
 if(item.type==='number'){
  const key=Number(item.answer),m=item.model,values=[...Array.from({length:Math.min(40,key+2)},(_,i)=>i),999,...(m?[m.selected?.length,m.parts-1,m.parts+1,m.point,m.parts*(m.max||1)]:[])].filter(n=>Number.isInteger(n)&&n>=0);
  for(const n of [...new Set(values)])add(`typed integer ${n}`,{answer:String(n)},n===key?'correct':'notyet');add('leading zeros',{answer:String(key).padStart(4,'0')},'correct');add('blank',{},'empty');add('decimal',{answer:'1.5'},'empty');add('word',{answer:'three'},'empty');return out;
 }
 if(['word','spell'].includes(item.type)){add('correct term',{text:item.answer},'correct');add('different term',{text:'not the mathematical term'},'notyet');add('blank',{},'empty');return out;}
 throw new Error(`Add deliberate response classes for ${item.type} ${item.id}`);
}
