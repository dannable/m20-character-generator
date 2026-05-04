# M20 Chantry — Project Memory

## What This Is
A full-featured web app for **Mage: The Ascension 20th Anniversary Edition** character creation, management, and chronicle tracking. Branded as **Chantry**.

---

## Stack
| Layer | Tech |
|-------|------|
| Runtime | Node.js 20 (Alpine), Express |
| Database | SQLite via `better-sqlite3` |
| Frontend | Vanilla JS SPA — no framework, no bundler |
| Auth | express-session + bcryptjs |
| PDF export | Custom canvas-based renderer in `routes/export.js` |
| Rich text | Quill.js 1.3.7 (CDN) |
| Fonts | Cinzel, Cinzel Decorative, Crimson Text (Google Fonts) |

---

## Deployment

### Server
- **Host alias:** `thematrix` → `192.168.1.61`
- **SSH:** `ssh -i ~/.ssh/claude_thematrix david@thematrix`
- **Live URL:** `http://192.168.1.61:8009`
- **Docker container:** `m20-character-generator`
- **Project root on server:** `/opt/M20/`

### Critical deployment rule — two tiers of files

#### Tier 1 — Static files (instant, SCP only)
Volume-mounted at runtime: `./app/public:/app/public:ro`

```bash
scp -i ~/.ssh/claude_thematrix app/public/js/app.js   david@thematrix:/opt/M20/app/public/js/app.js
scp -i ~/.ssh/claude_thematrix app/public/css/style.css david@thematrix:/opt/M20/app/public/css/style.css
scp -i ~/.ssh/claude_thematrix app/public/index.html   david@thematrix:/opt/M20/app/public/index.html
```

#### Tier 2 — Server files (require Docker rebuild)
Baked into image via `COPY app/ .` — restart alone is NOT enough.

```bash
# After changing anything in app/server/ or app/package.json:
ssh david@thematrix "cd /opt/M20 && docker compose build --no-cache && docker compose up -d"
```

Server files include: `app/server/index.js`, `app/server/db.js`, `app/server/routes/*.js`

### Cache busting
`index.html` loads JS/CSS with a version query string: `?v=45`  
**Bump this number** (`?v=46`, `?v=47`, …) any time `app.js` or `style.css` changes, then SCP `index.html` too. Otherwise browsers serve stale cached files.

---

## Project File Layout

```
C:/Users/darth/Projects/M20/
├── CLAUDE.md                  ← this file
├── docker-compose.yml
├── Dockerfile
├── app/
│   ├── package.json
│   ├── public/                ← volume-mounted (instant SCP)
│   │   ├── index.html         ← SPA root, holds version query strings
│   │   ├── js/
│   │   │   ├── app.js         ← entire frontend (~12k lines)
│   │   │   └── data.js        ← game data constants (traditions, wonders, etc.)
│   │   ├── css/
│   │   │   └── style.css      ← all styles (~8k lines)
│   │   └── [images, fonts, etc.]
│   └── server/                ← baked into Docker image
│       ├── index.js           ← Express setup, session, routes mount
│       ├── db.js              ← SQLite init, schema, startup cleanup
│       └── routes/
│           ├── auth.js        ← login, register, guest, logout, password reset
│           ├── characters.js  ← CRUD for characters, serializeCharacter()
│           ├── chronicles.js  ← chronicle CRUD + member management + custom content
│           ├── admin.js       ← user management, stats, guest purge
│           ├── export.js      ← PDF generation
│           ├── share.js       ← public share links
│           ├── rotes.js       ← rote/spell reference
│           ├── feedback.js    ← feedback submission
│           └── settings.js    ← per-user settings
└── data/                      ← SQLite DB lives here (volume-mounted)
    └── m20.db
```

---

## Architecture Notes

