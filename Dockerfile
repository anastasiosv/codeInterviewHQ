# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files from root
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Stage 2: Setup Backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (if any needed for python packages)
# RUN apt-get update && apt-get install -y ...

# Copy backend requirements
COPY backend/requirements.txt .

# Install backend dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/app ./app
COPY backend/codeinterviewhq.db .

# Copy built frontend assets from Stage 1
COPY --from=frontend-builder /app/dist/public ./static

# Expose port
EXPOSE 8000

# Run command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
