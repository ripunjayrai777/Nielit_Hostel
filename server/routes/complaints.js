/* Complaints: auto number CMP-YYYY-NNNN, optional photo, resolution */
const crypto = require('crypto');
const { today, isDate } = require('../lib/dates');
const { nextNo, backfill } = require('../lib/numbers');

module.exports = (app, { D, h, saveImg }) => {
  // Complaints (auto number CMP-YYYY-NNNN, optional photo, date, resolution note)
  app.get('/api/complaints', h(async (q, r) => {
    await backfill(D, 'complaints', 'CMP', 'date');
    r.json((await D.complaints.find().sort({ date: 1, created: 1 }).toArray()).reverse().map(c => ({ ...c, id: c._id })));
  }));
  app.post('/api/complaints', h(async (req, res) => {
    const b = req.body, roll = (b.roll || '').toUpperCase(), date = isDate(b.date) ? b.date : today();
    if (!await D.students.findOne({ _id: roll }) || !(b.text || '').trim()) return res.status(400).json({ error: 'Valid student and complaint details required' });
    await backfill(D, 'complaints', 'CMP', 'date');
    const id = crypto.randomUUID(), no = await nextNo(D, 'CMP', date);
    await D.complaints.insertOne({ _id: id, no, roll, text: b.text.trim(), date, image: await saveImg(b.image), status: 'Open', note: '', source: 'warden', created: new Date().toISOString() });
    res.json({ ok: 1, no, id });
  }));
  app.post('/api/complaints/:id', h(async (req, res) => {
    const st = req.body.status; if (!['Open', 'In Progress', 'Resolved'].includes(st)) return res.status(400).json({ error: 'Invalid status' });
    const upd = { $set: { status: st, note: (req.body.note || '').trim() } };
    if (st === 'Resolved') upd.$set.resolved = isDate(req.body.resolved) ? req.body.resolved : today(); else upd.$unset = { resolved: '' };
    await D.complaints.updateOne({ _id: req.params.id }, upd); res.json({ ok: 1 });
  }));
};
