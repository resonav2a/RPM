#!/bin/bash
# Vercel deployment script for RPM

# Set script colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== RPM Vercel Deployment ===${NC}"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI is not installed. Installing...${NC}"
    npm install -g vercel
fi

# Check if vercel.json exists
if [ ! -f "vercel.json" ]; then
    echo -e "${YELLOW}vercel.json not found. Creating...${NC}"
    cat > vercel.json << 'EOF'
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "framework": "vite",
  "outputDirectory": "dist",
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
EOF
    echo -e "${GREEN}Created vercel.json configuration.${NC}"
fi

# Check if user is logged in to Vercel
echo -e "${BLUE}Checking Vercel login status...${NC}"
vercel whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}You are not logged in to Vercel. Please log in:${NC}"
    vercel login
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to log in to Vercel. Deployment aborted.${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}Building and deploying to Vercel...${NC}"
echo -e "${YELLOW}Note: On first run, you'll need to follow the prompts to set up your project.${NC}"
echo ""

# Deploy to Vercel
vercel --prod

if [ $? -ne 0 ]; then
    echo -e "${RED}Deployment failed. See errors above.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=== Deployment complete! ===${NC}"
echo -e "${BLUE}Your site should now be accessible at the URL shown above.${NC}"
echo -e "${YELLOW}Don't forget to set up environment variables in the Vercel dashboard:${NC}"
echo -e "- VITE_SUPABASE_URL"
echo -e "- VITE_SUPABASE_ANON_KEY"
echo ""
echo -e "For more information, see VERCEL_SETUP.md"