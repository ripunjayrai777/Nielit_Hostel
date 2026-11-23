// Accounts: the warden checks the ID card photo and approves / rejects resident and guard accounts.
(() => {
  const TAG = { Pending: 'Prog', Approved: 'Done', Rejected: 'Open', Disabled: 'x2' };
  let list = [], f = { s: 'Pending', t: '', q: '' };
  const card = a => { const st = S.find(x => x.roll === a.id), btn = (t, act, cls = 'btn ghost') => `<button class="${cls}" onclick="accAct('${a.id}','${act}')">${t}</button>`;
    return `<details class="cmp" ${a.id === window.AOPEN ? 'open' : ''}><summary><span class="cno">${a.type === 'guard' ? 'Guard' : 'Resident'}</span><span class="cin"><b>${E(a.name)}</b><small>${E(a.id)}${a.room ? ', room ' + E(a.room) : ''}, applied ${fdate((a.created || '').slice(0, 10))}</small></span><span class="tag ${TAG[a.status] || 'x2'}">${E(a.status)}</span></summary>
<div class="cbody"><div class="idpair"><figure><img src="${up(a.idImage)}" loading="lazy" alt="ID card"><figcaption>ID card photo taken at sign-up</figcaption></figure>${(a.photo || (st && st.photo)) ? `<figure><img src="${up(a.photo || st.photo)}" loading="lazy" alt="Profile photo"><figcaption>Profile photo on record</figcaption></figure>` : ''}</div>
${a.mobile ? `<p>Mobile: ${E(a.mobile)}</p>` : ''}${a.remark ? `<p class="mu">Remark: ${E(a.remark)}</p>` : ''}
<div class="res" data-edit="accounts:write"><textarea id="ar_${a.id}" rows="2" placeholder="Remark (shown to the person if rejected)"></textarea><div class="row" style="margin:10px 0 0">${a.status === 'Pending' ? btn('Approve', 'approve', 'btn') + btn('Reject', 'reject') : a.status === 'Approved' ? btn('Disable', 'disable') + btn('Reset password', 'reset') : a.status === 'Rejected' ? btn('Approve anyway', 'approve', 'btn') : btn('Enable', 'enable', 'btn') + btn('Reset password', 'reset')}</div></div></div></details>`; };
  const draw = () => {
    const t = f.q.toLowerCase(), L = list.filter(a => (!f.s || a.status === f.s) && (!f.t || a.type === f.t) && (!t || (a.name + ' ' + a.id + ' ' + (a.room || '')).toLowerCase().includes(t)));
    $('#acount').textContent = L.length + ' of ' + list.length; $('#alist').innerHTML = L.length ? L.map(card).join('') : '<p class="empty">No accounts here.</p>';
  };
  window.drawAccounts = draw;
  V.accounts = async function () {
    list = await api('/api/accounts');
    $('#main').innerHTML = `<div class="card"><div class="cth"><b>Resident and guard accounts</b><span id="acount"></span></div><p class="mu" style="margin:0 0 10px">People create their own account with a live photo of their ID card. Compare it with the person, then approve. Nobody can log in before approval.</p>
<div class="row"><select aria-label="Status" onchange="ACF('s',this.value)">${['Pending', 'Approved', 'Rejected', 'Disabled', ''].map(s => `<option value="${s}" ${f.s === s ? 'selected' : ''}>${s || 'All statuses'}</option>`).join('')}</select><select aria-label="Type" onchange="ACF('t',this.value)">${[['', 'Residents and guards'], ['resident', 'Residents'], ['guard', 'Guards']].map(([v, t]) => `<option value="${v}" ${f.t === v ? 'selected' : ''}>${t}</option>`).join('')}</select><input placeholder="Search name, roll, room" value="${E(f.q)}" oninput="ACF('q',this.value)"></div><div id="alist"></div></div>`;
    draw();
  };
  window.ACF = (k, v) => { f[k] = v; draw(); };
  window.accAct = async (id, act) => {
    if (act === 'reset') { const pw = prompt('New password for this person (6 or more characters). Tell it to them in person.'); if (!pw) return; await api('/api/accounts/' + id + '/reset', { method: 'POST', body: { password: pw } }); return toast('Password changed'); }
    const r = $('#ar_' + id); await api('/api/accounts/' + id + '/' + act, { method: 'POST', body: { remark: r ? r.value : '' } });
    window.AOPEN = ''; toast({ approve: 'Account approved', reject: 'Registration rejected', disable: 'Account disabled', enable: 'Account enabled' }[act]); await V.accounts(); refreshBadges();
  };
})();
