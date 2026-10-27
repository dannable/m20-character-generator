# M20 Character Builder

A web app for building and managing **Mage: The Ascension 20th Anniversary
Edition** characters: a step-by-step character creator, character sheets,
chronicles with Storyteller XP approval, rote and wonder libraries, PDF
export, share links, and a tarot-draw helper. It is in live use.

- **Backend:** Node 20 / Express, SQLite via `better-sqlite3`, sessions in
  SQLite, email via Resend. Source in `app/server/`.
- **Frontend:** a single `index.html` plus vanilla JS and CSS, no build
  step. Source in `app/public/`.
- **Deployment:** one Docker container defined by `Dockerfile` and
  `docker-compose.yml`, listening on port 8009.

A full review of the code, data and deployment as of 2026-10-17 is in
[REVIEW-2026-10-17.md](REVIEW-2026-10-17.md). Start there for known bugs
and the recommended order of work.

## Running it

```bash
cp .env.example .env   # if you have no .env yet; fill in the values
docker compose up -d --build
```

Then open <http://localhost:8009>. Health check: `GET /api/health`.

The container runs as the unprivileged `node` user (uid 1000). The host
directory `./data` is bind-mounted to `/data` inside the container and
must be writable by uid 1000, including the SQLite files inside it:

```bash
sudo chown -R 1000:1000 ./data
```

Do this **before** rebuilding an existing deployment whose database was
created by an older, root-running image, or the container will fail to
open `characters.db`.

For local development without Docker:

```bash
cd app && npm ci && PORT=8009 DATA_DIR=../data node server/index.js
```

## Live edits vs. rebuilds

`docker-compose.yml` bind-mounts `./app/public` into the container
**read-only**, over the copy baked into the image.

- **Frontend** (`app/public/**`: `index.html`, `js/app.js`, `js/data.js`,
  `js/tarot.js`, `css/style.css`, `data/wonders.json`, images): edits on
  the host are served immediately. Bump the `?v=` query strings in
  `index.html` so browsers pick up changed JS/CSS.
- **Server** (`app/server/**`, `app/package*.json`, `Dockerfile`): the
  image must be rebuilt and the container recreated:

  ```bash
  docker compose build && docker compose up -d
  ```

### Minified assets

The Dockerfile has a first stage that runs `app/scripts/build-dist.js`
(esbuild) over `js/app.js`, `js/data.js`, `js/tarot.js` and
`css/style.css` and bakes the minified copies, with source maps, into
`/app/dist` in the image. `app/server/dist-static.js` serves a minified
copy at the source's URL only while the source file is byte-for-byte the
one it was built from (size and sha256 are recorded in
`dist/manifest.json`), so:

- the minified copies apply **only inside the image**, after
  `docker compose build`; they never exist on the host and are git-ignored;
- a host edit to any of those four files under the read-only bind mount is
  served as source immediately, exactly as before, until the next rebuild
  restores the minified version;
- `cd app && node server/index.js` (no `dist/`) always serves source.

Transfer sizes before gzip: 1.27 MB of JS+CSS → 0.9 MB minified. The
reverse proxy in front of the container should still gzip or brotli these
responses (the Express app does not compress); that is worth more than
minification (1.27 MB → about 290 KB).

## Configuration (`.env`)

`.env` is loaded by compose via `env_file` and is git-ignored. Never
commit it. Keys the server reads:

