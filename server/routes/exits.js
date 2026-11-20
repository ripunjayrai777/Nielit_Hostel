/* Permanent leaving (vacate) with refund as per the Hostel Fee Refund SOP */
const crypto = require('crypto');
const { isDate } = require('../lib/dates');
const { refundCalc, num } = require('../lib/refund');

module.exports = (app, { D, h, saveImg }) => {
  // Permanent leaving (vacate) with refund calculated as per the hostel fee refund SOP
  app.get('/api/exits', h(async (q, r) => r.json((await D.exits.find().sort({ exitDate: 1, created: 1 }).toArray()).reverse().map(e => ({ ...e, id: e._id })))));
  app.post('/api/exits', h(async (req, res) => {
    const b = req.body, roll = (b.roll || '').toUpperCase(), st = await D.students.findOne({ _id: roll });
    if (!st || st.vacated) return res.status(400).json({ error: 'Student not found or already marked as left' });
    if (![b.allotDate, b.appDate, b.exitDate].every(isDate)) return res.status(400).json({ error: 'Allotment date, application date and vacating date are required' });
    if (b.appDate < b.allotDate) return res.status(400).json({ error: 'Application date cannot be before the allotment date' });
    const fee = num(b.feePaid), monthly = num(b.monthly);
    const e = { _id: crypto.randomUUID(), roll, name: st.name, room: st.room || '', batch: st.batch || '', branch: st.branch || '', allotDate: b.allotDate, appDate: b.appDate, exitDate: b.exitDate, reason: (b.reason || '').trim(), image: await saveImg(b.image),
      appRcvd: !!b.appRcvd, receipt: !!b.receipt, noDues: !!b.noDues, bank: !!b.bank, feePaid: fee, monthly, ...refundCalc(b.allotDate, b.appDate, fee, monthly), status: 'Under process', refundDate: '', remarks: '', created: new Date().toISOString() };
    await D.exits.insertOne(e);
    await D.students.updateOne({ _id: roll }, { $set: { vacated: b.exitDate, allotDate: b.allotDate } });
    await D.accounts.updateOne({ _id: roll, type: 'resident' }, { $set: { status: 'Disabled', remark: 'Left the hostel' } });
    await D.leaves.updateMany({ roll, returned: { $exists: false } }, { $set: { returned: b.exitDate, status: 'Returned' } });
    res.json({ ok: 1, id: e._id, category: e.category, refund: e.refund });
  }));
  app.post('/api/exits/:id', h(async (req, res) => {
    const e = await D.exits.findOne({ _id: req.params.id }); if (!e) return res.status(404).json({ error: 'Record not found' });
    const b = req.body, set = {};
    ['appRcvd', 'receipt', 'noDues', 'bank'].forEach(k => { if (k in b) set[k] = !!b[k]; });
    if (['Under process', 'Approved', 'Refunded'].includes(b.status)) set.status = b.status;
    if ('remarks' in b) set.remarks = String(b.remarks || '').trim();
    if ('refundDate' in b) set.refundDate = isDate(b.refundDate) ? b.refundDate : '';
    const fee = 'feePaid' in b ? num(b.feePaid) : e.feePaid, monthly = 'monthly' in b ? num(b.monthly) : e.monthly;
    const allot = isDate(b.allotDate) ? b.allotDate : e.allotDate, app = isDate(b.appDate) ? b.appDate : e.appDate;
    if (app < allot) return res.status(400).json({ error: 'Application date cannot be before the allotment date' });
    Object.assign(set, { feePaid: fee, monthly, allotDate: allot, appDate: app, ...refundCalc(allot, app, fee, monthly) });
    await D.exits.updateOne({ _id: e._id }, { $set: set }); res.json({ ok: 1, category: set.category, refund: set.refund });
  }));
  app.delete('/api/exits/:id', h(async (req, res) => { const e = await D.exits.findOne({ _id: req.params.id }); if (!e) return res.status(404).json({ error: 'Record not found' }); await D.students.updateOne({ _id: e.roll }, { $unset: { vacated: '' } }); const ac = await D.accounts.findOne({ _id: e.roll }); if (ac && ac.status === 'Disabled' && ac.remark === 'Left the hostel') await D.accounts.updateOne({ _id: e.roll }, { $set: { status: 'Approved', remark: '' } }); await D.exits.deleteOne({ _id: e._id }); res.json({ ok: 1 }); }));
};
