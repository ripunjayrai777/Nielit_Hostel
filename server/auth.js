// Login and sessions. The token is "role.id.expiry.signature" (HMAC).
//   warden   : one shared password (WARDEN_PASSWORD)
//   resident : NDU roll number + own password (account approved by the warden)
//   guard    : guard ID + own password (account approved by the warden)
const crypto = require('crypto');
const { ROLES, can, required } = require('./permissions');
const { D, connect } = require('./db');
const { checkPw } = require('./lib/password');

const secret = () => process.env.SESSION_SECRET || (process.env.VERCEL ? '' : 'dev-secret');
const sign = t => crypto.createHmac('sha256', secret()).update(t).digest('hex');
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const cleanId = s => String(s || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
const wardenPw = () => process.env.WARDEN_PASSWORD || (process.env.VERCEL ? '' : 'warden123');

const issue = (role, id) => { const body = role + '.' + id + '.' + (Date.now() + 30 * 864e5); return body + '.' + sign(body); };
const verify = t => { const p = String(t || '').split('.'); if (p.length !== 4 || !ROLES[p[0]] || !p[1]) return null; return same(p[3], sign(p.slice(0, 3).join('.'))) && +p[2] > Date.now() ? { role: p[0], id: p[1] } : null; };
const tokenOf = req => (req.headers.authorization || '').replace('Bearer ', '') || req.query.t || '';   // ?t= is used by <img> tags
const profile = (u, name) => ({ role: u.role, id: u.id, name: name || ROLES[u.role].label, label: ROLES[u.role].label, perms: ROLES[u.role].perms });
const fail = (res, s, error) => setTimeout(() => res.status(s).json({ error }), 400);   // small delay slows down password guessing

const login = async (req, res) => {
  try {
    if (!secret()) return res.status(500).json({ error: 'SESSION_SECRET is not set on the server' });
    const role = ROLES[req.body.role] ? req.body.role : 'warden', pw = String(req.body.password || '');
    if (role === 'warden') {
      if (!wardenPw()) return res.status(500).json({ error: 'WARDEN_PASSWORD is not set on the server' });
      if (!same(pw, wardenPw())) return fail(res, 401, 'Wrong password');
      return res.json({ token: issue('warden', 'WARDEN'), ...profile({ role, id: 'WARDEN' }) });
    }
    await connect();
    const id = cleanId(req.body.id), a = id && await D.accounts.findOne({ _id: id, type: role });
    if (!a || !checkPw(pw, a.passHash)) return fail(res, 401, 'Wrong ID or password');
    if (a.status === 'Pending') return res.status(403).json({ error: 'Your account is waiting for the warden\'s approval. Please try again later.' });
    if (a.status === 'Rejected') return res.status(403).json({ error: 'Your registration was not approved' + (a.remark ? ': ' + a.remark : '') + '. Please contact the warden.' });
    if (a.status !== 'Approved') return res.status(403).json({ error: 'This account is disabled. Please contact the warden.' });
    res.json({ token: issue(role, id), ...profile({ role, id }, a.name) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error: ' + e.message }); }
};
const requireLogin = (req, res, next) => { const u = verify(tokenOf(req)); if (!u) return res.status(401).json({ error: 'Login required' }); req.user = u; req.role = u.role; next(); };
// residents and guards: the account must still be Approved (the warden can disable it at any time)
const requireActive = async (req, res, next) => {
  try { if (req.role === 'warden') return next(); const a = await D.accounts.findOne({ _id: req.user.id, type: req.role }); if (!a || a.status !== 'Approved') return res.status(401).json({ error: 'Your account is not active. Please contact the warden.' }); req.account = a; next(); }
  catch (e) { res.status(500).json({ error: 'Server error: ' + e.message }); }
};
const requirePermission = (req, res, next) => { const p = required(req); if (p && !can(req.role, p)) return res.status(403).json({ error: 'Your role (' + ROLES[req.role].label + ') cannot do this' }); next(); };
module.exports = { login, requireLogin, requireActive, requirePermission, profile, cleanId };
