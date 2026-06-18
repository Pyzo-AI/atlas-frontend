# Use the official Node.js 18 Alpine image as base
FROM node:18-alpine AS base

# Build arguments for environment variables
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_LOGIN_BASE_URL
ARG NEXT_PUBLIC_LIVEKIT_API_URL

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* .npmrc ./
RUN \
  if [ -f package-lock.json ]; then npm ci --only=production; \
  else echo "No lockfile found, using npm install..." && npm install --only=production; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* .npmrc ./
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  else echo "No lockfile found, using npm install..." && npm install; \
  fi
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
