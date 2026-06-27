# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/ui/package.json ./apps/ui/
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci --workspace=@growthpath/ui --include-workspace-root

COPY tsconfig.base.json ./
COPY apps/ui ./apps/ui
COPY packages/config ./packages/config
COPY packages/shared ./packages/shared

RUN npm run build --workspace=@growthpath/config && \
    npm run build --workspace=@growthpath/shared && \
    npm run build --workspace=@growthpath/ui

FROM nginx:1.27-alpine
RUN apk add --no-cache certbot certbot-nginx openssl bash curl

COPY apps/ui/nginx.conf.template /etc/nginx/templates/nginx.conf.template
COPY apps/ui/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

COPY --from=build /app/apps/ui/dist /usr/share/nginx/html

EXPOSE 80 443
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
