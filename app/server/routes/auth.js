const express = require('express');
const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');
const { Resend } = require('resend');
const db      = require('../db');
const router  = express.Router();

// Lazy — instantiated on first use so the server starts even without the env var
let _resend = null;
function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY environment variable is not set');
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const user = db.prepare(`SELECT id, username, email, role, is_active, created_at FROM users WHERE id = ?`).get(req.session.userId);
  if (!user || !user.is_active) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'Account not found or disabled' });
  }
  res.json(user);
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password, staySignedIn } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const user = db.prepare(`SELECT * FROM users WHERE username = ?`).get(username.trim());
  if (!user) return res.status(401).json({ error: 'Invalid username or password' });
  if (!user.is_active) return res.status(403).json({ error: 'Account has been disabled' });
  if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Invalid username or password' });

  req.session.regenerate(err => {
    if (err) return res.status(500).json({ error: 'Session error' });
    req.session.userId = user.id;
    req.session.role   = user.role;
    // "Stay signed in" → 30-day persistent cookie; otherwise session cookie (expires on browser close)
    if (staySignedIn) req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    else              req.session.cookie.expires = false;
    db.prepare(`UPDATE users SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE id = ?`).run(user.id);
    res.json({ id: user.id, username: user.username, email: user.email, role: user.role });
  });
});

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'All fields are required' });
  if (username.trim().length < 2) return res.status(400).json({ error: 'Username must be at least 2 characters' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare(`INSERT INTO users (username, email, password_hash, last_login, login_count) VALUES (?, ?, ?, CURRENT_TIMESTAMP, 1)`)
      .run(username.trim(), email.trim().toLowerCase(), hash);
    const user = db.prepare(`SELECT id, username, email, role FROM users WHERE id = ?`).get(result.lastInsertRowid);
    req.session.regenerate(err => {
      if (err) return res.status(500).json({ error: 'Session error' });
      req.session.userId = user.id;
      req.session.role   = user.role;
      res.status(201).json(user);
    });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username or email already taken' });
    throw err;
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Always respond with success — never reveal whether an email is registered
  res.json({ ok: true });

  try {
    const user = db.prepare(`SELECT id, username, email FROM users WHERE email = ? AND is_active = 1`).get(email.trim().toLowerCase());
    if (!user) return; // silently do nothing

    // Invalidate any previous unused tokens for this user
    db.prepare(`UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0`).run(user.id);

    // Generate a secure random token, valid for 1 hour
    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    db.prepare(`INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`).run(user.id, token, expiresAt);

    const appUrl   = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${appUrl}/?token=${token}`;
    const from     = process.env.MAIL_FROM || `noreply@${req.get('host')}`;

    await getResend().emails.send({
      from,
      to:      user.email,
      subject: 'M20 Character Generator — Password Reset',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#1a1a2e">Password Reset Request</h2>
          <p>Hi <strong>${user.username}</strong>,</p>
          <p>A password reset was requested for your account. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
          <p style="margin:2rem 0">
            <a href="${resetUrl}" style="background:#8b1a1a;color:#fff;padding:0.75rem 1.5rem;border-radius:4px;text-decoration:none;font-weight:bold">
              Reset My Password
            </a>
          </p>
          <p style="color:#666;font-size:0.85rem">If you didn't request this, you can safely ignore this email — your password won't change.</p>
          <p style="color:#666;font-size:0.85rem">Or copy this link: ${resetUrl}</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Password reset email error:', err.message);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and new password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const record = db.prepare(`
    SELECT * FROM password_reset_tokens
    WHERE token = ? AND used = 0 AND expires_at > datetime('now')
  `).get(token);

  if (!record) return res.status(400).json({ error: 'This reset link is invalid or has expired.' });

  const hash = bcrypt.hashSync(password, 10);
  db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(hash, record.user_id);
  db.prepare(`UPDATE password_reset_tokens SET used = 1 WHERE id = ?`).run(record.id);

  res.json({ ok: true });
});

module.exports = router;
