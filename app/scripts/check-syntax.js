#!/usr/bin/env node
// Syntax gate: run `node --check` on every live JS file.
// Live = server/**/*.js and public/js/*.js, skipping *.bak-* / *.orig copies.
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dirs = ['server', 'server/routes', 'public/js', 'scripts'];

const files = [];
for (const d of dirs) {
  const abs = path.join(root, d);
  if (!fs.existsSync(abs)) continue;
  for (const name of fs.readdirSync(abs).sort()) {
    if (!name.endsWith('.js')) continue;           // excludes .js.bak-*, .js.orig
    if (fs.statSync(path.join(abs, name)).isFile()) files.push(path.join(d, name));
  }
}

let failed = 0;
for (const rel of files) {
  try {
    execFileSync(process.execPath, ['--check', path.join(root, rel)], { stdio: ['ignore', 'ignore', 'pipe'] });
    console.log(`ok    ${rel}`);
  } catch (err) {
    failed++;
    console.log(`FAIL  ${rel}`);
    process.stdout.write(String(err.stderr || err.message) + '\n');
  }
}

console.log(`\n${files.length - failed}/${files.length} files passed node --check`);
process.exit(failed ? 1 : 0);
