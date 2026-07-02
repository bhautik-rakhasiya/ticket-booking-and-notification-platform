FROM node:20-alpine

WORKDIR /app

# Copy package configurations and shared workspace files
COPY package.json package-lock.json ./
COPY shared ./shared

# Copy the service workspace code
COPY backend/booking-service ./backend/booking-service

# Install dependencies for booking-service using npm workspaces
RUN npm clean-install --workspace=backend/booking-service

WORKDIR /app/backend/booking-service

# Generate Prisma Client classes
RUN npx prisma generate --schema=src/prisma/schema.prisma

EXPOSE 4000

CMD ["npm", "run", "dev"]
