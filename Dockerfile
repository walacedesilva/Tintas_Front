# ── Stage 1: Build ───────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Instala o Tailwind CLI v4 (pacote separado do tailwindcss core)
RUN npm install -D @tailwindcss/cli --legacy-peer-deps

COPY . .

# Pré-compila o CSS com a CLI do Tailwind (scan correto dos templates)
RUN ./node_modules/.bin/tailwindcss -i src/styles.css -o src/styles-compiled.css --minify

# Substitui styles.css pelo CSS já compilado e desabilita PostCSS Tailwind
RUN cp src/styles-compiled.css src/styles.css && \
    printf 'export default { plugins: {} };\n' > postcss.config.mjs

RUN npm run build -- --configuration production

# ── Stage 2: Serve ───────────────────────────────────────────────
FROM nginx:1.27-alpine AS final
COPY --from=build /app/dist/frontend-angular/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
