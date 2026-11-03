// Original fraction diagrams and parent-assisted tools for homework packets only.
import {html, raw} from '../lib/html.js';
export function fractionFigure(f) {
  const shapes=[];
  for(let i=0;i<f.d;i++) {
    const fill=i<f.n?'#583084':'#fff';
    if(f.kind==='circle') {
      const a=2*Math.PI*i/f.d-Math.PI/2,b=2*Math.PI*(i+1)/f.d-Math.PI/2;
      shapes.push(`<path d="M 100 100 L ${100+80*Math.cos(a)} ${100+80*Math.sin(a)} A 80 80 0 ${b-a>Math.PI?1:0} 1 ${100+80*Math.cos(b)} ${100+80*Math.sin(b)} Z" fill="${fill}" stroke="#222" stroke-width="2"/>`);
    } else if(f.kind==='set') {
      const x=24+(i%6)*30,y=45+Math.floor(i/6)*65;
      shapes.push(`<circle cx="${x}" cy="${y}" r="12" fill="${fill}" stroke="#222" stroke-width="2"/>`);
      if(i<f.n)shapes.push(`<circle cx="${x}" cy="${y}" r="3" fill="#fff"/>`);
    } else shapes.push(`<rect x="10" y="${10+i*180/f.d}" width="160" height="${180/f.d}" fill="${fill}" stroke="#222" stroke-width="2"/>`);
  }
  return html`<figure class="hw-fraction"><svg role="img" aria-label="${f.kind==='set'?'A set of objects. Count all objects and the dotted objects.':'A whole divided into equal parts. Count all parts and the shaded parts.'}" viewBox="0 0 200 200" width="200" height="200">${raw(shapes.join(''))}</svg><span class="sr-only">${Array.from({length:f.d},(_,i)=>html`<span>${f.kind==='set'?'Object':'Part'} ${i+1}: ${i<f.n?'shaded'+(f.kind==='set'?', dotted':''):'unshaded'}. </span>`)}</span></figure>`;
}
export function drawingTools(run) {
 const st=run.tools||{};
 return html`<div class="card"><h3>Draw equal parts</h3><p>On your class paper, draw a triangle in halves and a rectangle in eighths. Try building those partitions here first.</p>
 <form data-partition="triangle"><h4>Triangle: make two equal parts</h4><label for="triangle-cut">Where should the line go?</label><select id="triangle-cut" name="cut"><option value="">Choose a line</option>${[['middle','Top vertex to the midpoint of the base'],['edge','Top vertex to a point close to a base corner']].map(([v,l])=>html`<option value="${v}"${st.triangle?.cut===v?' selected':''}>${l}</option>`)}</select><button class="btn" type="submit">Draw and check triangle</button><div data-result="triangle" role="status">${st.triangle ? triangleResult(st.triangle.cut) : ''}</div></form>
 <form data-partition="rectangle"><h4>Rectangle: make eight equal parts</h4><label for="partition-rows">Equal rows</label><input id="partition-rows" name="rows" type="number" min="1" max="8" value="${st.rectangle?.rows||1}"><label for="partition-cols">Equal columns</label><input id="partition-cols" name="cols" type="number" min="1" max="8" value="${st.rectangle?.cols||1}"><button class="btn" type="submit">Draw and check rectangle</button><div data-result="rectangle" role="status">${st.rectangle ? rectangleResult(st.rectangle.rows,st.rectangle.cols) : ''}</div></form></div>`;
}
function triangleResult(cut) {
 if(!cut)return html`<p>Choose where to draw your line first.</p>`;
 const x=cut==='middle'?100:45;
 return html`<svg role="img" aria-label="Triangle split from the top vertex to ${cut==='middle'?'the midpoint':'a point near a corner'} of the base" viewBox="0 0 200 160" width="200" height="160"><path d="M100 10 L10 150 L190 150 Z" fill="white" stroke="#222" stroke-width="3"/><path d="M100 10 L${x} 150" stroke="#583084" stroke-width="3"/></svg><p>${cut==='middle'?'Two equal areas: each part is one-half. Now draw it on your paper.':'These parts have different areas. Halves must have equal areas. Try a line to the midpoint of the base.'}</p>`;
}
function rectangleResult(rows,cols) {
 if(!Number.isInteger(rows)||!Number.isInteger(cols)||rows<1||rows>8||cols<1||cols>8)return html`<p>Choose whole numbers from 1 to 8.</p>`;
 const lines=[];for(let i=1;i<rows;i++)lines.push(`<path d="M10 ${10+140*i/rows} H210"/>`);for(let i=1;i<cols;i++)lines.push(`<path d="M${10+200*i/cols} 10 V150"/>`);
 return html`<svg role="img" aria-label="A rectangle with ${rows} equal rows and ${cols} equal columns" viewBox="0 0 220 160" width="220" height="160"><rect x="10" y="10" width="200" height="140" fill="white" stroke="#222" stroke-width="2"/><g stroke="#222" stroke-width="2">${raw(lines.join(''))}</g></svg><p>${rows*cols===8?'Eight equal parts: each part is one-eighth. Now draw it on your paper.':`You made ${rows*cols} equal parts. Eighths need eight equal parts. Change the rows or columns and try again.`}</p>`;
}
export function fluencyTracker(run) {
 const st=run.tools||{};
 return html`<div class="card"><h3>Class passage: parent-assisted reading tracker</h3><p>Read My Favorite Author from your class paper three times. A grown-up enters words read right (WRR) and errors for each attempt. These are manual records, not automatic scores. Print before leaving to keep your record.</p><div class="hw-table-scroll"><table class="fluency"><caption>Class passage — three reading attempts (not saved)</caption><thead><tr><th scope="col">Record</th>${[1,2,3].map(n=>html`<th scope="col">Read ${n}</th>`)}</tr></thead><tbody>${[['right','Words read right'],['errors','Errors']].map(([key,label])=>html`<tr><th scope="row">${label}</th>${[1,2,3].map(n=>html`<td><input type="number" min="0" max="196" step="1" data-fluency="${key}${n}" value="${st[key+n]??''}" aria-label="${label}, class passage read ${n}"></td>`)}</tr>`)}</tbody></table></div><p class="hint">The class page has 196 words. Count errors only among the words attempted; WRR is words attempted minus errors. Follow the teacher’s directions for what counts as an error.</p></div>`;
}
export function mountPacketTools(app,getRun,signal,onUpdate) {
 app.addEventListener('click',e=>{const btn=e.target.closest('[data-hw-nav]');if(!btn)return;const run=getRun();run.pi=Math.max(0,(run.pi||0)+Number(btn.dataset.hwNav));onUpdate();},{signal});
 app.addEventListener('input',e=>{const key=e.target.dataset.fluency;if(key){const run=getRun();(run.tools||={})[key]=e.target.value; const summary=app.querySelector('[data-fluency-summary]');if(summary)summary.textContent=fluencyStatus(run);}},{signal});
 app.addEventListener('submit',e=>{const form=e.target.closest('form[data-partition]');if(!form)return;e.preventDefault();const run=getRun();const kind=form.dataset.partition;const fd=new FormData(form);const st=kind==='triangle'?{cut:fd.get('cut')}:{rows:Number(fd.get('rows')),cols:Number(fd.get('cols'))};(run.tools||={})[kind]=st;form.querySelector('[data-result]').innerHTML=(kind==='triangle'?triangleResult(st.cut):rectangleResult(st.rows,st.cols)).s;},{signal});
}

export function fluencyStatus(run) {
 const st=run.tools||{};const filled=[1,2,3].filter(n=>['right','errors'].every(k=>st[k+n]!==undefined && st[k+n]!=='' && Number.isInteger(Number(st[k+n])) && Number(st[k+n])>=0 && Number(st[k+n])<=196) && Number(st['right'+n])+Number(st['errors'+n])<=196).length;
 return `${filled} of 3 reading attempts recorded with valid counts. A grown-up checks accuracy; print to keep your record.`;
}
