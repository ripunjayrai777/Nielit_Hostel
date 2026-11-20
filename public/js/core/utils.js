// Small helpers used by every feature
const today=()=>new Date(Date.now()+19800000).toISOString().slice(0,10);
const E=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const cmp=(a,b)=>(a.room||'~').localeCompare(b.room||'~',undefined,{numeric:true})||a.name.localeCompare(b.name);
const filt=()=>S.filter(s=>(!F.batch||s.batch==F.batch)&&(!F.branch||s.branch==F.branch)&&(!F.q||(s.name+s.roll+(s.room||'')).toLowerCase().includes(F.q.toLowerCase()))).sort(cmp);
const noRoll=s=>s.roll.startsWith('TMP-'),rl=s=>noRoll(s)?'<span class="tag Leave">no roll</span>':s.roll;
const sName=r=>{const s=S.find(x=>x.roll==r);return s?E(s.name):r},sRoom=r=>{const s=S.find(x=>x.roll==r);return(s&&s.room)||'-'};
const opts=(sel='')=>S.slice().sort(cmp).map(s=>`<option value="${s.roll}" ${s.roll==sel?'selected':''}>${E(s.room||'-')} · ${E(s.name)}${noRoll(s)?'':' ('+s.roll+')'}</option>`).join('');
const covers=(l,d)=>l.from<=d&&(l.returned?d<l.returned:(!l.to||d<=l.to));
const av=s=>s.photo?`<img class="av" src="${up(s.photo)}">`:`<img class="av" alt="">`;
const filterBar=()=>`<div class="row"><select onchange="F.batch=this.value;V[tab](1)"><option value="">All batches</option><option ${F.batch=='2025-2029'?'selected':''}>2025-2029</option><option ${F.batch=='2026-2030'?'selected':''}>2026-2030</option></select><select onchange="F.branch=this.value;V[tab](1)"><option value="">All branches</option><option ${F.branch=='CSE'?'selected':''}>CSE</option><option ${F.branch=='ECE'?'selected':''}>ECE</option></select><input placeholder="Search name / roll / room" value="${E(F.q)}" onchange="F.q=this.value;V[tab](1)"></div>`;
function csv(name,rows){const c=rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+c],{type:'text/csv'}));a.download=name;a.click()}
const parseCSV=t=>{const r=[];let row=[],f='',q=0;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c=='"'&&t[i+1]=='"'){f+='"';i++}else if(c=='"')q=0;else f+=c}else if(c=='"')q=1;else if(c==','){row.push(f);f=''}else if(c=='\n'){row.push(f);r.push(row);row=[];f=''}else if(c!='\r')f+=c}row.push(f);r.push(row);return r};
const shrink=f=>new Promise((ok,no)=>{const i=new Image;i.onload=()=>{const k=Math.min(1,1000/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',.6))};i.onerror=()=>{alert('Could not read image');no()};i.src=URL.createObjectURL(f)});
const fdate = d => d ? new Date(d + 'T00:00:00Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '';
const initials = n => String(n || '').replace(/^(dr|mr|mrs|ms)\.?\s+/i, '').split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
const download = (name, text, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); };
