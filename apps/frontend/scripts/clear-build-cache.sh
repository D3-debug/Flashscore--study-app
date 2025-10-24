
#!/bin/bash

echo "🧹 Clearing Next.js build caches..."

# Clear Next.js cache
rm -rf apps/frontend/.next
rm -rf apps/frontend/node_modules/.cache

# Clear npm cache for workspace
npm cache clean --force

echo "✅ Build caches cleared!"
