# Use a slim Python image
FROM python:3.12-slim

# Prevent Python from writing pyc files to disc
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies required for Postgres and Pillow (Images)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    fontconfig \
    fonts-dejavu \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app/

# Create non-root user for security
RUN adduser --disabled-password --no-create-home appuser
USER appuser

# Default command (overridden by compose, but good fallback)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "core.wsgi:application"]