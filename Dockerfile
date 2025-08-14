# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Build the app
FROM base AS builder
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image, copy all files and run
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

# Create a writable data directory and link DB_PATH
RUN mkdir -p /data && chown -R node:node /data
ENV DB_PATH=/data/porchrecords.db

COPY --from=builder /app .
COPY --from=deps /app/node_modules ./node_modules

USER node
EXPOSE 3000
CMD ["npm", "start"]

