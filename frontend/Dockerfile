 
FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies from the npm workspace root.
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

RUN npm ci --include=dev

# Copy source and workspace configuration.
COPY . .

ARG BACKEND_ORIGIN=http://backend:3001
ENV BACKEND_ORIGIN=${BACKEND_ORIGIN}

# Compile Next.js, including the configured API rewrites.
RUN npm run build --workspace=frontend

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=frontend", "--", "-H", "0.0.0.0", "-p", "3000"]
 
