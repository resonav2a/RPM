# GitHub Pages Deployment Guide for RPM

This guide will help you deploy your RPM application to GitHub Pages for remote access.

## Prerequisites

- A GitHub account
- Git installed locally
- Node.js and npm installed locally
- Your RPM project code ready for deployment

## Deployment Steps

### 1. Create a GitHub Repository

1. Go to https://github.com/new
2. Name your repository (e.g., "rpm-project")
3. Make it public or private as needed
4. Click "Create repository"

### 2. Install GitHub Pages Package

```bash
# Make sure you're in the frontend directory
cd /Users/carlyoukilledit/Documents/Coding/RPM/frontend

# Install the gh-pages package
npm install --save-dev gh-pages
```

### 3. Initialize Git Repository

```bash
# Make sure you're in the frontend directory
cd /Users/carlyoukilledit/Documents/Coding/RPM/frontend

# Initialize a Git repository
git init

# Add all files
git add .

# Commit the files
git commit -m "Initial commit"

# Add the remote repository
git remote add origin https://github.com/yourusername/rpm-project.git

# Push to the main branch
git push -u origin main
```

### 4. Update Vite Configuration

The vite.config.ts file should have a base path set for GitHub Pages:

```javascript
export default defineConfig({
  plugins: [react()],
  base: '/rpm-project/', // Should match your repository name
  // ... other settings
})
```

### 5. Build and Deploy

```bash
# Build the project (bypassing TypeScript errors for now)
./quick-build.sh

# Deploy to GitHub Pages
npm run deploy:github
```

### 6. Access Your Site

After deployment completes, your site will be available at:

`https://yourusername.github.io/rpm-project/`

### Configuration for Single-Page Applications

For React Router to work correctly, you'll need to create a 404.html file in the public directory:

```html
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
```

And update your index.html with this script:

```html
<script type="text/javascript">
  (function(l) {
    if (l.search[1] === '/' ) {
      var decoded = l.search.slice(1).split('&').map(function(s) { 
        return s.replace(/~and~/g, '&')
      }).join('?');
      window.history.replaceState(null, null,
          l.pathname.slice(0, -1) + decoded + l.hash
      );
    }
  }(window.location))
</script>
```

## Environment Variables

Remember to update your environment variables for production:

1. Create a `.env.production` file with your Supabase URL and anonymous key
2. Ensure these values are properly set for your production environment

DO NOT commit sensitive keys to your repository. Consider using GitHub Secrets for sensitive information.