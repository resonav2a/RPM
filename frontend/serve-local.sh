#!/bin/bash
# Simple script to serve the app on local network

# Get local IP address
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
else
  # Linux and other Unix-like systems
  IP=$(hostname -I | awk '{print $1}')
fi

echo "Starting local server on http://$IP:3000"
echo "Other devices on your network can access the app at this URL"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the Vite dev server
npm run serve