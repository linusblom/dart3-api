#!/bin/sh

set -e

cd sql
node ../node_modules/.bin/pg-migrator $DATABASE_URL
cd ..

DEVELOPMENT="development"

if [[ "$ENV" == "$DEVELOPMENT" ]]; then
  yarn start
else
  node dist/app.js
fi
