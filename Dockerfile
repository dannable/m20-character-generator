# ── Stage 1: minify the frontend ─────────────────────────────────────────────
# Writes dist/js/*.js, dist/css/style.css (+ source maps) and dist/manifest.json;
# server/dist-static.js serves these in place of the source files while the
# bind-mounted source is unchanged. esbuild stays out of the runtime image.
FROM node:20-alpine AS minify
WORKDIR /build
COPY app/public/js ./public/js
COPY app/public/css ./public/css
COPY app/scripts/build-dist.js ./scripts/build-dist.js
RUN npm install --no-save --no-audit --no-fund esbuild@0.24.2 \
 && node scripts/build-dist.js public dist

# ── Stage 2: runtime image ───────────────────────────────────────────────────
FROM node:20-alpine

# Build deps for better-sqlite3 (falls back to compiling if no prebuilt binary)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install exactly what package-lock.json pins; fails if lock and package.json disagree
COPY app/package.json app/package-lock.json ./
RUN npm ci --omit=dev

# Copy application source (app/public is bind-mounted read-only over this at runtime)
COPY --chown=node:node app/ .
# Minified frontend from stage 1, outside public/ so the bind mount does not hide it
COPY --from=minify --chown=node:node /build/dist ./dist

# Data directory for the SQLite database. docker-compose.yml bind-mounts
# ./data here, so the HOST directory and its *.db* files must be owned by
# uid 1000 (the `node` user) for the container to write:
#   sudo chown -R 1000:1000 /opt/M20/data
RUN mkdir -p /data && chown node:node /data
ENV DATA_DIR=/data
ENV NODE_ENV=production
# Default matches docker-compose.yml; override with PORT at runtime
ENV PORT=8009

EXPOSE 8009

# Shell form so ${PORT} is expanded at runtime
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- "http://127.0.0.1:${PORT:-8009}/api/health" || exit 1

USER node

CMD ["node", "server/index.js"]