### Frontend (app.js)
- Single `App` object handles routing (`showPage()`, `showDashboard()`, etc.)
- `Creator` object — 7-step character creation wizard
- `Sheet` object — finalized character sheet view + toolbar
- `Chronicle` object — chronicle detail/management
- `Advancement` object — XP spending screen (`Advancement.show(char)`)
- `Grimoire` object — rote/M&F browser with custom content sections
- `Settings` object — settings page
- `Obsidian` object — export characters/chronicles to Obsidian vault
- `Auth` object — login/register/guest flows
- `$ = id => document.getElementById(id)` shorthand used throughout

### Character JSON fields
Stored as JSON strings in SQLite, parsed on read. Key fields:
`talents, skills, knowledges, backgrounds, spheres, instruments, freebie_spent, attr_priority, ability_priority, merits, flaws, specialties, customArchetypes, custom_ability_names, health_track, merit_labels, resonance, rotes, xp_log, creation_baselines, wonders`

**`serializeCharacter()` in `characters.js`** strips virtual/joined columns before UPDATE — if a new JOIN column ever causes a save error, add a `delete out.columnName` there.

### Wonders data model
`char.wonders` = `[{ name: string, background_cost: number }]`  
`char.backgrounds.wonder` = sum of all `background_cost` values (kept in sync by `_syncWonderBackground()`)  
Wonder catalogue lives in `data.js` → `getWondersData()`.

### Practice data model
`char.practice` = stored TEXT column, comma-separated string: `"Alchemy, Shamanism"`  
`char.practices` = in-memory `string[]`, always derived from `char.practice` on `loadCharacter()` and synced back via `_syncPracticeStr()` after any change in the wizard. No DB schema change — PDF export and other readers still use `char.practice`.

### Guest accounts
- Created with `role = 'guest'` in `users` table
- Cleaned up on: logout, server restart (`db.js` startup block), or admin "Purge All Guests"
- NOT shown in the main admin user table (filtered out by `WHERE u.role != 'guest'`)
- Shown as a count in the guest bar on User Management with a purge button

### Dashboard (landing page)
The dashboard is **fully JS-rendered** by `App.showDashboard()` into `<div id="dashboard-root">`. It has five sections:

1. **Welcome band** — time-aware greeting + rotating daily quote
2. **Attention strip** (`#dash-attention`) — amber bar surfacing characters with unspent XP or pending ST review; populated by `_loadDashboardAttention()` which calls `GET /api/characters/attention-summary`. Hidden when nothing needs action. Each chip calls `App.openAdvancement(id)`.
3. **Navigation hub** — four large icon tiles (New Character, Characters, Chronicles, Grimoire)
4. **Pinned rail** (`#dash-pinned-rail`) — full character cards (no Delete button) for up to 8 favourites; loaded by `_loadDashboardFavorites()`
5. **Recent rail** (`#dash-recent-chars`) — compact 165px tiles; loaded by `_loadDashboardRecent()`

**Favourites** are stored in `localStorage` under key `sanctum_favorites` (array of char IDs, max 8). Key methods: `App.getFavorites()`, `App.toggleFavorite(id)`, `App.isFavorite(id)`, `App._cardToggleFav(btn, id)`. The ★ button appears on every character card (`renderCard()`) and on each compact recent tile.

**`renderCard(c, showOwner, hideDanger)`** — the third param suppresses the Delete button; used for pinned cards so you can't accidentally delete a favourite from the dashboard.

### XP / Advancement
- `Advancement.show(char)` — opens the Advancement page for a character
- `App.openAdvancement(charId)` — fetches the character then calls `Advancement.show()`
- `_render()` in `Advancement` builds `this._pendingMap`: maps `"traitGroup|traitCol|traitKey"` → `{ logIdx }` for every spend entry that is not yet submitted or finalized. Used to show the inline ↩ undo button on trait rows.
- XP self-award is blocked server-side for chronicle members (`403` unless caller is ST or admin)

