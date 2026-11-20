/* Warden: download all data (JSON). Photos stay in the database (only their ids are included). */
module.exports = (app, { D, h }) => {
  const SETS = ['students', 'leaves', 'complaints', 'fees', 'exits', 'accounts', 'attendance'];
  const idToKey = (a, key) => a.map(({ _id, ...r }) => ({ [key]: _id, ...r }));
  app.get('/api/export', h(async (req, res) => {
    const set = req.query.set || 'all'; if (set !== 'all' && !SETS.includes(set)) return res.status(400).json({ error: 'Unknown data set' });
    const get = async n => { const all = await D[n === 'attendance' ? 'attendance' : n].find().toArray(); if (n === 'students') return idToKey(all, 'roll'); if (n === 'accounts') return idToKey(all.map(({ passHash, ...r }) => r), 'id'); if (n === 'attendance') return all.flatMap(d => Object.entries(d.m || {}).map(([roll, mark]) => ({ date: d._id, roll, mark }))); return idToKey(all, 'id'); };
    const names = set === 'all' ? SETS : [set], out = { exportedAt: new Date().toISOString() };
    for (const n of names) out[n] = await get(n);
    res.json(out);
  }));
};
