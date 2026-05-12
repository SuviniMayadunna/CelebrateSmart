# ─── Stage 1: Builder ────────────────────────────────────────────────
FROM node:20-bullseye-slim AS builder

WORKDIR /app

# Install dependencies (including dev for building)
COPY package*.json ./
RUN npm ci

# Copy Prisma schema first so generate works
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source and compile TypeScript
COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

# Prune devDependencies for lean production image
RUN npm prune --production

# ─── Stage 2: Production ─────────────────────────────────────────────
FROM node:20-bullseye-slim AS production

WORKDIR /app

# Install system deps needed by Prisma + healthchecks
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    dumb-init \
    openssl \
    wget \
  && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Copy only what's needed from builder
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/prisma ./prisma
COPY --chown=appuser:appgroup package*.json ./

# Switch to non-root user
USER appuser

EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

# Run migrations then start server
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
