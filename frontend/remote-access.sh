#!/bin/bash
# Script to make the app accessible on your local network

# Get local IP address
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
else
  # Linux and other Unix-like systems
  IP=$(hostname -I | awk '{print $1}')
fi

# Set script colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== RPM Remote Access ===${NC}"
echo -e "${BLUE}Making your app accessible on your local network${NC}"
echo ""
echo -e "${YELLOW}Your local network address:${NC} http://$IP:3000"
echo ""
echo -e "Share this address with devices on your network"
echo -e "(phones, tablets, other computers) to access the app."
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# Start the Vite dev server
cd "$(dirname "$0")" # Ensure we're in the frontend directory
npm run serve