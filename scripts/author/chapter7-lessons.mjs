/** Original Study Scoop Chapter 7 lessons. Run from repository root.
 * Source scans/OCR are private. This script stores only the verified lesson map
 * and independently authored teaching, contexts, models and questions.
 * All fraction keys derive from integer model selections/tick positions.
 */
import fs from 'node:fs';
import path from 'node:path';
import {buildLessonOneTeaching} from './chapter7-lesson1-teaching.mjs';
const OUT=path.resolve('data/lessons');
const DEN=[2,3,4,6,8];
const contexts=['art ribbon','garden marker','window panel','trail sign','paper mat','festival flag','reading card','game board','fabric strip','picnic cloth','club badge','seed tray','recipe card','display panel','bookmark','mural strip','gift tag','craft sheet','stage banner','photo frame','class pennant','paint sample','library sign','quilt panel','paper lantern','desk label','team emblem','kite panel','floor mat','party streamer','tote design','cardboard tile','door decoration','table runner','book cover','poster panel','paper fan','display card','wall hanging','puzzle mat','music card','museum label'];
const names={2:'halves',3:'thirds',4:'fourths',5:'fifths',6:'sixths',8:'eighths',10:'tenths',12:'twelfths'};
const teacher=JSON.parse(fs.readFileSync('data/2026-11-09.json','utf8')).mathUpcoming.words.map(w=>({term:w.word,def:w.def}));
const meta=[null,
 ['Partition Shapes into Equal Parts','I can make and recognize equal-area parts of one whole.','Equal parts must cover the same amount of the whole. Counting pieces alone is not enough.',
 ['A whole can be divided in different ways.','Equal parts have equal area, even when their shapes look different.','More equal parts of the same whole make each part smaller.'],
 'How can you tell whether the parts of a shape are equal?',
 'I can check that every part covers the same amount of the whole, rather than just counting how many pieces I see.'],
 ['Understand Fractions','I can name selected equal parts using a numerator and a denominator.','Name the whole first. The denominator counts all equal parts in that whole; the numerator counts selected parts.',
 ['A unit fraction names one equal part of a whole.','The same denominator describes all the equal parts in one whole.','The numerator counts the selected parts, not the parts left over.'],
 'Why do you need to know the whole before naming a fraction?',
 'I need to know the whole because the denominator counts its equal parts and the numerator counts the selected parts of that whole.'],
 ['Represent Fractions on a Number Line','I can partition one unit into equal intervals and locate a fraction.','The distance from zero to one is one whole. Count intervals from zero, not tick marks.',
 ['One whole is the distance from zero to one.','Equal intervals represent equal unit fractions.','Count intervals from zero to locate a fraction.'],
 'Why do we count intervals instead of tick marks on a fraction number line?',
 'We count intervals because each interval is one equal part of the unit, while the first tick only marks where zero begins.'],
 ['Represent One Whole as a Fraction','I can explain why selecting every equal part represents one whole.','A fraction equals one when its numerator and denominator count the same number of parts.',
 ['Every equal part together makes one whole.','Different denominators can name the same whole.','The point at one can also be named with a fraction.'],
 'Why does a fraction with the same numerator and denominator equal one?',
 'The denominator counts all equal parts and the matching numerator counts every one of them, so the fraction represents the whole.'],
 ['Represent Whole Numbers as Fractions','I can write a whole number as a fraction with denominator one.','When each piece is a whole, the denominator is one and the numerator counts the wholes.',
 ['A whole piece is one part of itself.','A whole number can be written with denominator one.','Decide whether each object is one whole or whether the entire set is the whole.'],
 'Why can a whole number be written with denominator one?',
 'Each whole is one equal part, so a denominator of one lets the numerator count how many whole pieces there are.'],
 ['Represent a Fraction Greater Than One on a Number Line','I can count fractional units beyond one and compare a fraction with one.','Keep the denominator fixed as you pass one. A numerator larger than the denominator means more than one whole.',
 ['Keep the same interval size across all whole units.','Count fractional intervals continuously beyond one.','Compare the numerator with the denominator to decide whether the value is below, at or above one.'],
 'How can you tell from the numerator and denominator that a fraction is greater than one?',
 'When the numerator is greater than the denominator, the counted parts include a whole and additional equal parts, so the value is greater than one.'],
 ['Explore Unit Fractions as Part of a Set','I can define a set as the whole and name one or more selected objects as a fraction of it.','Name the whole set. Count every object for the denominator and the selected objects for the numerator.',
 ['The entire collection is one whole set.','Each single object is one equal counting part of the set.','The selected objects need not be next to each other.'],
 'How is the whole in a fraction of a set different from a whole shape?',
 'For a set the whole is the entire collection of objects, while for a shape the whole is the area of one shape.']
];
const clone=x=>JSON.parse(JSON.stringify(x));
const rotate=(arr,k)=>arr.slice(k%arr.length).concat(arr.slice(0,k%arr.length));
function model(kind,d,n=0,variant=0,wholes=1){
 if(kind==='line')return {type:'fraction',kind,parts:d,max:Math.max(1,wholes),point:n};
 const selected=rotate(Array.from({length:d*wholes},(_,i)=>i),variant).slice(0,n).sort((a,b)=>a-b);
 return {type:'fraction',kind,parts:d,wholes,selected};
}
function choice(id,prompt,options,key,why,explain,extras={}){
 const opts=options.map((text,i)=>i===key?{text,correct:true}:{text,why:why[i]||'Check the whole and what the question asks you to count.'});
 const shift=Number(id.replace(/\D/g,''))%opts.length;
 return {id,type:'choice',prompt,...extras,options:rotate(opts,shift),show:[explain],yes:'Compare your reasoning with the explanation.'};
}
function frac(id,prompt,m,policy='partition'){
 const n=m.kind==='line'?m.point:m.selected.length,d=m.parts;
 return {id,type:'fraction',prompt,model:m,asks:'fraction',answer:{n,d},answerPolicy:policy,
  hints:[m.kind==='line'?'Find one whole and count the equal intervals within it.':'Identify the whole and count all its equal parts.',m.kind==='line'?'Count intervals from zero to the marked point.':'Count only the selected parts for the numerator.'],
  show:[d===1?'Each counted part is one complete whole.':`There are ${d} equal ${m.kind==='set'?'counting parts in the set':'parts in each whole'}.`,m.kind==='line'?`The point is ${n} ${n===1?'interval':'intervals'} from zero.`:`${n===1?'There is':'There are'} ${n} selected ${d===1?(n===1?'whole piece':'whole pieces'):(n===1?'part':'parts')}.`,`The fraction is ${n}/${d}.`],yes:`The model represents ${n}/${d}.`};
}
function explainItem(k){return {id:'explain',type:'sentence',prompt:meta[k][4]+' Write a complete sentence.',keywords:['whole'],minKeywords:0,minWords:5,example:meta[k][5],hints:['Describe what the whole is and how its parts are counted.'],show:['Compare your reasoning with a grown-up or the model response.',meta[k][5]]};}
function partition(id,j,stage){
 const d=DEN[j%DEN.length],ctx=contexts[j%contexts.length],test=stage==='test',kind=test?'circle':'bar';
 switch(j%6){
 case 0:{const m=model(kind,d,1,j);return choice(id,`A designer divides a ${ctx} into the equal parts shown. What is the name for each part?`,[names[d],names[DEN[(j+1)%5]],'whole pieces'],0,[null,'Count every equal part in one whole, then name those parts.','A piece is only part of this whole.'],`The whole has ${d} equal parts, so the parts are called ${names[d]}.`,{model:m});}
 case 1:{const weights=Array(d).fill(test?3:2);weights[(j+1)%d]=test?1:4;const m={...model('bar',d,0),weights};return choice(id,`The ${ctx} has ${d} pieces. Is counting those pieces enough to prove that the parts are equal?`,['Yes; any pieces are equal when they are counted.','No; the pieces must also cover equal amounts.','Yes; a straight outside edge makes them equal.'],1,['The picture contains parts with different areas.',null,'The outside edge does not tell you each part’s area.'],'The widths differ, so these pieces do not cover equal areas.',{model:m});}
 case 2:{const small=DEN[j%4],big=DEN[j%4+1];return choice(id,`Two ${ctx}s are the same size. One is divided into ${small} equal parts and the other into ${big} equal parts. Which has smaller parts?`,[`The one with ${big} equal parts.`,`The one with ${small} equal parts.`,'The pieces must be the same size.'],0,[null,'Fewer parts of the same whole make each part larger.','The wholes match, but the numbers of equal pieces differ.'],`Dividing the same whole into more equal parts makes each part smaller.`);}
 case 3:return choice(id,`A ${ctx} is divided into ${d} equal-area parts. A classmate says all the pieces must have the same outline. Is that necessary?`,['Yes; equal area always means the same outline.','No; equal parts must cover equal area, even if their outlines differ.','No; only the color matters.'],1,['Different outlines can cover the same area.',null,'Color does not determine area.'],'Equal area is the test for equal parts; matching outlines are not required.',{model:model(kind,d,0,j)});
 case 4:{const m=model(kind,d,0,j);return {id,type:'number',prompt:`How many equal parts cover this entire ${ctx}?`,answer:String(d),model:m,hints:['Count each part once, including parts with no selection.'],show:[`There are ${d} equal parts in the whole.`],yes:`The whole contains ${d} equal parts.`};}
 default:return choice(id,`When making equal parts of a ${ctx}, which check is useful?`,['Check that the pieces cover the whole with no gaps or overlap and have equal areas.','Check only that every piece has a different color.','Check only that all cut lines are short.'],0,[null,'Color can distinguish pieces but does not prove equal areas.','Cut-line length does not establish equal area.'],'Every part must have equal area, and together the parts must cover the whole exactly once.',{model:model(kind,d,0,j)});
 }
}
function item(k,id,j,stage){
 if(k===1)return partition(id,j,stage);
 const test=stage==='test',ctx=contexts[j%contexts.length],d=DEN[(j+Math.floor(j/5))%DEN.length],kind=(test?['circle','bar']:['bar','circle'])[j%2];
 if(k===2){const n=1+(Math.floor(j/2)%(d-1));const m=model(kind,d,n,j+Math.floor(j/5));
  if(j%5===3)return choice(id,`In this ${ctx}, what does the denominator count?`,['All equal parts in the one whole.','Only selected parts.','Only unselected parts.'],0,[null,'Selected parts are counted by the numerator.','The whole includes selected and unselected parts.'],'The denominator counts every equal part in this one whole.',{model:m});
  if(j%5===4)return choice(id,`A classmate counted only the unselected pieces of this ${ctx} for the numerator. What should the numerator count?`,['The selected equal parts.','All parts whether selected or not.','The number of different colors.'],0,[null,'Counting all parts gives the denominator.','Color names do not determine the numerator.'],'The numerator counts the selected equal parts of the whole.',{model:m});
  return frac(id,`Name the selected fraction of this ${ctx}. Use the number of equal parts shown as the denominator.`,m);}
 if(k===3){const n=1+(Math.floor(j/2)%(d-1));const m=model('line',d,n,0,1);
  if(j%5===3)return choice(id,`For the ${ctx} design, this line shows one unit from zero to one. What should you count to find the denominator?`,['Equal intervals between zero and one.','Tick marks including zero.','Only the tick marks after the point.'],0,[null,'Tick marks are boundaries; there is one more boundary than intervals.','The denominator comes from the whole unit, not what remains after the point.'],'Count equal intervals in the distance from zero to one.',{model:m});
  if(j%5===4)return choice(id,`A student starts counting at zero as the first part on this ${ctx} number line. What is the mistake?`,['Zero is a starting boundary, not a traveled interval.','The line should start at one.','The intervals should change size.'],0,[null,'A fraction’s distance is counted from zero.','The intervals within each whole must stay equal.'],'Start at zero, then count the first interval only after moving to the next tick.',{model:m});
  return frac(id,`A point marks the selected distance on this ${ctx} number line. Name it using the unit intervals shown.`,m);}
 if(k===4){const wholeKind=d===6?'bar':(j%3===0?'line':kind),m=model(wholeKind,d,d,j,1);
  if(j%4===1)return choice(id,`Every part of this ${ctx} is selected. What must be true about the numerator and denominator?`,['They are the same because all parts of one whole are counted.','The numerator must be one whatever the partition.','The denominator counts only the unselected parts.'],0,[null,'A numerator of one would count only one part; here all parts are selected.','The denominator counts all equal parts in one whole.'],'Every equal part of one whole is counted, so the two counts match.',{model:m});
  if(j%4===3)return choice(id,`A ${ctx} uses ${d} equal pieces for a whole. Another whole uses ${DEN[(DEN.indexOf(d)+1)%5]} equal pieces. If every piece is selected in both, which statement is true?`,['Both represent one whole.','Only the one with fewer pieces is a whole.','Only the one with more pieces is a whole.'],0,[null,'The number of pieces can differ while each selection covers its whole.','More pieces do not change the total when all pieces of one whole are selected.'],'All parts of each whole together represent one, regardless of the number of equal parts.',{model:m});
  return j%8===2 ? frac(id,`The complete whole in this ${ctx} is selected. Write any fraction with the same value as the whole.`,m,'value') : frac(id,`Write a fraction for the complete whole shown in this ${ctx}. Use the displayed partition.`,m);}
 if(k===5){const n=2+(Math.floor(j/2)%6),kind=['bar','circle','line'][Math.floor(j/4)%3],m=model(n===4&&kind==='circle'?'line':kind,1,n,0,n);
  if(j%4===1)return choice(id,`The ${ctx} display has ${n} whole panels. Each panel is one whole. What does the denominator one mean?`,['Each counted piece is a whole.','The display has only one panel.','Only one panel can be counted.'],0,[null,'The numerator counts how many whole panels are present.','Any number of whole pieces can be counted.'],'A denominator of one means each counted part is a complete whole.',{model:m});
  if(j%4===3)return choice(id,`There are ${n} complete ${ctx}s. Each is one whole. A classmate writes 1/${n} for their total number. What was mixed up?`,['The classmate treated the collection as one whole instead of counting whole pieces.','The classmate correctly counted all whole pieces.','Whole numbers cannot be written as fractions.'],0,[null,`The total counts ${n} whole pieces, not one part of a collection.`,'Any whole number can be written over one.'],`When each object is a whole, its denominator is one and the numerator counts the objects.`,{model:m});
  return frac(id,`Each panel in this ${ctx} model is one whole. Write the number shown as a fraction with denominator one.`,m);}
 if(k===6){const wholes=j%7===0?3:2,n=d+1+(Math.floor(j/3)%Math.max(1,d*(wholes-1)-1)),m=model('line',d,n,0,wholes);
  if(j%5===3){const q=j%2===0?d-1:d+1;return choice(id,`For a ${ctx}, a plan uses ${q}/${d} of a unit. Is that less than, equal to, or greater than one whole unit?`,['Less than one.','Equal to one.','Greater than one.'],q<d?0:2,[q<d?null:'The numerator counts more parts than are in one whole.','Equality requires the same numerator and denominator.',q>d?null:'The numerator is smaller than the number of parts in one whole.'],`Counting ${q} unit ${q===1?'part gives':'parts gives'} ${q<d?'fewer':'more'} than the ${d} parts in one whole, so ${q}/${d} is ${q<d?'less':'greater'} than one.`);}
  if(j%5===4)return choice(id,`A student changes from ${names[d]} to larger intervals after passing one on the ${ctx} line. What must stay the same?`,['The size of each fractional interval.','The numerator must start again at one.','The distance between whole numbers must shrink.'],0,[null,'Keep counting fractional intervals continuously from zero.','Every whole must have the same unit length.'],'The whole-unit length and fractional interval size stay fixed across the line.',{model:m});
  return frac(id,`Name the point beyond one on the ${ctx} number line. Keep the denominator of the displayed unit partition.`,m);}
 const ds=[2,3,4,5,6,8,10,12],sd=ds[j%ds.length],n=j%3===0?1:1+(Math.floor(j/3)%(sd-1)),m=model('set',sd,n,j+Math.floor(j/8));
 if(j%5===3)return choice(id,`All the objects in this ${ctx} collection form one whole set. What counts for the denominator?`,['Every object in the collection.','Only the selected objects.','Only objects in the first row.'],0,[null,'The selected objects are counted by the numerator.','The set can fill more than one row; all its objects belong to the whole.'],'The whole is the entire collection, so count every object.',{model:m});
 if(j%5===4)return choice(id,`The selected objects in the ${ctx} set are moved to new positions without adding or removing objects. Does their fraction of the set change?`,['No; neither the whole set nor the selected count changed.','Yes; spreading them out changes the denominator.','Yes; the first row is always the whole.'],0,[null,'Moving objects does not change how many are in the whole set.','The defined whole is the entire collection, not one row.'],'A fraction of a set depends on counts within the defined whole, not the objects’ positions.',{model:m});
 return frac(id,`The entire ${ctx} collection is one whole set. What fraction of its objects is selected? Use the set’s object count as the denominator.`,m);
}
function lessonTest(k){
 const Q=(i,p,opts,key,why,ex,m)=>choice(`x${i}`,p,opts,key,why,ex,m?{model:m}:{});
 const F=(i,p,kind,d,n,selected,wholes=1,policy='partition')=>{const m=model(kind,d,n,0,wholes);if(selected)m.selected=selected;return frac(`x${i}`,p,m,policy);};
 const N=(i,p,a,m,ex)=>({id:`x${i}`,type:'number',prompt:p,answer:String(a),...(m?{model:m}:{}),show:[ex],yes:ex});
 if(k===1)return [
  N(1,'How many equal areas cover this entire round paper design?',8,model('circle',8,0),'The circle contains eight equal areas.'),
  Q(2,'A label calls these pieces sixths. Is that label justified by this picture?',['No; the six areas are unequal.','Yes; six pieces always means sixths.','Yes; only the outside shape matters.'],0,[null,'A fraction name needs equal areas, not only a count.','The outside shape does not make the inside areas equal.'],'Sixths must be six equal areas.',{...model('bar',6,0),weights:[3,3,3,3,3,1]}),
  Q(3,'Six equal sections cover a strip. A maker joins each neighboring pair without changing the strip. What is the result?',['Three equal sections.','Two equal sections.','Six larger equal sections.'],0,[null,'Pairing six sections makes three groups.','Joining pairs reduces the number of sections.'],'Six sections arranged in pairs make three equal areas.'),
  Q(4,'A square is cut along a diagonal into two triangles. What fact proves that the parts are equal?',['The triangles cover equal areas.','Both pieces have three corners.','Both pieces have diagonal edges.'],0,[null,'A triangle can have many different areas.','Having a diagonal edge alone does not establish area.'],'The equal-area relationship proves equal parts.'),
  N(5,'Four equal strips lie side by side to make a rectangle. How many inside dividing lines separate the four strips?',3,null,'The boundaries between four neighboring strips make three inside dividing lines.'),
  Q(6,'One side of a rectangle has a narrow piece and a wide piece. Which change could make two equal parts?',['Move the dividing line to the middle.','Paint both pieces the same color.','Keep the line and rename the pieces halves.'],0,[null,'Color does not alter the areas.','A new name does not change unequal areas.'],'Moving the line to the middle makes the two areas equal.'),
  Q(7,'Two parts cover three unit squares and four unit squares. Are they equal-area parts?',['No; the covered areas are different.','Yes; both are made from unit squares.','Yes; two pieces always make halves.'],0,[null,'Using the same-size measuring squares does not make the two totals equal.','Halves require equal areas, not merely two pieces.'],'Three unit squares cover less area than four unit squares.'),
  Q(8,'A tiny card has two equal parts. A very large card has eight equal parts. Can the part counts alone tell which piece is larger?',['No; the whole cards have different sizes.','Yes; the two-part card must have larger pieces.','Yes; every eighth is smaller than every half.'],0,[null,'The usual more-parts comparison needs the same-size whole.','A larger whole can have larger pieces even with more parts.'],'Compare the size of the wholes as well as their partitions.'),
  N(9,'Two separate rectangles each have three equal parts. How many pieces are there altogether? Keep the two wholes separate.',6,null,'Three pieces in each of two wholes make six pieces altogether.'),
  Q(10,'Four equal paper pieces overlap on a board and leave an uncovered corner. Do they partition the board into equal parts?',['No; a partition must cover the whole without overlap.','Yes; four equal pieces are sufficient even with gaps.','Yes; overlap makes the pieces equal.'],0,[null,'The uncovered corner and overlap prevent a partition of the whole board.','Overlap counts some space more than once.'],'The parts must cover the whole exactly once.')
 ];
 if(k===2)return [
 F(1,'Name the selected fraction of this round token using its displayed equal parts.','circle',8,3,[0,2,5]),
 F(2,'Write the selected fraction of this rectangular sample using the partition shown.','bar',6,3,[0,2,4]),
 F(3,'What unit fraction of this round disk is selected? Use its partition.','circle',4,1,[3]),
 N(4,'What numerator records the selected parts of this sample?',4,{...model('bar',8,4),selected:[0,2,4,6]},'The numerator is four because four parts are selected.'),
 N(5,'What denominator records all equal parts of this round design?',6,model('circle',6,2,3),'The whole contains six equal parts, selected or not.'),
 Q(6,'A whole has eight equal parts and five are selected. Which entry correctly explains 5/8?',['Five counts selected parts; eight counts all equal parts.','Five counts unselected parts; eight counts selected parts.','Eight counts only parts left over.'],0,[null,'Five is the selected count, not the unselected count.','The denominator includes every equal part.'],'The numerator counts selected parts and the denominator counts the whole partition.'),
 Q(7,'A student labels a diagram 1/4 because exactly one of four equal parts is selected. What makes it a unit fraction?',['Its numerator is one.','Its denominator is four.','Its whole is round.'],0,[null,'Many non-unit fractions have denominator four.','A unit fraction can use many shapes.'],'A unit fraction represents one equal part.'),
 Q(8,'Two of six equal parts are selected. A student writes 4/6 after counting the blank parts. Which count should replace the four?',['The two selected parts.','All six parts.','Only one blank part.'],0,[null,'All six parts determine the denominator.','A blank part is not part of the selected count.'],'The numerator should count the two selected parts.'),
 F(9,'Use the equal sections shown to write the selected fraction of this display.','bar',8,5,[0,1,3,5,7]),
 Q(10,'A diagram has three selected regions, but its regions have unequal areas. Why can we not name the selected fraction just by counting those regions?',['The parts of one whole must be equal.','A fraction can never have numerator three.','Every fraction requires a circular whole.'],0,[null,'Three is a possible numerator when the whole has equal parts.','Many shapes can be fraction models.'],'Equal parts are necessary before the region counts name the fraction.')
 ];
 if(k===3)return [
 F(1,'Name the marked point using this line’s equal unit intervals.','line',8,6),
 F(2,'Write the point as a fraction with the denominator shown by one unit.','line',6,2),
 N(3,'How many equal intervals make one unit on this line?',4,model('line',4,3),'There are four intervals from zero to one.'),
 N(4,'How many intervals are traveled from zero to the marked point?',5,model('line',8,5),'Five equal intervals lead from zero to the point.'),
 Q(5,'A line has seven tick marks from zero through one, including both endpoints. How many equal intervals lie between them?',['Six intervals.','Seven intervals.','Eight intervals.'],0,[null,'The two endpoints are boundaries, not additional intervals.','Count the spaces between neighboring marks.'],'Seven boundary marks enclose six intervals.'),
 Q(6,'The first interval on a unit line is longer than the others. Is counting four intervals enough to locate fourths?',['No; all four intervals must have equal length.','Yes; the interval count alone is enough.','Yes; the longest interval always represents one-fourth.'],0,[null,'Equal interval lengths are part of the fraction model.','A longer interval would represent a different distance.'],'Fourth-sized intervals must have equal lengths.'),
 Q(7,'Which action places 2/3 on a line from zero to one?',['Divide the unit into three equal intervals and count two from zero.','Divide into two equal intervals and count three.','Count zero as the first interval.'],0,[null,'That reverses the numerator and denominator.','Zero marks the start; no interval has been traveled there.'],'Three tells the equal unit partition and two tells the traveled intervals.'),
 F(8,'Write the marked fraction using the equal intervals of this unit line.','line',6,5),
 Q(9,'A point is halfway through the unit. If the unit is divided into eight equal intervals, how many of those intervals lead to the point?',['Four.','Eight.','One.'],0,[null,'Eight intervals reach the full unit.','One interval would cover only one-eighth.'],'Four of the eight equal intervals cover half the unit.'),
 Q(10,'A fraction point moves one equal interval to the right while the unit partition stays unchanged. What changes in its fraction name?',['The numerator increases by one; the denominator stays fixed.','The denominator increases by one.','Both numbers must decrease.'],0,[null,'The denominator describes the fixed unit partition.','The point is farther from zero, not closer.'],'An extra traveled unit part increases the numerator.')
 ];
 if(k===4)return [
 F(1,'Every part of this circular badge is selected. Write the fraction using its parts.','circle',8,8),
 F(2,'Every equal part is selected. Write any fraction with the value of this whole.','circle',3,3,null,1,'value'),
 N(3,'The point marks one whole divided into six equal intervals. What numerator completes the fraction with denominator six?',6,model('line',6,6),'All six of the six equal parts must be counted.'),
 N(4,'Eight equal parts are all selected. What denominator goes with numerator eight to describe exactly one whole?',8,null,'The denominator is eight because there are eight equal parts in one whole.'),
 Q(5,'A full strip uses four fourth-sized tiles. How much of that same strip is covered when all four tiles are selected?',['One whole.','Four whole strips.','Only one-fourth.'],0,[null,'The four pieces belong to one strip.','One-fourth counts only one of the four tiles.'],'All four fourth-sized tiles together cover one whole strip.'),
 Q(6,'Which pair both names exactly one whole?',['3/3 and 8/8.','1/3 and 1/8.','3/1 and 8/1.'],0,[null,'These each name one part, not all parts of their whole.','These count multiple whole pieces.'],'Each numerator matches its denominator in the first pair.'),
 Q(7,'A point is at 6/6 on a number line. Where is it compared with the point labeled one?',['At the same location.','Six whole units farther right.','At zero.'],0,[null,'Six sixth-sized intervals make one unit.','The point is one full unit from zero.'],'The six equal sixth-sized intervals reach one.'),
 Q(8,'A child says a full circle cannot equal one if it is cut into more pieces. What corrects the claim?',['Cutting changes the pieces, but all pieces still cover the same whole.','More pieces always make more wholes.','Only an uncut shape can represent one.'],0,[null,'The total whole does not grow when its partition changes.','A complete partition can also represent one.'],'The complete set of pieces still covers one whole circle.'),
 F(9,'The entire round plate is selected. Write any fraction equal to its complete whole.','circle',4,4,null,1,'value'),
 Q(10,'Five parts are selected from six equal parts of a whole. What must happen to show the entire whole?',['Select the one remaining part.','Remove one selected part.','Change the label without selecting the last part.'],0,[null,'Removing a selected part makes less of the whole selected.','A new label cannot change the selected area.'],'Every equal part must be included to represent the whole.')
 ];
 if(k===5)return [
 F(1,'Each circular chip is one whole. Write the number of chips over one.','circle',1,4,null,4),
 F(2,'Each complete round seal counts as one whole. Write the total as a fraction with denominator one.','circle',1,6,null,6),
 F(3,'Each disk is a whole. Use denominator one to name the number shown.','circle',1,2,null,2),
 N(4,'What numerator completes a fraction with denominator one that represents seven whole pieces?',7,null,'The numerator counts seven complete wholes.'),
 N(5,'What denominator lets a numerator of five count five complete wholes?',1,null,'Each counted piece is one whole, so the denominator is one.'),
 Q(6,'Which description fits 4/1?',['Four complete wholes.','One part of a four-object set.','Four parts of a whole divided into four.'],0,[null,'One part of a four-object set is one-fourth.','Four parts of four would cover one whole.'],'With denominator one, each counted part is a whole.'),
 Q(7,'A point is labeled 9/1 on a number line of whole units. Which whole-number label belongs at that same point?',['Nine.','One.','Zero.'],0,[null,'The numerator counts nine whole units.','Nine units have been traveled from zero.'],'Nine whole units is the whole number nine.'),
 Q(8,'A student writes 1/5 for five whole paper squares, although each square is one whole. What is the correct fraction?',['5/1.','5/5.','1/1.'],0,[null,'Five-fifths describes one partitioned whole.','One-over-one describes just one whole.'],'Count five complete wholes, each with one whole part.'),
 F(9,'Every selected circle is one whole piece. Write their count as a fraction over one.','circle',1,7,null,7),
 Q(10,'Which question must you settle before naming a collection of objects as a fraction?',['Does each object count as one whole, or is the entire collection the whole?','Are all objects the same color?','Are the objects arranged in a straight row?'],0,[null,'Color alone does not define the whole.','Arrangement alone does not define the whole.'],'The question’s definition of the whole determines the denominator.')
 ];
 if(k===6)return [
 F(1,'Name the marked point using the equal intervals shown in each whole unit.','line',8,13,null,3),
 F(2,'Write the fraction for this point beyond two, keeping the shown unit partition.','line',4,11,null,3),
 F(3,'Name this point between one and two using the line’s partition.','line',6,8,null,3),
 N(4,'A line uses thirds. How many third-sized intervals reach two whole units?',6,null,'Each unit contains three intervals, so two units contain six.'),
 Q(5,'Which fraction is greater than one but less than two?',['7/4.','3/4.','9/4.'],0,[null,'Three fourth-sized parts are less than a whole.','Nine fourth-sized parts pass two wholes.'],'Seven fourth-sized parts fall between four fourths and eight fourths.'),
 Q(6,'A walker travels 5/6 of a unit. Has the walker passed the one-unit marker?',['No; one full unit needs six sixth-sized parts.','Yes; any numerator larger than one passes a unit.','Yes; the denominator is greater than the numerator.'],0,[null,'Compare with six parts in a whole, not with the numeral one alone.','A larger denominator here means the numerator counts less than one whole.'],'Five sixth-sized intervals do not reach six sixth-sized intervals.'),
 Q(7,'The numerator and denominator of a fraction are equal. Which comparison with one is correct?',['Equal to one.','Greater than one.','Less than one.'],0,[null,'There are no extra parts beyond a whole.','All the parts of one whole are counted.'],'The counted parts exactly fill one whole.'),
 Q(8,'A child counts eighth-sized intervals to 7/8, then labels the next two points 1/8 and 2/8. What went wrong?',['The count should continue through 8/8 and 9/8.','The intervals should become twice as large after one.','The denominator should become nine after one.'],0,[null,'The fractional unit stays fixed.','The denominator continues to describe eight equal intervals in every whole.'],'Keep counting from zero instead of restarting the numerator after each whole.'),
 F(9,'Write the marked fraction beyond two on this unit line.','line',3,8,null,3),
 Q(10,'A decoration is 5/2 units long and a shelf is three whole units long. Can the decoration fit along the shelf?',['Yes; five half-unit intervals are shorter than six half-unit intervals.','No; a fraction can never be compared with a whole number.','No; any numerator of five is longer than three.'],0,[null,'Represent both lengths using the same unit size.','The numerator counts half-units, not whole units.'],'Three units contain six halves; five halves are shorter.')
 ];
 return [
 F(1,'All twelve tokens form one whole set. Name the selected part of that set.','set',12,3,[1,5,10]),
 F(2,'All ten objects form the whole collection. What fraction is selected?','set',10,4,[0,2,6,9]),
 F(3,'The entire group of five items is one whole set. Name the unit fraction shown.','set',5,1,[4]),
 N(4,'In this whole collection, what denominator counts every object?',8,model('set',8,2,1),'The whole collection contains eight objects.'),
 N(5,'What numerator records the selected objects of this twelve-object set?',5,{...model('set',12,5),selected:[0,2,5,8,11]},'Five objects are selected, so the numerator is five.'),
 Q(6,'One object is selected from a set of ten. What is its unit fraction of the whole set?',['1/10.','10/1.','1/9.'],0,[null,'Ten-over-one counts ten wholes.','The whole includes the selected object too.'],'The one selected object is one of all ten objects.'),
 Q(7,'A group has four square buttons and two round buttons. The whole is all six buttons. Does shape change the denominator?',['No; count all six objects in the defined set.','Yes; count only the round buttons for the denominator.','Yes; each shape must be a different whole.'],0,[null,'Both kinds of buttons belong to the stated whole.','The question has already defined one whole set.'],'Each object is one counting part of the whole collection.'),
 Q(8,'A set has twelve cards, with one card selected. A student calls it one-eleventh because eleven cards are blank. What was omitted?',['The selected card also belongs in the whole-set count.','One blank card must be removed.','The numerator should count all twelve cards.'],0,[null,'Removing a card changes the whole rather than correcting the count.','The numerator counts only selected cards.'],'The denominator includes the selected card as well as the eleven blank cards.'),
 F(9,'The whole set contains eight objects. Name its selected fraction.','set',8,3,[0,3,7]),
 Q(10,'A set has five tasks. Two are complete and three are unfinished. What fraction of the task set is unfinished?',['3/5.','2/5.','3/2.'],0,[null,'Two-fifths counts complete tasks.','The denominator must count all five tasks.'],'Three unfinished tasks out of the whole five-task set give three-fifths.')
 ];
}
function advancedPractice(k){
 const C=(id,p,opts,key,why,ex,m)=>choice(id,p,opts,key,why,ex,m?{model:m}:{});
 const N=(id,p,a,m,ex)=>({id,type:'number',prompt:p,answer:String(a),model:m,hints:['Identify the whole and which count is missing.'],show:[ex],yes:ex});
 switch(k){
 case 1:return [C('a1','The whole strip is shown. A maker plans to give every piece to a different person as an equal share. What must be fixed first?',['Make the areas equal before calling the pieces fair shares.','Write the same name on every piece.','Count only the widest piece.'],0,[null,'Names do not change the pieces’ sizes.','Every part must be included.'],'The wider piece covers more area, so these are not equal shares.',{...model('bar',4,0),weights:[1,1,3,1]}),C('a2','A square is first cut into four equal squares. Each small square is cut along a diagonal. What check supports calling the eight final pieces equal parts?',['Each diagonal divides an equal square into two equal-area triangles.','Eight pieces automatically means equal areas.','The triangle outlines are enough, without comparing their sizes.'],0,[null,'Eight unequal pieces would not be eighths.','Triangles can have different sizes.'],'All four starting squares have equal area; each splits into two equal areas, making eight equal areas.')];
 case 2:return [N('a1','Six parts of this eight-part whole are selected. What missing numerator belongs over denominator eight?',6,{...model('bar',8,6),selected:[0,1,2,4,5,7]},'Six selected parts give numerator six.'),N('a2','The selected fraction has numerator five. What denominator completes its name using this whole?',6,model('circle',6,5,1),'All six equal parts of the whole determine the denominator.')];
 case 3:return [N('a1','The denominator matches the unit partition. What numerator counts the marked distance?',4,model('line',8,4),'Four intervals from zero give numerator four.'),C('a2','A student uses numerator two correctly but writes denominator seven after counting all marks on a six-interval unit line. Which repair is needed?',['Use denominator six because the unit has six intervals.','Use numerator seven because there are seven marks.','Keep seven; all marks are fractional parts.'],0,[null,'The numerator counts traveled intervals.','The marks are boundaries, not the equal unit intervals.'],'Count the six spaces in one whole for the denominator.',model('line',6,2))];
 case 4:return [N('a1','All parts of this whole are selected. What missing numerator makes a fraction equal to one with denominator three?',3,model('bar',3,3),'Every one of the three parts must be counted.'),C('a2','A classmate selects every piece of one whole and then doubles both the numerator and denominator in its fraction name. Does the value still represent one?',['Yes; both counts still match, so the fraction names one whole.','No; the value must become two wholes.','No; equal numerators and denominators can never name one.'],0,[null,'Doubling the denominator makes the parts smaller while the numerator counts all of them.','Matching counts name all parts of a whole.'],'A matching numerator and denominator still represent the complete whole.')];
 case 5:return [N('a1','The point counts complete units. What whole number does the fraction with denominator one represent?',5,model('line',1,5,0,8),'Five whole-size intervals reach the point, so the whole number is five.'),C('a2','There are seven complete panels. Each panel is defined as one whole. A student writes 7/7. Which explanation corrects the denominator?',['Each panel is a whole part, so the count should be seven over one.','Seven panels must always be one whole set.','The numerator should be one because the panels match.'],0,[null,'That would redefine the whole against the question.','The numerator must count all seven complete wholes.'],'The denominator is one because every counted part is a complete whole.',model('bar',1,7,0,7))];
 case 6:return [N('a1','The point is beyond two. What numerator goes over denominator four to name its distance from zero?',10,model('line',4,10,0,3),'Count ten fourth-size intervals from zero.'),C('a2','The marked point is compared with three whole units. Which statement is correct?',['The point is less than three; three wholes require eighteen sixth-size intervals.','The point equals three because fifteen is greater than six.','The point is greater than three because its numerator is fifteen.'],0,[null,'Being greater than one does not mean reaching three.','Fifteen counts sixth-sized parts, not whole units.'],'Fifteen sixth-sized intervals stop before eighteen sixth-sized intervals.',model('line',6,15,0,3))];
 default:return [N('a1','The entire collection is one whole set. What missing denominator goes under the selected count?',12,{...model('set',12,4),selected:[0,3,8,11]},'All twelve objects belong to the whole set.'),C('a2','In a ten-object set, three objects are selected. A student writes 3/7 because seven are blank. What corrects the denominator?',['Count selected and blank objects together: the whole has ten objects.','Count only blank objects: seven is correct.','Use numerator ten because the whole set has ten objects.'],0,[null,'The selected objects also belong to the whole set.','The numerator should keep counting the selected objects.'],'The denominator counts every object in the defined whole set.',{...model('set',10,3),selected:[1,5,9]})];
 }
}
function practiceRank(k,q){
 if(q.id.startsWith('a'))return 100;
 if(q.type==='number')return 0;
 if(q.type==='fraction')return q.answer.n===1?1:2+q.answer.n/q.answer.d;
 return /mistake|classmate|student|unselected|restart|moved|changes|mixed up/.test(q.prompt)?20:10;
}
function removePracticeDuplicates(k,qs){
 const sig=q=>JSON.stringify({type:q.type,model:q.model,asks:q.asks,answer:q.answer,options:q.options?.map(o=>[o.text,!!o.correct]).sort()});
 const seen=new Set();
 return qs.map((q,i)=>{
  if(seen.has(sig(q))){
   // A repeated recognition becomes a different task: identify a missing count.
   const m=q.model||model(k===7?'set':'bar',DEN[(i+1)%5],1,i);
   const partCount=m.parts,n=m.kind==='line'?m.point:m.selected.length;
   const count=(i%2===0)?partCount:n;
   const what=(i%2===0)?(m.kind==='set'?'all objects in the whole set':'equal parts in one whole'):(m.kind==='line'?'intervals from zero to the point':'selected parts');
   q={id:q.id,type:'number',prompt:`For this model, what count records the ${what}?`,model:m,answer:String(count),hints:['Identify exactly which count the question asks for.'],show:[`The requested count is ${count}.`],yes:`The count is ${count}.`};
   // More than one whole may use identical counts; change task to a count-specific explanation choice.
   if(seen.has(sig(q)))q=choice(q.id,`Which statement correctly explains this model’s whole and its parts?`,[`The defined whole has ${partCount} equal ${m.kind==='set'?'counting parts':'parts per unit'}.`,`The denominator should be ${partCount+1}, including an extra boundary.`,`The numerator and denominator can be chosen without the model.`],0,[null,'Boundaries are not extra equal parts.','The model fixes the counts.'],`Use ${partCount} for the number of parts in the defined whole.`,{model:m});
  }
  seen.add(sig(q));return q;
 });
}
function stages(k){
 // Disjoint context ranges distinguish scored tests from learning and practice.
 const guided=Array.from({length:6},(_,i)=>item(k,`g${i+1}`,i,'together'));
 const practice=removePracticeDuplicates(k,[...Array.from({length:18},(_,i)=>item(k,`t${i+1}`,i+6,'try')),...advancedPractice(k)]).sort((a,b)=>practiceRank(k,a)-practiceRank(k,b));
 practice.forEach((q,i)=>q.id=`t${i+1}`);
 const tests=lessonTest(k);
 for(const q of [...guided,...practice])if(!q.hints)q.hints=['Identify the whole before counting parts.','Use the definition that matches what is being counted.'];
 // Scored test solutions are retained for post-submission review only; no hints.
 for(const q of tests)delete q.hints;
 return {together:{items:guided},try:{pass:16,items:practice},test:{pass:8,items:tests}};
}
function intro(k){
 const text=meta[k][3],screens=text.map((s,i)=>({title:['Name the whole','Connect the parts','Check the reasoning'][i],text:[s]}));
 const ms={1:model('bar',4,0),2:model('circle',6,2),3:model('line',4,3),4:model('bar',6,6),5:model('bar',1,3,0,3),6:model('line',4,5,0,2),7:model('set',5,1)};
 screens[0].model=ms[k];
 screens[1].text.push(meta[k][2]);
 screens.push({title:'Check the idea',item:item(k,'r1',36,'learn')},{title:'Check another way',item:item(k,'r2',37,'learn')},{title:'Explain My Thinking',item:explainItem(k)});
 return {screens};
}
function watches(k){
 if(k===1)return {examples:[
  {title:'Make four equal sections',model:model('bar',4,0),steps:[{say:'Start with one rectangular strip. Its entire area is one whole.'},{say:'Fold the strip into two matching halves, then fold both halves in half again.'},{say:'Open the strip. The four full-height sections have equal widths, so their areas are equal.'},{say:'Check that the four sections cover the strip once, without gaps or overlap.'}]},
  {title:'Make six equal sections',model:model('bar',6,0),steps:[{say:'Use one new rectangular strip as the whole.'},{say:'Mark its length into six equal distances. Draw a dividing line straight across at each inside mark.'},{say:'Each section has the same width and height. There are six equal areas, called sixths.'},{say:'Joining each pair of neighboring sections would make three larger equal areas.'}]},
  {title:'Make eight equal sectors',model:model('circle',8,0),steps:[{say:'Start with one round disk as the whole.'},{say:'Fold it in half, then in half again, then in half once more.'},{say:'Unfold the disk. Eight equal sectors meet at the center.'},{say:'All eight parts cover the same area; the number of pieces alone would not prove this if the folds were unequal.'}]}
 ]};
 return {examples:Array.from({length:3},(_,i)=>{
 let q=item(k,`w${i+1}`,i+38,'watch');
 if(k===5&&i===2)q=frac('w3','Each whole unit is one complete length. Write the marked point with denominator one.',model('line',1,6,0,7));
 if(k===7&&i===2)q=frac('w3','All ten objects are one whole set. Name the selected fraction using the object count.',{...model('set',10,4),selected:[0,2,5,8]});
 return {title:[k===5?'Count complete whole pieces':k===7?'Define the whole collection':'Identify the whole and what is counted','Explain the meaning of the counts',k===5?'Count whole-size intervals on a line':k===7?'Count several selected objects':'Work through another fraction model'][i],...(q.model?{model:clone(q.model)}:{}),steps:[{say:q.prompt},{say:k===3||k===6?'Identify one whole unit, then count equal intervals from zero.':k===5?'Each piece is one whole. Count the whole pieces.':'Identify exactly what is being treated as one whole.'},...q.show.map(s=>({say:s}))],why:{...q,id:`w${i+1}check`}};
 })};
}
function parent(k){return {sections:[{heading:'What your child is learning',text:meta[k][1]},{heading:'Ask for reasoning',list:[meta[k][4],'What is the whole in this model? How do you know the parts are equal?','Can you explain the same idea with another picture or real objects?']},{heading:'Try it away from the screen',list:[k===7?'Put a few counters on a mat. Define all the counters as the whole set; move one aside and name its fraction.':k===3||k===6?'Make a paper number line. Keep equal spacing within each whole, and count intervals from zero.':k===5?'Put several identical whole paper squares on a table. Count them and write the count over one.':'Fold a plain paper strip into equal parts. Discuss whether every part has the same area.','Let your child explain a mistake before offering a correction.']},{heading:'Common mistakes',list:[k===1?'Counting pieces without checking equal area.':k===3||k===6?'Counting boundary tick marks instead of intervals.':k===5?'Treating several complete wholes as parts of one set when the question says each piece is a whole.':'Counting unselected parts for the numerator or selected parts for the denominator.','Changing the whole halfway through a question.']},{heading:'About these questions',text:'These are original Study Scoop lessons aligned to the supplied chapter map. They are practice, not the teacher’s actual test. Written explanations are for comparison with a grown-up and are not automatically judged for mathematical meaning.'}]};}
const targets=process.argv.slice(2).map(Number);for(let k=1;k<=7;k++){
 if(targets.length&&!targets.includes(k))continue;
 let lesson={id:`7-${k}`,chapter:7,title:meta[k][0],goal:meta[k][1],catchAll:meta[k][2],teacher:clone(teacher),glossary:{whole:'the one shape, unit length, complete piece or entire set named in the question',partition:'divide a whole into equal parts',interval:'the distance between neighboring marks on a number line'},learn:intro(k),watch:watches(k),...stages(k),parent:parent(k)};
 if(k===1)lesson=buildLessonOneTeaching(lesson);
 fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,`7-${k}.json`),JSON.stringify(lesson,null,2)+'\n');console.log(`Authored ${lesson.id}: 3 worked examples, 6 guided, 20 Try, 10 test, 1 ungraded written explanation.`);
}
