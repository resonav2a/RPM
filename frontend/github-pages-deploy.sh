#!/bin/bash
# GitHub Pages deployment script for RPM

# Set script colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== RPM GitHub Pages Deployment ===${NC}"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Git repository not initialized. Do you want to initialize it? (y/n)${NC}"
    read -r answer
    if [[ "$answer" =~ ^[Yy]$ ]]; then
        git init
        echo -e "${GREEN}Git repository initialized.${NC}"
    else
        echo -e "${RED}Git repository is required for GitHub Pages deployment.${NC}"
        exit 1
    fi
fi

# Check if gh-pages package is installed
if ! npm list --depth=0 | grep -q "gh-pages"; then
    echo -e "${YELLOW}gh-pages package not found. Installing...${NC}"
    npm install --save-dev gh-pages
fi

# Ask for repository details if not set
remote_url=$(git config --get remote.origin.url)
if [ -z "$remote_url" ]; then
    echo -e "${YELLOW}No remote repository set.${NC}"
    echo -e "${BLUE}Enter your GitHub username:${NC}"
    read -r username
    echo -e "${BLUE}Enter your repository name:${NC}"
    read -r repo_name
    
    # Update vite.config.ts with the correct base
    sed -i '' "s|base: '.*'|base: '/$repo_name/'|" vite.config.ts
    
    git remote add origin "https://github.com/$username/$repo_name.git"
    echo -e "${GREEN}Remote repository set to https://github.com/$username/$repo_name.git${NC}"
else
    # Extract repo name from remote URL for base path
    repo_name=$(basename -s .git "$remote_url")
    
    # Update vite.config.ts with the correct base
    if ! grep -q "base:" vite.config.ts; then
        sed -i '' "s|plugins: \[react()\]|plugins: [react()],\n  base: '/$repo_name/'|" vite.config.ts
        echo -e "${GREEN}Updated vite.config.ts with base path: /$repo_name/${NC}"
    fi
fi

# Create the 404.html file if it doesn't exist
if [ ! -f "public/404.html" ]; then
    echo -e "${BLUE}Creating 404.html for React Router support...${NC}"
    mkdir -p public
    cat > public/404.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>RPM</title>
  <script type="text/javascript">
    var pathSegmentsToKeep = 1;
    var l = window.location;
    l.replace(
      l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
      l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/?/' +
      l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
      (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
      l.hash
    );
  </script>
</head>
<body>
</body>
</html>
EOF
    echo -e "${GREEN}Created 404.html in public directory.${NC}"
fi

# Add SPA redirect script to index.html if it doesn't exist
if ! grep -q "window.location.search\[1\] === '/'" index.html; then
    echo -e "${BLUE}Adding SPA redirect script to index.html...${NC}"
    redirect_script='<script type="text/javascript">(function(l) { if (l.search[1] === "/" ) { var decoded = l.search.slice(1).split("&").map(function(s) { return s.replace(/~and~/g, "&") }).join("?"); window.history.replaceState(null, null, l.pathname.slice(0, -1) + decoded + l.hash); } }(window.location))</script>'
    sed -i '' "s|</head>|  $redirect_script\n</head>|" index.html
    echo -e "${GREEN}Added SPA redirect script to index.html.${NC}"
fi

# Build the project
echo -e "${BLUE}Building the project...${NC}"
./quick-build.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed. See errors above.${NC}"
    exit 1
fi

echo -e "${GREEN}Build successful!${NC}"
echo ""

# Deploy to GitHub Pages
echo -e "${BLUE}Deploying to GitHub Pages...${NC}"
npm run deploy:github

if [ $? -ne 0 ]; then
    echo -e "${RED}Deployment failed. See errors above.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=== Deployment complete! ===${NC}"
echo -e "${BLUE}Your site should now be accessible at:${NC}"
username=$(git config --get remote.origin.url | sed -n 's/.*github.com[:/]\([^/]*\).*/\1/p')
echo -e "${YELLOW}https://$username.github.io/$repo_name/${NC}"
echo ""
echo -e "${YELLOW}Note: It may take a few minutes for your site to be available.${NC}"
echo -e "For more information, see GITHUB_PAGES_SETUP.md"