import test from 'node:test';
import assert from 'node:assert/strict';
import {REASONING_TASKS,reasoningPicture,makeReasoningTest} from '../../js/lib/partition-reasoning.js';
import {partitionPolygon} from '../../js/lib/partition-geometry.js';

const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const elements = (svg,name) => [...svg.matchAll(new RegExp(`<${name}\\b[^>]*>`,'g'))].map(m=>attrs(m[0]));
const points = str => str.trim().split(/\s+/).map(s=>s.split(',').map(Number));
const area = poly => Math.abs(poly.reduce((n,a,i)=>{const b=poly[(i+1)%poly.length];return n+a[0]*b[1]-b[0]*a[1];},0)/2);
const figure = id => reasoningPicture(REASONING_TASKS.find(t=>t.id===id),3,false).s;

test('rendered six-rhombus mosaic has equal tiles sharing edges without overlaps',()=>{
 const polygons=elements(figure('rhombi-name'),'polygon').map(p=>points(p.points));
 assert.equal(polygons.length,6);
 assert.ok(polygons.every(p=>area(p)===3600));
 const edges=new Map();for(const p of polygons)for(let i=0;i<p.length;i++){
  const ends=[p[i].join(','),p[(i+1)%p.length].join(',')].sort().join('|');edges.set(ends,(edges.get(ends)||0)+1);
 }
 assert.equal([...edges.values()].filter(n=>n===2).length,7);
 assert.equal([...edges.values()].filter(n=>n===1).length,10);
 assert.ok([...edges.values()].every(n=>n===1||n===2));
 // Nonadjacent interiors must not overlap. At every horizontal probe, compare
 // each polygon's independently calculated open x interval with its neighbors.
 for(let y=30.137;y<230;y+=2.719){const intervals=polygons.map(p=>{const xs=[];for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];if((a[1]>y)!==(b[1]>y))xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));}return xs.length?[Math.min(...xs),Math.max(...xs)]:null;}).filter(Boolean).sort((a,b)=>a[0]-b[0]);for(let i=1;i<intervals.length;i++)assert.ok(intervals[i-1][1]<=intervals[i][0]+1e-8);}
});

test('rendered slanted quadrilateral actually has eight equal-area triangles',()=>{
 const svg=figure('slanted-name'),poly=points(elements(svg,'polygon')[0].points);
 const cuts=elements(svg,'line').map(p=>[[+p.x1,+p.y1],[+p.x2,+p.y2]]);
 const regions=partitionPolygon(poly,cuts);
 assert.equal(regions.length,8);
 assert.ok(regions.every(p=>Math.abs(area(p)-area(poly)/8)<1e-8));
});

test('rendered different-outline pieces cover sixteen square units in equal groups of four',()=>{
 const svg=figure('different-outline'),rect=elements(svg,'rect')[0],w=+rect.width,h=+rect.height;
 const lines=elements(svg,'line');const vertical=lines.filter(l=>l.x1===l.x2).map(l=>+l.x1).sort((a,b)=>a-b);
 const horizontal=lines.filter(l=>l.y1===l.y2).map(l=>+l.y1).sort((a,b)=>a-b);
 assert.equal(vertical.length,7);assert.equal(horizontal.length,1);
 const unit=w/8;assert.equal(h/2,unit);
 assert.equal(w*h/unit**2,16);
 const path=elements(svg,'path')[0].d;
 const m=/M([\d.]+) ([\d.]+)V([\d.]+) M([\d.]+) ([\d.]+)V([\d.]+) M([\d.]+) ([\d.]+)H([\d.]+)/.exec(path);
 assert.ok(m);const q=m.slice(1).map(Number);
 const poly=[[+rect.x,+rect.y],[+rect.x+w,+rect.y],[+rect.x+w,+rect.y+h],[+rect.x,+rect.y+h]];
 const regions=partitionPolygon(poly,[[[q[0],q[1]],[q[0],q[2]]],[[q[3],q[4]],[q[3],q[5]]],[[q[6],q[7]],[q[8],q[7]]]]);
 assert.equal(regions.length,4);assert.deepEqual(regions.map(p=>area(p)/unit**2),[4,4,4,4]);
});


