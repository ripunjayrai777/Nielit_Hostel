// // Resident screens: my home, apply for leave, raise an issue (everything shows only the student's own data).
// (() => {
//   const TAG = { Pending: 'Prog', Approved: 'Done', Rejected: 'Open', Cancelled: 'x2', Open: 'Open', 'In Progress': 'Prog', Resolved: 'Done' };
//   const leaveRow = l => `<div class="note" style="margin:0 0 8px"><span class="cno">${E(l.no || '-')}</span> <span class="tag ${TAG[l.approval] || 'x2'}">${E(l.approval === 'Approved' ? l.status : l.approval)}</span><br>${fdate(l.from)} to ${fdate(l.to) || 'open'}<br><span class="mu">${E(l.reason)}</span>${l.remark ? `<br><b>Warden:</b> ${E(l.remark)}` : ''}${l.approval === 'Pending' ? `<br><button class="btn ghost sm" style="margin-top:8px" onclick="cancelLeave('${l.id}')">Cancel application</button>` : ''}</div>`;
//   const issueRow = c => `<details class="cmp" ${c.id === window.MYCOPEN ? 'open' : ''}><summary><span class="cno">${E(c.no)}</span><span class="cin"><b>${fdate(c.date)}</b><small>${E(c.text.slice(0, 90))}</small></span><span class="tag ${TAG[c.status] || 'Open'}">${E(c.status)}</span></summary><div class="cbody"><div><h4>My application</h4><p>${E(c.text)}</p></div>${c.image ? `<div><h4>Photo</h4><a href="${up(c.image)}" target="_blank"><img class="cimg" loading="lazy" src="${up(c.image)}" alt="Attached photo"></a></div>` : ''}<div><h4>Status</h4><p><b>${E(c.status)}</b>${c.resolved ? ' on ' + fdate(c.resolved) : ''}</p>${c.note ? `<div class="note">${E(c.note)}</div>` : '<p class="mu">No update from the warden yet.</p>'}</div></div></details>`;

//   V.myhome = async function () {
//     const [p, lv, cm] = await Promise.all([api('/api/my/profile'), api('/api/my/leaves'), api('/api/my/complaints')]), open = cm.filter(c => c.status !== 'Resolved').length;
//     $('#main').innerHTML = `<div class="card"><div class="me">${p.photo ? `<img src="${up(p.photo)}" alt="">` : `<div class="avt">${E(initials(p.name))}</div>`}<div><h2>${E(p.name)}</h2><p>${E(p.roll)}</p><span class="stat-banner ${p.status === 'In Hostel' ? 'in' : 'out'}">${E(p.status)}</span></div></div>
// <div class="kv"><div><span>Room</span><b>${E(p.room || 'Not allotted yet')}</b></div><div><span>Batch</span><b>${E(p.batch || '-')}</b></div><div><span>Branch</span><b>${E(p.branch || '-')}</b></div><div><span>Allotted on</span><b>${fdate(p.allotDate) || '-'}</b></div></div></div>
// <div class="card"><div class="cth"><b>My leave</b><span><a href="#" onclick="go('myleave');return false">Apply for leave</a></span></div>${lv.slice(0, 3).map(leaveRow).join('') || '<p class="mu">You have not applied for any leave yet.</p>'}</div>
// <div class="card"><div class="cth"><b>My issues</b><span><a href="#" onclick="go('mycomp');return false">Raise an issue</a></span></div><p class="mu" style="margin:0">${open ? open + ' issue' + (open > 1 ? 's are' : ' is') + ' still open.' : 'No open issues.'}</p>${cm.slice(0, 2).map(issueRow).join('')}</div>
// <div class="card"><b>Change password</b><div class="row" style="margin-top:10px"><input id="pw_o" type="password" placeholder="Current password" autocomplete="current-password"><input id="pw_n" type="password" placeholder="New password (6+ characters)" autocomplete="new-password"><button class="btn" onclick="changePw()">Change</button></div></div>`;
//   };
//   window.changePw = async () => { await api('/api/my/password', { method: 'POST', body: { oldPassword: $('#pw_o').value, newPassword: $('#pw_n').value } }); $('#pw_o').value = $('#pw_n').value = ''; toast('Password changed'); };

