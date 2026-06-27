#!/usr/bin/env bash
set -euo pipefail

: "${DEFAULT_DOMAIN:=growthpath.example.com}"
: "${CERTBOT_EMAIL:=admin@example.com}"

render_nginx_config() {
  envsubst '${DEFAULT_DOMAIN}' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf
}

ensure_self_signed_cert() {
  local cert_dir="/etc/letsencrypt/live/${DEFAULT_DOMAIN}"
  if [[ ! -f "${cert_dir}/fullchain.pem" ]]; then
    mkdir -p "${cert_dir}"
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
      -keyout "${cert_dir}/privkey.pem" \
      -out "${cert_dir}/fullchain.pem" \
      -subj "/CN=${DEFAULT_DOMAIN}"
  fi
}

bootstrap_certbot() {
  if [[ "${ENABLE_CERTBOT:-false}" == "true" ]]; then
    certbot certonly --webroot -w /var/www/certbot \
      --email "${CERTBOT_EMAIL}" \
      --agree-tos --no-eff-email \
      -d "${DEFAULT_DOMAIN}" || true
  fi
}

ensure_self_signed_cert
render_nginx_config
bootstrap_certbot
render_nginx_config

if [[ "${ENABLE_CERTBOT:-false}" == "true" ]]; then
  (
    while true; do
      sleep 12h
      certbot renew --quiet || true
      render_nginx_config
      nginx -s reload || true
    done
  ) &
fi

exec "$@"
