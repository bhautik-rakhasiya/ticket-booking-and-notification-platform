FROM node:20-alpine

WORKDIR /app

# Copy package configurations and shared workspace files
COPY package.json package-lock.json ./
COPY shared ./shared

# Copy the service workspace code
COPY backend/notification-worker ./backend/notification-worker

# Install dependencies for notification-worker using npm workspaces
RUN npm clean-install --workspace=backend/notification-worker

WORKDIR /app/backend/notification-worker

# Generate Prisma Client classes
RUN npx prisma generate --schema=src/prisma/schema.prisma

CMD ["npm", "run", "dev"]
