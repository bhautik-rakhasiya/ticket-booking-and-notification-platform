FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/booking-service/package.json ./backend/booking-service/
COPY backend/payment-worker/package.json ./backend/payment-worker/
COPY backend/notification-worker/package.json ./backend/notification-worker/
COPY frontend/package.json ./frontend/

RUN npm ci --no-audit --no-fund --workspace=frontend

COPY shared ./shared
COPY frontend ./frontend

WORKDIR /app/frontend

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
