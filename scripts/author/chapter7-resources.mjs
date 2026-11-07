// Original Chapter 7 resource authoring. The private source PDF is not read or published.
import fs from 'node:fs';
const seq = n => Array.from({length:n},(_,i)=>i);
const bar=(d,n=0,wholes=1)=>({type:'fraction',kind:'bar',parts:d,wholes,selected:seq(n)});
const circle=(d,n=0)=>({...bar(d,n),kind:'circle'});
const set=(d,n=1)=>({...bar(d,n),kind:'set'});
const line=(d,n,max=1)=>({type:'fraction',kind:'line',parts:d,max,point:n});
const ratio=m=>m.kind==='line'?{n:m.point,d:m.parts}:{n:m.selected.length,d:m.parts};
const frac=(id,skill,prompt,model,policy='partition')=>{
 if(policy==='partition') prompt += ' Use the number of parts in one whole shown by the model as your denominator.';
 const a=ratio(model), out=`${a.n}/${a.d}`;
 const reason=model.kind==='line'?`Each whole has ${a.d} equal intervals. The point is ${a.n} intervals from zero, so it represents ${out}.`:model.kind==='set'?`The whole set has ${a.d} objects. ${a.n} objects are selected, so the selected fraction is ${out}.`:`Each whole has ${a.d} equal parts. ${a.n} parts are selected, so the fraction is ${out}.`;
 return {id,skill,type:'fraction',prompt,model,answer:a,answerPolicy:policy,asks:'fraction',hints:[model.kind==='line'?'Count equal intervals in ONE whole for the denominator. Count intervals from zero to the point for the numerator.':'Count the equal parts in ONE whole for the denominator, then the selected parts for the numerator.'],show:[reason],explain:reason,yes:`Yes! ${out}.`};
};
const number=(id,skill,prompt,n,why,model)=>({id,skill,type:'number',prompt,answer:String(n),...(model?{model}:{}),hints:['Identify the whole first. Count carefully; do not count boundary marks as parts.'],show:[why],explain:why,yes:`Yes! ${n}.`});
const choice=(id,skill,prompt,correct,wrong,explain,model)=>{
 let options=[{text:correct,correct:true},...wrong.map(([text,why])=>({text,why}))];
 const pos=Number(id.replace(/\D/g,''))%options.length;options=[...options.slice(options.length-pos),...options.slice(0,options.length-pos)];
 return {id,skill,type:'choice',prompt,...(model?{model}:{}),options,hints:['Think about the whole and what equal parts mean.'],show:[explain],explain,yes:`Yes! ${explain}`};
};
const equal=(id,skill,prompt,weights)=>{
 const ok=new Set(weights).size===1;
 return choice(id,skill,prompt,ok?'Yes, the parts have equal area.':'No, the parts have different areas.',[[ok?'No, the parts have different areas.':'Yes, the parts have equal area.',ok?'All the pieces have the same area.':'Count the sizes of the pieces, not just the number of pieces.']],ok?`There are ${weights.length} equal-area pieces, so this is an equal partition.`:'Some pieces are larger than others. A fraction partition must use equal-area parts.',{...bar(weights.length),weights});
};
const practice=[];const add=(i)=>practice.push(i);
// Six varied original items per lesson, ordered from recognition to explanation/application.
add(equal('p101','l71','Does this practice strip show an equal partition?', [1,1]));
add(equal('p102','l71','Can these three pieces be called thirds of this practice strip?', [1,2,1]));
add(number('p103','l71','How many equal parts are in this practice circle?',6,'The circle is divided into 6 equal parts.',circle(6)));
add(choice('p104','l71','A square is cut into four pieces. One is much larger than the others. Are these pieces fourths?','No; fourths must have equal area.',[['Yes; there are four pieces.','Four pieces are not fourths unless their areas are equal.'],['Yes; every cut makes equal shares.','Cuts can make pieces with different areas.']],'Fourths are four equal-area parts of one whole.'));
add(equal('p105','l71','Is this practice strip partitioned into equal shares?', [2,2,2,2]));
add(choice('p106','l71','Two identical rectangular sheets are each partitioned into two equal-area parts. One cut goes across; the other goes up and down. Which statement is true?','Both sheets show halves.',[['Only the sheet cut across shows halves.','The direction of a cut does not decide whether the shares have equal area.'],['Neither sheet shows halves.','Each sheet has two equal-area parts.']],'The direction of the cut can differ. Two equal-area parts of one whole are halves.'));
add(frac('p201','l72','Write the fraction selected in this practice strip.',bar(3,1)));
add(frac('p202','l72','Write the fraction selected in this practice circle.',circle(8,5)));
add(number('p203','l72','What denominator describes this practice strip?',4,'The whole strip has 4 equal parts, so the denominator is 4.',bar(4,3)));
add(number('p204','l72','What numerator describes the selected parts of this practice circle?',2,'There are 2 selected parts, so the numerator is 2.',circle(6,2)));
add(choice('p205','l72','Which fraction names ONE equal part of a whole?','1/8',[['3/8','The numerator 3 names three parts.'],['8/8','The numerator 8 names eight parts.']],'A unit fraction has numerator 1. One of eight equal parts is 1/8.'));
add(frac('p206','l72','This entire strip is one whole. Write the fraction not selected.',{...bar(6,2),selected:[2,3,4,5]}));
// The model above highlights the four parts being asked about, avoiding color inference.
practice.at(-1).prompt='The four highlighted parts are the pieces left over. Write the fraction of this whole strip that is left over.';
add(frac('p301','l73','Write the fraction at the practice point.',line(2,1)));
add(frac('p302','l73','Write the fraction shown by this practice point.',line(6,5)));
add(number('p303','l73','How many equal intervals are there from 0 to 1?',4,'There are 4 spaces between consecutive marks from 0 to 1. Count spaces, not marks.',line(4,3)));
add(frac('p304','l73','A practice marker starts at 0 and moves to the point. Write its position.',line(8,3)));
add(choice('p305','l73','There are five tick marks including 0 and 1, equally spaced. Which denominator describes the intervals?','4',[['5','Five marks enclose four intervals.'],['3','Count each space from zero to one. There are four.']],'Five boundary marks make four equal intervals. The denominator is 4.'));
add(frac('p306','l73','Write the fraction at this practice marker, using the intervals shown.',line(3,2)));
add(frac('p401','l74','All parts of this practice strip are selected. Write the fraction using the partition shown.',bar(6,6)));
add(frac('p402','l74','All parts of this practice circle are selected. Write the fraction using the partition shown.',circle(3,3)));
add(number('p403','l74','Every part of this practice circle is selected. How many whole circles are selected?',1,'All 8 of 8 equal parts make 1 whole circle.',circle(8,8)));
add(choice('p404','l74','Which fraction describes one complete whole?','4/4',[['3/4','One of the four parts is missing.'],['1/4','This names only one part.']],'All four fourths make one whole, so 4/4 = 1.'));
add(frac('p405','l74','Write the fraction at 1 using the equal intervals in this practice line.',line(8,8)));
add(choice('p406','l74','A whole is partitioned into two equal parts and both parts are used. What is true?','2/2 is one whole.',[['2/2 is two wholes.','The two selected parts together form the original one whole.'],['2/2 is less than one whole.','No part of the whole is missing.']],'Two halves fill exactly one whole.'));
add(frac('p501','l75','Each box is one whole with no smaller partition. Write the number of selected boxes as a fraction with denominator 1.',bar(1,2,2)));
add(frac('p502','l75','Write the practice point as a fraction with denominator 1.',line(1,3,3)));
add(number('p503','l75','How many wholes does 4/1 represent?',4,'Each part has size 1 whole. Four such parts make 4 wholes.'));
add(choice('p504','l75','Which fraction writes the whole number 5 using whole-size parts?','5/1',[['1/5','One fifth is smaller than one, not five wholes.'],['5/5','Five fifths make one whole.']],'Five whole-size parts are 5/1.'));
add(frac('p505','l75','Each selected box is one whole. Write a fraction with denominator 1.',bar(1,3,3)));
add(choice('p506','l75','A student says 6/1 means one of six equal small parts. What should you explain?','The denominator 1 means whole-size parts; 6/1 means six wholes.',[['The student is right.','One of six equal small parts is 1/6.'],['6/1 means six parts of size one sixth.','The denominator, not the numerator, gives the part size.']],'The denominator 1 describes a whole-size unit. The numerator counts six of those units.'));
add(frac('p601','l76','Write the fraction at this practice point beyond one.',line(2,3,2)));
add(frac('p602','l76','Write the fraction at this practice point.',line(3,7,3)));
add(number('p603','l76','How many fourth-size intervals are there from 0 to 2?',8,'Each whole has 4 equal intervals. Two wholes have 4 + 4 = 8 intervals.',line(4,8,3)));
add(frac('p604','l76','This practice line uses the same-sized intervals in every whole. Write the marked fraction.',line(4,11,3)));
add(choice('p605','l76','Is the marked practice point less than or greater than 4?','Less than 4.',[['Greater than 4.','The point is before 4 on the line.'],['Exactly 4.','The point has not reached 4.']],'The point is 7/2. Four wholes would take 8 halves, so the point is less than 4.',line(2,7,4)));
add(frac('p606','l76','Count equal intervals from zero and write the practice fraction.',line(6,8,2)));
add(frac('p701','l77','The entire collection is one whole set. Write the fraction selected.',set(5,1)));
add(frac('p702','l77','All ten objects make one whole set. Write the fraction selected.',set(10,1)));
add(frac('p703','l77','All twelve objects make one whole set. Write the selected fraction.',set(12,5)));
add(number('p704','l77','These six objects form one whole set. What denominator describes one object?',6,'The whole set has 6 objects, so one object is 1/6 of the set.',set(6,1)));
add(choice('p705','l77','A whole set contains eight equally counted objects. One object is selected. Which statement is true?','The selected object is 1/8 of the set.',[['The selected object is 1/1 of the set.','The whole is the entire set of eight objects.'],['The selected object is 8/1 of the set.','Only one of eight objects is selected.']],'The whole set has eight objects; one is selected, so its fraction is 1/8.'));
add(frac('p706','l77','The entire set is the whole. The selected objects are unfinished tasks. What fraction of the set is unfinished?',set(12,7)));
// Explicit true/false reasoning, separate from the multiple-choice and typed banks.
const tfRows=[
 ['One whole must have equal-area pieces for those pieces to be called fourths.',true,'Fourths are four equal-area parts of one whole.'],
 ['Three selected parts out of eight equal parts give a numerator of eight.',false,'The numerator counts the three selected parts. Eight is the denominator.'],
 ['Six equal intervals from 0 to 1 give a denominator of six.',true,'The denominator counts intervals in one whole, not tick marks.'],
 ['All four fourths make four wholes.',false,'All four fourths fill exactly one whole.'],
 ['A denominator of one names whole-size parts.',true,'Each part is one whole, so 3/1 names three wholes.'],
 ['On a line of thirds, the fourth interval from zero ends before one whole.',false,'Three thirds reach one whole; the fourth interval goes beyond one.'],
 ['If a whole set has ten objects, one object is one tenth of the set.',true,'One of ten equally counted objects is 1/10 of the entire set.'],
 ['To find a number-line denominator, count every interval across the whole printed line even if it ends at three.',false,'Only count equal intervals within ONE whole, such as from 0 to 1.']
];
tfRows.forEach(([statement,truth,reason],k)=>add(choice(`p8${k+1}`,`l7${[1,2,3,4,5,6,7,6][k]}`,`True or false? ${statement}`,truth?'True':'False',[[truth?'False':'True',reason]],reason)));

