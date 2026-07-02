FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/booking-service/package.json ./backend/booking-service/
COPY backend/payment-worker/package.json ./backend/payment-worker/
COPY backend/notification-worker/package.json ./backend/notification-worker/
COPY frontend/package.json ./frontend/

RUN npm ci --no-audit --no-fund --workspace=backend/booking-service

COPY shared ./shared
COPY backend/booking-service ./backend/booking-service

WORKDIR /app/backend/booking-service

RUN npx prisma generate --schema=src/prisma/schema.prisma
RUN npm run build

EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push --schema=src/prisma/schema.prisma && npm run start"]
