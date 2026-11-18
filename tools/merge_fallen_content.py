#!/usr/bin/env python3
"""Splice the Book of the Fallen rotes and artifacts into the live data files.

  app/server/rotes-seed.json        <- tools/fallen-src/out-rotes.json
  app/public/data/wonders.json      <- tools/fallen-src/out-wonders.json

Idempotent: every record whose source_book is exactly "M20 Book of the Fallen"
is removed before the new ones are appended, so re-running after a re-extract
replaces rather than duplicates. Note the files already contain records from
"Fallen Tower: Las Vegas", which is a different book and is left alone.

Rotes reach the database through the hash-gated upsert in app/server/db.js,
keyed on seed_key, so no migration is needed — the next server start picks the
new rows up. wonders.json is fetched by the client directly.

Usage:
    python3 tools/merge_fallen_content.py [--dry-run]
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'fallen-src')
BOOK = 'M20 Book of the Fallen'

TARGETS = [
    ('out-rotes.json', os.path.join(ROOT, 'app', 'server', 'rotes-seed.json'), 'rotes'),
    ('out-wonders.json', os.path.join(ROOT, 'app', 'public', 'data', 'wonders.json'), 'wonders'),
]


def main():
    dry = '--dry-run' in sys.argv
    for src_name, target, label in TARGETS:
        with open(os.path.join(SRC, src_name), encoding='utf-8') as f:
            incoming = json.load(f)
        with open(target, encoding='utf-8') as f:
            raw = f.read()
        existing = json.loads(raw)
        # rotes-seed.json has no trailing newline, wonders.json does; keeping each
        # file's own convention keeps the diff to the appended records.
        eol = '\n' if raw.endswith('\n') else ''

        kept = [r for r in existing if r.get('source_book') != BOOK]
        removed = len(existing) - len(kept)

        # Flag a title that also appears from another book, so a genuine
        # duplicate can be reviewed rather than silently doubling up.
        have = {}
        for r in kept:
            have.setdefault(str(r.get('name', '')).lower(), []).append(
                r.get('source_book') or '?')
        clashes = [(r['name'], have[r['name'].lower()])
                   for r in incoming if r['name'].lower() in have]

        merged = kept + incoming
        print(f'{label}: {len(existing)} -> {len(merged)} '
              f'(removed {removed} previous {BOOK}, added {len(incoming)})')
        for name, books in clashes:
            print(f'    note: "{name}" also appears from {", ".join(books)}')

        if dry:
            continue
        with open(target, 'w', encoding='utf-8') as f:
            f.write(json.dumps(merged, indent=2, ensure_ascii=False) + eol)
        print(f'    wrote {os.path.relpath(target, ROOT)}')

    if dry:
        print('\n(dry run — nothing written)')
    else:
        print('\nRestart the server to let db.js re-seed the rotes table.')


if __name__ == '__main__':
    main()
