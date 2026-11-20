// Password hashing with scrypt (built into Node, no extra package). Stored as "salt:hash".
const crypto = require('crypto');
const hashPw = pw => { const salt = crypto.randomBytes(16).toString('hex'); return salt + ':' + crypto.scryptSync(String(pw), salt, 32).toString('hex'); };
const checkPw = (pw, stored) => { const [salt, h] = String(stored || '').split(':'); if (!salt || !h) return false; const a = Buffer.from(h, 'hex'), b = crypto.scryptSync(String(pw), salt, 32); return a.length === b.length && crypto.timingSafeEqual(a, b); };
module.exports = { hashPw, checkPw };