//   V.myleave = async function () {
//     const lv = await api('/api/my/leaves');
//     $('#main').innerHTML = `<div class="card"><b>Apply for leave</b><div class="row" style="margin-top:10px"><label class="fl">From<input id="ml_f" type="date" min="${today()}" value="${today()}"></label><label class="fl">To<input id="ml_t" type="date" min="${today()}" value="${today()}"></label></div>
// <textarea id="ml_r" rows="3" placeholder="Reason for leave: where are you going and why?"></textarea><p class="mu">Application photo (optional)</p><input id="ml_i" type="file" accept="image/*"><br><br>
// <button class="btn" onclick="applyLeave()">Submit application</button><p class="mu" style="margin-top:8px">You get an application number. The warden approves or rejects it, and the guard can see approved leaves at the gate.</p></div>
// <div class="card"><b>My applications</b><div style="margin-top:10px">${lv.map(leaveRow).join('') || '<p class="mu">No applications yet.</p>'}</div></div>`;
//     photoBox('#ml_i', 'MYLIMG', 'environment');
//   };
//   window.applyLeave = async () => {
//     const f = $('#ml_f').value, t = $('#ml_t').value, r = $('#ml_r').value.trim();
//     if (!f || !t) return alert('Choose the From and To dates'); if (t < f) return alert('To date cannot be before From date'); if (r.length < 5) return alert('Please write the reason for leave');
//     const j = await api('/api/my/leaves', { method: 'POST', body: { from: f, to: t, reason: r, image: window.MYLIMG || '' } });
//     toast('Submitted. Application ' + j.no); await V.myleave();
//   };
//   window.cancelLeave = async id => { if (!confirm('Cancel this application?')) return; await api('/api/my/leaves/' + id + '/cancel', { method: 'POST', body: {} }); toast('Application cancelled'); await V[tab](); };

//   V.mycomp = async function (open) {
//     const cm = await api('/api/my/complaints');
//     $('#main').innerHTML = `<div class="card"><b>Raise an issue</b><p class="mu" style="margin:6px 0 10px">Write your application clearly: what is the problem, where, and since when.</p>
// <textarea id="mc_t" rows="5" placeholder="My application: ..." oninput="$('#mc_n').textContent=this.value.trim().length+' characters (at least 15)'"></textarea><div class="cnt" id="mc_n">0 characters (at least 15)</div>
// <p class="mu">Photo (optional)</p><input id="mc_i" type="file" accept="image/*"><br><br><button class="btn" onclick="raiseIssue()">Submit issue</button><p class="mu" style="margin-top:8px">You get a unique issue number and can follow its status below.</p></div>
// <div class="card"><b>My issues</b><div style="margin-top:6px">${cm.map(issueRow).join('') || '<p class="mu">No issues raised yet.</p>'}</div></div>`;
//     photoBox('#mc_i', 'MYCIMG', 'environment');
//   };
//   window.raiseIssue = async () => {
//     const t = $('#mc_t').value.trim(); if (t.length < 15) return alert('Please write your application in detail (at least 15 characters)');
//     const j = await api('/api/my/complaints', { method: 'POST', body: { text: t, image: window.MYCIMG || '' } });
//     window.MYCOPEN = j.id; toast('Submitted. Issue number ' + j.no); await V.mycomp();
//   };
// })();



