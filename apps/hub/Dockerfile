# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy package files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/hub/package.json ./apps/hub/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/hub ./apps/hub
COPY tsconfig.json ./

# Build hub app
RUN pnpm --filter @caderno/hub build

# Production stage - serve with nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/apps/hub/dist /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx/hub.conf /etc/nginx/conf.d/default.conf

EXPOSE 8086

CMD ["nginx", "-g", "daemon off;"]
