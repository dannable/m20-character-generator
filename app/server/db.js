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

// ── Rotes seed sync (non-destructive) ─────────────────────────────────────────
// Characters store their rotes as { id, name, spheres_raw } (app.js addRote), so the
// rotes table must never be dropped and re-created: ids would shift. Instead every
// seed record carries a stable seed_key (written by tools/clean_rotes.py) and rows
// are matched by it and updated in place; new seed records are inserted; rows not
// in the seed are kept. The sync only runs when the sha256 of rotes-seed.json
// differs from the one stored in app_meta, so ordinary start-ups do no work.
const crypto = require('crypto');
const rotesDataPath = path.join(__dirname, 'rotes-seed.json');

// Additive schema upgrades for older installs (the former DROP TABLE path is gone)
try { db.exec(`ALTER TABLE rotes ADD COLUMN source_book TEXT NOT NULL DEFAULT ''`); } catch {}
try { db.exec(`ALTER TABLE rotes ADD COLUMN faction TEXT NOT NULL DEFAULT ''`); } catch {}
try { db.exec(`ALTER TABLE rotes ADD COLUMN seed_key TEXT`); } catch {}
try { db.exec(`ALTER TABLE rotes ADD COLUMN truncated INTEGER NOT NULL DEFAULT 0`); } catch {}
db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_rotes_seed_key ON rotes(seed_key)`);
db.exec(`CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);

// ── Daily visits ─────────────────────────────────────────────────────────────
// One row per signed-in user per UTC day, written by the middleware in index.js.
// Drives the "active users" cards and chart on the admin overview. Rows are tiny
// and never pruned (≈ a few hundred per month).
db.exec(`
  CREATE TABLE IF NOT EXISTS daily_visits (
    day     TEXT    NOT NULL,
    user_id INTEGER NOT NULL,
    role    TEXT    NOT NULL DEFAULT 'user',
    PRIMARY KEY (day, user_id)
  )
`);
db.prepare(`INSERT OR IGNORE INTO app_meta (key, value) VALUES ('visits_since', date('now'))`).run();

// Must match seed_key() in tools/clean_rotes.py: sha1("name|page|source[|n]")[:16]
function roteSeedKey(name, page, source, n = 0) {
  const base = `${name}|${page}|${source}` + (n ? `|${n}` : '');
  return crypto.createHash('sha1').update(base, 'utf8').digest('hex').slice(0, 16);
}

