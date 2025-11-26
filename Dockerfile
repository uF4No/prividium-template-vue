# Build stage
FROM node:22 AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_GREETING_CONTRACT_ADDRESS
ARG VITE_PROXY_URL
ARG VITE_CHAIN_ID
ARG VITE_CHAIN_NAME
ARG VITE_NATIVE_CURRENCY_SYMBOL

# Set environment variables for build
ENV VITE_GREETING_CONTRACT_ADDRESS=$VITE_GREETING_CONTRACT_ADDRESS
ENV VITE_PROXY_URL=$VITE_PROXY_URL
ENV VITE_CHAIN_ID=$VITE_CHAIN_ID
ENV VITE_CHAIN_NAME=$VITE_CHAIN_NAME
ENV VITE_NATIVE_CURRENCY_SYMBOL=$VITE_NATIVE_CURRENCY_SYMBOL

# Build the application
RUN yarn build

# Production stage
FROM node:22 AS production

# Install http-server globally
RUN npm install -g http-server

# Set working directory
WORKDIR /app

# Copy built files from build stage
COPY --from=build /app/dist ./dist

# Expose port
EXPOSE 4000

# Start http-server with SPA support
CMD ["http-server", "dist", "-p", "5173", "--proxy", "http://localhost:5173?"]
