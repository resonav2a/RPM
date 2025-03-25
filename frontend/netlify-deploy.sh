#!/bin/bash
# Netlify deployment script for RPM

# Set script colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== RPM Netlify Deployment ===${NC}"
echo ""

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo -e "${RED}Netlify CLI is not installed. Installing...${NC}"
    npm install -g netlify-cli
fi

# Build the project using the quick build script
echo -e "${BLUE}Building the project...${NC}"
./quick-build.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed. See errors above.${NC}"
    exit 1
fi

echo -e "${GREEN}Build successful!${NC}"
echo ""

# Deploy to Netlify
echo -e "${BLUE}Deploying to Netlify...${NC}"
echo -e "${YELLOW}Note: On first run, you'll need to follow the prompts to:${NC}"
echo -e "1. Log in to Netlify (if not already logged in)"
echo -e "2. Create or select a site"
echo ""

netlify deploy --prod --dir=dist

if [ $? -ne 0 ]; then
    echo -e "${RED}Deployment failed. See errors above.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=== Deployment complete! ===${NC}"
echo -e "${BLUE}Your site should now be accessible at the URL shown above.${NC}"
echo -e "${YELLOW}Don't forget to set up environment variables in the Netlify dashboard:${NC}"
echo -e "- VITE_SUPABASE_URL"
echo -e "- VITE_SUPABASE_ANON_KEY"
echo ""
echo -e "For more information, see NETLIFY_SETUP.md"