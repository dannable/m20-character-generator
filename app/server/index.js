const express       = require('express');
const session       = require('express-session');
const path          = require('path');
const db            = require('./db');
const SQLiteStore   = require('./session-store');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Startup security checks ───────────────────────────────────────────────────
const DEFAULT_SECRET = 'mage-ascension-secret-change-me';
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === DEFAULT_SECRET) {
  console.error('\n  ⚠️  SECURITY WARNING: SESSION_SECRET is not set or uses the default value.');
  console.error('      All session tokens can be forged. Set a strong random secret in production.\n');
}

// ── Trust reverse proxy (nginx) — required for correct IP in rate limiting ────
app.set('trust proxy', 1);

app.use(express.json({ limit: '2mb' }));

// ── Sessions ─────────────────────────────────────────────────────────────────
app.use(session({
  store:  new SQLiteStore(db),
  secret: process.env.SESSION_SECRET || DEFAULT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    // secure: true sends cookies only over HTTPS. Enable when behind an HTTPS proxy.
    secure:   process.env.SESSION_SECURE === 'true',
    // maxAge is NOT set here — default is a session cookie (expires on browser close).
    // The login route sets maxAge to 30 days when "stay signed in" is requested.
    sameSite: 'lax',
  },
}));

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Authentication required' });
  next();
}

// ── Static files ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/admin',      require('./routes/admin'));
app.use('/api/characters', requireAuth, require('./routes/characters'));
app.use('/api/chronicles', requireAuth, require('./routes/chronicles'));
app.use('/api/settings',  requireAuth, require('./routes/settings'));
app.use('/api/feedback',  requireAuth, require('./routes/feedback'));
app.use('/api/export',     require('./routes/export'));
app.use('/api/share',      require('./routes/share'));
const rotesRouter = require('./routes/rotes');
app.use('/api', rotesRouter);

// Health check (no auth)
app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'M20 Character Generator' }));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`M20 Character Generator running on port ${PORT}`);
});
