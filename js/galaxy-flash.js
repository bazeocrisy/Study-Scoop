// Galaxy Flash Cards (Times Tables). Nothing is stored: choices live in memory until the page closes.
const $=id=>document.getElementById(id);
/* keep aria-pressed in step with the .sel look */
new MutationObserver(ms=>ms.forEach(m=>{const t=m.target;if(t.classList.contains('opt'))t.setAttribute('aria-pressed',String(t.classList.contains('sel')));})).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
const screens=['home','study','test','results','done'];
function show(s){screens.forEach(x=>$(x).classList.toggle('on',x===s));}

/* ---- table selection ---- */
let selected=new Set([1,2,3,4,5,6,7,8,9,10,11,12]);
const chips=$('chips');
for(let n=1;n<=12;n++){const b=document.createElement('button');b.className='chip';b.textContent=n;b.dataset.n=n;
  b.onclick=()=>{if(selected.size===12){selected=new Set([n]);}else{selected.has(n)?selected.delete(n):selected.add(n);if(!selected.size){selected=new Set([1,2,3,4,5,6,7,8,9,10,11,12]);}}render();};chips.appendChild(b);}
const all=document.createElement('button');all.className='chip all sel';all.textContent='All';
all.onclick=()=>{selected=new Set([1,2,3,4,5,6,7,8,9,10,11,12]);render();};chips.appendChild(all);
function render(){const isAll=selected.size===12;[...chips.children].forEach(c=>{if(c.dataset.n){c.classList.toggle('sel',!isAll&&selected.has(+c.dataset.n));c.setAttribute('aria-pressed',String(c.classList.contains('sel')));c.setAttribute('aria-label','Table of '+c.dataset.n);}});all.classList.toggle('sel',isAll);all.setAttribute('aria-pressed',String(isAll));}
render();
function saveSel(){}

/* ---- timer choice ---- */
let secs=5;
$('timerSet').querySelectorAll('.opt').forEach(o=>o.onclick=()=>{secs=+o.dataset.t;$('timerSet').querySelectorAll('.opt').forEach(x=>x.classList.toggle('sel',x===o));});