| Key | Purpose |
|---|---|
| `SESSION_SECRET` | Required. Signs session cookies. |
| `SESSION_SECURE` | Set to `true` behind HTTPS so cookies are `Secure`. |
| `RESEND_API_KEY` | Resend API key for password-reset and feedback email. |
| `MAIL_FROM` | From address for outgoing email. |
| `APP_URL` | Public base URL used in emailed links. |
| `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Optional. Seed the first admin account on an empty database. Set `ADMIN_PASSWORD`; the fallback is weak. |

`PORT`, `DATA_DIR` and `NODE_ENV` are set in `docker-compose.yml`.

## What is not in git

See `.gitignore`. In short:

- `.env` and `data/` (secrets and the production database).
- `Mage 20th Anniversary Edition.pdf` and the `*_section.txt` /
  `chapter6_full.txt` pdftotext dumps used to extract game data.
- **Tarot card art**, `app/public/tarot/*.png`: 79 PNGs totalling about
  280 MB, 29 of them over 5 MB. Only `cardback.png` is committed so a
  fresh clone renders. To restore the rest, copy the directory from the
  production host (`/opt/M20/app/public/tarot/`) or a backup. If you
  would rather version it, install git-lfs and run
  `git lfs track "app/public/tarot/*.png"`, remove the ignore rule, and
  commit the files.
- **Tarot WebP derivatives**, `app/public/tarot/webp/` (800 px tall faces,
  ≤ 300 KB) and `app/public/tarot/thumb/` (400 px tall, ≤ 60 KB): what the
  browser actually downloads for a reading. Regenerate them after restoring
  the PNGs:

  ```bash
  python3 tools/make_tarot_derivatives.py      # needs Pillow; --force to redo all
  ```

  `js/tarot.js` falls back to the PNGs if a derivative is missing, so the
  app still works without this step, just slowly.
- `app/dist/`: minified frontend, built only inside the Docker image (see
  "Minified assets").
- `_attic/`: files that were confirmed unreferenced and retired on
  2026-10-18 (old frontend copies, duplicate server modules, one-off
  `patch_*.py` scripts). Kept on disk for recovery, not in git.
- `*.bak-*` and `*.orig` working copies.

## Tests

```bash
cd app && npm test
```

Runs `node --check` over every live server and frontend JS file as a
syntax gate. There are no behavioural tests yet; see the review.

## Layout

```
app/
  package.json, package-lock.json
  server/        Express app: index.js, db.js, routes/*.js, rotes-seed.json
  public/        Static frontend: index.html, manifest.webmanifest, js/, css/, data/,
                 img/ (logos, icons), images/, tarot/ (+ webp/, thumb/ derivatives)
  scripts/       check-syntax.js (npm test), build-dist.js (Dockerfile minify stage)
data/            SQLite database (bind-mounted, git-ignored)
tools/           Data-cleanup scripts and their reports
Dockerfile, docker-compose.yml
REVIEW-2026-10-17.md
```

## Image tools

`tools/make_tarot_derivatives.py` (Pillow) writes the WebP tarot
derivatives described above; it skips cards whose derivative is newer than
the PNG. The logos and icons in `app/public/img/` were made once with
ImageMagick from the PNGs in `app/public/` (`chantry-logo.png` 64 px and
128 px tall, `darkpack_logo2.png` 180/360 px, `darrell_cartoon.png`
200/400 px wide, `mage20.png` 64/128 px; the manifest and Apple touch icons
are the sigil cropped from the left 470×408 px of the Chantry logo on
`#0d0d14`). `index.html` references the WebPs through `<picture>` with the
PNGs as fallback.

## Game-data tools

The rote and wonder data were extracted from PDFs and are cleaned by
repeatable scripts in `tools/` (Python 3, no third-party packages;
`pdftotext` from poppler for the grimoire):

```bash
python3 tools/clean_wonders.py   # app/public/data/wonders.json  (original kept as .orig)
python3 tools/clean_rotes.py     # app/server/rotes-seed.json    (original kept as .orig)
```

`clean_rotes.py` rebuilds the seed from `rotes-seed.json.orig` and then, if
`Enlightened-grimoire.pdf` (Charles Siegel's compiled rote collection, the
document the seed came from) is present in the project root, calls
`tools/enrich_rotes_from_grimoire.py` to replace the truncated descriptions
with the full text and add every alternate source citation. The PDF is
git-ignored; without it the seed is still cleaned, just with the short
descriptions. Both scripts take `--dry-run` and write a before/after report
to `tools/reports/`. Hand corrections belong in the scripts' fix tables, not
in the JSON, so a re-run never loses them.

`app/server/db.js` syncs the `rotes` table from the seed on startup by
`seed_key` (no destructive drop), so a changed seed takes effect on the next
rebuild.
