#!/bin/sh
set -e

# Run schema push with retries
MAX_RETRIES=3
RETRY=0
until bun run --cwd apps/api db:push; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "ERROR: db:push failed after $MAX_RETRIES attempts"
    exit 1
  fi
  echo "db:push failed (attempt $RETRY/$MAX_RETRIES), retrying in 3s..."
  sleep 3
done

# Hand off to CMD (the server)
exec "$@"
