/* Attendance: everyone Present by default, only L/A exceptions are stored */
const { today } = require('../lib/dates');
const { covers } = require('../lib/leaves');

module.exports = (app, { D, h, saveImg }) => {
  // Attendance: doc per date { _id: date, m: { roll: P|L|A } }
  app.get('/api/attendance', h(async (req, res) => {
    const d = req.query.date || today(), doc = await D.attendance.findOne({ _id: d }), saved = (doc && doc.m) || {};
    const [st, lv] = await Promise.all([D.students.find({}, { projection: { _id: 1 } }).toArray(), D.leaves.find({ from: { $lte: d } }).toArray()]);
    const onL = new Set(lv.filter(l => covers(l, d)).map(l => l.roll)), out = {};
    st.forEach(s => out[s._id] = saved[s._id] || (onL.has(s._id) ? 'L' : 'P')); res.json({ date: d, marks: out });
  }));
  app.post('/api/attendance', h(async (req, res) => {
    const { date, marks } = req.body, set = {}, unset = {};
    Object.entries(marks || {}).forEach(([r, v]) => { if (!/^[A-Z0-9_-]+$/.test(r)) return; if (v === 'P') unset['m.' + r] = ''; else if (v === 'L' || v === 'A') set['m.' + r] = v; });
    const upd = {}; if (Object.keys(set).length) upd.$set = set; if (Object.keys(unset).length) upd.$unset = unset;
    if (!date || !Object.keys(upd).length) return res.json({ ok: 1 });
    await D.attendance.updateOne({ _id: date }, upd, { upsert: true }); res.json({ ok: 1 });
  }));
  app.get('/api/attendance/all', h(async (req, res) => { const o = {}; (await D.attendance.find().toArray()).forEach(d => o[d._id] = d.m); res.json(o); }));
};
