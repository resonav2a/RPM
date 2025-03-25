# Vercel Deployment Guide for RPM

This guide will help you deploy your RPM application to Vercel for remote access.

## Prerequisites

- A Vercel account (sign up at https://vercel.com/signup)
- Node.js and npm installed locally
- Your RPM project code ready for deployment

## Deployment Steps

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy to Vercel

There are two ways to deploy to Vercel:

#### Option 1: Direct Deployment (Recommended for Beginners)

```bash
# Make sure you're in the frontend directory
cd /Users/carlyoukilledit/Documents/Coding/RPM/frontend

# Deploy to Vercel
vercel
```

Follow the prompts to set up your project:
- Set up and deploy: Yes
- Link to existing project: No
- Project name: rpm-project (or choose another name)
- Framework preset: Vite
- Root directory: ./ (default)
- Build command: npm run build
- Output directory: dist
- Development command: npm run dev
- Override settings: No

#### Option 2: Create vercel.json Configuration

Create a `vercel.json` file in your project root:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "framework": "vite",
  "outputDirectory": "dist",
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

Then deploy:

```bash
vercel --prod
```

### 4. Environment Variables

After deployment, set up your environment variables in the Vercel dashboard:

1. Go to your project in the Vercel dashboard
2. Navigate to "Settings" > "Environment Variables"
3. Add the following variables:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
4. Click "Save" and redeploy if needed

### 5. Access Your Site

After deployment completes, your site will be available at:

`https://rpm-project.vercel.app` (or your custom domain)

### Continuous Deployment

By default, Vercel will automatically deploy when you push to your connected Git repository. To set this up:

1. Push your code to GitHub/GitLab/Bitbucket
2. In the Vercel dashboard, go to "Settings" > "Git Integration"
3. Connect your repository
4. Configure build settings if needed

### Custom Domain

To use a custom domain:

1. In the Vercel dashboard, go to your project
2. Click on "Domains"
3. Add your domain and follow the instructions to verify ownership
4. Update DNS settings as instructed

## Troubleshooting

If you encounter build errors:

1. Check the build logs in the Vercel dashboard
2. Make sure your TypeScript code compiles correctly
3. Test your build locally with `npm run build`
4. For React Router issues, check that Vercel's handling of routes is correct

For more assistance, consult [Vercel's documentation](https://vercel.com/docs).