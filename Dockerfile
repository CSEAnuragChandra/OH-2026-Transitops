FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable
RUN corepack prepare pnpm@10 --activate

FROM base AS deps
WORKDIR /src/app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /src/app
COPY --from=deps /src/app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build

FROM base AS runner
WORKDIR /src/app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /src/app/public ./public
COPY --from=builder /src/app/.next ./.next
COPY --from=builder /src/app/node_modules ./node_modules
COPY --from=builder /src/app/package.json ./package.json
COPY --from=builder /src/app/next.config.ts ./next.config.ts
COPY --from=builder /src/app/prisma ./prisma

EXPOSE 3000

CMD ["pnpm", "exec", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
