#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${ROOT_DIR}"

REGISTRY="${REGISTRY:-ghcr.io}"
IMAGE_NAMESPACE="${IMAGE_NAMESPACE:-growthpath}"
IMAGE_PREFIX="${IMAGE_PREFIX:-growthpath}"
TAG="${TAG:-$(git rev-parse --short HEAD 2>/dev/null || echo latest)}"
PUSH="${PUSH:-false}"
PUSH_LATEST="${PUSH_LATEST:-true}"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"

if [[ "${PUSH}" != "true" ]]; then
  case "$(uname -m)" in
    arm64 | aarch64) PLATFORMS="linux/arm64" ;;
    *) PLATFORMS="linux/amd64" ;;
  esac
fi

docker buildx create --use --name growthpath-builder 2>/dev/null || docker buildx use growthpath-builder

build_image() {
  local name="$1"
  local dockerfile="$2"
  local context="${ROOT_DIR}"
  local image="${REGISTRY}/${IMAGE_NAMESPACE}/${IMAGE_PREFIX}-${name}"
  local tags=(--tag "${image}:${TAG}")
  local output_flags=(--load)
  if [[ "${PUSH_LATEST}" == "true" ]]; then
    tags+=(--tag "${image}:latest")
  fi
  if [[ "${PUSH}" == "true" ]]; then
    output_flags=(--push)
  fi

  docker buildx build \
    --platform "${PLATFORMS}" \
    "${tags[@]}" \
    --file "${dockerfile}" \
    "${output_flags[@]}" \
    "${context}"
}

build_image api apps/api/Dockerfile
build_image worker apps/worker/Dockerfile
build_image ui apps/ui/Dockerfile

echo "Built app images with tag ${TAG}"
