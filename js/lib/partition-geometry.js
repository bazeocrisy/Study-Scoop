// Guided constructions only. Finite segments are intersected and clipped to the
// whole; bounded faces, rather than stored answers, determine equal-area success.
const EPS = 1e-7;
const cross = (a,b) => a[0]*b[1]-a[1]*b[0];
const sub = (a,b) => [a[0]-b[0],a[1]-b[1]];
const lerp = (a,b,t) => [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
export function signedArea(p) { return p.reduce((s,a,i)=>s+cross(a,p[(i+1)%p.length]),0)/2; }
export const polygonArea = p => Math.abs(signedArea(p));
function inside(p,poly) { let yes=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++) { const a=poly[i],b=poly[j]; if(Math.abs(cross(sub(p,a),sub(b,a)))<EPS && p[0]>=Math.min(a[0],b[0])-EPS && p[0]<=Math.max(a[0],b[0])+EPS && p[1]>=Math.min(a[1],b[1])-EPS && p[1]<=Math.max(a[1],b[1])+EPS) return true; if((a[1]>p[1])!==(b[1]>p[1]) && p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]) yes=!yes; } return yes; }
// Planar graph face walk supports nonconvex wholes and partial interior cuts.
export function partitionPolygon(poly,cuts) {
  const edges=poly.map((a,i)=>[a,poly[(i+1)%poly.length]]).concat(cuts);
  const ts=edges.map(()=>[0,1]);
  for(let i=0;i<edges.length;i++) for(let j=i+1;j<edges.length;j++) {
    const [a,b]=edges[i],[c,d]=edges[j],r=sub(b,a),s=sub(d,c),den=cross(r,s),q=sub(c,a);
    if(Math.abs(den)>EPS) { const t=cross(q,s)/den,u=cross(q,r)/den; if(t>=-EPS&&t<=1+EPS&&u>=-EPS&&u<=1+EPS) { ts[i].push(Math.max(0,Math.min(1,t)));ts[j].push(Math.max(0,Math.min(1,u))); } }
    else if(Math.abs(cross(q,r))<EPS) { for(const [p,k] of [[c,i],[d,i],[a,j],[b,j]]) { const [v,w]=edges[k],delta=sub(w,v),axis=Math.abs(delta[0])>Math.abs(delta[1])?0:1; if(Math.abs(delta[axis])>EPS) { const t=(p[axis]-v[axis])/delta[axis]; if(t>=0&&t<=1) ts[k].push(t); } } }
  }
  const nodes=[],ids=new Map(),links=new Set();
  function node(p) {const key=p.map(v=>Math.round(v*1e7)).join(',');if(!ids.has(key)){ids.set(key,nodes.length);nodes.push({p,adj:[]});}return ids.get(key);}
  edges.forEach(([a,b],i)=>{const t=[...new Set(ts[i])].sort((x,y)=>x-y);for(let k=1;k<t.length;k++){if(t[k]-t[k-1]<EPS)continue;const u=lerp(a,b,t[k-1]),v=lerp(a,b,t[k]);if(!inside(lerp(u,v,.5),poly))continue;const x=node(u),y=node(v),key=[x,y].sort((m,n)=>m-n).join(':');if(x!==y&&!links.has(key)){links.add(key);nodes[x].adj.push(y);nodes[y].adj.push(x);}}});
  nodes.forEach(n=>n.adj.sort((a,b)=>Math.atan2(nodes[a].p[1]-n.p[1],nodes[a].p[0]-n.p[0])-Math.atan2(nodes[b].p[1]-n.p[1],nodes[b].p[0]-n.p[0])));
  const visited=new Set(),faces=[];
  for(let a=0;a<nodes.length;a++)for(const b of nodes[a].adj){if(visited.has(`${a}:${b}`))continue;let u=a,v=b;const face=[];for(let limit=0;limit<links.size*2+2;limit++){const key=`${u}:${v}`;if(visited.has(key))break;visited.add(key);face.push(nodes[u].p);const adj=nodes[v].adj,w=adj[(adj.indexOf(u)-1+adj.length)%adj.length];u=v;v=w;}if(u===a&&v===b&&signedArea(face)>EPS)faces.push(face);}
  return faces;
}
const point=(id,p,label=id)=>({id,x:p[0],y:p[1],label});
const reg=(n,start=-Math.PI/2)=>Array.from({length:n},(_,i)=>[150+110*Math.cos(start+i*2*Math.PI/n),150+110*Math.sin(start+i*2*Math.PI/n)]);
function task(id,label,count,poly,extra,solutions,texts,why){const points=poly.map((p,i)=>point(`v${i}`,p,`Corner ${i+1}`)).concat(extra);const solution=solutions[0];return {id,label,count,shape:'polygon',polygon:poly,points,solution,solutions,steps:[{text:'This outline is one whole. Equal parts must cover the whole and have the same area.',lines:[]},...texts.map((text,i)=>({text,lines:solution.slice(0,i+1)})),{text:why,lines:solution}],why};}
const square=[[40,40],[260,40],[260,260],[40,260]];
const midpoint=(a,b)=>lerp(a,b,.5);
const tri=[[150,35],[35,255],[265,255]];
const sqExtra=[...Array.from({length:5},(_,i)=>[point(`t${i+1}`,[40+220*(i+1)/6,40],`Top mark ${i+1}`),point(`b${i+1}`,[40+220*(i+1)/6,260],`Bottom mark ${i+1}`)]).flat(),point('lm',[40,150],'Left midpoint'),point('rm',[260,150],'Right midpoint')];
const strips=Array.from({length:5},(_,i)=>[`t${i+1}`,`b${i+1}`]);
const fan=(n)=>Array.from({length:n},(_,i)=>['c',`v${i}`]);
export const TASKS=[
 task('triangle-fourths','Triangle: fourths',4,tri,tri.map((p,i)=>point(`m${i}`,midpoint(p,tri[(i+1)%3]),`Midpoint ${i+1}`)),[[['m0','m1'],['m1','m2'],['m2','m0']]],[ 'Find the halfway point on each side. Join two midpoints.','Join the next pair of midpoints.','Join the last pair. Count four small triangles.' ],'Each small triangle has half the base and half the height of the whole: half of half is one fourth. All four have the same area.'),
 task('diamond-fourths','Diamond: fourths',4,[[150,25],[245,150],[150,275],[55,150]],[],[[['v0','v2'],['v1','v3']]],[ 'Join the top corner to the bottom corner.','Join the left corner to the right corner.' ],'The diagonals meet halfway. The four triangles have equal bases and heights, so they have equal area.'),
 task('square-sixths','Square: sixths',6,square,sqExtra,[strips,[['t2','b2'],['t4','b4'],['lm','rm']]],[ 'Use the equally spaced edge points. Draw the first divider.','Add the second divider.','Add the third divider.','Add the fourth divider.','Add the fifth divider.' ],'Six strips have the same width and height. Another way is three equal columns split into two equal rows.'),
 task('octagon-fourths','Octagon: fourths',4,reg(8),[point('c',[150,150],'Center')],[[['v0','v4'],['v2','v6']]],[ 'Join opposite corners through the center.','Join the other opposite corners at a right angle.' ],'Four matching quarter-turn regions cover this regular octagon. Rotating one quarter fits it exactly on the next.'),
 task('hexagon-sixths','Hexagon: sixths',6,reg(6),[point('c',[150,150],'Center')],[fan(6)],Array.from({length:6},(_,i)=>`Join the center to corner ${i+1}.`),'Six triangles have the same base length and height from the center. They have equal area.'),
 task('octagon-eighths','Octagon: eighths',8,reg(8),[point('c',[150,150],'Center')],[fan(8)],Array.from({length:8},(_,i)=>`Join the center to corner ${i+1}.`),'Eight triangles have the same base length and height from the center. Each is one eighth of the whole.'),
 task('cross-fourths','Cross: fourths',4,[[110,30],[190,30],[190,110],[270,110],[270,190],[190,190],[190,270],[110,270],[110,190],[30,190],[30,110],[110,110]],[point('top',[150,30],'Top midpoint'),point('bottom',[150,270],'Bottom midpoint'),point('left',[30,150],'Left midpoint'),point('right',[270,150],'Right midpoint')],[[['top','bottom'],['left','right']]],[ 'Join the top midpoint to the bottom midpoint.','Join the left midpoint to the right midpoint.' ],'Each region fits the next after a quarter turn. Four matching regions fill the cross without gaps, so each has one fourth of its area.'),
];
const circlePoints=reg(8).map((p,i)=>point(`v${i}`,p,`Edge point ${i+1}`));
const circleSolution=[['v0','v4'],['v1','v5'],['v2','v6'],['v3','v7']];
TASKS.splice(3,0,{id:'circle-eighths',label:'Circle: eighths',count:8,shape:'circle',center:[150,150],radius:110,points:[...circlePoints,point('c',[150,150],'Center')],solution:circleSolution,solutions:[circleSolution,fan(8)],steps:[{text:'The circle is one whole. Edge points are equally spaced around it.',lines:[]},...circleSolution.map((_,i)=>({text:`Draw diameter ${i+1} through the center to the opposite point.`,lines:circleSolution.slice(0,i+1)})),{text:'Eight equal turns make eight equal-area slices.',lines:circleSolution}],why:'The slices have the same radius and the same angle at the center. Eight equal turns cover the circle, so each slice is one eighth.'});
export const PARTITION_TASKS=TASKS;
export function validatePartition(taskOrId,lines) {
 const task=typeof taskOrId==='string'?TASKS.find(t=>t.id===taskOrId):taskOrId;
 if(!task||!Array.isArray(lines))return {valid:false,count:0,areas:[],regions:[],message:'Choose a construction first.'};
 const points=new Map(task.points.map(p=>[p.id,[p.x,p.y]]));
 if(lines.some(l=>!Array.isArray(l)||l.length!==2||!points.has(l[0])||!points.has(l[1])||l[0]===l[1]))return {valid:false,count:0,areas:[],regions:[],message:'A divider needs two different marked points.'};
 const cuts=lines.map(([a,b])=>[points.get(a),points.get(b)]);let areas,regions=[],whole;
 if(task.shape==='circle') {const angles=[];for(const [a,b] of cuts){const u=sub(a,task.center),v=sub(b,task.center),ru=Math.hypot(...u),rv=Math.hypot(...v);if(Math.abs(cross(u,v))>EPS*task.radius || (ru>EPS&&rv>EPS&&u[0]*v[0]+u[1]*v[1]>=0))return {valid:false,count:1,areas:[],regions:[],message:'For this circle lab, connect the center to an edge point, or join opposite edge points through the center.'};for(const [p,r] of [[u,ru],[v,rv]])if(r>EPS)angles.push((Math.atan2(p[1],p[0])+2*Math.PI)%(2*Math.PI));}const a=[...new Set(angles.map(x=>Math.round(x*1e10)/1e10))].sort((x,y)=>x-y);whole=Math.PI*task.radius**2;areas=a.length<2?[whole]:a.map((x,i)=>((a[(i+1)%a.length]-x+2*Math.PI)%(2*Math.PI))*task.radius**2/2);}
 else {regions=partitionPolygon(task.polygon,cuts);areas=regions.map(polygonArea);whole=polygonArea(task.polygon);}
 const count=areas.length,cover=Math.abs(areas.reduce((s,a)=>s+a,0)-whole)<whole*1e-6,equal=areas.every(a=>Math.abs(a-whole/task.count)<whole*1e-6),valid=count===task.count&&cover&&equal;
 const message=valid?`${task.count} equal-area parts cover the whole. ${task.why}`:count!==task.count?`You made ${count} parts. We need ${task.count} equal parts. ${count===1?"Tracing the outside edge does not split the inside. Draw a divider across the inside. ":""}A line must finish at the edge or another divider to separate a new part.`:'There are enough parts, but their areas differ. Compare how much space is inside each part; counting pieces alone is not enough.';
 return {valid,count,areas,regions,message};
}

