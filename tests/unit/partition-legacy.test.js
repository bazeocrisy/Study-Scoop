import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Preserve an executable counterexample so the sketch checker is never
// advertised as exact mathematical validation again.
test('legacy raster near-equality is explicitly a drawing estimate', () => {
  const src = fs.readFileSync(new URL('../../interactive/7-1.html', import.meta.url), 'utf8');
  const start = src.indexOf('const N = 300'), end = src.indexOf('function sameWay', start);
  const run = new Function(`${src.slice(start, end)};return analyze(insideMask({type:'poly',pts:[[0,0],[300,0],[300,300],[0,300]]}),[[[74,0],[74,300]],[[149,0],[149,300]],[[224,0],[224,300]]]);`);
  const result = run();
  assert.deepEqual(result.area, [22200,22500,22500,22800]);
  assert.equal(result.equal, true);
  assert.match(src, /This pixel check cannot prove exact equality/);
  assert.match(src, /if \(shape\) tags.push/);
  assert.match(src, /Drawing estimates do not count as independent equal-area mastery/);
  assert.match(src, /index\.html#math\?lesson=7-1&stage=learn/);
  assert.doesNotMatch(src, /Yes! \$\{o.target\} equal parts/);
});
