FROM node:20-alpine

# Install build deps for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy and install dependencies
COPY app/package*.json ./
RUN npm install --production

# Copy application source
COPY app/ .

# Data directory for SQLite database (mount as volume)
RUN mkdir -p /data
ENV DATA_DIR=/data
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server/index.js"]
