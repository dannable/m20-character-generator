/**
 * Simple in-memory rate limiter — no external dependency needed.
 * Buckets reset after windowMs. Old buckets are pruned every 15 minutes.
 */
const buckets = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (now > entry.resetAt) buckets.delete(key);
  }
}, 15 * 60 * 1000).unref(); // unref so it doesn't keep the process alive

/**
 * @param {object} opts
 * @param {number} opts.windowMs   - Rolling window in milliseconds
 * @param {number} opts.max        - Max requests per window per key
 * @param {string} [opts.message]  - Error message returned on limit
 */
function rateLimit({ windowMs, max, message = 'Too many attempts — please try again later.' }) {
  return (req, res, next) => {
    const key = `${req.path}:${req.ip}`;
    const now = Date.now();

    let entry = buckets.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
    }
    entry.count++;
    buckets.set(key, entry);

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({ error: message });
    }
    next();
  };
}

module.exports = rateLimit;
