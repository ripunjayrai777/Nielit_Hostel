// Guard: who has an approved leave (now / soon) and a quick search to check one student.
(() => {
  const card = (p, banner) => `<div class="gcard">${p.photo ? `<img src="${up(p.photo)}" alt="">` : `<div class="avt">${E(initials(p.name))}</div>`}<div class="gi"><b>${E(p.name)}</b><span>${E(p.roll)}, room ${E(p.room || '-')}${p.branch ? ', ' + E(p.branch) : ''}</span>${banner}</div></div>`;
  const until = l => l.to ? 'until ' + fdate(l.to) : 'until he returns';
  const nowBan = l => `<span class="gban ok">APPROVED ${E(l.no)}, ${until(l)}</span>`;
  const soonBan = l => `<span class="gban wa">Leave starts ${fdate(l.from)} (${E(l.no)})</span>`;
  V.gate = async function () {
    const j = await api('/api/gate/leaves');
    $('#main').innerHTML = `<div class="card"><b>Check a student</b><div style="margin-top:10px"><input class="gsearch" id="gq" placeholder="Name, roll number or room" oninput="gateSearch(this.value)" autocomplete="off"></div><div id="gres"></div></div>
<div class="card"><div class="cth"><b>On approved leave today</b><span>${fdate(j.date)}</span></div>${j.now.map(p => card(p, nowBan(p))).join('') || '<p class="mu">Nobody is on approved leave today.</p>'}</div>
<div class="card"><div class="cth"><b>Leave starting in the next 3 days</b><button class="btn ghost sm" onclick="V.gate()">Refresh</button></div>${j.upcoming.map(p => card(p, soonBan(p))).join('') || '<p class="mu">No approved leave starting soon.</p>'}</div>`;
  };
  window.gateSearch = v => {
    clearTimeout(window.GT);
    window.GT = setTimeout(async () => {
      const box = $('#gres'); if (!box) return; if (v.trim().length < 2) { box.innerHTML = ''; return; }
      const j = await api('/api/gate/search?q=' + encodeURIComponent(v.trim()));
      box.innerHTML = j.results.length ? j.results.map(r => card(r, r.onLeave ? nowBan(r.leave) : r.leave ? soonBan(r.leave) : '<span class="gban no">NO APPROVED LEAVE</span>')).join('') : '<p class="empty">No student found.</p>';
    }, 300);
  };
})();
