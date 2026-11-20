// Leave tab: two sub-sections - Temporary leave (this file) and Permanent leave (exits.js).
const tempLeaveView = async function(){const l=await api('/api/leaves'),sel=window.LR||'';window.LR='';$('#main').innerHTML=`<div class="card" data-need="leaves:write"><b>New leave</b><div class="row" style="margin-top:8px"><select id="lr">${opts(sel)}</select><input id="lf" type="date" value="${today()}"><input id="lt" type="date" title="To (optional)"></div><textarea id="lx" rows=2 placeholder="Short reason"></textarea><p class="mu">Application photo (mandatory) – on phone this opens the camera:</p><input id="li" type="file" accept="image/*" capture="environment"><br><br><button class="btn" onclick="addLeave()">Save leave</button></div><div class="card tbl"><table><tr><th>Room</th><th>Name</th><th>From</th><th>To</th><th>Reason</th><th>Status</th><th>App</th><th></th></tr>${l.map(x=>`<tr><td>${sRoom(x.roll)}</td><td>${sName(x.roll)}</td><td>${x.from}</td><td>${x.to||'-'}</td><td style="white-space:normal">${E(x.reason)}</td><td><span class="tag ${x.status=='On Leave'?'Leave':'In'}">${x.status}${x.returned?' '+x.returned:''}</span></td><td><a target=_blank href="${up(x.image)}">view</a></td><td>${x.status=='On Leave'?`<button class="btn sm ok" data-need="leaves:write" onclick="ret('${x.id}')">Returned</button>`:''}</td></tr>`).join('')}</table></div>`
};
window.leaveSwitch = cur => `<div class="subtabs">${[['apps', 'Applications'], ['', 'Temporary leave'], ['exit', 'Permanent leave']].map(([v, t]) => `<button class="${cur === v ? 'on' : ''}" onclick="LSUB='${v}';V.leave()">${t}${v === 'apps' && PEND.leaves ? ` <i class="bdg" style="position:static">${PEND.leaves}</i>` : ''}</button>`).join('')}</div>`;
V.leave = async function () {
  if (window.LSUB === undefined) window.LSUB = PEND.leaves ? 'apps' : '';   // open on Applications when something is waiting
  if (window.LSUB === 'exit') return exitView();
  if (window.LSUB === 'apps') return appsView();
  await tempLeaveView();
  $('#main').insertAdjacentHTML('afterbegin', leaveSwitch(''));
  photoBox('#li', 'LEAVEIMG', 'environment', 'Application photo (mandatory). Take a live photo or upload one.');
};
function quickLeave(r) { window.LR = r; window.LSUB = ''; go('leave'); }
async function addLeave() {
  if (!window.LEAVEIMG) return alert('Application image is mandatory. Take a photo or upload one.');
  await api('/api/leaves', { method: 'POST', body: { roll: $('#lr').value, from: $('#lf').value, to: $('#lt').value, reason: $('#lx').value, image: window.LEAVEIMG } });
  toast('Leave saved'); V.leave();
}
async function ret(id){await api('/api/leaves/'+id+'/return',{method:'POST',body:{}});go(tab)}

// ---- Applications: leave requests made by students, waiting for the warden's decision ----
const LEAVE_TAG = { Pending: 'Prog', Approved: 'Done', Rejected: 'Open', Cancelled: 'x2' };
window.appsView = async function () {
  window.LAF = window.LAF || { s: 'Pending', q: '' };
  const all = (await api('/api/leaves')).filter(x => x.source === 'resident'); window.LAPPS = all;
  $('#main').innerHTML = leaveSwitch('apps') + `<div class="card"><div class="cth"><b>Leave applications from students</b><span id="lcount"></span></div>
<div class="row"><select aria-label="Status" onchange="LAF.s=this.value;drawApps()">${['Pending', 'Approved', 'Rejected', 'Cancelled', ''].map(s => `<option value="${s}" ${LAF.s === s ? 'selected' : ''}>${s || 'All'}</option>`).join('')}</select><input placeholder="Search number, name, room" value="${E(LAF.q)}" oninput="LAF.q=this.value;drawApps()"></div><div id="lapps"></div></div>`;
  drawApps(window.LOPEN);
};
window.drawApps = open => {
  const f = window.LAF, t = f.q.toLowerCase(), all = window.LAPPS || [];
  const L = all.filter(x => (!f.s || x.approval === f.s) && (!t || [x.no, x.roll, sName(x.roll), sRoom(x.roll), x.reason].join(' ').toLowerCase().includes(t)));
  $('#lcount').textContent = L.length + ' of ' + all.length;
  $('#lapps').innerHTML = L.length ? L.map(x => `<details class="cmp" ${x.id === open ? 'open' : ''}><summary><span class="cno">${E(x.no || '-')}</span><span class="cin"><b>${E(sRoom(x.roll))} \u00B7 ${sName(x.roll)}</b><small>${fdate(x.from)} to ${fdate(x.to)}, ${E(x.reason.slice(0, 80))}</small></span><span class="tag ${LEAVE_TAG[x.approval] || 'x2'}">${E(x.approval)}</span></summary>
<div class="cbody"><div><h4>Reason</h4><p>${E(x.reason)}</p></div>${x.image ? `<div><h4>Photo</h4><a href="${up(x.image)}" target="_blank"><img class="cimg" loading="lazy" src="${up(x.image)}" alt="Application photo"></a></div>` : ''}
${x.approval === 'Pending' ? `<div class="res" data-edit="leaves:write"><h4>Decision</h4><textarea id="rm_${x.id}" rows="2" placeholder="Remark for the student (optional)"></textarea><div class="row" style="margin:10px 0 0"><button class="btn" onclick="decideLeave('${x.id}','approve')">Approve</button><button class="btn ghost" onclick="decideLeave('${x.id}','reject')">Reject</button></div></div>` : `<div><h4>Decision</h4><p>${E(x.approval)}${x.remark ? ': ' + E(x.remark) : ''}</p></div>`}</div></details>`).join('') : '<p class="empty">No applications here.</p>';
};
async function decideLeave(id, act) {
  await api('/api/leaves/' + id + '/' + act, { method: 'POST', body: { remark: $('#rm_' + id).value } });
  toast(act === 'approve' ? 'Leave approved' : 'Leave rejected'); window.LOPEN = ''; await V.leave(); refreshBadges();
}
