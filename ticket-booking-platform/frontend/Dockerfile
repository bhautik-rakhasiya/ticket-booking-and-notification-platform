FROM node:20-alpine

WORKDIR /app

# Copy package configurations and shared workspace files
COPY package.json package-lock.json ./
COPY shared ./shared

# Copy the frontend workspace code
COPY frontend ./frontend

# Install dependencies for frontend using npm workspaces
RUN npm clean-install --workspace=frontend

WORKDIR /app/frontend

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