function syncRotesFromSeed() {
  if (!fs.existsSync(rotesDataPath)) return;
  const seedText = fs.readFileSync(rotesDataPath, 'utf8');
  const seedHash = crypto.createHash('sha256').update(seedText).digest('hex');
  const stored = db.prepare(`SELECT value FROM app_meta WHERE key = 'rotes_seed_hash'`).get();
  if (stored && stored.value === seedHash) return;

  const seed = JSON.parse(seedText);
  const asJson = v => (typeof v === 'string' ? v : JSON.stringify(v));
  const toRow = r => ({
    name: r.name, chapter: r.chapter, page: r.page,
    source: r.source || '', source_book: r.source_book || '', faction: r.faction || '',
    spheres_raw: r.spheres_raw || '',
    spheres_parsed:  r.spheres_parsed  == null ? '[]' : asJson(r.spheres_parsed),
    sphere_minimums: r.sphere_minimums == null ? '{}' : asJson(r.sphere_minimums),
    description: r.description || '',
    truncated: r.truncated ? 1 : 0,
    seed_key: r.seed_key || roteSeedKey(r.name, r.page, r.source || ''),
  });

  const backfill = db.prepare(`UPDATE rotes SET seed_key = ? WHERE id = ?`);
  const update = db.prepare(`
    UPDATE rotes SET name = @name, chapter = @chapter, page = @page, source = @source,
      source_book = @source_book, faction = @faction, spheres_raw = @spheres_raw,
      spheres_parsed = @spheres_parsed, sphere_minimums = @sphere_minimums,
      description = @description, truncated = @truncated
    WHERE seed_key = @seed_key`);
  const insert = db.prepare(`
    INSERT INTO rotes (name, chapter, page, source, source_book, faction, spheres_raw,
      spheres_parsed, sphere_minimums, description, truncated, seed_key)
    VALUES (@name, @chapter, @page, @source, @source_book, @faction, @spheres_raw,
      @spheres_parsed, @sphere_minimums, @description, @truncated, @seed_key)`);

  const stats = { backfilled: 0, updated: 0, inserted: 0, orphans: 0 };
  db.transaction(() => {
    // 1. Rows seeded before seed_key existed get their key from the same
    //    (name, page, source) formula the cleanup script applied to the raw seed,
    //    so a row and its cleaned seed record meet on the key even if the name changed.
    const taken = new Set(db.prepare(`SELECT seed_key FROM rotes WHERE seed_key IS NOT NULL`).all().map(r => r.seed_key));
    const seen = new Map();
    for (const row of db.prepare(`SELECT id, name, page, source FROM rotes WHERE seed_key IS NULL ORDER BY id`).all()) {
      const base = `${row.name}|${row.page}|${row.source}`;
      const n = seen.get(base) || 0; seen.set(base, n + 1);
      const key = roteSeedKey(row.name, row.page, row.source, n);
      if (taken.has(key)) continue;            // leave keyless rather than collide
      backfill.run(key, row.id); taken.add(key); stats.backfilled++;
    }
    // 2. Upsert by seed_key; ids never change
    for (const r of seed) {
      const row = toRow(r);
      if (taken.has(row.seed_key)) { update.run(row); stats.updated++; }
      else { insert.run(row); taken.add(row.seed_key); stats.inserted++; }
    }
    stats.orphans = db.prepare(`SELECT COUNT(*) AS c FROM rotes WHERE seed_key IS NULL`).get().c;
    db.prepare(`INSERT INTO app_meta (key, value) VALUES ('rotes_seed_hash', ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(seedHash);
  })();
  console.log(`  ★ Rotes seed synced (${seed.length} records): ${stats.updated} updated, ` +
              `${stats.inserted} inserted, ${stats.backfilled} legacy rows keyed, ` +
              `${stats.orphans} rows not in seed kept`);
}
syncRotesFromSeed();

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

// ── Prism of Focus (Charles Siegel, Storytellers Vault) ───────────────────────
// focus_mode: 'core' (M20 freeform Paradigm/Practice/Instruments, the default and
// what every pre-existing row becomes) or 'prism' (Tenets + rated Practices).
// The legacy paradigm / practice columns are still written in prism mode as a
// human-readable projection so sheets, exports and diffs keep working.
try { db.exec(`ALTER TABLE characters ADD COLUMN focus_mode TEXT NOT NULL DEFAULT 'core'`); } catch {}
// { metaphysical, personal, ascension, social_role?, epistemology?, openness?, afterlife? } → PRISM.TENETS ids
try { db.exec(`ALTER TABLE characters ADD COLUMN tenets TEXT DEFAULT '{}'`); } catch {}
// PRISM.PARADIGM_PRESETS id when the tenets were filled from a book paradigm, else ''
try { db.exec(`ALTER TABLE characters ADD COLUMN paradigm_preset TEXT DEFAULT ''`); } catch {}
// { practiceId: 0..5 } — keys are PRISM.PRACTICES ids
try { db.exec(`ALTER TABLE characters ADD COLUMN practice_ratings TEXT DEFAULT '{}'`); } catch {}
// { basePracticeId: specialtyId } — which PRISM.SPECIALTIES entry replaces which base practice
try { db.exec(`ALTER TABLE characters ADD COLUMN practice_specialties TEXT DEFAULT '{}'`); } catch {}
// Per-user default for the Step 0 picker when a chronicle does not force a mode
try { db.exec(`ALTER TABLE users ADD COLUMN default_focus_mode TEXT NOT NULL DEFAULT 'core'`); } catch {}

// Physical description fields
try { db.exec(`ALTER TABLE characters ADD COLUMN age TEXT DEFAULT ''`); } catch {}
try { db.exec(`ALTER TABLE characters ADD COLUMN gender TEXT DEFAULT ''`); } catch {}
try { db.exec(`ALTER TABLE characters ADD COLUMN hair TEXT DEFAULT ''`); } catch {}
try { db.exec(`ALTER TABLE characters ADD COLUMN eyes TEXT DEFAULT ''`); } catch {}
try { db.exec(`ALTER TABLE characters ADD COLUMN height TEXT DEFAULT ''`); } catch {}
try { db.exec(`ALTER TABLE characters ADD COLUMN weight TEXT DEFAULT ''`); } catch {}
try { db.exec(`ALTER TABLE characters ADD COLUMN ethnicity TEXT DEFAULT ''`); } catch {}

// Gear & combat: arrays of free-form item objects
try { db.exec(`ALTER TABLE characters ADD COLUMN gear TEXT DEFAULT '[]'`); } catch {}
try { db.exec(`ALTER TABLE characters ADD COLUMN weapons TEXT DEFAULT '[]'`); } catch {}

// ── Character type & Mortal/Hunter-specific traits ───────────────────────────
// character_type: 'awakened' (Mage, default for all existing rows) | 'mortal' (Hunters Hunted)
// Future values may include 'vampire', 'werewolf', etc.
try { db.exec(`ALTER TABLE characters ADD COLUMN character_type TEXT DEFAULT 'awakened'`); } catch {}
// Virtues (mortal only): { conscience, self_control, courage } — auto-1 each
try { db.exec(`ALTER TABLE characters ADD COLUMN virtues TEXT DEFAULT '{}'`); } catch {}
// Humanity (mortal only): derived from Conscience + Self-Control, persisted for fast read
try { db.exec(`ALTER TABLE characters ADD COLUMN humanity INTEGER DEFAULT 0`); } catch {}
// Numina (mortal only): { pathId: rating } map — Hunters Hunted II psychic powers
try { db.exec(`ALTER TABLE characters ADD COLUMN numina TEXT DEFAULT '{}'`); } catch {}

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

// ── User-defined custom merits & flaws ───────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS custom_merits_flaws (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind        TEXT NOT NULL CHECK(kind IN ('merit','flaw')),
    name        TEXT NOT NULL,
    cost        TEXT NOT NULL DEFAULT '1',
    category    TEXT NOT NULL DEFAULT 'Social',
    description TEXT NOT NULL DEFAULT '',
    repeatable  INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_cmf_user ON custom_merits_flaws(user_id)`);

// ── User-defined custom rotes ─────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS custom_rotes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    spheres     TEXT NOT NULL DEFAULT '{}',
    description TEXT NOT NULL DEFAULT '',
    source      TEXT NOT NULL DEFAULT '',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_cr_user ON custom_rotes(user_id)`);

// ── User-defined custom backgrounds ──────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS custom_backgrounds (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    max_dots    INTEGER NOT NULL DEFAULT 5,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_cbg_user ON custom_backgrounds(user_id)`);

// ── User-defined custom wonders ──────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS custom_wonders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    level       INTEGER NOT NULL DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_cw_user ON custom_wonders(user_id)`);

// ── Chronicle-level custom content ───────────────────────────────────────────
// Created by Storytellers; visible to all chronicle members in the Grimoire.
db.exec(`
  CREATE TABLE IF NOT EXISTS chronicle_custom_merits_flaws (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    chronicle_id INTEGER NOT NULL REFERENCES chronicles(id) ON DELETE CASCADE,
    kind         TEXT NOT NULL CHECK(kind IN ('merit','flaw')),
    name         TEXT NOT NULL,
    cost         TEXT NOT NULL DEFAULT '1',
    category     TEXT NOT NULL DEFAULT 'Social',
    description  TEXT NOT NULL DEFAULT '',
    repeatable   INTEGER NOT NULL DEFAULT 0,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_ccmf_chron ON chronicle_custom_merits_flaws(chronicle_id)`);

db.exec(`
  CREATE TABLE IF NOT EXISTS chronicle_custom_rotes (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    chronicle_id INTEGER NOT NULL REFERENCES chronicles(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    spheres      TEXT NOT NULL DEFAULT '{}',
    description  TEXT NOT NULL DEFAULT '',
    source       TEXT NOT NULL DEFAULT '',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_ccr_chron ON chronicle_custom_rotes(chronicle_id)`);

db.exec(`
  CREATE TABLE IF NOT EXISTS chronicle_custom_backgrounds (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    chronicle_id INTEGER NOT NULL REFERENCES chronicles(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    description  TEXT NOT NULL DEFAULT '',
    max_dots     INTEGER NOT NULL DEFAULT 5,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_ccbg_chron ON chronicle_custom_backgrounds(chronicle_id)`);

db.exec(`
  CREATE TABLE IF NOT EXISTS chronicle_custom_wonders (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    chronicle_id INTEGER NOT NULL REFERENCES chronicles(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    description  TEXT NOT NULL DEFAULT '',
    level        INTEGER NOT NULL DEFAULT 1,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_ccw_chron ON chronicle_custom_wonders(chronicle_id)`);

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
const adminPassword = process.env.ADMIN_PASSWORD || '';
const isProduction  = process.env.NODE_ENV === 'production';

// Only runs when no admin row exists yet; existing rows are never touched.
const existingAdmin = db.prepare(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`).get();
if (!existingAdmin) {
  const usingDefault = !adminPassword || adminPassword === 'admin';
  if (usingDefault && isProduction) {
    console.error('\n  ✖ No admin account exists and ADMIN_PASSWORD is unset (or the default "admin").');
    console.error('    Refusing to seed an admin with a default password in production.');
    console.error('    Set ADMIN_PASSWORD in the environment and restart to create the admin account.\n');
  } else {
    const hash = bcrypt.hashSync(usingDefault ? 'admin' : adminPassword, 12);
    db.prepare(`INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'admin')`)
      .run(adminUsername, adminEmail, hash);
    console.log(`\n  ★ Admin account created — username: ${adminUsername}`);
    if (usingDefault) {
      console.error('  ⚠️  SECURITY WARNING: Admin account is using the default password "admin" (development only).');
      console.error('      Set ADMIN_PASSWORD environment variable before exposing this to the internet.\n');
    } else {
      console.log('      Change the admin password after first login.\n');
    }
  }
}

module.exports = db;
