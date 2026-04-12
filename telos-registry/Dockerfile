# telos-registry — production image with Stellar CLI on PATH for on-chain mode.
# Build context: this directory (telos-registry/).
#
# Render: create a Web Service → Docker, set root to repo folder containing this file,
# Dockerfile path `telos-registry/Dockerfile`, and the same env vars as local on-chain
# (TELOS_REGISTRY_CONTRACT_ID, TELOS_REGISTRY_SOURCE_ACCOUNT, TELOS_REGISTRY_SIGNER_SECRET, …).

# ── Build TypeScript ─────────────────────────────────────────
FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN pnpm run build

# ── Runtime: Node + stellar (required for storage=onchain) ───
FROM node:22-bookworm-slim

ARG STELLAR_CLI_VERSION=23.4.0
ENV NODE_ENV=production

# stellar-cli links libdbus (not present in -slim by default)
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl libdbus-1-3 \
  && curl -fsSL "https://github.com/stellar/stellar-cli/releases/download/v${STELLAR_CLI_VERSION}/stellar-cli-${STELLAR_CLI_VERSION}-x86_64-unknown-linux-gnu.tar.gz" \
    | tar -xz -C /usr/local/bin \
  && chmod +x /usr/local/bin/stellar \
  && stellar --version \
  && apt-get purge -y curl \
  && apt-get autoremove -y \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist

EXPOSE 4010

CMD ["node", "dist/index.js"]
