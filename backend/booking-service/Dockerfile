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
RUN npm config set fetch-retry-maxtimeout 60000 && npm install --no-audit --no-fund --workspace=backend/booking-service

# Copy the service source code
COPY backend/booking-service ./backend/booking-service

WORKDIR /app/backend/booking-service

# Generate Prisma Client
RUN npx prisma generate --schema=src/prisma/schema.prisma

EXPOSE 4000

CMD ["npm", "run", "dev"]
