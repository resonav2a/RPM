#!/bin/bash
# Build and preview production version

echo "Building production version..."
npm run build

if [ $? -ne 0 ]; then
  echo "Build failed. Please fix the errors and try again."
  exit 1
fi

echo "Starting production preview server..."
echo "You can access the app at http://localhost:4173"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Preview the production build
npm run preview