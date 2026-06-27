#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

if [[ ! -f .env ]]; then
  echo "Missing .env. Copy .env.example and configure production values." >&2
  exit 1
fi

mkdir -p data/mongo data/rabbitmq data/minio data/letsencrypt data/certbot-www

if [[ "${CREATE_SWAP:-false}" == "true" && ! -f /swapfile ]]; then
  echo "Creating 2G swap file..."
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
fi

node scripts/rewrite-prod-uris.mjs --input .env --output .env.prod.override

set -a
source .env
set +a

REGISTRY="${REGISTRY:-ghcr.io}"
IMAGE_NAMESPACE="${IMAGE_NAMESPACE:-growthpath}"
TAG="${TAG:-latest}"

docker pull "${REGISTRY}/${IMAGE_NAMESPACE}/${IMAGE_PREFIX:-growthpath}-api:${TAG}"
docker pull "${REGISTRY}/${IMAGE_NAMESPACE}/${IMAGE_PREFIX:-growthpath}-worker:${TAG}"
docker pull "${REGISTRY}/${IMAGE_NAMESPACE}/${IMAGE_PREFIX:-growthpath}-ui:${TAG}"

docker tag mongo:7 "${REGISTRY}/${IMAGE_NAMESPACE}/mongo:7" 2>/dev/null || docker pull mongo:7
docker tag rabbitmq:3-management "${REGISTRY}/${IMAGE_NAMESPACE}/rabbitmq:3-management" 2>/dev/null || docker pull rabbitmq:3-management
docker tag minio/minio:latest "${REGISTRY}/${IMAGE_NAMESPACE}/minio:latest" 2>/dev/null || docker pull minio/minio:latest

docker compose -f docker-compose.prod.yml --env-file .env --env-file .env.prod.override up -d

echo "Production stack deployed."
