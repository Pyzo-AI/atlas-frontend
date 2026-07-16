# Use the official Node.js 20 Alpine image as base
FROM node:20-alpine AS base

# Build arguments for environment variables
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_LOGIN_BASE_URL
ARG NEXT_PUBLIC_LIVEKIT_API_URL

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# CHANGED: removed .npmrc from COPY — it's never committed to the repo, so this always failed.
# It's now generated inside the RUN step below using a mounted build secret instead.
COPY package.json package-lock.json* ./
# CHANGED: token is mounted as an ephemeral env var (never written to an image layer) and used
# to build .npmrc on the fly, then the file is removed before the layer is committed.
RUN --mount=type=secret,id=npm_token,env=NPM_TOKEN,required=true \
  echo "@esmagico:registry=https://npm.pkg.github.com/" > .npmrc && \
  echo "//npm.pkg.github.com/:_authToken=$NPM_TOKEN" >> .npmrc && \
  if [ -f package-lock.json ]; then npm ci --only=production; \
  else echo "No lockfile found, using npm install..." && npm install --only=production; \
  fi && \
  rm -f .npmrc

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
# CHANGED: same as above — .npmrc removed from COPY, generated via secret mount instead
COPY package.json package-lock.json* ./
RUN --mount=type=secret,id=npm_token,env=NPM_TOKEN,required=true \
  echo "@esmagico:registry=https://npm.pkg.github.com/" > .npmrc && \
  echo "//npm.pkg.github.com/:_authToken=$NPM_TOKEN" >> .npmrc && \
  if [ -f package-lock.json ]; then npm ci; \
  else echo "No lockfile found, using npm install..." && npm install; \
  fi && \
  rm -f .npmrc
COPY . .

# Set build arguments as environment variables for the build process
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_LOGIN_BASE_URL
ARG NEXT_PUBLIC_LIVEKIT_API_URL
ARG NEXT_PUBLIC_KEYCLOAK_BASE_URL
ARG NEXT_PUBLIC_KEYCLOAK_REALM
ARG NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
ARG NEXT_PUBLIC_REDIRECT_URI
ARG NEXT_PUBLIC_KEYCLOAK_CLIENT_SECRET
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_LOGIN_BASE_URL=$NEXT_PUBLIC_LOGIN_BASE_URL
ENV NEXT_PUBLIC_LIVEKIT_API_URL=$NEXT_PUBLIC_LIVEKIT_API_URL
ENV NEXT_PUBLIC_KEYCLOAK_BASE_URL=$NEXT_PUBLIC_KEYCLOAK_BASE_URL
ENV NEXT_PUBLIC_KEYCLOAK_REALM=$NEXT_PUBLIC_KEYCLOAK_REALM
ENV NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=$NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
ENV NEXT_PUBLIC_REDIRECT_URI=$NEXT_PUBLIC_REDIRECT_URI
ENV NEXT_PUBLIC_KEYCLOAK_CLIENT_SECRET=$NEXT_PUBLIC_KEYCLOAK_CLIENT_SECRET

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