### Chronicle custom content
Four DB tables (safe `CREATE TABLE IF NOT EXISTS`, all cascade-delete on `chronicle_id`):
- `chronicle_custom_merits_flaws` — kind, name, cost, category, description, repeatable
- `chronicle_custom_rotes` — name, spheres (JSON), description, source
- `chronicle_custom_backgrounds` — name, description, max_dots
- `chronicle_custom_wonders` — name, description, level

ST-only CRUD in `chronicles.js` behind `requireChronST` middleware. Player access via:
- `GET /api/chronicles/custom/member-content` — returns all custom content from every chronicle the current user's characters belong to (joins `characters → chronicles`). **This route MUST appear before `GET /:id`** in chronicles.js or Express will consume "custom" as the `:id` param.

Grimoire caches (module-level, lazy-load with promise deduplication):
- `_chronicleCustomCache` / `_loadChronicleCustom()` / `_invalidateChronicleCustom()` / `_getChronicleCustom()`
- Warmed on `App.setUser()`, invalidated on `App.clearUser()`

### Chronicle member view
`GET /api/chronicles/:id/members/:charId` in `chronicles.js` has its own local `JSON_FIELDS` list. If a new JSON field is added to characters, **add it to both** `characters.js` AND this list in `chronicles.js`, or the sheet will fail to load from the chronicle screen.

Chronicle `GET /:id` returns `xp_awards` (filtered award entries from `xp_log`) per member, used to render the XP pill track on the members section. The members section is **full-width**, below the two-column detail body (not inside the sidebar).

---

## Roles
| Role | Access |
|------|--------|
| `admin` | Full access including User Management |
| `awakened` | Full character + chronicle access |
| `user` | Standard character + chronicle access |
| `guest` | Temporary — characters deleted on logout |

---

## Obsidian Integration
- Settings stored in `localStorage`: `obsidian_vault`, `obsidian_char_folder`, `obsidian_chron_folder`
- Export fires `obsidian://new?vault=...&file=...&content=...` URI + triggers a `.md` download as fallback
- Character exports include a share link (fetched via `POST /api/share/:id`) embedded in YAML frontmatter and footer
- Chronicle exports use `[[WikiLinks]]` to character note files

---

## Easter Eggs
- **Wizard Darrell**: `darrell_cartoon.png` in `/app/public/`. Fixed to `bottom:0; left:0`, slides in from the left (`translateX`) when mouse is within 180px of the bottom-left corner. JS inline in `index.html` at the bottom.

---

## Common Gotchas
1. **SCP multiple files**: Don't pass multiple destinations in one SCP call — it interprets them as a remote directory. SCP each file separately.
2. **Version string**: Always bump `?v=N` in `index.html` after changing `app.js` or `style.css`.
3. **Server changes need rebuild**: Any edit to `app/server/` requires SCP the file to the server FIRST, then `docker compose build --no-cache && docker compose up -d`. The Docker build reads from the **server** filesystem. SCP before build, not after.
4. **Admin user list cache**: `showAdminUsers()` always fetches fresh — do not re-add caching or guest counts will go stale.
5. **SQLite virtual columns**: GET responses include JOIN columns (`chronicle_allow_bg_xp`, `pending_edit`, etc.) that don't exist in the `characters` table. They're stripped in `serializeCharacter()` before UPDATE.
6. **`practices` vs `practice`**: `char.practice` is the DB TEXT column (comma-separated). `char.practices` is an in-memory `string[]` derived from it. The latter must be `delete out.practices` in `serializeCharacter()` or saves fail with `SqliteError: table characters has no column named practices`.
7. **Chronicle custom content route order**: `GET /custom/member-content` must be registered **before** `GET /:id` in `chronicles.js`. Otherwise Express matches "custom" as the `:id` param.
8. **`attention-summary` route order**: `GET /attention-summary` must be registered before `GET /` and before `GET /:id` in `characters.js`.
9. **Dashboard is fully JS-rendered**: `<section id="page-dashboard">` contains only `<div id="dashboard-root">`. All HTML is written by `App.showDashboard()`. Do not add static HTML there.
