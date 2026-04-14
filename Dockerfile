# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Accept build-time env vars (optional overrides)
ARG VITE_API_BASE=https://api.wolflogic-ai.com
ARG VITE_AUTH0_DOMAIN=wolflogic-ai.us.auth0.com
ARG VITE_AUTH0_CLIENT_ID=XwEDQX2h1lGRbcQek1OTodDdPmgI8Sl7
ARG VITE_AUTH0_AUDIENCE=https://api.wolflogic-ai.com

ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_AUTH0_DOMAIN=$VITE_AUTH0_DOMAIN
ENV VITE_AUTH0_CLIENT_ID=$VITE_AUTH0_CLIENT_ID
ENV VITE_AUTH0_AUDIENCE=$VITE_AUTH0_AUDIENCE

RUN npm run build

# ── Stage 2: Serve ───────────────────────────────────────────────────────────
FROM nginx:alpine

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx config: SPA fallback (all routes → index.html)
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    gzip on;\n\
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
