#!/bin/bash
# Simple SQL dump backup script
# Usage: ./backup-sql-dump.sh

if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not set!"
    echo "Set it with: export DATABASE_URL='your_database_url'"
    exit 1
fi

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="backups/sql-dump-${TIMESTAMP}.sql"

mkdir -p backups

echo "🔄 Creating SQL dump backup..."
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup created: $BACKUP_FILE"
    echo "📊 File size: $(du -h $BACKUP_FILE | cut -f1)"
else
    echo "❌ Backup failed!"
    exit 1
fi
