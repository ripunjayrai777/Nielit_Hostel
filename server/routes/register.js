/* Public: create a resident or guard account. Needs a live-captured ID card photo; the warden must approve before login works. */
const { hashPw } = require('../lib/password');
module.exports = ({ D, connect, saveImg, cleanId }) => async (req, res) => {
  await connect();
  const b = req.body, type = b.type === 'guard' ? 'guard' : 'resident', id = cleanId(b.id), pw = String(b.password || '');
  if (!id) return res.status(400).json({ error: type === 'guard' ? 'Guard ID is required' : 'NDU roll number is required' });
  if (pw.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (!/^data:image\//.test(b.idImage || '')) return res.status(400).json({ error: 'A live photo of your ID card is required' });
  let name, mobile = '';
  if (type === 'resident') {
    const s = await D.students.findOne({ _id: id });
    if (!s || s.vacated) return res.status(400).json({ error: 'This roll number is not in the hostel records. Please contact the warden.' });
    name = s.name;
  } else {
    name = String(b.name || '').trim(); mobile = String(b.mobile || '').trim();
    if (id.length < 3 || !name) return res.status(400).json({ error: 'Guard ID (3+ letters/digits) and name are required' });
    if ((await D.accounts.find({ type: 'guard', status: 'Pending' }).toArray()).length >= 50) return res.status(429).json({ error: 'Too many pending requests. Please contact the warden.' });
  }
  const old = await D.accounts.findOne({ _id: id });
  if (old && old.status === 'Pending') return res.status(400).json({ error: 'Your request is already submitted and waiting for approval' });
  if (old && old.status === 'Approved') return res.status(400).json({ error: 'This ID is already registered. Please sign in.' });
  if (old && old.status === 'Disabled') return res.status(400).json({ error: 'This account is disabled. Please contact the warden.' });
  const doc = { _id: id, type, name, mobile, passHash: hashPw(pw), status: 'Pending', idImage: await saveImg(b.idImage), remark: '', created: new Date().toISOString() };
  if (old) await D.accounts.deleteOne({ _id: id });   // a rejected request can be submitted again
  await D.accounts.insertOne(doc);
  res.json({ ok: 1 });
};
