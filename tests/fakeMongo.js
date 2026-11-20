// Tiny in-memory stand-in for the mongodb driver (equality filters, $set/$unset/$inc/$setOnInsert, dotted paths).
const Module = require('module'), orig = Module._load, stores = {};
const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const put = (o, p, v) => { const ks = p.split('.'); ks.slice(0, -1).forEach(k => o = o[k] = o[k] || {}); o[ks.pop()] = v; };
const del = (o, p) => { const ks = p.split('.'); ks.slice(0, -1).forEach(k => o = o && o[k]); if (o) delete o[ks.pop()]; };
const match = (d, f) => Object.entries(f || {}).every(([k, v]) => (typeof v === 'object' && v !== null) ? true : get(d, k) === v);
class Col {
  constructor(n) { this.docs = stores[n] = stores[n] || []; }
  find(f) { let r = this.docs.filter(d => match(d, f)); const o = { sort(s) { const [k, dir] = Object.entries(s)[0]; r = r.slice().sort((a, b) => (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * dir); return o; }, toArray: async () => r.map(x => JSON.parse(JSON.stringify(x))) }; return o; }
  async findOne(f) { const d = this.docs.find(d => match(d, f)); return d ? JSON.parse(JSON.stringify(d)) : null; }
  async insertOne(d) { this.docs.push(JSON.parse(JSON.stringify(d))); }
  async deleteOne(f) { const i = this.docs.findIndex(d => match(d, f)); if (i >= 0) this.docs.splice(i, 1); }
  _apply(d, u, inserted) { Object.entries(u.$set || {}).forEach(([k, v]) => put(d, k, v)); Object.keys(u.$unset || {}).forEach(k => del(d, k)); Object.entries(u.$inc || {}).forEach(([k, v]) => put(d, k, (get(d, k) || 0) + v)); if (inserted) Object.entries(u.$setOnInsert || {}).forEach(([k, v]) => put(d, k, v)); }
  async updateOne(f, u, o = {}) { let d = this.docs.find(d => match(d, f)), ins = false; if (!d) { if (!o.upsert) return; d = { ...Object.fromEntries(Object.entries(f).filter(([, v]) => typeof v !== 'object')) }; this.docs.push(d); ins = true; } this._apply(d, u, ins); return d; }
  async updateMany(f, u) { this.docs.filter(d => match(d, f)).forEach(d => this._apply(d, u)); }
  async findOneAndUpdate(f, u, o) { return JSON.parse(JSON.stringify(await this.updateOne(f, u, o))); }
  async bulkWrite(ops) { for (const op of ops) { const x = op.updateOne; await this.updateOne(x.filter, x.update, { upsert: x.upsert }); } }
  async createIndex() {}
}
Module._load = function (r, ...a) { if (r === 'mongodb') return { MongoClient: class { async connect() { return this; } db() { return { collection: n => new Col(n) }; } } }; return orig.call(this, r, ...a); };
module.exports = { stores };
