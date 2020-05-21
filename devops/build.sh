#!/bin/bash
################################################################################
## Usage:
##  dshop_backend_build.sh <tag>
################################################################################

PWD="$(pwd)"
DIR="$(realpath "$(dirname "${BASH_SOURCE[0]}")")"
CONTEXT="$(realpath $DIR/..)"
PROJECT_ID="origin-214503"
DOCKERFILE="$DIR/Dockerfile"
NAME="dshop-backend"
NAMESPACE="experimental"
TAG=$(date +'%Y%m%d%H%M%s')

if [[ -z "$ENVKEY" ]]; then
  # Not really currently used but might be in the future
  echo "INFO: ENVKEY is not defined"
fi

# Use arg as tag if given
if [[ -n "$1" ]]; then
  TAG="$1"
fi

echo "CONTEXT: $CONTEXT"

# TODO: Remove above and --no-cache
docker build \
    -f "$DOCKERFILE" \
    -t "gcr.io/$PROJECT_ID/$NAMESPACE/$NAME:$TAG" \
    --build-arg ENVKEY="$ENVKEY" \
    $CONTEXT && \
gcloud auth configure-docker && \
docker push "gcr.io/$PROJECT_ID/$NAMESPACE/$NAME:$TAG" && \
gcloud container images add-tag \
    "gcr.io/$PROJECT_ID/$NAMESPACE/$NAME:$TAG" \
    "gcr.io/$PROJECT_ID/$NAMESPACE/$NAME:latest" \
    --quiet

if [[ $? -ne "0" ]]; then
  echo "Build failed"
  exit 1
fi

cd $PWD
