/* Warden: approve / reject resident and guard accounts (ID photo check), disable, reset password */
const { hashPw } = require('../lib/password');
module.exports = (app, { D, h }) => {
  app.get('/api/accounts', h(async (q, r) => {
    const st = Object.fromEntries((await D.students.find().toArray()).map(s => [s._id, s]));
    r.json((await D.accounts.find().sort({ created: 1 }).toArray()).reverse().map(a => ({ id: a._id, type: a.type, name: a.name, mobile: a.mobile || '', status: a.status, idImage: a.idImage, remark: a.remark || '', created: a.created, decidedAt: a.decidedAt || '', room: (st[a._id] || {}).room || '' })));
  }));
  // numbers for the red badges on the Leave and Accounts tabs
  app.get('/api/accounts/summary', h(async (q, r) => r.json({ accounts: (await D.accounts.find({ status: 'Pending' }).toArray()).length, leaves: (await D.leaves.find({ approval: 'Pending' }).toArray()).length })));
  const decide = status => h(async (req, res) => {
    const a = await D.accounts.findOne({ _id: req.params.id }); if (!a) return res.status(404).json({ error: 'Account not found' });
    await D.accounts.updateOne({ _id: a._id }, { $set: { status, remark: String(req.body.remark || '').trim(), decidedAt: new Date().toISOString() } }); res.json({ ok: 1 });
  });
  app.post('/api/accounts/:id/approve', decide('Approved'));
  app.post('/api/accounts/:id/reject', decide('Rejected'));
  app.post('/api/accounts/:id/disable', decide('Disabled'));
  app.post('/api/accounts/:id/enable', decide('Approved'));
  app.post('/api/accounts/:id/reset', h(async (req, res) => {
    const pw = String(req.body.password || ''); if (pw.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (!await D.accounts.findOne({ _id: req.params.id })) return res.status(404).json({ error: 'Account not found' });
    await D.accounts.updateOne({ _id: req.params.id }, { $set: { passHash: hashPw(pw) } }); res.json({ ok: 1 });
  }));
};