// Resident screens: my home, apply for leave, raise an issue (everything shows only the student's own data).
(() => {
  const TAG = { Pending: 'Prog', Approved: 'Done', Rejected: 'Open', Cancelled: 'x2', Open: 'Open', 'In Progress': 'Prog', Resolved: 'Done' };
  const leaveRow = l => `<div class="note" style="margin:0 0 8px"><span class="cno">${E(l.no || '-')}</span> <span class="tag ${TAG[l.approval] || 'x2'}">${E(l.approval === 'Approved' ? l.status : l.approval)}</span><br>${fdate(l.from)} to ${fdate(l.to) || 'open'}<br><span class="mu">${E(l.reason)}</span>${l.remark ? `<br><b>Warden:</b> ${E(l.remark)}` : ''}${l.approval === 'Pending' ? `<br><button class="btn ghost sm" style="margin-top:8px" onclick="cancelLeave('${l.id}')">Cancel application</button>` : ''}</div>`;
  const issueRow = c => `<details class="cmp" ${c.id === window.MYCOPEN ? 'open' : ''}><summary><span class="cno">${E(c.no)}</span><span class="cin"><b>${fdate(c.date)}</b><small>${E(c.text.slice(0, 90))}</small></span><span class="tag ${TAG[c.status] || 'Open'}">${E(c.status)}</span></summary><div class="cbody"><div><h4>My application</h4><p>${E(c.text)}</p></div>${c.image ? `<div><h4>Photo</h4><a href="${up(c.image)}" target="_blank"><img class="cimg" loading="lazy" src="${up(c.image)}" alt="Attached photo"></a></div>` : ''}<div><h4>Status</h4><p><b>${E(c.status)}</b>${c.resolved ? ' on ' + fdate(c.resolved) : ''}</p>${c.note ? `<div class="note">${E(c.note)}</div>` : '<p class="mu">No update from the warden yet.</p>'}</div></div></details>`;

  V.myhome = async function () {
    const [p, lv, cm] = await Promise.all([api('/api/my/profile'), api('/api/my/leaves'), api('/api/my/complaints')]), open = cm.filter(c => c.status !== 'Resolved').length;
    $('#main').innerHTML = `<div class="card"><div class="me">${p.photo ? `<img src="${up(p.photo)}" alt="">` : `<div class="avt">${E(initials(p.name))}</div>`}<div><h2>${E(p.name)}</h2><p>${E(p.roll)}</p><span class="stat-banner ${p.status === 'In Hostel' ? 'in' : 'out'}">${E(p.status)}</span></div></div>
<div class="kv"><div><span>Room</span><b>${E(p.room || 'Not allotted yet')}</b></div><div><span>Batch</span><b>${E(p.batch || '-')}</b></div><div><span>Branch</span><b>${E(p.branch || '-')}</b></div><div><span>Allotted on</span><b>${fdate(p.allotDate) || '-'}</b></div></div></div>
<div class="card"><div class="cth"><b>My leave</b><span><a href="#" onclick="go('myleave');return false">Apply for leave</a></span></div>${lv.slice(0, 3).map(leaveRow).join('') || '<p class="mu">You have not applied for any leave yet.</p>'}</div>
<div class="card"><div class="cth"><b>My issues</b><span><a href="#" onclick="go('mycomp');return false">Raise an issue</a></span></div><p class="mu" style="margin:0">${open ? open + ' issue' + (open > 1 ? 's are' : ' is') + ' still open.' : 'No open issues.'}</p>${cm.slice(0, 2).map(issueRow).join('')}</div>
<div class="card"><b>Change password</b><div class="row" style="margin-top:10px"><input id="pw_o" type="password" placeholder="Current password" autocomplete="current-password"><input id="pw_n" type="password" placeholder="New password (6+ characters)" autocomplete="new-password"><button class="btn" onclick="changePw()">Change</button></div></div>`;
  };
  window.changePw = async () => { await api('/api/my/password', { method: 'POST', body: { oldPassword: $('#pw_o').value, newPassword: $('#pw_n').value } }); $('#pw_o').value = $('#pw_n').value = ''; toast('Password changed'); };

  V.myleave = async function () {
    const lv = await api('/api/my/leaves');
    $('#main').innerHTML = `<div class="card"><b>Apply for leave</b><div class="row" style="margin-top:10px"><label class="fl">From<input id="ml_f" type="date" min="${today()}" value="${today()}"></label><label class="fl">To<input id="ml_t" type="date" min="${today()}" value="${today()}"></label></div>
<textarea id="ml_r" rows="3" placeholder="Reason for leave: where are you going and why?"></textarea><p class="mu">Application photo (mandatory)</p><input id="ml_i" type="file" accept="image/*"><br><br>
<button class="btn" onclick="applyLeave()">Submit application</button><p class="mu" style="margin-top:8px">You get an application number. The warden approves or rejects it, and the guard can see approved leaves at the gate.</p></div>
<div class="card"><b>My applications</b><div style="margin-top:10px">${lv.map(leaveRow).join('') || '<p class="mu">No applications yet.</p>'}</div></div>`;
    photoBox('#ml_i', 'MYLIMG', 'environment', 'Photo of your written leave application (mandatory). Take a photo or upload one.');
  };
  window.applyLeave = async () => {
    const f = $('#ml_f').value, t = $('#ml_t').value, r = $('#ml_r').value.trim();
    if (!f || !t) return alert('Choose the From and To dates'); if (t < f) return alert('To date cannot be before From date'); if (r.length < 5) return alert('Please write the reason for leave'); if (!window.MYLIMG) return alert('A photo of your leave application is mandatory');
    const j = await api('/api/my/leaves', { method: 'POST', body: { from: f, to: t, reason: r, image: window.MYLIMG || '' } });
    toast('Submitted. Application ' + j.no); await V.myleave();
  };
  window.cancelLeave = async id => { if (!confirm('Cancel this application?')) return; await api('/api/my/leaves/' + id + '/cancel', { method: 'POST', body: {} }); toast('Application cancelled'); await V[tab](); };

  V.mycomp = async function (open) {
    const cm = await api('/api/my/complaints');
    $('#main').innerHTML = `<div class="card"><b>Raise an issue</b><p class="mu" style="margin:6px 0 10px">Write your application clearly: what is the problem, where, and since when.</p>
<textarea id="mc_t" rows="5" placeholder="My application: ..." oninput="$('#mc_n').textContent=this.value.trim().length+' characters (at least 15)'"></textarea><div class="cnt" id="mc_n">0 characters (at least 15)</div>
<p class="mu">Application photo (mandatory)</p><input id="mc_i" type="file" accept="image/*"><br><br><button class="btn" onclick="raiseIssue()">Submit issue</button><p class="mu" style="margin-top:8px">You get a unique issue number and can follow its status below.</p></div>
<div class="card"><b>My issues</b><div style="margin-top:6px">${cm.map(issueRow).join('') || '<p class="mu">No issues raised yet.</p>'}</div></div>`;
    photoBox('#mc_i', 'MYCIMG', 'environment', 'Photo of your written application (mandatory). Take a photo or upload one.');
  };
  window.raiseIssue = async () => {
    const t = $('#mc_t').value.trim(); if (t.length < 15) return alert('Please write your application in detail (at least 15 characters)'); if (!window.MYCIMG) return alert('A photo of your written application is mandatory');
    const j = await api('/api/my/complaints', { method: 'POST', body: { text: t, image: window.MYCIMG || '' } });
    window.MYCOPEN = j.id; toast('Submitted. Issue number ' + j.no); await V.mycomp();
  };
})();
