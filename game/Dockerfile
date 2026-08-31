FROM node:24.14.0-slim AS base

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PNPM_HOME/bin:$PATH"
ENV CI=true
ENV PNPM_CONFIG_MINIMUM_RELEASE_AGE=0
ENV PNPM_CONFIG_STRICT_DEP_BUILDS=false

# Diploi invokes this Dockerfile with the repository root as the build context.
# Copy the game component explicitly so /app/game is deterministic and the
# root package-lock.json can never be selected by the Node build.
FROM base AS deps
WORKDIR /app/game
COPY game/package.json game/package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app/game
COPY game/package.json game/package-lock.json ./
COPY game/ ./
COPY --from=deps /app/game/node_modules ./node_modules
RUN npm run build

FROM base AS runner
COPY --from=builder --chown=1000:1000 /app/game /app/game
WORKDIR /app/game

ENV NODE_ENV=production
USER 1000:1000
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# CI trigger: verify the deterministic game build context.
CMD ["npm", "start"]
