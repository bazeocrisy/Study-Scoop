/** First-time teaching sample for 7-1. Original text, examples and diagrams.
 * This module transforms only Lesson 7-1. The textbook source stays private.
 */
const NAMES={2:'halves',3:'thirds',4:'fourths',6:'sixths',8:'eighths'};
const SINGLE={2:'half',3:'third',4:'fourth',6:'sixth',8:'eighth'};
const copy=x=>JSON.parse(JSON.stringify(x));
const picture=(kind,parts,selected=[],weights)=>({type:'fraction',kind,parts,wholes:1,...(kind==='circle'?{framing:'close'}:{}),selected:[...selected],...(weights?{weights:[...weights]}:{})});
const all=d=>Array.from({length:d},(_,i)=>i);
const countWords=d=>Array.from({length:d},(_,i)=>i+1).join(', ');
const whole=(kind)=>picture(kind,1,[0]);
const first=(m)=>({...copy(m),selected:[0]});
const last=(m)=>({...copy(m),selected:[m.parts-1]});
const every=(m)=>({...copy(m),selected:all(m.parts)});
const step=(text,model)=>({text,model:copy(model)});
const areaReason=m=>m.kind==='circle'?'The wedges open by the same amount and reach the same circle edge.':'Each piece has the same width and the same height.';
function coach(item,steps,correct,wrong){
 item.hints=steps.slice(0,-1).map(s=>s.text);
 item.show=steps.map(s=>s.text);
 item.yes=correct.text;
 item.teaching={steps:copy(steps),correct:copy(correct),wrong:copy(wrong)};
 return item;
}
function choose(id,prompt,m,choices,right,steps,correct,wrongs,models){
 const options=choices.map((text,i)=>i===right?{text,correct:true}:{text,why:wrongs[i].text});
 // Deterministic varied positions without changing the option/feedback association.
 const offset=Number(id.replace(/\D/g,''))%options.length;
 const ordered=options.slice(offset).concat(options.slice(0,offset));
 return coach({id,type:'choice',prompt,model:copy(m),...(models?{models:copy(models)}:{}),options:ordered},steps,correct,choices.flatMap((option,i)=>i===right?[]:[{option,...copy(wrongs[i])}]));
}
function count(id,kind,d,selected=[]){
 const m=picture(kind,d,selected),noun=kind==='circle'?'circle':'strip';
 return coach({id,type:'number',prompt:`How many equal pieces make this whole ${noun}?`,model:m,answer:String(d)},[
  step(`Find the outside edge of the one whole ${noun}.`,whole(kind)),
  step('Start with the highlighted piece; count each piece once.',first(m)),
  {...step(`Count ${countWords(d)}; ${d} equal pieces cover the whole.`,{...every(m),counted:all(d)}),revealsAnswer:true}
 ],step(`The ${d} pieces fill the whole, and ${areaReason(m).replace(/^The /,'the ').replace(/^Each /,'each ')}`,{...every(m),counted:all(d)}),[
  {...step(selected.length?'That number matches only the colored pieces; the whole also includes the plain pieces.':'There are no colored pieces, but the whole still contains plain pieces; count every piece.',{...m,counted:[...selected]}),when:'selectedOnly'},
  ...(kind==='bar'?[{...step('That number matches the inside lines; count the spaces between edges instead of the lines.',{...first(m),counted:[0]}),when:'insideLines'}]:[]),
  {...step(`That count is too small to include every piece of the ${noun}; start at the marked piece and touch each piece once.`,{...first(m),counted:[0]}),when:'tooLow'},
  {...step(`That count is too large; count only the ${kind==='circle'?'wedges, not the center or outside edge':'inside spaces, not lines or outside edges'}, touching each piece once.`,{...first(m),counted:[0]}),when:'tooHigh'},
  {...step(`Find the complete ${noun}; start at the marked piece and count every piece once.`,{...first(m),counted:[0]}),when:'default'}
 ]);
}
function name(id,kind,d,other,selected=[]){
 const m=picture(kind,d,selected),noun=kind==='circle'?'circle':'strip';
 const choices=[NAMES[d],NAMES[other],'whole pieces'];
 return choose(id,`What are the equal pieces of this whole ${noun} called?`,m,choices,0,[
  step(`Find the one whole ${noun}, including every piece.`,whole(kind)),
  step('Count every equal piece, not just the colored ones.',first(m)),
  step(`Count ${countWords(d)}; ${d} equal pieces are called ${NAMES[d]}.`,every(m))
 ],step(`These are ${NAMES[d]} because ${d} equal pieces together make one whole.`,every(m)),{
  1:step(`${NAMES[other][0].toUpperCase()+NAMES[other].slice(1)} would need ${other} equal pieces; count the pieces of this ${noun} again.`,first(m)),
  2:step(`The outside edge encloses one whole; the highlighted piece covers only part of it.`,first(m))
 });
}
function equal(id,d,weights,labelName=false,selected=[]){
 const m=picture('bar',d,selected,weights),same=new Set(weights).size===1;
 const smallest=weights.indexOf(Math.min(...weights)),largest=weights.indexOf(Math.max(...weights));
 const a={...m,selected:[smallest]},b={...m,selected:[same?(smallest+1)%d:largest]};
 const word=NAMES[d];
 const yes=labelName?`Yes; these pieces are ${word}.`:'Yes; every piece covers the same amount.';
 const no=labelName?`No; these pieces are not equal ${word}.`:'No; some pieces cover more than others.';
 const color='The colors alone decide whether the pieces are equal.';
 const correct=same?`The pieces have matching widths and heights, so they cover equal areas${labelName?` and are ${word}`:''}.`:`The highlighted wide piece covers more area than the narrow piece, so these are unequal${labelName?`, not ${word}`:''}.`;
 return choose(id,labelName?`Can these pieces of one whole strip be called ${word}?`:'Does this strip have equal-area pieces?',m,[yes,no,color],same?0:1,[
  step('Use the outside edge to find the one whole strip.',whole('bar')),
  step('Look at the highlighted piece from top to bottom.',a),
  step(same?'Compare this piece: its width and height match the first piece.':'Compare this piece: it is wider but just as tall.',b),
  step(same?`All ${d} pieces cover equal areas; they make equal shares.`:'A wider piece of the same height covers more area.',b)
 ],step(correct,b),{
  [same?1:0]:step(same?'The highlighted piece matches the other pieces in width and height; compare their covered areas again.':'Counting the pieces is not enough; compare the wide highlighted piece with the narrow piece.',b),
  2:step('Changing a color does not change a piece’s size; compare widths and heights.',a)
 });
}
function cut(id,d){
 const m=whole('bar'),target=picture('bar',d,[]);
 const c=[`Make ${d} full-height pieces with matching widths.`,`Make ${d} pieces of any widths.`,`Draw ${d} inside lines and call the pieces ${NAMES[d]}.`];
 return choose(id,`How could you make ${NAMES[d]} from this whole strip?`,m,c,0,[
  step('Keep the whole strip; every part of it must belong to a piece.',m),
  step(`Mark ${d} equal widths along the strip before making the dividing lines.`,target),
  step(`Count ${countWords(d)}; matching widths and heights make ${d} equal areas.`,every(target))
 ],step(`The ${d} pieces have matching widths and heights, so each is one ${SINGLE[d]}.`,first(target)),{
  1:step('Unequal widths make unequal areas; compare the narrow and wide pieces.',picture('bar',d,[],[...Array(d-1).fill(1),2])),
  2:{...step(`${d} inside lines make ${d+1} spaces; count the pieces between the outside edges.`,picture('bar',d+1,[])),nonExample:true}
 });
}
function paired(text,a,b){return {...step(text,b),models:[copy(a),copy(b)]};}
function compare(id,small,big){
 const a={...picture('bar',small,[0]),caption:`${small} equal pieces`};
 const b={...picture('bar',big,[0]),caption:`${big} equal pieces`};
 const plainA={...a,selected:[]},plainB={...b,selected:[]};
 return choose(id,'These strips are the same size. Which strip has the smaller pieces?',a,[`The strip with ${big} equal pieces.`,`The strip with ${small} equal pieces.`,'Both must have the same-size pieces.'],0,[
  paired('Both outside rectangles are the same size, so each whole covers the same amount.',plainA,plainB),
  paired(`Look at the highlighted piece in the strip with ${small} equal pieces.`,a,plainB),
  paired('Now compare both highlighted pieces; their heights match, but their widths do not.',a,b),
  paired(`Sharing the same whole among ${big} pieces makes each piece smaller.`,a,b)
 ],paired(`The ${big}-piece strip has smaller pieces because the same whole is shared into more equal parts.`,a,b),{
  1:paired(`Look at both highlighted widths: one of ${small} pieces is wider than one of ${big}.`,a,b),
  2:paired('The wholes match, but the highlighted widths do not; compare the two pieces.',a,b)
 },[a,b]);
}
function boundary(id){
 const m=picture('bar',3,[1]);
 return choose(id,'Only the middle piece is colored. Which pieces make one whole strip?',m,['All three pieces together.','Only the colored middle piece.','Only the two uncolored pieces.'],0,[
  step('Trace the outside rectangle from end to end.',whole('bar')),
  step('The colored piece is inside the whole, not the entire whole.',m),
  step('All three pieces together fill the outside rectangle.',every(m))
 ],step('The whole is all three pieces because together they fill the complete strip.',every(m)),{
  1:step('The colored piece leaves two pieces uncovered; follow the outside edge to include them.',m),
  2:step('The middle piece also belongs to the strip; color does not remove it from the whole.',every(m))
 });
}
function recolor(id,d){
 const m=picture('bar',d,[0],[...Array(d-1).fill(1),2]);
 return choose(id,'These pieces have different widths. Would coloring every piece alike make equal shares?',m,['No; their widths would still differ.','Yes; matching colors make matching areas.','Yes; counting the colors proves equal areas.'],0,[
  step('Find the narrow piece and the wide piece inside the same whole.',m),
  step('Imagine every piece colored; the dividing lines stay in the same places.',every(m)),
  step('The wide piece is still wider and just as tall, so its area stays larger.',last(m))
 ],step('Equal shares need equal areas; matching colors do not change the widths or heights.',every(m)),{
  1:step('Color every piece in your mind, then compare the widths; the wide piece stays wider.',every(m)),
  2:step('A color count does not measure area; compare the narrow piece with the wide end piece.',last(m))
 });
}
function join(id,d){
 const m={...picture('bar',d,[0,1]),caption:'Before joining'};
 const after={...picture('bar',d/2,[0]),caption:'After joining'};
 const plainBefore={...m,selected:[]},plainAfter={...after,selected:[]};
 return choose(id,`Each neighboring pair of these ${d} equal pieces is joined. What happens?`,m,[`There are ${d/2} larger equal pieces.`,`There are ${d} larger equal pieces.`,'The whole strip becomes longer.'],0,[
  paired('Both outside edges match; joining pieces does not make the whole strip longer.',plainBefore,plainAfter),
  paired('The first two highlighted pieces become one larger piece with the same covered area.',m,after),
  {...paired(`Join every pair: the strip now has ${d/2} larger equal pieces.`,every(m),every(after)),revealsAnswer:true}
 ],paired(`Each new piece joins two equal old pieces, so ${d/2} equal pieces still cover the same whole.`,every(m),every(after)),{
  1:paired('Two old pieces become one new piece; count the new spaces after joining.',m,after),
  2:paired('Only inside dividing lines were removed; both outside rectangles are still the same length.',m,after)
 });
}
function rows(q){
 const out=copy(q);
 const visit=v=>{if(!v||typeof v!=='object')return;if(v.type==='fraction'&&v.kind==='bar')v.layout='rows';for(const x of Object.values(v))if(x&&typeof x==='object')visit(x);};
 visit(out);return out;
}
function finishTest(q){const out=copy(q);delete out.hints;out.explain=out.teaching.correct.text;return out;}
function reflection(){return {id:'explain',type:'sentence',prompt:'How can you check that a strip has equal shares? Explain in your own words, then compare your idea with an example.',keywords:['whole'],minKeywords:0,minWords:5,example:'I check that the pieces fill the whole strip and have matching widths and heights, so no piece covers more than another.',hints:['Describe the whole strip and compare the sizes of its pieces.'],show:['Ask a grown-up to compare your reason with the example; the computer does not judge your mathematical explanation.']};}
export function buildLessonOneTeaching(base){
 const lesson=copy(base);
 lesson.goal='I can find one whole, check equal shares, and name halves, thirds, fourths, sixths and eighths.';
 lesson.catchAll='Find the whole. Check that the pieces cover equal areas. Count all the equal pieces to name them.';
 lesson.glossary={whole:'one complete shape, including every part inside its outside edge',part:'a piece of a whole',partition:'divide a whole into parts',equal:'the same amount; equal shares of a shape cover the same area',area:'how much flat space a piece covers'};
 const checkpoint=count('r1','bar',4,[1]);
 checkpoint.prompt='The whole strip includes colored and plain pieces. How many equal pieces make the whole strip?';
 checkpoint.teaching.count={prompt:'Tap each Part button below. Watch its number appear in the picture.',parts:all(4)};
 lesson.learn={screens:[
  {title:'Start with one whole',text:['This complete strip is one whole.','Trace its outside edge; all the space inside belongs to the whole.'],model:whole('bar')},
  {title:'Make parts of the whole',text:['A part is a piece of the whole.','This line divides the strip into two pieces; the outside strip stays the same.'],model:picture('bar',2,[0])},
  {title:'Check equal shares',text:['Equal shares cover the same amount of the whole.','These pieces have matching widths and heights, so neither covers more area.'],model:picture('bar',2,[1])},
  {title:'Two pieces can be unequal',text:['Here the highlighted piece is wider and just as tall.','It covers more area, so these two pieces are not equal shares.'],model:picture('bar',2,[1],[1,2])},
  ...[2,3,4,6,8].map((d,i)=>({title:`${d} equal pieces: ${NAMES[d]}`,text:[`${d} equal pieces together make this one whole.`,`Each piece is one ${SINGLE[d]}; all the pieces are called ${NAMES[d]}.`],model:picture(i%2?'circle':'bar',d,[0])})),
  {title:'Different cuts can make equal shares',text:['This strip has a top half and a bottom half.','The two rows have matching widths and heights, so each is one half of the whole.'],model:{...picture('bar',2,[1]),layout:'rows'}},
  {title:'Count the pieces, not just the color',text:['The whole includes colored and uncolored pieces.'],item:checkpoint},
  {title:'Check the sizes before naming',item:equal('r2',3,[1,2,1],true)},
  {title:'Explain after you have looked and counted',text:['Use the pictures to explain your thinking.','You or a grown-up will compare your response; this is not a computer grade for mathematical meaning.'],item:reflection()}
 ]};
 lesson.watch={examples:[
  {title:'Make and check halves',teaching:true,model:whole('bar'),steps:[
   {say:'Start with one whole strip.',model:whole('bar')},
   {say:'Draw a line down the middle to make a left half and a right half.',model:picture('bar',2,[])},
   {say:'This first piece is one half of the whole strip.',model:picture('bar',2,[0])},
   {say:'The other piece matches it in width and height, so the two areas are equal.',model:picture('bar',2,[1])},
   {say:'The same whole can also have a top half and a bottom half.',model:{...picture('bar',2,[0]),layout:'rows'}}
  ]},
  {title:'Make thirds, then sixths',teaching:true,model:whole('bar'),steps:[
   {say:'Begin with one whole strip; keep its outside size fixed.',model:whole('bar')},
   {say:'Make three equal-width pieces; each piece is one third.',model:picture('bar',3,[0])},
   {say:'Divide every third into two matching pieces; now there are six equal pieces.',model:picture('bar',6,[0,1])},
   {say:'Count all six pieces; each piece is one sixth.',model:picture('bar',6,[3])},
   {say:'Compare a sixth with a third: more equal pieces of the same whole make each piece smaller.',model:picture('bar',6,[0])}
  ]},
  {title:'Make fourths, then eighths',teaching:true,model:whole('circle'),steps:[
   {say:'Start with one whole round disk.',model:whole('circle')},
   {say:'Make four matching wedges; this highlighted wedge is one fourth.',model:picture('circle',4,[0])},
   {say:'Split each fourth into two matching wedges; the disk now has eight equal pieces.',model:picture('circle',8,[0,1])},
   {say:'This highlighted small wedge is one eighth.',model:picture('circle',8,[4])},
   {say:'All eight equal wedges together fill one whole disk.',model:picture('circle',8,all(8))}
  ]}
 ]};
 lesson.together={items:[boundary('g1'),count('g2','bar',3),name('g3','circle',2,4,[1]),equal('g4',2,[1,3]),name('g5','bar',4,8,[2]),cut('g6',3)]};
 lesson.try={pass:16,items:[
  count('t1','bar',2,[1]),count('t2','bar',4,[0,2]),count('t3','circle',6,[1,3]),
  name('t4','bar',3,4,[2]),name('t5','circle',4,2,[0,2]),name('t6','bar',6,3,[1,4]),name('t7','bar',8,4,[2,6]),name('t8','circle',8,6,[1,5]),
  equal('t9',2,[1,2]),equal('t10',3,[1,1,1],true),equal('t11',4,[1,2,1,1],true),equal('t12',6,[1,1,1,1,1,2],true),equal('t13',8,[2,2,2,2,2,2,2,2],true),equal('t14',3,[2,1,2]),
  cut('t15',4),cut('t16',6),compare('t17',2,4),compare('t18',3,6),recolor('t19',4),join('t20',6)
 ]};
 lesson.test={pass:8,items:[
  count('x1','circle',3,[1]),count('x2','bar',8,[0,3,5]),name('x3','circle',3,4,[0,2]),name('x4','circle',6,4,[1,4]),
  equal('x5',2,[4,1],true),rows(equal('x6',3,[2,2,2])),equal('x7',6,[2,2,2,2,1,2]),
  cut('x8',2),cut('x9',8),join('x10',8)
 ].map(finishTest)};
 lesson.parent={sections:[
  {heading:'What comes first',text:'This first lesson begins with one complete shape before introducing its parts. Equal shares of a shape need equal area, not merely a particular number of pieces.'},
  {heading:'Use real paper',list:['Point around the outside edge of one paper strip and call the complete strip the whole.','Fold it into two matching parts; match the pieces to check equal area.','Make another strip with one narrow piece and one wide piece; ask why two pieces are not automatically halves.','After the equal-area check, count all pieces to name halves, thirds, fourths, sixths or eighths.']},
  {heading:'What the diagrams show',text:'The strip examples compare pieces with equal heights, so matching widths establish matching areas. The circle examples use equal-angle wedges of the same circle. Color highlights a piece for comparison; it does not define the whole or make a piece larger.'},
  {heading:'Keep the sample simple',text:'Different outlines can also have equal area, but this sample does not ask children to infer that from mismatched pictures. Let a child physically match or rearrange equal-area paper pieces before extending that idea. Number-line intervals, numerator and denominator belong to later lessons.'},
  {heading:'Common mistakes to discuss',list:['Counting only colored pieces instead of all pieces of the whole.','Calling any two pieces halves even when one piece is wider.','Using color, the number of cuts, or the number of pieces alone to decide whether areas are equal.']},
  {heading:'Reflect honestly',text:'The written response comes after concrete teaching and two mini-checks. A child or grown-up reviews the mathematical reasoning; the computer does not certify understanding from keywords or sentence length.'},
  {heading:'About this sample',text:'Original Study Scoop teaching aligned with Lesson 7-1 goals. These are practice materials, not the teacher’s actual assessment; private textbook scans are not published.'}
 ]};
 return lesson;
}
