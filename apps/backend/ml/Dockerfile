# MagajiCo: Single Deployment Fastify + FastAPI
FROM python:3.11-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# System dependencies + Node.js 22 LTS
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl build-essential git \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Node dependencies
COPY package*.json tsconfig.json ./
RUN npm install

# Python dependencies
COPY Ml/requirements.txt ./Ml/requirements.txt
RUN pip install --upgrade pip && pip install --no-cache-dir -r ./Ml/requirements.txt

# Copy full source
COPY . .

# Build TypeScript
RUN npm run build

# Expose Fastify port
EXPOSE 3000

# Start Fastify (which calls Python internally)
CMD ["node", "dist/index.js"]