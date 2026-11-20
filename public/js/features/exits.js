// Permanent leave (a sub-section of the Leave tab): record a student leaving for good; refund per the SOP.
(() => {
  const q = s => document.querySelector(s);
  const inr = n => '\u20B9' + Number(n || 0).toLocaleString('en-IN');
  const fd = d => d ? new Date(d + 'T00:00:00Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '-';
  const say = m => { if (typeof toast === 'function') toast(m); };
  const ST = { 'Under process': 'x1', 'Approved': 'x2', 'Refunded': 'x3' };
  // same rule as the server and the SOP: <=10 days I, 11-45 days II, >45 days III
  const calc = (al, ap, fee, mo) => {
    if (!al || !ap) return null;
    const days = Math.round((Date.parse(ap + 'T00:00:00Z') - Date.parse(al + 'T00:00:00Z')) / 864e5);
    if (days < 0) return { err: 'Application date is before the allotment date.' };
    const cat = days <= 10 ? 'I' : days <= 45 ? 'II' : 'III', processing = cat === 'III' ? 0 : 1000, deduction = cat === 'II' ? 2 * mo : 0;
    return { days, category: cat, processing, deduction, refund: cat === 'III' ? 0 : Math.max(0, fee - processing - deduction) };
  };
  const table = (c, fee) => `<table class="rt"><tr><td>Hostel fee paid</td><td>${inr(fee)}</td></tr>${c.category === 'III' ? '<tr><td>No refund of hostel fee (after 45 days)</td><td>\u2212 ' + inr(fee) + '</td></tr>' : `<tr><td>Processing fee</td><td>\u2212 ${inr(c.processing)}</td></tr>${c.category === 'II' ? `<tr><td>Two months' hostel charge</td><td>\u2212 ${inr(c.deduction)}</td></tr>` : ''}`}<tr class="tot"><td>Refundable hostel fee</td><td>${inr(c.refund)}</td></tr></table>`;

  const chk = (p, o) => `<div class="chk">${[['appRcvd', 'Withdrawal application'], ['receipt', 'Fee receipt copy'], ['noDues', 'No Dues Certificate'], ['bank', 'Bank account details']].map(([k, t]) => `<label><input type="checkbox" id="${p}${k}" ${o && o[k] ? 'checked' : ''}>${t}</label>`).join('')}</div>`;
  const item = e => `<details class="cmp" ${e.id === window.XOPEN ? 'open' : ''}><summary><span class="cno">${E(e.roll.startsWith('TMP-') ? '-' : e.roll)}</span><span class="cin"><b>${E(e.room || '-')} \u00B7 ${E(e.name)}</b><small>Left ${fd(e.exitDate)}, Category ${e.category}, refund ${inr(e.refund)}</small></span><span class="tag ${ST[e.status] || 'x1'}">${E(e.status)}</span></summary>
<div class="cbody"><div><h4>Refund calculation (SOP Category ${e.category}, ${e.days} days after allotment)</h4>${table(e, e.feePaid)}<p class="mu">Allotment ${fd(e.allotDate)}, application received ${fd(e.appDate)}, vacated ${fd(e.exitDate)}. Security deposit is refunded separately after a valid No Dues Certificate.</p></div>
<div><h4>Reason</h4><p>${e.reason ? E(e.reason) : '<span class="mu">Not recorded.</span>'}</p></div>
<div><h4>Withdrawal application</h4>${e.image ? `<a href="${up(e.image)}" target="_blank"><img class="cimg" loading="lazy" src="${up(e.image)}" alt="Application"></a>` : '<p class="mu">No photo attached.</p>'}</div>
<div class="res" data-edit="exits:write"><h4>Process</h4>${chk('k_' + e.id + '_', e)}<div class="row"><label class="fl">Status<select id="s_${e.id}">${['Under process', 'Approved', 'Refunded'].map(s => `<option ${e.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label><label class="fl">Refund paid on<input type="date" id="d_${e.id}" value="${e.refundDate || ''}"></label></div>
<div class="row"><label class="fl">Hostel fee paid (\u20B9)<input id="f_${e.id}" inputmode="numeric" value="${e.feePaid}"></label><label class="fl">Monthly hostel charge (\u20B9)<input id="m_${e.id}" inputmode="numeric" value="${e.monthly}"></label></div>
<textarea id="r_${e.id}" rows="2" placeholder="Remarks">${E(e.remarks || '')}</textarea><div class="row" style="margin:10px 0 0"><button class="btn" onclick="saveExit('${e.id}')">Save</button><button class="btn ghost" onclick="undoExit('${e.id}')">Undo (re-admit student)</button></div></div></div></details>`;

  window.exitView = async function () {
    const [ex, fees] = await Promise.all([api('/api/exits'), api('/api/fees')]);
    window.EXFEES = fees; window.XIMG = ''; window.XMAN = false;
    q('#main').innerHTML = leaveSwitch('exit') + `<div class="card" data-need="exits:write"><b>Record permanent leaving</b><p class="mu" style="margin:6px 0 12px">Use this when a student vacates the hostel for good. He is removed from attendance, fees and hostel counts, and the refund is worked out as per the refund SOP.</p>
<div class="row"><label class="fl">Student<select id="xr" onchange="xPick()">${opts()}</select></label></div>
<div class="row"><label class="fl">Hostel allotment date<input id="xa" type="date" oninput="xCalc()"></label><label class="fl">Withdrawal application received on<input id="xp" type="date" value="${today()}" oninput="xCalc()"></label><label class="fl">Vacating date<input id="xv" type="date" value="${today()}"></label></div>
<textarea id="xt" rows="2" placeholder="Reason for leaving"></textarea><p class="mu">Withdrawal application photo (optional). Take a live photo or upload one.</p><input id="xi" type="file" accept="image/*"><br><br>
<div class="row"><label class="fl">Hostel fee paid (\u20B9)<input id="xf" inputmode="numeric" oninput="xCalc()"></label><label class="fl">Monthly hostel charge (\u20B9)<input id="xm" inputmode="numeric" oninput="xCalc(1)"></label></div>
<p class="mu">The monthly charge is filled as fee paid divided by 6 (six months a semester). Change it if the Institute's monthly charge is different.</p>
<b style="font-size:13.5px">Documents received</b>${chk('x_', { appRcvd: false })}<div id="xprev"></div>
<div class="row" style="margin-top:12px"><button class="btn" onclick="addExit()">Record permanent leaving</button><a class="btn ghost" style="text-decoration:none;display:inline-grid;place-items:center" href="/hostel-refund-sop.pdf" target="_blank" rel="noopener">View refund SOP</a></div></div>
<div class="card"><div class="cth"><b>Students who have left</b><span>${ex.length} total</span></div>${ex.length ? ex.map(item).join('') : '<p class="empty">No student has left the hostel yet.</p>'}</div>`;
    photoBox('#xi', 'XIMG', 'environment');
    xPick();
  };
  window.xPick = () => {
    const r = q('#xr').value, s = S.find(x => x.roll == r) || {}, f = (window.EXFEES || []).filter(x => x.roll == r && x.amount).sort((a, b) => b.sem - a.sem)[0];
    q('#xa').value = s.allotDate || ''; q('#xf').value = f ? f.amount : ''; window.XMAN = false; xCalc();
  };
  window.xCalc = manual => {
    if (manual) window.XMAN = true;
    const fee = +q('#xf').value || 0; if (!window.XMAN) q('#xm').value = fee ? Math.round(fee / 6) : '';
    const c = calc(q('#xa').value, q('#xp').value, fee, +q('#xm').value || 0);
    q('#xprev').innerHTML = !c ? '<p class="mu">Enter the allotment and application dates to see the refund category.</p>' : c.err ? `<p class="red">${c.err}</p>` : `<div class="res"><b>Category ${c.category}</b> <span class="mu">(${c.days} days after allotment)</span>${table(c, fee)}<p class="mu" style="margin:0">Security deposit / caution money is refunded separately after a valid No Dues Certificate.</p></div>`;
  };
  window.addExit = async () => {
    const r = q('#xr').value, s = S.find(x => x.roll == r); if (!s) return alert('Choose a student');
    if (!q('#xa').value) return alert('Hostel allotment date is required (it decides the refund category)');
    if (!confirm('Record permanent leaving of ' + s.name + '? He will be removed from the active hostel list (attendance, fees and counts). You can undo this from the list below.')) return;
    const j = await api('/api/exits', { method: 'POST', body: { roll: r, allotDate: q('#xa').value, appDate: q('#xp').value, exitDate: q('#xv').value, reason: q('#xt').value, image: window.XIMG || '', feePaid: q('#xf').value, monthly: q('#xm').value, ...Object.fromEntries(['appRcvd', 'receipt', 'noDues', 'bank'].map(k => [k, q('#x_' + k).checked])) } });
    window.XOPEN = j.id; say('Recorded. Category ' + j.category + ', refund ' + inr(j.refund)); S = await api('/api/students'); V.leave();
  };
  window.saveExit = async id => {
    await api('/api/exits/' + id, { method: 'POST', body: { status: q('#s_' + id).value, refundDate: q('#d_' + id).value, feePaid: q('#f_' + id).value, monthly: q('#m_' + id).value, remarks: q('#r_' + id).value, ...Object.fromEntries(['appRcvd', 'receipt', 'noDues', 'bank'].map(k => [k, q('#k_' + id + '_' + k).checked])) } });
    window.XOPEN = id; say('Saved'); V.leave();
  };
  window.undoExit = async id => {
    const e = (await api('/api/exits')).find(x => x.id === id); if (!e || !confirm('Re-admit ' + e.name + '? This cancels the permanent leaving record and puts the student back on the active list.')) return;
    await api('/api/exits/' + id, { method: 'DELETE' }); window.XOPEN = ''; say('Student re-admitted'); S = await api('/api/students'); V.leave();
  };
})();
