const { Store } = require('express-session');

class SQLiteStore extends Store {
  constructor(db) {
    super();
    this.db = db;

    // Clean up expired sessions every 5 minutes
    const cleanup = () => {
      this.db.prepare(`DELETE FROM sessions WHERE expired < datetime('now')`).run();
    };
    const timer = setInterval(cleanup, 5 * 60 * 1000);
    if (timer.unref) timer.unref();
  }

  get(sid, cb) {
    try {
      const row = this.db.prepare(`SELECT sess, expired FROM sessions WHERE sid = ?`).get(sid);
      if (!row) return cb(null, null);
      if (new Date(row.expired) < new Date()) {
        this.destroy(sid, () => {});
        return cb(null, null);
      }
      cb(null, JSON.parse(row.sess));
    } catch (err) { cb(err); }
  }

  set(sid, sess, cb) {
    try {
      const maxAge = sess.cookie?.maxAge || 7 * 24 * 60 * 60 * 1000;
      const expired = new Date(Date.now() + maxAge).toISOString();
      this.db.prepare(`INSERT OR REPLACE INTO sessions (sid, sess, expired) VALUES (?, ?, ?)`)
        .run(sid, JSON.stringify(sess), expired);
      cb(null);
    } catch (err) { cb(err); }
  }

  destroy(sid, cb) {
    try {
      this.db.prepare(`DELETE FROM sessions WHERE sid = ?`).run(sid);
      cb(null);
    } catch (err) { cb(err); }
  }
}

module.exports = SQLiteStore;
