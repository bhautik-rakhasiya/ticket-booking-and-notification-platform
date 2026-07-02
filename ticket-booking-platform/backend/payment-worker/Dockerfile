FROM node:20-alpine

WORKDIR /app

# Copy package configurations and shared workspace files
COPY package.json package-lock.json ./
COPY shared ./shared

# Copy the service workspace code
COPY backend/payment-worker ./backend/payment-worker

# Install dependencies for payment-worker using npm workspaces
RUN npm clean-install --workspace=backend/payment-worker

WORKDIR /app/backend/payment-worker

# Generate Prisma Client classes
RUN npx prisma generate --schema=src/prisma/schema.prisma

CMD ["npm", "run", "dev"]
