const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'characters.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Characters table ─────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS characters (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER,
    name        TEXT NOT NULL,
    player      TEXT DEFAULT '',
    chronicle   TEXT DEFAULT '',
    concept     TEXT DEFAULT '',
    affiliation TEXT DEFAULT '',
    tradition   TEXT DEFAULT '',
    faction     TEXT DEFAULT '',
    essence     TEXT DEFAULT '',
    nature      TEXT DEFAULT '',
    demeanor    TEXT DEFAULT '',

    strength    INTEGER DEFAULT 1,
    dexterity   INTEGER DEFAULT 1,
    stamina     INTEGER DEFAULT 1,

    charisma      INTEGER DEFAULT 1,
    manipulation  INTEGER DEFAULT 1,
    appearance    INTEGER DEFAULT 1,

    perception    INTEGER DEFAULT 1,
    intelligence  INTEGER DEFAULT 1,
    wits          INTEGER DEFAULT 1,

    talents       TEXT DEFAULT '{}',
    skills        TEXT DEFAULT '{}',
    knowledges    TEXT DEFAULT '{}',

    backgrounds   TEXT DEFAULT '{}',

    spheres       TEXT DEFAULT '{}',
    affinity_sphere TEXT DEFAULT '',

    arete         INTEGER DEFAULT 1,
    willpower     INTEGER DEFAULT 5,
    quintessence  INTEGER DEFAULT 0,
    paradox       INTEGER DEFAULT 0,

    paradigm      TEXT DEFAULT '',
    practice      TEXT DEFAULT '',
    instruments   TEXT DEFAULT '[]',

    freebie_spent TEXT DEFAULT '{}',
    merits        TEXT DEFAULT '{}',
    flaws         TEXT DEFAULT '{}',
    specialties   TEXT DEFAULT '{}',

    description   TEXT DEFAULT '',
    notes         TEXT DEFAULT '',

    attr_priority   TEXT DEFAULT '[]',
    ability_priority TEXT DEFAULT '[]',

    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TRIGGER IF NOT EXISTS update_characters_updated_at
    AFTER UPDATE ON characters
    FOR EACH ROW
    BEGIN
      UPDATE characters SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
`);

// ── Users table ──────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'user',
    is_active     INTEGER NOT NULL DEFAULT 1,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ── Sessions table ───────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    sid     TEXT PRIMARY KEY,
    sess    TEXT NOT NULL,
    expired TEXT NOT NULL
  );
`);

// ── Share tokens table ────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS share_tokens (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    token        TEXT NOT NULL UNIQUE,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ── Character likes table ─────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS character_likes (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    user_id      INTEGER NOT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(character_id, user_id)
  );
`);

// ── Rotes table ──────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS rotes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    chapter         TEXT NOT NULL,
    page            INTEGER NOT NULL,
    source          TEXT NOT NULL DEFAULT '',
    source_book     TEXT NOT NULL DEFAULT '',
    faction         TEXT NOT NULL DEFAULT '',
    spheres_raw     TEXT NOT NULL DEFAULT '',
    spheres_parsed  TEXT NOT NULL DEFAULT '[]',
    sphere_minimums TEXT NOT NULL DEFAULT '{}',
    description     TEXT NOT NULL DEFAULT ''
  );
`);

// Seed / re-seed rotes from rotes-seed.json
// Re-seeds automatically when faction/source_book columns are missing (schema upgrade)
const rotesDataPath = path.join(__dirname, 'rotes-seed.json');
let needsReseed = false;
try {
  const cols = db.prepare(`PRAGMA table_info(rotes)`).all().map(c => c.name);
  if (!cols.includes('faction') || !cols.includes('source_book')) needsReseed = true;
} catch { needsReseed = true; }