test('fresh recognition tests use changed geometry and correct recomputed keys',()=>{
 const task=id=>makeReasoningTest(REASONING_TASKS.find(t=>t.id===id));
 const rendered=id=>reasoningPicture(task(id),3,true).s;
 const mosaic=elements(rendered('rhombi-name'),'polygon').map(p=>points(p.points));
 assert.equal(mosaic.length,4);assert.ok(mosaic.every(p=>area(p)===3600));assert.equal(task('rhombi-name').answer,'fourths');
 const slanted=rendered('slanted-name'),poly=points(elements(slanted,'polygon')[0].points);
 const regions=partitionPolygon(poly,elements(slanted,'line').map(p=>[[+p.x1,+p.y1],[+p.x2,+p.y2]]));
 assert.equal(regions.length,4);assert.ok(regions.every(p=>area(p)===10000));assert.equal(task('slanted-name').answer,'fourths');
 const units=rendered('different-outline'),rect=elements(units,'rect')[0],path=elements(units,'path')[0].d;
 const cuts=[...path.matchAll(/M([\d.]+) ([\d.]+)V([\d.]+)/g)].map(m=>[[+m[1],+m[2]],[+m[1],+m[3]]]);
 const box=[[+rect.x,+rect.y],[+rect.x+(+rect.width),+rect.y],[+rect.x+(+rect.width),+rect.y+(+rect.height)],[+rect.x,+rect.y+(+rect.height)]];
 assert.deepEqual(partitionPolygon(box,cuts).map(p=>area(p)/900),[4,4,2,6]);assert.equal(task('different-outline').answer,'unequal');
 const circle=elements(rendered('circle-error'),'circle')[0];assert.equal(+circle.r,100);
 assert.equal(elements(rendered('circle-error'),'path')[0].d,'M50 140H250 M150 40V240');assert.equal(task('circle-error').answer,'yes');
 for(const t of REASONING_TASKS){const v=makeReasoningTest(t);assert.notEqual(reasoningPicture(t,3,true).s,reasoningPicture(v,3,true).s);assert.ok(v.choices.some(([id])=>id===v.answer));assert.doesNotMatch(reasoningPicture(v,3,true).s,/#84d5ce/);}
});

test('same-whole share comparisons and unequal circle bands match actual diagrams',()=>{
 for(const [variant,counts]of [[false,[4,6,8]],[true,[2,4,8]]]){
  const base=REASONING_TASKS.find(t=>t.id==='more-parts'),task=variant?makeReasoningTest(base):base;
  const svg=reasoningPicture(task,3,true).s,rects=elements(svg,'rect'),lines=elements(svg,'line');
  assert.equal(rects.length,3);assert.ok(rects.every(r=>+r.width===240&&+r.height===40));
  const areas=rects.map((r,i)=>{const cuts=lines.filter(l=>+l.y1===+r.y);assert.equal(cuts.length+1,counts[i]);return +r.width*(+r.height)/counts[i];});
  assert.ok(areas[0]>areas[1]&&areas[1]>areas[2]);assert.equal(task.answer,'smaller');
 }
 const svg=figure('circle-error'),c=elements(svg,'circle')[0],r=+c.r;
 const heights=[+c.cy-r,...elements(svg,'line').map(l=>+l.y1),+c.cy+r];
 // Integral of a circle's horizontal chord length between two heights.
 const primitive=y=>{const z=y-(+c.cy);return z*Math.sqrt(Math.max(0,r*r-z*z))+r*r*Math.asin(z/r);};
 const bands=heights.slice(1).map((y,i)=>primitive(y)-primitive(heights[i]));
 assert.equal(bands.length,4);assert.ok(bands[1]>bands[0]);assert.ok(Math.abs(bands.reduce((a,b)=>a+b,0)-Math.PI*r*r)<1e-8);
 assert.equal(REASONING_TASKS.find(t=>t.id==='circle-error').answer,'no');
});
