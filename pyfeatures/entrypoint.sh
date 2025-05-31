#!/bin/bash
set -e  # Exit immediately if any command fails

echo "Starting PyFeatures Django Server..."

# Log startup time
LOG_FILE="/app/logs/auth.log"
TIMESTAMP=$(date)
echo "$TIMESTAMP - Container started" >> "$LOG_FILE"

# Ensure proper permissions for logs (especially when mounted volumes are strict)
chown -R django_user:django_user /app/logs
chmod -R u+rwX /app/logs

# Run Gunicorn server
exec gunicorn --workers=4 --threads=3 --timeout=120 --bind 0.0.0.0:8000 PyFeatures.wsgi:application
