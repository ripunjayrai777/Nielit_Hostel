/* Leave: warden entries (photo mandatory, approved at once) + student applications (approve / reject). Every leave gets a number LV-YYYY-NNNN. */
const crypto = require('crypto');
const { today, prevDay } = require('../lib/dates');
const { approved, findClash, leaveStatus } = require('../lib/leaves');
const { nextNo, backfill } = require('../lib/numbers');

module.exports = (app, { D, h, saveImg }) => {
  const clashText = c => 'This student already has leave ' + (c.approval === 'Pending' ? '(waiting for approval) ' : '') + 'from ' + c.from + ' to ' + (c.returned ? prevDay(c.returned) : (c.to || 'open-ended (not marked Returned yet)')) + '. Choose dates that do not overlap, or mark him Returned first.';
  app.get('/api/leaves', h(async (q, r) => {
    await backfill(D, 'leaves', 'LV', 'from');
    r.json((await D.leaves.find().sort({ created: -1 }).toArray()).map(l => ({ ...l, id: l._id, approval: l.approval || 'Approved', status: leaveStatus(l) })));
  }));
  app.post('/api/leaves', h(async (req, res) => {
    const b = req.body, roll = (b.roll || '').toUpperCase();
    if (!await D.students.findOne({ _id: roll })) return res.status(400).json({ error: 'Unknown roll number' });
    if (!/^data:image\//.test(b.image || '')) return res.status(400).json({ error: 'Leave application image is mandatory' });
    if (!b.from || !b.reason) return res.status(400).json({ error: 'From date and reason required' });
    if (b.to && b.to < b.from) return res.status(400).json({ error: 'To date cannot be before From date' });
    const clash = findClash(await D.leaves.find({ roll }).toArray(), b.from, b.to);
    if (clash) return res.status(400).json({ error: clashText(clash) });
    await backfill(D, 'leaves', 'LV', 'from');
    const l = { _id: crypto.randomUUID(), no: await nextNo(D, 'LV'), roll, from: b.from, to: b.to || '', reason: b.reason, image: await saveImg(b.image), status: 'On Leave', approval: 'Approved', source: 'warden', created: new Date().toISOString() };
    await D.leaves.insertOne(l); res.json({ ok: 1, no: l.no });
  }));
  // student applications: approve / reject
  const decide = approval => h(async (req, res) => {
    const l = await D.leaves.findOne({ _id: req.params.id }); if (!l) return res.status(404).json({ error: 'Application not found' });
    if (l.approval !== 'Pending') return res.status(400).json({ error: 'This application is already ' + (l.approval || 'Approved').toLowerCase() });
    if (approval === 'Approved') { const clash = findClash((await D.leaves.find({ roll: l.roll }).toArray()).filter(x => x._id !== l._id && approved(x)), l.from, l.to); if (clash) return res.status(400).json({ error: 'Overlaps another approved leave. ' + clashText(clash) }); }
    await D.leaves.updateOne({ _id: l._id }, { $set: { approval, status: approval === 'Approved' ? 'On Leave' : 'Rejected', decidedAt: new Date().toISOString(), remark: String(req.body.remark || '').trim() } }); res.json({ ok: 1 });
  });
  app.post('/api/leaves/:id/approve', decide('Approved'));
  app.post('/api/leaves/:id/reject', decide('Rejected'));
  app.post('/api/leaves/:id/return', h(async (req, res) => {
    const l = await D.leaves.findOne({ _id: req.params.id }); if (!l || !approved(l)) return res.status(400).json({ error: 'Only an approved leave can be marked Returned' });
    await D.leaves.updateOne({ _id: l._id }, { $set: { status: 'Returned', returned: req.body.date || today() } }); res.json({ ok: 1 });
  }));
};