const test=[];const t=i=>test.push(i);
t(equal('x101','l71','A quilt strip is cut as shown. Does it have equal-area shares?', [1,1,1]));
t(equal('x102','l71','A garden flag strip is cut as shown. Are these fourths?', [1,1,2,1]));
t(choice('x103','l71','An artist cuts one square into six pieces. What must be true to call the pieces sixths?','Every piece must have the same area.',[['Every piece must be a different color.','Color does not determine equal area.'],['Every piece must have a different size.','Sixths must have equal area.']],'Sixths are six equal-area pieces of one whole.'));
t(choice('x104','l71','Two matching flags are each cut into eight equal-area pieces in different ways. What is true?','Both flags have eighths.',[['Only one arrangement can show eighths.','Different arrangements can still produce equal-area pieces.'],['Neither flag has eighths.','Each flag has eight equal-area pieces.']],'Eighths are eight equal-area parts; the direction of the cuts may differ.'));
t(frac('x201','l72','The felt rectangle is one whole. Write the fraction represented by the highlighted pieces.',bar(8,7)));
t(frac('x202','l72','The circular badge is one whole. Write its highlighted fraction.',circle(4,2)));
t(number('x203','l72','The banner is one whole. What is the numerator of its highlighted fraction?',4,'Four pieces are highlighted, so the numerator is 4.',bar(6,4)));
t(choice('x204','l72','A whole badge has three equal parts. One part is highlighted. Which fraction names that part?','1/3',[['3/1','The whole has three equal parts, not whole-size parts.'],['2/3','Only one part is highlighted.']],'One of three equal parts is the unit fraction 1/3.'));
t(frac('x301','l73','A robot travels from 0 to the point on this unit trail. Write its position.',line(8,1)));
t(number('x302','l73','A trail marker stands at the point. What numerator counts the equal intervals from zero to this point?',3,'The point is three equal intervals from zero, so the numerator is 3.',line(8,3)));
t(number('x303','l73','Count the equal spaces from 0 to 1 on this trail. What denominator do they give?',6,'Six intervals fill the whole from 0 to 1, so the denominator is 6.',line(6,4)));
t(choice('x304','l73','A robot trail has nine equally spaced marks including 0 and 1. How many equal intervals lie between 0 and 1?','8',[['9','Nine marks enclose eight spaces.'],['10','Count spaces between neighboring marks.']],'There are eight intervals between nine boundary marks.'));
t(frac('x401','l74','Every piece of this round lantern panel is highlighted. Write the fraction using its partition.',circle(6,6)));
t(frac('x402','l74','Every piece of this circular collage is highlighted. Write the fraction shown.',circle(8,8)));
t(choice('x403','l74','Which fraction can name one complete lantern panel?','6/6',[['5/6','One sixth is missing.'],['1/6','Only one sixth is named.']],'All six sixths make exactly one whole.'));
t(number('x404','l74','All three equal pieces of a collage are used. How many complete collages do those three thirds make?',1,'All 3 of the 3 equal pieces fill the original one collage.'));
t(frac('x501','l75','Each stage block is one whole. Write the selected whole blocks as a fraction with denominator 1.',bar(1,5,5)));
t(frac('x502','l75','Each interval is one whole platform-length. Write the marked position as a fraction with denominator 1.',line(1,2,3)));
t(choice('x503','l75','Which fraction writes seven whole platforms using whole-size parts?','7/1',[['1/7','One seventh is part of one platform.'],['7/7','Seven sevenths fill only one whole.']],'Seven whole-size parts are written 7/1.'));
t(number('x504','l75','A stage builder writes 8/1 for a count of whole blocks. How many whole blocks is that?',8,'Eight parts of size one whole make 8 whole blocks.'));
t(frac('x601','l76','A hiking marker lies at this point. Write its fraction using the equal intervals shown.',line(4,9,3)));
t(frac('x602','l76','A hiker reaches the marked point. Write its fraction.',line(6,11,2)));
t(frac('x603','l76','Write the marked distance on this hiking line as a fraction.',line(8,11,2)));
t(choice('x604','l76','The marked hiking distance is compared with 4 wholes. Which statement is true?','The point is less than 4.',[['The point is exactly 4.','Four wholes would take twelve thirds.'],['The point is greater than 4.','The point lies before 4.']],'The point is 11/3. Four wholes take 12 thirds, so 11 thirds is less than 4.',line(3,11,4)));
t(frac('x701','l77','These twelve seeds form one whole set. Write the fraction selected.',set(12,1)));
t(frac('x702','l77','All ten buttons are one whole set. Write the selected fraction.',set(10,3)));
t(frac('x703','l77','The five seeds are the entire set. The selected seeds have not sprouted. What fraction of the set has not sprouted?',set(5,2)));
t(choice('x704','l77','A whole set has four buttons. What fraction of the entire set is one button?','1/4',[['1/1','The whole is all four buttons, not a single button.'],['4/1','Only one button is being described.']],'One of four equally counted objects is 1/4 of the whole set.'));
// Practice hints must not appear in the chapter test data. Review explanations are available after submission.
for(const i of test){delete i.hints;delete i.show;delete i.yes;}
const teacher=JSON.parse(fs.readFileSync('data/2026-11-09.json','utf8')).mathUpcoming.words;
const details={
 denominator:{simple:'Count the equal parts in one whole.',example:'A strip divided into six equal parts has denominator 6.',fill:'The bottom number telling how many equal parts make one whole is the ___.',model:bar(6,2)},
 numerator:{simple:'Count the selected parts.',example:'If three of eight equal pieces are highlighted, the numerator is 3.',fill:'The top number that counts the selected equal parts is the ___.',model:bar(8,3)},
 'unit fraction':{simple:'One equal part of a whole; its numerator is 1.',example:'One of four equal parts is the unit fraction 1/4.',fill:'A fraction with numerator 1 is called a ___.',model:bar(4,1)},
 fraction:{simple:'A number that counts equal-sized parts of a whole.',example:'Two of three equal parts can be described by the fraction 2/3.',fill:'A number used to describe equal-sized parts of a whole is a ___.',model:bar(3,2)}
};
const vocabulary=teacher.map(w=>({...w,source:'teacher',...details[w.word]}));
vocabulary.push({word:'partition',def:'Divide a whole into parts.',source:'review',simple:'For fraction models, make parts with equal area.',example:'We partition a rectangle into four equal-area pieces to show fourths.',fill:'To divide a whole into parts is to ___.',model:bar(4)});
vocabulary.push({word:'fraction tiles',def:'Pieces used to model equal-sized parts of a whole.',source:'review',simple:'Tiles help us see and count the parts of a whole.',example:'Three equal fraction tiles can be placed together to make one whole strip.',fill:'The pieces we place together to model parts of a whole are ___.',model:bar(3,3)});
const contexts={
 denominator:[
 'In a fraction, the bottom number naming the equal parts in one whole is the ___.',
 'A whole strip has six equal pieces. The fraction has a ___ of 6.',
 'The numerator is the top number; the bottom number is the ___.',
 'To name the ___, count how many equal intervals fit from 0 to 1.'
 ],
 numerator:[
 'The top number in a fraction is the ___.',
 'Three of eight equal pieces are selected. The fraction has a ___ of 3.',
 'The denominator names the parts in one whole; the ___ counts the selected parts.',
 'On a fraction number line, the count of equal intervals from zero to the point gives the ___.'
 ],
 'unit fraction':[
 'A fraction whose numerator is 1 is called a ___.',
 'One of six equal parts is 1/6, an example of a ___.',
 'One half names a single equal part, so it is a ___.',
 'When exactly one of eight equal pieces is named, 1/8 is a ___.'
 ],
 fraction:[
 'A number that describes equal-sized parts of a whole is a ___.',
 'The number 3/8 is written with a numerator and denominator; it is a ___.',
 'Two fifths is an example of a number called a ___.',
 'We write 5/6 to name five of six equal parts; 5/6 is a ___.'
 ],
 partition:[
 'To divide a whole into parts is to ___.',
 'We will ___ the paper by drawing lines that divide it into pieces.',
 'Before sharing the rectangle, we ___ it into equal-area parts.',
 'To ___ this strip, draw cuts that divide the whole into smaller pieces.'
 ],
 'fraction tiles':[
 'The pieces placed together to model equal-sized parts of a whole are ___.',
 'We use rectangular modeling pieces called ___ to build a whole from thirds.',
 'The classroom tools made of pieces representing halves and fourths are ___.',
 'To model a whole using small equal pieces, we place our ___ side by side.'
 ]
};
for(const v of vocabulary){v.contexts=contexts[v.word];v.fill=v.contexts[0];}