if (needsReseed) {
  db.exec(`DROP TABLE IF EXISTS rotes`);
  db.exec(`
    CREATE TABLE rotes (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT NOT NULL,
      chapter         TEXT NOT NULL,
      page            INTEGER NOT NULL,
      source          TEXT NOT NULL DEFAULT '',
      source_book     TEXT NOT NULL DEFAULT '',
      faction         TEXT NOT NULL DEFAULT '',
      spheres_raw     TEXT NOT NULL DEFAULT '',
      spheres_parsed  TEXT NOT NULL DEFAULT '[]',
      sphere_minimums TEXT NOT NULL DEFAULT '{}',
      description     TEXT NOT NULL DEFAULT ''
    )
  `);
}

const rotesCount = db.prepare('SELECT COUNT(*) as c FROM rotes').get().c;
if (rotesCount === 0 && fs.existsSync(rotesDataPath)) {
  const rotesData = JSON.parse(fs.readFileSync(rotesDataPath, 'utf8'));
  const insertRote = db.prepare(`
    INSERT INTO rotes (name, chapter, page, source, source_book, faction, spheres_raw, spheres_parsed, sphere_minimums, description)
    VALUES (@name, @chapter, @page, @source, @source_book, @faction, @spheres_raw, @spheres_parsed, @sphere_minimums, @description)
  `);
  const insertMany = db.transaction((rotes) => { for (const r of rotes) insertRote.run(r); });
  insertMany(rotesData);
  console.log(`  ★ Seeded ${rotesData.length} rotes from rotes-seed.json`);
}

// ── Chronicles table ──────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS chronicles (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    name         TEXT NOT NULL,
    setting      TEXT DEFAULT '',
    year         TEXT DEFAULT '',
    themes       TEXT DEFAULT '',
    notes        TEXT DEFAULT '',
    next_session TEXT DEFAULT '',
    join_code    TEXT NOT NULL UNIQUE,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TRIGGER IF NOT EXISTS update_chronicles_updated_at
    AFTER UPDATE ON chronicles
    FOR EACH ROW
    BEGIN
      UPDATE chronicles SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
`);

// ── Safe migrations for older installs ───────────────────────────────────────
['merits', 'flaws', 'specialties'].forEach(col => {
  try { db.exec(`ALTER TABLE characters ADD COLUMN ${col} TEXT DEFAULT '{}'`); } catch {}
});
try { db.exec(`ALTER TABLE characters ADD COLUMN user_id INTEGER`); } catch {}
try { db.exec(`ALTER TABLE characters ADD COLUMN customArchetypes TEXT DEFAULT '[]'`); } catch {}
try { db.exec(`ALTER TABLE characters ADD COLUMN custom_ability_names TEXT DEFAULT '{}'`); } catch {}
try { db.exec(`ALTER TABLE characters ADD COLUMN is_draft INTEGER NOT NULL DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE characters ADD COLUMN health_track TEXT DEFAULT '[]'`); } catch {}
try { db.exec(`ALTER TABLE characters ADD COLUMN willpower_spent INTEGER NOT NULL DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE characters ADD COLUMN health_dead INTEGER NOT NULL DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE characters ADD COLUMN merit_labels TEXT DEFAULT '{}'`); } catch {}
try { db.exec(`ALTER TABLE characters ADD COLUMN resonance TEXT DEFAULT '[]'`); } catch {}
try { db.exec(`ALTER TABLE characters ADD COLUMN rotes TEXT DEFAULT '[]'`); } catch {}
try { db.exec(`ALTER TABLE characters ADD COLUMN chronicle_id INTEGER REFERENCES chronicles(id) ON DELETE SET NULL`); } catch {}

// ── Safe migration: is_active on chronicles ───────────────────────────────────
try { db.exec(`ALTER TABLE chronicles ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1`); } catch {}

// ── XP tracking ───────────────────────────────────────────────────────────────
try { db.exec(`ALTER TABLE characters ADD COLUMN xp_earned INTEGER DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE characters ADD COLUMN xp_log TEXT DEFAULT '[]'`); } catch {}
try { db.exec(`ALTER TABLE characters ADD COLUMN allow_bg_xp INTEGER DEFAULT 1`); } catch {}
// Chronicle-level background XP toggle (ST controls whether members can spend XP on backgrounds)
try { db.exec(`ALTER TABLE chronicles ADD COLUMN allow_bg_xp INTEGER DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE chronicles ADD COLUMN rules TEXT DEFAULT '{}'`); } catch {}
// Snapshot of creation-time trait baselines; once saved, freebie costs are pinned
// to these values so XP spending never retroactively increases the freebie total.
try { db.exec(`ALTER TABLE characters ADD COLUMN creation_baselines TEXT DEFAULT NULL`); } catch {}
// Wonders: array of { level, name } objects for the multi-instance Wonder background
try { db.exec(`ALTER TABLE characters ADD COLUMN wonders TEXT DEFAULT '[]'`); } catch {}

// ── Chronicle notes tables ────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS chronicle_notes (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    chronicle_id INTEGER NOT NULL REFERENCES chronicles(id) ON DELETE CASCADE,
    title        TEXT NOT NULL DEFAULT 'Untitled Note',
    body         TEXT NOT NULL DEFAULT '',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TRIGGER IF NOT EXISTS update_chronicle_notes_updated_at
    AFTER UPDATE ON chronicle_notes
    FOR EACH ROW
    BEGIN
      UPDATE chronicle_notes SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;

  CREATE TABLE IF NOT EXISTS chronicle_note_shares (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id      INTEGER NOT NULL REFERENCES chronicle_notes(id) ON DELETE CASCADE,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    seen_at      DATETIME,
    UNIQUE(note_id, character_id)
  );
`);

