const crypto = require('crypto');
const { D } = require('./db');
// wraps an async route so errors become JSON 500 responses
const h = fn => (req, res) => fn(req, res).catch(e => { console.error(e); res.status(500).json({ error: 'Server error: ' + e.message }); });
// stores a data-URL image in MongoDB and returns its id ('' if not an image)
const saveImg = async d => { if (!/^data:image\//.test(d || '')) return ''; const id = crypto.randomUUID(); await D.images.insertOne({ _id: id, data: d }); return id; };
module.exports = { h, saveImg };
