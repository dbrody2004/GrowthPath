#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${ROOT_DIR}"

if [[ ! -f .env ]]; then
  echo "Missing .env. Copy .env.example and configure production values." >&2
  exit 1
fi

mkdir -p data/letsencrypt data/certbot-www

set +u
set -a
source .env
set +a
set -u

REGISTRY="${REGISTRY:-ghcr.io}"
IMAGE_NAMESPACE="${IMAGE_NAMESPACE:-growthpath}"
IMAGE_PREFIX="${IMAGE_PREFIX:-growthpath}"
TAG="${TAG:-latest}"
IMAGE="${REGISTRY}/${IMAGE_NAMESPACE}/${IMAGE_PREFIX}-marketing:${TAG}"

ENV_FILE="$(mktemp)"
trap 'rm -f "${ENV_FILE}"' EXIT
cat > "${ENV_FILE}" <<EOF
IMAGE_REGISTRY=${REGISTRY}
IMAGE_NAMESPACE=${IMAGE_NAMESPACE}
IMAGE_PREFIX=${IMAGE_PREFIX}
TAG=${TAG}
MARKETING_DOMAIN=${MARKETING_DOMAIN:-localseo.davebrody.tech}
MARKETING_CERTBOT_EMAIL=${MARKETING_CERTBOT_EMAIL:-${CERTBOT_EMAIL:-admin@example.com}}
CERTBOT_EMAIL=${MARKETING_CERTBOT_EMAIL:-${CERTBOT_EMAIL:-admin@example.com}}
ENABLE_CERTBOT=${ENABLE_CERTBOT:-true}
EOF

registry_login() {
  if [[ -n "${GITHUB_TOKEN:-}" && -n "${GITHUB_USERNAME:-}" ]]; then
    echo "Logging in to ${REGISTRY}..."
    echo "${GITHUB_TOKEN}" | docker login "${REGISTRY}" -u "${GITHUB_USERNAME}" --password-stdin
  fi
}

print_pull_help() {
  cat >&2 <<EOF
Failed to pull ${IMAGE}.

1. Push the image from your build machine:
     PUSH=true ./build-marketing.sh

2. Authenticate on this server (token needs read:packages):
     echo "\$GITHUB_TOKEN" | docker login ${REGISTRY} -u YOUR_GITHUB_USERNAME --password-stdin

   Or set GITHUB_USERNAME and GITHUB_TOKEN in .env and re-run deploy.

3. Confirm IMAGE_NAMESPACE in .env matches your GitHub username or org
   (not the app name). Example: IMAGE_NAMESPACE=dbrody2004
   Image path: ${IMAGE}

4. Confirm the GHCR package exists at:
     https://github.com/${IMAGE_NAMESPACE}?tab=packages

EOF
}

registry_login

echo "Pulling ${IMAGE}..."
if ! docker pull "${IMAGE}"; then
  print_pull_help
  exit 1
fi

docker compose -f docker-compose.marketing.yml --env-file "${ENV_FILE}" up -d --pull always --no-build

echo "Marketing site deployed."