// Alternate demonstrations are explicit constructions, not answer templates.
const triangleTask = TASKS.find(t=>t.id==='triangle-fourths');
triangleTask.steps.splice(1,0,{text:'Find the midpoint of every side: the point halfway between its two corners. Each midpoint makes two equal side lengths.',lines:[]});
const squareTask = TASKS.find(t=>t.id==='square-sixths');
squareTask.alternateSteps=[{text:'Another way: use three equal columns and two equal rows.',lines:[]},{text:'Join the points one third of the way across the top and bottom.',lines:[['t2','b2']]},{text:'Join the points two thirds of the way across.',lines:[['t2','b2'],['t4','b4']]},{text:'Split each column halfway across its height. All six rectangles have equal width and height.',lines:squareTask.solutions[1]}];
const crossTask=TASKS.find(t=>t.id==='cross-fourths');
const crossAlternative=[['v2','v8'],['v5','v11']];
crossTask.solutions.push(crossAlternative);
crossTask.alternateSteps=[{text:'Try a different way. Find the four inside corners around the center square.',lines:[]},{text:'Join two opposite inside corners across the center.',lines:[crossAlternative[0]]},{text:'Join the other opposite inside corners. Each region has one arm and one quarter of the center square. All four areas are equal.',lines:crossAlternative}];
export function makeTestTask(task) {
 if(task.id==='circle-eighths') {const polygon=reg(6);return {...task,id:task.id,count:6,label:'Circle: sixths',points:[...polygon.map((p,i)=>point(`v${i}`,p,`Edge point ${i+1}`)),point('c',[150,150],'Center')],solution:fan(6),solutions:[fan(6)],steps:[],why:'Six equal angles with the same radius make six equal-area slices.'};}
 const transform=task.id==='triangle-fourths'?([x,y])=>[30+(x-30)*.85+(y-150)*.16,y]:([x,y])=>[150+(x-150)*.82+(y-150)*.12,150+(y-150)*.9];
 const label=task.id==='triangle-fourths'?'Slanted triangle: fourths':task.id==='square-sixths'?'Parallelogram: sixths':`Stretched ${task.label.toLowerCase()}`;
 return {...task,label,polygon:task.polygon.map(transform),points:task.points.map(p=>{const [x,y]=transform([p.x,p.y]);return {...p,x,y};}),steps:[],why:task.id==='triangle-fourths'?task.why:'The whole and all its parts were stretched in the same way. Equal areas stay equal. Check that the parts cover the whole.'};
}
