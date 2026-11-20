/* Guard: who has an APPROVED leave today / soon, and a search to check one student. Only basic details, no phone numbers, fees or reasons. */
const { today, addDays } = require('../lib/dates');
const { approved, covers } = require('../lib/leaves');
const { backfill } = require('../lib/numbers');
module.exports = (app, { D, h }) => {
  const load = async () => { await backfill(D, 'leaves', 'LV', 'from'); const [st, lv] = await Promise.all([D.students.find().toArray(), D.leaves.find().toArray()]); return { st: st.filter(s => !s.vacated), lv: lv.filter(approved) }; };
  const who = s => ({ roll: s._id, name: s.name, room: s.room || '', photo: s.photo || '', batch: s.batch || '', branch: s.branch || '' });
  const lvInfo = l => ({ no: l.no || '', from: l.from, to: l.to || '', returned: l.returned || '' });
  app.get('/api/gate/leaves', h(async (q, r) => {
    const { st, lv } = await load(), by = Object.fromEntries(st.map(s => [s._id, s])), t = today(), soon = addDays(t, 3);
    const row = l => ({ ...who(by[l.roll]), ...lvInfo(l) });
    r.json({ date: t, now: lv.filter(l => by[l.roll] && covers(l, t)).map(row), upcoming: lv.filter(l => by[l.roll] && !l.returned && l.from > t && l.from <= soon).map(row) });
  }));
  app.get('/api/gate/search', h(async (req, res) => {
    const text = String(req.query.q || '').trim().toLowerCase(); if (text.length < 2) return res.json({ date: today(), results: [] });
    const { st, lv } = await load(), t = today();
    res.json({ date: t, results: st.filter(s => (s.name + ' ' + s._id + ' ' + (s.room || '')).toLowerCase().includes(text)).slice(0, 20).map(s => {
      const mine = lv.filter(l => l.roll === s._id && !l.returned && (!l.to || l.to >= t)).sort((a, b) => (a.from > b.from ? 1 : -1))[0];
      return { ...who(s), onLeave: !!mine && covers(mine, t), leave: mine ? lvInfo(mine) : null };
    }) });
  }));
};
