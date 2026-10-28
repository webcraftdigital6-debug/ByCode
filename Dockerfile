# Docker-образ BlocklyCode для Dokploy (и любого другого Docker-хоста).
#
# Один контейнер = весь продукт: Express раздаёт собранный фронтенд (app/dist)
# и API. Этапы:
#   1. frontend   — npm-зависимости app/, webpack-сборка в app/dist;
#   2. server-deps— только prod-зависимости корня (express, nodemailer…);
#   3. runtime    — копия сервера + собранный фронт, запуск от непривилегированного
#      пользователя, данные в /data (тома, см. docker-compose.yml).
#
# Нативных модулей нет: SQLite подключён через встроенный node:sqlite
# (server/store.js), поэтому image-слой — обычный node:22-slim.

# ---------- 1. Сборка фронтенда ----------
FROM node:22-slim AS frontend
WORKDIR /src/app
# .npmrc обязателен на этом шаге: в нём legacy-peer-deps=true для плагина
# multiselect, иначе npm ci падает на peer blockly >=11 <12.
COPY app/package.json app/package-lock.json app/.npmrc ./
RUN npm ci --no-audit --no-fund
COPY app/ ./
COPY solutions/ /src/solutions
RUN npm run build

# ---------- 2. Prod-зависимости сервера ----------
FROM node:22-slim AS server-deps
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# ---------- 3. Рантайм ----------
FROM node:22-slim AS runtime

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4000 \
    DATA_DIR=/data

WORKDIR /app

COPY --from=server-deps /src/node_modules ./node_modules
COPY --from=server-deps /src/package.json ./package.json
COPY server/ ./server/
COPY scripts/ ./scripts/
COPY --from=frontend /src/app/dist ./app/dist

# /data принадлежит тому же пользователю, что и контейнер, иначе том с
# bind-mount правится на хосте вручную (в docker-compose используется named volume).
RUN mkdir -p /data && chown -R node:node /data /app
USER node

EXPOSE 4000

# Проверка готовности: тот же эндпоинт, что healthCheckPath у прежнего render.yaml.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/feedback/types').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/index.js"]
