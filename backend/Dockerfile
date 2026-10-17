
FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

# TypeORM CLI, ts-node and build tools are needed
# for the migration, seed and build commands.
RUN npm ci --include=dev

COPY . .

RUN npm run build --workspace=backend
RUN chmod +x backend/docker-entrypoint.sh

ENV NODE_ENV=production

EXPOSE 3001

CMD ["sh", "backend/docker-entrypoint.sh"]
