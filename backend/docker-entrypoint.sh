
#!/bin/sh
set -eu

echo "Waiting for PostgreSQL..."

attempt=1
max_attempts=30

until node -e '
const { Client } = require("pg");

const client = new Client({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT || 5432),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  connectionTimeoutMillis: 3000,
});

client.connect()
  .then(() => client.end())
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
'; do
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "ERROR: PostgreSQL was not reachable after $max_attempts attempts."
    exit 1
  fi

  echo "PostgreSQL not ready ($attempt/$max_attempts). Retrying..."
  attempt=$((attempt + 1))
  sleep 2
done

echo "PostgreSQL is ready."

echo "Running database migrations..."
npm run migration:run --workspace=backend

echo "Seeding initial users..."
npm run seed:users --workspace=backend

echo "Starting NestJS..."
exec node backend/dist/main.js
