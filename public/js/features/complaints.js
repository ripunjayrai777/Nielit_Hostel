// Complaints: number, date, optional photo; open one to see the photo and set status + resolution.
(() => {
  const q = s => document.querySelector(s);
  const SC = { 'Open': 'Open', 'In Progress': 'Prog', 'Resolved': 'Done' };
  const fd = d => d ? new Date(d + 'T00:00:00Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '';
  const say = m => { if (typeof toast === 'function') toast(m); };
  const item = (c, open) => `<details class="cmp" ${c.id === open ? 'open' : ''}><summary><span class="cno">${E(c.no || '-')}</span><span class="cin"><b>${E(sRoom(c.roll))} · ${sName(c.roll)}</b><small>${fd(c.date)}, ${E((c.text || '').slice(0, 90))}</small></span><span class="tag ${SC[c.status] || 'Open'}">${E(c.status)}</span></summary>
<div class="cbody"><div><h4>Complaint details</h4><p>${E(c.text)}</p></div>
<div><h4>Application photo</h4>${c.image ? `<a href="${up(c.image)}" target="_blank"><img class="cimg" loading="lazy" src="${up(c.image)}" alt="Application photo"></a>` : '<p class="mu">No photo attached.</p>'}</div>
<div class="res" data-edit="complaints:write"><h4>Resolution</h4><div class="row"><select id="cs_${c.id}" aria-label="Status">${['Open', 'In Progress', 'Resolved'].map(s => `<option ${c.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select><input type="date" id="cr_${c.id}" value="${c.resolved || today()}" aria-label="Resolved on"></div>
<textarea id="cn_${c.id}" rows="3" placeholder="Resolution description / action taken">${E(c.note || '')}</textarea><p class="mu" style="margin:6px 0 10px">The date is used when status is Resolved.${c.resolved ? ' Resolved on ' + fd(c.resolved) + '.' : ''}</p><button class="btn" onclick="saveComp('${c.id}')">Save</button></div></div></details>`;
  function draw(open) {
    const f = window.CF2, t = (f.q || '').toLowerCase(), all = window.CMP || [];
    const L = all.filter(c => (!f.s || c.status === f.s) && (!t || [c.no, c.text, c.roll, sName(c.roll), sRoom(c.roll)].join(' ').toLowerCase().includes(t)));
    q('#cl').innerHTML = L.length ? L.map(c => item(c, open)).join('') : '<p class="empty">No complaints found.</p>';
    q('#ccount').textContent = L.length + ' of ' + all.length;
  }
  window.drawCmp = () => draw();
  V.comp = async function (open) {
    const c = await api('/api/complaints'); window.CMP = c; window.CMPIMG = ''; const f = window.CF2 = window.CF2 || { s: '', q: '' };
    q('#main').innerHTML = `<div class="card" data-need="complaints:write"><b>Register complaint</b><div class="row" style="margin-top:8px"><select id="cr" aria-label="Student">${opts()}</select><input id="cd" type="date" value="${today()}" aria-label="Complaint date"></div>
<textarea id="ct" rows="3" placeholder="Complaint details"></textarea><p class="mu">Application photo (optional). Take a live photo or upload one.</p><input id="ci" type="file" accept="image/*"><br><br>
<button class="btn" onclick="addComp()">Register complaint</button><p class="mu" style="margin-top:8px">A unique complaint number is generated automatically.</p></div>
<div class="card"><div class="cth"><b>All complaints</b><span id="ccount"></span></div><div class="row"><select id="cfs" onchange="CF2.s=this.value;drawCmp()" aria-label="Filter by status"><option value="">All statuses</option>${['Open', 'In Progress', 'Resolved'].map(s => `<option ${f.s === s ? 'selected' : ''}>${s}</option>`).join('')}</select><input id="cfq" placeholder="Search number, name, room" value="${E(f.q)}" oninput="CF2.q=this.value;drawCmp()"></div><div id="cl"></div></div>`;
    draw(open);
    photoBox('#ci', 'CMPIMG', 'environment');
  };
  window.addComp = async () => {
    if (!q('#ct').value.trim()) return alert('Complaint details are required');
    const j = await api('/api/complaints', { method: 'POST', body: { roll: q('#cr').value, text: q('#ct').value, date: q('#cd').value, image: window.CMPIMG || '' } });
    say('Registered ' + j.no); V.comp(j.id);
  };
  window.saveComp = async id => {
    await api('/api/complaints/' + id, { method: 'POST', body: { status: q('#cs_' + id).value, note: q('#cn_' + id).value, resolved: q('#cr_' + id).value } });
    say('Complaint updated'); V.comp(id);
  };
})();
