// Tabs per role. Add a tab: add a row (id, label, roles), an icon in ICON, and define V.<id> in a feature file.
const TABS = [
  ['dash', 'Home', ['warden']], ['att', 'Today', ['warden']], ['sheet', 'Sheet', ['warden']], ['leave', 'Leave', ['warden']], ['stu', 'Students', ['warden']],
  ['comp', 'Issues', ['warden']], ['fee', 'Fees', ['warden']], ['accounts', 'Accounts', ['warden']], ['data', 'Data', ['warden']],
  ['myhome', 'Home', ['resident']], ['myleave', 'Leave', ['resident']], ['mycomp', 'Issues', ['resident']],
  ['gate', 'Gate', ['guard']],
  ['about', 'Hostel', ['warden', 'resident', 'guard']]
];
const START = { warden: 'dash', resident: 'myhome', guard: 'gate' };
const PEND = { accounts: 0, leaves: 0 };   // warden: things waiting for approval (red badges)
const myTabs = () => TABS.filter(t => t[2].includes(ME.role));
async function init() {
  $('#login').classList.add('hide'); $('#app').classList.remove('hide');
  ME = await api('/api/me'); $('#who').textContent = ME.name || ME.label;
  $('#nav').innerHTML = myTabs().map(t => `<button id="n_${t[0]}" onclick="go('${t[0]}')"><svg viewBox="0 0 24 24">${ICON[t[0]]}</svg><span>${t[1]}</span></button>`).join('');
  if (!myTabs().some(t => t[0] === tab)) tab = START[ME.role];
  await go(tab);
}
async function refreshBadges() {
  if (!ME || ME.role !== 'warden') return;
  try { Object.assign(PEND, await api('/api/accounts/summary')); } catch (e) { return; }
  [['accounts', PEND.accounts], ['leave', PEND.leaves]].forEach(([id, n]) => { const b = $('#n_' + id); if (!b) return; const old = b.querySelector('.bdg'); if (old) old.remove(); if (n) b.insertAdjacentHTML('beforeend', `<i class="bdg">${n}</i>`); });
}
async function go(t) {
  tab = t; document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.id == 'n_' + t));
  S = ME.role === 'warden' ? await api('/api/students') : [];
  await V[t](); refreshBadges();
  const n = $('#n_' + t), nav = $('#nav');   // keep the active tab visible in the scrollable mobile bar
  if (n && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: nav.scrollLeft + n.getBoundingClientRect().left + n.offsetWidth / 2 - nav.clientWidth / 2, behavior: 'smooth' });
}
