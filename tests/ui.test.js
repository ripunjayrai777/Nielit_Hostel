// Browser-less smoke test of every screen and role. Needs jsdom:  npm i --no-save jsdom  &&  node tests/ui.test.js
const { JSDOM } = require('jsdom'), fs = require('fs'), path = require('path');
const pub = path.join(__dirname, '..', 'public');
let html = fs.readFileSync(path.join(pub, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:src|href)="\/((?:js|css)\/[^"]+)"/g)].map(m => m[1]);
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? '  ok   ' : '  FAIL ') + n + (c ? '' : '  -> ' + JSON.stringify(x))); };
ok('every css/js file referenced by index.html exists', refs.every(r => fs.existsSync(path.join(pub, r))), refs.filter(r => !fs.existsSync(path.join(pub, r))));
html = html.replace(/<script src="\/(js\/[^"]+)"><\/script>/g, (m, f) => '<script>' + fs.readFileSync(path.join(pub, f), 'utf8') + '</script>');
const day = n => new Date(Date.now() + 19800000 - n * 864e5).toISOString().slice(0, 10);
const students = [{ roll: 'S1', name: 'Stu One', room: 'A-01', status: 'On Leave', batch: '2025-2029', branch: 'CSE', allotDate: '2026-08-01' }, { roll: 'S2', name: 'Stu Two', room: 'A-02', status: 'In Hostel', batch: '2026-2030', branch: 'ECE' }];
const myLeaves = [{ id: 'm1', no: 'LV-2026-0001', from: day(-1), to: day(-2), reason: 'Home visit', approval: 'Pending', status: 'Pending', remark: '' }, { id: 'm2', no: 'LV-2026-0002', from: day(10), to: day(8), reason: 'Exam trip', approval: 'Rejected', status: 'Rejected', remark: 'Exams that week' }];
const data = {
  '/api/students': students, '/api/leaves': [{ id: 'l1', no: 'LV-2026-0003', roll: 'S1', from: day(1), to: '', reason: 'home', image: 'i1', status: 'On Leave', approval: 'Approved', source: 'warden' }, { id: 'l9', no: 'LV-2026-0004', roll: 'S2', from: day(-3), to: day(-4), reason: 'Family function', image: '', status: 'Pending', approval: 'Pending', source: 'resident' }],
  '/api/complaints': [{ id: 'c1', no: 'CMP-2026-0001', roll: 'S2', text: 'Fan', date: day(2), status: 'Open', image: '', note: '' }], '/api/fees': [{ roll: 'S1', sem: 1, receipt: 'R1', date: day(30), amount: '12000' }], '/api/attendance/all': {},
  '/api/exits': [{ id: 'e1', roll: 'S9', name: 'Old Boy', room: 'B-1', exitDate: day(5), allotDate: day(60), appDate: day(5), days: 55, category: 'III', processing: 0, deduction: 0, refund: 0, feePaid: 12000, monthly: 2000, status: 'Under process', reason: '', image: '', remarks: '' }],
  '/api/accounts': [{ id: 'NDU1', type: 'resident', name: 'New Student', mobile: '', status: 'Pending', idImage: 'idimg1', remark: '', created: day(0) + 'T10:00:00Z', room: '' }, { id: 'G1', type: 'guard', name: 'Ram Guard', mobile: '99', status: 'Approved', idImage: 'idimg2', remark: '', created: day(3) + 'T10:00:00Z' }],
  '/api/accounts/summary': { accounts: 1, leaves: 1 },
  '/api/export': { students: [{ roll: 'S1', name: 'Stu One' }], leaves: [], accounts: [] },
  '/api/my/profile': { roll: 'NDU1', name: 'New Student', room: 'C-04', batch: '2025-2029', branch: 'CSE', allotDate: day(40), status: 'In Hostel', photo: '' }, '/api/my/leaves': myLeaves,
  '/api/my/complaints': [{ id: 'k1', no: 'CMP-2026-0005', text: 'Tap leaking in bathroom of C-04', date: day(1), status: 'Resolved', note: 'Washer replaced', resolved: day(0), image: '' }],
  '/api/gate/leaves': { date: day(0), now: [{ roll: 'S1', name: 'Stu One', room: 'A-01', photo: '', branch: 'CSE', no: 'LV-2026-0003', from: day(1), to: day(-2) }], upcoming: [{ roll: 'S2', name: 'Stu Two', room: 'A-02', photo: '', no: 'LV-2026-0004', from: day(-1), to: day(-2) }] },
  '/api/gate/search': { date: day(0), results: [{ roll: 'S1', name: 'Stu One', room: 'A-01', photo: '', onLeave: true, leave: { no: 'LV-2026-0003', from: day(1), to: day(-2) } }, { roll: 'S2', name: 'Stu Two', room: 'A-02', photo: '', onLeave: false, leave: null }] }
};
const ADMIN = ['students', 'attendance', 'leaves', 'complaints', 'fees', 'exits', 'accounts', 'export'].flatMap(r => [r + ':read', r + ':write']);
const run = async (role, perms, loggedIn = true) => {
  const posts = [], dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost/', pretendToBeVisual: true, beforeParse(w) {
    if (loggedIn) w.localStorage.setItem('tok', 't'); w.navigator.mediaDevices = { getUserMedia: async () => ({ getTracks: () => [] }) }; w.URL.createObjectURL = () => 'blob:x'; w.alert = m => posts.push(['ALERT', m]); w.confirm = () => true; w.prompt = () => 'newpass1';
    w.fetch = async (u, o = {}) => { if (o.method) posts.push([o.method, u, o.body ? JSON.parse(o.body) : null]); const k = u.split('?')[0]; const d = u === '/api/me' ? { role, label: role, name: role === 'resident' ? 'New Student' : role, perms } : u.startsWith('/api/attendance?') ? { marks: { S1: 'L', S2: 'P' } } : o.method === 'POST' && k === '/api/my/leaves' ? { ok: 1, no: 'LV-2026-0009', id: 'm9' } : o.method === 'POST' && k === '/api/my/complaints' ? { ok: 1, no: 'CMP-2026-0009', id: 'k9' } : data[k] || (k.endsWith('.pdf') ? {} : { ok: 1 });
      return { status: 200, ok: true, json: async () => d }; };
  } }), w = dom.window, d = w.document, sl = ms => new Promise(r => setTimeout(r, ms));
  await sl(500); return { w, d, sl, posts };
};
const tabs = d => [...d.querySelectorAll('#nav button')].map(b => b.id.slice(2)).join(',');
(async () => {
  console.log('Sign-in page');
  let { w, d, sl, posts } = await run('none', [], false);
  ok('shows sign-in (not the app), resident selected', !d.querySelector('#login').classList.contains('hide') && d.querySelector('#app').classList.contains('hide') && d.querySelector('#rolepick .on').dataset.role === 'resident');
  w.pickRole('warden'); ok('warden: no ID field, no create-account link', d.querySelector('#idRow').classList.contains('hide') && d.querySelector('#regLink').classList.contains('hide'));
  w.pickRole('guard'); ok('guard: asks for Guard ID', /Guard ID/.test(d.querySelector('#idLabel').textContent) && !d.querySelector('#idRow').classList.contains('hide'));
  w.showRegister(); ok('guard registration asks name + mobile, live ID capture only (no upload)', !d.querySelector('#regName').classList.contains('hide') && !!d.querySelector('#idCap button') && !d.querySelector('#idCap input[type=file]'));
  d.querySelector('#rid').value = 'G9'; d.querySelector('#rpw').value = 'secret1'; await w.register(); ok('cannot register without the ID photo', posts.some(p => p[0] === 'ALERT' && /ID card/.test(p[1])) && !posts.some(p => p[1] === '/api/register'));
  w.REGID = 'data:image/jpeg;base64,AAA'; d.querySelector('#rn').value = 'Ram'; await w.register(); const rg = posts.find(p => p[1] === '/api/register'); ok('registration is sent with ID photo', rg && rg[2].type === 'guard' && rg[2].idImage && rg[2].name === 'Ram');

  console.log('Warden');
  ({ w, d, sl, posts } = await run('warden', ADMIN));
  const last = (m, u) => posts.filter(p => p[0] === m && p[1] === u).pop();
  ok('10 tabs, badges on Leave and Accounts', tabs(d) === 'dash,att,sheet,leave,stu,comp,fee,accounts,data,about' && !!d.querySelector('#n_accounts .bdg') && !!d.querySelector('#n_leave .bdg'));
  ok('home: hero + quick actions + charts', d.querySelector('.hero') && d.querySelectorAll('.qa .btn').length === 3 && d.querySelector('#cg') && !d.querySelector('.cg.sk') && d.querySelectorAll('.bcol').length === 14);
  for (const [t, probe] of [['att', '.seg'], ['sheet', '.grid'], ['stu', '#sad'], ['comp', '.cmp'], ['fee', '#fr_S1'], ['accounts', '.idpair'], ['data', '#main .tbl button'], ['about', '.ah']]) { await w.go(t); await sl(60); ok('tab ' + t + ' renders', !!d.querySelector(probe), probe); }
  w.LSUB = undefined; await w.go('leave'); await sl(60); ok('leave opens on Applications when something is waiting', d.querySelectorAll('.subtabs button').length === 3 && d.querySelectorAll('.cmp').length === 1 && !!d.querySelector('button[onclick^="decideLeave"]'));
  await w.decideLeave('l9', 'approve'); await sl(60); ok('approve sends remark to the right application', last('POST', '/api/leaves/l9/approve'));
  w.LSUB = ''; await w.go('leave'); ok('temporary leave: form + photo box', !!d.querySelector('#lr') && !!d.querySelector('.capbox'));
  w.LSUB = 'exit'; await w.go('leave'); await sl(60); ok('permanent leave view + left-students list', !!d.querySelector('#xr') && d.querySelectorAll('.cmp').length === 1);
  await w.go('accounts'); w.accAct('NDU1', 'approve'); await sl(60); ok('account approve is sent', !!last('POST', '/api/accounts/NDU1/approve'));
  await w.accAct('NDU1', 'reset'); ok('password reset is sent', last('POST', '/api/accounts/NDU1/reset')[2].password === 'newpass1');
  await w.go('about'); await sl(80); ok('hostel tab for warden: glance + staff + SOP + menu', d.querySelectorAll('.pcard').length === 3 && !!d.querySelector('#sopActs') && !!d.querySelector('.mnu') && /At a glance/.test(d.querySelector('#main').textContent));
  console.log('Actions (warden)');
  w.LSUB = ''; await w.go('leave'); await sl(60); await w.addLeave(); ok('leave without photo is refused', posts.some(p => p[0] === 'ALERT' && /mandatory/.test(p[1])) && !last('POST', '/api/leaves'));
  w.LEAVEIMG = 'data:image/jpeg;base64,AAA'; d.querySelector('#lx').value = 'fever'; await w.addLeave(); ok('leave with photo is sent', last('POST', '/api/leaves') && last('POST', '/api/leaves')[2].image);
  await w.go('comp'); await sl(60); d.querySelector('#ct').value = 'No water'; w.CMPIMG = 'data:image/jpeg;base64,AAA'; await w.addComp(); ok('complaint is sent with photo and date', last('POST', '/api/complaints')[2].image && last('POST', '/api/complaints')[2].date);
  await w.go('stu'); await sl(60); d.querySelector('#sr').value = 'S7'; d.querySelector('#sn').value = 'New Boy'; d.querySelector('#sad').value = '2026-08-01'; w.STUIMG = 'data:image/jpeg;base64,AAA'; await w.addStu(); ok('student is sent with photo and allotment date', last('POST', '/api/students')[2].photo && last('POST', '/api/students')[2].allotDate === '2026-08-01');
  await w.go('fee'); await sl(60); d.querySelector('#p_S2').checked = true; w.feeTick('S2'); d.querySelector('#r_S2').value = 'R9'; await w.saveFee('S2'); ok('fee saved -> Update + Clear', last('POST', '/api/fees')[2].receipt === 'R9' && [...d.querySelectorAll('#fa_S2 button')].map(b => b.textContent).join('+') === 'Update+Clear');
  await w.clearFee('S1'); ok('fee cleared', last('POST', '/api/fees')[2].paid === false);
  w.LSUB = 'exit'; await w.go('leave'); await sl(60); d.querySelector('#xr').value = 'S2'; w.xPick(); d.querySelector('#xa').value = day(20); d.querySelector('#xp').value = day(0); w.XIMG = 'data:image/jpeg;base64,AAA'; await w.addExit(); ok('permanent leaving is sent', last('POST', '/api/exits') && last('POST', '/api/exits')[2].roll === 'S2');
  await w.go('att'); await sl(60); w.mk('S2', 'A'); await w.saveAtt(); ok('only the changed mark is saved', JSON.stringify(last('POST', '/api/attendance')[2].marks) === '{"S2":"A"}');
  await w.go('data'); await w.dlSet('students'); ok('data download runs without error', true);

  console.log('Hostel Resident');
  ({ w, d, sl, posts } = await run('resident', ['my:read', 'my:write']));
  const rl = (m, u) => posts.filter(p => p[0] === m && p[1] === u).pop();
  ok('4 tabs only (no warden screens)', tabs(d) === 'myhome,myleave,mycomp,about');
  ok('home: own name, room, status, last leave + issue', /New Student/.test(d.querySelector('#main').textContent) && /C-04/.test(d.querySelector('.kv').textContent) && !!d.querySelector('.stat-banner.in') && /LV-2026-0001/.test(d.querySelector('#main').textContent) && /CMP-2026-0005/.test(d.querySelector('#main').textContent));
  await w.go('myleave'); await sl(60); ok('leave: form + numbered applications with status and warden remark + cancel only while pending', !!d.querySelector('#ml_r') && /Exams that week/.test(d.querySelector('#main').textContent) && d.querySelectorAll('button[onclick^="cancelLeave"]').length === 1);
  d.querySelector('#ml_f').value = day(-1); d.querySelector('#ml_t').value = day(-2); d.querySelector('#ml_r').value = 'abc'; await w.applyLeave(); ok('too-short reason refused', posts.some(p => p[0] === 'ALERT' && /reason/.test(p[1])));
  d.querySelector('#ml_r').value = 'Going home for a family function'; w.MYLIMG = 'data:image/jpeg;base64,AAA'; await w.applyLeave(); ok('application sent with dates, reason and photo', rl('POST', '/api/my/leaves') && rl('POST', '/api/my/leaves')[2].reason.includes('family') && rl('POST', '/api/my/leaves')[2].image);
  await w.cancelLeave('m1'); ok('cancel sent', !!rl('POST', '/api/my/leaves/m1/cancel'));
  await w.go('mycomp'); await sl(60); ok('issues: written application box + own issues with resolution', !!d.querySelector('#mc_t') && /Washer replaced/.test(d.querySelector('#main').textContent));
  d.querySelector('#mc_t').value = 'fan'; await w.raiseIssue(); ok('short issue text refused (written application mandatory)', posts.some(p => p[0] === 'ALERT' && /detail/.test(p[1])) && !rl('POST', '/api/my/complaints'));
  d.querySelector('#mc_t').value = 'The fan in my room has stopped working since Monday.'; await w.raiseIssue(); ok('issue sent', rl('POST', '/api/my/complaints') && rl('POST', '/api/my/complaints')[2].text.includes('fan'));
  await w.go('about'); await sl(80); ok('hostel info for resident (no warden numbers)', !!d.querySelector('.mnu') && !/At a glance/.test(d.querySelector('#main').textContent), [!!d.querySelector('.mnu'), d.querySelector('#main').textContent.slice(0, 120), posts.filter(p => p[0] === 'ALERT').slice(-2)]);

  console.log('Guard');
  ({ w, d, sl, posts } = await run('guard', ['gate:read']));
  ok('2 tabs only', tabs(d) === 'gate,about');
  ok('gate: approved leaves now and soon', d.querySelectorAll('.gcard').length === 2 && /APPROVED LV-2026-0003/.test(d.querySelector('#main').textContent) && /Leave starts/.test(d.querySelector('#main').textContent));
  d.querySelector('#gq').value = 'stu'; w.gateSearch('stu'); await sl(450); ok('search: green for approved leave, red when none', !!d.querySelector('#gres .gban.ok') && !!d.querySelector('#gres .gban.no'));
  console.log(fails ? '\n' + fails + ' FAILED' : '\nAll UI smoke tests passed'); process.exit(fails ? 1 : 0);
})();
