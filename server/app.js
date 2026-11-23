require('./env');
const express = require('express'), path = require('path');
const { D, connect } = require('./db');
const { h, saveImg } = require('./util');
const auth = require('./auth');

const app = express();
app.use(express.json({ limit: '4mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));   // local runs; on Vercel the CDN serves /public

// public routes: sign in and create an account (resident / guard accounts wait for the warden's approval)
app.post('/api/login', auth.login);
app.post('/api/register', h(require('./routes/register')({ D, connect, saveImg, cleanId: auth.cleanId })));

// everything else: logged in -> database -> account still active -> role allowed
app.use('/api', auth.requireLogin,
  (q, r, n) => connect().then(() => n(), e => r.status(500).json({ error: 'Database error: ' + e.message })),
  auth.requireActive, auth.requirePermission);
app.get('/api/me', h(async (req, res) => res.json(auth.profile(req.user, req.account ? req.account.name : undefined))));

const ctx = { D, h, saveImg };
require('./routes/students')(app, ctx);
require('./routes/attendance')(app, ctx);
require('./routes/leaves')(app, ctx);
require('./routes/complaints')(app, ctx);
require('./routes/exits')(app, ctx);
require('./routes/fees')(app, ctx);
require('./routes/accounts')(app, ctx);
require('./routes/export')(app, ctx);
require('./routes/my')(app, ctx);
require('./routes/profile')(app, ctx);
require('./routes/gate')(app, ctx);
require('./routes/images')(app, ctx);

if (!process.env.VERCEL) app.listen(process.env.PORT || 3000, () => console.log('Running on http://localhost:' + (process.env.PORT || 3000)));
module.exports = app;
