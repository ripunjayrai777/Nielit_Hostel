// Home: today's numbers, quick actions, and charts (last 14 days, batch/branch, complaints, fees).
(() => {
  const q = s => document.querySelector(s);
  const QA = '<div class="qa"><button class="btn" data-need="attendance:write" onclick="go(\'att\')">Mark today\'s attendance</button><button class="btn ghost" data-need="leaves:write" onclick="go(\'leave\')">Add leave</button><button class="btn ghost" data-need="complaints:write" onclick="go(\'comp\')">New complaint</button></div>';
  const SKEL = '<div class="cg sk" aria-hidden="true"><div class="card wide"><div class="sk-l" style="width:30%"></div><div class="sk-b"></div></div><div class="card"><div class="sk-l" style="width:50%"></div><div class="sk-l"></div><div class="sk-l"></div></div><div class="card"><div class="sk-l" style="width:40%"></div><div class="sk-l"></div></div><div class="card"><div class="sk-l" style="width:40%"></div><div class="sk-l"></div></div></div>';
  const calm = () => window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  const countUp = el => {   // the big "in hostel" number counts up from 0
    const to = +el.textContent; if (!to || calm()) return;
    const t0 = performance.now(), step = t => { const p = Math.min(1, (t - t0) / 700); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    el.textContent = 0; requestAnimationFrame(step);
  };
  let fees = [], sem = window.SEM || 1;
  const iso = (t, back) => new Date(Date.parse(t + 'T00:00:00Z') - back * 864e5).toISOString().slice(0, 10);
  const mon = d => new Date(d + 'T00:00:00Z').toLocaleString('en-IN', { month: 'short', timeZone: 'UTC' });

  function feeBody() {
    const paid = new Set(fees.filter(f => f.sem == sem).map(f => f.roll)), n = S.filter(s => paid.has(s.roll)).length, t = S.length;
    q('#fee-body').innerHTML = `<div class="big"><b>${n}</b> of ${t} paid</div><div class="gt"><i style="flex:${n} 1 0%;background:var(--ok)"></i><i style="flex:${t - n} 1 0%"></i></div><div class="mu" style="margin-top:8px">${t - n} pending${t ? ', ' + Math.round(n / t * 100) + '% collected' : ''}</div>`;
  }
  window.chartFeeSem = v => { sem = +v; window.SEM = sem; feeBody(); };

  async function charts() {
    const [lv, A, cm, fe] = await Promise.all([api('/api/leaves'), api('/api/attendance/all'), api('/api/complaints'), api('/api/fees')]);
    const sk = q('.cg.sk'); if (tab !== 'dash' || !sk || !S.length) return;
    fees = fe;
    // 1) last 14 days
    const t = today(), days = [...Array(14)].map((_, i) => iso(t, 13 - i)).map(d => {
      let l = 0, a = 0;
      S.forEach(s => { const m = (A[d] || {})[s.roll] || (lv.some(x => x.roll == s.roll && covers(x, d)) ? 'L' : 'P'); if (m === 'L') l++; else if (m === 'A') a++; });
      return { d, l, a, n: l + a };
    });
    const mx = Math.max(...days.map(x => x.n)), pk = days.find(x => x.n === mx);
    const bars = days.map(x => `<div class="bcol" title="${x.d}: ${x.l} on leave, ${x.a} absent"><span class="bn">${x.n || ''}</span><div class="stk" style="height:${mx ? x.n / mx * 86 : 0}%"><i class="a" style="flex:${x.a} 1 0%"></i><i class="l" style="flex:${x.l} 1 0%"></i></div></div>`).join('');
    const lbl = days.map((x, i) => `<span class="${x.d === t ? 'td' : ''}">${+x.d.slice(8)}<br><small>${i === 0 || x.d.slice(8) === '01' || x.d === t ? mon(x.d) : '&nbsp;'}</small></span>`).join('');
    // 2) batch and branch
    const g = {}; S.forEach(s => { const k = (s.batch || 'No batch') + ' ' + (s.branch || 'No branch'); g[k] = g[k] || { n: 0, l: 0 }; g[k].n++; if (s.status === 'On Leave') g[k].l++; });
    const gk = Object.keys(g).sort(), gm = Math.max(...gk.map(k => g[k].n));
    const grp = gk.map(k => `<div class="gr"><span class="gl">${E(k)}</span><div class="gt"><div class="gw" style="width:${g[k].n / gm * 100}%"><i style="flex:${g[k].n - g[k].l} 1 0%;background:var(--ok)"></i><i style="flex:${g[k].l} 1 0%;background:var(--wa)"></i></div></div><span class="gv">${g[k].n - g[k].l} of ${g[k].n} in</span></div>`).join('');
    // 3) complaints
    const c = { Open: 0, 'In Progress': 0, Resolved: 0 }; cm.forEach(x => { if (x.status in c) c[x.status]++; });
    const cbody = cm.length ? `<div class="gt"><i style="flex:${c.Open} 1 0%;background:var(--no)"></i><i style="flex:${c['In Progress']} 1 0%;background:var(--wa)"></i><i style="flex:${c.Resolved} 1 0%;background:var(--ok)"></i></div><div class="chips"><span class="chip A">Open ${c.Open}</span><span class="chip L">In progress ${c['In Progress']}</span><span class="chip P">Resolved ${c.Resolved}</span></div>` : '<p class="mu">No complaints recorded yet.</p>';
    sk.insertAdjacentHTML('afterend', `<div class="cg" id="cg">
<div class="card wide"><div class="ct"><b>Last 14 days</b><span>${mx ? 'Peak ' + mx + ' students on ' + (+pk.d.slice(8)) + ' ' + mon(pk.d) : 'No leave or absence in this period'}</span></div><div class="bars">${bars}</div><div class="bx">${lbl}</div><div class="lgd"><span><i style="background:var(--wa)"></i>On leave</span><span><i style="background:var(--no)"></i>Absent</span></div></div>
<div class="card"><div class="ct"><b>By batch and branch</b><span>In hostel today</span></div>${grp}<div class="lgd"><span><i style="background:var(--ok)"></i>In hostel</span><span><i style="background:var(--wa)"></i>On leave</span></div></div>
<div class="card"><div class="ct"><b>Complaints</b><span>${cm.length} total</span></div>${cbody}</div>
<div class="card"><div class="ct"><b>Hostel fee</b><select onchange="chartFeeSem(this.value)" aria-label="Semester">${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<option value="${n}" ${n == sem ? 'selected' : ''}>Semester ${n}</option>`).join('')}</select></div><div id="fee-body"></div></div></div>`);
    sk.remove(); feeBody();
    document.querySelectorAll('.bars .bcol').forEach((c, i) => c.style.setProperty('--i', i));   // staggered bar animation
  }

  V.dash = async function () {
    const l=await api('/api/leaves'),on=l.filter(x=>x.status=='On Leave').sort((a,b)=>sRoom(a.roll).localeCompare(sRoom(b.roll),undefined,{numeric:true}));
$('#main').innerHTML=`<div class="card hero"><div class="dt">${new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</div><div class="hnum"><span>${S.length-on.length}</span>in hostel today</div><div class="mu">${on.length} on leave, ${S.length} students in total</div><div class="pbar"><i style="width:${S.length?Math.round((S.length-on.length)/S.length*100):0}%"></i></div></div>${QA}${SKEL}<div class="card"><b>Students on leave</b><div class="tbl"><table><tr><th>Room</th><th>Name</th><th>From</th><th>To</th><th>Reason</th><th>App</th><th></th></tr>${on.map(x=>`<tr><td>${sRoom(x.roll)}</td><td>${sName(x.roll)}</td><td>${x.from}</td><td>${x.to||'-'}</td><td style="white-space:normal">${E(x.reason)}</td><td><a target=_blank href="${up(x.image)}">view</a></td><td><button class="btn sm ok" data-need="leaves:write" onclick="ret('${x.id}')">Returned</button></td></tr>`).join('')||'<tr><td colspan=7 class=mu>Everyone is in hostel 🎉</td></tr>'}</table></div></div>`;
    const n = q('.hero .hnum span'); if (n) countUp(n);
    try { await charts(); } catch (e) { console.error(e); }
    const sk = q('.cg.sk'); if (sk) sk.remove();
  };
})();
