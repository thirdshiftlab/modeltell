# Modeltell — static frontend image for Coolify (or any Docker host).
#
# Build context MUST be the repo root: the frontend's data-sync step reads the
# repo-root published/ directory (../../published) at build time.
#
#   docker build -t modeltell .
#   docker run -p 8080:80 modeltell   →  http://localhost:8080
#
# Coolify: Build Pack = Dockerfile, Base Directory = / , Dockerfile = ./Dockerfile

# ---- Build stage ----------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# Published dataset — consumed by frontend/scripts/sync-data.mjs (../../published)
COPY published ./published

# Build-time config (Vite inlines VITE_* at build). In Coolify, set these as
# env vars with "Build Variable" enabled — Coolify passes them as --build-args,
# and the ARG/ENV below make them visible to `vite build`. All are PUBLIC values
# (a public Brevo form URL and a public Umami website id) — no secrets here.
ARG VITE_BREVO_FORM_URL=""
ARG VITE_UMAMI_WEBSITE_ID=""
ARG VITE_UMAMI_SRC="https://analytics.modeltell.com/script.js"
ENV VITE_BREVO_FORM_URL=$VITE_BREVO_FORM_URL \
    VITE_UMAMI_WEBSITE_ID=$VITE_UMAMI_WEBSITE_ID \
    VITE_UMAMI_SRC=$VITE_UMAMI_SRC

# Frontend app + install (lockfile-exact) + build (runs prebuild sync + vite build)
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm ci
RUN npm run build

# ---- Runtime stage --------------------------------------------------------
FROM nginx:alpine AS runtime
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
