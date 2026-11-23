/* Resident and guard: own profile. After the warden approves the account, name, roll number / guard ID and the ID card photo are LOCKED.
   Only two things can change: the profile photo (live camera) and the password. */
const { hashPw, checkPw } = require('../lib/password');
module.exports = (app, { D, h, saveImg }) => {
  const guard = req => req.user.role === 'guard';
  app.get('/api/profile', h(async (req, res) => {
    const a = req.account || await D.accounts.findOne({ _id: req.user.id });
    const base = { role: req.user.role, id: a._id, idImage: a.idImage || '', approvedOn: (a.decidedAt || '').slice(0, 10), locked: true };
    if (guard(req)) return res.json({ ...base, name: a.name, mobile: a.mobile || '', photo: a.photo || '' });
    const s = (await D.students.findOne({ _id: a._id })) || {};
    res.json({ ...base, name: s.name || a.name, room: s.room || '', batch: s.batch || '', branch: s.branch || '', photo: s.photo || '' });
  }));
  // there is deliberately no way to edit name / ID / ID card photo
  app.post('/api/profile', (req, res) => res.status(403).json({ error: 'Your name, ID number and ID card photo are locked after approval. Please contact the warden for a correction.' }));
  app.post('/api/profile/photo', h(async (req, res) => {
    if (!/^data:image\//.test(req.body.image || '')) return res.status(400).json({ error: 'A live photo taken with the camera is required' });
    const col = guard(req) ? D.accounts : D.students, old = await col.findOne({ _id: req.user.id });
    if (!old) return res.status(404).json({ error: 'Record not found. Please contact the warden.' });
    await col.updateOne({ _id: req.user.id }, { $set: { photo: await saveImg(req.body.image) } });
    if (old.photo) await D.images.deleteOne({ _id: old.photo });   // the replaced photo is removed
    res.json({ ok: 1 });
  }));
  app.post('/api/profile/password', h(async (req, res) => {
    const a = await D.accounts.findOne({ _id: req.user.id }), np = String(req.body.newPassword || '');
    if (!a || !checkPw(req.body.oldPassword, a.passHash)) return res.status(400).json({ error: 'Current password is wrong' });
    if (np.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
    await D.accounts.updateOne({ _id: a._id }, { $set: { passHash: hashPw(np) } }); res.json({ ok: 1 });
  }));
};
