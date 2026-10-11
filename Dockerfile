# Hugging Face Spaces Compatible Dockerfile for EcommerceAICardBot
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860 \
    HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create Hugging Face user (UID 1000)
RUN useradd -m -u 1000 user && \
    mkdir -p /app && \
    chown -R user:user /app

# Install python dependencies as user
COPY --chown=user:user requirements.txt .
USER user
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --user -r requirements.txt

# Copy application files
COPY --chown=user:user . .

# Hugging Face Spaces requires port 7860
EXPOSE 7860

# Run app.py which serves port 7860 healthcheck and runs the Telegram bot concurrently
CMD ["python", "app.py"]
