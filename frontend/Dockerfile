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
RUN npm config set fetch-retry-maxtimeout 60000 && npm install --no-audit --no-fund --workspace=frontend

# Copy the frontend source code
COPY frontend ./frontend

WORKDIR /app/frontend

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
