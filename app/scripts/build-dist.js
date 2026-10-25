#!/usr/bin/env node
// Deploy-time minification (run by the Dockerfile; never against the live tree).
//
//   node scripts/build-dist.js <publicDir> <distDir>
//
// Writes minified copies of js/app.js, js/data.js, js/tarot.js and css/style.css,
// each with a source map, into <distDir> at the same relative paths, plus
// <distDir>/manifest.json recording the size and sha256 of the source each copy
// was built from. server/dist-static.js serves a copy only while its source still
// matches, so a host edit to the bind-mounted app/public is never shadowed by a
// stale minified file. Requires esbuild on the module path (the Dockerfile
// installs it in the build stage only).
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const esbuild = require('esbuild');

const [,, publicArg, distArg] = process.argv;
if (!publicArg || !distArg) {
  console.error('usage: build-dist.js <publicDir> <distDir>');
  process.exit(2);
}
const publicDir = path.resolve(publicArg);
const distDir = path.resolve(distArg);
const FILES = ['js/app.js', 'js/data.js', 'js/tarot.js', 'css/style.css'];

(async () => {
  const manifest = {};
  for (const rel of FILES) {
    const src = path.join(publicDir, rel);
    const out = path.join(distDir, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await esbuild.build({
      entryPoints: [src],
      outfile: out,
      minify: true,
      sourcemap: true,          // external .map next to the file, linked by sourceMappingURL
      target: rel.endsWith('.css') ? undefined : ['es2020'],
      logLevel: 'warning',
      charset: 'utf8',
    });
    const buf = fs.readFileSync(src);
    manifest['/' + rel] = { size: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') };
    console.log(`${rel.padEnd(14)} ${(buf.length / 1024).toFixed(0).padStart(5)} KB -> ${(fs.statSync(out).size / 1024).toFixed(0).padStart(5)} KB`);
  }
  fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
})().catch(err => { console.error(err); process.exit(1); });
