FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/booking-service/package.json ./backend/booking-service/
COPY backend/payment-worker/package.json ./backend/payment-worker/
COPY backend/notification-worker/package.json ./backend/notification-worker/
COPY frontend/package.json ./frontend/

RUN npm ci --no-audit --no-fund --workspace=backend/payment-worker

COPY shared ./shared
COPY backend/payment-worker ./backend/payment-worker

WORKDIR /app/backend/payment-worker

RUN npx prisma generate --schema=src/prisma/schema.prisma
RUN npm run build

CMD ["npm", "run", "start"]
