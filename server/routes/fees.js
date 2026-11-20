/* Hostel fee records, semester wise */

module.exports = (app, { D, h, saveImg }) => {
  // Fees (semester-wise)
  app.get('/api/fees', h(async (q, r) => r.json(await D.fees.find().toArray())));
  app.post('/api/fees', h(async (req, res) => {
    const b = req.body, roll = (b.roll || '').toUpperCase(), id = roll + '_' + +b.sem;
    if (!await D.students.findOne({ _id: roll })) return res.status(400).json({ error: 'Unknown roll number' });
    if (!b.paid) { await D.fees.deleteOne({ _id: id }); return res.json({ ok: 1 }); }
    if (!b.receipt || !b.date) return res.status(400).json({ error: 'Receipt no. and payment date required' });
    await D.fees.updateOne({ _id: id }, { $set: { roll, sem: +b.sem, receipt: b.receipt, date: b.date, amount: b.amount || '' } }, { upsert: true }); res.json({ ok: 1 });
  }));
};
