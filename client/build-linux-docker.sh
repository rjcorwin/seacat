#!/bin/bash
set -e

echo "Building Seacat for Linux using Docker..."
echo "This will create an AppImage for Steam Deck"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker Desktop and try again."
  exit 1
fi

# Build the app on host (TypeScript + bundling)
echo "📦 Building TypeScript and bundling on host..."
npm run build

# Use Docker only for electron-builder (packaging)
# This avoids architecture issues with esbuild
echo "🐳 Using Docker for Linux packaging..."
docker run --rm -ti \
  --platform linux/amd64 \
  --env ELECTRON_CACHE="/root/.cache/electron" \
  --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
  -v ${PWD}:/project \
  -v ~/.cache/electron:/root/.cache/electron \
  -v ~/.cache/electron-builder:/root/.cache/electron-builder \
  electronuserland/builder:wine \
  /bin/bash -c "cd /project && npm install --ignore-scripts && npx electron-builder --linux --arm64"

echo ""
echo "✅ Build complete!"
echo ""
echo "Output files in: client/release/"
ls -lh release/*.AppImage release/*.tar.gz 2>/dev/null || echo "Check release/ directory for build artifacts"
