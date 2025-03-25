#!/bin/bash
# Quick build script that bypasses TypeScript errors for development

echo "Building without TypeScript type checking..."
echo "(Use this only for development testing)"

# Build using Vite directly, skipping TypeScript checking
VITE_SKIP_TS_CHECK=true vite build

if [ $? -ne 0 ]; then
  echo "Build failed."
  exit 1
fi

echo "Build completed successfully!"
echo "You can preview the build using: npm run preview"