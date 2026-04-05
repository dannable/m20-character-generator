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

// ── Safe migrations for older installs ───────────────────────────────────────
['merits', 'flaws', 'specialties'].forEach(col => {
  try { db.exec(`ALTER TABLE characters ADD COLUMN ${col} TEXT DEFAULT '{}'`); } catch {}
});
try { db.exec(`ALTER TABLE characters ADD COLUMN user_id INTEGER`); } catch {}
try { db.exec(`ALTER TABLE characters ADD COLUMN customArchetypes TEXT DEFAULT '[]'`); } catch {}
try { db.exec(`ALTER TABLE characters ADD COLUMN custom_ability_names TEXT DEFAULT '{}'`); } catch {}

// ── User login tracking migrations ───────────────────────────────────────────
try { db.exec(`ALTER TABLE users ADD COLUMN last_login DATETIME`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN login_count INTEGER NOT NULL DEFAULT 0`); } catch {}

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

// ── Seed admin user ──────────────────────────────────────────────────────────
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminEmail    = process.env.ADMIN_EMAIL    || 'admin@localhost';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

const existingAdmin = db.prepare(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`).get();
if (!existingAdmin) {
  const hash = bcrypt.hashSync(adminPassword, 10);
  db.prepare(`INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'admin')`)
    .run(adminUsername, adminEmail, hash);
  console.log(`\n  ★ Admin account created`);
  console.log(`    Username: ${adminUsername}`);
  console.log(`    Password: ${adminPassword}`);
  console.log(`    Change this password after first login!\n`);
}

module.exports = db;
