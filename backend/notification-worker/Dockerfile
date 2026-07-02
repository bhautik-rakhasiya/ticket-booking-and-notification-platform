FROM node:20-alpine

WORKDIR /app

# Copy root workspace configurations and shared code
COPY package.json package-lock.json ./
COPY shared ./shared

# Copy all workspace package.json files for NPM workspaces dependency resolution
COPY backend/booking-service/package.json ./backend/booking-service/
COPY backend/payment-worker/package.json ./backend/payment-worker/
COPY backend/notification-worker/package.json ./backend/notification-worker/
COPY frontend/package.json ./frontend/

# Install dependencies using workspaces (with robust retry settings)
RUN npm config set fetch-retry-maxtimeout 60000 && npm install --no-audit --no-fund --workspace=backend/notification-worker

# Copy the service source code
COPY backend/notification-worker ./backend/notification-worker

WORKDIR /app/backend/notification-worker

# Generate Prisma Client
RUN npx prisma generate --schema=src/prisma/schema.prisma

CMD ["npm", "run", "dev"]
