FROM node:20-alpine

# Install dependencies needed for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy dependency files
COPY package.json yarn.lock ./

# Install dependencies with cache mount for faster rebuilds
RUN yarn install --frozen-lockfile --prefer-offline

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN yarn generate

# Copy source code (this layer changes most frequently)
COPY . .

# Build production artifacts
RUN yarn build

# Start application in production mode
CMD ["yarn", "start"]