function vert(a,b){return `<div class="vert"><div>${a}</div><div class="op"><b>×</b>${b}</div></div>`;}
function buildDeck(){const d=[];selected.forEach(a=>{for(let b=1;b<=12;b++)d.push([a,b]);});return d;}
function shuffleArr(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

/* ---- practice session ---- */
let speed=3,minutes=5;
function setSpeed(v){speed=v;['liveSpeed'].forEach(id=>$(id).querySelectorAll('.opt').forEach(x=>x.classList.toggle('sel',+x.dataset.s===speed)));}
$('liveSpeed').querySelectorAll('.opt').forEach(o=>o.onclick=()=>{setSpeed(+o.dataset.s);
  if($('study').classList.contains('on')){$('manualRow').style.display=speed?'none':'flex';$('sHint').textContent=speed?'Watch the card. It flips by itself.':'Tap the card to flip it, then Next.';$('studyCard').classList.remove('flip');autoStep();}});
$('minSet').querySelectorAll('.opt').forEach(o=>o.onclick=()=>{minutes=+o.dataset.m;$('minSet').querySelectorAll('.opt').forEach(x=>x.classList.toggle('sel',x===o));});

setSpeed(3);
let deck=[],idx=0,autoT=null,clock=null,secsLeft=0,total=0,cards=0,paused=false,afterPractice=false;
$('goStudy').onclick=()=>{saveSel();
  deck=shuffleArr(buildDeck());idx=0;cards=0;paused=false;total=secsLeft=minutes*60;
  $('fill').style.transition='none';$('fill').style.width='100%';$('study').classList.remove('paused');$('pause').textContent='⏸ Pause';
  $('manualRow').style.display=speed?'none':'flex';
  $('sHint').textContent=speed?'Watch the card. It flips by itself.':'Tap the card to flip it, then Next.';
  showStudy();show('study');
  requestAnimationFrame(()=>{$('fill').style.transition='width 1s linear';});
  clearInterval(clock);clock=setInterval(tickClock,1000);autoStep();};
function fmt(n){return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;}
function tickClock(){if(paused)return;secsLeft--;$('fill').style.width=(secsLeft/total*100)+'%';$('studyCount').textContent=`${fmt(secsLeft)} left · ${cards} cards`;
  if(secsLeft<=0){endPractice();}}
function endPractice(){clearInterval(clock);stopAuto();
  // quick check: 10 cards from the same tables, test timer = practice speed (min 3s)
  afterPractice=true;secs=Math.max(3,speed||5);startTest(shuffleArr(buildDeck()).slice(0,10));}
function showStudy(){const [a,b]=deck[idx];$('studyCard').classList.remove('flip');$('sFront').innerHTML=vert(a,b);$('sBack').textContent=a*b;$('studyCount').textContent=`${fmt(secsLeft)} left · ${cards} cards`;}
function nextCard(){cards++;idx++;if(idx>=deck.length){idx=0;shuffleArr(deck);}showStudy();}
$('studyCard').onclick=()=>{if(!speed)$('studyCard').classList.toggle('flip');};
$('next').onclick=()=>{nextCard();};
$('prev').onclick=()=>{idx=(idx-1+deck.length)%deck.length;showStudy();};
$('studyHome').onclick=()=>{clearInterval(clock);stopAuto();show('home');};
$('pause').onclick=()=>{paused=!paused;$('study').classList.toggle('paused',paused);$('pause').textContent=paused?'▶ Resume':'⏸ Pause';
  if(paused)stopAuto();else autoStep();};
function stopAuto(){clearTimeout(autoT);autoT=null;}
function autoStep(){stopAuto();if(!speed||paused)return;
  autoT=setTimeout(()=>{$('studyCard').classList.add('flip');
    autoT=setTimeout(()=>{nextCard();autoStep();},Math.max(1000,speed*500));},speed*1000);}

/* ---- test mode ---- */
let tDeck=[],tIdx=0,right=0,missed=[],timer=null,left=0;
const CIRC=2*Math.PI*22;$('arc').style.strokeDasharray=CIRC;
$('goTest').onclick=()=>{saveSel();startTest(shuffleArr(buildDeck()));};
function startTest(d){tDeck=d;tIdx=0;right=0;missed=[];show('test');askCard();}
function askCard(){clearInterval(timer);const [a,b]=tDeck[tIdx];const card=$('testCard');card.classList.remove('flip');$('tQ').innerHTML=vert(a,b);const inp=$('ans');inp.value='';inp.disabled=false;$('tBack').className='face back';pad.classList.remove('off');$('tBack').textContent=a*b;
  $('testCount').textContent=(afterPractice?'Quick check · ':'')+`Card ${tIdx+1} of ${tDeck.length}`;$('grade').classList.remove('on');$('tHint').textContent='Tap the numbers, then tap ✓.';
  left=secs;$('tick').textContent=left;$('arc').style.transition='none';$('arc').style.strokeDashoffset=0;
  requestAnimationFrame(()=>{$('arc').style.transition='stroke-dashoffset .95s linear';tickDown();});
  timer=setInterval(tickDown,1000);}
function tickDown(){left--;$('arc').style.strokeDashoffset=CIRC*(1-left/secs);if(left<=0){clearInterval(timer);$('tick').textContent='';reveal();}else{$('tick').textContent=left;}}
function reveal(){clearInterval(timer);const inp=$('ans');inp.disabled=true;pad.classList.add('off');const [a,b]=tDeck[tIdx];const ok=parseInt(inp.value,10)===a*b;
  $('tBack').classList.add(ok?'ok':'bad');$('tBack').textContent=a*b;
  $('tHint').textContent=ok?'Correct!':(inp.value===''?`Time's up! ${a} × ${b} = ${a*b}`:`Not quite. ${a} × ${b} = ${a*b}`);
  if(ok)right++;else missed.push(tDeck[tIdx]);
  $('testCard').classList.add('flip');$('grade').classList.add('on');setTimeout(()=>$('nextQ').focus(),50);}
function advance(){tIdx++;if(tIdx<tDeck.length)askCard();else finish();}

const pad=$('pad');
[1,2,3,4,5,6,7,8,9,'⌫',0,'✓'].forEach(k=>{const b=document.createElement('button');b.textContent=k;
  if(k==='⌫'){b.className='del';b.setAttribute('aria-label','Delete');b.onclick=()=>typeKey('Backspace');}
  else if(k==='✓'){b.className='go';b.setAttribute('aria-label','Check answer');b.onclick=()=>typeKey('Enter');}
  else b.onclick=()=>typeKey(String(k));
  pad.appendChild(b);});
function typeKey(k){const inp=$('ans');if(inp.disabled)return;
  if(k==='Backspace')inp.value=inp.value.slice(0,-1);
  else if(k==='Enter'){if(inp.value!=='')reveal();}
  else if(/^[0-9]$/.test(k)&&inp.value.length<3)inp.value+=k;}
document.addEventListener('keydown',e=>{if(!$('test').classList.contains('on')||$('grade').classList.contains('on'))return;
  if(e.key==='Backspace'||e.key==='Enter'||/^[0-9]$/.test(e.key)){e.preventDefault();e.stopPropagation();typeKey(e.key);}},true);
$('nextQ').onclick=advance;
document.addEventListener('keydown',e=>{if($('test').classList.contains('on')&&e.key==='Enter'&&$('grade').classList.contains('on')){e.preventDefault();advance();}});
$('testQuit').onclick=()=>{clearInterval(timer);show('home');};
function finish(){const n=tDeck.length,pct=right/n;
  if(afterPractice){afterPractice=false;const tbl=selected.size===12?'all tables':[...selected].sort((a,b)=>a-b).map(x=>x+'s').join(', ');
    $('report').innerHTML=`Practiced <b>${tbl}</b> for <b>${minutes} minutes</b><br>Saw <b>${cards}</b> cards<br>Quick check: <b>${right} / ${n}</b> ${pct===1?'⭐⭐⭐':pct>=.8?'⭐⭐':'⭐'}`+
      (missed.length?`<br><small>Missed: ${missed.map(([a,b])=>`${a}×${b}`).join(', ')}</small>`:'');
    show('done');return;}
  show('results');
  $('scoreNum').textContent=`${right} / ${n}`;
  $('stars').textContent=pct===1?'⭐⭐⭐':pct>=.8?'⭐⭐':pct>=.5?'⭐':'💪';
  $('scoreMsg').textContent=pct===1?'Perfect score! You know these!':pct>=.8?'Great job! Almost there.':pct>=.5?'Good work. Keep practicing!':'Keep going — every try makes you stronger.';
  const box=$('missedBox');
  if(missed.length){box.style.display='block';box.innerHTML='<strong>Ones to practice:</strong><br>'+missed.map(([a,b])=>`${a} × ${b} = ${a*b}`).join('<br>');$('retryMissed').style.display='block';}
  else{box.style.display='none';$('retryMissed').style.display='none';}}
$('retryMissed').onclick=()=>startTest(shuffleArr([...missed]));
$('testAgain').onclick=()=>startTest(shuffleArr(buildDeck()));
$('resHome').onclick=()=>show('home');
$('doneHome').onclick=()=>show('home');

/* keyboard: space flips in study, arrows move */
document.addEventListener('keydown',e=>{if(!$('study').classList.contains('on'))return;
  if(e.key===' '&&!speed){e.preventDefault();$('studyCard').classList.toggle('flip');}
  if(e.key==='ArrowRight')$('next').click();if(e.key==='ArrowLeft')$('prev').click();});
