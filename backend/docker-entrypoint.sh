
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
    echo "ERROR: PostgreSQL is unavailable."
    exit 1
  fi

  echo "Database not ready; retrying ($attempt/$max_attempts)..."
  attempt=$((attempt + 1))
  sleep 2
done

echo "Running TypeORM migrations..."
npm run migration:run --workspace=backend

echo "Seeding initial users..."
npm run seed:users --workspace=backend

echo "Starting backend..."
exec node backend/dist/main.js
