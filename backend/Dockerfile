# Use official Python image as base
FROM python:3.11-slim AS builder

# Set working directory
WORKDIR /app

# Install build dependencies (if any) and compile wheels
COPY backend/requirements.txt .

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ .

# Runtime stage
FROM python:3.11-slim
WORKDIR /app

# Copy installed packages from builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY --from=builder /app /app

# Expose port for FastAPI (default 8000)
EXPOSE 8000

# Environment variables (can be overridden at runtime)
ENV PYTHONUNBUFFERED=1

# Command to run the app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
