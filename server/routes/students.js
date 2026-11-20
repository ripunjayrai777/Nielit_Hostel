/* Students: list (active only), add/update/rename roll, CSV import, delete */
const { today, isDate } = require('../lib/dates');
const { covers } = require('../lib/leaves');
const clean = s => ({ ...s, roll: s._id, _id: undefined });

module.exports = (app, { D, h, saveImg }) => {
  // Students
  app.get('/api/students', h(async (q, r) => { const [st, lv] = await Promise.all([D.students.find().toArray(), D.leaves.find({ status: 'On Leave' }).toArray()]); const m = {}; lv.filter(l => covers(l, today())).forEach(l => m[l.roll] = l); r.json(st.filter(s => q.query.all || !s.vacated).map(s => ({ ...clean(s), status: m[s._id] ? 'On Leave' : 'In Hostel', leave: m[s._id] || null }))); }));
  const tmp = b => 'TMP-' + (b.room || 'X').toUpperCase().replace(/[^A-Z0-9]/g, '') + '-' + (b.name || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  const batchOf = r => { const m = (r || '').match(/20(\d\d)/); if (!m) return ''; const y = 2000 + +m[1]; return y >= 2020 && y <= 2040 ? y + '-' + (y + 4) : ''; };
  app.post('/api/students', h(async (req, res) => {
    const b = req.body, old = (b.oldRoll || '').trim().toUpperCase(), roll = (b.roll || '').trim().toUpperCase() || old || tmp(b);
    if (!/^[A-Z0-9_-]+$/.test(roll) || !(b.name || '').trim()) return res.status(400).json({ error: 'Valid roll number (letters/digits only) and name required' });
    const set = { name: b.name.trim(), batch: b.batch || batchOf(roll), branch: b.branch || '', mobile: b.mobile || '', parentMobile: b.parentMobile || '', room: b.room || '', ...(isDate(b.allotDate) ? { allotDate: b.allotDate } : {}) };
    if (b.photo) set.photo = await saveImg(b.photo);
    if (old && old !== roll) {
      if (await D.students.findOne({ _id: roll })) return res.status(400).json({ error: 'This roll number already exists' });
      const o = await D.students.findOne({ _id: old }); if (!o) return res.status(400).json({ error: 'Old student not found' });
      await D.students.insertOne({ ...o, _id: roll }); await D.students.deleteOne({ _id: old });
      await D.leaves.updateMany({ roll: old }, { $set: { roll } }); await D.complaints.updateMany({ roll: old }, { $set: { roll } });
      for (const f of await D.fees.find({ roll: old }).toArray()) { await D.fees.insertOne({ ...f, _id: roll + '_' + f.sem, roll }); await D.fees.deleteOne({ _id: f._id }); }
      await D.attendance.updateMany({ ['m.' + old]: { $exists: true } }, { $rename: { ['m.' + old]: 'm.' + roll } });
      const acc = await D.accounts.findOne({ _id: old }); if (acc) { await D.accounts.insertOne({ ...acc, _id: roll }); await D.accounts.deleteOne({ _id: old }); }   // the login follows the new roll number
    }
    const upd = { $set: set }; if (!set.photo) upd.$setOnInsert = { photo: '' };
    await D.students.updateOne({ _id: roll }, upd, { upsert: true }); res.json({ ok: 1 });
  }));
  app.post('/api/students/import', h(async (req, res) => {
    const F = ['batch', 'branch', 'mobile', 'parentMobile', 'room'];
    const ops = (req.body.rows || []).filter(r => (r.name || '').trim()).map(r => {
      const roll = (r.roll || '').trim().toUpperCase() || tmp(r); if (!/^[A-Z0-9_-]+$/.test(roll)) return null;
      const set = { name: r.name.trim() }; F.forEach(k => { if ((r[k] || '').trim()) set[k] = r[k].trim(); }); if (!set.batch && batchOf(roll)) set.batch = batchOf(roll);
      const ins = { photo: '' }; F.forEach(k => { if (!(k in set)) ins[k] = ''; });
      return { updateOne: { filter: { _id: roll }, update: { $set: set, $setOnInsert: ins }, upsert: true } };
    }).filter(Boolean);
    if (ops.length) await D.students.bulkWrite(ops); res.json({ imported: ops.length });
  }));
  app.delete('/api/students/:roll', h(async (req, res) => { await D.students.deleteOne({ _id: req.params.roll }); res.json({ ok: 1 }); }));
};
