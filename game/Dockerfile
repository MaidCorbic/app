FROM node:24.14.0-slim AS base

# The Node component lives in /app/game. Keep this absolute so CI cannot
# accidentally resolve WORKDIR against the repository root.
ENV APP_DIR=/app/game

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PNPM_HOME/bin:$PATH"
ENV CI=true
ENV PNPM_CONFIG_MINIMUM_RELEASE_AGE=0
ENV PNPM_CONFIG_STRICT_DEP_BUILDS=false

FROM base AS deps
COPY . /app
WORKDIR /app/game

# Install dependencies from the actual game manifest. The repository root
# intentionally does not contain a package.json.
RUN if [ -f package-lock.json ]; then npm ci || npm install; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile || yarn install; \
    elif [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile || pnpm install; \
    elif [ -f package.json ]; then npm install; \
    else echo "No Node package manifest found in /app/game"; exit 1; fi

FROM base AS builder
COPY . /app
WORKDIR /app/game
COPY --from=deps /app/game/node_modules ./node_modules

RUN if [ -f package-lock.json ]; then npm run build; \
    elif [ -f yarn.lock ]; then yarn run build; \
    elif [ -f pnpm-lock.yaml ]; then pnpm run build; \
    elif [ -f package.json ]; then npm run build; \
    else echo "No Node package manifest found in /app/game"; exit 1; fi

FROM base AS runner
COPY --from=builder --chown=1000:1000 /app /app
WORKDIR /app/game

ENV NODE_ENV=production
USER 1000:1000
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
