// Unique, readable numbers: PREFIX-YYYY-NNNN (CMP = complaint, LV = leave application). One counter per prefix and year in MongoDB.
const { today } = require('./dates');
const nextNo = async (D, prefix, date) => {
  const y = (date || today()).slice(0, 4), r = await D.counters.findOneAndUpdate({ _id: prefix.toLowerCase() + '-' + y }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' }), doc = r && r.value !== undefined ? r.value : r;
  return prefix + '-' + y + '-' + String(doc.seq).padStart(4, '0');
};
// older records (made before numbers existed) get a number, oldest first
const backfill = async (D, col, prefix, dateField) => { const old = (await D[col].find().sort({ [dateField]: 1, created: 1 }).toArray()).filter(c => !c.no); for (const c of old) await D[col].updateOne({ _id: c._id }, { $set: { no: await nextNo(D, prefix, c[dateField]) } }); };
module.exports = { nextNo, backfill };
