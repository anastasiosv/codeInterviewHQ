# Use official Node image for building the React app
FROM node:22-alpine AS builder
WORKDIR /app

# Copy config files
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend/ ./frontend/
COPY shared/ ./shared/


# Build
RUN npm run build

# Use Nginx to serve the built files
FROM nginx:alpine
COPY --from=builder /app/dist/public /usr/share/nginx/html
# Copy custom Nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
