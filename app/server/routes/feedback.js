const express    = require('express');
const { Resend } = require('resend');
const rateLimit  = require('../rateLimit');
const db         = require('../db');
const router     = express.Router();

const FEEDBACK_TO = 'david@blackspiral.ca';

// 5 submissions per hour per IP
const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many feedback submissions — please wait before trying again.',
});

let _resend = null;
function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY environment variable is not set');
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// POST /api/feedback
router.post('/', feedbackLimiter, async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const { subject, message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

  const user = db.prepare('SELECT username, email FROM users WHERE id = ?').get(req.session.userId);
  if (!user) return res.status(401).json({ error: 'User not found' });

  const from         = process.env.MAIL_FROM || 'noreply@m20.blackspiral.ca';
  const subjectLine  = subject?.trim() || `Feedback from ${user.username}`;
  const replyTo      = user.email && !user.email.endsWith('@guest.local') ? user.email : undefined;

  try {
    await getResend().emails.send({
      from,
      to:       FEEDBACK_TO,
      subject:  `[M20] ${subjectLine}`,
      ...(replyTo && { reply_to: replyTo }),
      html: `
        <div style="font-family:Georgia,serif;max-width:620px;margin:auto;background:#faf8f4;padding:2rem;border-radius:6px">
          <div style="border-bottom:2px solid #8b1a1a;padding-bottom:0.75rem;margin-bottom:1.25rem">
            <h2 style="margin:0;color:#1a0a00;font-size:1.2rem">M20 Character Generator — Feedback</h2>
          </div>
          <table style="width:100%;font-size:0.85rem;color:#555;margin-bottom:1.25rem;border-collapse:collapse">
            <tr>
              <td style="padding:0.2rem 0.5rem 0.2rem 0;color:#888;white-space:nowrap;width:4rem">From</td>
              <td style="padding:0.2rem 0"><strong>${escHtml(user.username)}</strong>${replyTo ? ` &lt;${escHtml(replyTo)}&gt;` : ''}</td>
            </tr>
            ${subject?.trim() ? `<tr>
              <td style="padding:0.2rem 0.5rem 0.2rem 0;color:#888">Subject</td>
              <td style="padding:0.2rem 0">${escHtml(subject.trim())}</td>
            </tr>` : ''}
          </table>
          <div style="background:#fff;border-left:4px solid #8b1a1a;padding:1rem 1.5rem;border-radius:0 4px 4px 0;color:#222;font-size:0.95rem;line-height:1.6">
            ${message}
          </div>
          <p style="margin-top:1.5rem;color:#bbb;font-size:0.75rem">
            Sent via the M20 Character Generator feedback form.
          </p>
        </div>
      `,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Feedback email error:', err.message);
    res.status(500).json({ error: 'Failed to send feedback. Please try again later.' });
  }
});

module.exports = router;
