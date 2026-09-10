#!/bin/bash
# Update Vercel DATABASE_URL from local .env
set -e

DB_URL=$(grep '^DATABASE_URL=' .env | head -1 | sed 's/^DATABASE_URL="//;s/"$//')

# Write to temp file for @file reference
echo "$DB_URL" > /tmp/vercel_db_url.txt

# Update Vercel environment variable
vercel env update DATABASE_URL @/tmp/vercel_db_url.txt production

# Cleanup
rm -f /tmp/vercel_db_url.txt

echo "Vercel DATABASE_URL updated successfully"