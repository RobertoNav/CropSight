#!/bin/sh
set -e

echo "Running database migrations..."
attempts=0
until alembic upgrade head; do
  attempts=$((attempts + 1))
  if [ "$attempts" -ge 10 ]; then
    echo "Migrations failed after $attempts attempts, giving up"
    exit 1
  fi
  echo "Migration attempt $attempts failed, retrying in 10s..."
  sleep 10
done

echo "Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
