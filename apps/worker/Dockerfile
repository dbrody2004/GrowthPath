# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci --workspace=@growthpath/worker --include-workspace-root

COPY tsconfig.base.json ./
COPY apps/worker ./apps/worker
COPY packages/config ./packages/config
COPY packages/shared ./packages/shared

RUN npm run build --workspace=@growthpath/config && \
    npm run build --workspace=@growthpath/shared && \
    npm run build --workspace=@growthpath/worker

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/apps/worker/dist ./dist
COPY --from=build /app/apps/worker/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/config/dist ./node_modules/@growthpath/config/dist
COPY --from=build /app/packages/config/package.json ./node_modules/@growthpath/config/package.json
COPY --from=build /app/packages/shared/dist ./node_modules/@growthpath/shared/dist
COPY --from=build /app/packages/shared/package.json ./node_modules/@growthpath/shared/package.json

CMD ["node", "dist/index.js"]
