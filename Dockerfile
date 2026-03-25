# ---- base: system deps shared across all stages ----
FROM node:20-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates \
      ffmpeg \
      curl \
      python3 \
      make \
      g++ \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
         -o /usr/local/bin/yt-dlp \
    && chmod +x /usr/local/bin/yt-dlp \
    && rm -rf /var/lib/apt/lists/*

# ---- deps: install node_modules ----
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- builder: compile the app ----
FROM deps AS builder
WORKDIR /app
COPY . .
RUN npm run build

# ---- runner: minimal final image ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Standalone output includes the minimal Node server + all server-side code
COPY --from=builder /app/.next/standalone ./
# Static assets and public files are not included in standalone — copy separately
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
