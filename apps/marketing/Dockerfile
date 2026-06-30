# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/marketing/package.json ./apps/marketing/

RUN npm ci --workspace=@growthpath/marketing --include-workspace-root

COPY tsconfig.base.json ./
COPY apps/marketing ./apps/marketing

RUN npm run build --workspace=@growthpath/marketing

FROM nginx:1.27-alpine
RUN apk add --no-cache certbot openssl bash curl gettext

COPY apps/marketing/nginx.conf.template /etc/nginx/templates/nginx.conf.template
COPY apps/marketing/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

COPY --from=build /app/apps/marketing/dist /usr/share/nginx/html

EXPOSE 80 443
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