// ── User login tracking migrations ───────────────────────────────────────────
try { db.exec(`ALTER TABLE users ADD COLUMN last_login DATETIME`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN login_count INTEGER NOT NULL DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT 'UTC'`); } catch {}

// ── Password reset tokens ─────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    token      TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used       INTEGER NOT NULL DEFAULT 0
  );
`);

// ── View tracking ─────────────────────────────────────────────────────────────
try { db.exec(`ALTER TABLE characters ADD COLUMN last_viewed_at DATETIME`); } catch {}

// ── Pending character edit requests ──────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS pending_edits (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id   INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    chronicle_id   INTEGER REFERENCES chronicles(id) ON DELETE CASCADE,
    user_id        INTEGER NOT NULL,
    char_snapshot  TEXT NOT NULL,
    diff_summary   TEXT NOT NULL DEFAULT '[]',
    reason         TEXT NOT NULL DEFAULT '',
    status         TEXT NOT NULL DEFAULT 'pending',
    submitted_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at    DATETIME,
    reviewer_id    INTEGER,
    reviewer_note  TEXT NOT NULL DEFAULT ''
  )
`);

// ── Purge orphaned guest accounts on startup ─────────────────────────────────
// Guest sessions are session-cookies that die when the browser closes, but the
// DB rows persist until the server restarts. Clean them up now.
try {
  const guestIds = db.prepare(`SELECT id FROM users WHERE role = 'guest'`).all().map(r => r.id);
  if (guestIds.length) {
    const placeholders = guestIds.map(() => '?').join(',');
    db.prepare(`DELETE FROM characters WHERE user_id IN (${placeholders})`).run(...guestIds);
    db.prepare(`DELETE FROM users WHERE role = 'guest'`).run();
    console.log(`  ✓ Purged ${guestIds.length} orphaned guest account(s) from previous session(s).`);
  }
} catch (e) {
  console.error('Guest purge error:', e);
}

// ── Seed admin user ──────────────────────────────────────────────────────────
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminEmail    = process.env.ADMIN_EMAIL    || 'admin@localhost';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

const existingAdmin = db.prepare(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`).get();
if (!existingAdmin) {
  const hash = bcrypt.hashSync(adminPassword, 12);
  db.prepare(`INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'admin')`)
    .run(adminUsername, adminEmail, hash);
  console.log(`\n  ★ Admin account created — username: ${adminUsername}`);
  if (adminPassword === 'admin') {
    console.error('  ⚠️  SECURITY WARNING: Admin account is using the default password "admin".');
    console.error('      Set ADMIN_PASSWORD environment variable before exposing this to the internet.\n');
  } else {
    console.log('      Change the admin password after first login.\n');
  }
}

module.exports = db;
