// Serve the minified copies that scripts/build-dist.js wrote to dist/, but only
// while each copy still matches its source in public/ (size, then sha256,
// re-checked whenever the source's size or mtime changes). In production
// app/public is bind-mounted read-only over the image's copy, so a host edit to
// app.js or style.css must win over the minified file baked in at build time.
// Without a dist/manifest.json (local development) every request falls through.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');

module.exports = function distStatic(publicDir, distDir) {
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(distDir, 'manifest.json'), 'utf8'));
  } catch {
    return (req, res, next) => next();
  }
  const serveDist = express.static(distDir, { index: false, redirect: false });
  const verdicts = new Map();   // url path -> { key: size:mtime, ok }

  function sourceMatches(urlPath, entry) {
    let st;
    try { st = fs.statSync(path.join(publicDir, urlPath)); } catch { return false; }
    const key = `${st.size}:${st.mtimeMs}`;
    const cached = verdicts.get(urlPath);
    if (cached && cached.key === key) return cached.ok;
    let ok = st.size === entry.size;
    if (ok) {
      const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(publicDir, urlPath))).digest('hex');
      ok = hash === entry.sha256;
    }
    verdicts.set(urlPath, { key, ok });
    return ok;
  }

  return (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    let urlPath;
    try { urlPath = decodeURIComponent(req.path); } catch { return next(); }
    // Source maps live only in dist/ and are harmless to serve even when stale
    const asset = urlPath.endsWith('.map') ? urlPath.slice(0, -4) : urlPath;
    const entry = manifest[asset];
    if (!entry) return next();
    if (asset === urlPath && !sourceMatches(urlPath, entry)) return next();
    serveDist(req, res, next);
  };
};
