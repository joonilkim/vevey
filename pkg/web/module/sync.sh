#!/bin/bash
set -e

# Sync new assets
aws s3 sync ${DIRECTORY} \
  s3://${BUCKET}/ \
    --no-progress \
    --exclude "*.html" \
    --cache-control "public, max-age=31536000"

# Delete old assets
aws s3 sync ${DIRECTORY} \
  s3://${BUCKET}/ \
    --delete --no-progress \
    --exclude "*.html" \
    --cache-control "public, max-age=31536000"