const guide={title:'Chapter 7 Fractions Study Guide',intro:'Original Study Scoop review. Define the whole first. Then count equal parts or equal number-line intervals. This guide is printable; open the self-check answers to print the answer key.',sections:[
 {title:'7-1 Equal parts',text:['Partition means divide into parts. Fraction parts of one shape must have equal area. Different cuts can make valid equal shares.'],examples:[{title:'A fair share',text:['A strip has four equal-area pieces. Each piece is one fourth. Four uneven pieces would not be fourths.'],model:bar(4,1)}],mistakes:[{mistake:'Counting pieces without checking their sizes.',fix:'Check that all pieces have equal area.'}],checks:[{question:'A sheet has three pieces: two small and one large. Are they thirds?',answer:'No. Thirds must have equal area.'}]},
 {title:'7-2 Name the fraction',text:['The denominator counts equal parts in ONE whole. The numerator counts the parts being described. A unit fraction has numerator 1.'],examples:[{title:'Selected pieces',text:['This circle has six equal parts. Five are selected, so its selected fraction is 5/6.'],model:circle(6,5)}],mistakes:[{mistake:'Switching numerator and denominator.',fix:'Put the selected count on top and the number of parts in one whole below.'}],checks:[{question:'Two of eight equal pieces are selected. What fraction is selected?',answer:'2/8. The numerator is 2 and the denominator is 8.'}]},
 {title:'7-3 Fractions on a number line',text:['Find 0 and 1. Count the equal intervals between them, not the tick marks. Count from zero to the point to find the numerator.'],examples:[{title:'A point between zero and one',text:['Four intervals fill one whole. The point is three intervals from zero, so it is 3/4.'],model:line(4,3)}],mistakes:[{mistake:'Using the number of tick marks as the denominator.',fix:'Count the spaces between marks from 0 to 1.'}],checks:[{question:'There are seven marks including 0 and 1, evenly spaced. What denominator describes the line?',answer:'6, because the seven marks enclose six equal intervals.'}]},
 {title:'7-4 One whole',text:['When every part of one whole is used, the numerator equals the denominator: b/b is one whole.'],examples:[{title:'All thirds',text:['All three thirds are selected. The fraction 3/3 names one complete whole.'],model:circle(3,3)}],mistakes:[{mistake:'Saying 6/6 means six wholes.',fix:'Six sixth-size parts together fill one whole.'}],checks:[{question:'How many wholes are eight eighths?',answer:'One whole. All eight equal parts of the whole are present.'}]},
 {title:'7-5 Whole numbers as fractions',text:['A denominator of 1 means each part is one whole. A whole number n can be written n/1.'],examples:[{title:'Three whole units',text:['Each box is one whole unit. Three whole-size parts are 3/1.'],model:bar(1,3,3)}],mistakes:[{mistake:'Writing 1/3 for three wholes.',fix:'1/3 is one small part; 3/1 is three whole-size parts.'}],checks:[{question:'Write six wholes as a fraction using whole-size parts.',answer:'6/1.'}]},
 {title:'7-6 Beyond one',text:['Keep the same interval size beyond 1. Count intervals from zero; the denominator stays the number of intervals in ONE whole. A numerator larger than the denominator represents more than one.'],examples:[{title:'Seven thirds',text:['Each whole has three intervals. The point is seven intervals from zero, so it is 7/3. It lies between 2 and 3.'],model:line(3,7,3)}],mistakes:[{mistake:'Using every interval across the entire line as the denominator.',fix:'Only count intervals in one whole to find the denominator.'}],checks:[{question:'Each whole has four intervals. A point is five intervals from zero. What fraction is it, and is it greater than one?',answer:'5/4. It is greater than one because four fourths fill one whole and one fourth remains.'},{question:'Is nine fourths less than or greater than three wholes?',answer:'Less than three wholes. Three wholes are twelve fourths; nine fourths stop before that.'}]},
 {title:'7-7 A fraction of a set',text:['State which objects form the entire set. When each object is counted equally, the denominator is the number of objects in the whole set. A single object is a unit fraction of that set.'],examples:[{title:'A set of ten',text:['All ten objects form one whole set. One selected object is 1/10 of the set. Three selected objects would be 3/10.'],model:set(10,1)}],mistakes:[{mistake:'Calling one object the whole when the question defines the entire set as the whole.',fix:'Read the definition of the whole before counting selected objects.'}],checks:[{question:'A whole set has twelve counters. Seven are selected. What fraction is selected?',answer:'7/12.'}]}
]};
const performance={title:'Plan a fraction art display',note:'Optional, ungraded original task. Explain your reasoning aloud or on paper. Compare your work with the examples; this is not a teacher-assigned test.',tasks:[{prompt:'The entire strip is one whole display panel. Name the highlighted fraction and explain what each number means.',model:bar(8,3),example:'3/8: the whole panel has eight equal parts, and three are highlighted.'},{prompt:'A second panel uses all six of its sixth-size pieces. Write the fraction and explain how much of one whole panel it covers.',model:bar(6,6),example:'6/6 covers exactly one whole panel because every one of its six parts is used.'},{prompt:'A decoration reaches the marked point on the display rail. Write its fraction and explain why it is beyond one.',model:line(4,7,2),example:'7/4. Four fourth-size intervals make one whole. Seven such intervals go past one whole.'},{prompt:'All five clips make one whole set. Write the fraction of clips selected for the display.',model:set(5,2),example:'2/5 of the set is selected: two selected clips out of five clips in the whole set.'}]};
const fluency={title:'Optional fluency: doubles and three-digit operations',note:'Original supplementary practice inspired by the source supplement objectives. This is separate from fraction mastery and is not part of the Chapter 7 test. Use place-value regrouping when needed.',items:[]};
for(const [j,a] of [4,7,9,11,12,6].entries())fluency.items.push(number(`f2${j}`,'fluency',`2 × ${a} = ?`,2*a,`Double ${a}: ${a} + ${a} = ${a*2}.`));
for(const [j,[a,b,op]] of [[247,186,'+'],[358,274,'+'],[406,287,'+'],[731,268,'-'],[602,185,'-'],[954,327,'-']].entries()){
 const n=op==='+'?a+b:a-b;fluency.items.push(number(`f3${j}`,'fluency',`${a} ${op} ${b} = ?`,n,`${a} ${op} ${b} = ${n}. Work in ones, tens and hundreds; regroup when a place needs it.`));
}
for(const item of fluency.items) item.hints = item.id.startsWith('f2') ? ['Double the other factor: add it to itself.'] : ['Line up hundreds, tens and ones. Work from the ones place and regroup when needed.'];
const pack={id:7,title:'Chapter 7: Fractions',summary:'Equal parts, fraction names, number lines, one whole, whole numbers, fractions beyond one, and fractions of a set.',vocabulary,guide,practice:{title:'Chapter 7 Mixed Fraction Practice',items:practice},test:{topic:'Chapter 7: Fractions',coverage:'28 original questions: four for each of Lessons 7-1 through 7-7.',instructions:'Answer every question, then submit. You can review before submitting. Explanations appear after the test.',note:'Study Scoop practice, not the teacher’s actual test. The newsletter announces no Chapter 7 Math test date. Fluency and the optional performance task are separate.',pass:23,items:test},performance,fluency};
fs.writeFileSync('data/chapters/7.json',JSON.stringify(pack,null,2)+'\n');
console.log(`Chapter 7 resources: ${practice.length} practice, ${test.length} test, ${vocabulary.length} vocabulary, ${fluency.items.length} fluency.`);
