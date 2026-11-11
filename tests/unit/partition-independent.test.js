import assert from 'node:assert/strict';
import test from 'node:test';
import {TASKS,validatePartition,makeTestTask} from '../../js/lib/partition-geometry.js';

// Independently authored after the engine; sampled containment checks use a
// separate ray-crossing implementation and do not certify teaching quality.
test('independent coverage, equal-area, alternative and adversarial probes', () => {
function contains(p,poly){let n=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){let a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])n=!n;}return n;}
let checks=0,samples=0;
for(const base of TASKS)for(const t of [base,makeTestTask(base)]){
 for(const lines of t.solutions){const r=validatePartition(t,lines);assert.equal(r.valid,true,t.label);checks++;
  assert.equal(validatePartition(t,lines.concat(lines.map(l=>l.slice().reverse()))).valid,true);checks++;
  for(let k=0;k<lines.length;k++){assert.equal(validatePartition(t,lines.filter((_,j)=>j!==k)).valid,false);checks++;}
  if(t.shape==='polygon')for(let x=20.371;x<280;x+=3.379)for(let y=20.173;y<280;y+=3.271){const p=[x,y];const count=r.regions.filter(poly=>contains(p,poly)).length;assert.equal(count,contains(p,t.polygon)?1:0,t.label+' overlap/gap');samples++;}
 }
 for(const bad of [[],[['invalid','v0']],[['v0','v0']],[[null,'v0']]]){assert.equal(validatePartition(t,bad).valid,false);checks++;}
}
const square={id:'custom',label:'rectangle',count:4,shape:'polygon',polygon:[[0,0],[300,0],[300,300],[0,300]],points:[],why:''};for(const x of [0,74,149,224,300])for(const y of [0,300])square.points.push({id:x+','+y,x,y});
let unequal=validatePartition(square,[74,149,224].map(x=>[x+',0',x+',300']));assert.equal(unequal.count,4);assert.equal(unequal.valid,false);assert.deepEqual(unequal.areas,[22200,22500,22500,22800]);checks++;
const cross=TASKS.find(t=>t.id==='cross-fourths');for(const lines of cross.solutions){const result=validatePartition(cross,lines);assert.deepEqual(result.areas,[8000,8000,8000,8000]);checks++;}
assert.ok(checks >= 190);
assert.ok(samples >= 110000);
});
