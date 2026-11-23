/* Resident self-service (everything is limited to the logged-in student's own roll number) */
const crypto = require('crypto');
const { today, isDate, prevDay } = require('../lib/dates');
const { covers, findClash, leaveStatus } = require('../lib/leaves');
const { nextNo, backfill } = require('../lib/numbers');
const { hashPw, checkPw } = require('../lib/password');

module.exports = (app, { D, h, saveImg }) => {
  const roll = req => req.user.id;
  app.get('/api/my/profile', h(async (req, res) => {
    const s = await D.students.findOne({ _id: roll(req) }); if (!s) return res.status(404).json({ error: 'Your student record was not found. Please contact the warden.' });
    const on = (await D.leaves.find({ roll: s._id }).toArray()).some(l => covers(l, today()));
    res.json({ roll: s._id, name: s.name, room: s.room || '', batch: s.batch || '', branch: s.branch || '', mobile: s.mobile || '', parentMobile: s.parentMobile || '', photo: s.photo || '', allotDate: s.allotDate || '', status: s.vacated ? 'Left hostel' : on ? 'On Leave' : 'In Hostel' });
  }));
  // ---- leave applications ----
  app.get('/api/my/leaves', h(async (req, res) => {
    await backfill(D, 'leaves', 'LV', 'from');
    res.json((await D.leaves.find({ roll: roll(req) }).sort({ from: 1 }).toArray()).reverse().map(l => ({ id: l._id, no: l.no || '', from: l.from, to: l.to || '', reason: l.reason, image: l.image || '', approval: l.approval || 'Approved', status: leaveStatus(l), remark: l.remark || '', decidedAt: l.decidedAt || '', created: l.created || '' })));
  }));
  app.post('/api/my/leaves', h(async (req, res) => {
    const b = req.body, id = roll(req), s = await D.students.findOne({ _id: id });
    if (!s || s.vacated) return res.status(400).json({ error: 'Your student record is not active' });
    if (!isDate(b.from) || !isDate(b.to)) return res.status(400).json({ error: 'From and To dates are required' });
    if (b.to < b.from) return res.status(400).json({ error: 'To date cannot be before From date' });
    if (b.from < today()) return res.status(400).json({ error: 'Leave cannot start in the past' });
    if (String(b.reason || '').trim().length < 5) return res.status(400).json({ error: 'Please write the reason for leave' });
    if (!/^data:image\//.test(b.image || '')) return res.status(400).json({ error: 'A photo of your leave application is mandatory' });
    const clash = findClash(await D.leaves.find({ roll: id }).toArray(), b.from, b.to);
    if (clash) return res.status(400).json({ error: 'You already have a leave application from ' + clash.from + ' to ' + (clash.returned ? prevDay(clash.returned) : (clash.to || 'open-ended')) + '. Choose different dates.' });
    await backfill(D, 'leaves', 'LV', 'from');
    const l = { _id: crypto.randomUUID(), no: await nextNo(D, 'LV'), roll: id, from: b.from, to: b.to, reason: String(b.reason).trim(), image: await saveImg(b.image), status: 'Pending', approval: 'Pending', source: 'resident', created: new Date().toISOString() };
    await D.leaves.insertOne(l); res.json({ ok: 1, no: l.no, id: l._id });
  }));
  app.post('/api/my/leaves/:id/cancel', h(async (req, res) => {
    const l = await D.leaves.findOne({ _id: req.params.id, roll: roll(req) });
    if (!l || l.approval !== 'Pending') return res.status(400).json({ error: 'Only an application that is still waiting for approval can be cancelled' });
    await D.leaves.updateOne({ _id: l._id }, { $set: { approval: 'Cancelled', status: 'Cancelled' } }); res.json({ ok: 1 });
  }));
  // ---- issues / complaints (a written application is mandatory) ----
  app.get('/api/my/complaints', h(async (req, res) => {
    await backfill(D, 'complaints', 'CMP', 'date');
    res.json((await D.complaints.find({ roll: roll(req) }).sort({ date: 1, created: 1 }).toArray()).reverse().map(c => ({ id: c._id, no: c.no, text: c.text, date: c.date, image: c.image || '', status: c.status, note: c.note || '', resolved: c.resolved || '' })));
  }));
  app.post('/api/my/complaints', h(async (req, res) => {
    const b = req.body, id = roll(req), s = await D.students.findOne({ _id: id }), text = String(b.text || '').trim();
    if (!s || s.vacated) return res.status(400).json({ error: 'Your student record is not active' });
    if (text.length < 15) return res.status(400).json({ error: 'Please write your application in detail (at least 15 characters)' });
    if (!/^data:image\//.test(b.image || '')) return res.status(400).json({ error: 'A photo of your written application is mandatory' });
    await backfill(D, 'complaints', 'CMP', 'date');
    const c = { _id: crypto.randomUUID(), no: await nextNo(D, 'CMP', today()), roll: id, text, date: today(), image: await saveImg(b.image), status: 'Open', note: '', source: 'resident', created: new Date().toISOString() };
    await D.complaints.insertOne(c); res.json({ ok: 1, no: c.no, id: c._id });
  }));
  // ---- own password ----
  app.post('/api/my/password', h(async (req, res) => {
    const a = await D.accounts.findOne({ _id: roll(req) }), np = String(req.body.newPassword || '');
    if (!a || !checkPw(req.body.oldPassword, a.passHash)) return res.status(400).json({ error: 'Current password is wrong' });
    if (np.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
    await D.accounts.updateOne({ _id: a._id }, { $set: { passHash: hashPw(np) } }); res.json({ ok: 1 });
  }));
};
