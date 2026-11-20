const { MongoClient } = require('mongodb');
const D = {};   // collections, filled after connect()
let ready;
const connect = () => ready || (ready = (async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
  const c = await new MongoClient(process.env.MONGODB_URI).connect(), db = c.db(process.env.DB_NAME || 'nielit_hostel');
  ['students', 'leaves', 'attendance', 'complaints', 'fees', 'images', 'counters', 'exits', 'accounts'].forEach(n => D[n] = db.collection(n));
})().catch(e => { ready = null; throw e; }));
module.exports = { D, connect };
