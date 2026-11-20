// Login, logout, roles. The server is the authority; the UI only hides what a role cannot use.
// Mark things in templates with:  data-need="leaves:write"  (remove element)   data-edit="fees:write"  (read-only inside)
const can = p => !!ME && ME.perms.includes(p);
function applyPerms() {
  if (!ME) return;
  document.querySelectorAll('#app [data-need]').forEach(el => { if (!can(el.dataset.need)) el.remove(); });
  document.querySelectorAll('#app [data-edit]').forEach(el => {
    if (can(el.dataset.edit)) return;
    el.querySelectorAll('input,select,textarea,button').forEach(c => { c.disabled = true; });
    el.querySelectorAll('.btn').forEach(b => b.remove());
  });
}
let LROLE = 'resident';   // role chosen on the sign-in page
function pickRole(r) {
  LROLE = r; document.querySelectorAll('#rolepick button').forEach(b => b.classList.toggle('on', b.dataset.role === r));
  $('#idRow').classList.toggle('hide', r === 'warden'); $('#regLink').classList.toggle('hide', r === 'warden');
  $('#idLabel').textContent = r === 'guard' ? 'Guard ID' : 'NDU Roll Number'; $('#uid').placeholder = r === 'guard' ? 'Your guard ID' : 'e.g. NDU202500285';
}
async function login() {
  let r; try { r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: LROLE, id: $('#uid').value, password: $('#pw').value }) }); } catch (e) { return alert('Server not reachable'); }
  const j = await r.json().catch(() => ({}));
  if (r.ok) { localStorage.setItem('tok', j.token); $('#pw').value = ''; init(); } else alert(j.error || 'Login failed');
}
function showRegister() {
  const g = LROLE === 'guard';
  $('#loginForm').classList.add('hide'); $('#regForm').classList.remove('hide');
  $('#regTitle').textContent = g ? 'Create guard account' : 'Create resident account';
  $('#regIdLabel').textContent = g ? 'Guard ID (letters / digits)' : 'NDU Roll Number';
  $('#regName').classList.toggle('hide', !g); $('#regMobile').classList.toggle('hide', !g);
  liveBox('#idCap', 'REGID', 'environment');
}
function showLoginForm() { $('#regForm').classList.add('hide'); $('#loginForm').classList.remove('hide'); }
async function register() {
  if (!window.REGID) return alert('Please capture a photo of your ID card with the camera');
  const body = { type: LROLE === 'guard' ? 'guard' : 'resident', id: $('#rid').value, name: $('#rn').value, mobile: $('#rm').value, password: $('#rpw').value, idImage: window.REGID };
  let r; try { r = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); } catch (e) { return alert('Server not reachable'); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return alert(j.error || 'Could not submit');
  alert('Submitted. You can sign in after the warden approves your ID card.');
  $('#uid').value = body.id; $('#rpw').value = ''; showLoginForm();
}
function logout() { localStorage.removeItem('tok'); ME = null; showLogin(); }
function showLogin() { $('#login').classList.remove('hide'); $('#app').classList.add('hide'); }
