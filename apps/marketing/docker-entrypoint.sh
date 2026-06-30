#!/usr/bin/env bash
set -euo pipefail

: "${MARKETING_DOMAIN:=localseo.davebrody.tech}"
: "${CERTBOT_EMAIL:=admin@example.com}"
: "${ENABLE_CERTBOT:=false}"

SELF_SIGNED_DIR="/etc/nginx/ssl"
LE_CERT_DIR="/etc/letsencrypt/live/${MARKETING_DOMAIN}"
SSL_CERT_DIR="${SELF_SIGNED_DIR}"

ensure_self_signed_cert() {
  if [[ ! -f "${SELF_SIGNED_DIR}/fullchain.pem" ]]; then
    mkdir -p "${SELF_SIGNED_DIR}"
    openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
      -keyout "${SELF_SIGNED_DIR}/privkey.pem" \
      -out "${SELF_SIGNED_DIR}/fullchain.pem" \
      -subj "/CN=${MARKETING_DOMAIN}"
    echo "Generated self-signed certificate for ${MARKETING_DOMAIN}"
  fi
}

choose_cert_dir() {
  if [[ -f "${LE_CERT_DIR}/fullchain.pem" && -f "${LE_CERT_DIR}/privkey.pem" ]]; then
    SSL_CERT_DIR="${LE_CERT_DIR}"
  else
    SSL_CERT_DIR="${SELF_SIGNED_DIR}"
  fi
  export SSL_CERT_DIR
}

render_nginx_config() {
  choose_cert_dir
  envsubst '${MARKETING_DOMAIN} ${SSL_CERT_DIR}' \
    < /etc/nginx/templates/nginx.conf.template \
    > /etc/nginx/conf.d/default.conf
}

acquire_letsencrypt_cert() {
  echo "Attempting Let's Encrypt certificate for ${MARKETING_DOMAIN}..."
  if certbot certonly --webroot -w /var/www/certbot \
    --email "${CERTBOT_EMAIL}" \
    --agree-tos --no-eff-email \
    -d "${MARKETING_DOMAIN}" \
    --non-interactive; then
    echo "Let's Encrypt certificate obtained successfully."
    render_nginx_config
    nginx -s reload || true
  else
    echo "Certbot verification failed — continuing with self-signed certificate."
  fi
}

ensure_self_signed_cert
render_nginx_config

if [[ "${ENABLE_CERTBOT}" == "true" ]]; then
  (
    sleep 5
    acquire_letsencrypt_cert
  ) &

  (
    while true; do
      sleep 12h
      certbot renew --quiet --deploy-hook "nginx -s reload" || true
    done
  ) &
fi

exec nginx -g 'daemon off;'
