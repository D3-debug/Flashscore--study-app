
#!/bin/bash

echo "🧹 Cleaning build artifacts..."
npm run clean

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "🔨 Building shared package..."
npm run build --workspace=packages/shared

echo "🔨 Building backend..."
npm run build --workspace=@magajico/backend

echo "🔨 Building frontend..."
cd apps/frontend && npm run build

echo "✅ Build complete!"
